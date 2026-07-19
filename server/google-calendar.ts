import { google, calendar_v3 } from "googleapis";
import type { Job } from "@shared/schema";

/**
 * Google Calendar sync (optional).
 *
 * Two-way in the sense that matters for bookings:
 *  - reads busy times from the client's calendar so the site never offers a
 *    slot when they are already committed elsewhere
 *  - writes each booking to that calendar so it shows up on their phone
 *
 * Authentication uses a service account, which suits an unattended server: no
 * OAuth consent screen, no refresh tokens to babysit. The client shares their
 * calendar with the service account's email address.
 *
 * Every entry point is a no-op when unconfigured. A client who never sets this
 * up gets a fully working booking site backed by the in-house availability
 * engine.
 */

export interface BusyPeriod {
  start: Date;
  end: Date;
}

let cachedClient: calendar_v3.Calendar | null = null;
let initialisationFailed = false;

/** True when Google Calendar credentials are present and the feature is on. */
export function isCalendarConfigured(): boolean {
  if (process.env.ENABLE_GOOGLE_CALENDAR !== "true") return false;
  return Boolean(
    process.env.GOOGLE_CALENDAR_ID &&
      (process.env.GOOGLE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE)
  );
}

/**
 * Builds the Calendar client lazily.
 *
 * Returns null rather than throwing: a calendar outage or a malformed key
 * must never stop a customer booking. Failures are logged once.
 */
function getClient(): calendar_v3.Calendar | null {
  if (cachedClient) return cachedClient;
  if (initialisationFailed || !isCalendarConfigured()) return null;

  try {
    const scopes = ["https://www.googleapis.com/auth/calendar"];
    const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

    const auth = raw
      ? new google.auth.GoogleAuth({ credentials: JSON.parse(raw), scopes })
      : new google.auth.GoogleAuth({
          keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE,
          scopes,
        });

    cachedClient = google.calendar({ version: "v3", auth });
    return cachedClient;
  } catch (error) {
    initialisationFailed = true;
    console.error(
      "❌ Google Calendar could not be initialised — check " +
      "GOOGLE_SERVICE_ACCOUNT_JSON is valid JSON. Bookings continue to work " +
      "using the built-in calendar only.",
      error
    );
    return null;
  }
}

function calendarId(): string {
  return process.env.GOOGLE_CALENDAR_ID || "primary";
}

/**
 * Returns periods the client is already busy, for the availability engine to
 * subtract. An empty array means "nothing known" — either not configured or
 * the lookup failed — so slots stay bookable rather than silently vanishing.
 */
export async function getBusyPeriods(from: Date, to: Date): Promise<BusyPeriod[]> {
  const client = getClient();
  if (!client) return [];

  try {
    const response = await client.freebusy.query({
      requestBody: {
        timeMin: from.toISOString(),
        timeMax: to.toISOString(),
        items: [{ id: calendarId() }],
      },
    });

    const busy = response.data.calendars?.[calendarId()]?.busy || [];

    return busy
      .filter((period) => period.start && period.end)
      .map((period) => ({
        start: new Date(period.start!),
        end: new Date(period.end!),
      }));
  } catch (error) {
    console.error("Google Calendar busy-time lookup failed; ignoring:", error);
    return [];
  }
}

/**
 * Writes a booking to the client's calendar.
 * Returns the event id so it can be updated or removed later, or null when
 * unconfigured or the write failed.
 */
export async function createBookingEvent(params: {
  job: Pick<Job, "id" | "jobNumber" | "title" | "scheduledDate" | "scheduledStartTime" | "scheduledEndTime" | "address" | "description">;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  timezone?: string;
}): Promise<string | null> {
  const client = getClient();
  if (!client) return null;

  const { job, customerName, customerEmail, customerPhone } = params;
  if (!job.scheduledDate || !job.scheduledStartTime) return null;

  try {
    const timeZone = params.timezone || process.env.SCHEDULER_TIMEZONE || "Africa/Johannesburg";
    const date = String(job.scheduledDate).split("T")[0];

    const description = [
      customerName ? `Customer: ${customerName}` : null,
      customerPhone ? `Phone: ${customerPhone}` : null,
      customerEmail ? `Email: ${customerEmail}` : null,
      job.description ? `\n${job.description}` : null,
      `\nReference: ${job.jobNumber}`,
    ]
      .filter(Boolean)
      .join("\n");

    const response = await client.events.insert({
      calendarId: calendarId(),
      requestBody: {
        summary: customerName ? `${job.title} — ${customerName}` : job.title,
        description,
        location: job.address || undefined,
        start: { dateTime: `${date}T${job.scheduledStartTime}`, timeZone },
        end: {
          dateTime: `${date}T${job.scheduledEndTime || job.scheduledStartTime}`,
          timeZone,
        },
        // Our own reminders are handled by the scheduler; leave Google's
        // defaults so the owner still gets a pop-up on their phone.
        source: { title: "Online booking" },
      },
    });

    return response.data.id || null;
  } catch (error) {
    // A booking is already confirmed and stored by this point. Failing to
    // mirror it to Google must not fail the customer's request.
    console.error("Google Calendar event creation failed; booking is unaffected:", error);
    return null;
  }
}

/** Updates a previously created event (e.g. after a reschedule). */
export async function updateBookingEvent(
  eventId: string,
  params: { scheduledDate: string; scheduledStartTime: string; scheduledEndTime?: string | null; timezone?: string }
): Promise<boolean> {
  const client = getClient();
  if (!client) return false;

  try {
    const timeZone = params.timezone || process.env.SCHEDULER_TIMEZONE || "Africa/Johannesburg";
    const date = params.scheduledDate.split("T")[0];

    await client.events.patch({
      calendarId: calendarId(),
      eventId,
      requestBody: {
        start: { dateTime: `${date}T${params.scheduledStartTime}`, timeZone },
        end: {
          dateTime: `${date}T${params.scheduledEndTime || params.scheduledStartTime}`,
          timeZone,
        },
      },
    });

    return true;
  } catch (error) {
    console.error("Google Calendar event update failed; ignoring:", error);
    return false;
  }
}

/** Removes an event, e.g. when a booking is cancelled. */
export async function deleteBookingEvent(eventId: string): Promise<boolean> {
  const client = getClient();
  if (!client) return false;

  try {
    await client.events.delete({ calendarId: calendarId(), eventId });
    return true;
  } catch (error) {
    console.error("Google Calendar event deletion failed; ignoring:", error);
    return false;
  }
}

/**
 * Verifies the credentials and calendar access, for the admin UI's
 * "test connection" button. Returns a message safe to show a non-technical
 * owner.
 */
export async function testConnection(): Promise<{ ok: boolean; message: string }> {
  if (process.env.ENABLE_GOOGLE_CALENDAR !== "true") {
    return { ok: false, message: "Google Calendar sync is switched off." };
  }
  if (!isCalendarConfigured()) {
    return {
      ok: false,
      message: "Google Calendar is not configured yet — the service account details are missing.",
    };
  }

  const client = getClient();
  if (!client) {
    return { ok: false, message: "The Google service account details could not be read." };
  }

  try {
    const response = await client.calendars.get({ calendarId: calendarId() });
    return {
      ok: true,
      message: `Connected to "${response.data.summary || calendarId()}".`,
    };
  } catch (error: any) {
    const status = error?.code || error?.response?.status;

    if (status === 404) {
      return {
        ok: false,
        message:
          "That calendar was not found. Check GOOGLE_CALENDAR_ID, and make sure the " +
          "calendar is shared with the service account's email address.",
      };
    }
    if (status === 403) {
      return {
        ok: false,
        message:
          "Access denied. Share the calendar with the service account's email address " +
          "and give it \"Make changes to events\" permission.",
      };
    }
    return { ok: false, message: "Could not reach Google Calendar. Please try again." };
  }
}
