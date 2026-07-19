import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Copy .env.example to .env and point it at your Postgres."
  );
}

/**
 * Standard node-postgres driver, deliberately NOT a serverless/Neon-specific
 * one, so this template runs on any Postgres: Docker, Coolify, a managed
 * instance, or Neon.
 *
 * SSL: managed providers (Neon, Supabase, RDS) require TLS, while a local or
 * Docker Postgres usually has none. We enable it when the URL asks for it, or
 * when the host is clearly remote.
 */
function shouldUseSsl(connectionString: string): boolean {
  if (/sslmode=disable/.test(connectionString)) return false;
  if (/sslmode=(require|verify-ca|verify-full)/.test(connectionString)) return true;

  try {
    const host = new URL(connectionString).hostname;
    const isLocal =
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "::1" ||
      host === "db" ||        // common docker-compose service name
      host === "postgres";
    return !isLocal;
  } catch {
    return false;
  }
}

const connectionString = process.env.DATABASE_URL;

export const pool = new Pool({
  connectionString,
  // rejectUnauthorized:false matches how hosted Postgres providers issue certs.
  ssl: shouldUseSsl(connectionString) ? { rejectUnauthorized: false } : undefined,
});

// A pool-level error handler prevents an idle-client disconnect (common with
// hosted Postgres) from crashing the process with an unhandled 'error' event.
pool.on("error", (err) => {
  console.error("Unexpected Postgres pool error:", err.message);
});

export const db = drizzle(pool, { schema });
