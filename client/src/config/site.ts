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
    /** Cashflow, lead funnel, aged receivables. Off by default. */
    insights: env.VITE_ENABLE_INSIGHTS === "true",
  },

  /**
   * Public homepage copy.
   *
   * Deliberately config, not database: the look and feel is delivered as part
   * of the product, so the client cannot edit it from the admin. Change these
   * per client in .env, then rebuild.
   *
   * Services shown on the homepage come from the Services section of the
   * admin — those ARE the client's to manage.
   */
  home: {
    heroHeading: env.VITE_HERO_HEADING || "Professional Services You Can Trust",
    heroSubheading:
      env.VITE_HERO_SUBHEADING || "Book online in minutes. Clear pricing, no surprises.",
    heroCtaLabel: env.VITE_HERO_CTA_LABEL || "Get a Quote",
    heroBackgroundImage:
      env.VITE_HERO_BACKGROUND_IMAGE ||
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1920&q=80",

    servicesHeading: env.VITE_SERVICES_HEADING || "What We Do",

    aboutHeading: env.VITE_ABOUT_HEADING || "About Us",
    aboutBody:
      env.VITE_ABOUT_BODY ||
      "We are a small team who care about doing the job properly. Every booking gets the same attention, whether it is a quick visit or a large project.",

    contactHeading: env.VITE_CONTACT_HEADING || "Get In Touch",
    contactBody:
      env.VITE_CONTACT_BODY ||
      "Request a quote online and we will get back to you the same working day.",
  },
} as const;

export type SiteConfig = typeof siteConfig;
