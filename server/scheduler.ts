import cron from "node-cron";
import { db } from "./db";
import { sentReminders } from "@shared/schema";
import { eq } from "drizzle-orm";
import { processEmailQueue } from "./email";

// scheduled-jobs imports claimReminder from this module, so it is loaded
// lazily inside the tick to avoid a circular import at module-eval time.

/**
 * In-process scheduler for automated follow-ups.
 *
 * Replaces Replit Scheduled Deployments, which do not exist off-platform. It
 * runs inside the app process so a single container is all a client needs —
 * no sidecar, no external cron to configure.
 *
 * Set ENABLE_SCHEDULER=false to disable it (useful when running more than one
 * instance and you want only one to send).
 */

let started = false;
let running = false;

/** Cron expressions, overridable per deployment. */
const REMINDERS_SCHEDULE = process.env.SCHEDULER_REMINDERS_CRON || "0 9 * * *"; // 09:00 daily
const EMAIL_QUEUE_SCHEDULE = process.env.SCHEDULER_EMAIL_CRON || "*/5 * * * *"; // every 5 min

/**
 * Records that a reminder was sent, and reports whether it was already sent.
 *
 * The unique constraint on reminder_key is the real guarantee: if a duplicate
 * insert races in, Postgres rejects it and we report "already sent" rather
 * than messaging the customer twice.
 */
export async function claimReminder(params: {
  businessId: string;
  reminderKey: string;
  reminderType: string;
  relatedType?: string;
  relatedId?: string;
  channel?: string;
}): Promise<boolean> {
  try {
    const existing = await db
      .select({ id: sentReminders.id })
      .from(sentReminders)
      .where(eq(sentReminders.reminderKey, params.reminderKey))
      .limit(1);

    if (existing.length > 0) return false;

    await db.insert(sentReminders).values({
      businessId: params.businessId,
      reminderKey: params.reminderKey,
      reminderType: params.reminderType,
      relatedType: params.relatedType ?? null,
      relatedId: params.relatedId ?? null,
      channel: params.channel ?? null,
    });

    return true;
  } catch (error: any) {
    // 23505 = unique_violation: another worker claimed it microseconds ago.
    if (error?.code === "23505") return false;

    // On any other database error, refuse to claim. Not sending a reminder is
    // recoverable; sending duplicates to a customer is not.
    console.error("Could not record reminder, skipping to avoid a duplicate send:", error);
    return false;
  }
}

/** Runs the reminder sweep, guarding against overlapping runs. */
async function runReminderSweep(): Promise<void> {
  if (running) {
    console.log("⏭️  Previous reminder run is still going; skipping this tick.");
    return;
  }

  running = true;
  try {
    console.log("⏰ Running scheduled reminders...");
    const { runEmailReminders } = await import("./scheduled-jobs");
    await runEmailReminders();
    console.log("✅ Scheduled reminders finished.");
  } catch (error) {
    // Never rethrow: an unhandled rejection here would take the server down.
    //
    // A missing-table error (42P01) means db:push has not been run yet, which
    // is the normal state of a freshly deployed container. Say so plainly
    // instead of dumping a stack trace the operator cannot act on.
    const code = (error as { code?: string })?.code;
    if (code === "42P01") {
      console.warn(
        "⏭️  Skipping reminders: the database schema is not set up yet. " +
        "Run `npm run db:push` to create it."
      );
    } else {
      console.error("❌ Scheduled reminder run failed:", error);
    }
  } finally {
    running = false;
  }
}

async function runEmailQueueSweep(): Promise<void> {
  try {
    const { storage } = await import("./storage");
    const { getCurrentBusinessId } = await import("./current-business");

    const businessId = await getCurrentBusinessId();
    const sent = await processEmailQueue(storage, businessId);

    if (sent > 0) console.log(`📧 Sent ${sent} queued email(s).`);
  } catch (error) {
    // A missing business row (fresh install, not yet seeded) is expected and
    // should not spam the log on every tick.
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("No business row found")) return;

    console.error("❌ Email queue processing failed:", error);
  }
}

/** Starts the scheduler. Safe to call more than once. */
export function startScheduler(): void {
  if (process.env.ENABLE_SCHEDULER === "false") {
    console.log("ℹ️  Scheduler disabled (ENABLE_SCHEDULER=false).");
    return;
  }

  if (started) return;
  started = true;

  if (!cron.validate(REMINDERS_SCHEDULE) || !cron.validate(EMAIL_QUEUE_SCHEDULE)) {
    console.error(
      `❌ Invalid cron expression (reminders="${REMINDERS_SCHEDULE}", ` +
      `email="${EMAIL_QUEUE_SCHEDULE}"). Scheduler not started.`
    );
    return;
  }

  const timezone = process.env.SCHEDULER_TIMEZONE || "Africa/Johannesburg";

  cron.schedule(REMINDERS_SCHEDULE, runReminderSweep, { timezone });
  cron.schedule(EMAIL_QUEUE_SCHEDULE, runEmailQueueSweep, { timezone });

  console.log(
    `⏰ Scheduler started (${timezone}) — reminders "${REMINDERS_SCHEDULE}", ` +
    `email queue "${EMAIL_QUEUE_SCHEDULE}".`
  );
}
