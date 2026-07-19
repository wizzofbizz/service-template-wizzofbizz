import bcrypt from "bcrypt";
import { getPublicBaseUrl, isGoogleAuthConfigured, features } from "./config";
import { PayFastService, getPayFastService } from "./services/payfast.service";
import { getCurrentBusiness } from "./current-business";
import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { setupGoogleAuth } from "./googleAuth";
import { requireAuth, attachBusinessContext } from "./middleware/auth";
import { sendEmail, processEmailQueue } from "./email"; // Import the new email service and queue processor
import { webhookRateLimiter } from "./rate-limiter";
import { EncryptionService } from "./encryption";
import { runEmailReminders } from "./scheduled-jobs"; // Import reminder function
import crypto from "crypto"; // Ensure crypto is imported
import { aiQuoteService } from "./ai-service";
import { eq, and, sql } from "drizzle-orm"; // Import necessary Drizzle ORM functions
import { db } from "./db"; // Import Drizzle DB instance and schema
import { ActivityLogger } from "./activity-logger";
import { ObjectStorageService } from "./objectStorage";
import { whatsappSessions } from "../shared/schema";


// Validation schemas
const registerBusinessSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  industry: z.string().min(1, "Industry is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Phone number is required"),
  addressLine1: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  province: z.string().min(1, "Province is required"),
  postalCode: z.string().min(4, "Postal code is required"),
  businessDescription: z.string().min(10, "Business description is required"),
  website: z.string().optional(),
  operatingHours: z.string().min(1, "Operating hours are required"), // Added operatingHours
});

// Define insertBusinessSchema for the specific endpoint, potentially with fewer required fields initially
const insertBusinessSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  industry: z.string().min(1, "Industry is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Phone number is required"),
  addressLine1: z.string().min(1, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  province: z.string().min(1, "Province is required"),
  postalCode: z.string().min(4, "Postal code is required"),
  businessDescription: z.string().min(10, "Business description is required"),
  operatingHours: z.string().min(1, "Operating hours are required"),
  websiteUrl: z.string().url("Invalid website URL").optional().or(z.literal("")),
  facebookUrl: z.string().url("Invalid Facebook URL").optional().or(z.literal("")),
  instagramUrl: z.string().url("Invalid Instagram URL").optional().or(z.literal("")),
  whatsappNumber: z.string().optional(),
  logoUrl: z.string().url("Invalid logo URL").optional().or(z.literal("")),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").optional(),
  senderName: z.string().optional(),
  senderEmail: z.string().email("Valid sender email is required").optional(),
  defaultPaymentDueDays: z.number().min(1, "Must be at least 1 day").max(365, "Must be less than 365 days").optional(),
  paymentReminderDays: z.array(z.number()).min(1, "At least one reminder day is required").optional(),
});

const contactSchema = z.object({
  fullName: z.string().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  contactType: z.enum(["lead", "customer", "past_customer"]).default("lead"),
  leadSource: z.enum(["website", "referral", "google", "direct", "other"]).optional(),
  leadStatus: z.enum(["new", "contacted", "quoted", "converted", "lost"]).optional(),
  notes: z.string().optional(),
}).refine((data) => data.email || data.phone, {
  message: "At least one contact method (email or phone) is required",
  path: ["email"],
});

const serviceSchema = z.object({
  serviceName: z.string().min(1, "Service name is required"),
  description: z.string().optional(),
  category: z.string().optional(),
  pricingType: z.enum(["fixed", "hourly", "per_item", "custom"]).optional(),
  basePrice: z.string().optional(),
  durationMinutes: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
  pricingFormula: z.string().optional(),
  aiGuidancePrompt: z.string().optional(),
  ruleConfig: z.record(z.any()).optional(),
  imageAnalysisConfig: z.object({
    enabled: z.boolean().default(false),
    requiredPhotos: z.array(z.string()).default([]),
    analysisHints: z.string().optional(),
  }).optional(),
  materialCostConfig: z.record(z.any()).optional(),
  serviceQuestions: z.array(z.object({
    question: z.string(),
    type: z.enum(["text", "number", "select"]),
    options: z.array(z.string()).optional(),
    required: z.boolean().optional(),
  })).optional(),
});

const quoteSchema = z.object({
  contactId: z.string().uuid(),
  validUntil: z.string().optional(),
  subtotal: z.string(),
  taxAmount: z.string().optional(),
  discountAmount: z.string().optional(),
  totalAmount: z.string(),
  notes: z.string().optional(),
  locationAddress: z.string().optional(),
  status: z.enum(["draft", "sent", "viewed", "accepted", "declined", "expired", "archived", "ai_quote"]).optional(),
  items: z.array(z.object({
    serviceId: z.string().uuid().optional(),
    description: z.string(),
    quantity: z.string(),
    unitPrice: z.string(),
    lineTotal: z.string(),
  })).optional(),
  publicToken: z.string().uuid().optional(),
  viewedAt: z.date().optional(),
  acceptedAt: z.date().optional(),
  declinedAt: z.date().optional(),
  expiredAt: z.date().optional(),
  archivedAt: z.date().optional(),
  sentAt: z.date().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  createdBy: z.string().uuid().optional(),
  businessId: z.string().uuid().optional(),
  latestVersionId: z.string().uuid().optional(),
  title: z.string().optional(),
  requiresDeposit: z.boolean().optional(),
  depositPercentage: z.string().optional(),
  depositAmount: z.string().optional(),
});

// Schema for updating quotes, allowing partial updates
const updateQuoteSchema = quoteSchema.partial();

const jobSchema = z.object({
  contactId: z.string().uuid(),
  quoteId: z.string().uuid().optional(),
  assignedTo: z.string().optional(),
  jobNumber: z.string().optional(), // Auto-generated
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["draft", "scheduled", "in_progress", "completed", "cancelled", "pending_deposit", "deposit_paid"]).optional(),
  jobType: z.enum(["regular", "quote_visit"]).optional(),
  scheduledDate: z.string().optional(),
  scheduledStartTime: z.string().optional(),
  scheduledEndTime: z.string().optional(),
  locationAddress: z.string().optional(),
  internalNotes: z.string().optional(),
  subtotal: z.string().optional(),
  taxAmount: z.string().optional(),
  discountAmount: z.string().optional(),
  totalAmount: z.string().optional(),
  actualStartTime: z.date().optional(),
  actualEndTime: z.date().optional(),
  cancellationReason: z.string().optional(),
  relatedQuoteVersionId: z.string().uuid().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  createdBy: z.string().uuid().optional(),
  businessId: z.string().uuid().optional(),
  depositInvoiceId: z.string().uuid().optional(),
  depositPaid: z.boolean().optional(),
  depositPaidAt: z.date().optional(),
  depositDeadline: z.date().optional(),
  depositRemindersSent: z.number().optional(),
});

const invoiceSchema = z.object({
  jobId: z.string().uuid().optional(),
  contactId: z.string().uuid(),
  title: z.string().optional(), // Added title field
  dueDate: z.string().optional(),
  paymentMethod: z.enum(["cash", "card", "bank_transfer", "other"]).optional(),
  subtotal: z.string(),
  taxAmount: z.string().optional(),
  totalAmount: z.string(),
  notes: z.string().optional(),
  publicToken: z.string().uuid().optional(), // Added publicToken
  status: z.enum(["draft", "sent", "paid", "cancelled", "overdue", "deposit"]).optional(),
  paidAt: z.date().optional(),
  sentAt: z.date().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  createdBy: z.string().uuid().optional(),
  businessId: z.string().uuid().optional(),
  invoiceNumber: z.string().optional(), // Auto-generated
  remindersSent: z.number().optional(),
  lastReminderSentAt: z.date().optional(),
  invoiceType: z.enum(["standard", "deposit", "final"]).optional(), // Added invoiceType
  depositAmount: z.string().optional(),
  balanceDue: z.string().optional(),
});

// Schema for updating invoices, allowing partial updates
const updateInvoiceSchema = invoiceSchema.partial();

// Google Business Profile Validation Schemas
const gbpClaimSchema = z.object({
  businessId: z.string().uuid(),
});

const gbpVerifySchema = z.object({
  businessId: z.string().uuid(),
  verificationToken: z.string(),
});

const gbpProfileUpdateSchema = z.object({
  gbpPrimaryCategory: z.string().optional(),
  gbpSecondaryCategoriesIds: z.array(z.string()).optional(),
  gbpSecondaryCategories: z.array(z.string()).optional(),
  gbpDescription: z.string().optional(),
  gbpCoverPhotoUrl: z.string().url().optional().or(z.literal("")),
  gbpOperatingHours: z.record(z.any()).optional(),
  gbpServiceAreas: z.array(z.string()).optional(),
  gbpWebsiteLinks: z.record(z.any()).optional(),
  gbpBusinessHours: z.record(z.any()).optional(),

  // Structured Operating Hours
  gbpRegularHours: z.object({
    monday: z.object({ open: z.string(), close: z.string(), closed: z.boolean().optional() }).optional(),
    tuesday: z.object({ open: z.string(), close: z.string(), closed: z.boolean().optional() }).optional(),
    wednesday: z.object({ open: z.string(), close: z.string(), closed: z.boolean().optional() }).optional(),
    thursday: z.object({ open: z.string(), close: z.string(), closed: z.boolean().optional() }).optional(),
    friday: z.object({ open: z.string(), close: z.string(), closed: z.boolean().optional() }).optional(),
    saturday: z.object({ open: z.string(), close: z.string(), closed: z.boolean().optional() }).optional(),
    sunday: z.object({ open: z.string(), close: z.string(), closed: z.boolean().optional() }).optional(),
  }).optional(),

  // Special Hours
  gbpSpecialHours: z.array(z.object({
    startDate: z.string(),
    endDate: z.string(),
    openTime: z.string().optional(),
    closeTime: z.string().optional(),
    reason: z.string().optional(),
    closed: z.boolean().optional(),
  })).optional(),

  // Service Areas
  gbpServiceAreaType: z.enum(["RADIUS", "POSTAL_CODES", "AREAS"]).optional(),
  gbpServiceAreaRadius: z.object({
    centerLatitude: z.number().optional(),
    centerLongitude: z.number().optional(),
    radiusKm: z.number().optional(),
  }).optional(),
  gbpServiceAreaPostalCodes: z.array(z.string()).optional(),

  // Services
  gbpPrimaryService: z.string().optional(),
  gbpSecondaryServices: z.array(z.object({
    serviceId: z.string().optional(),
    serviceName: z.string(),
    description: z.string().optional(),
    price: z.number().optional(),
    priceRange: z.string().optional(),
    serviceType: z.string().optional(),
  })).optional(),

  // Attributes
  gbpAttributeKeywords: z.array(z.string()).optional(),
  gbpBusinessAttributes: z.record(z.union([z.string(), z.boolean()])).optional(),
  gbpCategorySpecificAttributes: z.record(z.union([z.string(), z.boolean()])).optional(),
  gbpCustomAttributes: z.array(z.object({
    name: z.string(),
    value: z.string(),
  })).optional(),

  // Photos & Media
  gbpProfilePhotoUrl: z.string().url().optional().or(z.literal("")),
  gbpPhotosUrls: z.array(z.object({
    url: z.string(),
    caption: z.string().optional(),
    uploadedAt: z.string().optional(),
    googlePhotoId: z.string().optional(),
    category: z.string().optional(),
  })).optional(),
  gbpVideosUrls: z.array(z.object({
    url: z.string(),
    title: z.string().optional(),
    uploadedAt: z.string().optional(),
  })).optional(),

  // Social & Communication
  gbpFacebookUrl: z.string().url().optional().or(z.literal("")),
  gbpInstagramUrl: z.string().url().optional().or(z.literal("")),
  gbpTwitterUrl: z.string().url().optional().or(z.literal("")),
  gbpLinkedInUrl: z.string().url().optional().or(z.literal("")),
  gbpYoutubeUrl: z.string().url().optional().or(z.literal("")),
  gbpTikTokUrl: z.string().url().optional().or(z.literal("")),
  gbpWhatsappEnabled: z.boolean().optional(),
  gbpWhatsappNumber: z.string().optional(),
  gbpMessagingConfig: z.object({
    responseTimeMinutes: z.number().optional(),
    autoReplyEnabled: z.boolean().optional(),
    autoReplyMessage: z.string().optional(),
  }).optional(),

  // Booking
  gbpAppointmentBookingUrl: z.string().url().optional().or(z.literal("")),

  // Opening Date
  gbpOpeningDate: z.string().optional(),
  gbpBusinessStatus: z.enum(["OPEN", "CLOSED_TEMPORARILY", "CLOSED_PERMANENTLY"]).optional(),
  gbpCurrentlyOpen: z.boolean().optional(),
  gbpTemporaryClosureStartDate: z.string().optional(),
  gbpTemporaryClosureEndDate: z.string().optional(),

  // Office Visit Policy
  gbpOfficeVisitPolicy: z.enum(["ALLOW", "BY_APPOINTMENT", "NOT_ALLOWED"]).optional(),
});

const gbpFeatureToggleSchema = z.object({
  featureName: z.enum(["posts", "booking_integration", "local_services_ads", "messaging"]),
  enabled: z.boolean(),
});

const gbpSyncStatusUpdateSchema = z.object({
  gbpSyncStatus: z.enum(["idle", "syncing", "error", "pending"]),
  gbpLastSyncErrorMessage: z.string().optional(),
});

const gbpAnalyticsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  metrics: z.array(z.enum([
    "reviews", "rating", "photos", "website_clicks",
    "directions", "calls", "posts_engagement"
  ])).optional(),
});

const gbpDisconnectSchema = z.object({
  confirm: z.literal(true, { errorMap: () => ({ message: "Must confirm disconnection" }) }),
});

const testimonialSchema = z.object({
  contactId: z.string().uuid().optional(),
  authorName: z.string().min(1, "Author name is required"),
  authorTitle: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  testimonialText: z.string().min(1, "Testimonial text is required"),
  avatarUrl: z.string().optional(),
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  isFeatured: z.boolean().optional(),
});

// Helper function to generate sequential numbers - uses global sequence to avoid collisions
async function generateQuoteNumber(businessId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `Q-${year}`;

  // Query the database using parameterized SQL to prevent SQL injection
  // Pattern is safely embedded in the SQL template
  const result = await db.execute(sql`
    SELECT MAX(CAST(SUBSTRING(quote_number FROM '[0-9]+$') AS INTEGER)) as max_num
    FROM quotes
    WHERE quote_number LIKE ${prefix || ''} || '-%'
  `);

  const maxNum = result.rows[0]?.max_num || 0;
  const nextNumber = maxNum + 1;
  return `${prefix}-${nextNumber.toString().padStart(4, '0')}`;
}

async function generateJobNumber(businessId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `J-${year}`;

  // Query the database using parameterized SQL to prevent SQL injection
  const result = await db.execute(sql`
    SELECT MAX(CAST(SUBSTRING(job_number FROM '[0-9]+$') AS INTEGER)) as max_num
    FROM jobs
    WHERE job_number LIKE ${prefix || ''} || '-%'
  `);

  const maxNum = result.rows[0]?.max_num || 0;
  const nextNumber = maxNum + 1;
  return `${prefix}-${nextNumber.toString().padStart(4, '0')}`;
}

async function generateInvoiceNumber(businessId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}`;

  // Query the database using parameterized SQL to prevent SQL injection
  const result = await db.execute(sql`
    SELECT MAX(CAST(SUBSTRING(invoice_number FROM '[0-9]+$') AS INTEGER)) as max_num
    FROM invoices
    WHERE invoice_number LIKE ${prefix || ''} || '-%'
  `);

  const maxNum = result.rows[0]?.max_num || 0;
  const nextNumber = maxNum + 1;
  return `${prefix}-${nextNumber.toString().padStart(4, '0')}`;
}

export async function registerRoutes(app: Express): Promise<Server> {

  // Setup Google Auth
  setupGoogleAuth(app);

  // ============================================================================
  // PUBLIC ROUTES (No Auth Required)
  // ============================================================================

  // Google Maps API key endpoint (for client-side usage)
  // Tells the client which optional integrations are switched on, so the UI
  // can hide controls for things this deployment has not configured.
  app.get("/api/config/features", (_req, res) => {
    res.json({
      googleAuth: isGoogleAuthConfigured(),
      aiQuoting: features.aiQuoting,
      whatsapp: features.whatsapp,
      deposits: features.deposits,
      invoicing: features.invoicing,
      bookingMode: features.bookingMode,
    });
  });

  app.get("/api/config/google-maps-key", (_req, res) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(404).json({ error: "Google Maps API key not configured" });
    }
    res.json({ apiKey });
  });

  // Public services for quote request - accessible without auth
  app.get('/api/public/services/:slug', async (req: Request, res: Response) => {
    try {
      const business = await storage.getBusinessBySlug(req.params.slug);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      const services = await storage.getServicesByBusinessId(business.id);
      const activeServices = services.filter(s => s.isActive);

      res.json({
        business: {
          id: business.id,
          businessName: business.businessName,
          slug: business.slug,
          logoUrl: business.logoUrl,
          primaryColor: business.primaryColor,
          businessWhatsapp: business.businessWhatsapp,
        },
        services: activeServices.map(s => ({
          id: s.id,
          serviceName: s.serviceName,
          description: s.description,
          category: s.category,
          basePrice: s.basePrice,
          serviceQuestions: s.serviceQuestions,
          imageAnalysisConfig: s.imageAnalysisConfig,
        })),
      });
    } catch (error) {
      console.error("Get public services error:", error);
      res.status(500).json({ message: "Failed to get services" });
    }
  });

  // Get availability for quote visits
  app.get('/api/public/:slug/availability', async (req: Request, res: Response) => {
    try {
      const business = await storage.getBusinessBySlug(req.params.slug);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      const { month } = req.query;

      // Calculate date range using business settings
      const now = new Date();
      const minimumNoticeHours = business.minimumNoticeHours || 24;
      const bookingWindowDays = business.bookingWindowDays || 14;

      // Calculate the earliest allowed booking time (now + minimum notice)
      const earliestAllowed = new Date(now);
      earliestAllowed.setHours(earliestAllowed.getHours() + minimumNoticeHours);

      // Calculate the latest allowed booking time (now + booking window)
      const latestAllowed = new Date(now);
      latestAllowed.setDate(latestAllowed.getDate() + bookingWindowDays);
      latestAllowed.setHours(23, 59, 59, 999);

      let startDate = new Date(earliestAllowed);
      startDate.setHours(0, 0, 0, 0); // Start of day for earliest allowed date

      let endDate = new Date(latestAllowed);

      // If filtering by month, intersect with the allowed range
      if (month) {
        const [year, monthNum] = (month as string).split('-').map(Number);
        const monthStart = new Date(year, monthNum - 1, 1);
        const monthEnd = new Date(year, monthNum, 0, 23, 59, 59, 999);

        // Use the later of monthStart and startDate
        if (monthStart > startDate) {
          startDate = monthStart;
        }

        // Use the earlier of monthEnd and endDate
        if (monthEnd < endDate) {
          endDate = monthEnd;
        }
      }

      // Get existing jobs for this business
      const jobs = await storage.getJobsByBusinessId(business.id);

      // Get business calendar settings
      const calendarHours = business.calendarHours as any || {
        monday: { start: "09:00", end: "17:00" },
        tuesday: { start: "09:00", end: "17:00" },
        wednesday: { start: "09:00", end: "17:00" },
        thursday: { start: "09:00", end: "17:00" },
        friday: { start: "09:00", end: "17:00" },
        saturday: null,
        sunday: null,
      };

      const visitDuration = business.quoteVisitDurationMinutes || 60;
      const bufferTime = business.bufferBetweenVisitsMinutes || 15;
      const slotInterval = business.timeSlotIntervalMinutes || 15;

      // Calculate available slots
      const { AvailabilityService } = await import('./availability-service');
      const allSlots = AvailabilityService.getAvailableSlots(
        calendarHours,
        jobs,
        visitDuration,
        bufferTime,
        slotInterval,
        startDate,
        endDate
      );

      // Filter slots to remove those that violate minimum notice
      const filteredSlots: Record<string, string[]> = {};

      for (const [dateStr, times] of Object.entries(allSlots)) {
        const validTimes = times.filter(time => {
          const [hours, minutes] = time.split(':').map(Number);
          const slotDateTime = new Date(dateStr);
          slotDateTime.setHours(hours, minutes, 0, 0);

          // Check if slot is after minimum notice AND before booking window
          return slotDateTime >= earliestAllowed && slotDateTime <= latestAllowed;
        });

        if (validTimes.length > 0) {
          filteredSlots[dateStr] = validTimes;
        }
      }

      res.json(filteredSlots);
    } catch (error) {
      console.error("Get availability error:", error);
      res.status(500).json({ message: "Failed to get availability" });
    }
  });

  // Get existing job for accepted quote
  app.get('/api/public/quote/:quoteId/job', async (req: Request, res: Response) => {
    try {
      const { quoteId } = req.params;
      const { token } = req.query;

      if (!token) {
        return res.status(401).json({ message: "Access token required" });
      }

      const quote = await storage.getQuote(quoteId, '');
      if (!quote || quote.publicToken !== token) {
        return res.status(404).json({ message: "Quote not found or invalid token" });
      }

      // Find job for this quote (include pending_deposit status)
      const jobs = await storage.getJobsByBusinessId(quote.businessId);
      const job = jobs.find(j => j.quoteId === quote.id && (j.status === 'scheduled' || j.status === 'draft' || j.status === 'pending_deposit'));

      res.json({ job: job || null });
    } catch (error) {
      console.error("Get quote job error:", error);
      res.status(500).json({ message: "Failed to get booking details" });
    }
  });

  // Reschedule quote visit appointment
  app.post('/api/public/quotes/:id/reschedule', async (req: Request, res: Response) => {
    try {
      console.log('🔄 Reschedule Request:', {
        quoteId: req.params.id,
        body: req.body,
      });

      const { token, date, time, notes, oldJobId } = req.body;

      if (!token || !date || !time || !oldJobId) {
        console.error('❌ Missing required fields');
        return res.status(400).json({
          message: "Missing required fields",
        });
      }

      // Validate quote exists and token matches
      const quote = await storage.getQuote(req.params.id, '');
      if (!quote || quote.publicToken !== token) {
        console.error('❌ Quote not found or token mismatch');
        return res.status(404).json({ message: "Quote not found" });
      }

      const business = await storage.getBusiness(quote.businessId);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      const contact = await storage.getContact(quote.contactId, quote.businessId);
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }

      // Validate the scheduledDate
      const scheduledDate = new Date(date);
      const [hours, minutes] = time.split(':').map(Number);
      scheduledDate.setHours(hours, minutes, 0, 0);
      console.log('⏰ Scheduled for:', scheduledDate);

      // ENFORCE MINIMUM NOTICE RULE
      const minimumNoticeHours = business.minimumNoticeHours || 24;
      const now = new Date();
      const earliestAllowed = new Date(now);
      earliestAllowed.setHours(earliestAllowed.getHours() + minimumNoticeHours);

      console.log('⏱️ Minimum notice check:', {
        minimumNoticeHours,
        now: now.toISOString(),
        earliestAllowed: earliestAllowed.toISOString(),
        scheduledDate: scheduledDate.toISOString(),
        isValid: scheduledDate >= earliestAllowed
      });

      if (scheduledDate < earliestAllowed) {
        console.error('❌ Minimum notice violation');
        return res.status(400).json({
          message: `Booking must be at least ${minimumNoticeHours} hours in advance. Please select a later time.`
        });
      }

      // ENFORCE BOOKING WINDOW RULE
      const bookingWindowDays = business.bookingWindowDays || 14;
      const latestAllowed = new Date(now);
      latestAllowed.setDate(latestAllowed.getDate() + bookingWindowDays);
      latestAllowed.setHours(23, 59, 59, 999);

      console.log('📆 Booking window check:', {
        bookingWindowDays,
        latestAllowed: latestAllowed.toISOString(),
        scheduledDate: scheduledDate.toISOString(),
        isValid: scheduledDate <= latestAllowed
      });

      if (scheduledDate > latestAllowed) {
        console.error('❌ Booking window violation');
        return res.status(400).json({
          message: `Booking cannot be more than ${bookingWindowDays} days in advance. Please select an earlier date.`
        });
      }

      // Calculate end time
      const visitDuration = business.quoteVisitDurationMinutes || 60;
      const endTime = new Date(scheduledDate);
      endTime.setMinutes(endTime.getMinutes() + visitDuration);
      const scheduledEndTime = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;
      console.log('⏰ Visit times:', { time, scheduledEndTime, visitDuration });

      console.log('📝 Updating existing job:', oldJobId);

      // Calculate deposit deadline if deposit is required
      let depositDeadline = undefined;
      const job_to_update = await storage.getJob(oldJobId, business.id);
      if (job_to_update && job_to_update.status === 'pending_deposit') {
        const depositThresholdHours = business.depositCancellationThresholdHours || 24;
        const scheduledDateTime = new Date(scheduledDate);
        scheduledDateTime.setHours(hours, minutes, 0, 0);
        depositDeadline = new Date(scheduledDateTime.getTime() - (depositThresholdHours * 60 * 60 * 1000));
        console.log('⏰ Deposit deadline calculated:', {
          scheduledDateTime: scheduledDateTime.toISOString(),
          depositDeadline: depositDeadline.toISOString(),
          depositThresholdHours
        });
      }

      const job = await storage.updateJob(oldJobId, business.id, {
        scheduledDate: date,
        scheduledStartTime: time,
        scheduledEndTime: scheduledEndTime,
        depositDeadline: depositDeadline,
        internalNotes: notes || undefined,
        updatedAt: new Date(),
      });

      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Send confirmation notifications following multi-channel communication flow
      const { getQuoteVisitConfirmationTemplate } = await import('./email-templates');

      const visitDate = new Date(date).toLocaleDateString('en-ZA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      console.log(`\n📤 [Reschedule] Processing notifications for ${contact.fullName}`);
      console.log(`📋 [Reschedule] Contact details:`, {
        whatsappOptIn: contact.whatsappOptIn,
        phone: contact.phone,
        preferredChannel: contact.preferredChannel,
        whatsappProvider: business.whatsappProvider
      });

      // Build reschedule link for customer
      const baseUrl = getPublicBaseUrl();
      const rescheduleLink = `${baseUrl}/quote/${quote.id}?token=${quote.publicToken}`;

      // MULTI-CHANNEL LOGIC: WhatsApp First (if opted in)
      const { sendWhatsAppNotification } = await import('./whatsapp-notification');

      const whatsappResult = await sendWhatsAppNotification({
        business,
        contact,
        messageBody: `Hi ${contact.fullName}, your site visit has been RESCHEDULED!\n\nQuote: ${quote.quoteNumber}\nNew Date: ${visitDate}\nTime: ${time}\nLocation: ${quote.locationAddress || contact.address || 'Not specified'}\n\nNeed to reschedule again? ${rescheduleLink}\n\n- ${business.businessName}`,
        templateName: 'quote_visit_rescheduled',
        relatedType: 'job',
        relatedId: job.id,
      });

      if (whatsappResult.sent) {
        console.log(`✅ [Reschedule] WhatsApp notification sent`);
      } else {
        console.log(`⚠️ [Reschedule] WhatsApp skipped: ${whatsappResult.reason || whatsappResult.error}`);
      }


      // Email: Send if preferred channel is email or both, OR as fallback
      if (contact.email && (
        !contact.whatsappOptIn ||
        contact.preferredChannel === 'email' ||
        contact.preferredChannel === 'both'
      )) {
        console.log(`📧 [Reschedule] Queueing email to ${contact.email}`);

        const emailContent = getQuoteVisitConfirmationTemplate({
          businessName: business.businessName,
          recipientName: contact.fullName,
          quoteNumber: quote.quoteNumber,
          visitDate,
          visitTime: time,
          locationAddress: quote.locationAddress || contact.address || '',
          businessPhone: business.phone || '',
          businessEmail: business.email,
        });

        // Queue customer email
        await storage.createEmailQueueItem({
          businessId: business.id,
          toEmail: contact.email,
          toName: contact.fullName,
          subject: `Rescheduled: ${emailContent.subject}`,
          bodyHtml: emailContent.html,
          bodyText: emailContent.text,
          status: 'pending',
          relatedType: 'job',
          relatedId: job.id,
        });

        console.log(`✅ [Reschedule] Customer email queued successfully`);
      }

      // Queue business owner notification email
      await storage.createEmailQueueItem({
        businessId: business.id,
        toEmail: business.email,
        toName: business.ownerName || business.businessName,
        subject: `Quote Visit Rescheduled - ${quote.quoteNumber}`,
        bodyHtml: `<p>A quote visit has been rescheduled:</p>
          <ul>
            <li>Quote: ${quote.quoteNumber}</li>
            <li>Customer: ${contact.fullName}</li>
            <li>New Date: ${visitDate}</li>
            <li>New Time: ${time}</li>
            <li>Location: ${quote.locationAddress || contact.address || 'Not specified'}</li>
          </ul>`,
        bodyText: `A quote visit has been rescheduled:
          - Quote: ${quote.quoteNumber}
          - Customer: ${contact.fullName}
          - New Date: ${visitDate}
          - New Time: ${time}
          - Location: ${quote.locationAddress || contact.address || 'Not specified'}`,
        status: 'pending',
        relatedType: 'job',
        relatedId: job.id,
      });

      // Process queues
      console.log(`⚙️ [Reschedule] Processing email queue...`);
      await processEmailQueue(storage, business.id);

      if (business.whatsappProvider) {
        console.log(`⚙️ [Reschedule] Processing WhatsApp queue...`);
        const { processWhatsAppQueue } = await import('./whatsapp-queue');
        await processWhatsAppQueue(business.id);
      }

      // Log activity: booking_rescheduled
      await storage.createActivityLog({
        businessId: business.id,
        action: "booking_rescheduled",
        entityType: "job",
        entityId: job.id,
        changes: {
          oldDate: oldJobId, // In real scenario, we'd fetch old date first
          newDate: date,
          newTime: time,
          notes: notes || null,
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json({
        success: true,
        job,
        message: "Site visit rescheduled successfully"
      });
    } catch (error) {
      console.error("❌ Reschedule error:", error);
      res.status(500).json({
        message: "Failed to reschedule visit",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Book quote visit appointment
  app.post('/api/public/quotes/:id/book', async (req: Request, res: Response) => {
    try {
      console.log('📅 Booking Request:', {
        quoteId: req.params.id,
        body: req.body,
        hasToken: !!req.body.token,
        hasDate: !!req.body.date,
        hasTime: !!req.body.time
      });

      const { token, date, time, notes } = req.body;

      if (!token || !date || !time) {
        console.error('❌ Missing required fields:', { token: !!token, date: !!date, time: !!time });
        return res.status(400).json({
          message: "Missing required fields",
          details: { hasToken: !!token, hasDate: !!date, hasTime: !!time }
        });
      }

      // Validate quote exists and token matches
      console.log('🔍 Looking for quote:', req.params.id);
      const quote = await storage.getQuote(req.params.id, '');
      console.log('📋 Quote found:', {
        found: !!quote,
        publicToken: quote?.publicToken,
        tokenMatch: quote?.publicToken === token
      });

      if (!quote || quote.publicToken !== token) {
        console.error('❌ Quote not found or token mismatch');
        return res.status(404).json({ message: "Quote not found" });
      }

      console.log('🏢 Getting business and contact...');
      const business = await storage.getBusiness(quote.businessId);
      if (!business) {
        console.error('❌ Business not found:', quote.businessId);
        return res.status(404).json({ message: "Business not found" });
      }

      const contact = await storage.getContact(quote.contactId, quote.businessId);
      if (!contact) {
        console.error('❌ Contact not found:', quote.contactId);
        return res.status(404).json({ message: "Contact not found" });
      }

      // Parse date and time
      console.log('📅 Parsing date/time:', { date, time });
      const scheduledDate = new Date(date);
      const [hours, minutes] = time.split(':').map(Number);
      scheduledDate.setHours(hours, minutes, 0, 0);
      console.log('⏰ Scheduled for:', scheduledDate);

      // ENFORCE MINIMUM NOTICE RULE
      const minimumNoticeHours = business.minimumNoticeHours || 24;
      const now = new Date();
      const earliestAllowed = new Date(now);
      earliestAllowed.setHours(earliestAllowed.getHours() + minimumNoticeHours);

      console.log('⏱️ Minimum notice check:', {
        minimumNoticeHours,
        now: now.toISOString(),
        earliestAllowed: earliestAllowed.toISOString(),
        scheduledDate: scheduledDate.toISOString(),
        isValid: scheduledDate >= earliestAllowed
      });

      if (scheduledDate < earliestAllowed) {
        console.error('❌ Minimum notice violation');
        return res.status(400).json({
          message: `Booking must be at least ${minimumNoticeHours} hours in advance. Please select a later time.`
        });
      }

      // ENFORCE BOOKING WINDOW RULE
      const bookingWindowDays = business.bookingWindowDays || 14;
      const latestAllowed = new Date(now);
      latestAllowed.setDate(latestAllowed.getDate() + bookingWindowDays);
      latestAllowed.setHours(23, 59, 59, 999);

      console.log('📆 Booking window check:', {
        bookingWindowDays,
        latestAllowed: latestAllowed.toISOString(),
        scheduledDate: scheduledDate.toISOString(),
        isValid: scheduledDate <= latestAllowed
      });

      if (scheduledDate > latestAllowed) {
        console.error('❌ Booking window violation');
        return res.status(400).json({
          message: `Booking cannot be more than ${bookingWindowDays} days in advance. Please select an earlier date.`
        });
      }

      // Calculate end time based on visit duration
      const visitDuration = business.quoteVisitDurationMinutes || 60;
      const endTime = new Date(scheduledDate);
      endTime.setMinutes(endTime.getMinutes() + visitDuration);
      const scheduledEndTime = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;
      console.log('⏰ Visit times:', { time, scheduledEndTime, visitDuration });

      // Check if a job already exists for this quote (created during quote acceptance)
      console.log('🔍 Checking for existing job...');
      const jobs = await storage.getJobsByBusinessId(business.id);
      let job = jobs.find(j => j.quoteId === quote.id && (j.status === 'draft' || j.status === 'pending_deposit'));

      if (job) {
        // Update existing job with schedule details
        console.log('✅ Found existing job:', job.jobNumber, 'with status:', job.status);
        console.log('📝 Updating job with schedule:', {
          scheduledDate: date,
          scheduledStartTime: time,
          scheduledEndTime,
        });

        // Determine new status based on deposit requirement:
        // - pending_deposit → stays pending_deposit (needs payment)
        // - draft → becomes scheduled (no deposit, just needed booking)
        const newStatus = job.status === 'pending_deposit' ? 'pending_deposit' : 'scheduled';

        // Calculate deposit deadline if deposit is required
        let depositDeadline = undefined;
        if (job.status === 'pending_deposit') {
          const depositThresholdHours = business.depositCancellationThresholdHours || 24;
          const scheduledDateTime = new Date(scheduledDate);
          scheduledDateTime.setHours(hours, minutes, 0, 0);
          depositDeadline = new Date(scheduledDateTime.getTime() - (depositThresholdHours * 60 * 60 * 1000));
          console.log('⏰ Deposit deadline calculated:', {
            scheduledDateTime: scheduledDateTime.toISOString(),
            depositDeadline: depositDeadline.toISOString(),
            depositThresholdHours
          });
        }

        job = await storage.updateJob(job.id, business.id, {
          status: newStatus,
          scheduledDate: date,
          scheduledStartTime: time,
          scheduledEndTime,
          depositDeadline: depositDeadline,
          internalNotes: notes || job.internalNotes,
        });

        console.log('✅ Job updated successfully:', job.jobNumber, 'with status:', job.status);
      } else {
        // No existing job - create new one with retry logic (fallback case)
        console.log('⚠️ No existing job found (draft or pending_deposit), creating new one...');

        let retries = 0;
        const maxRetries = 5;

        while (retries < maxRetries && !job) {
          try {
            const jobNumber = await generateJobNumber(business.id);
            console.log(`🔢 Generated job number (attempt ${retries + 1}):`, jobNumber);

            console.log('💼 Creating job with data:', {
              businessId: business.id,
              contactId: quote.contactId,
              quoteId: quote.id,
              jobNumber,
              scheduledDate: date,
              scheduledStartTime: time,
              scheduledEndTime,
            });

            job = await storage.createJob({
              businessId: business.id,
              contactId: quote.contactId,
              quoteId: quote.id || undefined,
              assignedTo: undefined,
              jobNumber,
              title: `Site Visit`,
              description: undefined,
              status: "scheduled",
              jobType: "quote_visit",
              scheduledDate: date,
              scheduledStartTime: time || undefined,
              scheduledEndTime: scheduledEndTime || undefined,
              locationAddress: quote.locationAddress || contact.address || undefined,
              internalNotes: notes || undefined,
              subtotal: undefined,
              taxAmount: undefined,
              discountAmount: undefined,
              totalAmount: undefined,
            });

            console.log('✅ Job created successfully:', job.jobNumber);
          } catch (createError: any) {
            // Check if it's a duplicate job number error
            if (createError.code === '23505' && createError.constraint === 'jobs_job_number_unique') {
              retries++;
              console.log(`⚠️ Duplicate job number detected, retrying (${retries}/${maxRetries})...`);
              if (retries >= maxRetries) {
                console.error(`❌ Failed to generate unique job number after ${maxRetries} attempts`);
                throw new Error("Unable to generate unique job number after multiple attempts. Please try again.");
              }
              // Wait with exponential backoff before retrying
              await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, retries - 1)));
              continue;
            }
            // Other database errors - rethrow immediately
            console.error("❌ Job creation error (non-duplicate):", createError);
            throw createError;
          }
        }

        if (!job) {
          throw new Error("Failed to create job after multiple attempts");
        }
      }

      // Send confirmation notifications following multi-channel communication flow
      const { getQuoteVisitConfirmationTemplate } = await import('./email-templates');

      const visitDate = new Date(date).toLocaleDateString('en-ZA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      console.log(`\n📤 [Booking] Processing notifications for ${contact.fullName}`);
      console.log(`📋 [Booking] Contact details:`, {
        whatsappOptIn: contact.whatsappOptIn,
        phone: contact.phone,
        preferredChannel: contact.preferredChannel,
        whatsappProvider: business.whatsappProvider
      });

      // Build reschedule link for customer
      const baseUrl = getPublicBaseUrl();
      const rescheduleLink = `${baseUrl}/quote/${quote.id}?token=${quote.publicToken}`;

      // MULTI-CHANNEL LOGIC: WhatsApp First (if opted in)
      const { sendWhatsAppNotification } = await import('./whatsapp-notification');

      const whatsappResult = await sendWhatsAppNotification({
        business,
        contact,
        messageBody: `Hi ${contact.fullName}, your site visit has been confirmed!\n\nQuote: ${quote.quoteNumber}\nDate: ${visitDate}\nTime: ${time}\nLocation: ${quote.locationAddress || contact.address || 'Not specified'}\n\nNeed to reschedule? ${rescheduleLink}\n\n- ${business.businessName}`,
        templateName: 'quote_visit_confirmation',
        relatedType: 'job',
        relatedId: job.id,
      });

      if (whatsappResult.sent) {
        console.log(`✅ [Booking] WhatsApp notification sent`);
      } else {
        console.log(`⚠️ [Booking] WhatsApp skipped: ${whatsappResult.reason || whatsappResult.error}`);
      }

      // Email: Send if preferred channel is email or both, OR as fallback
      if (contact.email && (
        !contact.whatsappOptIn ||
        contact.preferredChannel === 'email' ||
        contact.preferredChannel === 'both' ||
        !whatsappResult.sent
      )) {
        console.log(`📧 [Booking] Queueing email to ${contact.email}`);

        const emailContent = getQuoteVisitConfirmationTemplate({
          businessName: business.businessName,
          recipientName: contact.fullName,
          quoteNumber: quote.quoteNumber,
          visitDate,
          visitTime: time,
          locationAddress: quote.locationAddress || contact.address || '',
          businessPhone: business.phone || '',
          businessEmail: business.email,
        });

        // Queue customer email
        await storage.createEmailQueueItem({
          businessId: business.id,
          toEmail: contact.email,
          toName: contact.fullName,
          subject: emailContent.subject,
          bodyHtml: emailContent.html,
          bodyText: emailContent.text,
          status: 'pending',
          relatedType: 'job',
          relatedId: job.id,
        });

        console.log(`✅ [Booking] Customer email queued successfully`);
      }

      // Queue business owner notification email
      await storage.createEmailQueueItem({
        businessId: business.id,
        toEmail: business.email,
        toName: business.ownerName || business.businessName,
        subject: `New Quote Visit Booked - ${quote.quoteNumber}`,
        bodyHtml: `<p>A new quote visit has been booked:</p>
          <ul>
            <li>Quote: ${quote.quoteNumber}</li>
            <li>Customer: ${contact.fullName}</li>
            <li>Date: ${visitDate}</li>
            <li>Time: ${time}</li>
            <li>Location: ${quote.locationAddress || contact.address || 'Not specified'}</li>
          </ul>`,
        bodyText: `A new quote visit has been booked:
          - Quote: ${quote.quoteNumber}
          - Customer: ${contact.fullName}
          - Date: ${visitDate}
          - Time: ${time}
          - Location: ${quote.locationAddress || contact.address || 'Not specified'}`,
        status: 'pending',
        relatedType: 'job',
        relatedId: job.id,
      });

      // Process queues
      console.log(`⚙️ [Booking] Processing email queue...`);
      await processEmailQueue(storage, business.id);

      if (business.whatsappProvider) {
        console.log(`⚙️ [Booking] Processing WhatsApp queue...`);
        const { processWhatsAppQueue } = await import('./whatsapp-queue');
        await processWhatsAppQueue(business.id);
      }

      // Log activity: booking_requested
      await ActivityLogger.bookingRequested(
        business.id,
        job.id,
        quote.contactId,
        {
          scheduledDate: date,
          scheduledTime: time,
          quoteNumber: quote.quoteNumber,
        },
        req.ip
      );

      res.json({
        success: true,
        job,
        message: "Site visit booked successfully"
      });
    } catch (error) {
      console.error("❌ Book visit error:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error
      });
      res.status(500).json({
        message: "Failed to book visit",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Public image analysis endpoint - analyze photos before quote submission
  app.post('/api/public/analyze-photos/:slug', async (req: Request, res: Response) => {
    try {
      const business = await storage.getBusinessBySlug(req.params.slug);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      const { serviceId, photos } = req.body;

      if (!serviceId || !photos || photos.length === 0) {
        return res.status(400).json({ message: "Service ID and at least one photo are required" });
      }

      // Get service details
      const service = await storage.getService(serviceId, business.id);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      // Check if image analysis is enabled for this service
      const imageConfig = service.imageAnalysisConfig as { enabled?: boolean } | undefined;
      if (!imageConfig?.enabled) {
        return res.json({
          success: true,
          message: "Image analysis not enabled for this service",
          analysisResult: null,
        });
      }

      // Perform AI image analysis
      const analysisResult = await aiQuoteService.analyzeServiceImages(photos, service);

      res.json({
        success: true,
        analysisResult,
      });
    } catch (error) {
      console.error("Photo analysis error:", error);
      res.status(500).json({
        message: "Failed to analyze photos",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Public quote request submission - accessible without auth
  app.post('/api/public/quote-request/:slug', async (req: Request, res: Response) => {
    try {
      const business = await storage.getBusinessBySlug(req.params.slug);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      const {
        serviceId,
        customerInput,
        photos,
        address,
        contactInfo,
        answers,
        serviceLocationType,
        imageAnalysisData, // Pre-analyzed photo data from /api/public/analyze-photos
      } = req.body;

      // Validate required fields
      if (!serviceId || !customerInput || !contactInfo?.fullName || (!contactInfo?.email && !contactInfo?.phone)) {
        return res.status(400).json({ message: "Missing required fields. Name and at least email or phone are required." });
      }

      // Find or create contact - check by email then phone
      let contact = null;

      if (contactInfo.email) {
        const contacts = await storage.getContactsByBusinessId(business.id);
        contact = contacts.find(c => c.email?.toLowerCase() === contactInfo.email.toLowerCase());
      }

      if (!contact && contactInfo.phone) {
        const contacts = await storage.getContactsByBusinessId(business.id);
        contact = contacts.find(c => c.phone === contactInfo.phone);
      }

      if (!contact) {
        // Create new contact
        contact = await storage.createContact({
          businessId: business.id,
          fullName: contactInfo.fullName,
          email: contactInfo.email || null,
          phone: contactInfo.phone || null,
          address: address || null,
          contactType: "lead",
          leadSource: "website",
          leadStatus: "new",
          preferredChannel: contactInfo.preferredChannel || "email",
          whatsappOptIn: contactInfo.whatsappOptIn || false,
        });
      } else {
        // Update existing contact's communication preferences
        contact = await storage.updateContact(contact.id, business.id, {
          preferredChannel: contactInfo.preferredChannel || "email",
          whatsappOptIn: contactInfo.whatsappOptIn || false,
        });
      }

      // Get service details
      const service = await storage.getService(serviceId, business.id);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      // Get all services for upselling
      const allServices = await storage.getServicesByBusinessId(business.id);

      // Determine location and distance based on service location type
      let locationAddress = address;
      let distanceKm = 0;
      let locationLatitude = null;
      let locationLongitude = null;

      console.log('🔍 Service Location Debug:', {
        serviceLocationType,
        address,
        businessAddress: `${business.addressLine1}, ${business.city}`,
        businessCoords: {
          lat: business.addressLatitude,
          lng: business.addressLongitude
        }
      });

      // If address is provided, it's always a customer location (override checkbox if needed)
      const actualLocationType = address && address.trim().length > 0 ? "customer" : serviceLocationType;

      if (actualLocationType === "business") {
        // Customer coming to business - use business address and zero distance
        locationAddress = `${business.addressLine1}, ${business.city}, ${business.province}`;
        distanceKm = 0;
        locationLatitude = business.addressLatitude;
        locationLongitude = business.addressLongitude;
        console.log('✅ Service at business location - no travel charge');
      } else {
        // Business traveling to customer - calculate distance
        if (address) {
          const { geocodingService } = await import('./geocoding-service');

          console.log('📍 Geocoding customer address:', address);

          // Geocode customer address
          const customerGeocode = await geocodingService.geocodeAddress(address);

          if (customerGeocode) {
            locationLatitude = customerGeocode.coordinates.lat.toString();
            locationLongitude = customerGeocode.coordinates.lng.toString();

            console.log('✅ Customer geocoded:', customerGeocode);

            // Calculate distance if business has coordinates
            if (business.addressLatitude && business.addressLongitude) {
              console.log('📏 Calculating distance...');

              const distance = await geocodingService.calculateDistance(
                {
                  lat: parseFloat(business.addressLatitude),
                  lng: parseFloat(business.addressLongitude),
                },
                customerGeocode.coordinates
              );

              if (distance) {
                distanceKm = distance.distanceKm;
                console.log('✅ Distance calculated:', distanceKm, 'km');
              } else {
                console.error('❌ Distance calculation returned null');
              }
            } else {
              console.error('❌ Business coordinates missing');
            }
          } else {
            console.error('❌ Customer geocoding failed');
          }
        }
      }

      // Map customer answers to pricing formula variables
      const mappedVariables: Record<string, any> = {};
      if (service.serviceQuestions && answers) {
        for (const question of service.serviceQuestions as any[]) {
          const answer = answers[question.question];
          if (answer !== undefined && question.variableName) {
            // Convert answer to appropriate type
            if (question.type === 'number') {
              mappedVariables[question.variableName] = parseFloat(answer) || 0;
            } else {
              // Extract numeric value from strings like "150 liters", "40000L pool", "50 sqm"
              const answerStr = answer.toString();
              const numericMatch = answerStr.match(/^(\d+(?:\.\d+)?)/);
              if (numericMatch) {
                // Found a number at the start - use it as numeric value
                mappedVariables[question.variableName] = parseFloat(numericMatch[1]);
                console.log(`🔢 Extracted numeric value: ${question.variableName} = ${mappedVariables[question.variableName]} (from "${answerStr}")`);
              } else {
                // No number found - keep as string (for non-numeric variables)
                mappedVariables[question.variableName] = answer;
              }
            }
            console.log(`📊 Mapped: ${question.variableName} = ${mappedVariables[question.variableName]} (from "${question.question}")`);
          }
        }
      }

      // Merge image analysis data with mapped variables (AI-extracted takes lower priority)
      // Customer answers override AI-extracted values
      if (imageAnalysisData?.extractedData) {
        console.log('📸 Image Analysis Data:', imageAnalysisData.extractedData);
        for (const [key, value] of Object.entries(imageAnalysisData.extractedData)) {
          if (mappedVariables[key] === undefined) {
            mappedVariables[key] = value;
            console.log(`📸 From Image: ${key} = ${value}`);
          } else {
            console.log(`⚠️ Image value for ${key} overridden by customer answer`);
          }
        }
      }

      // Generate AI quote with location context and mapped variables
      const locationContext = actualLocationType === "business"
        ? "Service will be performed at business location (customer coming to us - NO TRAVEL CHARGE)"
        : `Service will be performed at customer location: ${address || 'Not provided'}. Distance: ${distanceKm.toFixed(1)} km`;

      console.log('🤖 AI Context:', locationContext);
      console.log('📊 Mapped Variables:', mappedVariables);

      const combinedInput = `${customerInput}\n\n${locationContext}\n\nAnswers: ${JSON.stringify(answers || {})}\n\nMapped Variables: ${JSON.stringify(mappedVariables)}`;
      const aiResult = await aiQuoteService.generateQuote(
        service,
        combinedInput,
        photos,
        allServices,
        mappedVariables
      );

      // Create quote draft - use business.id (already defined)
      const quoteNumber = await generateQuoteNumber(business.id);

      // Generate public token for customer access
      const publicToken = crypto.randomUUID();

      const quote = await storage.createQuote({
        businessId: business.id,
        contactId: contact.id,
        quoteNumber,
        status: "ai_quote",
        validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days
        subtotal: aiResult.suggestedPrice.toFixed(2),
        taxAmount: (aiResult.suggestedPrice * 0.15).toFixed(2), // 15% VAT
        discountAmount: "0",
        totalAmount: (aiResult.suggestedPrice * 1.15).toFixed(2),
        notes: `AI-Generated Quote\n\n${aiResult.reasoning}\n\nConfidence: ${(aiResult.confidence * 100).toFixed(0)}%\n\nDistance: ${distanceKm.toFixed(1)} km`,
        locationAddress: locationAddress || null,
        locationLatitude: locationLatitude,
        locationLongitude: locationLongitude,
        serviceLocationType: actualLocationType || "customer",
        publicToken: publicToken,
        // createdBy is not set for public quote requests (no authenticated user)
      });

      // Create quote version with AI-generated line items
      const version = await storage.createQuoteVersion({
        quoteId: quote.id,
        versionNumber: 1,
        source: "ai",
        subtotal: aiResult.suggestedPrice.toFixed(2),
        taxAmount: (aiResult.suggestedPrice * 0.15).toFixed(2),
        discountAmount: "0",
        totalAmount: (aiResult.suggestedPrice * 1.15).toFixed(2),
        lineItems: aiResult.lineItems,
        aiExtractedFeatures: aiResult.extractedFeatures,
        aiConfidenceScore: aiResult.confidence.toFixed(2),
        aiReasoning: aiResult.reasoning,
        createdBy: undefined, // No authenticated user for public quote requests
      });

      // Update quote with version
      await storage.updateQuote(quote.id, business.id, {
        latestVersionId: version.id,
      });

      // Create line items (labor + materials)
      for (let i = 0; i < aiResult.lineItems.length; i++) {
        const item = aiResult.lineItems[i];
        await storage.createQuoteItem({
          quoteId: quote.id,
          serviceId: i === 0 ? service.id : undefined, // Only first item (labor) links to service
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
          displayOrder: i,
        });
      }

      const items = await storage.getQuoteItemsByQuoteId(quote.id);

      // Send notifications to customer
      console.log(`\n`);
      console.log(`📤 [AI Quote] Processing notifications for ${contact.fullName}`);
      console.log(`📋 [AI Quote] Contact details:`, {
        whatsappOptIn: contact.whatsappOptIn,
        phone: contact.phone,
        preferredChannel: contact.preferredChannel,
        whatsappProvider: business.whatsappProvider
      });

      // Build quote view link
      const baseUrl = getPublicBaseUrl();
      const quoteViewLink = `${baseUrl}/quotes/${quote.id}/view?token=${publicToken}`;

      // Save photos if provided
      if (photos && Array.isArray(photos) && photos.length > 0) {
        try {
          const { ObjectStorageService } = await import('./objectStorage');
          const storageService = new ObjectStorageService();
          
          for (let i = 0; i < photos.length; i++) {
            const photoData = photos[i];
            if (photoData.startsWith('data:')) {
              // Extract base64 content
              const matches = photoData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
              if (matches && matches.length === 3) {
                const mimeType = matches[1];
                const buffer = Buffer.from(matches[2], 'base64');
                const fileName = `quote-${quote.id}-photo-${i}.${mimeType.split('/')[1] || 'jpg'}`;
                
                // Upload to storage
                const fileUrl = await storageService.uploadPublicFile(
                  `quotes/${quote.id}`,
                  fileName,
                  buffer,
                  mimeType
                );
                
                // Create attachment record
                await storage.createAttachment({
                  businessId: business.id,
                  relatedType: "quote",
                  relatedId: quote.id,
                  fileName: fileName,
                  fileUrl: fileUrl,
                  fileSize: buffer.length,
                  mimeType: mimeType,
                });
                
                console.log(`📸 [AI Quote] Saved photo ${i+1}/${photos.length}: ${fileUrl}`);
              }
            }
          }
        } catch (uploadError) {
          console.error("❌ [AI Quote] Error saving photos:", uploadError);
          // Don't fail the whole request if photo upload fails
        }
      }

      // MULTI-CHANNEL LOGIC: WhatsApp First (if opted in)
      const { sendWhatsAppNotification } = await import('./whatsapp-notification');

      const whatsappResult = await sendWhatsAppNotification({
        business,
        contact,
        messageBody: `Hi ${contact.fullName}, your AI-generated quote ${quote.quoteNumber} is ready!\n\nTotal: R${parseFloat(quote.totalAmount).toFixed(2)}\nValid until: ${quote.validUntil || 'TBD'}\nConfidence: ${(aiResult.confidence * 100).toFixed(0)}%\n\nView quote: ${quoteViewLink}\n\n- ${business.businessName}`,
        templateName: 'quote_sent_whatsapp',
        relatedType: 'quote',
        relatedId: quote.id,
      });

      if (whatsappResult.sent) {
        console.log(`✅ [AI Quote] WhatsApp notification sent`);
      } else {
        console.log(`⚠️ [AI Quote] WhatsApp skipped: ${whatsappResult.reason || whatsappResult.error}`);
      }

      // Email: Send if preferred channel is email or both, OR as fallback
      if (contact.email && (
        !contact.whatsappOptIn ||
        contact.preferredChannel === 'email' ||
        contact.preferredChannel === 'both' ||
        !whatsappResult.sent // Fallback if WhatsApp failed or was skipped due to limits
      )) {
        console.log(`📧 [AI Quote] Queueing email to ${contact.email}`);
        const { getQuoteSentTemplate } = await import('./email-templates');
        const emailContent = getQuoteSentTemplate({
          businessName: business.businessName,
          senderName: business.senderName || business.businessName,
          recipientName: contact.fullName,
          quoteNumber: quote.quoteNumber,
          quoteTotal: `R${parseFloat(quote.totalAmount).toFixed(2)}`,
          validUntil: quote.validUntil || 'TBD',
          quoteViewLink,
          businessPhone: business.phone || '',
          businessEmail: business.email || '',
        });

        const emailQueueItem = await storage.createEmailQueueItem({
          businessId: business.id,
          toEmail: contact.email,
          toName: contact.fullName,
          subject: `${emailContent.subject} (AI-Generated)`,
          bodyHtml: emailContent.html,
          bodyText: emailContent.text,
          status: 'pending',
          relatedType: 'quote',
          relatedId: quote.id,
        });

        console.log(`✅ [AI Quote] Email queued successfully`);
      }

      // Log activity: quote_requested (now that quote exists)
      await ActivityLogger.quoteRequested(
        business.id,
        quote.id,
        contact.id,
        {
          service: service.serviceName,
          customerInput,
          estimatedValue: aiResult.suggestedPrice,
          aiConfidence: aiResult.confidence,
          source: "website",
        },
        req.ip
      );

      // Log activity: quote_sent
      await ActivityLogger.quoteSent(
        business.id,
        quote.id,
        contact.id,
        contact.whatsappOptIn ? "whatsapp" : "email"
      );

      // Queue business owner notification email
      await storage.createEmailQueueItem({
        businessId: business.id,
        toEmail: business.email,
        toName: business.ownerName || business.businessName,
        subject: `New AI Quote Request - ${quote.quoteNumber}`,
        bodyHtml: `<h2>New AI-Generated Quote! 🤖</h2>
          <p>A new quote has been automatically generated:</p>
          <ul>
            <li><strong>Quote:</strong> ${quote.quoteNumber}</li>
            <li><strong>Customer:</strong> ${contact.fullName}</li>
            <li><strong>Service:</strong> ${service.serviceName}</li>
            <li><strong>Total:</strong> R${parseFloat(quote.totalAmount).toFixed(2)}</li>
            <li><strong>AI Confidence:</strong> ${(aiResult.confidence * 100).toFixed(0)}%</li>
            <li><strong>Location:</strong> ${locationAddress || 'Not specified'}</li>
            ${distanceKm > 0 ? `<li><strong>Distance:</strong> ${distanceKm.toFixed(1)} km</li>` : ''}
          </ul>
          <p><strong>Customer Input:</strong></p>
          <p>${customerInput}</p>
          <p><strong>AI Reasoning:</strong></p>
          <p>${aiResult.reasoning}</p>`,
        bodyText: `New AI-Generated Quote!

Quote: ${quote.quoteNumber}
Customer: ${contact.fullName}
Service: ${service.serviceName}
Total: R${parseFloat(quote.totalAmount).toFixed(2)}
AI Confidence: ${(aiResult.confidence * 100).toFixed(0)}%
Location: ${locationAddress || 'Not specified'}
${distanceKm > 0 ? `Distance: ${distanceKm.toFixed(1)} km` : ''}

Customer Input:
${customerInput}

AI Reasoning:
${aiResult.reasoning}`,
        status: 'pending',
        relatedType: 'quote',
        relatedId: quote.id,
      });

      // Process queues
      console.log(`⚙️ [AI Quote] Processing email queue...`);
      await processEmailQueue(storage, business.id);

      if (business.whatsappProvider && whatsappResult.sent) {
        console.log(`⚙️ [AI Quote] Processing WhatsApp queue...`);
        const { processWhatsAppQueue } = await import('./whatsapp-queue');
        await processWhatsAppQueue(business.id);
      }

      console.log(`✅ [AI Quote] Quote ${quote.quoteNumber} created and notifications sent`);

      res.status(201).json({
        quote: { ...quote, items },
        aiAnalysis: {
          extractedFeatures: aiResult.extractedFeatures,
          confidence: aiResult.confidence,
          reasoning: aiResult.reasoning,
          upsellSuggestions: aiResult.upsellSuggestions,
        },
      });
    } catch (error) {
      console.error("Public quote request error:", error);
      res.status(500).json({ message: "Failed to process quote request" });
    }
  });

  // Public quote view - accessible with token
  app.get('/api/public/quote/:quoteId', async (req: Request, res: Response) => {
    try {
      const { quoteId } = req.params;
      const { token } = req.query;

      if (!token) {
        return res.status(401).json({ message: "Access token required" });
      }

      const quote = await storage.getQuote(quoteId, ''); // We'll verify token instead of businessId

      if (!quote || quote.publicToken !== token) {
        return res.status(404).json({ message: "Quote not found or invalid token" });
      }

      const business = await storage.getBusiness(quote.businessId);
      const contact = await storage.getContact(quote.contactId, quote.businessId);
      const items = await storage.getQuoteItemsByQuoteId(quote.id);

      // Log activity: quote_viewed (log every view)
      await ActivityLogger.quoteViewed(
        quote.businessId,
        quote.id,
        quote.contactId,
        req.ip
      );

      // Update quote viewedAt timestamp (only first time)
      if (!quote.viewedAt) {
        await storage.updateQuote(quoteId, quote.businessId, {
          viewedAt: new Date(),
          status: quote.status === 'sent' ? 'viewed' : quote.status,
        });
      }

      res.json({
        quote: {
          ...quote,
          items,
        },
        business: {
          ...business,
          slug: business?.slug || '',
        },
        contact,
      });
    } catch (error) {
      console.error("Get public quote error:", error);
      res.status(500).json({ message: "Failed to get quote" });
    }
  });

  // Public quote version - accessible with token
  app.get('/api/public/quote-version/:versionId', async (req: Request, res: Response) => {
    try {
      const { versionId } = req.params;
      const { token } = req.query;

      if (!token) {
        return res.status(401).json({ message: "Access token required" });
      }

      const version = await storage.getQuoteVersion(versionId);
      if (!version) {
        return res.status(404).json({ message: "Quote version not found" });
      }

      // Verify token by checking the parent quote
      const quote = await storage.getQuote(version.quoteId, '');
      if (!quote || quote.publicToken !== token) {
        return res.status(404).json({ message: "Invalid token" });
      }

      res.json(version);
    } catch (error) {
      console.error("Get public quote version error:", error);
      res.status(500).json({ message: "Failed to get quote version" });
    }
  });

  // Accept quote - public endpoint with token
  app.post("/api/public/quote/:quoteId/accept", async (req: Request, res: Response) => {
    try {
      const { quoteId } = req.params;
      const { token } = req.query;

      if (!token) {
        return res.status(400).json({ error: "Token is required" });
      }

      // Get quote and verify token
      const quote = await storage.getQuote(quoteId, '');
      if (!quote || quote.publicToken !== token) {
        return res.status(403).json({ error: "Invalid or expired token" });
      }

      // Update quote status to accepted
      const updatedQuote = await storage.updateQuote(quoteId, quote.businessId, {
        status: "accepted",
        acceptedAt: new Date(),
      });

      // Log activity: quote_accepted
      await ActivityLogger.quoteAccepted(
        quote.businessId,
        quote.id,
        quote.contactId,
        req.ip
      );

      // Fetch quote items
      const items = await storage.getQuoteItemsByQuoteId(quoteId);

      // Calculate deposit amount if required
      let depositAmount = 0;
      if (quote.requiresDeposit) {
        if (quote.depositAmount) {
          depositAmount = parseFloat(quote.depositAmount);
        } else if (quote.depositPercentage) {
          const totalAmount = parseFloat(quote.totalAmount);
          depositAmount = (totalAmount * parseFloat(quote.depositPercentage)) / 100;
        }
      }

      // Generate job number
      const jobNumber = await generateJobNumber(quote.businessId);

      // Determine job status based on deposit requirement
      // - With deposit: pending_deposit (waiting for payment + booking)
      // - Without deposit: draft (waiting for customer to book appointment)
      const jobStatus = quote.requiresDeposit ? 'pending_deposit' : 'draft';

      // Create job with appropriate status (no scheduledDate yet - customer will book)
      const job = await storage.createJob({
        businessId: quote.businessId,
        contactId: quote.contactId,
        quoteId: quote.id,
        jobNumber,
        title: quote.title || `Service from Quote ${quote.quoteNumber}`,
        description: quote.notes || `Job created from accepted quote ${quote.quoteNumber}`,
        status: jobStatus,
        jobType: 'regular',
        scheduledDate: null, // Customer will schedule via booking flow
        scheduledStartTime: null,
        scheduledEndTime: null,
        locationAddress: quote.locationAddress || null,
        subtotal: quote.subtotal,
        taxAmount: quote.taxAmount,
        discountAmount: quote.discountAmount,
        totalAmount: quote.totalAmount,
        depositInvoiceId: null, // Will be generated later if deposit required
        depositDeadline: null,
        depositPaid: false,
        depositRemindersSent: 0,
      });

      // Copy quote items to job items
      for (const item of items) {
        await storage.createJobItem({
          jobId: job.id,
          serviceId: item.serviceId || undefined,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
          displayOrder: item.displayOrder || 0,
        });
      }

      // Generate deposit invoice FIRST (if required)
      let depositInvoice = null;
      if (quote.requiresDeposit && depositAmount > 0) {
        try {
          const invoiceNumber = await generateInvoiceNumber(quote.businessId);
          const publicToken = crypto.randomUUID();
          const totalAmount = parseFloat(quote.totalAmount);
          const balanceDue = totalAmount - depositAmount;

          // Set deposit deadline (48 hours from now by default)
          const business = await storage.getBusiness(quote.businessId);
          const depositCancellationThresholdHours = business?.depositCancellationThresholdHours || 24;
          const depositDeadline = new Date();
          depositDeadline.setHours(depositDeadline.getHours() + depositCancellationThresholdHours);

          depositInvoice = await storage.createInvoice({
            businessId: quote.businessId,
            jobId: job.id, // Link to the newly created job
            contactId: quote.contactId,
            quoteId: quote.id,
            invoiceNumber,
            title: `Deposit - ${quote.title || `Quote ${quote.quoteNumber}`}`,
            invoiceType: "deposit",
            status: "sent",
            dueDate: depositDeadline.toISOString().split('T')[0],
            subtotal: depositAmount.toFixed(2),
            taxAmount: "0",
            totalAmount: depositAmount.toFixed(2),
            depositAmount: depositAmount.toFixed(2),
            balanceDue: balanceDue.toFixed(2),
            publicToken,
            notes: `Deposit payment required to confirm booking. Balance of R${balanceDue.toFixed(2)} due upon completion.`,
            createdBy: undefined, // Customer-initiated
          });

          // Update job with deposit invoice ID and deadline
          await storage.updateJob(job.id, quote.businessId, {
            depositInvoiceId: depositInvoice.id,
            depositDeadline: depositDeadline,
          });

          console.log(`✅ [Quote Accept] Deposit invoice generated: ${depositInvoice.invoiceNumber}`);
        } catch (error) {
          console.error(`❌ [Quote Accept] Failed to generate deposit invoice:`, error);
          throw new Error("Failed to generate deposit invoice");
        }
      }

      // Send notifications
      const business = await storage.getBusiness(quote.businessId);
      const contact = await storage.getContact(quote.contactId, quote.businessId);

      if (business && contact) {
        const baseUrl = getPublicBaseUrl();
        const invoiceViewLink = `${baseUrl}/invoices/${depositInvoice.id}/view?token=${depositInvoice.publicToken}`;

        // Build notification based on deposit requirement
        if (quote.requiresDeposit && depositInvoice) {
          // Send deposit invoice to customer
          const { getDepositInvoiceSentTemplate } = await import('./email-templates');
          const emailContent = getDepositInvoiceSentTemplate({
            businessName: business.businessName,
            senderName: business.senderName || business.businessName,
            recipientName: contact.fullName,
            invoiceNumber: depositInvoice.invoiceNumber,
            depositAmount: `R${depositAmount.toFixed(2)}`,
            jobNumber: job.jobNumber,
            depositDeadline: new Date(depositInvoice.dueDate).toLocaleDateString('en-ZA'),
            invoiceViewLink,
            businessPhone: business.phone || '',
            businessEmail: business.email || '',
          });

          await storage.createEmailQueueItem({
            businessId: quote.businessId,
            toEmail: contact.email || '',
            toName: contact.fullName,
            subject: emailContent.subject,
            bodyHtml: emailContent.html,
            bodyText: emailContent.text,
            status: 'pending',
            relatedType: 'invoice',
            relatedId: depositInvoice.id,
          });

          // Send WhatsApp notification
          const { sendWhatsAppNotification } = await import('./whatsapp-notification');
          await sendWhatsAppNotification({
            business,
            contact,
            messageBody: `Thank you for accepting the quote! Please pay the deposit of R${depositAmount.toFixed(2)} by ${new Date(depositInvoice.dueDate).toLocaleDateString('en-ZA')} to confirm your booking: ${invoiceViewLink}\n\n- ${business.businessName}`,
            templateName: 'deposit_invoice_sent',
            relatedType: 'invoice',
            relatedId: depositInvoice.id,
          });

          // Notify business owner
          await storage.createEmailQueueItem({
            businessId: quote.businessId,
            toEmail: business.email,
            toName: business.ownerName || business.businessName,
            subject: `Quote Accepted - Deposit Required - ${quote.quoteNumber}`,
            bodyHtml: `<h2>Quote Accepted!</h2>
              <p>${contact.fullName} has accepted quote ${quote.quoteNumber}.</p>
              <p><strong>Deposit Invoice Sent:</strong></p>
              <ul>
                <li>Invoice: ${depositInvoice.invoiceNumber}</li>
                <li>Amount: R${depositAmount.toFixed(2)}</li>
                <li>Due: ${new Date(depositInvoice.dueDate).toLocaleDateString('en-ZA')}</li>
                <li>Job: ${job.jobNumber} (Status: Pending Deposit)</li>
              </ul>`,
            bodyText: `Quote Accepted!\n\n${contact.fullName} has accepted quote ${quote.quoteNumber}.\n\nDeposit Invoice Sent:\n- Invoice: ${depositInvoice.invoiceNumber}\n- Amount: R${depositAmount.toFixed(2)}\n- Due: ${new Date(depositInvoice.dueDate).toLocaleDateString('en-ZA')}\n- Job: ${job.jobNumber} (Status: Pending Deposit)`,
            status: 'pending',
            relatedType: 'job',
            relatedId: job.id,
          });
        } else {
          // No deposit required - standard booking flow
          const bookingLink = `${baseUrl}/quote/${quote.id}?token=${quote.publicToken}`;

          // Notify business owner
          await storage.createEmailQueueItem({
            businessId: quote.businessId,
            toEmail: business.email,
            toName: business.ownerName || business.businessName,
            subject: `Quote Accepted - ${quote.quoteNumber}`,
            bodyHtml: `<h2>Quote Accepted!</h2>
              <p>${contact.fullName} has accepted quote ${quote.quoteNumber}.</p>
              <p>Job ${job.jobNumber} created (Status: Draft - awaiting customer to schedule appointment).</p>`,
            bodyText: `Quote Accepted!\n\n${contact.fullName} has accepted quote ${quote.quoteNumber}.\n\nJob ${job.jobNumber} created (Status: Draft - awaiting customer to schedule appointment).`,
            status: 'pending',
            relatedType: 'job',
            relatedId: job.id,
          });
        }

        await processEmailQueue(storage, business.id);

        // Process WhatsApp queue
        if (business.whatsappProvider) {
          const { processWhatsAppQueue } = await import('./whatsapp-queue');
          await processWhatsAppQueue(business.id);
        }
      }

      // Log activity: quote_accepted
      await ActivityLogger.quoteAccepted(
        business.id,
        quote.id,
        quote.contactId,
        req.ip
      );

      // Fetch the final quote to return to the client
      const finalQuote = await storage.getQuote(quote.id, quote.businessId);

      res.json({
        success: true,
        quote: finalQuote,
        job,
        depositInvoice: depositInvoice || null,
        requiresDeposit: quote.requiresDeposit,
        requiresBooking: !quote.requiresDeposit || depositInvoice === null, // Need to book if no deposit or deposit already handled
        message: quote.requiresDeposit
          ? "Quote accepted! Please pay the deposit to confirm your booking."
          : "Quote accepted! Please schedule your appointment."
      });
    } catch (error) {
      console.error("❌ Quote acceptance error:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error
      });
      res.status(500).json({
        message: "Failed to accept quote",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Public landing page content - accessible without authentication
  app.get('/api/public/landing-page-content/:businessSlug', async (req: Request, res: Response) => {
    try {
      const business = await storage.getBusinessBySlug(req.params.businessSlug);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      const content = await storage.getLandingPageContent(business.id);
      res.json(content);
    } catch (error) {
      console.error("Get public landing page content error:", error);
      res.status(500).json({ message: "Failed to get landing page content" });
    }
  });

  // ============================================================================
  // AUTHROUTES (Email/Password + Google OAuth)
  // ============================================================================

  // Email/password login
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Find user
      const user = await storage.getUserByEmail(email);

      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Verify password against the stored bcrypt hash.
      // NOTE: this previously compared the plaintext password to the hash with
      // `!==`, which could never match a hashed password.
      if (!user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Check email verification
      if (!user.emailVerified) {
        return res.status(403).json({
          message: "Please verify your email address before logging in. Check your inbox for the verification link.",
          requiresVerification: true,
          email: user.email
        });
      }

      // Set session
      if (req.session) {
        req.session.userId = user.id;
        req.session.businessId = user.businessId || '';
        req.session.role = 'owner';
      }

      res.json({
        message: "Login successful",
        user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, businessId: user.businessId }
      });

    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout
  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    try {
      if (req.session) {
        req.session.destroy((err) => {
          if (err) {
            return res.status(500).json({ message: "Logout failed" });
          }
          res.json({ message: "Logged out successfully" });
        });
      } else {
        res.json({ message: "No session to destroy" });
      }
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Logout failed" });
    }
  });

  // Verify email
  app.post("/api/auth/verify-email", async (req: Request, res: Response) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ message: "Verification token is required" });
      }

      const user = await storage.getUserByVerificationToken(token);

      if (!user) {
        return res.status(400).json({ message: "Invalid or expired verification token" });
      }

      // Check if token is expired
      if (user.emailVerificationExpiresAt && new Date(user.emailVerificationExpiresAt) < new Date()) {
        return res.status(400).json({ message: "Verification token has expired. Please request a new one." });
      }

      // Verify email
      await storage.updateUser(user.id, {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiresAt: null,
      });

      res.json({ message: "Email verified successfully. You can now log in with your new password." });

    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ message: "Email verification failed" });
    }
  });

  // Resend verification email
  app.post("/api/auth/resend-verification", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);

      if (!user) {
        // Don't reveal if email exists
        return res.json({ message: "If an account exists with this email, a verification link has been sent." });
      }

      if (user.emailVerified) {
        return res.status(400).json({ message: "Email is already verified" });
      }

      // Generate new verification token
      const verificationToken = crypto.randomUUID();
      const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await storage.updateUser(user.id, {
        emailVerificationToken: verificationToken,
        emailVerificationExpiresAt: verificationExpiry,
      });

      // Send verification email
      const baseUrl = getPublicBaseUrl();
      const verificationLink = `${baseUrl}/verify-email?token=${verificationToken}`;

      const { getEmailVerificationTemplate } = await import('./email-templates');
      const emailTemplate = getEmailVerificationTemplate({
        recipientName: user.firstName || 'there',
        verificationLink,
      });

      await sendEmail({
        to: email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });

      res.json({ message: "Verification email sent. Please check your inbox." });

    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({ message: "Failed to resend verification email" });
    }
  });

  // Public invoice view - accessible with token
  app.get('/api/public/invoice/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { token } = req.query;

      if (!token) {
        return res.status(401).json({ message: "Access token required" });
      }

      const invoice = await storage.getInvoice(id, '');

      if (!invoice || invoice.publicToken !== token) {
        return res.status(404).json({ message: "Invoice not found or invalid token" });
      }

      const business = await storage.getBusiness(invoice.businessId);
      const contact = await storage.getContact(invoice.contactId, invoice.businessId);
      const items = await storage.getInvoiceItemsByInvoiceId(invoice.id);

      // Log activity: invoice_viewed (every view)
      await ActivityLogger.invoiceViewed(
        invoice.businessId,
        invoice.id,
        invoice.contactId,
        req.ip
      );

      res.json({
        invoice: {
          ...invoice,
          items,
        },
        business: {
          ...business,
          slug: business?.slug || '',
        },
        contact,
      });
    } catch (error) {
      console.error("Get public invoice error:", error);
      res.status(500).json({ message: "Failed to get invoice" });
    }
  });

  // ============================================================================
  // PAYMENTS (PayFast, once-off)
  //
  // Online payment is live only when BOTH are true:
  //   - the owner enabled it in Dashboard -> Settings -> Payments, and
  //   - the server has PayFast credentials in its environment.
  // Credentials never touch the database or the admin UI.
  // ============================================================================

  // ============================================================================
  // DIRECT BOOKING (booking_mode = "direct")
  //
  // Lets a customer pick a service and a slot without going through quoting —
  // the right flow when the price and duration are known up front (salon,
  // tutor, physio). Quote-driven booking lives at
  // POST /api/public/quotes/:id/book and is unaffected.
  // ============================================================================

  /** Tells the public site which booking flow to render. */
  app.get('/api/public/booking-mode', async (_req: Request, res: Response) => {
    try {
      const business = await getCurrentBusiness();
      res.json({ bookingMode: business.bookingMode || 'quote_first' });
    } catch (error) {
      console.error("Booking mode error:", error);
      res.json({ bookingMode: 'quote_first' });
    }
  });

  app.post('/api/public/book', async (req: Request, res: Response) => {
    try {
      const { serviceId, date, time, notes, contactInfo, address } = req.body;

      if (!serviceId || !date || !time) {
        return res.status(400).json({ message: "Service, date and time are required." });
      }
      if (!contactInfo?.fullName || (!contactInfo?.email && !contactInfo?.phone)) {
        return res.status(400).json({
          message: "Your name and either an email address or phone number are required.",
        });
      }

      const business = await getCurrentBusiness();

      // Direct booking is only available when the owner has selected it.
      if (business.bookingMode !== 'direct') {
        return res.status(403).json({
          message: "Direct booking is not enabled. Please request a quote instead.",
        });
      }

      const service = await storage.getService(serviceId, business.id);
      if (!service || !service.isActive) {
        return res.status(404).json({ message: "That service is not available." });
      }

      // Same availability rules as quote-driven booking.
      // Build the date in LOCAL time: `new Date("2026-07-22")` parses as UTC,
      // which shifts the day in any positive-offset timezone.
      const [y, m, d] = String(date).split('-').map(Number);
      const [hours, minutes] = String(time).split(':').map(Number);
      if ([y, m, d, hours, minutes].some(Number.isNaN)) {
        return res.status(400).json({ message: "Invalid date or time." });
      }
      const scheduledDate = new Date(y, m - 1, d, hours, minutes, 0, 0);

      const now = new Date();
      const minimumNoticeHours = business.minimumNoticeHours || 24;
      const earliestAllowed = new Date(now);
      earliestAllowed.setHours(earliestAllowed.getHours() + minimumNoticeHours);

      if (scheduledDate < earliestAllowed) {
        return res.status(400).json({
          message: `Bookings must be made at least ${minimumNoticeHours} hours in advance. Please choose a later time.`,
        });
      }

      const bookingWindowDays = business.bookingWindowDays || 14;
      const latestAllowed = new Date(now);
      latestAllowed.setDate(latestAllowed.getDate() + bookingWindowDays);
      latestAllowed.setHours(23, 59, 59, 999);

      if (scheduledDate > latestAllowed) {
        return res.status(400).json({
          message: `Bookings can only be made up to ${bookingWindowDays} days ahead. Please choose an earlier date.`,
        });
      }

      // Re-check the slot server-side: the customer's list may be stale, and
      // two people can pick the same slot at the same time.
      const existingJobs = await storage.getJobsByBusinessId(business.id);
      const calendarHours = (business.calendarHours as any) || {
        monday: { start: "09:00", end: "17:00" },
        tuesday: { start: "09:00", end: "17:00" },
        wednesday: { start: "09:00", end: "17:00" },
        thursday: { start: "09:00", end: "17:00" },
        friday: { start: "09:00", end: "17:00" },
        saturday: null,
        sunday: null,
      };

      // Parse as LOCAL midnight. `new Date("2026-07-22")` is parsed as UTC, so
      // in a positive-offset timezone setHours(0,0,0,0) rolls back to the
      // previous day and the availability lookup misses entirely.
      const [yy, mm, dd] = String(date).split('-').map(Number);
      const dayStart = new Date(yy, mm - 1, dd, 0, 0, 0, 0);
      const dayEnd = new Date(yy, mm - 1, dd, 23, 59, 59, 999);

      const serviceDuration = service.durationMinutes || business.quoteVisitDurationMinutes || 60;

      const { AvailabilityService } = await import('./availability-service');
      const availability = AvailabilityService.getAvailableSlots(
        calendarHours,
        existingJobs,
        serviceDuration,
        business.bufferBetweenVisitsMinutes || 0,
        business.timeSlotIntervalMinutes || 30,
        dayStart,
        dayEnd
      );

      const slotsForDay: string[] = availability[date] || [];
      if (!slotsForDay.includes(time)) {
        return res.status(409).json({
          message: "Sorry, that time is no longer available. Please choose another slot.",
        });
      }

      // Reuse an existing contact so repeat customers do not create duplicate
      // CRM records (same matching rule as the quote request flow).
      const contacts = await storage.getContactsByBusinessId(business.id);
      let contact =
        (contactInfo.email
          ? contacts.find((c) => c.email?.toLowerCase() === String(contactInfo.email).toLowerCase())
          : undefined) ||
        (contactInfo.phone
          ? contacts.find((c) => c.phone === contactInfo.phone)
          : undefined);

      if (!contact) {
        contact = await storage.createContact({
          businessId: business.id,
          fullName: contactInfo.fullName,
          email: contactInfo.email || null,
          phone: contactInfo.phone || null,
          address: address || null,
          contactType: 'customer',
          leadSource: 'website',
        } as any);
        await ActivityLogger.contactCreated(business.id, contact!.id);
      }

      const durationMinutes = serviceDuration;
      const endTime = new Date(scheduledDate);
      endTime.setMinutes(endTime.getMinutes() + durationMinutes);
      const scheduledEndTime =
        `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`;

      const jobNumber = await generateJobNumber(business.id);

      const job = await storage.createJob({
        businessId: business.id,
        contactId: contact!.id,
        jobNumber,
        title: service.serviceName,
        description: notes || null,
        serviceType: service.serviceName,
        status: 'scheduled',
        scheduledDate: date,
        scheduledStartTime: time,
        scheduledEndTime,
        address: address || contact!.address || null,
        estimatedCost: service.basePrice || null,
      } as any);

      await ActivityLogger.bookingRequested(
        business.id,
        job.id,
        contact!.id,
        { serviceId, date, time, source: 'direct_booking' },
        req.ip
      );

      // Notifications are best-effort: a confirmed booking must never fail
      // because an optional email integration is unconfigured or down.
      if (contact!.email) {
        try {
          const when = new Date(`${date}T${time}`).toLocaleString('en-ZA', {
            weekday: 'long', day: 'numeric', month: 'long',
            hour: '2-digit', minute: '2-digit',
          });

          await storage.createEmailQueueItem({
            businessId: business.id,
            toEmail: contact!.email,
            toName: contact!.fullName,
            subject: `Booking confirmed — ${service.serviceName}`,
            bodyHtml:
              `<p>Hi ${contact!.fullName},</p>` +
              `<p>Your booking is confirmed.</p>` +
              `<p><strong>${service.serviceName}</strong><br>${when}</p>` +
              (notes ? `<p>Your notes: ${notes}</p>` : '') +
              `<p>Reference: ${job.jobNumber}</p>` +
              `<p>${business.businessName}${business.phone ? ` · ${business.phone}` : ''}</p>`,
            bodyText:
              `Hi ${contact!.fullName},\n\nYour booking is confirmed.\n\n` +
              `${service.serviceName}\n${when}\n\n` +
              (notes ? `Your notes: ${notes}\n\n` : '') +
              `Reference: ${job.jobNumber}\n\n${business.businessName}`,
            status: 'pending',
            relatedType: 'job',
            relatedId: job.id,
          } as any);
        } catch (notifyError) {
          console.error("Booking confirmation could not be queued:", notifyError);
        }
      }

      res.status(201).json({
        message: "Booking confirmed",
        job: {
          id: job.id,
          jobNumber: job.jobNumber,
          title: job.title,
          scheduledDate: job.scheduledDate,
          scheduledStartTime: job.scheduledStartTime,
          scheduledEndTime: job.scheduledEndTime,
        },
      });
    } catch (error) {
      console.error("Direct booking error:", error);
      res.status(500).json({ message: "Unable to complete your booking. Please try again." });
    }
  });

  /**
   * Admin-only: whether the SERVER has PayFast credentials, so Settings can
   * explain that payments will not go live until they are added. Reports
   * presence only — never the credentials themselves.
   */
  app.get('/api/payments/config-status', requireAuth, attachBusinessContext, (_req: Request, res: Response) => {
    res.json({
      credentialsConfigured: PayFastService.isConfigured(),
      sandbox: process.env.PAYFAST_MODE !== 'live',
    });
  });

  /** Whether the public payment button should be shown. */
  app.get('/api/public/payments/status', async (_req: Request, res: Response) => {
    try {
      const business = await getCurrentBusiness();
      const credentialsPresent = PayFastService.isConfigured();

      res.json({
        enabled: Boolean(business.onlinePaymentsEnabled) && credentialsPresent,
        acceptInvoicePayments: business.acceptInvoicePayments !== false,
        acceptDepositPayments: business.acceptDepositPayments !== false,
      });
    } catch (error) {
      console.error("Payment status error:", error);
      res.json({ enabled: false, acceptInvoicePayments: false, acceptDepositPayments: false });
    }
  });

  /**
   * Build a signed PayFast form for an invoice. Public, but requires the
   * invoice's unguessable token — the same gate as viewing it.
   */
  app.post('/api/public/payments/invoice/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { token } = req.query;

      if (!token) {
        return res.status(401).json({ message: "Access token required" });
      }

      const business = await getCurrentBusiness();

      if (!business.onlinePaymentsEnabled) {
        return res.status(403).json({ message: "Online payments are not enabled for this business." });
      }
      if (business.acceptInvoicePayments === false) {
        return res.status(403).json({ message: "Online invoice payment is not available." });
      }
      if (!PayFastService.isConfigured()) {
        console.error("Online payments are enabled but PayFast credentials are missing.");
        return res.status(503).json({ message: "Online payment is temporarily unavailable." });
      }

      const invoice = await storage.getInvoice(id, '');
      if (!invoice || invoice.publicToken !== token) {
        return res.status(404).json({ message: "Invoice not found or invalid token" });
      }
      if (invoice.status === 'paid') {
        return res.status(409).json({ message: "This invoice has already been paid." });
      }

      // Trust the stored total, never an amount supplied by the client.
      const amountDue = parseFloat(String(invoice.totalAmount ?? '0'));
      if (!Number.isFinite(amountDue) || amountDue <= 0) {
        return res.status(400).json({ message: "This invoice has no amount payable." });
      }

      const contact = await storage.getContact(invoice.contactId, invoice.businessId);
      const [firstName, ...restName] = (contact?.fullName || '').split(' ');

      const payfast = getPayFastService();
      const formData = payfast.createPaymentForm({
        paymentId: invoice.id,
        amount: amountDue,
        itemName: `Invoice ${invoice.invoiceNumber}`,
        itemDescription: `Payment for invoice ${invoice.invoiceNumber} — ${business.businessName}`,
        customerFirstName: firstName || undefined,
        customerLastName: restName.join(' ') || undefined,
        customerEmail: contact?.email || undefined,
        paymentType: invoice.invoiceType === 'deposit' ? 'deposit' : 'invoice',
        invoiceId: invoice.id,
        jobId: invoice.jobId || undefined,
      });

      res.json({ paymentUrl: payfast.getPaymentUrl(), formData });
    } catch (error) {
      console.error("Create invoice payment error:", error);
      res.status(500).json({ message: "Failed to start payment" });
    }
  });

  /**
   * PayFast ITN webhook — the only trustworthy signal that money moved.
   *
   * Hardened per PayFast's guidance: source IP, signature, and amount are all
   * verified before anything is marked paid. Always returns 200 so PayFast
   * does not retry indefinitely on a request we have deliberately rejected.
   */
  app.post('/api/payments/webhook/payfast', async (req: Request, res: Response) => {
    // Acknowledge immediately; process after.
    res.status(200).send('OK');

    try {
      const data = req.body as Record<string, string>;
      const sourceIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.ip || '';

      if (!PayFastService.isConfigured()) {
        console.error("Received a PayFast ITN but no credentials are configured. Ignoring.");
        return;
      }

      const payfast = getPayFastService();

      if (!payfast.validateITNIP(sourceIp)) {
        console.error(`Rejected ITN from unauthorised IP: ${sourceIp}`);
        return;
      }
      if (!payfast.validateITNSignature(data)) {
        console.error("Rejected ITN with an invalid signature.");
        return;
      }
      if (data.payment_status !== 'COMPLETE') {
        console.log(`Ignoring ITN with payment_status=${data.payment_status}`);
        return;
      }

      const invoiceId = data.custom_str2 || data.m_payment_id;
      if (!invoiceId) {
        console.error("ITN carried no invoice reference.");
        return;
      }

      const invoice = await storage.getInvoice(invoiceId, '');
      if (!invoice) {
        console.error(`ITN referenced unknown invoice ${invoiceId}`);
        return;
      }

      // The amount check is what stops a tampered ITN settling a large
      // invoice for a trivial sum.
      if (!payfast.validateAmount(invoice.totalAmount ?? '0', data.amount_gross)) {
        console.error(`Rejected ITN for invoice ${invoiceId}: amount mismatch.`);
        return;
      }

      // PayFast can deliver the same ITN more than once.
      const existing = await storage.getPaymentTransactionsByInvoice(invoice.id, invoice.businessId);
      if (existing?.some((t) => t.transactionId === data.pf_payment_id)) {
        console.log(`Ignoring duplicate ITN for transaction ${data.pf_payment_id}`);
        return;
      }

      // Build the row explicitly with plain values: the raw ITN body can carry
      // null/undefined entries that the query builder cannot serialise.
      await storage.createPaymentTransaction({
        businessId: invoice.businessId,
        invoiceId: invoice.id,
        transactionId: String(data.pf_payment_id ?? ''),
        amount: String(data.amount_gross),
        currency: 'ZAR',
        paymentMethod: 'card',
        status: 'completed',
        gateway: 'payfast',
        gatewayResponse: JSON.parse(JSON.stringify(data)),
        processedAt: new Date(),
      } as any);

      await storage.updateInvoice(invoice.id, invoice.businessId, {
        status: 'paid',
        paidAt: new Date(),
      } as any);

      // A paid deposit releases the job to be scheduled.
      if (data.custom_str1 === 'deposit' && invoice.jobId) {
        await storage.updateJob(invoice.jobId, invoice.businessId, {
          depositPaid: true,
          depositPaidAt: new Date(),
          status: 'scheduled',
        } as any);

        await ActivityLogger.depositPaid(
          invoice.businessId,
          invoice.jobId,
          invoice.contactId,
          parseFloat(String(data.amount_gross))
        );
      }

      await ActivityLogger.log({
        businessId: invoice.businessId,
        contactId: invoice.contactId,
        action: 'payment_received',
        entityType: 'invoice',
        entityId: invoice.id,
        changes: {
          amount: data.amount_gross,
          gateway: 'payfast',
          transactionId: data.pf_payment_id,
        },
      });

      console.log(`✅ Payment recorded for invoice ${invoice.invoiceNumber} (${data.amount_gross})`);
    } catch (error) {
      console.error("PayFast ITN processing error:", error);
    }
  });

  // Customer lands here after paying. The ITN is authoritative, not this.
  app.get('/api/payments/return', (_req: Request, res: Response) => {
    res.redirect('/payment/success');
  });

  app.get('/api/payments/cancel', (_req: Request, res: Response) => {
    res.redirect('/payment/cancelled');
  });

  // Request password reset
  app.post("/api/auth/request-password-reset", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);

      if (!user || !user.passwordHash) {
        // Don't reveal if email exists or is OAuth-only
        return res.json({ message: "If an account exists with this email, a password reset link has been sent." });
      }

      // Generate password reset token
      const resetToken = crypto.randomUUID();
      const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await storage.updateUser(user.id, {
        passwordResetToken: resetToken,
        passwordResetExpiresAt: resetExpiry,
      });

      // Send password reset email
      const baseUrl = getPublicBaseUrl();
      const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

      const { getPasswordResetTemplate } = await import('./email-templates');
      const emailTemplate = getPasswordResetTemplate({
        recipientName: user.firstName || 'there',
        resetLink,
      });

      await sendEmail({
        to: email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });

      res.json({ message: "Password reset link sent. Please check your email." });

    } catch (error) {
      console.error("Password reset request error:", error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  // Reset password
  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long" });
      }

      const user = await storage.getUserByPasswordResetToken(token);

      if (!user) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      // Check if token is expired
      if (user.passwordResetExpiresAt && new Date(user.passwordResetExpiresAt) < new Date()) {
        return res.status(400).json({ message: "Reset token has expired. Please request a new one." });
      }

      // Update password and clear reset token.
      // NOTE: this previously stored the new password in PLAINTEXT.
      await storage.updateUser(user.id, {
        passwordHash: await bcrypt.hash(newPassword, 10),
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      });

      res.json({ message: "Password reset successful. You can now log in with your new password." });

    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: "Password reset failed" });
    }
  });

  // Landing page editor API endpoints
  app.get("/api/businesses/:businessId/landing-page-sections", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const { businessId } = req.params;
      const user = req.user as any;

      // Verify user owns this business
      if (user.businessId !== businessId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get business to access industry
      const business = await storage.getBusiness(businessId);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      // Load template for the business industry
      const { getTemplateByIndustry } = await import('./landing-page-templates');
      const template = getTemplateByIndustry(business.industry || '');

      // Get existing landing page content
      const existingContent = await storage.getLandingPageContent(businessId);

      // Create a map of existing items by section + elementKey for quick lookup
      const existingMap = new Map<string, LandingPageContent>();
      existingContent.forEach(item => {
        existingMap.set(`${item.section}::${item.elementKey}`, item);
      });

      // Check template for missing items and create them
      if (template) {
        for (const templateItem of template.sections) {
          const key = `${templateItem.section}::${templateItem.elementKey}`;
          if (!existingMap.has(key)) {
            // Item missing from database, create it
            try {
              const newItem = await storage.createLandingPageContent({
                businessId,
                section: templateItem.section,
                elementKey: templateItem.elementKey,
                contentType: templateItem.contentType,
                value: templateItem.value,
                altText: templateItem.altText,
                url: templateItem.url,
                displayOrder: templateItem.displayOrder,
                isActive: templateItem.isActive,
              });
              existingMap.set(key, newItem);
            } catch (createError) {
              console.warn(`Failed to create missing template item ${key}:`, createError);
            }
          }
        }
      }

      // Return merged content, sorted by displayOrder within each section
      const merged = Array.from(existingMap.values()).sort((a, b) => {
        if (a.section !== b.section) {
          const sectionOrder = ['hero', 'services', 'about', 'testimonials', 'contact'];
          return (sectionOrder.indexOf(a.section) || 999) - (sectionOrder.indexOf(b.section) || 999);
        }
        return a.displayOrder - b.displayOrder;
      });

      res.json(merged);
    } catch (error) {
      console.error("Get landing page sections error:", error);
      res.status(500).json({ message: "Failed to fetch landing page sections" });
    }
  });

  app.post("/api/businesses/:businessId/landing-page-sections", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const { businessId } = req.params;
      const user = req.user as any;

      // Verify user owns this business
      if (user.businessId !== businessId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { section, elementKey, contentType, value, displayOrder } = req.body;

      // Validate required fields
      if (!section || !elementKey || !contentType || displayOrder === undefined) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const created = await storage.createLandingPageContent({
        businessId,
        section,
        elementKey,
        contentType,
        value: value || null,
        altText: null,
        url: null,
        displayOrder,
        isActive: true,
      });

      res.status(201).json(created);
    } catch (error) {
      console.error("Create landing page section error:", error);
      res.status(500).json({ message: "Failed to create landing page section" });
    }
  });

  // Get presigned upload URL for landing page gallery images
  app.post("/api/businesses/:businessId/upload-image-url", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const { businessId } = req.params;
      const user = req.user as any;

      if (user.businessId !== businessId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  // Finalize image upload and set it on the landing page
  app.post("/api/businesses/:businessId/image-uploaded", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const { businessId } = req.params;
      const user = req.user as any;

      if (user.businessId !== businessId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { imageURL } = req.body;
      if (!imageURL) {
        return res.status(400).json({ message: "imageURL is required" });
      }

      const objectStorageService = new ObjectStorageService();
      const normalizedPath = objectStorageService.normalizeObjectEntityPath(imageURL);

      res.json({ url: normalizedPath });
    } catch (error) {
      console.error("Image finalize error:", error);
      res.status(500).json({ message: "Failed to finalize image upload" });
    }
  });

  /**
   * Receives an uploaded image and stores it on disk.
   *
   * The Replit implementation handed the browser a pre-signed cloud URL and
   * uploaded directly to storage. Self-hosted, the file comes through here.
   */
  app.post("/api/uploads", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const Busboy = (await import('busboy')).default;
      const bb = Busboy({
        headers: req.headers,
        limits: { fileSize: 10 * 1024 * 1024, files: 1 }, // 10 MB, one file
      });

      let responded = false;
      const fail = (status: number, message: string) => {
        if (responded) return;
        responded = true;
        res.status(status).json({ message });
      };

      bb.on('file', (_name, file, info) => {
        const chunks: Buffer[] = [];
        let tooLarge = false;

        file.on('data', (chunk: Buffer) => chunks.push(chunk));
        file.on('limit', () => {
          tooLarge = true;
          fail(413, "That image is too large. Please use a file under 10 MB.");
        });

        file.on('end', async () => {
          if (tooLarge || responded) return;
          try {
            const storageService = new ObjectStorageService();
            const objectPath = await storageService.storeUpload(
              Buffer.concat(chunks),
              info.filename || 'upload.jpg'
            );
            responded = true;
            res.json({ url: objectPath, uploadURL: objectPath });
          } catch (error: any) {
            fail(400, error?.message || "Upload failed.");
          }
        });
      });

      bb.on('error', () => fail(400, "Upload failed."));
      bb.on('finish', () => {
        if (!responded) fail(400, "No file was uploaded.");
      });

      req.pipe(bb);
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Upload failed." });
    }
  });

  // Serve uploaded images
  app.get("/objects/*", async (req: Request, res: Response) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = req.path;

      const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
      await objectStorageService.downloadObject(objectFile, res, 31536000);
    } catch (error) {
      console.error("Error serving object:", error);
      res.status(404).json({ message: "Image not found" });
    }
  });

  app.put("/api/businesses/:businessId/landing-page-sections/:id", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const { businessId, id } = req.params;
      const user = req.user as any;

      // Verify user owns this business
      if (user.businessId !== businessId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updated = await storage.updateLandingPageContent(id, businessId, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Update landing page section error:", error);
      res.status(500).json({ message: "Failed to update landing page section" });
    }
  });

  app.delete("/api/businesses/:businessId/landing-page-sections/:section/:itemNumber", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const { businessId, section, itemNumber } = req.params;
      const user = req.user as any;

      // Verify user owns this business
      if (user.businessId !== businessId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const itemNum = parseInt(itemNumber);
      if (isNaN(itemNum)) {
        return res.status(400).json({ message: "Invalid item number" });
      }

      console.log(`🗑️  Deleting ${section} item #${itemNum} for business ${businessId}`);

      // Get all sections for this business
      const allSections = await storage.getLandingPageContent(businessId);

      // Find all items to delete based on section and item number
      let itemsToDelete: string[] = [];

      if (section === 'services' || section === 'testimonials') {
        // Delete paired items: item_N_heading + item_N_description (services) or item_N_text + item_N_author (testimonials)
        itemsToDelete = allSections
          .filter(s => s.section === section && s.elementKey.match(new RegExp(`^item_${itemNum}_`)))
          .map(s => s.id);
        console.log(`Found ${itemsToDelete.length} items to delete:`, allSections.filter(s => s.section === section && s.elementKey.match(new RegExp(`^item_${itemNum}_`))).map(s => s.elementKey));
      } else if (section === 'gallery') {
        // Delete single gallery image
        itemsToDelete = allSections
          .filter(s => s.section === section && s.elementKey === `image_${itemNum}`)
          .map(s => s.id);
        console.log(`Found ${itemsToDelete.length} gallery items to delete`);
      }

      // Delete all identified items
      if (itemsToDelete.length > 0) {
        console.log(`🔥 Deleting ${itemsToDelete.length} items with IDs:`, itemsToDelete);
        for (const id of itemsToDelete) {
          await storage.deleteLandingPageContent(id, businessId);
        }
        console.log(`✅ Successfully deleted ${itemsToDelete.length} items`);
      } else {
        console.log(`⚠️  No items found to delete`);
      }

      res.json({ message: "Item deleted successfully", deletedCount: itemsToDelete.length });
    } catch (error) {
      console.error("Delete landing page section error:", error);
      res.status(500).json({ message: "Failed to delete landing page section" });
    }
  });

  // Change password
  app.post("/api/auth/change-password", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current and new password are required" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: "New password must be at least 8 characters long" });
      }

      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user has a password (email/password auth user)
      if (!user.passwordHash) {
        return res.status(400).json({ message: "Cannot change password for OAuth accounts" });
      }

      // Verify current password against the stored bcrypt hash.
      // NOTE: this previously compared plaintext to the hash with `!==`.
      if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      // NOTE: this previously stored the new password in PLAINTEXT.
      await storage.updateUser(user.id, {
        passwordHash: await bcrypt.hash(newPassword, 10),
      });

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // Get current user
  app.get("/api/auth/me", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let business = null;
      if (user.businessId) {
        business = await storage.getBusiness(user.businessId);
      }

      res.json({ user, business });

    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user info" });
    }
  });

  // ============================================================================
  // INSIGHTS & ANALYTICS ROUTES
  // ============================================================================

  // Get financial overview
  app.get("/api/insights/financial-overview/:period", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const { period } = req.params;
      const businessId = req.user!.businessId!;

      const { InsightsService } = await import('./insights-service');
      const overview = await InsightsService.getFinancialOverview(businessId, period);
      res.json(overview);
    } catch (error) {
      console.error('Financial overview error:', error);
      res.status(500).json({ message: 'Failed to get financial overview' });
    }
  });

  app.get('/api/insights/aged-receivables', requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const businessId = req.user!.businessId!;

      const { InsightsService } = await import('./insights-service');
      const agedReceivables = await InsightsService.getAgedReceivables(businessId);
      res.json(agedReceivables);
    } catch (error) {
      console.error('Aged receivables error:', error);
      res.status(500).json({ message: 'Failed to get aged receivables' });
    }
  });

  // Lead Funnel Conversion Tracking
  app.get('/api/insights/lead-funnel', requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const businessId = req.user!.businessId!;
      const period = (req.query.period as string) || '30days';

      const { InsightsService } = await import('./insights-service');
      const funnelMetrics = await InsightsService.getLeadFunnelMetrics(businessId, period);
      res.json(funnelMetrics);
    } catch (error) {
      console.error('Lead funnel error:', error);
      res.status(500).json({ message: 'Failed to get lead funnel metrics' });
    }
  });

  // Insights: Lead Conversion Timings
  app.get('/api/insights/lead-conversion-timings', requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const businessId = req.user!.businessId!;
      const period = (req.query.period as string) || '30days';

      const { InsightsService } = await import('./insights-service');
      const timings = await InsightsService.getLeadConversionTimings(businessId, period);
      res.json(timings);
    } catch (error) {
      console.error('Lead conversion timings error:', error);
      res.status(500).json({ message: 'Failed to fetch lead conversion timings' });
    }
  });

  // Get revenue timeline
  app.get("/api/insights/revenue-timeline", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const businessId = req.user!.businessId!;
      const period = (req.query.period as string) || '90days';

      const { InsightsService } = await import('./insights-service');
      const timeline = await InsightsService.getRevenueTimeline(businessId, period);

      res.json(timeline);
    } catch (error) {
      console.error("Get revenue timeline error:", error);
      res.status(500).json({ message: "Failed to get revenue timeline" });
    }
  });

  // Get payment methods distribution
  app.get("/api/insights/payment-methods", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const businessId = req.user!.businessId!;
      const period = (req.query.period as string) || '30days';

      const { InsightsService } = await import('./insights-service');
      const methods = await InsightsService.getPaymentMethodDistribution(businessId, period);

      res.json(methods);
    } catch (error) {
      console.error("Get payment methods error:", error);
      res.status(500).json({ message: "Failed to get payment methods" });
    }
  });

  // Get cashflow trend
  app.get("/api/insights/cashflow-trend", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const businessId = req.user!.businessId!;
      const period = (req.query.period as string) || '30days';

      const { InsightsService } = await import('./insights-service');
      const trend = await InsightsService.getCashflowTrend(businessId, period);

      res.json(trend);
    } catch (error) {
      console.error("Get cashflow trend error:", error);
      res.status(500).json({ message: "Failed to get cashflow trend" });
    }
  });

  // Get receivables summary
  app.get("/api/insights/receivables", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const businessId = req.user!.businessId!;

      const { InsightsService } = await import('./insights-service');
      const receivables = await InsightsService.getReceivables(businessId);

      res.json(receivables);
    } catch (error) {
      console.error("Get receivables error:", error);
      res.status(500).json({ message: "Failed to get receivables" });
    }
  });

  // Get projected income
  app.get("/api/insights/projected-income", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const businessId = req.user!.businessId!;

      const { InsightsService } = await import('./insights-service');
      const projectedIncome = await InsightsService.getProjectedIncome(businessId);

      res.json(projectedIncome);
    } catch (error) {
      console.error("Get projected income error:", error);
      res.status(500).json({ message: "Failed to get projected income" });
    }
  });

  // ============================================================================
  // DEPOSIT INVOICE ROUTES (Phase 2, Step 5 - Deposit Payment Processing)
  // ============================================================================

  // Generate deposit invoice for a job
  app.post("/api/jobs/:jobId/generate-deposit-invoice", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;
      const businessId = req.user!.businessId!;

      // Get job details
      const job = await storage.getJob(jobId, businessId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Verify job requires deposit
      if (job.status !== "pending_deposit") {
        return res.status(400).json({ message: "Job does not require deposit payment" });
      }

      // Check if deposit invoice already exists
      if (job.depositInvoiceId) {
        const existingInvoice = await storage.getInvoice(job.depositInvoiceId, businessId);
        if (existingInvoice) {
          return res.status(400).json({
            message: "Deposit invoice already exists",
            invoice: existingInvoice
          });
        }
      }

      // Get quote to determine deposit amount
      let depositAmount = 0;
      if (job.quoteId) {
        const quote = await storage.getQuote(job.quoteId, businessId);
        if (quote && quote.requiresDeposit) {
          if (quote.depositAmount) {
            depositAmount = parseFloat(quote.depositAmount);
          } else if (quote.depositPercentage) {
            const totalAmount = parseFloat(quote.totalAmount);
            depositAmount = (totalAmount * parseFloat(quote.depositPercentage)) / 100;
          }
        }
      }

      if (depositAmount <= 0) {
        return res.status(400).json({ message: "Unable to calculate deposit amount" });
      }

      // Calculate balance due
      const totalAmount = parseFloat(job.totalAmount || "0");
      const balanceDue = totalAmount - depositAmount;

      // Generate invoice number
      const invoiceNumber = await generateInvoiceNumber(businessId);

      // Generate public token
      const publicToken = crypto.randomUUID();

      // Create deposit invoice
      const depositInvoice = await storage.createInvoice({
        businessId,
        jobId: job.id,
        contactId: job.contactId,
        quoteId: job.quoteId || undefined,
        invoiceNumber,
        title: `Deposit - ${job.title}`,
        invoiceType: "deposit",
        status: "sent",
        dueDate: job.depositDeadline ? job.depositDeadline.toISOString().split('T')[0] : new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0],
        subtotal: depositAmount.toFixed(2),
        taxAmount: "0",
        totalAmount: depositAmount.toFixed(2),
        depositAmount: depositAmount.toFixed(2),
        balanceDue: balanceDue.toFixed(2),
        publicToken,
        notes: `Deposit payment required to confirm booking for ${job.title}. Balance of R${balanceDue.toFixed(2)} due upon completion.`,
        createdBy: req.user!.id,
      });

      // Update job with deposit invoice reference
      await storage.updateJob(jobId, businessId, {
        depositInvoiceId: depositInvoice.id,
      });

      // Send deposit invoice to customer
      const business = await storage.getBusiness(businessId);
      const contact = await storage.getContact(job.contactId, businessId);

      if (business && contact) {
        const baseUrl = getPublicBaseUrl();
        const invoiceViewLink = `${baseUrl}/invoices/${depositInvoice.id}/view?token=${publicToken}`;

        console.log(`\n📤 [Deposit Invoice] Processing for ${contact.fullName}`);

        // Multi-channel notification
        const { sendWhatsAppNotification } = await import('./whatsapp-notification');

        const whatsappResult = await sendWhatsAppNotification({
          business,
          contact,
          messageBody: `Hi ${contact.fullName}, please pay your deposit to confirm your booking!\n\nInvoice: ${depositInvoice.invoiceNumber}\nAmount Due: R${parseFloat(depositInvoice.totalAmount).toFixed(2)}\nDue Date: ${depositInvoice.dueDate}\n\nView & Pay: ${invoiceViewLink}\n\n- ${business.businessName}`,
          templateName: 'deposit_invoice_sent',
          relatedType: 'invoice',
          relatedId: depositInvoice.id,
        });

        if (whatsappResult.sent) {
          console.log(`✅ [Deposit Invoice] WhatsApp sent`);
        } else {
          console.log(`⚠️ [Deposit Invoice] WhatsApp skipped: ${whatsappResult.reason || whatsappResult.error}`);
        }

        // Email fallback
        if (contact.email && (
          !contact.whatsappOptIn ||
          contact.preferredChannel === 'email' ||
          contact.preferredChannel === 'both' ||
          !whatsappResult.sent // Fallback if WhatsApp failed or was skipped due to limits
        )) {
          console.log(`📧 [Deposit Invoice] Queueing email to ${contact.email}`);

          await storage.createEmailQueueItem({
            businessId: business.id,
            toEmail: contact.email,
            toName: contact.fullName,
            subject: `Deposit Payment Required - ${depositInvoice.invoiceNumber}`,
            bodyHtml: `
              <h2>Deposit Payment Required</h2>
              <p>Dear ${contact.fullName},</p>
              <p>To confirm your booking for <strong>${job.title}</strong>, please pay the deposit amount:</p>
              <ul>
                <li><strong>Invoice Number:</strong> ${depositInvoice.invoiceNumber}</li>
                <li><strong>Amount Due:</strong> R${parseFloat(depositInvoice.totalAmount).toFixed(2)}</li>
                <li><strong>Due Date:</strong> ${depositInvoice.dueDate}</li>
                <li><strong>Balance After Deposit:</strong> R${balanceDue.toFixed(2)}</li>
              </ul>
              <p><a href="${invoiceViewLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View & Pay Invoice</a></p>
              <p>Thank you,<br/>${business.businessName}</p>
            `,
            bodyText: `Deposit Payment Required\n\nDear ${contact.fullName},\n\nTo confirm your booking for ${job.title}, please pay the deposit amount:\n\nInvoice Number: ${depositInvoice.invoiceNumber}\nAmount Due: R${parseFloat(depositInvoice.totalAmount).toFixed(2)}\nDue Date: ${depositInvoice.dueDate}\nBalance After Deposit: R${balanceDue.toFixed(2)}\n\nView & Pay: ${invoiceViewLink}\n\nThank you,\n${business.businessName}`,
            status: 'pending',
            relatedType: 'invoice',
            relatedId: depositInvoice.id,
          });

          console.log(`✅ [Deposit Invoice] Email queued`);
        }

        // Process queues
        await processEmailQueue(storage, business.id);

        if (business.whatsappProvider && whatsappResult.sent) {
          console.log(`⚙️ [Deposit Invoice] Processing WhatsApp queue...`);
          const { processWhatsAppQueue } = await import('./whatsapp-queue');
          await processWhatsAppQueue(business.id);
        }
      }

      res.status(201).json({
        message: "Deposit invoice generated and sent successfully",
        invoice: depositInvoice,
      });
    } catch (error) {
      console.error("Generate deposit invoice error:", error);
      res.status(500).json({ message: "Failed to generate deposit invoice" });
    }
  });

  // Mark deposit as paid and update job status
  app.post("/api/jobs/:jobId/mark-deposit-paid", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;
      const businessId = req.user!.businessId!;

      // Get job details
      const job = await storage.getJob(jobId, businessId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Verify job is in pending_deposit status
      if (job.status !== "pending_deposit") {
        return res.status(400).json({ message: "Job is not awaiting deposit payment" });
      }

      // Update deposit invoice to paid (if exists)
      if (job.depositInvoiceId) {
        await storage.updateInvoice(job.depositInvoiceId, businessId, {
          status: "paid",
          paidAt: new Date(),
          paymentMethod: "other",
        });
      }

      // Determine new status based on scheduledDate
      const newStatus = job.scheduledDate ? "scheduled" : "deposit_paid";

      // Update job status
      const updatedJob = await storage.updateJob(jobId, businessId, {
        status: newStatus,
        depositPaid: true,
        depositPaidAt: new Date(),
      });

      // Log activity
      await ActivityLogger.log({
        businessId,
        userId: req.user!.id,
        contactId: job.contactId,
        action: "deposit_paid",
        entityType: "job",
        entityId: jobId,
        changes: { depositAmount: job.depositInvoiceId },
      });

      res.json({
        message: "Deposit marked as paid successfully",
        job: updatedJob,
      });
    } catch (error) {
      console.error("Mark deposit paid error:", error);
      res.status(500).json({ message: "Failed to mark deposit as paid" });
    }
  });

  // Waive deposit requirement
  app.post("/api/jobs/:jobId/waive-deposit", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;
      const businessId = req.user!.businessId!;

      const job = await storage.getJob(jobId, businessId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      if (job.status !== "pending_deposit") {
        return res.status(400).json({ message: "Job is not awaiting deposit payment" });
      }

      // Cancel deposit invoice if exists
      if (job.depositInvoiceId) {
        await storage.updateInvoice(job.depositInvoiceId, businessId, {
          status: "cancelled",
        });
      }

      // Update job to scheduled status (skip deposit)
      const updatedJob = await storage.updateJob(jobId, businessId, {
        status: "scheduled",
        depositPaid: true, // Mark as "paid" to skip requirement
        depositPaidAt: new Date(),
      });

      res.json({
        message: "Deposit waived successfully",
        job: updatedJob,
      });
    } catch (error) {
      console.error("Waive deposit error:", error);
      res.status(500).json({ message: "Failed to waive deposit" });
    }
  });

  // Extend deposit deadline
  app.post("/api/jobs/:jobId/extend-deposit-deadline", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;
      const { newDeadline } = req.body;
      const businessId = req.user!.businessId!;

      if (!newDeadline) {
        return res.status(400).json({ message: "New deadline is required" });
      }

      const job = await storage.getJob(jobId, businessId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      if (job.status !== "pending_deposit") {
        return res.status(400).json({ message: "Job is not awaiting deposit payment" });
      }

      // Update job deposit deadline
      const newDeadlineDate = new Date(newDeadline);
      newDeadlineDate.setHours(23, 59, 59, 999); // End of day

      const updatedJob = await storage.updateJob(jobId, businessId, {
        depositDeadline: newDeadlineDate,
      });

      // Update invoice due date if exists
      if (job.depositInvoiceId) {
        await storage.updateInvoice(job.depositInvoiceId, businessId, {
          dueDate: newDeadline,
        });
      }

      res.json({
        message: "Deposit deadline extended successfully",
        job: updatedJob,
      });
    } catch (error) {
      console.error("Extend deadline error:", error);
      res.status(500).json({ message: "Failed to extend deposit deadline" });
    }
  });

  // Cancel unpaid booking
  app.post("/api/jobs/:jobId/cancel-unpaid", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;
      const businessId = req.user!.businessId!;

      const job = await storage.getJob(jobId, businessId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      if (job.status !== "pending_deposit") {
        return res.status(400).json({ message: "Job is not awaiting deposit payment" });
      }

      // Cancel job
      const updatedJob = await storage.updateJob(jobId, businessId, {
        status: "cancelled",
        cancellationReason: "Deposit not paid by deadline",
      });

      // Cancel deposit invoice if exists
      if (job.depositInvoiceId) {
        await storage.updateInvoice(job.depositInvoiceId, businessId, {
          status: "cancelled",
        });
      }

      // Send cancellation notification to customer
      const business = await storage.getBusiness(businessId);
      const contact = await storage.getContact(job.contactId, businessId);

      if (business && contact) {
        await storage.createEmailQueueItem({
          businessId: business.id,
          toEmail: contact.email || '',
          toName: contact.fullName,
          subject: `Booking Cancelled - ${job.jobNumber}`,
          bodyHtml: `<p>Dear ${contact.fullName},</p><p>Your booking (${job.jobNumber}) has been cancelled due to non-payment of the required deposit.</p><p>If you would like to reschedule, please contact us.</p><p>Thank you,<br/>${business.businessName}</p>`,
          bodyText: `Dear ${contact.fullName},\n\nYour booking (${job.jobNumber}) has been cancelled due to non-payment of the required deposit.\n\nIf you would like to reschedule, please contact us.\n\nThank you,\n${business.businessName}`,
          status: 'pending',
          relatedType: 'job',
          relatedId: job.id,
        });

        await processEmailQueue(storage, business.id);
      }

      res.json({
        message: "Booking cancelled successfully",
        job: updatedJob,
      });
    } catch (error) {
      console.error("Cancel unpaid booking error:", error);
      res.status(500).json({ message: "Failed to cancel booking" });
    }
  });

  // ============================================================================
  // DEPOSIT POLICY ROUTES (Phase 2 - Deposit System)
  // ============================================================================

  // Get all deposit policies for business
  app.get("/api/deposit-policies", requireAuth, attachBusinessContext, async (req: Request, res: Response    ) => {
    try {
      const businessId = req.user!.businessId!;
      const policies = await storage.getDepositPolicies(businessId);
      res.json(policies);
    } catch (error) {
      console.error("Get deposit policies error:", error);
      res.status(500).json({ message: "Failed to get deposit policies" });
    }
  });

  // Get single deposit policy
  app.get("/api/deposit-policies/:id", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const businessId = req.user!.businessId!;

      const policy = await storage.getDepositPolicy(id, businessId);
      if (!policy) {
        return res.status(404).json({ message: "Deposit policy not found" });
      }

      res.json(policy);
    } catch (error) {
      console.error("Get deposit policy error:", error);
      res.status(500).json({ message: "Failed to get deposit policy" });
    }
  });

  // Create deposit policy
  app.post("/api/deposit-policies", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const businessId = req.user!.businessId!;

      const policyData = {
        businessId,
        serviceId: req.body.serviceId || null,
        depositPercentage: req.body.depositPercentage,
        cancellationThresholdHours: req.body.cancellationThresholdHours,
        autoReminders: req.body.autoReminders !== undefined ? req.body.autoReminders : true,
        autoCancellation: req.body.autoCancellation !== undefined ? req.body.autoCancellation : false,
        isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      };

      const policy = await storage.createDepositPolicy(policyData);

      res.status(201).json(policy);
    } catch (error) {
      console.error("Create deposit policy error:", error);
      res.status(500).json({ message: "Failed to create deposit policy" });
    }
  });

  // Update deposit policy
  app.patch("/api/deposit-policies/:id", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const businessId = req.user!.businessId!;

      const updateData: any = {};

      if (req.body.depositPercentage !== undefined) updateData.depositPercentage = req.body.depositPercentage;
      if (req.body.cancellationThresholdHours !== undefined) updateData.cancellationThresholdHours = req.body.cancellationThresholdHours;
      if (req.body.autoReminders !== undefined) updateData.autoReminders = req.body.autoReminders;
      if (req.body.autoCancellation !== undefined) updateData.autoCancellation = req.body.autoCancellation;
      if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive;

      const policy = await storage.updateDepositPolicy(id, businessId, updateData);

      if (!policy) {
        return res.status(404).json({ message: "Deposit policy not found" });
      }

      res.json(policy);
    } catch (error) {
      console.error("Update deposit policy error:", error);
      res.status(500).json({ message: "Failed to update deposit policy" });
    }
  });

  // Delete deposit policy
  app.delete("/api/deposit-policies/:id", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const businessId = req.user!.businessId!;

      const deleted = await storage.deleteDepositPolicy(id, businessId);

      if (!deleted) {
        return res.status(404).json({ message: "Deposit policy not found" });
      }

      res.json({ message: "Deposit policy deleted successfully" });
    } catch (error) {
      console.error("Delete deposit policy error:", error);
      res.status(500).json({ message: "Failed to delete deposit policy" });
    }
  });

  // Get deposit policy for specific service
  app.get("/api/deposit-policies/service/:serviceId", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const { serviceId } = req.params;
      const businessId = req.user!.businessId!;

      const policy = await storage.getDepositPolicyByService(businessId, serviceId);

      if (!policy) {
        return res.status(404).json({ message: "No deposit policy found for this service" });
      }

      res.json(policy);
    } catch (error) {
      console.error("Get service deposit policy error:", error);
      res.status(500).json({ message: "Failed to get service deposit policy" });
    }
  });

  // ============================================================================
  // WHATSAPP SESSION MANAGEMENT ROUTES (WaSender Integration - Phase 1)
  // ============================================================================

  // Get all WhatsApp sessions for business
  app.get("/api/whatsapp-sessions", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const businessId = req.user!.businessId!;
      let sessions = await storage.getWhatsAppSessionsByBusinessId(businessId);

      // Check and sync status for sessions in "connecting" state from WaSender
      const business = await storage.getBusiness(businessId);
      if (business?.whatsappWasenderApiKey) {
        const { WaSenderSessionService } = await import('./whatsapp-wasender-sessions');
        const sessionService = new WaSenderSessionService(
          business.whatsappWasenderApiKey,
          process.env.WASENDER_PERSONAL_ACCESS_TOKEN
        );

        // Check status for connecting sessions
        for (const session of sessions) {
          if (session.status === 'connecting' && session.sessionId) {
            try {
              const statusResult = await sessionService.getSessionStatus(session.sessionId);
              if (statusResult.success && statusResult.status) {
                const wasenderStatus = statusResult.status.toLowerCase();

                // Map WaSender status to our status
                let newStatus = session.status;
                if (wasenderStatus === 'connected' || wasenderStatus === 'active' || wasenderStatus === 'ready') {
                  newStatus = 'connected';
                } else if (wasenderStatus === 'disconnected' || wasenderStatus === 'offline') {
                  newStatus = 'disconnected';
                }

                // Update database if status changed
                if (newStatus !== session.status) {
                  console.log(`🔄 [WaSender] Status sync: ${session.sessionName} changed from ${session.status} to ${newStatus}`);
                  await db.update(whatsappSessions)
                    .set({
                      status: newStatus,
                      connectedAt: newStatus === 'connected' ? new Date() : session.connectedAt,
                      updatedAt: new Date(),
                    })
                    .where(eq(whatsappSessions.id, session.id));

                  // Update the session in our response array
                  session.status = newStatus as any;
                  if (newStatus === 'connected') {
                    session.connectedAt = new Date();
                  }
                }
              }
            } catch (statusError) {
              // Don't fail the whole request if status check fails for one session
              console.warn(`⚠️ [WaSender] Failed to check status for session ${session.sessionId}:`, statusError);
            }
          }
        }
      }

      res.json(sessions);
    } catch (error) {
      console.error("Get WhatsApp sessions error:", error);
      res.status(500).json({ message: "Failed to get WhatsApp sessions" });
    }
  });

  // Create new WhatsApp session and get QR code
  app.post("/api/whatsapp-sessions", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const { sessionName } = req.body;
      const user = req.user as any;

      if (!user?.businessId) {
        return res.status(401).json({ message: "Business context required" });
      }

      if (!sessionName) {
        return res.status(400).json({ message: "Session name is required" });
      }

      // Get business to retrieve WhatsApp number
      const business = await storage.getBusiness(user.businessId);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      // Check if business has a WhatsApp number configured
      if (!business.businessWhatsapp) {
        return res.status(400).json({
          message: "Business WhatsApp number not configured. Please add it in Settings > Communication Settings."
        });
      }

      // Get WaSender API key
      const wasenderApiKey = business.whatsappWasenderApiKey;
      if (!wasenderApiKey) {
        return res.status(400).json({ message: "WaSender API key not configured" });
      }

      // Create WaSender session service
      const { WaSenderSessionService } = await import('./whatsapp-wasender-sessions');
      const sessionService = new WaSenderSessionService(
        wasenderApiKey,
        process.env.WASENDER_PERSONAL_ACCESS_TOKEN
      );

      // Step 1: Check if session already exists
      const existingSessions = await storage.getWhatsAppSessionsByBusinessId(user.businessId);
      const existingSession = existingSessions.find(s => s.sessionName === sessionName);

      if (existingSession) {
        console.log(`📋 [WaSender] Session "${sessionName}" already exists, using existing session`);
        console.log(`🔍 [Debug] Existing session data:`, {
          id: existingSession.id,
          sessionId: existingSession.sessionId,
          sessionName: existingSession.sessionName,
          sessionIdType: typeof existingSession.sessionId
        });

        // Update session status
        await db.update(whatsappSessions)
          .set({
            status: 'connecting',
            updatedAt: new Date(),
          })
          .where(eq(whatsappSessions.id, existingSession.id));

        console.log(`✅ [Database] Session updated: ${existingSession.id}`);

        // CRITICAL: Use the numeric sessionId from database, NOT the session name
        console.log(`🔍 [Debug] Using sessionId for API call: ${existingSession.sessionId}`);

        // Start connection and get QR code for existing session
        const startResult = await sessionService.startConnection(existingSession.sessionId);

        // Check if session is already connected (not an error!)
        if (!startResult.success) {
          const errorMessage = startResult.error || '';
          const isAlreadyConnected = errorMessage.toLowerCase().includes('already connected');

          if (isAlreadyConnected) {
            console.log(`✅ [WaSender] Session is already connected!`);

            // Update session status to connected in database
            const [connectedSession] = await db.update(whatsappSessions)
              .set({
                status: 'connected',
                connectedAt: new Date(),
                updatedAt: new Date(),
              })
              .where(eq(whatsappSessions.id, existingSession.id))
              .returning();

            return res.json({
              success: true,
              session: connectedSession,
              alreadyConnected: true,
            });
          }

          console.error(`❌ [WaSender] Failed to start connection: ${startResult.error}`);
          return res.status(500).json({
            success: false,
            message: startResult.error || 'Failed to start connection',
          });
        }

        console.log(`✅ [WaSender] Connection started for existing session`);

        // Get QR code
        const qrResult = await sessionService.getQRCode(existingSession.sessionId);
        if (!qrResult.success || !qrResult.qrCode) {
          console.error(`❌ [WaSender] Failed to get QR code: ${qrResult.error}`);
          return res.status(500).json({
            success: false,
            message: qrResult.error || 'Failed to get QR code',
          });
        }

        console.log(`✅ [WaSender] QR code retrieved for existing session`);

        // Update session with QR code
        const qrCodeExpiresAt = new Date(Date.now() + (qrResult.expiresIn || 60) * 1000);

        const [updatedSession] = await db.update(whatsappSessions)
          .set({
            qrCode: qrResult.qrCode,
            qrCodeExpiresAt: qrCodeExpiresAt,
            updatedAt: new Date(),
          })
          .where(eq(whatsappSessions.id, existingSession.id))
          .returning();

        return res.json({
          success: true,
          session: updatedSession,
        });
      }

      // Create new session via WaSender API
      const createResult = await sessionService.createSession(sessionName, business.businessWhatsapp);

      if (!createResult.success || !createResult.sessionId) {
        return res.status(500).json({
          success: false,
          message: createResult.error || 'Failed to create WaSender session',
        });
      }

      console.log(`✅ [WaSender] Session created with ID: ${createResult.sessionId}`);

      // Store session in database
      const [newSession] = await db.insert(whatsappSessions).values({
        businessId: business.id,
        sessionId: createResult.sessionId, // This is the numeric ID from WaSender
        sessionName: sessionName, // This is the user-friendly name
        status: 'connecting',
        healthStatus: 'healthy',
      }).returning();

      console.log(`✅ [Database] Session stored with ID: ${newSession.id}`);
      console.log(`   - WaSender sessionId: ${createResult.sessionId}`);
      console.log(`   - Session name: ${sessionName}`);

      // Start connection for new session
      const startResult = await sessionService.startConnection(createResult.sessionId);
      if (!startResult.success) {
        console.error(`❌ [WaSender] Failed to start connection: ${startResult.error}`);
        return res.status(500).json({
          success: false,
          message: startResult.error || 'Failed to start connection',
        });
      }

      console.log(`✅ [WaSender] Connection started for new session`);

      // Get QR code for new session
      const qrResult = await sessionService.getQRCode(createResult.sessionId);
      if (!qrResult.success || !qrResult.qrCode) {
        console.error(`❌ [WaSender] Failed to get QR code: ${qrResult.error}`);
        return res.status(500).json({
          success: false,
          message: qrResult.error || 'Failed to get QR code',
        });
      }

      console.log(`✅ [WaSender] QR code retrieved for new session`);

      // Update session with QR code
      const qrCodeExpiresAt = new Date(Date.now() + (qrResult.expiresIn || 60) * 1000);

      const [updatedNewSession] = await db.update(whatsappSessions)
        .set({
          qrCode: qrResult.qrCode,
          qrCodeExpiresAt: qrCodeExpiresAt,
          updatedAt: new Date(),
        })
        .where(eq(whatsappSessions.id, newSession.id))
        .returning();

      return res.json({
        success: true,
        session: updatedNewSession,
      });
    } catch (error) {
      console.error("Create WaSender session error:", error);
      res.status(500).json({
        message: "Failed to create session",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Refresh QR code for session
  app.post("/api/whatsapp-sessions/:id/refresh-qr", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const businessId = req.user!.businessId!;
      const { id } = req.params;

      const session = await storage.getWhatsAppSession(id, businessId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      const business = await storage.getBusiness(businessId);
      if (!business?.whatsappWasenderApiKey) {
        return res.status(400).json({ message: "WaSender API key not configured" });
      }

      const { WaSenderSessionService } = await import('./whatsapp-wasender-sessions');
      const sessionService = new WaSenderSessionService(business.whatsappWasenderApiKey, process.env.WASENDER_PERSONAL_ACCESS_TOKEN);

      // Get new QR code
      const qrResult = await sessionService.getQRCode(session.sessionId);
      if (!qrResult.success || !qrResult.qrCode) {
        return res.status(500).json({
          message: "Failed to refresh QR code",
          error: qrResult.error
        });
      }

      // Update session with new QR code
      const updated = await storage.updateWhatsAppSession(id, businessId, {
        qrCode: qrResult.qrCode,
        qrCodeExpiresAt: new Date(Date.now() + (qrResult.expiresIn || 60) * 1000),
      });

      res.json(updated);
    } catch (error) {
      console.error("Refresh QR code error:", error);
      res.status(500).json({ message: "Failed to refresh QR code" });
    }
  });

  // Check session status
  app.get("/api/whatsapp-sessions/:id/status", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const businessId = req.user!.businessId!;
      const { id } = req.params;

      const session = await storage.getWhatsAppSession(id, businessId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      const business = await storage.getBusiness(businessId);
      if (!business?.whatsappWasenderApiKey) {
        return res.status(400).json({ message: "WaSender API key not configured" });
      }

      const { WaSenderSessionService } = await import('./whatsapp-wasender-sessions');
      const sessionService = new WaSenderSessionService(business.whatsappWasenderApiKey, process.env.WASENDER_PERSONAL_ACCESS_TOKEN);

      // Get session status from WaSender
      const statusResult = await sessionService.getSessionStatus(session.sessionId);
      if (!statusResult.success) {
        return res.status(500).json({
          message: "Failed to get session status",
          error: statusResult.error
        });
      }

      // Update local session with latest info
      const updateData: any = {
        status: statusResult.status,
        lastHeartbeatAt: new Date(),
      };

      if (statusResult.status === 'connected') {
        updateData.connectedAt = session.connectedAt || new Date();
        updateData.whatsappNumber = statusResult.whatsappNumber;
        updateData.whatsappName = statusResult.whatsappName;
        updateData.whatsappProfilePictureUrl = statusResult.profilePictureUrl;
        updateData.deviceInfo = statusResult.deviceInfo;
        updateData.healthStatus = 'healthy';
      } else {
        updateData.healthStatus = 'unhealthy'; // Assume unhealthy if not connected
      }

      const updated = await storage.updateWhatsAppSession(id, businessId, updateData);

      res.json(updated);
    } catch (error) {
      console.error("Check session status error:", error);
      res.status(500).json({ message: "Failed to check session status" });
    }
  });

  // Disconnect session
  app.post("/api/whatsapp-sessions/:id/disconnect", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const businessId = req.user!.businessId!;
      const { id } = req.params;

      const session = await storage.getWhatsAppSession(id, businessId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      const business = await storage.getBusiness(businessId);
      if (!business?.whatsappWasenderApiKey) {
        return res.status(400).json({ message: "WaSender API key not configured" });
      }

      const { WaSenderSessionService } = await import('./whatsapp-wasender-sessions');
      const sessionService = new WaSenderSessionService(business.whatsappWasenderApiKey, process.env.WASENDER_PERSONAL_ACCESS_TOKEN);

      // Disconnect on WaSender
      await sessionService.disconnectSession(session.sessionId);

      // Update local session
      const updated = await storage.updateWhatsAppSession(id, businessId, {
        status: 'disconnected',
        disconnectedAt: new Date(),
      });

      res.json(updated);
    } catch (error) {
      console.error("Disconnect session error:", error);
      res.status(500).json({ message: "Failed to disconnect session" });
    }
  });

  // Delete session
  app.delete("/api/whatsapp-sessions/:id", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const businessId = req.user!.businessId!;
      const { id } = req.params;

      const deleted = await storage.deleteWhatsAppSession(id, businessId);
      if (!deleted) {
        return res.status(404).json({ message: "Session not found" });
      }

      res.json({ message: "Session deleted successfully" });
    } catch (error) {
      console.error("Delete session error:", error);
      res.status(500).json({ message: "Failed to delete session" });
    }
  });

  // ============================================================================
  // WHATSAPP INTEGRATION ROUTES
  // ============================================================================

  // WhatsApp Health Check
  app.get("/api/whatsapp/health", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const businessId = req.user!.businessId!;
      const business = await storage.getBusiness(businessId);

      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      const provider = business.whatsappProvider || 'twilio';
      const queueStats = await storage.getWhatsAppQueueStats(businessId);

      res.json({
        healthy: true,
        provider: provider,
        queuePending: queueStats.pending || 0,
        queueSent: queueStats.sent || 0,
        queueFailed: queueStats.failed || 0,
        monthlyUsage: business.whatsappCurrentUsage || 0,
        monthlyLimit: business.whatsappMonthlyLimit || 1000,
      });
    } catch (error: any) {
      console.error("Error fetching WhatsApp health:", error);
      res.status(500).json({
        healthy: false,
        error: error.message
      });
    }
  });

  // Test WhatsApp messaging (development only)
  app.post("/api/whatsapp/test", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const { phoneNumber, message } = req.body;
      const businessId = req.user!.businessId!;

      if (!phoneNumber || !message) {
        return res.status(400).json({ message: "Phone number and message are required" });
      }

      // Import WhatsApp service
      const { queueWhatsAppMessage, formatSAPhoneNumber } = await import('./whatsapp-service');
      const { processWhatsAppQueue } = await import('./whatsapp-queue');

      // Format and queue message
      const formattedNumber = formatSAPhoneNumber(phoneNumber);

      const queueItem = await queueWhatsAppMessage({
        businessId,
        toNumber: formattedNumber,
        messageBody: message,
        relatedType: 'test',
      });

      // Process queue immediately for testing
      await processWhatsAppQueue(business.id);

      res.json({
        success: true,
        message: "WhatsApp message queued and sent",
        queueItem,
        formattedNumber
      });
    } catch (error: any) {
      console.error("WhatsApp test error:", error);
      res.status(500).json({ message: error.message || "Failed to send test WhatsApp" });
    }
  });

  // Get WhatsApp usage stats
  app.get("/api/whatsapp/usage", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const businessId = req.user!.businessId!;
      const business = await storage.getBusiness(businessId);

      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      const { checkWhatsAppLimit } = await import('./whatsapp-service');
      const limitCheck = await checkWhatsAppLimit(businessId);

      res.json({
        currentUsage: business.whatsappCurrentUsage || 0,
        monthlyLimit: business.whatsappMonthlyLimit || 1000,
        remaining: limitCheck.remaining,
        percentage: limitCheck.percentage,
        provider: business.whatsappProvider || 'twilio',
        resetDate: business.whatsappUsageResetDate,
      });
    } catch (error) {
      console.error("Get WhatsApp usage error:", error);
      res.status(500).json({ message: "Failed to get WhatsApp usage" });
    }
  });

  // WhatsApp Templates
  app.get('/api/whatsapp/templates', requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const templates = await storage.getWhatsappTemplatesByBusinessId(req.user!.businessId!);
      res.json(templates);
    } catch (error) {
      console.error('Get templates error:', error);
      res.status(500).json({ message: 'Failed to get templates' });
    }
  });

  // WhatsApp Analytics
  app.get('/api/whatsapp/analytics', requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const { getWhatsAppAnalytics } = await import('./whatsapp-analytics');

      const { startDate, endDate } = req.query;
      const analytics = await getWhatsAppAnalytics(
        req.user!.businessId!,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.json(analytics);
    } catch (error) {
      console.error('Get analytics error:', error);
      res.status(500).json({ message: 'Failed to get analytics' });
    }
  });

  // WhatsApp Message History
  app.get('/api/whatsapp/messages', requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const { getWhatsAppMessageHistory } = await import('./whatsapp-analytics');

      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const messages = await getWhatsAppMessageHistory(req.user!.businessId!, limit, offset);
      res.json(messages);
    } catch (error) {
      console.error('Get message history error:', error);
      res.status(500).json({ message: 'Failed to get message history' });
    }
  });

  // WhatsApp Opt-In for Contact
  app.post('/api/contacts/:id/whatsapp-opt-in', requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const contactId = req.params.id;
      const businessId = req.user!.businessId!;

      const contact = await storage.getContact(contactId, businessId);
      if (!contact) {
        return res.status(404).json({ message: 'Contact not found' });
      }

      const updated = await storage.updateContact(contactId, businessId, {
        whatsappOptIn: true,
        whatsappOptInDate: new Date(),
        whatsappOptOutDate: null,
        preferredChannel: contact.preferredChannel || 'both',
      });

      res.json({
        message: 'WhatsApp opt-in recorded',
        contact: updated
      });
    } catch (error) {
      console.error('WhatsApp opt-in error:', error);
      res.status(500).json({ message: 'Failed to record opt-in' });
    }
  });

  // WhatsApp Opt-Out for Contact
  app.post('/api/contacts/:id/whatsapp-opt-out', requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const contactId = req.params.id;
      const businessId = req.user!.businessId!;

      const contact = await storage.getContact(contactId, businessId);
      if (!contact) {
        return res.status(404).json({ message: 'Contact not found' });
      }

      const updated = await storage.updateContact(contactId, businessId, {
        whatsappOptIn: false,
        whatsappOptOutDate: new Date(),
        preferredChannel: 'email', // Default to email when opted out
      });

      res.json({
        message: 'WhatsApp opt-out recorded',
        contact: updated
      });
    } catch (error) {
      console.error('WhatsApp opt-out error:', error);
      res.status(500).json({ message: 'Failed to record opt-out' });
    }
  });

  // Initialize default templates
  app.post("/api/whatsapp/templates/initialize", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const businessId = req.user!.businessId!;
      const { initializeDefaultTemplates } = await import('./whatsapp-templates');

      await initializeDefaultTemplates(businessId);

      res.json({
        success: true,
        message: "Default WhatsApp templates initialized and submitted for approval"
      });
    } catch (error) {
      console.error("Initialize templates error:", error);
      res.status(500).json({ message: "Failed to initialize templates" });
    }
  });

  // Get WhatsApp queue history
  app.get("/api/whatsapp/queue", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const businessId = req.user!.businessId!;
      const { limit = 50, status } = req.query;

      let queue = await storage.getWhatsappQueueByBusinessId(businessId, parseInt(limit as string));

      if (status) {
        queue = queue.filter(item => item.status === status);
      }

      res.json(queue);
    } catch (error) {
      console.error("Get WhatsApp queue error:", error);
      res.status(500).json({ message: "Failed to get WhatsApp queue" });
    }
  });

  // Process WhatsApp queue manually (for testing)
  app.post("/api/whatsapp/process-queue", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const businessId = req.user!.businessId!;
      const { processWhatsAppQueue } = await import('./whatsapp-queue');

      const sentCount = await processWhatsAppQueue(businessId);

      res.json({
        success: true,
        sentCount,
        message: `Processed queue: ${sentCount} messages sent`
      });
    } catch (error: any) {
      console.error("Process queue error:", error);
      res.status(500).json({ message: error.message || "Failed to process queue" });
    }
  });

  // WaSender WhatsApp Webhook (with security and rate limiting)
  app.post("/api/webhooks/wasender/whatsapp", webhookRateLimiter(), async (req: Request, res: Response) => {
    try {
      const { WebhookSecurity } = await import('./encryption');
      const signature = req.headers['x-wasender-signature'] as string;

      if (!signature) {
        console.error('❌ [WaSender Webhook] Missing signature');
        return res.status(401).json({ error: 'Missing signature' });
      }

      // Get business from session ID in payload
      const { sessionId, event, data } = req.body;

      if (!sessionId) {
        console.error('❌ [WaSender Webhook] Missing session ID');
        return res.status(400).json({ error: 'Missing session ID' });
      }

      // Find session to get business and verify signature
      const sessions = await storage.getAllWhatsAppSessions();
      const session = sessions.find(s => s.sessionId === sessionId);

      if (!session) {
        console.error('❌ [WaSender Webhook] Session not found:', sessionId);
        return res.status(404).json({ error: 'Session not found' });
      }

      // Get business to retrieve webhook secret
      const business = await storage.getBusiness(session.businessId);
      if (!business?.whatsappWasenderApiKey) {
        console.error('❌ [WaSender Webhook] No API key for business');
        return res.status(400).json({ error: 'Invalid configuration' });
      }

      // Validate webhook signature
      const isValid = WebhookSecurity.validateWaSenderSignature(
        req.body,
        signature,
        business.whatsappWasenderApiKey
      );

      if (!isValid) {
        console.error('❌ [WaSender Webhook] Invalid signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }

      console.log(`✅ [WaSender Webhook] Received event: ${event} for session: ${sessionId}`);

      // Handle webhook events
      switch (event) {
        case 'session.connected':
          await storage.updateWhatsAppSession(session.id, session.businessId, {
            status: 'connected',
            connectedAt: new Date(),
            whatsappNumber: data.whatsappNumber,
            whatsappName: data.whatsappName,
            whatsappProfilePictureUrl: data.profilePictureUrl,
            deviceInfo: data.deviceInfo,
            healthStatus: 'healthy',
          });
          break;

        case 'session.disconnected':
          await storage.updateWhatsAppSession(session.id, session.businessId, {
            status: 'disconnected',
            disconnectedAt: new Date(),
            healthStatus: 'unhealthy',
          });
          break;

        case 'message.sent':
          // Update queue item status
          if (data.messageId) {
            const queueItem = await storage.getWhatsAppQueueByProviderMessageId(data.messageId);
            if (queueItem) {
              await storage.updateWhatsAppQueueItem(queueItem.id, queueItem.businessId, {
                status: 'sent',
                sentAt: new Date(),
              });
            }
          }
          break;

        case 'message.delivered':
          if (data.messageId) {
            const queueItem = await storage.getWhatsAppQueueByProviderMessageId(data.messageId);
            if (queueItem) {
              await storage.updateWhatsAppQueueItem(queueItem.id, queueItem.businessId, {
                status: 'delivered',
                deliveredAt: new Date(),
              });
            }
          }
          break;

        case 'message.read':
          if (data.messageId) {
            const queueItem = await storage.getWhatsAppQueueByProviderMessageId(data.messageId);
            if (queueItem) {
              await storage.updateWhatsAppQueueItem(queueItem.id, queueItem.businessId, {
                status: 'read',
                readAt: new Date(),
              });
            }
          }
          break;

        case 'message.failed':
          if (data.messageId) {
            const queueItem = await storage.getWhatsAppQueueByProviderMessageId(data.messageId);
            if (queueItem) {
              await storage.updateWhatsAppQueueItem(queueItem.id, queueItem.businessId, {
                status: 'failed',
                failedAt: new Date(),
                errorMessage: data.error || 'Message delivery failed',
              });
            }
          }
          break;

        default:
          console.log(`⚠️ [WaSender Webhook] Unhandled event: ${event}`);
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('❌ [WaSender Webhook] Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Twilio WhatsApp Status Webhook (public endpoint)
  app.post("/api/webhooks/twilio/whatsapp/status", webhookRateLimiter(), async (req: Request, res: Response) => {
    try {
      const { MessageSid, MessageStatus, ErrorMessage, From, To } = req.body;

      console.log(`📨 [Webhook] Received status update for ${MessageSid}: ${MessageStatus}`);

      if (!MessageSid) {
        return res.sendStatus(200); // Twilio expects 200 even if we can't process
      }

      // Find queue item by provider message ID
      const queueItem = await storage.getWhatsAppQueueByProviderMessageId(MessageSid);

      if (!queueItem) {
        console.warn(`⚠️ [Webhook] No queue item found for ${MessageSid}`);
        return res.sendStatus(200);
      }

      // Map Twilio status to our status
      const updates: any = {};

      switch (MessageStatus) {
        case 'delivered':
          updates.status = 'delivered';
          updates.deliveredAt = new Date();
          break;
        case 'read':
          updates.status = 'read';
          updates.readAt = new Date();
          break;
        case 'failed':
        case 'undelivered':
          updates.status = 'failed';
          updates.failedAt = new Date();
          updates.errorMessage = ErrorMessage || 'Delivery failed';
          break;
        case 'sent':
          updates.status = 'sent';
          updates.sentAt = new Date();
          break;
      }

      if (Object.keys(updates).length > 0) {
        await storage.updateWhatsAppQueueItem(queueItem.id, queueItem.businessId, updates);
        console.log(`✅ [Webhook] Updated ${MessageSid} to ${MessageStatus}`);
      }

      res.sendStatus(200);
    } catch (error) {
      console.error("❌ [Webhook] Error processing status:", error);
      res.sendStatus(500);
    }
  });

  // WhatsApp Health Check
  app.get("/api/whatsapp/health", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const businessId = req.user!.businessId!;
      const business = await storage.getBusiness(businessId);

      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      const queue = await storage.getWhatsappQueueByBusinessId(businessId, 1000);
      const pendingCount = queue.filter(m => m.status === 'pending').length;
      const failedCount = queue.filter(m => m.status === 'failed').length;

      const healthy = failedCount < 10 && pendingCount < 100; // Arbitrary thresholds

      res.json({
        healthy,
        provider: business.whatsappProvider || 'twilio',
        queueSize: queue.length,
        pendingMessages: pendingCount,
        failedMessages: failedCount,
        currentUsage: business.whatsappCurrentUsage || 0,
        monthlyLimit: business.whatsappMonthlyLimit || 1000,
        usagePercentage: Math.round(((business.whatsappCurrentUsage || 0) / (business.whatsappMonthlyLimit || 1000)) * 100),
        resetDate: business.whatsappUsageResetDate,
      });
    } catch (error) {
      console.error("Health check error:", error);
      res.status(500).json({
        healthy: false,
        message: "Health check failed",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // ============================================================================
  // DASHBOARDROUTES
  // ============================================================================

  // Get business profile
  app.get("/api/business/profile", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      if (!user.businessId) {
        return res.status(400).json({ error: "No business associated with user" });
      }

      const business = await storage.getBusiness(user.businessId);
      if (!business) {
        return res.status(404).json({ error: "Business not found" });
      }

      res.json(business);
    } catch (error) {
      console.error("Get business profile error:", error);
      res.status(500).json({ error: "Failed to get business profile" });
    }
  });

  // Update business profile
  app.patch("/api/business/profile", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      if (!req.user?.businessId) {
        return res.status(401).json({ message: "Business context required" });
      }

      const updates = req.body;

      // Handle address geocoding if address fields are provided
      if (updates.addressLine1 || updates.city || updates.province) {
        const { geocodingService } = await import('./geocoding-service');

        const fullAddress = `${updates.addressLine1 || ''}, ${updates.city || ''}, ${updates.province || ''}, ${updates.postalCode || ''}`.trim();

        if (fullAddress.length > 5) {
          console.log('🏢 Geocoding business address:', fullAddress);

          const geocodeResult = await geocodingService.geocodeAddress(fullAddress);

          if (geocodeResult) {
            updates.addressLatitude = geocodeResult.coordinates.lat;
            updates.addressLongitude = geocodeResult.coordinates.lng;
            console.log('✅ Business geocoded:', geocodeResult);
          } else {
            console.log('⚠️ Could not geocode business address');
          }
        }
      }

      // Ensure gbpReviewUrl is included in updates if provided
      if ('gbpReviewUrl' in req.body) {
        updates.gbpReviewUrl = req.body.gbpReviewUrl;
      }

      const business = await storage.updateBusiness(req.user.businessId, updates);

      res.json(business);
    } catch (error) {
      console.error("Update business profile error:", error);
      res.status(500).json({ message: "Failed to update business profile" });
    }
  });

  app.get("/api/dashboard/stats", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      if (!req.user.businessId) {
        return res.status(400).json({ message: "No business associated with user. Please complete business onboarding first." });
      }

      const businessId = req.user.businessId;

      // Get all data in parallel
      const [contacts, quotes, jobs, invoices] = await Promise.all([
        storage.getContactsByBusinessId(businessId),
        storage.getQuotesByBusinessId(businessId),
        storage.getJobsByBusinessId(businessId),
        storage.getInvoicesByBusinessId(businessId),
      ]);

      // Calculate stats
      const leadCount = contacts.filter(c => c.contactType === 'lead').length;
      const customerCount = contacts.filter(c => c.contactType === 'customer').length;

      const pendingQuotes = quotes.filter(q =>
        q.status === 'sent' || q.status === 'viewed'
      ).length;

      // Jobs in the next 7 days
      const now = new Date();
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const jobsThisWeek = jobs.filter(j => {
        if (!j.scheduledDate) return false;
        const scheduledDate = new Date(j.scheduledDate);
        return scheduledDate >= now && scheduledDate <= oneWeekFromNow;
      }).length;

      // Helper to get correct amount: use balanceDue for final invoices, totalAmount for others, exclude deposits
      const getAmountForCalculation = (invoice: any): number => {
        if (invoice.invoiceType === "deposit") return 0;
        if (invoice.invoiceType === "final" && invoice.balanceDue) {
          return parseFloat(invoice.balanceDue);
        }
        return parseFloat(invoice.totalAmount);
      };

      // Outstanding invoices total (sent or overdue - matches insights dashboard)
      const outstandingInvoiceTotal = invoices
        .filter(i => i.status === 'sent' || i.status === 'overdue')
        .reduce((sum, i) => sum + getAmountForCalculation(i), 0);

      // Overdue invoices total
      const overdueInvoiceTotal = invoices
        .filter(i => i.status === 'overdue')
        .reduce((sum, i) => sum + getAmountForCalculation(i), 0);

      // Amount Lost in Pipeline: Total quote value minus total invoice value
      const quotesValue = quotes.reduce((sum, q) => sum + parseFloat(q.amount || 0), 0);
      const invoicesValue = invoices
        .filter(i => i.invoiceType !== "deposit")
        .reduce((sum, i) => sum + parseFloat(i.totalAmount), 0);
      const amountLostInPipeline = quotesValue - invoicesValue;

      // Collection Rate: Paid invoices / Total invoices * 100
      const paidInvoicesCount = invoices.filter(i => i.status === 'paid').length;
      const collectionRate = invoices.length > 0
        ? Math.round((paidInvoicesCount / invoices.length) * 100)
        : 0;

      res.json({
        totalContacts: contacts.length,
        leadCount,
        customerCount,
        pendingQuotes,
        jobsThisWeek,
        outstandingInvoiceTotal,
        overdueInvoiceTotal,
        amountLostInPipeline,
        collectionRate,
      });
    } catch (error) {
      console.error("Get dashboard stats error:", error);
      res.status(500).json({ message: "Failed to get dashboard stats" });
    }
  });

  // ============================================================================
  // BUSINESS MANAGEMENT ROUTES
  // ============================================================================

  // Business profile endpoint
  app.get("/api/businesses/:id", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      // Only allow users to fetch their own business data
      if (req.user && req.params.id !== req.user.businessId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const business = await storage.getBusiness(req.params.id);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }
      res.json(business);
    } catch (error) {
      console.error("Get business error:", error);
      res.status(500).json({ message: "Failed to fetch business" });
    }
  });

  // Update business endpoint (for onboarding progress)
  // attachBusinessContext is required: without it req.user.businessId is never
  // populated for session-authenticated users, so the ownership check below
  // rejected every request and the whole Settings page failed to save.
  app.patch("/api/businesses/:id", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      // Only allow users to update their own business
      if (!req.user || req.params.id !== req.user.businessId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updates = req.body;
      const updated = await storage.updateBusiness(req.params.id, updates);

      if (!updated) {
        return res.status(404).json({ message: "Business not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Update business error:", error);
      res.status(500).json({ message: "Failed to update business" });
    }
  });

  app.get("/api/businesses/:id/stats", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      if (req.params.id !== req.user!.businessId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get dashboard statistics
      const [contacts, quotes, jobs, invoices] = await Promise.all([
        storage.getContactsByBusinessId(req.user!.businessId!),
        storage.getQuotesByBusinessId(req.user!.businessId!),
        storage.getJobsByBusinessId(req.user!.businessId!),
        storage.getInvoicesByBusinessId(req.user!.businessId!)
      ]);

      const thisMonth = new Date().getMonth();
      const thisYear = new Date().getFullYear();

      const stats = {
        totalLeads: contacts.filter(c => c.contactType === 'lead').length,
        totalCustomers: contacts.filter(c => c.contactType === 'customer').length,
        totalQuotes: quotes.length,
        quotesThisMonth: quotes.filter(q => {
          if (!q.createdAt) return false;
          const d = new Date(q.createdAt);
          return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
        }).length,
        totalJobs: jobs.length,
        jobsThisMonth: jobs.filter(j => {
          if (!j.createdAt) return false;
          const d = new Date(j.createdAt);
          return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
        }).length,
        totalRevenue: invoices
          .filter(i => i.status === 'paid' && i.invoiceType !== 'deposit')
          .reduce((sum, i) => sum + parseFloat(i.totalAmount), 0),
        conversionRate: quotes.length > 0
          ? ((quotes.filter(q => q.status === 'accepted').length / quotes.length) * 100).toFixed(2)
          : 0,
      };

      res.json(stats);
    } catch (error) {
      console.error("Get business stats error:", error);
      res.status(500).json({ message: "Failed to get business stats" });
    }
  });

  // ============================================================================
  // CONTACT/LEAD MANAGEMENT ROUTES
  // ============================================================================

  app.post("/api/contacts", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const data = contactSchema.parse(req.body);
      const contact = await storage.createContact({
        ...data,
        businessId: req.user!.businessId!,
      });

      // Log activity: contact created
      await storage.createActivityLog({
        businessId: req.user!.businessId!,
        userId: req.user!.id,
        action: "create",
        entityType: "contact",
        entityId: contact.id,
        changes: {
          contactType: contact.contactType,
          leadSource: contact.leadSource,
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.status(201).json(contact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Create contact error:", error);
      res.status(500).json({ message: "Failed to create contact" });
    }
  });

  app.get("/api/contacts", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      let contacts = await storage.getContactsByBusinessId(req.user!.businessId!);

      // Apply filters
      if (req.query.contactType) {
        contacts = contacts.filter(c => c.contactType === req.query.contactType);
      }
      if (req.query.leadStatus) {
        contacts = contacts.filter(c => c.leadStatus === req.query.leadStatus);
      }
      if (req.query.leadSource) {
        contacts = contacts.filter(c => c.leadSource === req.query.leadSource);
      }
      if (req.query.search) {
        const search = (req.query.search as string).toLowerCase();
        contacts = contacts.filter(c =>
          c.fullName.toLowerCase().includes(search) ||
          c.email?.toLowerCase().includes(search) ||
          c.phone?.toLowerCase().includes(search)
        );
      }

      res.json(contacts);
    } catch (error) {
      console.error("Get contacts error:", error);
      res.status(500).json({ message: "Failed to get contacts" });
    }
  });

  app.get("/api/contacts/:id", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const contactId = req.params.id;

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(contactId)) {
        return res.status(400).json({ message: "Invalid contact ID format" });
      }

      const contact = await storage.getContact(contactId, req.user!.businessId!);
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      res.json(contact);
    } catch (error) {
      console.error("Get contact error:", error);
      res.status(500).json({ message: "Failed to get contact" });
    }
  });

  // Get activity logs filtered by contact
  app.get("/api/activity-log", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const { contactId } = req.query;
      const businessId = req.user!.businessId!;

      const activities = await storage.getActivityLogsByBusinessId(businessId);

      // Filter by contactId if provided
      const filteredActivities = contactId
        ? activities.filter(a => a.contactId === contactId)
        : activities;

      res.json(filteredActivities);
    } catch (error) {
      console.error("Get activity log error:", error);
      res.status(500).json({ message: "Failed to get activity log" });
    }
  });

  // Get enriched activity logs with contact names, quote amounts, service types, etc.
  app.get("/api/activity-log/enriched", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const businessId = req.user!.businessId!;
      const limit = parseInt(req.query.limit as string) || 10;

      // Get base activities
      const activities = await storage.getActivityLogsByBusinessId(businessId);
      
      // Sort by createdAt descending and limit
      const recentActivities = activities
        .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
        .slice(0, limit);

      // Collect unique IDs for batch fetching
      const contactIds = new Set<string>();
      const quoteIds = new Set<string>();
      const jobIds = new Set<string>();
      const invoiceIds = new Set<string>();

      for (const activity of recentActivities) {
        if (activity.contactId) contactIds.add(activity.contactId);
        if (activity.entityId) {
          if (activity.entityType === 'quote') quoteIds.add(activity.entityId);
          if (activity.entityType === 'job') jobIds.add(activity.entityId);
          if (activity.entityType === 'invoice') invoiceIds.add(activity.entityId);
        }
      }

      // Batch fetch related entities
      const [contacts, quotes, jobs, invoices] = await Promise.all([
        Promise.all(Array.from(contactIds).map(id => storage.getContact(id, businessId).catch(() => null))),
        Promise.all(Array.from(quoteIds).map(id => storage.getQuote(id, businessId).catch(() => null))),
        Promise.all(Array.from(jobIds).map(id => storage.getJob(id, businessId).catch(() => null))),
        Promise.all(Array.from(invoiceIds).map(id => storage.getInvoice(id, businessId).catch(() => null))),
      ]);

      // Create lookup maps
      const contactMap = new Map(contacts.filter(Boolean).map(c => [c!.id, c!]));
      const quoteMap = new Map(quotes.filter(Boolean).map(q => [q!.id, q!]));
      const jobMap = new Map(jobs.filter(Boolean).map(j => [j!.id, j!]));
      const invoiceMap = new Map(invoices.filter(Boolean).map(i => [i!.id, i!]));

      // Fetch service names for quotes and jobs
      const serviceIds = new Set<string>();
      for (const quote of quotes.filter(Boolean)) {
        if (quote!.serviceId) serviceIds.add(quote!.serviceId);
      }
      for (const job of jobs.filter(Boolean)) {
        if (job!.serviceId) serviceIds.add(job!.serviceId);
      }

      const services = await Promise.all(
        Array.from(serviceIds).map(id => storage.getService(id, businessId).catch(() => null))
      );
      const serviceMap = new Map(services.filter(Boolean).map(s => [s!.id, s!]));

      // Enrich activities with related data
      const enrichedActivities = recentActivities.map(activity => {
        const contact = activity.contactId ? contactMap.get(activity.contactId) : null;
        let quote = null;
        let job = null;
        let invoice = null;
        let service = null;

        if (activity.entityId) {
          if (activity.entityType === 'quote') {
            quote = quoteMap.get(activity.entityId);
            if (quote?.serviceId) service = serviceMap.get(quote.serviceId);
          }
          if (activity.entityType === 'job') {
            job = jobMap.get(activity.entityId);
            if (job?.serviceId) service = serviceMap.get(job.serviceId);
          }
          if (activity.entityType === 'invoice') {
            invoice = invoiceMap.get(activity.entityId);
          }
        }

        return {
          ...activity,
          contactName: contact?.fullName || null,
          contactEmail: contact?.email || null,
          quoteNumber: quote?.quoteNumber || null,
          quoteAmount: quote?.totalAmount || null,
          quoteStatus: quote?.status || null,
          quotePublicToken: quote?.publicToken || null,
          jobTitle: job?.title || null,
          jobStatus: job?.status || null,
          invoiceNumber: invoice?.invoiceNumber || null,
          invoiceAmount: invoice?.totalAmount || null,
          invoiceStatus: invoice?.status || null,
          serviceName: service?.name || (activity.changes as any)?.serviceName || (activity.changes as any)?.services?.[0] || null,
        };
      });

      res.json(enrichedActivities);
    } catch (error) {
      console.error("Get enriched activity log error:", error);
      res.status(500).json({ message: "Failed to get enriched activity log" });
    }
  });

  // Create manual activity log
  app.post("/api/activity-log", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const { contactId, action, entityType, entityId, changes } = req.body;
      const businessId = req.user!.businessId!;
      const userId = req.user!.id;

      if (!contactId || !action || !entityType) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const activity = await storage.createActivityLog({
        businessId,
        userId,
        contactId,
        action: action as any,
        entityType: entityType as any,
        entityId: entityId || null,
        changes: changes || null,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.status(201).json(activity);
    } catch (error) {
      console.error("Create activity log error:", error);
      res.status(500).json({ message: "Failed to create activity log" });
    }
  });

  app.patch("/api/contacts/:id", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      // Use partial validation for updates (all fields optional)
      const updateSchema = z.object({
        fullName: z.string().min(1, "Name is required").optional(),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().optional(),
        address: z.string().optional(),
        contactType: z.enum(["lead", "customer", "past_customer"]).optional(),
        leadSource: z.enum(["website", "referral", "google", "direct", "other"]).optional(),
        leadStatus: z.enum(["new", "contacted", "quoted", "converted", "lost"]).optional(),
        notes: z.string().optional(),
        preferredChannel: z.enum(["email", "whatsapp", "both"]).optional(),
        whatsappOptIn: z.boolean().optional(),
      });

      const data = updateSchema.parse(req.body);
      const updated = await storage.updateContact(req.params.id, req.user!.businessId!, data);
      if (!updated) {
        return res.status(404).json({ message: "Contact not found" });
      }
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Update contact error:", error);
      res.status(500).json({ message: "Failed to update contact" });
    }
  });

  app.delete("/api/contacts/:id", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const contact = await storage.getContact(req.params.id, req.user!.businessId!);
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }

      // Actually delete the contact from the database
      await storage.deleteContact(req.params.id, req.user!.businessId!);

      res.json({ message: "Contact deleted successfully" });
    } catch (error) {
      console.error("Delete contact error:", error);
      res.status(500).json({ message: "Failed to delete contact" });
    }
  });

  // ============================================================================
  // SERVICE CATALOG ROUTES
  // ============================================================================

  // Get industry-specific service templates
  app.get("/api/services/templates/:industry", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const { industry } = req.params;

      // Validate industry parameter
      if (!industry || typeof industry !== 'string') {
        return res.status(400).json({
          message: "Invalid industry parameter",
          error: "INVALID_INDUSTRY"
        });
      }

      // Get templates for the specified industry
      const { getTemplatesByIndustry, getAllIndustries } = await import('./industry-service-templates');

      const templates = getTemplatesByIndustry(industry);

      // Check if industry exists in our system
      const validIndustries = getAllIndustries();
      if (!validIndustries.includes(industry) && templates.length === 0) {
        return res.status(404).json({
          message: "No templates found for this industry",
          error: "INDUSTRY_NOT_FOUND",
          validIndustries
        });
      }

      // Log template request for analytics
      console.log(`📋 [Templates API] Retrieved ${templates.length} templates for industry: ${industry} (Business: ${req.user!.businessId})`);

      // Return templates
      res.json({
        industry,
        templateCount: templates.length,
        templates
      });
    } catch (error) {
      console.error("Get service templates error:", error);
      res.status(500).json({
        message: "Failed to get service templates",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get all available industries with template counts
  app.get("/api/services/templates", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const { getAllIndustries, getTemplatesByIndustry, getTemplateCount } = await import('./industry-service-templates');

      const industries = getAllIndustries();
      const totalTemplates = getTemplateCount();

      const industryDetails = industries.map(industry => ({
        industry,
        templateCount: getTemplatesByIndustry(industry).length
      }));

      console.log(`📋 [Templates API] Retrieved template summary (Total: ${totalTemplates} templates across ${industries.length} industries)`);

      res.json({
        totalTemplates,
        industryCount: industries.length,
        industries: industryDetails
      });
    } catch (error) {
      console.error("Get templates summary error:", error);
      res.status(500).json({
        message: "Failed to get templates summary",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/services", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const { serviceQuestions, ...otherData } = req.body;
      const data = serviceSchema.parse(otherData);
      const service = await storage.createService({
        ...data,
        businessId: req.user!.businessId!,
        serviceQuestions: serviceQuestions || [],
      });
      res.status(201).json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Create service error:", error);
      res.status(500).json({ message: "Failed to create service" });
    }
  });

  app.get("/api/services", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const services = await storage.getServicesByBusinessId(req.user!.businessId!);
      services.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
      res.json(services);
    } catch (error) {
      console.error("Get services error:", error);
      res.status(500).json({ message: "Failed to get services" });
    }
  });

  app.get("/api/services/:id", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const service = await storage.getService(req.params.id, req.user!.businessId!);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      console.error("Get service error:", error);
      res.status(500).json({ message: "Failed to get service" });
    }
  });

  app.patch("/api/services/:id", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const { serviceQuestions, ...otherData } = req.body;
      const data = serviceSchema.partial().parse(otherData);
      const updateData = {
        ...data,
        ...(serviceQuestions !== undefined && { serviceQuestions }),
      };
      const updated = await storage.updateService(req.params.id, req.user!.businessId!, updateData);
      if (!updated) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Update service error:", error);
      res.status(500).json({ message: "Failed to update service" });
    }
  });

  // Delete service
  app.delete("/api/services/:id", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const businessId = req.user!.businessId!;

      // Verify service exists and belongs to this business
      const service = await storage.getService(id, businessId);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      // Delete the service
      await storage.deleteService(id, businessId);

      // Log activity (services don't have contactId, so we pass undefined)
      await ActivityLogger.log({
        businessId,
        userId: req.user!.id,
        action: "delete",
        entityType: "service",
        entityId: id,
      });

      res.json({ message: "Service deleted successfully" });
    } catch (error) {
      console.error("Delete service error:", error);
      res.status(500).json({ message: "Failed to delete service" });
    }
  });
  // ============================================================================
  // QUOTE MANAGEMENT ROUTES
  // ============================================================================

  // AI-powered quote generation
  app.post("/api/quotes/ai-generate", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const { serviceId, customerInput, contactId, photos } = req.body;

      if (!serviceId || !customerInput) {
        return res.status(400).json({ message: "Service ID and customer input are required" });
      }

      const businessId = req.user!.businessId!;
      const service = await storage.getService(serviceId, businessId);

      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      // Get all services for upselling context
      const allServices = await storage.getServicesByBusinessId(businessId);

      // Generate AI quote
      const aiResult = await aiQuoteService.generateQuote(
        service,
        customerInput,
        photos,
        allServices
      );

      // Create quote draft
      const quoteNumber = await generateQuoteNumber(businessId);

      const quote = await storage.createQuote({
        businessId,
        contactId,
        quoteNumber,
        status: "draft",
        validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days
        subtotal: aiResult.suggestedPrice.toFixed(2),
        taxAmount: (aiResult.suggestedPrice * 0.15).toFixed(2), // 15% VAT
        discountAmount: "0",
        totalAmount: (aiResult.suggestedPrice * 1.15).toFixed(2),
        notes: `AI-Generated Quote\n\n${aiResult.reasoning}\n\nConfidence: ${(aiResult.confidence * 100).toFixed(0)}%\n\nDistance: ${aiResult.distanceKm?.toFixed(1) ?? 'N/A'} km`,
        createdBy: req.user!.id,
      });

      // Create quote version for tracking with AI-generated line items
      const version = await storage.createQuoteVersion({
        quoteId: quote.id,
        versionNumber: 1,
        source: "ai",
        subtotal: aiResult.suggestedPrice.toFixed(2),
        taxAmount: (aiResult.suggestedPrice * 0.15).toFixed(2),
        discountAmount: "0",
        totalAmount: (aiResult.suggestedPrice * 1.15).toFixed(2),
        lineItems: aiResult.lineItems,
        aiExtractedFeatures: aiResult.extractedFeatures,
        aiConfidenceScore: aiResult.confidence.toFixed(2),
        aiReasoning: aiResult.reasoning,
        createdBy: req.user!.id,
      });

      // Update quote with version
      await storage.updateQuote(quote.id, business.id, {
        latestVersionId: version.id,
      });

      // Create line items (labor + materials)
      for (let i = 0; i < aiResult.lineItems.length; i++) {
        const item = aiResult.lineItems[i];
        await storage.createQuoteItem({
          quoteId: quote.id,
          serviceId: i === 0 ? service.id : undefined, // Only first item (labor) links to service
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
          displayOrder: i,
        });
      }

      const items = await storage.getQuoteItemsByQuoteId(quote.id);

      res.status(201).json({
        quote: { ...quote, items },
        aiAnalysis: {
          extractedFeatures: aiResult.extractedFeatures,
          confidence: aiResult.confidence,
          reasoning: aiResult.reasoning,
          upsellSuggestions: aiResult.upsellSuggestions,
        },
      });
    } catch (error) {
      console.error("AI quote generation error:", error);
      res.status(500).json({ message: "Failed to generate AI quote" });
    }
  });

  app.post("/api/quotes", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const { items, status: quoteStatus, ...jobDataRaw } = req.body; // Renamed status to quoteStatus
      const data = quoteSchema.parse(req.body);
      const businessId = req.user!.businessId!;

      // Validate that contact exists
      const contact = await storage.getContact(data.contactId, businessId);
      if (!contact) {
        return res.status(400).json({
          message: "Customer not found. The selected customer may have been deleted.",
          error: "CONTACT_NOT_FOUND"
        });
      }

      // Validate that at least one item exists
      if (!data.items || data.items.length === 0) {
        return res.status(400).json({
          message: "Quote must have at least one line item. Please add items to the quote.",
          error: "NO_LINE_ITEMS"
        });
      }

      // Generate quote number with retry logic
      let quoteNumber: string;
      let retries = 0;
      const maxRetries = 5;

      while (retries < maxRetries) {
        try {
          quoteNumber = await generateQuoteNumber(businessId);

          // Try to create the quote
          const quote = await storage.createQuote({
            businessId,
            contactId: data.contactId,
            quoteNumber,
            status: data.status || "draft",
            validUntil: data.validUntil,
            subtotal: data.subtotal,
            taxAmount: data.taxAmount || "0",
            discountAmount: data.discountAmount || "0",
            totalAmount: data.totalAmount,
            notes: data.notes,
            locationAddress: data.locationAddress,
            createdBy: req.user!.id,
            sentAt: data.status === "sent" ? new Date() : undefined,
            title: data.title,
            requiresDeposit: data.requiresDeposit || false,
            depositPercentage: data.depositPercentage || null,
            depositAmount: data.depositAmount || null,
          });

          // Success - create items
          if (data.items) {
            for (const item of data.items) {
              await storage.createQuoteItem({
                quoteId: quote.id,
                ...item,
              });
            }
          }

          const items = await storage.getQuoteItemsByQuoteId(quote.id);

          // Send email/WhatsApp if status is 'sent'
          if (data.status === 'sent') {
            try {
              const business = await storage.getBusiness(businessId);
              const contact = await storage.getContact(data.contactId, businessId);

              if (business && contact) {
                // Generate public token if not exists
                let publicToken = quote.publicToken;
                if (!publicToken) {
                  publicToken = crypto.randomUUID();
                  await storage.updateQuote(quote.id, businessId, { publicToken });
                }

                // Build quote view link
                const baseUrl = getPublicBaseUrl();
                const quoteViewLink = `${baseUrl}/quotes/${quote.id}/view?token=${publicToken}`;

                console.log(`\n`);
                console.log(`📤 [Create & Send Quote] Processing quote ${quote.quoteNumber} for ${contact.fullName}`);
                console.log(`📋 [Create & Send Quote] Contact details:`, {
                  whatsappOptIn: contact.whatsappOptIn,
                  phone: contact.phone,
                  preferredChannel: contact.preferredChannel,
                  whatsappProvider: business.whatsappProvider
                });

                // MULTI-CHANNEL LOGIC: WhatsApp First (if opted in)
                const { sendWhatsAppNotification } = await import('./whatsapp-notification');

                const whatsappResult = await sendWhatsAppNotification({
                  business,
                  contact,
                  messageBody: `Hi ${contact.fullName}, your quote ${quote.quoteNumber} is ready!\n\nTotal: R${parseFloat(quote.totalAmount).toFixed(2)}\nValid until: ${quote.validUntil || 'TBD'}\n\nView and accept: ${baseUrl}/quotes/${quote.id}/view?token=${publicToken}\n\n- ${business.businessName}`,
                  templateName: 'quote_sent_whatsapp',
                  relatedType: 'quote',
                  relatedId: quote.id,
                });

                if (whatsappResult.sent) {
                  console.log(`✅ [Create & Send Quote] WhatsApp notification sent`);
                } else {
                  console.log(`⚠️ [Create & Send Quote] WhatsApp skipped: ${whatsappResult.reason || whatsappResult.error}`);
                }

                // Email: Send if preferred channel is email or both, OR as fallback
                if (contact.email && (
                  !contact.whatsappOptIn ||
                  contact.preferredChannel === 'email' ||
                  contact.preferredChannel === 'both' ||
                  !whatsappResult.sent // Fallback if WhatsApp failed or was skipped due to limits
                )) {
                  console.log(`📧 [Create & Send Quote] Queueing email to ${contact.email}`);
                  const { getQuoteSentTemplate } = await import('./email-templates');
                  const emailContent = getQuoteSentTemplate({
                    businessName: business.businessName,
                    senderName: business.senderName || business.businessName,
                    recipientName: contact.fullName,
                    quoteNumber: quote.quoteNumber,
                    quoteTotal: `R${parseFloat(quote.totalAmount).toFixed(2)}`,
                    validUntil: quote.validUntil || 'TBD',
                    quoteViewLink,
                    businessPhone: business.phone || '',
                    businessEmail: business.email || '',
                  });

                  await storage.createEmailQueueItem({
                    businessId: business.id,
                    toEmail: contact.email,
                    toName: contact.fullName,
                    subject: emailContent.subject,
                    bodyHtml: emailContent.html,
                    bodyText: emailContent.text,
                    status: 'pending',
                    relatedType: 'quote',
                    relatedId: quote.id,
                  });

                  console.log(`✅ [Create & Send Quote] Email queued successfully`);
                }

                // Process queues
                console.log(`⚙️ [Create & Send Quote] Processing email queue...`);
                await processEmailQueue(storage, business.id);

                if (business.whatsappProvider && whatsappResult.sent) {
                  console.log(`⚙️ [Create & Send Quote] Processing WhatsApp queue...`);
                  const { processWhatsAppQueue } = await import('./whatsapp-queue');
                  await processWhatsAppQueue(business.id);
                }

                console.log(`✅ [Create & Send Quote] Quote ${quote.quoteNumber} sent successfully`);
              }
            } catch (sendError) {
              console.error("Error sending quote:", sendError);
              // Don't fail the quote creation if sending fails
            }
          }

          return res.status(201).json({ ...quote, items });

        } catch (createError: any) {
          // Check if it's a duplicate quote number error
          if (createError.code === '23505' && createError.constraint === 'quotes_quote_number_unique') {
            retries++;
            if (retries >= maxRetries) {
              throw new Error("Unable to generate unique quote number after multiple attempts. Please try again.");
            }
            // Wait a bit before retrying to avoid race conditions
            await new Promise(resolve => setTimeout(resolve, 100 * retries));
            continue;
          }
          // Other database errors
          throw createError;
        }
      }

      throw new Error("Failed to create quote after multiple attempts");

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Create quote error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      res.status(500).json({
        message: errorMessage.includes("Customer") || errorMessage.includes("customer")
          ? errorMessage
          : `Failed to create quote: ${errorMessage}. Please try again.`,
        error: "CREATE_FAILED"
      });
    }
  });

  app.get("/api/quotes/stats", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getQuoteStats(req.user!.businessId!);
      res.json(stats);
    } catch (error) {
      console.error("Get quote stats error:", error);
      res.status(500).json({ message: "Failed to get quote stats" });
    }
  });

  app.get("/api/quotes", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      let quotes = await storage.getQuotesByBusinessId(req.user!.businessId!);

      if (req.query.status) {
        const statusList = (req.query.status as string).split(',');
        quotes = quotes.filter(q => statusList.includes(q.status));
      }
      if (req.query.contactId) {
        quotes = quotes.filter(q => q.contactId === req.query.contactId);
      }

      // Fetch contact names and items for each quote
      const quotesWithDetails = await Promise.all(
        quotes.map(async (quote) => {
          const contact = await storage.getContact(quote.contactId, req.user!.businessId!);
          const items = await storage.getQuoteItemsByQuoteId(quote.id);
          return {
            ...quote,
            contactName: contact?.fullName || "Unknown",
            contactEmail: contact?.email || "",
            contactPhone: contact?.phone || "",
            items,
          };
        })
      );

      res.json(quotesWithDetails);
    } catch (error) {
      console.error("Get quotes error:", error);
      res.status(500).json({ message: "Failed to get quotes" });
    }
  });

  app.get("/api/quotes/:id", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const quote = await storage.getQuote(req.params.id, req.user!.businessId!);
      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }

      const items = await storage.getQuoteItemsByQuoteId(quote.id);
      res.json({ ...quote, items });
    } catch (error) {
      console.error("Get quote error:", error);
      res.status(500).json({ message: "Failed to get quote" });
    }
  });

  // Update quote
  app.patch("/api/quotes/:id", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const quoteId = req.params.id;
      const businessId = req.user!.businessId!;

      // Parse and validate update data
      const updateData = updateQuoteSchema.parse(req.body);
      const { items, ...quoteData } = updateData as any;

      // Get original quote to check status
      const originalQuote = await storage.getQuote(quoteId, businessId);
      if (!originalQuote) {
        return res.status(404).json({ message: "Quote not found" });
      }

      // Block editing accepted/declined quotes
      if (originalQuote.status === 'accepted' || originalQuote.status === 'declined') {
        return res.status(400).json({
          message: "Cannot edit accepted or declined quotes"
        });
      }

      // Validate that at least one item exists if items are being updated
      if (items !== undefined && items !== null) {
        if (!Array.isArray(items) || items.length === 0) {
          return res.status(400).json({
            message: "Quote must have at least one line item. Please add items to the quote.",
            error: "NO_LINE_ITEMS"
          });
        }

        // Validate that all items have valid descriptions and prices
        for (const item of items) {
          if (!item.description || item.description.trim() === "") {
            return res.status(400).json({
              message: "All line items must have a description",
              error: "INVALID_ITEM_DESCRIPTION"
            });
          }
          if (!item.unitPrice || parseFloat(item.unitPrice as any) <= 0) {
            return res.status(400).json({
              message: "All line items must have a price greater than 0",
              error: "INVALID_ITEM_PRICE"
            });
          }
        }
      }

      // Update the quote
      const updatedQuote = await storage.updateQuote(quoteId, businessId, quoteData);

      if (!updatedQuote){
        return res.status(404).json({ message: "Quote not found" });
      }

      // Handle line items if provided
      if (items && Array.isArray(items)) {
        // Delete existing items
        const existingItems = await storage.getQuoteItemsByQuoteId(quoteId);
        for (const item of existingItems) {
          await storage.deleteQuoteItem(item.id);
        }

        // Create new items
        for (const item of items) {
          await storage.createQuoteItem({
            quoteId,
            ...item,
          });
        }
      }

      // Only create version if status is ai_quote or sent (NOT draft)
      const shouldCreateVersion = ['ai_quote', 'sent'].includes(originalQuote.status);

      if (updatedQuote && items && shouldCreateVersion) {
        const latestVersion = await storage.getLatestQuoteVersion(quoteId);
        const nextVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

        const version = await storage.createQuoteVersion({
          quoteId: updatedQuote.id,
          versionNumber: nextVersionNumber,
          source: "manual",
          subtotal: updatedQuote.subtotal,
          taxAmount: updatedQuote.taxAmount || "0",
          discountAmount: updatedQuote.discountAmount || "0",
          totalAmount: updatedQuote.totalAmount,
          lineItems: items,
          notes: updatedQuote.notes || null,
          createdBy: req.user!.id,
        });

        // Update quote with latest version reference
        await storage.updateQuote(quoteId, businessId, {
          latestVersionId: version.id,
        });
      }

      // Fetch updated items to return
      const updatedItems = await storage.getQuoteItemsByQuoteId(quoteId);

      res.json({
        ...updatedQuote,
        items: updatedItems,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Update quote error:", error);
      res.status(500).json({ message: "Failed to update quote" });
    }
  });

  app.delete("/api/quotes/:id", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const quote = await storage.getQuote(req.params.id, req.user!.businessId!);
      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }

      await storage.deleteQuote(req.params.id, req.user!.businessId!);
      res.json({ message: "Quote deleted successfully" });
    } catch (error) {
      console.error("Delete quote error:", error);
      res.status(500).json({ message: "Failed to delete quote" });
    }
  });

  // Send quote
  app.post("/api/quotes/:id/send", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const quote = await storage.getQuote(req.params.id, req.user!.businessId!);
      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }

      const contact = await storage.getContact(quote.contactId, req.user!.businessId!);
      if (!contact?.email && !contact?.phone) {
        return res.status(400).json({ message: "Customer must have email or phone to send quote" });
      }

      const items = await storage.getQuoteItemsByQuoteId(quote.id);
      if (items.length === 0) {
        return res.status(400).json({ message: "Quote must have at least one line item" });
      }

      const businessId = req.user!.businessId!;
      const business = await storage.getBusiness(businessId);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      // Generate public token if not exists
      let publicToken = quote.publicToken;
      if (!publicToken) {
        publicToken = crypto.randomUUID();
        await storage.updateQuote(quote.id, businessId, { publicToken });
      }

      // Build quote view link using the publicToken variable (not quote.publicToken)
      const baseUrl = getPublicBaseUrl();
      const quoteViewLink = `${baseUrl}/quotes/${quote.id}/view?token=${publicToken}`;

      let sentVia: string[] = [];

      console.log(`\n`);
      console.log(`📤 [Send Quote] Processing quote ${quote.quoteNumber} for ${contact.fullName}`);
      console.log(`   - Contact phone: ${contact.phone || 'none'}`);
      console.log(`   - WhatsApp opted in: ${contact.whatsappOptIn}`);
      console.log(`   - Preferred channel: ${contact.preferredChannel}`);
      console.log(`   - Business has WhatsApp: ${!!business.whatsappProvider}`);

      // MULTI-CHANNEL LOGIC: WhatsApp First (if opted in)
      const { sendWhatsAppNotification } = await import('./whatsapp-notification');

      const whatsappResult = await sendWhatsAppNotification({
        business,
        contact,
        messageBody: `Hi ${contact.fullName}, your quote ${quote.quoteNumber} is ready!\n\nTotal: R${parseFloat(quote.totalAmount).toFixed(2)}\nValid until: ${quote.validUntil || 'TBD'}\n\nView and accept: ${baseUrl}/quotes/${quote.id}/view?token=${publicToken}\n\n- ${business.businessName}`,
        templateName: 'quote_sent_whatsapp',
        relatedType: 'quote',
        relatedId: quote.id,
      });

      if (whatsappResult.sent) {
        sentVia.push('WhatsApp');
        console.log(`✅ [Send Quote] WhatsApp notification sent`);
      } else {
        console.log(`⚠️ [Send Quote] WhatsApp skipped: ${whatsappResult.reason || whatsappResult.error}`);
      }

      // Email: Send if preferred channel is email or both, OR as fallback
      if (contact.email && (
        !contact.whatsappOptIn ||
        contact.preferredChannel === 'email' ||
        contact.preferredChannel === 'both' ||
        !whatsappResult.sent // Fallback if WhatsApp failed or was skipped due to limits
      )) {
        console.log(`📧 [Send Quote] Queueing email to ${contact.email}`);
        const { getQuoteSentTemplate } = await import('./email-templates');
        const emailContent = getQuoteSentTemplate({
          businessName: business.businessName,
          senderName: business.senderName || business.businessName,
          recipientName: contact.fullName,
          quoteNumber: quote.quoteNumber,
          quoteTotal: `R${parseFloat(quote.totalAmount).toFixed(2)}`,
          validUntil: quote.validUntil || 'TBD',
          quoteViewLink,
          businessPhone: business.phone || '',
          businessEmail: business.email || '',
        });

        await storage.createEmailQueueItem({
          businessId: business.id,
          toEmail: contact.email,
          toName: contact.fullName,
          subject: emailContent.subject,
          bodyHtml: emailContent.html,
          bodyText: emailContent.text,
          status: 'pending',
          relatedType: 'quote',
          relatedId: quote.id,
        });

        sentVia.push('Email');
        console.log(`✅ [Send Quote] Email queued successfully`);
      }

      // Process email queue
      console.log(`⚙️ [Send Quote] Processing email queue...`);
      await processEmailQueue(storage, business.id);

      if (business.whatsappProvider && whatsappResult.sent) {
        console.log(`⚙️ [Send Quote] Processing WhatsApp queue...`);
        const { processWhatsAppQueue } = await import('./whatsapp-queue');
        await processWhatsAppQueue(business.id);
      }

      // Update invoice status to sent
      const updated = await storage.updateQuote(quote.id, businessId, { status: 'sent', sentAt: new Date() });

      console.log(`✅ [Send Quote] Quote ${quote.quoteNumber} sent successfully via ${sentVia.join(' and ')}`);

      res.json({
        message: `Quote sent successfully via ${sentVia.join(' and ')}`,
        quote: updated,
        sentVia
      });
    } catch (error) {
      console.error("❌ [Send Quote] Error:", error);
      res.status(500).json({ message: "Failed to send quote" });
    }
  });

  // ============================================================================
  // JOB MANAGEMENT ROUTES
  // ============================================================================

  // Create job
  app.post("/api/jobs", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const { items: customItems, status: jobStatus, ...jobDataRaw } = req.body;
      const data = jobSchema.parse(jobDataRaw);
      const businessId = req.user!.businessId!;

      // If creating from a quote, get quote details
      let quoteData = null;
      let quoteItems = [];
      if (data.quoteId) {
        quoteData = await storage.getQuote(data.quoteId, businessId);
        if (quoteData) {
          quoteItems = await storage.getQuoteItemsByQuoteId(data.quoteId);

          // Update quote status to "accepted" when job is created
          await storage.updateQuote(data.quoteId, businessId, {
            status: "accepted"
          });
        }
      }

      // Use custom items if provided, otherwise copy from quote
      const itemsToCreate = customItems && Array.isArray(customItems) ? customItems : quoteItems;

      // Calculate totals from items if not coming from a quote
      let subtotal = quoteData?.subtotal;
      let taxAmount = quoteData?.taxAmount;
      let discountAmount = quoteData?.discountAmount;
      let totalAmount = quoteData?.totalAmount;

      if (!quoteData && itemsToCreate.length > 0) {
        const calculatedSubtotal = itemsToCreate.reduce((sum: number, item: any) =>
          sum + parseFloat(item.lineTotal || "0"), 0
        );
        subtotal = calculatedSubtotal.toFixed(2);
        taxAmount = "0";
        discountAmount = "0";
        totalAmount = calculatedSubtotal.toFixed(2);
      }

      // Determine job status based on deposit requirement
      let finalJobStatus = jobStatus || data.status || "scheduled";
      let depositDeadline = undefined;
      let depositInvoiceId = undefined;

      if (quoteData && quoteData.requiresDeposit) {
        // Quote requires deposit - set job to pending_deposit status
        finalJobStatus = "pending_deposit";

        // Set deposit deadline (default 48 hours from now)
        const business = await storage.getBusiness(businessId);
        const depositHours = business?.depositCancellationThresholdHours || 48;
        depositDeadline = new Date(Date.now() + depositHours * 60 * 60 * 1000);

        // Generate deposit invoice
        try {
          const invoiceNumber = await generateInvoiceNumber(businessId);
          const publicToken = crypto.randomUUID();

          // Calculate deposit amount
          let depositAmount = 0;
          if (quoteData.depositAmount) {
            depositAmount = parseFloat(quoteData.depositAmount);
          } else if (quoteData.depositPercentage) {
            const totalAmount = parseFloat(quoteData.totalAmount);
            depositAmount = (totalAmount * parseFloat(quoteData.depositPercentage)) / 100;
          }

          if (depositAmount > 0) {
            const totalAmount = parseFloat(quoteData.totalAmount);
            const balanceDue = totalAmount - depositAmount;

            const depositInvoice = await storage.createInvoice({
              businessId,
              jobId: undefined, // Will link after job creation
              contactId: data.contactId,
              quoteId: quoteData.id,
              invoiceNumber,
              title: `Deposit - ${quoteData.title || `Quote ${quoteData.quoteNumber}`}`,
              invoiceType: "deposit",
              status: "sent",
              dueDate: depositDeadline.toISOString().split('T')[0],
              subtotal: depositAmount.toFixed(2),
              taxAmount: "0",
              totalAmount: depositAmount.toFixed(2),
              depositAmount: depositAmount.toFixed(2),
              balanceDue: balanceDue.toFixed(2),
              publicToken,
              notes: `Deposit payment required to confirm booking. Balance of R${balanceDue.toFixed(2)} due upon completion.`,
              createdBy: undefined,
            });

            depositInvoiceId = depositInvoice.id;
            console.log(`✅ [Create Job] Deposit invoice generated: ${depositInvoice.invoiceNumber}`);
          }
        } catch (error) {
          console.error(`❌ [Create Job] Failed to generate deposit invoice:`, error);
          throw new Error("Failed to generate deposit invoice");
        }
      }

      // Generate job number with retry logic
      let job: any = null;
      let retries = 0;
      const maxRetries = 5;

      while (retries < maxRetries && !job) {
        try {
          const jobNumber = await generateJobNumber(businessId);

          // Try to create the job
          job = await storage.createJob({
            businessId,
            contactId: data.contactId,
            quoteId: data.quoteId || undefined,
            assignedTo: data.assignedTo || undefined,
            jobNumber,
            title: data.title,
            description: data.description || quoteData?.notes || undefined,
            status: finalJobStatus,
            scheduledDate: data.scheduledDate || new Date().toISOString().split('T')[0],
            scheduledStartTime: data.scheduledStartTime || undefined,
            scheduledEndTime: data.scheduledEndTime || undefined,
            locationAddress: data.locationAddress || undefined,
            internalNotes: data.internalNotes || undefined,
            subtotal: subtotal || undefined,
            taxAmount: taxAmount || undefined,
            discountAmount: discountAmount || undefined,
            totalAmount: totalAmount || undefined,
            depositInvoiceId: depositInvoiceId || undefined,
            depositPaid: false,
            depositDeadline: depositDeadline,
            depositRemindersSent: 0,
          });

        } catch (createError: any) {
          // Check if it's a duplicate job number error
          if (createError.code === '23505' && createError.constraint === 'jobs_job_number_unique') {
            retries++;
            if (retries >= maxRetries) {
              console.error(`Failed to generate unique job number after ${maxRetries} attempts`);
              throw new Error("Unable to generate unique job number after multiple attempts. Please try again.");
            }
            // Wait with exponential backoff before retrying
            await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, retries - 1)));
            continue;
          }
          // Other database errors - rethrow immediately
          console.error("Job creation error (non-duplicate):", createError);
          throw createError;
        }
      }

      if (!job) {
        throw new Error("Failed to create job after multiple attempts");
      }

      // Update deposit invoice with job link
      if (depositInvoiceId) {
        await storage.updateInvoice(depositInvoiceId, businessId, {
          jobId: job.id,
        });
      }

      if (itemsToCreate.length > 0) {
        for (const item of itemsToCreate){
          await storage.createJobItem({
            jobId: job.id,
            serviceId: item.serviceId || undefined,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
            displayOrder: item.displayOrder || 0,
          });
        }
      }

      // Send job confirmation email if status is scheduled
      if (job.status === 'scheduled') {
        try {
          const business = await storage.getBusiness(businessId);
          const contact = await storage.getContact(job.contactId, businessId);

          if (business && contact && contact.email) {
            const {getJobConfirmationTemplate } = await import('./email-templates');
            const scheduledTime = job.scheduledStartTime && job.scheduledEndTime
              ? `${job.scheduledStartTime} - ${job.scheduledEndTime}`
              : job.scheduledStartTime || 'TBD';

            const emailContent = getJobConfirmationTemplate({
              businessName: business.businessName,
              senderName: business.senderName || business.ownerName || 'Team',
              recipientName: contact.fullName,
              jobNumber: job.jobNumber,
              jobTitle: job.title,
              scheduledDate: job.scheduledDate,
              scheduledTime,
              locationAddress: job.locationAddress || '',
              businessPhone: business.phone || '',
              businessEmail: business.email || '',
            });

            await storage.createEmailQueueItem({
              businessId,
              toEmail: contact.email,
              toName: contact.fullName,
              subject: emailContent.subject,
              bodyHtml: emailContent.html,
              bodyText: emailContent.text,
              status: 'pending',
              relatedType: 'job',
              relatedId: job.id,
            });

            // Process email queue immediately
            await processEmailQueue(storage, businessId);
          }
        } catch (emailError) {
          console.error("Error sending job confirmation email:", emailError);
          // Don't fail the job creation if email fails
        }
      }

      // Fetch the complete job with items
      const items = await storage.getJobItemsByJobId(job.id);
      res.status(201).json({ ...job, items });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Create job error:", error);
      res.status(500).json({ message: "Failed to create job" });
    }
  });

  app.get("/api/jobs", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      let jobs = await storage.getJobsByBusinessId(req.user!.businessId!);

      if (req.query.status) {
        const statusList = (req.query.status as string).split(',');
        jobs = jobs.filter(j => statusList.includes(j.status));
      }
      if (req.query.contactId) {
        jobs = jobs.filter(j => j.contactId === req.query.contactId);
      }
      if (req.query.date) {
        const queryDate = new Date(req.query.date as string).toISOString().split('T')[0];

        jobs = jobs.filter(j => {
          if (!j.scheduledDate) return false;
          const jDate = typeof j.scheduledDate === 'string'
            ? j.scheduledDate.split('T')[0]
            : new Date(j.scheduledDate).toISOString().split('T')[0];
          return jDate === queryDate;
        });
      }

      // Fetch items and contact details for each job
      const jobsWithDetails = await Promise.all(
        jobs.map(async (job) => {
          const items = await storage.getJobItemsByJobId(job.id);
          const contact = await storage.getContact(job.contactId, req.user!.businessId!);
          return {
            ...job,
            items,
            contactName: contact?.fullName || "Unknown",
            contactPhone: contact?.phone || null,
            contactEmail: contact?.email || null
          };
        })
      );

      res.json(jobsWithDetails);
    } catch (error) {
      console.error("Get jobs error:", error);
      res.status(500).json({ message: "Failed to get jobs" });
    }
  });

  app.get("/api/jobs/:id", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const job = await storage.getJob(req.params.id, req.user!.businessId!);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      const items = await storage.getJobItemsByJobId(job.id);
      res.json({ ...job, items });
    } catch (error) {
      console.error("Get job error:", error);
      res.status(500).json({ message: "Failed to get job" });
    }
  });

  app.patch("/api/jobs/:id", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const { items, ...jobData } = req.body;

      // Update job data
      const updated = await storage.updateJob(req.params.id, req.user!.businessId!, jobData);
      if (!updated) {
        return res.status(404).json({ message: "Job not found" });
      }

      // If items are provided, update them
      if( items && Array.isArray(items) ) {
        // Delete existing items
        await storage.deleteJobItems(req.params.id);

        // Create new items
        for (const item of items) {
          await storage.createJobItem({
            jobId: req.params.id,
            ...item,
          });
        }
      }

      // Fetch complete job with items
      const jobItems = await storage.getJobItemsByJobId(req.params.id);
      res.json({ ...updated, items: jobItems });
    } catch (error) {
      console.error("Update job error:", error);
      res.status(500).json({ message: "Failed to update job" });
    }
  });

  app.delete("/api/jobs/:id", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const job = await storage.getJob(req.params.id, req.user!.businessId!);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      // Cascade delete associated items
      await storage.deleteJobItems(req.params.id);
      await storage.deleteJob(req.params.id, req.user!.businessId!);
      res.json({ message: "Job deleted successfully" });
    } catch (error) {
      console.error("Delete job error:", error);
      res.status(500).json({ message: "Failed to delete job" });
    }
  });

  // Complete job
  app.post("/api/jobs/:id/complete", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const job = await storage.getJob(req.params.id, req.user!.businessId!);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      if(job.status === "completed") {
        return res.status(400).json({ message: "Job is already completed" });
      }

      if (job.status === "cancelled") {
        return res.status(400).json({ message: "Cannot complete a cancelled job" });
      }

      const { notes } = req.body;

      // Fetch contact for notifications
      const contact = await storage.getContact(job.contactId, req.user!.businessId!);
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }

      // Get job items to calculate totals
      const jobItems = await storage.getJobItemsByJobId(job.id);

      // Always recalculate totals from job items to ensure accuracy
      let subtotal = 0;
      if (jobItems.length > 0) {
        subtotal = jobItems.reduce((sum, item) => {
          const lineTotal = parseFloat(item.lineTotal || "0");
          return sum + lineTotal;
        }, 0);
      } else if (job.subtotal) {
        // Fallback to job's existing subtotal only if no items
        subtotal = parseFloat(job.subtotal);
      }

      // Calculate tax (15% VAT for South Africa by default if job doesn't have tax)
      let taxAmount = 0;
      if (job.taxAmount && parseFloat(job.taxAmount) > 0) {
        taxAmount = parseFloat(job.taxAmount);
      } else {
        // Apply default 15% VAT if no tax specified
        taxAmount = subtotal * 0.15;
      }

      let discountAmount = job.discountAmount ? parseFloat(job.discountAmount) : 0;

      // Calculate total
      const totalAmount = subtotal - discountAmount + taxAmount;

      // Update job status with calculated totals
      const updated = await storage.updateJob(req.params.id, req.user!.businessId!, {
        status: "completed",
        actualEndTime: new Date(),
        internalNotes: notes ? `${job.internalNotes || ""}\n\nCompletion notes: ${notes}` : job.internalNotes,
        subtotal: subtotal.toFixed(2),
        taxAmount: taxAmount.toFixed(2),
        discountAmount: discountAmount.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
      });

      // Log activity: job_completed
      await ActivityLogger.jobCompleted(
        req.user!.businessId!,
        job.id,
        job.contactId,
        {
          actual_start_time: new Date().toISOString(),
          jobNumber: job.jobNumber,
          title: job.title,
        }
      );

      // Generate invoice draft from job
      const invoiceNumber = await generateInvoiceNumber(req.user!.businessId!);

      // Get business settings for default payment due days
      const business = await storage.getBusiness(req.user!.businessId!);
      const defaultDueDays = business?.defaultPaymentDueDays || 30;

      // Set due date based on business settings
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + defaultDueDays);

      // Check if this job has a deposit invoice
      let depositInvoice = null;
      let balanceDue = totalAmount;
      let invoiceType = "standard";
      let linkedDepositInvoiceId = null;
      let depositAmount = "0";

      if (job.depositInvoiceId) {
        try {
          depositInvoice = await storage.getInvoice(job.depositInvoiceId, req.user!.businessId!);
          if (depositInvoice) {
            invoiceType = "final";
            linkedDepositInvoiceId = depositInvoice.id;
            const depositAmountValue = parseFloat(depositInvoice.totalAmount);
            depositAmount = depositAmountValue.toFixed(2);
            balanceDue = Math.max(0, totalAmount - depositAmountValue);
          }
        } catch (err) {
          console.error("Failed to fetch deposit invoice:", err);
        }
      }

      // For final invoices, store balance due as the invoice total amount (clearer for customers)
      // For standard invoices, store the full total
      const invoiceTotal = invoiceType === 'final' ? balanceDue : totalAmount;

      const invoice = await storage.createInvoice({
        businessId: req.user!.businessId!,
        contactId: job.contactId,
        jobId: job.id,
        invoiceNumber,
        title: job.title,
        status: "sent",
        dueDate: dueDate.toISOString().split('T')[0],
        subtotal: subtotal.toFixed(2),
        taxAmount: taxAmount.toFixed(2),
        totalAmount: invoiceTotal.toFixed(2),
        notes: `${invoiceType === 'final' ? 'Final Invoice' : 'Invoice'} for ${job.title}\n\nJob #${job.jobNumber}${depositAmount !== '0' ? `\n\nPrevious Deposit: R${depositAmount}` : ''}${notes ? '\n\n' + notes : ''}`,
        invoiceType: invoiceType as any,
        linkedDepositInvoiceId: linkedDepositInvoiceId,
        depositAmount: depositAmount,
        balanceDue: balanceDue.toFixed(2),
      });

      // Copy job items to invoice items
      if (jobItems.length > 0) {
        for (const item of jobItems) {
          await storage.createInvoiceItem({
            invoiceId: invoice.id,
            serviceId: item.serviceId || undefined,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
            displayOrder: item.displayOrder,
          });
        }
      }

      // Queue business owner notification email
      await storage.createEmailQueueItem({
        businessId: business.id,
        toEmail: business.email,
        toName: business.ownerName || business.businessName,
        subject: `Job ${job.jobNumber} Completed - Invoice ${invoiceNumber} Created`,
        bodyHtml: `
          <h2>Job Completed! 🎉</h2>
          <p>Job ${job.jobNumber} has been marked as completed.</p>
          <p><strong>Invoice Details:</strong></p>
          <ul>
            <li>Invoice Number: ${invoiceNumber}</li>
            <li>Customer: ${contact?.fullName || 'Unknown'}</li>
            <li>Amount Due: R${invoiceTotal.toFixed(2)}</li>
            <li>Due Date: ${dueDate.toISOString().split('T')[0]}</li>
          </ul>
          <p>The invoice is ready to be reviewed in your dashboard.</p>
        `,
        bodyText: `Job Completed!\n\nJob ${job.jobNumber} has been marked as completed.\n\nInvoice Details:\n- Invoice Number: ${invoiceNumber}\n- Customer: ${contact?.fullName || 'Unknown'}\n- Amount Due: R${invoiceTotal.toFixed(2)}\n- Due Date: ${dueDate.toISOString().split('T')[0]}\n\nThe invoice is ready to be reviewed in your dashboard.`,
        status: 'pending',
        relatedType: 'invoice',
        relatedId: invoice.id,
      });

      // Queue customer email to invoice link (if email exists)
      if (contact && contact.email) {
        const { getInvoiceSentTemplate } = await import('./email-templates');
        const emailContent = getInvoiceSentTemplate({
          businessName: business.businessName,
          senderName: business.senderName || business.ownerName || 'Team',
          recipientName: contact.fullName,
          invoiceNumber: invoice.invoiceNumber,
          invoiceTotal: `R${parseFloat(invoice.totalAmount).toFixed(2)}`,
          dueDate: dueDate.toISOString().split('T')[0],
          invoiceViewLink: `${getPublicBaseUrl()}/invoices/${invoice.id}/view?token=${invoice.publicToken}`,
          businessPhone: business.phone || '',
          businessEmail: business.email || '',
        });

        await storage.createEmailQueueItem({
          businessId: business.id,
          toEmail: contact.email,
          toName: contact.fullName,
          subject: emailContent.subject,
          bodyHtml: emailContent.html,
          bodyText: emailContent.text,
          status: 'pending',
          relatedType: 'invoice',
          relatedId: invoice.id,
        });
      }

      await processEmailQueue(storage, business.id);

      // Send WhatsApp notification to customer about invoice (if opted in)
      console.log(`\n`);
      console.log(`📤 [Job Complete] Processing notifications for ${contact?.fullName}`);

      const { sendWhatsAppNotification } = await import('./whatsapp-notification');

      const whatsappResult = await sendWhatsAppNotification({
        business,
        contact,
        messageBody: `Invoice ${invoice.invoiceNumber} for ${job.title} is ready. Amount: R${invoiceTotal.toFixed(2)}. Due: ${dueDate.toISOString().split('T')[0]}. View & Pay: ${getPublicBaseUrl()}/invoices/${invoice.id}/view?token=${invoice.publicToken} - ${business.businessName}`,
        templateName: 'invoice_sent_whatsapp',
        templateParams: {
          '1': invoice.invoiceNumber,
          '2': job.title,
          '3': `R${invoiceTotal.toFixed(2)}`,
          '4': dueDate.toISOString().split('T')[0],
          '5': `${getPublicBaseUrl()}/invoices/${invoice.id}/view?token=${invoice.publicToken}`,
          '6': business.businessName,
        },
        relatedType: 'invoice',
        relatedId: invoice.id,
      });

      if (whatsappResult.sent) {
        console.log(`✅ [Job Complete] WhatsApp notification sent`);
      } else {
        console.log(`⚠️ [Job Complete] WhatsApp skipped: ${whatsappResult.reason || whatsappResult.error}`);
      }

      // Process WhatsApp queue
      if (business.whatsappProvider && whatsappResult.sent) {
        console.log(`⚙️ [Job Complete] Processing WhatsApp queue...`);
        const { processWhatsAppQueue } = await import('./whatsapp-queue');
        await processWhatsAppQueue(business.id);
      }

      res.json({
        job: updated,
        invoice: { ...invoice, items: invoiceItems },
        message: "Job completed successfully. Invoice created and ready for review."
      });
    } catch (error) {
      console.error("Complete job error:", error);
      res.status(500).json({ message: "Failed to complete job" });
    }
  });

  // Start job
  app.post("/api/jobs/:id/start", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const job = await storage.updateJob(req.params.id, req.user!.businessId!, {
        status: "in_progress",
        actualStartTime: new Date(),
      });

      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Convert lead to customer when job starts
      const contact = await storage.getContact(job.contactId, req.user!.businessId!);
      if (contact && contact.contactType === "lead") {
        await storage.updateContact(contact.id, req.user!.businessId!, {
          contactType: "customer",
        });

        // Log the contact type conversion
        await storage.createActivityLog({
          businessId: req.user!.businessId!,
          userId: req.user!.id,
          action: "update",
          entityType: "contact",
          entityId: contact.id,
          changes: {
            contactType: { from: "lead", to: "customer" },
            reason: "job_started",
          },
        });
      }

      // Log job started activity
      await ActivityLogger.jobStarted(
        req.user!.businessId!,
        job.id,
        job.contactId,
        {
          actual_start_time: new Date().toISOString(),
          jobNumber: job.jobNumber,
          title: job.title,
        }
      );

      res.json(job);
    } catch (error) {
      console.error("Start job error:", error);
      res.status(500).json({ message: "Failed to start job" });
    }
  });

  // Cancel job
  app.post("/api/jobs/:id/cancel", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const job = await storage.getJob(req.params.id, req.user!.businessId!);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      const { reason } = req.body;
      if (!reason || !reason.trim()) {
        return res.status(400).json({ message: "Cancellation reason is required" });
      }

      const updated = await storage.updateJob(req.params.id, req.user!.businessId!, {
        status: "cancelled",
        cancellationReason: reason,
        internalNotes: `${job.internalNotes || ""}\n\nCancelled on ${new Date().toISOString()}: ${reason}`,
      });

      // Update linked quote if needed
      if (job.quoteId) {
        await storage.updateQuote(job.quoteId, req.user!.businessId!, {
          status: "declined" // Or keep as "accepted" depending on business logic
        });
      }

      res.json(updated);
    } catch (error) {
      console.error("Cancel job error:", error);
      res.status(500).json({ message: "Failed to cancel job" });
    }
  });

  // Get jobs for calendar
  app.get("/api/jobs/calendar", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const jobs = await storage.getJobsByBusinessId(req.user!.businessId!);
      res.json(jobs);
    } catch (error) {
      console.error("Get calendar jobs error:", error);
      res.status(500).json({ message: "Failed to get jobs" });
    }
  });

  // Get today's jobs
  app.get("/api/jobs/today", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const jobs = await storage.getJobsByDate(req.user!.businessId!, today);
      res.json(jobs);
    } catch (error) {
      console.error("Get today's jobs error:", error);
      res.status(500).json({ message: "Failed to get today's jobs" });
    }
  });

  // ============================================================================
  // INVOICE MANAGEMENT ROUTES
  // ============================================================================

  app.post("/api/invoices", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const { items: customItems, status: invoiceStatus, ...invoiceDataRaw } = req.body;
      const data = invoiceSchema.parse(invoiceDataRaw);
      const businessId = req.user!.businessId!;
      const invoiceNumber = await generateInvoiceNumber(businessId);

      const invoice = await storage.createInvoice({
        businessId,
        contactId: data.contactId,
        jobId: data.jobId,
        invoiceNumber,
        dueDate: data.dueDate,
        paymentMethod: data.paymentMethod,
        subtotal: data.subtotal,
        taxAmount: data.taxAmount || "0",
        totalAmount: data.totalAmount,
        notes: data.notes,
        status: invoiceStatus || "draft",
      });

      // Create invoice items if provided
      if (customItems && Array.isArray(customItems) && customItems.length > 0) {
        for (const item of customItems) {
          await storage.createInvoiceItem({
            invoiceId: invoice.id,
            serviceId: item.serviceId || undefined,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
            displayOrder: item.displayOrder || 0,
          });
        }
      }

      // Fetch complete invoice with items
      const invoiceItems = await storage.getInvoiceItemsByInvoiceId(invoice.id);
      res.status(201).json({ ...invoice, items: invoiceItems });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Create invoice error:", error);
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  // Invoice statistics - must come before :id route
  app.get("/api/invoices/stats", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const invoices = await storage.getInvoicesByBusinessId(req.user!.businessId!);
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const stats = {
        totalOutstanding: invoices
          .filter(i => (i.status === "sent" || i.status === "overdue") && i.invoiceType !== "deposit")
          .reduce((sum, i) => sum + parseFloat(i.totalAmount), 0),
        paidThisMonth: invoices
          .filter(i => i.status === "paid" && i.invoiceType !== "deposit" && i.paidAt && new Date(i.paidAt) >= thisMonthStart)
          .reduce((sum, i) => sum + parseFloat(i.totalAmount), 0),
        overdueCount: invoices.filter(i => i.status === "overdue").length,
        overdueAmount: invoices
          .filter(i => i.status === "overdue" && i.invoiceType !== "deposit")
          .reduce((sum, i) => sum + parseFloat(i.totalAmount), 0),
        averageDaysToPayment: (() => {
          const paidInvoices = invoices.filter(i => i.status === "paid" && i.paidAt && i.createdAt);
          if (paidInvoices.length === 0) return 0;
          const totalDays = paidInvoices.reduce((sum, i) => {
            const created = new Date(i.createdAt);
            const paid = new Date(i.paidAt!);
            return sum + Math.floor((paid.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
          }, 0);
          return Math.round(totalDays / paidInvoices.length);
        })(),
        totalInvoicesThisMonth: invoices
          .filter(i => i.createdAt && new Date(i.createdAt) >= thisMonthStart).length,
      };

      res.json(stats);
    } catch (error) {
      console.error("Get invoice stats error:", error);
      res.status(500).json({ message: "Failed to get invoice statistics" });
    }
  });

  app.get("/api/invoices", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      let invoices = await storage.getInvoicesByBusinessId(req.user!.businessId!);

      // Auto-update overdue invoices
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const overdueUpdates = invoices
        .filter(i =>
          i.status === "sent" &&
          i.dueDate &&
          new Date(i.dueDate) < today
        )
        .map(invoice =>
          storage.updateInvoice(invoice.id, req.user!.businessId!, { status: "overdue" })
        );

      if (overdueUpdates.length > 0) {
        await Promise.all(overdueUpdates);
        // Refresh invoices after updates
        invoices = await storage.getInvoicesByBusinessId(req.user!.businessId!);
      }

      if (req.query.status) {
        const statusList = (req.query.status as string).split(',');
        invoices = invoices.filter(i => statusList.includes(i.status));
      }
      if (req.query.contactId) {
        invoices = invoices.filter(i => i.contactId === req.query.contactId);
      }

      // Enrich with contact and job information
      const enrichedInvoices = await Promise.all(
        invoices.map(async (invoice) => {
          const contact = await storage.getContact(invoice.contactId, req.user!.businessId!);
          let job = null;
          if (invoice.jobId) {
            job = await storage.getJob(invoice.jobId, req.user!.businessId!);
          }

          return {
            ...invoice,
            title: invoice.title || null,
            contactName: contact?.fullName || "Unknown",
            contactEmail: contact?.email,
            jobNumber: job?.jobNumber,
          };
        })
      );

      res.json(enrichedInvoices);
    } catch (error) {
      console.error("Get invoices error:", error);
      res.status(500).json({ message: "Failed to get invoices" });
    }
  });

  app.get("/api/invoices/:id", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const invoice = await storage.getInvoice(req.params.id, req.user!.businessId!);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Fetch invoice items
      const items = await storage.getInvoiceItemsByInvoiceId(invoice.id);

      res.json({ ...invoice, items });
    } catch (error) {
      console.error("Get invoice error:", error);
      res.status(500).json({ message: "Failed to get invoice" });
    }
  });

  app.patch("/api/invoices/:id", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const businessId = req.user!.businessId!;
      const invoiceId = req.params.id;

      const existingInvoice = await storage.getInvoice(invoiceId, businessId);
      if (!existingInvoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      let validatedData;
      try {
        validatedData = updateInvoiceSchema.parse(req.body);
      } catch (validationError: any) {
        return res.status(400).json({
          message: "Validation failed",
          errors: validationError.errors
        });
      }

      const updated = await storage.updateInvoice(invoiceId, businessId, {
        ...validatedData,
        paidAt: validatedData.status === "paid" ? new Date() : validatedData.paidAt,
      });

      // Convert customer to past_customer when invoice is paid
      if (updated.status === "paid" && existingInvoice.status !== "paid") {
        await storage.updateContact(existingInvoice.contactId, businessId, {
          contactType: "past_customer",
        });
      }

      res.json(updated);
    } catch (error) {
      console.error("Update invoice error:", error);
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });

  app.delete("/api/invoices/:id", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const invoice = await storage.getInvoice(req.params.id, req.user!.businessId!);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      await storage.deleteInvoiceItems(req.params.id);
      await storage.deleteInvoice(req.params.id, req.user!.businessId!);
      res.json({ message: "Invoice deleted successfully" });
    } catch (error) {
      console.error("Delete invoice error:", error);
      res.status(500).json({ message:"Failed to delete invoice" });
    }
  });

  // Send invoice
  app.post("/api/invoices/:id/send", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const invoice = await storage.getInvoice(req.params.id, req.user!.businessId!);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      const contact = await storage.getContact(invoice.contactId, req.user!.businessId!);
      if (!contact?.email) {
        return res.status(400).json({ message: "Customer email is required to send invoice" });
      }

      const items = await storage.getInvoiceItemsByInvoiceId(invoice.id);
      if (items.length === 0) {
        return res.status(400).json({ message: "Invoice must have at least one line item" });
      }

      const businessId = req.user!.businessId!;
      const business = await storage.getBusiness(businessId);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      // Generate public token if not exists
      let publicToken = invoice.publicToken;
      if (!publicToken) {
        publicToken = crypto.randomUUID();
        await storage.updateInvoice(invoice.id, businessId, { publicToken });
      }

      // Generate email using template
      const { getInvoiceSentTemplate } = await import('./email-templates');
      const emailContent = getInvoiceSentTemplate({
        businessName: business.businessName,
        senderName: business.senderName || business.businessName,
        recipientName: contact.fullName,
        invoiceNumber: invoice.invoiceNumber,
        invoiceTotal: `R${parseFloat(invoice.totalAmount).toFixed(2)}`,
        dueDate: invoice.dueDate || 'TBD',
        invoiceViewLink: `${getPublicBaseUrl()}/invoices/${invoice.id}/view?token=${publicToken}`,
        businessPhone: business.phone || '',
        businessEmail: business.email || '',
      });

      // Queue email
      await storage.createEmailQueueItem({
        businessId,
        toEmail: contact.email,
        toName: contact.fullName,
        subject: emailContent.subject,
        bodyHtml: emailContent.html,
        bodyText: emailContent.text,
        status: 'pending',
        relatedType: 'invoice',
        relatedId: invoice.id,
      });

      // Process email queue immediately
      await processEmailQueue(storage, businessId);

      // Update invoice status to sent
      const updated = await storage.updateInvoice(req.params.id, req.user!.businessId!, {
        status: "sent",
        sentAt: new Date(),
      });

      // Log activity: invoice_sent
      await ActivityLogger.invoiceSent(
        businessId,
        invoice.id,
        invoice.contactId,
        'email'
      );

      res.json({
        ...updated,
        message: `Invoice sent to ${contact.email}`
      });
    } catch (error) {
      console.error("Send invoice error:", error);
      res.status(500).json({ message: "Failed to send invoice" });
    }
  });

  // Extend invoice due date
  app.post("/api/invoices/:id/extend-due-date", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const { newDueDate } = req.body;

      if (!newDueDate) {
        return res.status(400).json({ message: "New due date is required" });
      }

      const invoice = await storage.getInvoice(req.params.id, req.user!.businessId!);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      if (invoice.status === "paid" || invoice.status === "cancelled") {
        return res.status(400).json({ message: "Cannot extend due date for paid or cancelled invoices" });
      }

      // Update due date and revert status to "sent" if it was overdue
      const newStatus = invoice.status === "overdue" ? "sent" : invoice.status;

      const updated = await storage.updateInvoice(req.params.id, req.user!.businessId!, {
        dueDate: newDueDate,
        status: newStatus,
      });

      res.json({
        ...updated,
        message: `Due date extended to ${newDueDate}${invoice.status === "overdue" ? " and status reverted to sent" : ""}`
      });
    } catch (error) {
      console.error("Extend due date error:", error);
      res.status(500).json({ message: "Failed to extend due date" });
    }
  });

  // Send payment reminder
  app.post("/api/invoices/:id/send-reminder", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const invoice = await storage.getInvoice(req.params.id, req.user!.businessId!);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      if (invoice.status !== "overdue") {
        return res.status(400).json({ message: "Can only send reminders for overdue invoices" });
      }

      const contact = await storage.getContact(invoice.contactId, req.user!.businessId!);
      if (!contact?.email) {
        return res.status(400).json({ message: "Customer email is required to send reminder" });
      }

      const business = await storage.getBusiness(req.user!.businessId!);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      // Calculate days overdue
      const dueDate = new Date(invoice.dueDate!);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      // Update reminder count
      const updated = await storage.updateInvoice(req.params.id, req.user!.businessId!, {
        remindersSent: (invoice.remindersSent || 0) + 1,
        lastReminderSentAt: new Date(),
      });

      // Queue reminder email
      await storage.createEmailQueueItem({
        businessId: req.user!.businessId!,
        toEmail: contact.email,
        toName: contact.fullName,
        subject: `Payment Reminder: Invoice ${invoice.invoiceNumber} - ${daysOverdue} Days Overdue`,
        bodyHtml: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #DC2626;">Payment Reminder</h2>
            <p>Dear ${contact.fullName},</p>
            <p>This is a friendly reminder that invoice <strong>${invoice.invoiceNumber}</strong> is now <strong>${daysOverdue} days overdue</strong>.</p>

            <div style="background: #F3F4F6; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <table style="width: 100%;">
                <tr>
                  <td style="padding: 5px 0;"><strong>Invoice Number:</strong></td>
                  <td style="text-align: right;">${invoice.invoiceNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0;"><strong>Original Due Date:</strong></td>
                  <td style="text-align: right;">${new Date(invoice.dueDate!).toLocaleDateString()}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0;"><strong>Amount Due:</strong></td>
                  <td style="text-align: right; font-size: 18px; color: #DC2626;"><strong>R ${parseFloat(invoice.totalAmount).toFixed(2)}</strong></td>
                </tr>
                <tr>
                  <td style="padding: 5px 0;"><strong>Days Overdue:</strong></td>
                  <td style="text-align: right; color: #DC2626;">${daysOverdue} days</td>
                </tr>
              </table>
            </div>

            <p>Please arrange payment at your earliest convenience. If you have any questions or need to discuss payment arrangements, please don't hesitate to contact us.</p>

            <p style="margin-top: 30px;">
              <strong>${business.businessName}</strong><br/>
               ${business.email}<br/>
              ${business.phone}
            </p>

            <p style="color: #6B7280; font-size: 12px; margin-top: 30px;">
              This is an automated reminder. If you have already made payment, please disregard this message.
            </p>
          </div>
        `,
        bodyText: `Payment Reminder

Dear ${contact.fullName},

This is a friendly reminder that invoice ${invoice.invoiceNumber} is now ${daysOverdue} days overdue.

Invoice Number: ${invoice.invoiceNumber}
Original Due Date: ${new Date(invoice.dueDate!).toLocaleDateString()}
Amount Due: R ${parseFloat(invoice.totalAmount).toFixed(2)}
Days Overdue: ${daysOverdue} days

Please arrange payment at your earliest convenience. If you have any questions or need to discuss payment arrangements, please don't hesitate to contact us.

${business.businessName}
${business.email}
${business.phone}

This is an automated reminder. If you have already made payment, please disregard this message.`,
        relatedType: "invoice",
        relatedId: invoice.id,
      });

      res.json({
        ...updated,
        message: `Payment reminder sent to ${contact.email}`
      });
    } catch (error) {
      console.error("Send reminder error:", error);
      res.status(500).json({ message: "Failed to send payment reminder" });
    }
  });

  // Get overdue invoices
  app.get("/api/invoices/overdue", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const invoices = await storage.getInvoicesByBusinessId(req.user!.businessId!);
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const overdueInvoices = invoices.filter(i =>
        (i.status === "sent" || i.status === "overdue") &&
        i.dueDate &&
        new Date(i.dueDate) < now
      );

      res.json(overdueInvoices);
    } catch (error) {
      console.error("Get overdue invoices error:", error);
      res.status(500).json({ message: "Failed to get overdue invoices" });
    }
  });

  // Generate invoice PDF
  app.get("/api/invoices/:id/pdf", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const invoice = await storage.getInvoice(req.params.id, req.user!.businessId!);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      const business = await storage.getBusiness(req.user!.businessId!);
      const contact = await storage.getContact(invoice.contactId, req.user!.businessId!);
      const items = await storage.getInvoiceItemsByInvoiceId(invoice.id);

      // Generate HTML for PDF
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #217BF4; padding-bottom: 20px; }
    .logo { font-size: 24px; font-weight: bold; color: #217BF4; }
    .invoice-title { font-size: 32px; font-weight: bold; color: #217BF4; }
    .info-section { margin-bottom: 30px; }
    .info-label { font-weight: bold; color: #666; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #f5f5f5; padding: 12px; text-align: left; border-bottom: 2px solid #ddd; }
    td { padding: 12px; border-bottom: 1px solid #eee; }
    .text-right { text-align: right; }
    .totals { margin-top: 20px; text-align: right; }
    .total-row { display: flex; justify-content: flex-end; gap: 100px; margin: 8px 0; }
    .total-label { font-weight: bold; }
    .grand-total { font-size: 20px; font-weight: bold; color: #217BF4; border-top: 2px solid #217BF4; padding-top: 10px; margin-top: 10px; }
    .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">${business?.businessName || 'Business'}</div>
      <div>${business?.email || ''}</div>
      <div>${business?.phone || ''}</div>
      <div>${business?.addressLine1 || ''}</div>
      <div>${business?.city || ''}, ${business?.province || ''} ${business?.postalCode || ''}</div>
    </div>
    <div style="text-align: right;">
      <div class="invoice-title">INVOICE</div>
      <div><span class="info-label">Invoice #:</span> ${invoice.invoiceNumber}</div>
      <div><span class="info-label">Date:</span> ${new Date(invoice.createdAt).toLocaleDateString()}</div>
      ${invoice.dueDate ? `<div><span class="info-label">Due Date:</span> ${new Date(invoice.dueDate).toLocaleDateString()}</div>` : ''}
    </div>
  </div>

  <div class="info-section">
    <div class="info-label">Bill To:</div>
    <div>${contact?.fullName || 'Unknown'}</div>
    ${contact?.email ? `<div>${contact.email}</div>` : ''}
    ${contact?.phone ? `<div>${contact.phone}</div>` : ''}
    ${contact?.address ? `<div>${contact.address}</div>` : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="text-right">Quantity</th>
        <th class="text-right">Unit Price</th>
        <th class="text-right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${items.map(item => `
        <tr>
          <td>${item.description}</td>
          <td class="text-right">${parseFloat(item.quantity).toFixed(2)}</td>
          <td class="text-right">R ${parseFloat(item.unitPrice).toFixed(2)}</td>
          <td class="text-right">R ${parseFloat(item.lineTotal).toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="total-row">
      <span class="total-label">Subtotal:</span>
      <span>R ${parseFloat(invoice.subtotal).toFixed(2)}</span>
    </div>
    <div class="total-row">
      <span class="total-label">Tax:</span>
      <span>R ${parseFloat(invoice.taxAmount || "0").toFixed(2)}</span>
    </div>
    <div class="total-row grand-total">
      <span class="total-label">Total Amount:</span>
      <span>R ${parseFloat(invoice.totalAmount).toFixed(2)}</span>
    </div>
  </div>

  ${invoice.notes? `
    <div class="info-section" style="margin-top: 40px;">
      <div class="info-label">Notes:</div>
      <div>${invoice.notes}</div>
    </div>
  ` : ''}

  <div class="footer">
    <div>Thank you for your business!</div>
    ${business?.websiteUrl ? `<div>${business.websiteUrl}</div>` : ''}
  </div>
</body>
</html>
      `;

      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error("Generate invoice PDF error:", error);
      res.status(500).json({ message: "Failed to generate invoice PDF" });
    }
  });

  // ============================================================================
  // TESTIMONIAL MANAGEMENT ROUTES
  // ============================================================================

  app.post("/api/testimonials", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const data = testimonialSchema.parse(req.body);
      const testimonial = await storage.createTestimonial({
        ...data,
        businessId: req.user!.businessId!,
      });
      res.status(201).json(testimonial);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Create testimonial error:", error);
      res.status(500).json({ message: "Failed to create testimonial" });
    }
  });

  app.get("/api/testimonials", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      let testimonials = await storage.getTestimonialsByBusinessId(req.user!.businessId!);

      if (req.query.status) {
        testimonials = testimonials.filter(t => t.status === req.query.status);
      }
      if (req.query.featured === 'true') {
        testimonials = testimonials.filter(t => t.isFeatured);
      }

      res.json(testimonials);
    } catch (error) {
      console.error("Get testimonials error:", error);
      res.status(500).json({ message: "Failed to get testimonials" });
    }
  });

  app.get("/api/testimonials/:id", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const testimonial = await storage.getTestimonial(req.params.id, req.user!.businessId!);
      if (!testimonial) {
        return res.status(404).json({ message: "Testimonial not found" });
      }
      res.json(testimonial);
    } catch (error) {
      console.error("Get testimonial error:", error);
      res.status(500).json({ message: "Failed to get testimonial" });
    }
  });

  app.patch("/api/testimonials/:id", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const data = testimonialSchema.partial().parse(req.body);
      const updated = await storage.updateTestimonial(req.params.id, req.user!.businessId!, data);
      if (!updated) {
        return res.status(404).json({ message: "Testimonial not found" });
      }
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Update testimonial error:", error);
      res.status(500).json({ message: "Failed to update testimonial" });
    }
  });

  app.delete("/api/testimonials/:id", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const testimonial = await storage.getTestimonial(req.params.id, req.user!.businessId!);
      if (!testimonial) {
        return res.status(404).json({ message: "Testimonial not found" });
      }
      await storage.deleteTestimonial(req.params.id, req.user!.businessId!);
      res.json({ message: "Testimonial deleted successfully" });
    } catch (error) {
      console.error("Delete testimonial error:", error);
      res.status(500).json({ message: "Failed to delete testimonial" });
    }
  });

  // Manual email queue processing (for testing)
  app.post("/api/admin/process-email-queue", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      const businessId = req.user!.businessId!;
      const sentCount = await processEmailQueue(storage, businessId);
      res.json({
        message: `Processed email queue`,
        emailsSent: sentCount
      });
    } catch (error) {
      console.error("Process email queue error:", error);
      res.status(500).json({ message: "Failed to process email queue" });
    }
  });

  // Manual reminder processing (for testing)
  app.post("/api/admin/run-reminders", requireAuth, attachBusinessContext, async (req: Request, res: Response) => {
    try {
      await runEmailReminders();
      res.json({ message: "Email reminders processed successfully" });
    } catch (error) {
      console.error("Run reminders error:", error);
      res.status(500).json({ message: "Failed to run reminders" });
    }
  });


  // Global error handler - must be last
  app.use((err: any, req: Request, res: Response, next: any) => {
    console.error("Unhandled error:", err);
    res.status(err.status || 500).json({
      message: err.message || "Internal server error",
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}