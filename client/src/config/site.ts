/**
 * Central site configuration.
 *
 * This is the ONE place to rebrand the template for a client. Every value is
 * driven by a VITE_* environment variable with a neutral default, so a
 * rebrand means editing .env — never hunting through components.
 *
 * Vite inlines these at BUILD time, so changing .env requires a rebuild.
 *
 * Note the split:
 *  - Values here are build-time chrome: the name on the login screen, SEO
 *    defaults, the brand colour.
 *  - The business's operational details (trading name, address, phone, hours,
 *    prices) live in the database and are edited from Dashboard → Settings,
 *    so the owner can change them without a redeploy.
 */

const env = import.meta.env;

export const siteConfig = {
  /** Business/product name shown in the admin chrome and auth screens. */
  name: env.VITE_SITE_NAME || "Your Business",

  /** Short descriptor used as the default meta description. */
  tagline:
    env.VITE_SITE_TAGLINE ||
    "Book professional services online in minutes.",

  /** Public origin, used for canonical URLs and social cards. */
  url: env.VITE_PUBLIC_BASE_URL || "",

  /** Optional logo path served from /public. Falls back to the name as text. */
  logoUrl: env.VITE_LOGO_URL || "",

  contact: {
    email: env.VITE_CONTACT_EMAIL || "",
    phone: env.VITE_CONTACT_PHONE || "",
  },

  social: {
    facebook: env.VITE_SOCIAL_FACEBOOK || "",
    instagram: env.VITE_SOCIAL_INSTAGRAM || "",
    twitter: env.VITE_SOCIAL_TWITTER || "",
    linkedin: env.VITE_SOCIAL_LINKEDIN || "",
  },

  /** Locale defaults. Override for deployments outside South Africa. */
  locale: {
    currencySymbol: env.VITE_CURRENCY_SYMBOL || "R",
    currencyCode: env.VITE_CURRENCY_CODE || "ZAR",
    countryCode: env.VITE_COUNTRY_CODE || "ZA",
    countryName: env.VITE_COUNTRY_NAME || "South Africa",
  },

  /**
   * How customers book. Must match BOOKING_MODE on the server.
   *   'direct'      pick a service, pick a slot (salon, tutor, physio)
   *   'quote_first' describe the job, get a quote, then book (trades)
   *   'quote_only'  quoting with no calendar booking
   */
  bookingMode: (env.VITE_BOOKING_MODE || "quote_first") as
    | "direct"
    | "quote_first"
    | "quote_only",

  features: {
    invoicing: env.VITE_ENABLE_INVOICING !== "false",
    deposits: env.VITE_ENABLE_DEPOSITS === "true",
    whatsapp: env.VITE_ENABLE_WHATSAPP === "true",
  },
} as const;

export type SiteConfig = typeof siteConfig;
