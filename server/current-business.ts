import { db } from "./db";
import * as schema from "@shared/schema";
import { asc, eq } from "drizzle-orm";

/**
 * Single-business resolution.
 *
 * This template runs one business per deployment. The `businesses` table and
 * the `business_id` columns are kept — they carry the business profile,
 * branding and booking rules, and they keep the admin settings UI working —
 * but there is only ever one row, so every request resolves to the same one.
 *
 * Resolution order:
 *   1. BUSINESS_ID env var, when set (explicit escape hatch)
 *   2. the oldest row in `businesses` (a fresh install has exactly one)
 *
 * The id is cached after the first successful lookup: it cannot change for
 * the lifetime of the process.
 */

let cachedBusinessId: string | null = null;

/** Sentinel accepted by public routes in place of a tenant slug. */
export const CURRENT_BUSINESS_SLUG = "current";

export class NoBusinessConfiguredError extends Error {
  constructor() {
    super(
      "No business row found. Run `npm run db:seed` to create one, or set " +
      "BUSINESS_ID to point at an existing row."
    );
    this.name = "NoBusinessConfiguredError";
  }
}

/**
 * Resolves the id of the one business this deployment serves.
 * Throws NoBusinessConfiguredError if the database has no business row.
 */
export async function getCurrentBusinessId(): Promise<string> {
  if (cachedBusinessId) return cachedBusinessId;

  const fromEnv = process.env.BUSINESS_ID?.trim();
  if (fromEnv) {
    const [row] = await db
      .select({ id: schema.businesses.id })
      .from(schema.businesses)
      .where(eq(schema.businesses.id, fromEnv))
      .limit(1);

    if (!row) {
      throw new Error(
        `BUSINESS_ID is set to "${fromEnv}" but no business with that id exists.`
      );
    }

    cachedBusinessId = row.id;
    return cachedBusinessId;
  }

  const [row] = await db
    .select({ id: schema.businesses.id })
    .from(schema.businesses)
    .orderBy(asc(schema.businesses.createdAt))
    .limit(1);

  if (!row) throw new NoBusinessConfiguredError();

  cachedBusinessId = row.id;
  return cachedBusinessId;
}

/** Loads the full business record for this deployment. */
export async function getCurrentBusiness() {
  const id = await getCurrentBusinessId();
  const [business] = await db
    .select()
    .from(schema.businesses)
    .where(eq(schema.businesses.id, id))
    .limit(1);

  if (!business) throw new NoBusinessConfiguredError();
  return business;
}

/**
 * Resolves a slug from a public URL to a business id.
 *
 * Single-tenant public routes carry no real slug, so anything (including the
 * "current" sentinel) maps to the one business. The parameter is retained so
 * existing public route shapes keep working.
 */
export async function resolveBusinessIdFromSlug(_slug?: string): Promise<string> {
  return getCurrentBusinessId();
}

/** Test/maintenance hook: forget the cached id. */
export function resetCurrentBusinessCache(): void {
  cachedBusinessId = null;
}
