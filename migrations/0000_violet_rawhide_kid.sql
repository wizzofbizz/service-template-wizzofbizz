CREATE TYPE "public"."activity_action" AS ENUM('create', 'update', 'delete', 'view', 'send', 'login', 'logout', 'quote_requested', 'quote_sent', 'quote_viewed', 'quote_accepted', 'quote_declined', 'quote_expired', 'booking_requested', 'booking_rescheduled', 'booking_cancelled', 'booking_reminder_sent', 'job_started', 'job_completed', 'job_paused', 'invoice_sent', 'invoice_viewed', 'invoice_paid', 'payment_received', 'payment_reminder_sent', 'email_sent', 'email_opened', 'email_clicked', 'whatsapp_sent', 'whatsapp_delivered', 'whatsapp_read', 'call_inbound', 'call_outbound', 'message_received', 'review_requested', 'review_submitted', 'feedback_received');--> statement-breakpoint
CREATE TYPE "public"."activity_entity" AS ENUM('business', 'user', 'contact', 'service', 'quote', 'job', 'invoice', 'testimonial');--> statement-breakpoint
CREATE TYPE "public"."attachment_type" AS ENUM('quote', 'job', 'invoice', 'testimonial', 'other');--> statement-breakpoint
CREATE TYPE "public"."contact_type" AS ENUM('lead', 'customer', 'past_customer');--> statement-breakpoint
CREATE TYPE "public"."day_of_week" AS ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');--> statement-breakpoint
CREATE TYPE "public"."deposit_cancellation_mode" AS ENUM('auto', 'manual');--> statement-breakpoint
CREATE TYPE "public"."email_status" AS ENUM('pending', 'sent', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."email_template_type" AS ENUM('quote_sent', 'job_reminder', 'invoice_sent', 'review_request', 'welcome', 'custom');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."invoice_type" AS ENUM('deposit', 'final', 'standard');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('pending', 'pending_deposit', 'deposit_paid', 'scheduled', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."job_type" AS ENUM('regular', 'quote_visit', 'follow_up', 'emergency');--> statement-breakpoint
CREATE TYPE "public"."lead_source" AS ENUM('website', 'referral', 'google', 'direct', 'other');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('new', 'contacted', 'quoted', 'converted', 'lost');--> statement-breakpoint
CREATE TYPE "public"."payment_gateway" AS ENUM('stripe', 'payfast', 'manual', 'other');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'card', 'bank_transfer', 'other');--> statement-breakpoint
CREATE TYPE "public"."pricing_type" AS ENUM('fixed', 'hourly', 'per_item', 'custom');--> statement-breakpoint
CREATE TYPE "public"."quote_status" AS ENUM('draft', 'ai_quote', 'sent', 'viewed', 'accepted', 'declined', 'expired', 'archived');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('trial', 'active', 'suspended', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."subscription_tier" AS ENUM('basic', 'standard', 'premium');--> statement-breakpoint
CREATE TYPE "public"."testimonial_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('pending', 'completed', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."usage_service_type" AS ENUM('whatsapp', 'sms', 'ai_credits');--> statement-breakpoint
CREATE TYPE "public"."usage_status" AS ENUM('active', 'exceeded', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('owner', 'admin', 'technician');--> statement-breakpoint
CREATE TYPE "public"."website_status" AS ENUM('draft', 'published', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."whatsapp_status" AS ENUM('pending', 'sent', 'delivered', 'read', 'failed');--> statement-breakpoint
CREATE TYPE "public"."whatsapp_template_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"user_id" varchar,
	"contact_id" uuid,
	"action" "activity_action" NOT NULL,
	"entity_type" "activity_entity" NOT NULL,
	"entity_id" uuid,
	"changes" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_quote_learning_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"quote_id" uuid NOT NULL,
	"ai_version_id" uuid,
	"final_version_id" uuid,
	"price_difference" numeric(10, 2),
	"price_difference_percent" numeric(5, 2),
	"feature_extraction_errors" jsonb,
	"feedback_category" varchar(50),
	"corrections_applied" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"related_type" "attachment_type" NOT NULL,
	"related_id" uuid NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_url" text NOT NULL,
	"file_size" integer,
	"mime_type" varchar(100),
	"uploaded_by" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "business_hours" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"day_of_week" "day_of_week" NOT NULL,
	"start_time" time,
	"end_time" time,
	"is_closed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "businesses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"industry" varchar(100),
	"owner_name" varchar(255),
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"address_line1" text,
	"address_line2" text,
	"city" varchar(100),
	"province" varchar(100),
	"postal_code" varchar(20),
	"business_description" text,
	"logo_url" text,
	"primary_color" varchar(7) DEFAULT '#2196F3',
	"vat_number" varchar(50),
	"vat_rate" numeric(5, 2) DEFAULT '15.00',
	"operating_hours" text,
	"facebook_url" text,
	"instagram_url" text,
	"whatsapp_number" varchar(50),
	"website_url" text,
	"website_status" "website_status" DEFAULT 'draft',
	"subscription_status" "subscription_status" DEFAULT 'trial',
	"subscription_tier" "subscription_tier" DEFAULT 'basic',
	"quote_number_format" varchar(50) DEFAULT 'QT-YYYY-####',
	"invoice_number_format" varchar(50) DEFAULT 'INV-YYYY-####',
	"job_number_format" varchar(50) DEFAULT 'JOB-YYYY-####',
	"default_payment_due_days" integer DEFAULT 30,
	"payment_reminder_days" jsonb DEFAULT '[3,7,14]'::jsonb,
	"quote_visit_duration_minutes" integer DEFAULT 60,
	"buffer_between_visits_minutes" integer DEFAULT 15,
	"booking_window_days" integer DEFAULT 14,
	"minimum_notice_hours" integer DEFAULT 24,
	"time_slot_interval_minutes" integer DEFAULT 15,
	"calendar_hours" jsonb DEFAULT '{"monday":{"start":"09:00","end":"17:00"},"tuesday":{"start":"09:00","end":"17:00"},"wednesday":{"start":"09:00","end":"17:00"},"thursday":{"start":"09:00","end":"17:00"},"friday":{"start":"09:00","end":"17:00"},"saturday":null,"sunday":null}'::jsonb,
	"sender_email" varchar(255),
	"sender_name" varchar(255),
	"sender_email_verified" boolean DEFAULT false,
	"business_whatsapp" varchar(50),
	"whatsapp_enabled" boolean DEFAULT false,
	"quote_followup_days" jsonb DEFAULT '[3,7,14]'::jsonb,
	"whatsapp_provider" varchar(50) DEFAULT 'twilio',
	"whatsapp_provider_config" jsonb,
	"whatsapp_wasender_api_key" varchar(255),
	"whatsapp_monthly_limit" integer DEFAULT 1000,
	"whatsapp_current_usage" integer DEFAULT 0,
	"whatsapp_usage_reset_date" date,
	"whatsapp_limit_alert_sent" boolean DEFAULT false,
	"whatsapp_overage_allowed" boolean DEFAULT false,
	"job_reminder_days" jsonb DEFAULT '[1,3,7]'::jsonb,
	"deposit_cancellation_mode" "deposit_cancellation_mode" DEFAULT 'manual',
	"deposit_cancellation_threshold_hours" integer DEFAULT 24,
	"deposit_reminder_hours" jsonb DEFAULT '[48,24,12]'::jsonb,
	"require_deposit_by_default" boolean DEFAULT false,
	"default_deposit_percentage" numeric(5, 2) DEFAULT '30.00',
	"address_latitude" numeric(10, 8),
	"address_longitude" numeric(11, 8),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "businesses_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "calendar_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"google_calendar_id" text,
	"working_days" jsonb,
	"booking_buffer_minutes" integer DEFAULT 30,
	"max_bookings_per_day" integer DEFAULT 8,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "calendar_settings_business_id_unique" UNIQUE("business_id")
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone" varchar(50),
	"address" text,
	"contact_type" "contact_type" DEFAULT 'lead',
	"lead_source" "lead_source" DEFAULT 'website',
	"lead_status" "lead_status" DEFAULT 'new',
	"notes" text,
	"preferred_channel" varchar(20) DEFAULT 'email',
	"whatsapp_opt_in" boolean DEFAULT false,
	"whatsapp_opt_in_date" timestamp,
	"whatsapp_opt_out_date" timestamp,
	"address_latitude" numeric(10, 8),
	"address_longitude" numeric(11, 8),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "deposit_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"service_id" uuid,
	"deposit_percentage" numeric(5, 2) NOT NULL,
	"cancellation_threshold_hours" integer NOT NULL,
	"auto_reminders" boolean DEFAULT true,
	"auto_cancellation" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "email_action_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"action" varchar(50) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "email_action_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "email_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"to_email" varchar(255) NOT NULL,
	"to_name" varchar(255),
	"subject" varchar(500) NOT NULL,
	"body_html" text,
	"body_text" text,
	"status" "email_status" DEFAULT 'pending',
	"template_id" uuid,
	"related_type" "attachment_type",
	"related_id" uuid,
	"scheduled_for" timestamp,
	"sent_at" timestamp,
	"error_message" text,
	"retry_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "email_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"subject" varchar(500) NOT NULL,
	"body_html" text NOT NULL,
	"body_text" text,
	"template_type" "email_template_type" NOT NULL,
	"variables" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "invoice_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"service_id" uuid,
	"description" text NOT NULL,
	"quantity" numeric(10, 2) DEFAULT '1',
	"unit_price" numeric(10, 2) NOT NULL,
	"line_total" numeric(10, 2) NOT NULL,
	"display_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"job_id" uuid,
	"contact_id" uuid NOT NULL,
	"quote_id" uuid,
	"invoice_number" varchar(50) NOT NULL,
	"title" varchar(255),
	"invoice_type" "invoice_type" DEFAULT 'standard',
	"status" "invoice_status" DEFAULT 'draft',
	"due_date" date,
	"paid_at" timestamp,
	"payment_method" "payment_method",
	"subtotal" numeric(10, 2) NOT NULL,
	"tax_amount" numeric(10, 2) DEFAULT '0',
	"total_amount" numeric(10, 2) NOT NULL,
	"deposit_amount" numeric(10, 2),
	"balance_due" numeric(10, 2),
	"linked_deposit_invoice_id" uuid,
	"notes" text,
	"public_token" text,
	"reminders_sent" integer DEFAULT 0,
	"last_reminder_sent_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number"),
	CONSTRAINT "invoices_public_token_unique" UNIQUE("public_token")
);
--> statement-breakpoint
CREATE TABLE "job_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"service_id" uuid,
	"description" text NOT NULL,
	"quantity" numeric(10, 2) DEFAULT '1',
	"unit_price" numeric(10, 2) NOT NULL,
	"line_total" numeric(10, 2) NOT NULL,
	"display_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"quote_id" uuid,
	"assigned_to" varchar,
	"job_number" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"service_type" varchar(50),
	"status" "job_status" DEFAULT 'scheduled',
	"scheduled_date" date,
	"scheduled_start_time" time,
	"scheduled_end_time" time,
	"actual_start_time" timestamp,
	"actual_end_time" timestamp,
	"location_address" text,
	"internal_notes" text,
	"cancellation_reason" text,
	"job_type" "job_type" DEFAULT 'regular',
	"related_quote_version_id" uuid,
	"subtotal" numeric(10, 2),
	"tax_amount" numeric(10, 2) DEFAULT '0',
	"discount_amount" numeric(10, 2) DEFAULT '0',
	"total_amount" numeric(10, 2),
	"is_quote_visit" boolean DEFAULT false,
	"related_quote_id" uuid,
	"customer_name" varchar(255),
	"customer_email" varchar(255),
	"customer_phone" varchar(50),
	"deposit_paid" boolean DEFAULT false,
	"deposit_paid_at" timestamp,
	"deposit_invoice_id" uuid,
	"deposit_deadline" timestamp,
	"deposit_reminders_sent" integer DEFAULT 0,
	"last_deposit_reminder_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "jobs_job_number_unique" UNIQUE("job_number")
);
--> statement-breakpoint
CREATE TABLE "landing_page_content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"section" varchar(100) NOT NULL,
	"element_key" varchar(100) NOT NULL,
	"content_type" varchar(50) NOT NULL,
	"value" text,
	"alt_text" text,
	"url" text,
	"display_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payment_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"transaction_id" varchar(255),
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'ZAR',
	"payment_method" "payment_method" NOT NULL,
	"status" "transaction_status" DEFAULT 'pending',
	"gateway" "payment_gateway" NOT NULL,
	"gateway_response" jsonb,
	"metadata" jsonb,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quote_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" uuid NOT NULL,
	"service_id" uuid,
	"description" text NOT NULL,
	"quantity" numeric(10, 2) DEFAULT '1',
	"unit_price" numeric(10, 2) NOT NULL,
	"line_total" numeric(10, 2) NOT NULL,
	"display_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "quote_version_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_version_id" uuid NOT NULL,
	"service_id" uuid,
	"description" text NOT NULL,
	"quantity" numeric(10, 2) DEFAULT '1',
	"unit_price" numeric(10, 2) NOT NULL,
	"line_total" numeric(10, 2) NOT NULL,
	"display_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "quote_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"source" varchar(20) NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"tax_amount" numeric(10, 2) DEFAULT '0',
	"discount_amount" numeric(10, 2) DEFAULT '0',
	"total_amount" numeric(10, 2) NOT NULL,
	"line_items" jsonb NOT NULL,
	"notes" text,
	"ai_extracted_features" jsonb,
	"ai_confidence_score" numeric(3, 2),
	"ai_reasoning" text,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"quote_number" varchar(50) NOT NULL,
	"title" varchar(255),
	"status" "quote_status" DEFAULT 'draft',
	"valid_until" date,
	"sent_at" timestamp,
	"viewed_at" timestamp,
	"accepted_at" timestamp,
	"declined_at" timestamp,
	"decline_reason" text,
	"subtotal" numeric(10, 2) NOT NULL,
	"tax_amount" numeric(10, 2) DEFAULT '0',
	"discount_amount" numeric(10, 2) DEFAULT '0',
	"total_amount" numeric(10, 2) NOT NULL,
	"notes" text,
	"location_address" text,
	"location_latitude" numeric(10, 8),
	"location_longitude" numeric(11, 8),
	"service_location_type" varchar(20) DEFAULT 'customer',
	"created_by" varchar,
	"public_token" text,
	"latest_version_id" uuid,
	"requires_deposit" boolean DEFAULT false,
	"deposit_amount" numeric(10, 2),
	"deposit_percentage" numeric(5, 2),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "quotes_quote_number_unique" UNIQUE("quote_number"),
	CONSTRAINT "quotes_public_token_unique" UNIQUE("public_token")
);
--> statement-breakpoint
CREATE TABLE "service_areas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"area_name" varchar(255) NOT NULL,
	"postal_codes" text[],
	"cities" text[],
	"provinces" text[],
	"is_active" boolean DEFAULT true,
	"travel_fee" numeric(10, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"service_name" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100),
	"pricing_type" "pricing_type" DEFAULT 'fixed',
	"base_price" numeric(10, 2),
	"duration_minutes" integer,
	"is_active" boolean DEFAULT true,
	"display_order" integer DEFAULT 0,
	"pricing_formula" text,
	"ai_guidance_prompt" text,
	"rule_config" jsonb DEFAULT '{}'::jsonb,
	"service_questions" jsonb DEFAULT '[]'::jsonb,
	"requires_site_visit" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"contact_id" uuid,
	"author_name" varchar(255) NOT NULL,
	"author_title" varchar(100),
	"rating" integer NOT NULL,
	"testimonial_text" text NOT NULL,
	"avatar_url" text,
	"status" "testimonial_status" DEFAULT 'pending',
	"is_featured" boolean DEFAULT false,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"approved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "usage_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"service_type" "usage_service_type" NOT NULL,
	"threshold_percentage" integer NOT NULL,
	"alert_type" varchar(50) NOT NULL,
	"triggered_at" timestamp,
	"acknowledged_at" timestamp,
	"notification_sent" boolean DEFAULT false,
	"notification_message" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "usage_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"service_type" "usage_service_type" NOT NULL,
	"provider_name" varchar(50),
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"usage_count" integer DEFAULT 0,
	"usage_limit" integer NOT NULL,
	"cost_per_unit" numeric(10, 4),
	"total_cost" numeric(10, 2) DEFAULT '0',
	"status" "usage_status" DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid,
	"email" varchar(255),
	"password_hash" text,
	"email_verified" boolean DEFAULT false,
	"email_verification_token" varchar(255),
	"email_verification_expires_at" timestamp,
	"password_reset_token" varchar(255),
	"password_reset_expires_at" timestamp,
	"first_name" varchar(255),
	"last_name" varchar(255),
	"profile_image_url" text,
	"role" "user_role" DEFAULT 'owner',
	"is_active" boolean DEFAULT true,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "whatsapp_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"contact_id" uuid,
	"to_number" varchar(50) NOT NULL,
	"template_name" varchar(100),
	"template_params" jsonb,
	"message_body" text,
	"media_url" text,
	"provider_name" varchar(50) DEFAULT 'twilio',
	"provider_message_id" varchar(150),
	"status" "whatsapp_status" DEFAULT 'pending',
	"error_message" text,
	"retry_count" integer DEFAULT 0,
	"max_retries" integer DEFAULT 3,
	"sent_at" timestamp,
	"delivered_at" timestamp,
	"read_at" timestamp,
	"failed_at" timestamp,
	"cost" numeric(10, 4) DEFAULT '0.40',
	"usage_period" date,
	"related_type" varchar(50),
	"related_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "whatsapp_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"template_name" varchar(100) NOT NULL,
	"template_type" varchar(50) NOT NULL,
	"twilio_template_sid" varchar(100),
	"meta_template_id" varchar(100),
	"content_text" text NOT NULL,
	"variables" jsonb,
	"language" varchar(10) DEFAULT 'en',
	"category" varchar(50) DEFAULT 'utility',
	"status" "whatsapp_template_status" DEFAULT 'pending',
	"submitted_at" timestamp,
	"approved_at" timestamp,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_quote_learning_events" ADD CONSTRAINT "ai_quote_learning_events_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_quote_learning_events" ADD CONSTRAINT "ai_quote_learning_events_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_quote_learning_events" ADD CONSTRAINT "ai_quote_learning_events_ai_version_id_quote_versions_id_fk" FOREIGN KEY ("ai_version_id") REFERENCES "public"."quote_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_quote_learning_events" ADD CONSTRAINT "ai_quote_learning_events_final_version_id_quote_versions_id_fk" FOREIGN KEY ("final_version_id") REFERENCES "public"."quote_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_hours" ADD CONSTRAINT "business_hours_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_settings" ADD CONSTRAINT "calendar_settings_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deposit_policies" ADD CONSTRAINT "deposit_policies_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deposit_policies" ADD CONSTRAINT "deposit_policies_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_action_tokens" ADD CONSTRAINT "email_action_tokens_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_queue" ADD CONSTRAINT "email_queue_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_linked_deposit_invoice_id_invoices_id_fk" FOREIGN KEY ("linked_deposit_invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_items" ADD CONSTRAINT "job_items_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_items" ADD CONSTRAINT "job_items_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_related_quote_version_id_quote_versions_id_fk" FOREIGN KEY ("related_quote_version_id") REFERENCES "public"."quote_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_related_quote_id_quotes_id_fk" FOREIGN KEY ("related_quote_id") REFERENCES "public"."quotes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_deposit_invoice_id_invoices_id_fk" FOREIGN KEY ("deposit_invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "landing_page_content" ADD CONSTRAINT "landing_page_content_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_version_items" ADD CONSTRAINT "quote_version_items_quote_version_id_quote_versions_id_fk" FOREIGN KEY ("quote_version_id") REFERENCES "public"."quote_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_version_items" ADD CONSTRAINT "quote_version_items_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_versions" ADD CONSTRAINT "quote_versions_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_versions" ADD CONSTRAINT "quote_versions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_areas" ADD CONSTRAINT "service_areas_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_alerts" ADD CONSTRAINT "usage_alerts_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_tracking" ADD CONSTRAINT "usage_tracking_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_queue" ADD CONSTRAINT "whatsapp_queue_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_queue" ADD CONSTRAINT "whatsapp_queue_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_templates" ADD CONSTRAINT "whatsapp_templates_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;