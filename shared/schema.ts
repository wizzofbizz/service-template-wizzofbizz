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

// Custom domain enums
export const domainTypeEnum = pgEnum('domain_type', ['full', 'quote_subdomain']);
export const domainStatusEnum = pgEnum('domain_status', ['pending', 'verified', 'failed']);
export const verificationMethodEnum = pgEnum('verification_method', ['a_record', 'txt_record']);
export const sslStatusEnum = pgEnum('ssl_status', ['pending', 'issued', 'failed']);

// Blog enums
export const blogPostStatusEnum = pgEnum('blog_post_status', ['draft', 'published', 'scheduled', 'archived']);

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
export const usageServiceTypeEnum = pgEnum("usage_service_type", ["whatsapp", "sms", "ai_credits"]);
export const usageStatusEnum = pgEnum("usage_status", ["active", "exceeded", "suspended"]);

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

// SESSION STORAGE (Required for Replit Auth)
export const sessions = pgTable("sessions", {
  sid: varchar("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

// 2. USERS (Authentication via Replit Auth - supports Google, GitHub, X, Apple, email/password)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`), // Replit user ID (string like '927070657')
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

// Upsert schema for Replit Auth (used by replitAuth.ts)
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
  depositInvoiceId: uuid("deposit_invoice_id").references(() => invoices.id),
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
  linkedDepositInvoiceId: uuid("linked_deposit_invoice_id").references(() => invoices.id),
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

// Usage Tracking - Multi-service usage tracking
export const usageTracking = pgTable("usage_tracking", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),

  // Service Details
  serviceType: usageServiceTypeEnum("service_type").notNull(),
  providerName: varchar("provider_name", { length: 50 }),

  // Period Tracking
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),

  // Usage Metrics
  usageCount: integer("usage_count").default(0),
  usageLimit: integer("usage_limit").notNull(),

  // Cost Tracking
  costPerUnit: decimal("cost_per_unit", { precision: 10, scale: 4 }),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).default("0"),

  status: usageStatusEnum("status").default("active"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUsageTrackingSchema = createInsertSchema(usageTracking).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertUsageTracking = z.infer<typeof insertUsageTrackingSchema>;
export type UsageTracking = typeof usageTracking.$inferSelect;

// Usage Alerts - Threshold alerts
export const usageAlerts = pgTable("usage_alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),

  serviceType: usageServiceTypeEnum("service_type").notNull(),
  thresholdPercentage: integer("threshold_percentage").notNull(),
  alertType: varchar("alert_type", { length: 50 }).notNull(),

  triggeredAt: timestamp("triggered_at"),
  acknowledgedAt: timestamp("acknowledged_at"),
  notificationSent: boolean("notification_sent").default(false),
  notificationMessage: text("notification_message"),

  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUsageAlertSchema = createInsertSchema(usageAlerts).omit({
  id: true,
  createdAt: true,
});
export type InsertUsageAlert = z.infer<typeof insertUsageAlertSchema>;
export type UsageAlert = typeof usageAlerts.$inferSelect;


// ============================================================================
// BLOG SYSTEM TABLES
// ============================================================================

// Blog Categories
export const blogCategories = pgTable("blog_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  metaDescription: text("meta_description"),
  parentCategoryId: uuid("parent_category_id").references(() => blogCategories.id, { onDelete: "set null" }),
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBlogCategorySchema = createInsertSchema(blogCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertBlogCategory = z.infer<typeof insertBlogCategorySchema>;
export type BlogCategory = typeof blogCategories.$inferSelect;

// Blog Posts
export const blogPosts = pgTable("blog_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  keyTakeaways: text("key_takeaways"),
  featuredImageUrl: text("featured_image_url"),
  
  // SEO fields
  metaTitle: varchar("meta_title", { length: 60 }),
  metaDescription: text("meta_description"),
  metaKeywords: text("meta_keywords"),
  canonicalUrl: text("canonical_url"),
  ogImageUrl: text("og_image_url"),
  
  // Author & Category
  authorId: varchar("author_id").references(() => users.id),
  authorName: varchar("author_name", { length: 255 }),
  categoryId: uuid("category_id").references(() => blogCategories.id),
  
  // Status & Publishing
  status: varchar("status", { length: 20 }).default("draft"),
  publishedAt: timestamp("published_at"),
  scheduledPublishAt: timestamp("scheduled_publish_at"),
  
  // Reading & Engagement
  readingTimeMinutes: integer("reading_time_minutes"),
  viewCount: integer("view_count").default(0),
  shareCount: integer("share_count").default(0),
  
  // Internal linking
  relatedPostIds: uuid("related_post_ids").array(),
  relatedProductPages: text("related_product_pages").array(),
  
  // Structured data
  structuredData: jsonb("structured_data"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  slugIdx: index("idx_blog_posts_slug").on(table.slug),
  categoryIdx: index("idx_blog_posts_category").on(table.categoryId),
  statusIdx: index("idx_blog_posts_status").on(table.status),
  publishedAtIdx: index("idx_blog_posts_published_at").on(table.publishedAt),
}));

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
  shareCount: true,
});
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;

// Blog Tags
export const blogTags = pgTable("blog_tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBlogTagSchema = createInsertSchema(blogTags).omit({
  id: true,
  createdAt: true,
});
export type InsertBlogTag = z.infer<typeof insertBlogTagSchema>;
export type BlogTag = typeof blogTags.$inferSelect;

// Blog Post Tags Junction
export const blogPostTags = pgTable("blog_post_tags", {
  blogPostId: uuid("blog_post_id").notNull().references(() => blogPosts.id, { onDelete: "cascade" }),
  blogTagId: uuid("blog_tag_id").notNull().references(() => blogTags.id, { onDelete: "cascade" }),
});

// CUSTOM DOMAINS
// Custom Domains Table - uses enums defined at top of file
export const customDomains = pgTable("custom_domains", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  domainType: domainTypeEnum("domain_type").notNull(),
  domain: varchar("domain", { length: 255 }).notNull().unique(),
  status: domainStatusEnum("status").notNull().default("pending"),
  verificationToken: varchar("verification_token", { length: 64 }).notNull(),
  verificationMethod: verificationMethodEnum("verification_method"),
  lastVerifiedAt: timestamp("last_verified_at"),
  sslStatus: sslStatusEnum("ssl_status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  domainIdx: index('idx_custom_domains_domain').on(table.domain),
  businessIdx: index('idx_custom_domains_business_id').on(table.businessId),
  statusIdx: index('idx_custom_domains_status').on(table.status),
}));

export const insertCustomDomainSchema = createInsertSchema(customDomains).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCustomDomain = z.infer<typeof insertCustomDomainSchema>;
export type CustomDomain = typeof customDomains.$inferSelect;

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

// SUBSCRIPTION SYSTEM

// Subscription Plans Table
export const subscriptionPlans = pgTable("subscription_plans", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  monthlyPrice: text("monthly_price").notNull(),
  annualPrice: text("annual_price"),
  trialDays: integer("trial_days").default(14),
  features: jsonb("features").notNull(),
  limits: jsonb("limits").notNull(),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;

// User Subscriptions Table
export const userSubscriptions = pgTable("user_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  planId: text("plan_id").notNull().references(() => subscriptionPlans.id),
  payfastSubscriptionId: text("payfast_subscription_id"),
  payfastPaymentId: text("payfast_payment_id"),
  payfastToken: text("payfast_token"),
  amount: text("amount").notNull(),
  originalAmount: text("original_amount"),
  discountAmount: text("discount_amount").default("0"),
  currency: text("currency").default("ZAR"),
  billingFrequency: text("billing_frequency").notNull(),
  status: text("status").default("trialing"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  nextBillingDate: timestamp("next_billing_date"),
  discountCodeId: uuid("discount_code_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertUserSubscription = z.infer<typeof insertUserSubscriptionSchema>;
export type UserSubscription = typeof userSubscriptions.$inferSelect;

// Payment History Table
export const paymentHistory = pgTable("payment_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  subscriptionId: uuid("subscription_id").references(() => userSubscriptions.id),
  payfastPaymentId: text("payfast_payment_id"),
  payfastSubscriptionId: text("payfast_subscription_id"),
  amount: text("amount").notNull(),
  originalAmount: text("original_amount"),
  discountAmount: text("discount_amount"),
  currency: text("currency").default("ZAR"),
  paymentMethod: text("payment_method"),
  status: text("status").notNull(),
  paymentType: text("payment_type"),
  transactionDate: timestamp("transaction_date").defaultNow(),
  payfastData: jsonb("payfast_data"),
  discountCodeId: uuid("discount_code_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPaymentHistorySchema = createInsertSchema(paymentHistory).omit({
  id: true,
  createdAt: true,
});
export type InsertPaymentHistory = z.infer<typeof insertPaymentHistorySchema>;
export type PaymentHistory = typeof paymentHistory.$inferSelect;

// Discount Codes Table
export const discountCodes = pgTable("discount_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  description: text("description"),
  discountType: text("discount_type").notNull(),
  discountValue: text("discount_value").notNull(),
  validFrom: timestamp("valid_from").notNull(),
  validUntil: timestamp("valid_until").notNull(),
  usageLimit: integer("usage_limit"),
  currentUsage: integer("current_usage").default(0),
  minAmount: text("min_amount"),
  applicablePlans: text("applicable_plans").array().notNull(),
  firstTimeUsersOnly: boolean("first_time_users_only").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDiscountCodeSchema = createInsertSchema(discountCodes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertDiscountCode = z.infer<typeof insertDiscountCodeSchema>;
export type DiscountCode = typeof discountCodes.$inferSelect;

// Discount Code Usage Table
export const discountCodeUsage = pgTable("discount_code_usage", {
  id: uuid("id").primaryKey().defaultRandom(),
  discountCodeId: uuid("discount_code_id").notNull().references(() => discountCodes.id),
  businessId: uuid("business_id").notNull().references(() => businesses.id),
  subscriptionId: uuid("subscription_id").references(() => userSubscriptions.id),
  paymentId: uuid("payment_id").references(() => paymentHistory.id),
  originalAmount: text("original_amount").notNull(),
  discountAmount: text("discount_amount").notNull(),
  finalAmount: text("final_amount").notNull(),
  usedAt: timestamp("used_at").defaultNow(),
});

export const insertDiscountCodeUsageSchema = createInsertSchema(discountCodeUsage).omit({
  id: true,
  usedAt: true,
});
export type InsertDiscountCodeUsage = z.infer<typeof insertDiscountCodeUsageSchema>;
export type DiscountCodeUsage = typeof discountCodeUsage.$inferSelect;

// Admin Settings Table
export const adminSettings = pgTable("admin_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  settingKey: text("setting_key").notNull().unique(),
  settingValue: text("setting_value").notNull(),
  settingType: text("setting_type").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAdminSettingSchema = createInsertSchema(adminSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAdminSetting = z.infer<typeof insertAdminSettingSchema>;
export type AdminSetting = typeof adminSettings.$inferSelect;

// GOOGLE BUSINESS PROFILE INTEGRATION

// GBP-specific enums
export const gbpVerificationStatusEnum = pgEnum("gbp_verification_status", ["unverified", "claimed", "verified"]);
export const gbpSyncStatusEnum = pgEnum("gbp_sync_status", ["idle", "syncing", "error", "pending"]);
export const gbpConsentStatusEnum = pgEnum("gbp_consent_status", ["pending", "granted", "declined"]);
export const gbpRateLimitStatusEnum = pgEnum("gbp_rate_limit_status", ["normal", "warning", "exceeded"]);
export const gbpProfileStateEnum = pgEnum("gbp_profile_state", ["disconnected", "selecting", "staged", "connected"]);
export const gbpStagingSyncStatusEnum = pgEnum("gbp_staging_sync_status", ["pending", "approved", "rejected", "partially_approved"]);

// Google Business Profiles Integration Table
export const googleBusinessProfiles = pgTable("google_business_profiles", {
  // Core Identification
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }).unique(),
  gbpAccountId: varchar("gbp_account_id", { length: 255 }),
  gbpBusinessId: varchar("gbp_business_id", { length: 255 }).unique(),
  gbpLocationName: varchar("gbp_location_name", { length: 500 }), // Google's internal location identifier (accounts/{accountId}/locations/{locationId})
  gbpVerificationStatus: gbpVerificationStatusEnum("gbp_verification_status").default("unverified"),
  gbpVerificationToken: varchar("gbp_verification_token", { length: 500 }),
  gbpIsPrimary: boolean("gbp_is_primary").default(true),
  gbpProfileState: gbpProfileStateEnum("gbp_profile_state").default("disconnected"),

  // Business Identity Fields (synced from Google)
  gbpBusinessName: varchar("gbp_business_name", { length: 255 }),
  gbpPhone: varchar("gbp_phone", { length: 50 }),
  gbpEmail: varchar("gbp_email", { length: 255 }),
  gbpAddressLine1: text("gbp_address_line1"),
  gbpAddressLine2: text("gbp_address_line2"),
  gbpCity: varchar("gbp_city", { length: 100 }),
  gbpProvince: varchar("gbp_province", { length: 100 }),
  gbpPostalCode: varchar("gbp_postal_code", { length: 20 }),
  gbpCountry: varchar("gbp_country", { length: 100 }),
  gbpLatitude: decimal("gbp_latitude", { precision: 10, scale: 8 }),
  gbpLongitude: decimal("gbp_longitude", { precision: 11, scale: 8 }),

  // Profile Data
  gbpPrimaryCategory: varchar("gbp_primary_category", { length: 255 }),
  gbpSecondaryCategoriesIds: jsonb("gbp_secondary_categories_ids").$type<string[]>().default([]),
  gbpSecondaryCategories: jsonb("gbp_secondary_categories").$type<string[]>().default([]),
  gbpDescription: text("gbp_description"),
  gbpCoverPhotoUrl: text("gbp_cover_photo_url"),
  
  // Structured Operating Hours (Google API format)
  gbpRegularHours: jsonb("gbp_regular_hours").$type<{
    monday?: { open: string; close: string; closed?: boolean };
    tuesday?: { open: string; close: string; closed?: boolean };
    wednesday?: { open: string; close: string; closed?: boolean };
    thursday?: { open: string; close: string; closed?: boolean };
    friday?: { open: string; close: string; closed?: boolean };
    saturday?: { open: string; close: string; closed?: boolean };
    sunday?: { open: string; close: string; closed?: boolean };
  }>(),
  gbpOperatingHours: jsonb("gbp_operating_hours"), // Legacy - keep for backward compatibility
  
  // Special Hours (holidays, exceptions)
  gbpSpecialHours: jsonb("gbp_special_hours").$type<Array<{
    startDate: string;
    endDate: string;
    openTime?: string;
    closeTime?: string;
    reason?: string;
    closed?: boolean;
  }>>().default([]),
  
  // Service Areas Configuration
  gbpServiceAreas: jsonb("gbp_service_areas").$type<string[]>().default([]),
  gbpServiceAreaType: varchar("gbp_service_area_type", { length: 50 }), // "RADIUS", "POSTAL_CODES", "AREAS"
  gbpServiceAreaRadius: jsonb("gbp_service_area_radius").$type<{
    centerLatitude?: number;
    centerLongitude?: number;
    radiusKm?: number;
  }>(),
  gbpServiceAreaPostalCodes: jsonb("gbp_service_area_postal_codes").$type<string[]>().default([]),
  
  // Services Configuration
  gbpPrimaryService: varchar("gbp_primary_service", { length: 255 }),
  gbpSecondaryServices: jsonb("gbp_secondary_services").$type<Array<{
    serviceId?: string;
    serviceName: string;
    description?: string;
    price?: number;
    priceRange?: string;
    serviceType?: string;
  }>>().default([]),
  
  // Business Attributes (SEO critical)
  gbpAttributeKeywords: jsonb("gbp_attribute_keywords").$type<string[]>().default([]),
  gbpBusinessAttributes: jsonb("gbp_business_attributes").$type<Record<string, boolean>>().default({}),
  gbpCategorySpecificAttributes: jsonb("gbp_category_specific_attributes").$type<Record<string, string | boolean>>(),
  gbpCustomAttributes: jsonb("gbp_custom_attributes").$type<Array<{
    name: string;
    value: string;
  }>>().default([]),
  
  // Photos & Media
  gbpProfilePhotoUrl: text("gbp_profile_photo_url"),
  gbpPhotosUrls: jsonb("gbp_photos_urls").$type<Array<{
    url: string;
    caption?: string;
    uploadedAt?: string;
    googlePhotoId?: string;
    category?: string;
  }>>().default([]),
  gbpVideosUrls: jsonb("gbp_videos_urls").$type<Array<{
    url: string;
    title?: string;
    uploadedAt?: string;
  }>>().default([]),
  
  // Social & Communication
  gbpFacebookUrl: text("gbp_facebook_url"),
  gbpInstagramUrl: text("gbp_instagram_url"),
  gbpTwitterUrl: text("gbp_twitter_url"),
  gbpLinkedInUrl: text("gbp_linked_in_url"),
  gbpYoutubeUrl: text("gbp_youtube_url"),
  gbpTikTokUrl: text("gbp_tik_tok_url"),
  gbpWhatsappEnabled: boolean("gbp_whatsapp_enabled").default(false),
  gbpWhatsappNumber: varchar("gbp_whatsapp_number", { length: 50 }),
  gbpMessagingConfig: jsonb("gbp_messaging_config").$type<{
    responseTimeMinutes?: number;
    autoReplyEnabled?: boolean;
    autoReplyMessage?: string;
  }>(),
  
  // Appointment Booking
  gbpAppointmentBookingUrl: text("gbp_appointment_booking_url"),
  
  // Opening Status & Info
  gbpOpeningDate: date("gbp_opening_date"),
  gbpBusinessStatus: varchar("gbp_business_status", { length: 50 }).default("OPEN"),
  gbpCurrentlyOpen: boolean("gbp_currently_open"),
  gbpTemporaryClosureStartDate: date("gbp_temporary_closure_start_date"),
  gbpTemporaryClosureEndDate: date("gbp_temporary_closure_end_date"),
  
  // Office Visit Policy
  gbpOfficeVisitPolicy: varchar("gbp_office_visit_policy", { length: 50 }),
  
  // Profile Completeness & Quality (SEO tracking)
  gbpProfileCompletenessPercent: integer("gbp_profile_completeness_percent").default(0),
  gbpMissingRequiredFields: jsonb("gbp_missing_required_fields").$type<string[]>().default([]),
  gbpLastCompletenessCheckAt: timestamp("gbp_last_completeness_check_at"),
  gbpQualityScore: integer("gbp_quality_score"),
  gbpQualityScoreLastUpdated: timestamp("gbp_quality_score_last_updated"),
  
  // Posts Caching
  gbpLatestPostsCache: jsonb("gbp_latest_posts_cache").$type<Array<{
    postId: string;
    title?: string;
    content?: string;
    imageUrl?: string;
    createdAt?: string;
    views?: number;
    clicks?: number;
  }>>().default([]),

  // Analytics Caching
  gbpReviewsCount: integer("gbp_reviews_count").default(0),
  gbpAverageRating: decimal("gbp_average_rating", { precision: 3, scale: 2 }).default("0"),
  gbpPhotoViewsCount: integer("gbp_photo_views_count").default(0),
  gbpPhotoClicksCount: integer("gbp_photo_clicks_count").default(0),
  gbpDirectionsRequestsCount: integer("gbp_directions_requests_count").default(0),
  gbpWebsiteClicksCount: integer("gbp_website_clicks_count").default(0),
  gbpAnalyticsLastSyncedAt: timestamp("gbp_analytics_last_synced_at"),
  gbpCachedAnalytics: jsonb("gbp_cached_analytics"),

  // OAuth & API Authentication
  gbpAccessToken: text("gbp_access_token"),
  gbpAccessTokenExpiresAt: timestamp("gbp_access_token_expires_at"),
  gbpRefreshToken: text("gbp_refresh_token"),
  gbpOAuthScopes: jsonb("gbp_oauth_scopes").$type<string[]>().default([]),
  gbpOAuthGrantedAt: timestamp("gbp_oauth_granted_at"),

  // Sync & Error Tracking
  gbpSyncStatus: gbpSyncStatusEnum("gbp_sync_status").default("idle"),
  gbpLastSyncedAt: timestamp("gbp_last_synced_at"),
  gbpLastSyncErrorAt: timestamp("gbp_last_sync_error_at"),
  gbpLastSyncErrorMessage: text("gbp_last_sync_error_message"),
  gbpSyncRetryCount: integer("gbp_sync_retry_count").default(0),
  gbpSyncErrorLog: jsonb("gbp_sync_error_log").$type<string[]>().default([]),
  gbpNextScheduledSyncAt: timestamp("gbp_next_scheduled_sync_at"),

  // Feature Configuration
  gbpPostsEnabled: boolean("gbp_posts_enabled").default(false),
  gbpPostsConfig: jsonb("gbp_posts_config"),
  gbpBookingIntegrationEnabled: boolean("gbp_booking_integration_enabled").default(false),
  gbpBookingConfig: jsonb("gbp_booking_config"),
  gbpLocalServicesAdsEnabled: boolean("gbp_local_services_ads_enabled").default(false),
  gbpLocalServicesAdsConfig: jsonb("gbp_local_services_ads_config"),
  gbpMessagingEnabled: boolean("gbp_messaging_enabled").default(false),

  // Content Management
  gbpWebsiteLinks: jsonb("gbp_website_links"),
  gbpAttributesConfig: jsonb("gbp_attributes_config"),
  gbpBusinessHours: jsonb("gbp_business_hours"),
  gbpServiceTypesConfig: jsonb("gbp_service_types_config"),
  gbpMediaPolicy: jsonb("gbp_media_policy"),

  // Notifications & Consent
  gbpNotificationPreferences: jsonb("gbp_notification_preferences"),
  gbpConsentStatus: gbpConsentStatusEnum("gbp_consent_status").default("pending"),
  gbpConsentRecordedAt: timestamp("gbp_consent_recorded_at"),
  gbpDataCollectionAllowed: boolean("gbp_data_collection_allowed").default(true),

  // Duplicates & Merging
  gbpDuplicateListings: jsonb("gbp_duplicate_listings").$type<string[]>().default([]),
  gbpMergedFromIds: jsonb("gbp_merged_from_ids").$type<string[]>().default([]),

  // Integration & Metadata
  gbpExternalIntegrations: jsonb("gbp_external_integrations"),
  gbpFeatureFlags: jsonb("gbp_feature_flags").$type<Record<string, boolean>>().default({}),
  gbpMetadata: jsonb("gbp_metadata"),
  gbpVersion: integer("gbp_version").default(1),

  // Rate Limiting & API Quota
  gbpAPICallsThisMonth: integer("gbp_api_calls_this_month").default(0),
  gbpAPICallsLimit: integer("gbp_api_calls_limit").default(5000),
  gbpAPICallsResetDate: date("gbp_api_calls_reset_date"),
  gbpAPIRateLimitStatus: gbpRateLimitStatusEnum("gbp_rate_limit_status").default("normal"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertGoogleBusinessProfileSchema = createInsertSchema(googleBusinessProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertGoogleBusinessProfile = z.infer<typeof insertGoogleBusinessProfileSchema>;
export type GoogleBusinessProfile = typeof googleBusinessProfiles.$inferSelect;

// GBP Sync Staging Table - Holds data fetched from Google for review before committing
export const googleBusinessProfileSyncs = pgTable("google_business_profile_syncs", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  gbpProfileId: uuid("gbp_profile_id").references(() => googleBusinessProfiles.id, { onDelete: "cascade" }),
  
  // Google Location Selection (for multi-profile scenarios)
  gbpLocationName: varchar("gbp_location_name", { length: 500 }), // accounts/{accountId}/locations/{locationId}
  gbpAccountId: varchar("gbp_account_id", { length: 255 }),
  
  // Raw payload from Google API
  googleRawPayload: jsonb("google_raw_payload"),
  
  // Normalized fields extracted from Google (what we want to sync)
  stagedData: jsonb("staged_data").$type<{
    // Identity fields
    businessName?: string;
    phone?: string;
    email?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    // Profile fields
    description?: string;
    primaryCategory?: string;
    secondaryCategories?: string[];
    regularHours?: Record<string, { open: string; close: string; closed?: boolean }>;
    specialHours?: Array<{ startDate: string; endDate: string; openTime?: string; closeTime?: string; reason?: string; closed?: boolean }>;
    // Social URLs
    facebookUrl?: string;
    instagramUrl?: string;
    twitterUrl?: string;
    linkedInUrl?: string;
    youtubeUrl?: string;
    tikTokUrl?: string;
    websiteUrl?: string;
    // Service areas
    serviceAreas?: string[];
    serviceAreaType?: string;
  }>(),
  
  // Computed diff between staged data and current business/GBP data
  diffData: jsonb("diff_data").$type<{
    field: string;
    googleValue: any;
    currentValue: any;
    table: "business" | "gbp"; // Which table this field affects
    approved?: boolean; // User's decision
  }[]>(),
  
  // Name mismatch detection
  nameMismatch: boolean("name_mismatch").default(false),
  nameMismatchDetails: jsonb("name_mismatch_details").$type<{
    googleName: string;
    appName: string;
    similarityScore?: number;
  }>(),
  
  // Sync status
  status: gbpStagingSyncStatusEnum("status").default("pending"),
  
  // User decisions tracking
  approvedFields: jsonb("approved_fields").$type<string[]>().default([]),
  rejectedFields: jsonb("rejected_fields").$type<string[]>().default([]),
  
  // Metadata
  syncType: varchar("sync_type", { length: 50 }).default("initial"), // "initial", "manual", "scheduled"
  requestedBy: varchar("requested_by", { length: 255 }).references(() => users.id),
  approvedBy: varchar("approved_by", { length: 255 }).references(() => users.id),
  approvedAt: timestamp("approved_at"),
  expiresAt: timestamp("expires_at"), // Staging data expires after some time
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertGoogleBusinessProfileSyncSchema = createInsertSchema(googleBusinessProfileSyncs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertGoogleBusinessProfileSync = z.infer<typeof insertGoogleBusinessProfileSyncSchema>;
export type GoogleBusinessProfileSync = typeof googleBusinessProfileSyncs.$inferSelect;

// Available Google Locations - Temporary storage for profile selection
export const googleAvailableLocations = pgTable("google_available_locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  
  // Google location data
  gbpAccountId: varchar("gbp_account_id", { length: 255 }).notNull(),
  gbpLocationName: varchar("gbp_location_name", { length: 500 }).notNull(), // accounts/{accountId}/locations/{locationId}
  gbpBusinessName: varchar("gbp_business_name", { length: 255 }),
  gbpAddress: text("gbp_address"),
  gbpPhone: varchar("gbp_phone", { length: 50 }),
  gbpVerificationStatus: varchar("gbp_verification_status", { length: 50 }),
  gbpOwnershipStatus: varchar("gbp_ownership_status", { length: 50 }), // "OWNED", "PENDING", "UNOWNED"
  
  // Matching info
  isSelected: boolean("is_selected").default(false),
  nameSimilarityScore: decimal("name_similarity_score", { precision: 5, scale: 2 }),
  
  // Raw location data
  rawLocationData: jsonb("raw_location_data"),
  
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"), // Clean up after selection
});

export const insertGoogleAvailableLocationSchema = createInsertSchema(googleAvailableLocations).omit({
  id: true,
  createdAt: true,
});
export type InsertGoogleAvailableLocation = z.infer<typeof insertGoogleAvailableLocationSchema>;
export type GoogleAvailableLocation = typeof googleAvailableLocations.$inferSelect;

