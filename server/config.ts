/**
 * Server-side runtime configuration.
 *
 * Every value here comes from an environment variable so that deploying for a
 * new client is a matter of editing .env — never editing code.
 */

/**
 * The public origin this deployment is reachable at, with no trailing slash.
 *
 * Used to build every outward-facing absolute URL: quote and invoice links in
 * emails, booking confirmations, OAuth callbacks, and the PayFast
 * return/cancel/notify URLs. Getting this wrong sends customers to the wrong
 * host, so it must be set explicitly in production.
 */
export function getPublicBaseUrl(): string {
  const raw = process.env.PUBLIC_BASE_URL?.trim();

  if (raw) return raw.replace(/\/+$/, "");

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "PUBLIC_BASE_URL must be set in production (e.g. https://booking.example.com). " +
      "It is used to build customer-facing links in emails and payment redirects."
    );
  }

  const port = process.env.PORT || "5000";
  return `http://localhost:${port}`;
}

/** True when Google sign-in credentials are present. */
export function isGoogleAuthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

/** True when an outbound email provider is configured. */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.SENDGRID_API_KEY);
}

/** True when the AI quoting provider is configured. */
export function isAiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY);
}

/** True when PayFast credentials are present for the active mode. */
export function isPayfastConfigured(): boolean {
  const sandbox = process.env.PAYFAST_MODE !== "live";
  return sandbox
    ? Boolean(process.env.PAYFAST_SANDBOX_MERCHANT_ID && process.env.PAYFAST_SANDBOX_MERCHANT_KEY)
    : Boolean(process.env.PAYFAST_PROD_MERCHANT_ID && process.env.PAYFAST_PROD_MERCHANT_KEY);
}

/**
 * Feature flags. Each integration degrades gracefully when switched off or
 * left unconfigured, so a client can run a booking-only site with no payment
 * provider, no AI and no WhatsApp.
 */
export const features = {
  /**
   * How customers book:
   *   'direct'      pick a service, pick a slot, done (salon, tutor, physio)
   *   'quote_first' describe the job, get a quote, then book (plumber, electrician)
   *   'quote_only'  quoting with no calendar booking
   */
  bookingMode: (process.env.BOOKING_MODE || "quote_first") as
    | "direct"
    | "quote_first"
    | "quote_only",

  deposits: process.env.ENABLE_DEPOSITS === "true",
  invoicing: process.env.ENABLE_INVOICING !== "false",
  aiQuoting: process.env.ENABLE_AI_QUOTING !== "false" && isAiConfigured(),
  whatsapp: process.env.ENABLE_WHATSAPP === "true",
  googleCalendar: process.env.ENABLE_GOOGLE_CALENDAR === "true",
};
