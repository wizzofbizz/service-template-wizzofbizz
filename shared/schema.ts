import { sql } from "drizzle-orm";
import { pgTable, text, varchar, uuid, timestamp, boolean, integer, decimal, pgEnum, date, time, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Industry standardization - matches home page
// Note: Legacy values (Beauty Salon, Garden Services, Aircon Services) are kept for backwards compatibility
// but should be migrated to new values (Other, Landscaping, HVAC)
export const STANDARD_INDUSTRIES = [
  "Plumbing",
  "Electrical",
  "HVAC",
  "Cleaning",
  "Landscaping",
  "Pool Maintenance",
  "Pest Control",
  "Handyman",
  "Painting",
  "Roofing",
  "Construction",
] as const;

// Enums
export const websiteStatusEnum = pgEnum("website_status", ["draft", "published", "suspended"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["trial", "active", "suspended", "cancelled"]);
export const subscriptionTierEnum = pgEnum("subscription_tier", ["basic", "standard", "premium"]);
export const userRoleEnum = pgEnum("user_role", ["owner", "admin", "technician"]);
export const contactTypeEnum = pgEnum("contact_type", ["lead", "customer", "past_customer"]);
export const leadSourceEnum = pgEnum("lead_source", ["website", "referral", "google", "direct", "other"]);
export const leadStatusEnum = pgEnum("lead_status", ["new", "contacted", "quoted", "converted", "lost"]);
export const pricingTypeEnum = pgEnum("pricing_type", ["fixed", "hourly", "per_item", "custom"]);
export const quoteStatusEnum = pgEnum("quote_status", ["draft", "ai_quote", "sent", "viewed", "accepted", "deposit_paid", "declined", "expired", "archived"]);
export const jobStatusEnum = pgEnum("job_status", ["pending", "pending_deposit", "deposit_paid", "scheduled", "in_progress", "completed", "cancelled"]);
export const jobTypeEnum = pgEnum("job_type", ["regular", "quote_visit", "follow_up", "emergency"]);
export const testimonialStatusEnum = pgEnum("testimonial_status", ["pending", "approved", "rejected"]);
export const invoiceStatusEnum = pgEnum("invoice_status", ["draft", "sent", "paid", "overdue", "cancelled"]);
export const invoiceTypeEnum = pgEnum("invoice_type", ["deposit", "final", "standard"]);
export const paymentMethodEnum = pgEnum("payment_method", ["cash", "card", "bank_transfer", "other"]);
export const depositCancellationModeEnum = pgEnum("deposit_cancellation_mode", ["auto", "manual"]);
export const bookingModeEnum = pgEnum("booking_mode", ["quote_first", "direct", "quote_only"]);

// Deposit Policies Table (Phase 2 - Deposit System)
export const depositPolicies = pgTable("deposit_policies", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  serviceId: uuid("service_id").references(() => services.id, { onDelete: "cascade" }),
  depositPercentage: decimal("deposit_percentage", { precision: 5, scale: 2 }).notNull(),
  cancellationThresholdHours: integer("cancellation_threshold_hours").notNull(),
  autoReminders: boolean("auto_reminders").default(true),
  autoCancellation: boolean("auto_cancellation").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDepositPolicySchema = createInsertSchema(depositPolicies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertDepositPolicy = z.infer<typeof insertDepositPolicySchema>;
export type DepositPolicy = typeof depositPolicies.$inferSelect;

// Phase 2 Enums
export const attachmentTypeEnum = pgEnum("attachment_type", ["quote", "job", "invoice", "testimonial", "other"]);
export const emailStatusEnum = pgEnum("email_status", ["pending", "sent", "failed", "cancelled"]);
export const emailTemplateTypeEnum = pgEnum("email_template_type", ["quote_sent", "job_reminder", "invoice_sent", "review_request", "welcome", "custom"]);
export const activityActionEnum = pgEnum("activity_action", [
  "create", "update", "delete", "view", "send", "login", "logout",
  // Quote journey
  "quote_requested", "quote_sent", "quote_viewed", "quote_accepted", "quote_declined", "quote_expired",
  // Booking & scheduling
  "booking_requested", "booking_rescheduled", "booking_cancelled", "booking_reminder_sent",
  // Job execution
  "job_started", "job_completed", "job_paused",
  // Invoice & payment
  "invoice_sent", "invoice_viewed", "invoice_paid", "payment_received", "payment_reminder_sent",
  // Communication
  "email_sent", "email_opened", "email_clicked", "whatsapp_sent", "whatsapp_delivered", "whatsapp_read",
  // WhatsApp consent. These are written by server/whatsapp-consent.ts and were
  // missing from the enum, so Postgres rejected every consent write — opt-in
  // and opt-out were silently not being recorded, which matters for
  // marketing-consent compliance.
  "whatsapp_consent_given", "whatsapp_opt_in", "whatsapp_opt_out",
  "call_inbound", "call_outbound", "message_received",
  // Customer feedback
  "review_requested", "review_submitted", "feedback_received"
]);
export const activityEntityEnum = pgEnum("activity_entity", ["business", "user", "contact", "service", "quote", "job", "invoice", "testimonial"]);
export const transactionStatusEnum = pgEnum("transaction_status", ["pending", "completed", "failed", "refunded"]);
export const paymentGatewayEnum = pgEnum("payment_gateway", ["stripe", "payfast", "manual", "other"]);
export const dayOfWeekEnum = pgEnum("day_of_week", ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]);

// WhatsApp Integration Enums
export const whatsappStatusEnum = pgEnum("whatsapp_status", ["pending", "sent", "delivered", "read", "failed"]);
export const whatsappTemplateStatusEnum = pgEnum("whatsapp_template_status", ["pending", "approved", "rejected"]);

// 1. BUSINESSES (Tenants)
export const businesses = pgTable("businesses", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessName: varchar("business_name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  industry: varchar("industry", { length: 100 }),
  ownerName: varchar("owner_name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  addressLine1: text("address_line1"),
  addressLine2: text("address_line2"),
  city: varchar("city", { length: 100 }),
  province: varchar("province", { length: 100 }),
  postalCode: varchar("postal_code", { length: 20 }),
  businessDescription: text("business_description"),
  logoUrl: text("logo_url"),
  primaryColor: varchar("primary_color", { length: 7 }).default("#2196F3"),
  vatNumber: varchar("vat_number", { length: 50 }),
  vatRate: decimal("vat_rate", { precision: 5, scale: 2 }).default("15.00"),
  facebookUrl: text("facebook_url"),
  instagramUrl: text("instagram_url"),
  whatsappNumber: varchar("whatsapp_number", { length: 50 }),
  websiteUrl: text("website_url"),
  websiteStatus: websiteStatusEnum("website_status").default("draft"),
  subscriptionStatus: subscriptionStatusEnum("subscription_status").default("trial"),
  subscriptionTier: subscriptionTierEnum("subscription_tier").default("basic"),
  quoteNumberFormat: varchar("quote_number_format", { length: 50 }).default("QT-YYYY-####"),
  invoiceNumberFormat: varchar("invoice_number_format", { length: 50 }).default("INV-YYYY-####"),
  jobNumberFormat: varchar("job_number_format", { length: 50 }).default("JOB-YYYY-####"),
  defaultPaymentDueDays: integer("default_payment_due_days").default(30),
  paymentReminderDays: jsonb("payment_reminder_days").$type<number[]>().default([3, 7, 14]),
  quoteVisitDurationMinutes: integer("quote_visit_duration_minutes").default(60),
  bufferBetweenVisitsMinutes: integer("buffer_between_visits_minutes").default(15),
  bookingWindowDays: integer("booking_window_days").default(14),
  minimumNoticeHours: integer("minimum_notice_hours").default(24),
  timeSlotIntervalMinutes: integer("time_slot_interval_minutes").default(15),
  senderEmail: varchar("sender_email", { length: 255 }),
  senderName: varchar("sender_name", { length: 255 }),
  senderEmailVerified: boolean("sender_email_verified").default(false),
  businessWhatsapp: varchar("business_whatsapp", { length: 50 }),
  whatsappEnabled: boolean("whatsapp_enabled").default(false),
  quoteFollowupDays: jsonb("quote_followup_days").$type<number[]>().default([3, 7, 14]),
  // WhatsApp Integration Fields (Phase Day 1)
  whatsappProvider: varchar("whatsapp_provider", { length: 50 }).default("twilio"),
  whatsappProviderConfig: jsonb("whatsapp_provider_config"),
  whatsappWasenderApiKey: varchar("whatsapp_wasender_api_key", { length: 255 }),
  whatsappMonthlyLimit: integer("whatsapp_monthly_limit").default(1000),
  whatsappCurrentUsage: integer("whatsapp_current_usage").default(0),
  whatsappUsageResetDate: date("whatsapp_usage_reset_date"),
  whatsappLimitAlertSent: boolean("whatsapp_limit_alert_sent").default(false),
  whatsappOverageAllowed: boolean("whatsapp_overage_allowed").default(false),
  jobReminderDays: jsonb("job_reminder_days").$type<number[]>().default([1, 3, 7]),
  depositCancellationMode: depositCancellationModeEnum("deposit_cancellation_mode").default("manual"),
  depositCancellationThresholdHours: integer("deposit_cancellation_threshold_hours").default(24),
  depositReminderHours: jsonb("deposit_reminder_hours").$type<number[]>().default([48, 24, 12]),
  requireDepositByDefault: boolean("require_deposit_by_default").default(false),
  defaultDepositPercentage: decimal("default_deposit_percentage", { precision: 5, scale: 2 }).default("30.00"),

  // How customers book, set by the owner in Settings -> Booking:
  //   quote_first  describe the job -> quote -> accept -> book (trades)
  //   direct       pick a service -> pick a slot (salon, tutor, physio)
  //   quote_only   request a quote, no online booking
  bookingMode: bookingModeEnum("booking_mode").default("quote_first"),

  // Online payments (PayFast).
  // The owner switches this on from Dashboard -> Settings -> Payments; the
  // merchant credentials still come from the server environment, so the admin
  // UI never handles secrets. Payments only go live when BOTH are true:
  // this toggle is on AND the server has credentials configured.
  onlinePaymentsEnabled: boolean("online_payments_enabled").default(false),
  // Which payments customers may make online.
  acceptInvoicePayments: boolean("accept_invoice_payments").default(true),
  acceptDepositPayments: boolean("accept_deposit_payments").default(true),
  addressLatitude: decimal("address_latitude", { precision: 10, scale: 8 }),
  addressLongitude: decimal("address_longitude", { precision: 11, scale: 8 }),
  
  // Onboarding tracking
  onboardingStep: integer("onboarding_step").default(0),
  onboardingComplete: boolean("onboarding_complete").default(false),
  
  // Structured Operating Hours (matches GBP format - primary format for Google Business Profile sync)
  businessRegularHours: jsonb("business_regular_hours").$type<{
    monday?: { open: string; close: string; closed?: boolean };
    tuesday?: { open: string; close: string; closed?: boolean };
    wednesday?: { open: string; close: string; closed?: boolean };
    thursday?: { open: string; close: string; closed?: boolean };
    friday?: { open: string; close: string; closed?: boolean };
    saturday?: { open: string; close: string; closed?: boolean };
    sunday?: { open: string; close: string; closed?: boolean };
  }>().default({
    monday: { open: "09:00", close: "17:00", closed: false },
    tuesday: { open: "09:00", close: "17:00", closed: false },
    wednesday: { open: "09:00", close: "17:00", closed: false },
    thursday: { open: "09:00", close: "17:00", closed: false },
    friday: { open: "09:00", close: "17:00", closed: false },
    saturday: { open: "09:00", close: "17:00", closed: true },
    sunday: { open: "09:00", close: "17:00", closed: true },
  }),
  
  // Special Hours (holidays, exceptions, emergencies)
  businessSpecialHours: jsonb("business_special_hours").$type<Array<{
    startDate: string;
    endDate: string;
    openTime?: string;
    closeTime?: string;
    reason?: string;
    closed?: boolean;
  }>>().default([]),
  businessOpeningDate: date("business_opening_date"),
  
  // Calendar Hours (DEPRECATED: use businessRegularHours instead - kept for backward compatibility with calendar booking system)
  calendarHours: jsonb("calendar_hours").default({
    monday: { start: "09:00", end: "17:00" },
    tuesday: { start: "09:00", end: "17:00" },
    wednesday: { start: "09:00", end: "17:00" },
    thursday: { start: "09:00", end: "17:00" },
    friday: { start: "09:00", end: "17:00" },
    saturday: null,
    sunday: null
  }),
  
  // Operating Hours (DEPRECATED: use businessRegularHours instead - kept for backward compatibility with existing forms)
  operatingHours: text("operating_hours"),
  
  // Additional Social URLs
  twitterUrl: text("twitter_url"),
  linkedInUrl: text("linked_in_url"),
  youtubeUrl: text("youtube_url"),
  tikTokUrl: text("tik_tok_url"),
  
  // Business Attributes for GBP
  businessAttributes: jsonb("business_attributes").$type<Record<string, boolean>>().default({}),
  primaryServiceId: uuid("primary_service_id"),
  secondaryServiceIds: jsonb("secondary_service_ids").$type<string[]>().default([]),
  
  // Office Visit & Status
  officeVisitPolicy: varchar("office_visit_policy", { length: 50 }), // "ALLOW", "BY_APPOINTMENT", "NOT_ALLOWED"
  businessStatus: varchar("business_status", { length: 50 }).default("OPEN"), // "OPEN", "CLOSED_TEMPORARILY", "CLOSED_PERMANENTLY"
  temporaryClosureStartDate: date("temporary_closure_start_date"),
  temporaryClosureEndDate: date("temporary_closure_end_date"),
  
  // Google Business Profile Review URL
  gbpReviewUrl: text("gbp_review_url"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBusinessSchema = createInsertSchema(businesses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  businessName: z.string().min(1, "Business name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(10, "Phone number required"),
  city: z.string().min(1, "City required"),
  province: z.string().min(1, "Province required"),
  postalCode: z.string().min(4, "Postal code required"),
  businessDescription: z.string().min(10, "Description required").max(500, "Description too long"),
  operatingHours: z.string().min(1, "Operating hours required").max(200, "Operating hours too long"),
  facebookUrl: z.string().url("Invalid Facebook URL").optional().or(z.literal("")),
  instagramUrl: z.string().url("Invalid Instagram URL").optional().or(z.literal("")),
  whatsappNumber: z.string().optional(),
  websiteUrl: z.string().url("Invalid website URL").optional().or(z.literal("")),
  gbpReviewUrl: z.string()
    .url("Invalid review URL")
    .max(500, "Review URL too long")
    .refine(
      (url) => !url || url.includes("g.page") || url.includes("google.com"),
      "Must be a valid Google review link (should contain g.page or google.com)"
    )
    .optional()
    .or(z.literal("")),
  quoteNumberFormat: z.string().min(1, "Quote number format is required"),
  invoiceNumberFormat: z.string().min(1, "Invoice number format is required"),
  jobNumberFormat: z.string().min(1, "Job number format is required"),
});
export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type Business = typeof businesses.$inferSelect;

// SESSION STORAGE (express-session, backed by connect-pg-simple)
export const sessions = pgTable("sessions", {
  sid: varchar("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

// 2. USERS (email + password, with optional Google OAuth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`), // User id (uuid)
  businessId: uuid("business_id").references(() => businesses.id, { onDelete: "cascade" }), // Nullable for onboarding flow
  email: varchar("email", { length: 255 }).unique(), // Can be null (some login methods don't have email)
  passwordHash: text("password_hash"), // For email/password auth (null for OAuth users)
  emailVerified: boolean("email_verified").default(false),
  emailVerificationToken: varchar("email_verification_token", { length: 255 }),
  emailVerificationExpiresAt: timestamp("email_verification_expires_at"),
  passwordResetToken: varchar("password_reset_token", { length: 255 }),
  passwordResetExpiresAt: timestamp("password_reset_expires_at"),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  profileImageUrl: text("profile_image_url"),
  role: userRoleEnum("role").default("owner"),
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Upsert schema used by the Google OAuth sign-in flow
export const upsertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
}).required({ id: true }); // id is required for upsert
export type UpsertUser = z.infer<typeof upsertUserSchema>;

export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// 3. CONTACTS (Unified customer/lead table)
export const contacts = pgTable("contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  contactType: contactTypeEnum("contact_type").default("lead"),
  leadSource: leadSourceEnum("lead_source").default("website"),
  leadStatus: leadStatusEnum("lead_status").default("new"),
  notes: text("notes"),
  // Phase 19A: Communication preferences
  preferredChannel: varchar("preferred_channel", { length: 20 }).default("email"),
  whatsappOptIn: boolean("whatsapp_opt_in").default(false),
  // WhatsApp Integration Fields (Phase Day 1)
  whatsappOptInDate: timestamp("whatsapp_opt_in_date"),
  whatsappOptOutDate: timestamp("whatsapp_opt_out_date"),
  addressLatitude: decimal("address_latitude", { precision: 10, scale: 8 }),
  addressLongitude: decimal("address_longitude", { precision: 11, scale: 8 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;

// Image Analysis Configuration Type
export interface ImageAnalysisConfig {
  enabled: boolean;
  requiredPhotos: string[];
  analysisHints?: string;
}

// 4. SERVICES (Service catalog per business)
export const services = pgTable("services", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  serviceName: varchar("service_name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  pricingType: pricingTypeEnum("pricing_type").default("fixed"),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }),
  durationMinutes: integer("duration_minutes"),
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(0),
  pricingFormula: text("pricing_formula"),
  aiGuidancePrompt: text("ai_guidance_prompt"),
  ruleConfig: jsonb("rule_config").default({}),
  serviceQuestions: jsonb("service_questions").default([]),
  requiresSiteVisit: boolean("requires_site_visit").default(true),
  imageAnalysisConfig: jsonb("image_analysis_config").$type<ImageAnalysisConfig>().default({
    enabled: false,
    requiredPhotos: [],
    analysisHints: "",
  }),
  materialCostConfig: jsonb("material_cost_config").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;

// 5. QUOTES (Estimates sent to contacts)
export const quotes = pgTable("quotes", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  contactId: uuid("contact_id").notNull().references(() => contacts.id, { onDelete: "cascade" }),
  quoteNumber: varchar("quote_number", { length: 50 }).notNull().unique(),
  title: varchar("title", { length: 255 }),
  status: quoteStatusEnum("status").default("draft"),
  validUntil: date("valid_until"),
  sentAt: timestamp("sent_at"),
  viewedAt: timestamp("viewed_at"),
  acceptedAt: timestamp("accepted_at"),
  declinedAt: timestamp("declined_at"),
  declineReason: text("decline_reason"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  locationAddress: text("location_address"),
  locationLatitude: decimal("location_latitude", { precision: 10, scale: 8 }),
  locationLongitude: decimal("location_longitude", { precision: 11, scale: 8 }),
  serviceLocationType: varchar("service_location_type", { length: 20 }).default("customer"),
  createdBy: varchar("created_by").references(() => users.id),
  publicToken: text("public_token").unique(),
  latestVersionId: uuid("latest_version_id"),
  requiresDeposit: boolean("requires_deposit").default(false),
  depositAmount: decimal("deposit_amount", { precision: 10, scale: 2 }),
  depositPercentage: decimal("deposit_percentage", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertQuoteSchema = createInsertSchema(quotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  sentAt: true,
  viewedAt: true,
  acceptedAt: true,
  declinedAt: true,
});
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type Quote = typeof quotes.$inferSelect;

// 6. QUOTE_ITEMS (Line items for quotes)
export const quoteItems = pgTable("quote_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  quoteId: uuid("quote_id").notNull().references(() => quotes.id, { onDelete: "cascade" }),
  serviceId: uuid("service_id").references(() => services.id),
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).default("1"),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  lineTotal: decimal("line_total", { precision: 10, scale: 2 }).notNull(),
  displayOrder: integer("display_order").default(0),
});

export const insertQuoteItemSchema = createInsertSchema(quoteItems).omit({
  id: true,
});
export type InsertQuoteItem = z.infer<typeof insertQuoteItemSchema>;
export type QuoteItem = typeof quoteItems.$inferSelect;

// 7. JOBS (Scheduled work/bookings)
export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  contactId: uuid("contact_id").notNull().references(() => contacts.id, { onDelete: "cascade" }),
  quoteId: uuid("quote_id").references(() => quotes.id),
  assignedTo: varchar("assigned_to").references(() => users.id),
  jobNumber: varchar("job_number", { length: 50 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  serviceType: varchar("service_type", { length: 50 }),
  status: jobStatusEnum("status").default("scheduled"),
  scheduledDate: date("scheduled_date"),
  scheduledStartTime: time("scheduled_start_time"),
  scheduledEndTime: time("scheduled_end_time"),
  actualStartTime: timestamp("actual_start_time"),
  actualEndTime: timestamp("actual_end_time"),
  locationAddress: text("location_address"),
  internalNotes: text("internal_notes"),
  cancellationReason: text("cancellation_reason"),
  jobType: jobTypeEnum("job_type").default("regular"),
  relatedQuoteVersionId: uuid("related_quote_version_id").references(() => quoteVersions.id),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  // Phase 19C: Booking fields
  isQuoteVisit: boolean("is_quote_visit").default(false),
  relatedQuoteId: uuid("related_quote_id").references(() => quotes.id, { onDelete: "set null" }),
  customerName: varchar("customer_name", { length: 255 }),
  customerEmail: varchar("customer_email", { length: 255 }),
  customerPhone: varchar("customer_phone", { length: 50 }),
  depositPaid: boolean("deposit_paid").default(false),
  depositPaidAt: timestamp("deposit_paid_at"),
  // Typed explicitly to break the jobs <-> invoices reference cycle.
  // Without the annotation TypeScript cannot infer either table (TS7022) and
  // both degrade to `any`, which cascaded into ~150 downstream errors.
  depositInvoiceId: uuid("deposit_invoice_id").references((): any => invoices.id),
  depositDeadline: timestamp("deposit_deadline"),
  depositRemindersSent: integer("deposit_reminders_sent").default(0),
  lastDepositReminderAt: timestamp("last_deposit_reminder_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  actualStartTime: true,
  actualEndTime: true,
}).extend({
  serviceType: z.string().optional(),
});
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;

// 7B. JOB_ITEMS (Line items for jobs - copied from quotes)
export const jobItems = pgTable("job_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobId: uuid("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  serviceId: uuid("service_id").references(() => services.id),
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).default("1"),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  lineTotal: decimal("line_total", { precision: 10, scale: 2 }).notNull(),
  displayOrder: integer("display_order").default(0),
});

export const insertJobItemSchema = createInsertSchema(jobItems).omit({
  id: true,
});
export type InsertJobItem = z.infer<typeof insertJobItemSchema>;
export type JobItem = typeof jobItems.$inferSelect;

// 8. TESTIMONIALS (Reviews & feedback)
export const testimonials = pgTable("testimonials", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  contactId: uuid("contact_id").references(() => contacts.id),
  authorName: varchar("author_name", { length: 255 }).notNull(),
  authorTitle: varchar("author_title", { length: 100 }),
  rating: integer("rating").notNull(),
  testimonialText: text("testimonial_text").notNull(),
  avatarUrl: text("avatar_url"),
  status: testimonialStatusEnum("status").default("pending"),
  isFeatured: boolean("is_featured").default(false),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
});

export const insertTestimonialSchema = createInsertSchema(testimonials).omit({
  id: true,
  createdAt: true,
  approvedAt: true,
});
export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;
export type Testimonial = typeof testimonials.$inferSelect;

// 9. CALENDAR_SETTINGS (Availability config)
export const calendarSettings = pgTable("calendar_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }).unique(),
  googleCalendarId: text("google_calendar_id"),
  workingDays: jsonb("working_days"),
  bookingBufferMinutes: integer("booking_buffer_minutes").default(30),
  maxBookingsPerDay: integer("max_bookings_per_day").default(8),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCalendarSettingsSchema = createInsertSchema(calendarSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCalendarSettings = z.infer<typeof insertCalendarSettingsSchema>;
export type CalendarSettings = typeof calendarSettings.$inferSelect;

// 10. INVOICES (Payment tracking - Phase 2 ready)
export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  jobId: uuid("job_id").references(() => jobs.id),
  contactId: uuid("contact_id").notNull().references(() => contacts.id, { onDelete: "cascade" }),
  quoteId: uuid("quote_id").references(() => quotes.id),
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),
  title: varchar("title", { length: 255 }),
  invoiceType: invoiceTypeEnum("invoice_type").default("standard"),
  status: invoiceStatusEnum("status").default("draft"),
  dueDate: date("due_date"),
  paidAt: timestamp("paid_at"),
  paymentMethod: paymentMethodEnum("payment_method"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  depositAmount: decimal("deposit_amount", { precision: 10, scale: 2 }),
  balanceDue: decimal("balance_due", { precision: 10, scale: 2 }),
  // Self-reference: annotated for the same reason as jobs.depositInvoiceId.
  linkedDepositInvoiceId: uuid("linked_deposit_invoice_id").references((): any => invoices.id),
  notes: text("notes"),
  publicToken: text("public_token").unique(),
  remindersSent: integer("reminders_sent").default(0),
  lastReminderSentAt: timestamp("last_reminder_sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  paidAt: true,
});
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

// 10B. INVOICE_ITEMS (Line items for invoices)
export const invoiceItems = pgTable("invoice_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
  serviceId: uuid("service_id").references(() => services.id),
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).default("1"),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  lineTotal: decimal("line_total", { precision: 10, scale: 2 }).notNull(),
  displayOrder: integer("display_order").default(0),
});

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({
  id: true,
});
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;
export type InvoiceItem = typeof invoiceItems.$inferSelect;

// 11. ATTACHMENTS (File uploads - polymorphic)
export const attachments = pgTable("attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  relatedType: attachmentTypeEnum("related_type").notNull(),
  relatedId: uuid("related_id").notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type", { length: 100 }),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAttachmentSchema = createInsertSchema(attachments).omit({
  id: true,
  createdAt: true,
});
export type InsertAttachment = z.infer<typeof insertAttachmentSchema>;
export type Attachment = typeof attachments.$inferSelect;

// 12. EMAIL_QUEUE (Outbound email tracking)
export const emailQueue = pgTable("email_queue", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  toEmail: varchar("to_email", { length: 255 }).notNull(),
  toName: varchar("to_name", { length: 255 }),
  subject: varchar("subject", { length: 500 }).notNull(),
  bodyHtml: text("body_html"),
  bodyText: text("body_text"),
  status: emailStatusEnum("status").default("pending"),
  templateId: uuid("template_id"),
  relatedType: attachmentTypeEnum("related_type"),
  relatedId: uuid("related_id"),
  scheduledFor: timestamp("scheduled_for"),
  sentAt: timestamp("sent_at"),
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEmailQueueSchema = createInsertSchema(emailQueue).omit({
  id: true,
  createdAt: true,
  sentAt: true,
});
export type InsertEmailQueue = z.infer<typeof insertEmailQueueSchema>;
export type EmailQueue = typeof emailQueue.$inferSelect;

// 13. EMAIL_TEMPLATES (Reusable templates)
export const emailTemplates = pgTable("email_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  bodyHtml: text("body_html").notNull(),
  bodyText: text("body_text"),
  templateType: emailTemplateTypeEnum("template_type").notNull(),
  variables: jsonb("variables"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type EmailTemplate = typeof emailTemplates.$inferSelect;

// 14. ACTIVITY_LOG (Audit trail)
/**
 * Record of automated reminders already sent.
 *
 * This replaces an in-memory Set, which lost its contents on every restart
 * (so a redeploy mid-day re-sent reminders customers had already received)
 * and could not be shared between instances. The unique reminderKey makes a
 * duplicate send impossible even if two workers run the same job at once.
 */
export const sentReminders = pgTable("sent_reminders", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  /** Stable identity of one reminder, e.g. "quote-<id>-followup-2026-07-19". */
  reminderKey: varchar("reminder_key", { length: 255 }).notNull().unique(),
  reminderType: varchar("reminder_type", { length: 50 }).notNull(),
  relatedType: varchar("related_type", { length: 50 }),
  relatedId: uuid("related_id"),
  channel: varchar("channel", { length: 20 }),
  sentAt: timestamp("sent_at").defaultNow(),
}, (table) => ({
  keyIdx: index("sent_reminders_key_idx").on(table.reminderKey),
  businessIdx: index("sent_reminders_business_idx").on(table.businessId),
}));

export const insertSentReminderSchema = createInsertSchema(sentReminders).omit({
  id: true,
  sentAt: true,
});
export type InsertSentReminder = z.infer<typeof insertSentReminderSchema>;
export type SentReminder = typeof sentReminders.$inferSelect;

export const activityLog = pgTable("activity_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id),
  contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),
  action: activityActionEnum("action").notNull(),
  entityType: activityEntityEnum("entity_type").notNull(),
  entityId: uuid("entity_id"),
  changes: jsonb("changes"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertActivityLogSchema = createInsertSchema(activityLog).omit({
  id: true,
  createdAt: true,
});
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLog.$inferSelect;

// 15. PAYMENT_TRANSACTIONS (Detailed payment records)
export const paymentTransactions = pgTable("payment_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  invoiceId: uuid("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
  transactionId: varchar("transaction_id", { length: 255 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("ZAR"),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  status: transactionStatusEnum("status").default("pending"),
  gateway: paymentGatewayEnum("gateway").notNull(),
  gatewayResponse: jsonb("gateway_response"),
  metadata: jsonb("metadata"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPaymentTransactionSchema = createInsertSchema(paymentTransactions).omit({
  id: true,
  createdAt: true,
  processedAt: true,
});
export type InsertPaymentTransaction = z.infer<typeof insertPaymentTransactionSchema>;
export type PaymentTransaction = typeof paymentTransactions.$inferSelect;

// 16. SERVICE_AREAS (Geographic coverage)
export const serviceAreas = pgTable("service_areas", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  areaName: varchar("area_name", { length: 255 }).notNull(),
  postalCodes: text("postal_codes").array(),
  cities: text("cities").array(),
  provinces: text("provinces").array(),
  isActive: boolean("is_active").default(true),
  travelFee: decimal("travel_fee", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertServiceAreaSchema = createInsertSchema(serviceAreas).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertServiceArea = z.infer<typeof insertServiceAreaSchema>;
export type ServiceArea = typeof serviceAreas.$inferSelect;

// 17. BUSINESS_HOURS (Weekly schedule)
export const businessHours = pgTable("business_hours", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  dayOfWeek: dayOfWeekEnum("day_of_week").notNull(),
  startTime: time("start_time"),
  endTime: time("end_time"),
  isClosed: boolean("is_closed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBusinessHoursSchema = createInsertSchema(businessHours).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertBusinessHours = z.infer<typeof insertBusinessHoursSchema>;
export type BusinessHours = typeof businessHours.$inferSelect;

// 18. LANDING_PAGE_CONTENT (Editable landing page sections)
export const landingPageContent = pgTable("landing_page_content", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  section: varchar("section", { length: 100 }).notNull(), // e.g., "hero", "features", "pricing"
  elementKey: varchar("element_key", { length: 100 }).notNull(), // e.g., "headline", "background_image"
  contentType: varchar("content_type", { length: 50 }).notNull(), // "text", "image", "video", "button", "link"
  value: text("value"), // Text content or file path
  altText: text("alt_text"), // For images/videos (SEO + accessibility)
  url: text("url"), // Link destination or media URL
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata"), // Additional data like button styles, video settings
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLandingPageContentSchema = createInsertSchema(landingPageContent).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertLandingPageContent = z.infer<typeof insertLandingPageContentSchema>;
export type LandingPageContent = typeof landingPageContent.$inferSelect;

// Email Action Tokens (for secure email interactions)
export const emailActionTokens = pgTable("email_action_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  entityType: varchar("entity_type", { length: 50 }).notNull(), // 'quote', 'invoice'
  entityId: uuid("entity_id").notNull(),
  action: varchar("action", { length: 50 }).notNull(), // 'accept', 'decline', 'pay'
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEmailActionTokenSchema = createInsertSchema(emailActionTokens).omit({
  id: true,
  createdAt: true,
  usedAt: true,
});
export type InsertEmailActionToken = z.infer<typeof insertEmailActionTokenSchema>;
export type EmailActionToken = typeof emailActionTokens.$inferSelect;

// PHASE 19A: AI QUOTE GENERATION TABLES

// Quote versioning system
export const quoteVersions = pgTable("quote_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  quoteId: uuid("quote_id").notNull().references(() => quotes.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number").notNull(),
  source: varchar("source", { length: 20 }).notNull(), // 'ai', 'manual', 'site_visit'

  // Snapshot data
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  lineItems: jsonb("line_items").notNull(),
  notes: text("notes"),

  // AI-specific fields
  aiExtractedFeatures: jsonb("ai_extracted_features"),
  aiConfidenceScore: decimal("ai_confidence_score", { precision: 3, scale: 2 }),
  aiReasoning: text("ai_reasoning"),

  // Metadata
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertQuoteVersionSchema = createInsertSchema(quoteVersions).omit({
  id: true,
  createdAt: true,
});
export type InsertQuoteVersion = z.infer<typeof insertQuoteVersionSchema>;
export type QuoteVersion = typeof quoteVersions.$inferSelect;

// AI learning events
export const aiQuoteLearningEvents = pgTable("ai_quote_learning_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  quoteId: uuid("quote_id").notNull().references(() => quotes.id, { onDelete: "cascade" }),

  // Version comparison
  aiVersionId: uuid("ai_version_id").references(() => quoteVersions.id),
  finalVersionId: uuid("final_version_id").references(() => quoteVersions.id),

  // Error metrics
  priceDifference: decimal("price_difference", { precision: 10, scale: 2 }),
  priceDifferencePercent: decimal("price_difference_percent", { precision: 5, scale: 2 }),
  featureExtractionErrors: jsonb("feature_extraction_errors"),

  // Improvement tracking
  feedbackCategory: varchar("feedback_category", { length: 50 }),
  correctionsApplied: jsonb("corrections_applied"),

  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAiQuoteLearningEventSchema = createInsertSchema(aiQuoteLearningEvents).omit({
  id: true,
  createdAt: true,
});
export type InsertAiQuoteLearningEvent = z.infer<typeof insertAiQuoteLearningEventSchema>;
export type AiQuoteLearningEvent = typeof aiQuoteLearningEvents.$inferSelect;

// Quote Version Items (Phase 19A)
export const quoteVersionItems = pgTable("quote_version_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  quoteVersionId: uuid("quote_version_id").notNull().references(() => quoteVersions.id, { onDelete: "cascade" }),
  serviceId: uuid("service_id").references(() => services.id),
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).default("1"),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  lineTotal: decimal("line_total", { precision: 10, scale: 2 }).notNull(),
  displayOrder: integer("display_order").default(0),
});

export const insertQuoteVersionItemSchema = createInsertSchema(quoteVersionItems).omit({
  id: true,
});
export type InsertQuoteVersionItem = z.infer<typeof insertQuoteVersionItemSchema>;
export type QuoteVersionItem = typeof quoteVersionItems.$inferSelect;

// WHATSAPP INTEGRATION TABLES (Day 1)

// WhatsApp Queue - Outbound message tracking
export const whatsappQueue = pgTable("whatsapp_queue", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),

  // Message Details
  toNumber: varchar("to_number", { length: 50 }).notNull(),
  templateName: varchar("template_name", { length: 100 }),
  templateParams: jsonb("template_params"),
  messageBody: text("message_body"),
  mediaUrl: text("media_url"),

  // Provider-Agnostic Fields
  providerName: varchar("provider_name", { length: 50 }).default("twilio"),
  providerMessageId: varchar("provider_message_id", { length: 150 }),

  // Status Tracking
  status: whatsappStatusEnum("status").default("pending"),
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0),
  maxRetries: integer("max_retries").default(3),

  // Timestamps
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  readAt: timestamp("read_at"),
  failedAt: timestamp("failed_at"),

  // Cost Tracking
  cost: decimal("cost", { precision: 10, scale: 4 }).default("0.40"),
  usagePeriod: date("usage_period"),

  // Polymorphic Relationship
  relatedType: varchar("related_type", { length: 50 }),
  relatedId: uuid("related_id"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertWhatsappQueueSchema = createInsertSchema(whatsappQueue).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertWhatsappQueue = z.infer<typeof insertWhatsappQueueSchema>;
export type WhatsappQueue = typeof whatsappQueue.$inferSelect;

// WhatsApp Templates - Message templates
export const whatsappTemplates = pgTable("whatsapp_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),

  templateName: varchar("template_name", { length: 100 }).notNull(),
  templateType: varchar("template_type", { length: 50 }).notNull(),

  // Provider-Agnostic Template IDs
  twilioTemplateSid: varchar("twilio_template_sid", { length: 100 }),
  metaTemplateId: varchar("meta_template_id", { length: 100 }),

  contentText: text("content_text").notNull(),
  variables: jsonb("variables"),
  language: varchar("language", { length: 10 }).default("en"),
  category: varchar("category", { length: 50 }).default("utility"),

  // Approval Status
  status: whatsappTemplateStatusEnum("status").default("pending"),
  submittedAt: timestamp("submitted_at"),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertWhatsappTemplateSchema = createInsertSchema(whatsappTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertWhatsappTemplate = z.infer<typeof insertWhatsappTemplateSchema>;
export type WhatsappTemplate = typeof whatsappTemplates.$inferSelect;


// WHATSAPP SESSIONS (WaSender Integration - Phase 1)

// WhatsApp session status enum
export const whatsappSessionStatusEnum = pgEnum("whatsapp_session_status", [
  "disconnected", "connecting", "connected", "expired", "error"
]);

// WhatsApp session health enum
export const whatsappSessionHealthEnum = pgEnum("whatsapp_session_health", [
  "unknown", "healthy", "degraded", "unhealthy"
]);

// WhatsApp Sessions Table
export const whatsappSessions = pgTable("whatsapp_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  
  // WaSender Session Details
  sessionId: varchar("session_id", { length: 100 }).notNull().unique(),
  sessionName: varchar("session_name", { length: 100 }).notNull(),
  sessionToken: text("session_token"),
  
  // Connection Status
  status: varchar("status", { length: 50 }).default("disconnected"),
  qrCode: text("qr_code"),
  qrCodeExpiresAt: timestamp("qr_code_expires_at"),
  
  // WhatsApp Account Info
  whatsappNumber: varchar("whatsapp_number", { length: 50 }),
  whatsappName: varchar("whatsapp_name", { length: 255 }),
  whatsappProfilePictureUrl: text("whatsapp_profile_picture_url"),
  
  // Connection Timestamps
  connectedAt: timestamp("connected_at"),
  disconnectedAt: timestamp("disconnected_at"),
  lastHeartbeatAt: timestamp("last_heartbeat_at"),
  
  // Session Health Monitoring
  healthStatus: varchar("health_status", { length: 50 }).default("unknown"),
  lastHealthCheckAt: timestamp("last_health_check_at"),
  consecutiveFailures: integer("consecutive_failures").default(0),
  
  // Error Tracking
  lastErrorMessage: text("last_error_message"),
  lastErrorAt: timestamp("last_error_at"),
  errorCount: integer("error_count").default(0),
  
  // Usage Statistics
  messagesSentCount: integer("messages_sent_count").default(0),
  lastMessageSentAt: timestamp("last_message_sent_at"),
  
  // Session Configuration
  autoReconnect: boolean("auto_reconnect").default(true),
  webhookUrl: text("webhook_url"),
  
  // Metadata
  deviceInfo: jsonb("device_info"),
  sessionMetadata: jsonb("session_metadata"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  businessSessionNameUnique: index('idx_whatsapp_sessions_business_session').on(table.businessId, table.sessionName),
}));

export const insertWhatsappSessionSchema = createInsertSchema(whatsappSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertWhatsappSession = z.infer<typeof insertWhatsappSessionSchema>;
export type WhatsappSession = typeof whatsappSessions.$inferSelect;


