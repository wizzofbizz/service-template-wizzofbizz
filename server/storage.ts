import { getCurrentBusiness } from "./current-business";
import { eq, sql, desc, and } from "drizzle-orm";
import { db } from "./db";
import * as schema from "@shared/schema";
import type {
  Business, InsertBusiness,
  User, InsertUser, UpsertUser,
  Contact, InsertContact,
  Service, InsertService,
  Quote, InsertQuote,
  QuoteItem, InsertQuoteItem,
  Job, InsertJob,
  JobItem, InsertJobItem,
  Testimonial, InsertTestimonial,
  CalendarSettings, InsertCalendarSettings,
  Invoice, InsertInvoice,
  InvoiceItem, InsertInvoiceItem,
  Attachment, InsertAttachment,
  EmailQueue, InsertEmailQueue,
  EmailTemplate, InsertEmailTemplate,
  ActivityLog, InsertActivityLog,
  PaymentTransaction, InsertPaymentTransaction,
  ServiceArea, InsertServiceArea,
  BusinessHours, InsertBusinessHours,
  LandingPageContent, InsertLandingPageContent,
  QuoteVersion, InsertQuoteVersion,
  AiQuoteLearningEvent, InsertAiQuoteLearningEvent,
  InsertWhatsappQueue,
  WhatsappTemplate,
  whatsappQueue,
  whatsappTemplates,
  // Import WhatsApp Session types
  WhatsappSession,
  InsertWhatsappSession,
} from "@shared/schema";

// Import schema tables for subscription methods
import {
  whatsappSessions, // Import whatsappSessions table
} from "@shared/schema";

// Storage interface for multi-tenant SaaS
// All methods enforce tenant isolation via businessId

export interface IStorage {
  // Businesses
  getBusiness(id: string): Promise<Business | undefined>;
  getBusinessBySlug(slug: string): Promise<Business | undefined>;
  createBusiness(business: InsertBusiness): Promise<Business>;
  updateBusiness(id: string, business: Partial<InsertBusiness>): Promise<Business | undefined>;

  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  getUserByPasswordResetToken(token: string): Promise<User | undefined>;
  getUsersByBusinessId(businessId: string): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>; // Required for Replit Auth

  // Contacts
  getContact(id: string, businessId: string): Promise<Contact | undefined>;
  getContactsByBusinessId(businessId: string): Promise<Contact[]>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: string, businessId: string, contact: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: string, businessId: string): Promise<boolean>;

  // Services
  getService(id: string, businessId: string): Promise<Service | undefined>;
  getServicesByBusinessId(businessId: string): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: string, businessId: string, service: Partial<InsertService>): Promise<Service | undefined>;

  // Quotes
  getQuote(id: string, businessId: string): Promise<Quote | undefined>;
  getQuotesByBusinessId(businessId: string): Promise<Quote[]>;
  getQuotesByContactId(contactId: string, businessId: string): Promise<Quote[]>;
  createQuote(quote: InsertQuote): Promise<Quote>;
  updateQuote(id: string, businessId: string, quote: Partial<InsertQuote>): Promise<Quote | undefined>;

  // Quote Items
  getQuoteItemsByQuoteId(quoteId: string): Promise<QuoteItem[]>;
  createQuoteItem(item: InsertQuoteItem): Promise<QuoteItem>;
  deleteQuoteItem(id: string): Promise<boolean>;

  // Jobs
  getJob(id: string, businessId: string): Promise<Job | undefined>;
  getJobsByBusinessId(businessId: string): Promise<Job[]>;
  getJobsByDate(businessId: string, date: string): Promise<Job[]>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: string, businessId: string, job: Partial<InsertJob>): Promise<Job | undefined>;
  deleteJob(id: string, businessId: string): Promise<boolean>;

  // Testimonials
  getTestimonial(id: string, businessId: string): Promise<Testimonial | undefined>;
  getTestimonialsByBusinessId(businessId: string, status?: string): Promise<Testimonial[]>;
  createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial>;
  updateTestimonial(id: string, businessId: string, testimonial: Partial<InsertTestimonial>): Promise<Testimonial | undefined>;
  deleteTestimonial(id: string, businessId: string): Promise<boolean>;

  // Calendar Settings
  getCalendarSettings(businessId: string): Promise<CalendarSettings | undefined>;
  createCalendarSettings(settings: InsertCalendarSettings): Promise<CalendarSettings>;
  updateCalendarSettings(businessId: string, settings: Partial<InsertCalendarSettings>): Promise<CalendarSettings | undefined>;

  // Invoices
  getInvoice(id: string, businessId: string): Promise<Invoice | undefined>;
  getInvoiceById(invoiceId: string): Promise<Invoice | null>;
  getInvoicesByBusinessId(businessId: string): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, businessId: string, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined>;

  // Invoice Items
  getInvoiceItemsByInvoiceId(invoiceId: string): Promise<InvoiceItem[]>;
  createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem>;
  deleteInvoiceItems(invoiceId: string): Promise<void>;

  // Attachments
  getAttachment(id: string, businessId: string): Promise<Attachment | undefined>;
  getAttachmentsByRelated(relatedType: string, relatedId: string, businessId: string): Promise<Attachment[]>;
  createAttachment(attachment: InsertAttachment): Promise<Attachment>;
  deleteAttachment(id: string, businessId: string): Promise<boolean>;

  // Email Queue
  getEmailQueueItem(id: string, businessId: string): Promise<EmailQueue | undefined>;
  getPendingEmails(businessId: string): Promise<EmailQueue[]>;
  createEmailQueueItem(email: InsertEmailQueue): Promise<EmailQueue>;
  updateEmailQueueItem(id: string, businessId: string, email: Partial<InsertEmailQueue>): Promise<EmailQueue | undefined>;

  // Email Templates
  getEmailTemplate(id: string, businessId: string): Promise<EmailTemplate | undefined>;
  getEmailTemplatesByBusinessId(businessId: string): Promise<EmailTemplate[]>;
  getEmailTemplateByType(templateType: string, businessId: string): Promise<EmailTemplate | undefined>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(id: string, businessId: string, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined>;

  // Activity Log
  getActivityLog(id: string, businessId: string): Promise<ActivityLog | undefined>;
  getActivityLogsByBusinessId(businessId: string, limit?: number): Promise<ActivityLog[]>;
  getActivityLogsByEntity(entityType: string, entityId: string, businessId: string): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;

  // Payment Transactions
  getPaymentTransaction(id: string, businessId: string): Promise<PaymentTransaction | undefined>;
  getPaymentTransactionsByInvoice(invoiceId: string, businessId: string): Promise<PaymentTransaction[]>;
  getPaymentTransactionsByBusinessId(businessId: string): Promise<PaymentTransaction[]>;
  createPaymentTransaction(transaction: InsertPaymentTransaction): Promise<PaymentTransaction>;
  updatePaymentTransaction(id: string, businessId: string, transaction: Partial<InsertPaymentTransaction>): Promise<PaymentTransaction | undefined>;

  // Service Areas
  getServiceArea(id: string, businessId: string): Promise<ServiceArea | undefined>;
  getServiceAreasByBusinessId(businessId: string): Promise<ServiceArea[]>;
  createServiceArea(area: InsertServiceArea): Promise<ServiceArea>;
  updateServiceArea(id: string, businessId: string, area: Partial<InsertServiceArea>): Promise<ServiceArea | undefined>;

  // Business Hours
  getBusinessHours(id: string, businessId: string): Promise<BusinessHours | undefined>;
  getBusinessHoursByBusinessId(businessId: string): Promise<BusinessHours[]>;
  createBusinessHours(hours: InsertBusinessHours): Promise<BusinessHours>;
  updateBusinessHours(id: string, businessId: string, hours: Partial<InsertBusinessHours>): Promise<BusinessHours | undefined>;
  deleteBusinessHours(id: string, businessId: string): Promise<boolean>;

  // Landing Page Content
  getLandingPageContent(businessId: string): Promise<LandingPageContent[]>;
  getLandingPageContentBySection(businessId: string, section: string): Promise<LandingPageContent[]>;
  createLandingPageContent(data: InsertLandingPageContent): Promise<LandingPageContent>;
  updateLandingPageContent(id: string, businessId: string, data: Partial<InsertLandingPageContent>): Promise<LandingPageContent | undefined>;
  deleteLandingPageContent(id: string, businessId: string): Promise<void>;

  // Phase 19A: AI Quote System
  // Quote Versions
  getQuoteVersion(id: string): Promise<QuoteVersion | undefined>;
  getQuoteVersionsByQuoteId(quoteId: string): Promise<QuoteVersion[]>;
  createQuoteVersion(version: InsertQuoteVersion): Promise<QuoteVersion>;
  getLatestQuoteVersion(quoteId: string): Promise<QuoteVersion | undefined>;

  // AI Learning Events
  getAiQuoteLearningEvent(id: string): Promise<AiQuoteLearningEvent | undefined>;
  getAiQuoteLearningEventsByBusinessId(businessId: string, limit?: number): Promise<AiQuoteLearningEvent[]>;
  createAiQuoteLearningEvent(event: InsertAiQuoteLearningEvent): Promise<AiQuoteLearningEvent>;

  // WhatsApp Queue
  createWhatsAppQueueItem(data: InsertWhatsappQueue): Promise<any>; // Use InsertWhatsappQueue type
  getPendingWhatsAppMessages(businessId: string): Promise<any[]>;
  updateWhatsAppQueueItem(id: string, businessId: string, data: any): Promise<any>;
  getWhatsappQueueByBusinessId(businessId: string, limit?: number): Promise<any[]>;

  // WhatsApp Templates
  createWhatsappTemplate(data: any): Promise<any>;
  getWhatsappTemplatesByBusinessId(businessId: string): Promise<any[]>;
  updateWhatsappTemplate(id: string, businessId: string, data: any): Promise<any>;
  getWhatsappTemplateByName(templateName: string): Promise<WhatsappTemplate | undefined>; // New method

  // Phase 2 - Deposit System
  getDepositPolicies(businessId: string): Promise<any[]>;
  getDepositPolicy(id: string, businessId: string): Promise<any | undefined>;
  createDepositPolicy(data: any): Promise<any>;
  updateDepositPolicy(id: string, businessId: string, data: any): Promise<any | undefined>;
  deleteDepositPolicy(id: string, businessId: string): Promise<boolean>;
  getDepositPolicyByService(businessId: string, serviceId: string): Promise<any | undefined>;

  // Quote & Job Deposit Settings
  updateQuoteDepositSettings(quoteId: string, businessId: string, data: any): Promise<any | undefined>;
  updateJobDepositStatus(jobId: string, businessId: string, data: any): Promise<any | undefined>;

  // Invoice Types
  getInvoicesByType(businessId: string, invoiceType: string): Promise<Invoice[]>;

  // Other methods
  getAllBusinesses(): Promise<Business[]>;
  getBusinessWasenderApiKey(businessId: string): Promise<string | null>;
  updateBusinessWasenderApiKey(businessId: string, apiKey: string | null): Promise<Business | undefined>;

  // WhatsApp Session Methods (WaSender Integration)
  createWhatsAppSession(data: InsertWhatsappSession): Promise<WhatsappSession>;
  getWhatsAppSession(id: string, businessId: string): Promise<WhatsappSession | null>;
  getWhatsAppSessionBySessionId(sessionId: string): Promise<WhatsappSession | null>;
  getWhatsAppSessionsByBusinessId(businessId: string): Promise<WhatsappSession[]>;
  getActiveWhatsAppSession(businessId: string): Promise<WhatsappSession | null>;
  updateWhatsAppSession(
    id: string,
    businessId: string,
    data: Partial<WhatsappSession>
  ): Promise<WhatsappSession | null>;
  deleteWhatsAppSession(id: string, businessId: string): Promise<boolean>;
}

// Database-backed storage implementation
export class DbStorage implements IStorage {
  // Businesses
  async getBusiness(id: string): Promise<Business | undefined> {
    try {
      const [business] = await db.select()
        .from(schema.businesses)
        .where(sql`${schema.businesses.id} = ${id}`)
        .limit(1);

      // Add default values for payment settings if they don't exist
      if (business && !business.defaultPaymentDueDays) {
        business.defaultPaymentDueDays = 30;
      }
      if (business && !business.paymentReminderDays) {
        business.paymentReminderDays = [3, 7, 14];
      }

      return business;
    } catch (error) {
      console.error("Error fetching business:", error);
      // If it's a column missing error, return business without those fields
      if (error.code === '42703') {
        console.warn("Payment settings columns not found, using defaults");
        const [business] = await db.select()
          .from(schema.businesses)
          .where(sql`${schema.businesses.id} = ${id}`)
          .limit(1);
        return business;
      }
      throw new Error("Failed to fetch business");
    }
  }

  /**
   * Single-business: public URLs carry no real tenant slug, so the argument is
   * ignored and the one configured business is returned. Kept as a method so
   * existing public route shapes (/api/public/services/:slug and friends) keep
   * working unchanged.
   */
  async getBusinessBySlug(_slug: string): Promise<Business | undefined> {
    try {
      return await getCurrentBusiness();
    } catch (error) {
      console.error("Error fetching the configured business:", error);
      return undefined;
    }
  }

  async createBusiness(business: InsertBusiness): Promise<Business> {
    try {
      const [newBusiness] = await db.insert(schema.businesses).values(business).returning();
      return newBusiness;
    } catch (error) {
      console.error("Error creating business:", error);
      throw new Error("Failed to create business");
    }
  }

  async updateBusiness(id: string, business: Partial<InsertBusiness>): Promise<Business | undefined> {
    try {
      // Drizzle ORM handles JSONB serialization automatically
      const [updated] = await db.update(schema.businesses)
        .set({ ...business, updatedAt: new Date() })
        .where(eq(schema.businesses.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating business:", error);
      throw new Error("Failed to update business");
    }
  }

  // WaSender API Key Management
  async getBusinessWasenderApiKey(businessId: string): Promise<string | null> {
    try {
      const business = await this.getBusiness(businessId);
      return business?.whatsappWasenderApiKey || null;
    } catch (error) {
      console.error("Error fetching WaSender API key:", error);
      throw new Error("Failed to fetch WaSender API key");
    }
  }

  async updateBusinessWasenderApiKey(businessId: string, apiKey: string | null): Promise<Business | undefined> {
    try {
      return await this.updateBusiness(businessId, {
        whatsappWasenderApiKey: apiKey,
      });
    } catch (error) {
      console.error("Error updating WaSender API key:", error);
      throw new Error("Failed to update WaSender API key");
    }
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
      return user;
    } catch (error) {
      console.error("Error fetching user:", error);
      throw new Error("Failed to fetch user");
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
      return user;
    } catch (error) {
      console.error("Error fetching user by email:", error);
      throw new Error("Failed to fetch user by email");
    }
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    try {
      const [user] = await db.select()
        .from(schema.users)
        .where(eq(schema.users.emailVerificationToken, token))
        .limit(1);
      return user;
    } catch (error) {
      console.error("Error fetching user by verification token:", error);
      throw new Error("Failed to fetch user by verification token");
    }
  }

  async getUserByPasswordResetToken(token: string): Promise<User | undefined> {
    try {
      const [user] = await db.select()
        .from(schema.users)
        .where(eq(schema.users.passwordResetToken, token))
        .limit(1);
      return user;
    } catch (error) {
      console.error("Error fetching user by password reset token:", error);
      throw new Error("Failed to fetch user by password reset token");
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      return await db.select().from(schema.users);
    } catch (error) {
      console.error("Error fetching all users:", error);
      throw new Error("Failed to fetch users");
    }
  }

  async getUsersByBusinessId(businessId: string): Promise<User[]> {
    try {
      return await db.select().from(schema.users).where(eq(schema.users.businessId, businessId));
    } catch (error) {
      console.error("Error fetching users by business ID:", error);
      throw new Error("Failed to fetch users");
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const [newUser] = await db.insert(schema.users).values(user).returning();
      return newUser;
    } catch (error) {
      console.error("Error creating user:", error);
      throw new Error("Failed to create user");
    }
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    try {
      const [updated] = await db.update(schema.users)
        .set({ ...user, updatedAt: new Date() })
        .where(eq(schema.users.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating user:", error);
      throw new Error("Failed to update user");
    }
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      const [user] = await db
        .insert(schema.users)
        .values({
          id: userData.id,
          email: userData.email ?? null,
          firstName: userData.firstName ?? null,
          lastName: userData.lastName ?? null,
          profileImageUrl: userData.profileImageUrl ?? null,
          emailVerified: true, // OAuth users are pre-verified
          passwordHash: null, // OAuth users don't need password
        })
        .onConflictDoUpdate({
          target: schema.users.id,
          set: {
            email: userData.email ?? null,
            firstName: userData.firstName ?? null,
            lastName: userData.lastName ?? null,
            profileImageUrl: userData.profileImageUrl ?? null,
            emailVerified: true, // Ensure OAuth users stay verified
            updatedAt: new Date(),
          },
        })
        .returning();
      return user;
    } catch (error) {
      console.error("Error upserting user:", error);
      throw new Error("Failed to upsert user");
    }
  }

  // Contacts
  async getContact(id: string, businessId: string): Promise<Contact | undefined> {
    try {
      const [contact] = await db.select()
        .from(schema.contacts)
        .where(sql`${schema.contacts.id} = ${id} AND ${schema.contacts.businessId} = ${businessId}`)
        .limit(1);
      return contact;
    } catch (error) {
      console.error("Error fetching contact:", error);
      throw new Error("Failed to fetch contact");
    }
  }

  async getContactsByBusinessId(businessId: string): Promise<Contact[]> {
    try {
      return await db.select()
        .from(schema.contacts)
        .where(eq(schema.contacts.businessId, businessId))
        .orderBy(sql`${schema.contacts.createdAt} DESC`);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      throw new Error("Failed to fetch contacts");
    }
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    try {
      const [newContact] = await db.insert(schema.contacts).values(contact).returning();
      return newContact;
    } catch (error) {
      console.error("Error creating contact:", error);
      throw new Error("Failed to create contact");
    }
  }

  async updateContact(id: string, businessId: string, contact: Partial<InsertContact>): Promise<Contact | undefined> {
    try {
      // Set opt-in/opt-out dates based on whatsappOptIn changes
      const updateData: any = { ...contact, updatedAt: new Date() };

      if (contact.whatsappOptIn !== undefined) {
        if (contact.whatsappOptIn === true) {
          updateData.whatsappOptInDate = new Date();
          updateData.whatsappOptOutDate = null;
        } else if (contact.whatsappOptIn === false) {
          updateData.whatsappOptOutDate = new Date();
        }
      }

      const [updated] = await db
        .update(schema.contacts)
        .set(updateData)
        .where(and(eq(schema.contacts.id, id), eq(schema.contacts.businessId, businessId)))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating contact:", error);
      throw new Error("Failed to update contact");
    }
  }

  async deleteContact(id: string, businessId: string): Promise<boolean> {
    try {
      await db.delete(schema.contacts)
        .where(and(
          eq(schema.contacts.id, id),
          eq(schema.contacts.businessId, businessId)
        ));
      return true;
    } catch (error) {
      console.error("Error deleting contact:", error);
      throw new Error("Failed to delete contact");
    }
  }

  async getService(id: string, businessId: string): Promise<Service | undefined> {
    try {
      const [service] = await db.select()
        .from(schema.services)
        .where(sql`${schema.services.id} = ${id} AND ${schema.services.businessId} = ${businessId}`)
        .limit(1);
      return service;
    } catch (error) {
      console.error("Error fetching service:", error);
      throw new Error("Failed to fetch service");
    }
  }

  async getServicesByBusinessId(businessId: string): Promise<Service[]> {
    try {
      return await db.select()
        .from(schema.services)
        .where(eq(schema.services.businessId, businessId))
        .orderBy(schema.services.displayOrder);
    } catch (error) {
      console.error("Error fetching services by business ID:", error);
      throw new Error("Failed to fetch services");
    }
  }

  async createService(service: InsertService): Promise<Service> {
    try {
      const [newService] = await db.insert(schema.services).values(service).returning();
      return newService;
    } catch (error) {
      console.error("Error creating service:", error);
      throw new Error("Failed to create service");
    }
  }

  async updateService(id: string, businessId: string, service: Partial<InsertService>): Promise<Service | undefined> {
    try {
      const [updated] = await db.update(schema.services)
        .set({ ...service, updatedAt: new Date() })
        .where(sql`${schema.services.id} = ${id} AND ${schema.services.businessId} = ${businessId}`)
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating service:", error);
      throw new Error("Failed to update service");
    }
  }

  async deleteService(id: string, businessId: string): Promise<boolean> {
    try {
      const [deleted] = await db.delete(schema.services)
        .where(sql`${schema.services.id} = ${id} AND ${schema.services.businessId} = ${businessId}`)
        .returning();
      return !!deleted;
    } catch (error) {
      console.error("Error deleting service:", error);
      throw new Error("Failed to delete service");
    }
  }

  async getQuote(id: string, businessId: string): Promise<Quote | undefined> {
    try {
      if (!businessId) {
        // Public access - get quote by ID only
        const [quote] = await db.select()
          .from(schema.quotes)
          .where(eq(schema.quotes.id, id))
          .limit(1);
        return quote;
      }
      const [quote] = await db.select()
        .from(schema.quotes)
        .where(sql`${schema.quotes.id} = ${id} AND ${schema.quotes.businessId} = ${businessId}`)
        .limit(1);
      return quote;
    } catch (error) {
      console.error("Error fetching quote:", error);
      throw new Error("Failed to fetch quote");
    }
  }
  async getQuotesByBusinessId(businessId: string): Promise<Quote[]> {
    try {
      return await db.select()
        .from(schema.quotes)
        .where(eq(schema.quotes.businessId, businessId))
        .orderBy(sql`${schema.quotes.createdAt} DESC`);
    } catch (error) {
      console.error("Error fetching quotes by business ID:", error);
      throw new Error("Failed to fetch quotes");
    }
  }
  async getQuotesByContactId(contactId: string, businessId: string): Promise<Quote[]> {
    try {
      return await db.select()
        .from(schema.quotes)
        .where(sql`${schema.quotes.contactId} = ${contactId} AND ${schema.quotes.businessId} = ${businessId}`)
        .orderBy(sql`${schema.quotes.createdAt} DESC`);
    } catch (error) {
      console.error("Error fetching quotes by contact ID:", error);
      throw new Error("Failed to fetch quotes");
    }
  }
  async createQuote(quote: InsertQuote): Promise<Quote> {
    try {
      const [newQuote] = await db.insert(schema.quotes).values(quote).returning();
      return newQuote;
    } catch (error) {
      console.error("Error creating quote:", error);
      throw new Error("Failed to create quote");
    }
  }
  async updateQuote(id: string, businessId: string, quote: Partial<InsertQuote>): Promise<Quote | undefined> {
    try {
      const [updated] = await db.update(schema.quotes)
        .set({ ...quote, updatedAt: new Date() })
        .where(and(eq(schema.quotes.id, id), eq(schema.quotes.businessId, businessId)))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating quote:", error);
      throw new Error("Failed to update quote");
    }
  }
  async getQuoteItemsByQuoteId(quoteId: string): Promise<QuoteItem[]> {
    try {
      return await db.select()
        .from(schema.quoteItems)
        .where(eq(schema.quoteItems.quoteId, quoteId))
        .orderBy(schema.quoteItems.displayOrder);
    } catch (error) {
      console.error("Error fetching quote items by quote ID:", error);
      throw new Error("Failed to fetch quote items");
    }
  }
  async createQuoteItem(item: InsertQuoteItem): Promise<QuoteItem> {
    try {
      const [newItem] = await db.insert(schema.quoteItems).values(item).returning();
      return newItem;
    } catch (error) {
      console.error("Error creating quote item:", error);
      throw new Error("Failed to create quote item");
    }
  }

  async getQuoteStats(businessId: string): Promise<{
    totalThisMonth: number;
    pending: number;
    acceptedThisMonth: number;
    acceptedValue: number;
    conversionRate: number;
  }> {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const quotes = await db.select()
        .from(schema.quotes)
        .where(eq(schema.quotes.businessId, businessId));

      const thisMonth = quotes.filter(q => new Date(q.createdAt) >= startOfMonth);
      const pending = quotes.filter(q => q.status === 'sent' || q.status === 'viewed').length;
      const acceptedThisMonth = thisMonth.filter(q => q.status === 'accepted');
      const acceptedValue = acceptedThisMonth.reduce((sum, q) => sum + parseFloat(q.totalAmount), 0);
      const sent = thisMonth.filter(q => q.status !== 'draft').length;
      const conversionRate = sent > 0 ? Math.round((acceptedThisMonth.length / sent) * 100) : 0;

      return {
        totalThisMonth: thisMonth.length,
        pending,
        acceptedThisMonth: acceptedThisMonth.length,
        acceptedValue,
        conversionRate,
      };
    } catch (error) {
      console.error("Error fetching quote stats:", error);
      throw new Error("Failed to fetch quote stats");
    }
  }
  async deleteQuoteItem(id: string): Promise<boolean> {
    try {
      await db.delete(schema.quoteItems)
        .where(eq(schema.quoteItems.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting quote item:", error);
      throw new Error("Failed to delete quote item");
    }
  }
  async deleteQuote(id: string, businessId: string): Promise<boolean> {
    try {
      // First verify the quote exists and belongs to this business
      const quote = await this.getQuote(id, businessId);
      if (!quote) {
        throw new Error("Quote not found or access denied");
      }

      // Only allow deleting draft quotes
      if (quote.status !== "draft") {
        throw new Error("Only draft quotes can be deleted. Please archive instead.");
      }

      // Delete quote items first (due to foreign key constraint)
      await db.delete(schema.quoteItems)
        .where(eq(schema.quoteItems.quoteId, id));

      // Then delete the quote
      await db.delete(schema.quotes)
        .where(and(
          eq(schema.quotes.id, id),
          eq(schema.quotes.businessId, businessId)
        ));
      return true;
    } catch (error) {
      console.error("Error deleting quote:", error);
      throw error;
    }
  }
  async getJob(id: string, businessId: string): Promise<Job | undefined> {
    try {
      const [job] = await db.select()
        .from(schema.jobs)
        .where(sql`${schema.jobs.id} = ${id} AND ${schema.jobs.businessId} = ${businessId}`)
        .limit(1);
      return job;
    } catch (error) {
      console.error("Error fetching job:", error);
      throw new Error("Failed to fetch job");
    }
  }
  async getJobsByBusinessId(businessId: string): Promise<Job[]> {
    try {
      return await db.select()
        .from(schema.jobs)
        .where(eq(schema.jobs.businessId, businessId))
        .orderBy(desc(schema.jobs.createdAt));
    } catch (error) {
      console.error("Error fetching jobs by business ID:", error);
      throw new Error("Failed to fetch jobs");
    }
  }
  async createJobItem(data: InsertJobItem): Promise<JobItem> {
    try {
      const [item] = await db.insert(schema.jobItems)
        .values(data)
        .returning();
      return item;
    } catch (error) {
      console.error("Error creating job item:", error);
      throw new Error("Failed to create job item");
    }
  }
  async getJobItemsByJobId(jobId: string): Promise<JobItem[]> {
    try {
      return await db.select()
        .from(schema.jobItems)
        .where(eq(schema.jobItems.jobId, jobId))
        .orderBy(schema.jobItems.displayOrder);
    } catch (error) {
      console.error("Error fetching job items:", error);
      throw new Error("Failed to fetch job items");
    }
  }
  async deleteJobItems(jobId: string): Promise<void> {
    try {
      await db.delete(schema.jobItems)
        .where(eq(schema.jobItems.jobId, jobId));
    } catch (error) {
      console.error("Error deleting job items:", error);
      throw new Error("Failed to delete job items");
    }
  }
  async getJobsByDate(businessId: string, date: string): Promise<Job[]> {
    try {
      return await db.select()
        .from(schema.jobs)
        .where(sql`${schema.jobs.businessId} = ${businessId} AND ${schema.jobs.scheduledDate} = ${date}`)
        .orderBy(schema.jobs.scheduledStartTime);
    } catch (error) {
      console.error("Error fetching jobs by date:", error);
      throw new Error("Failed to fetch jobs");
    }
  }
  async createJob(job: InsertJob): Promise<Job> {
    try {
      const [newJob] = await db.insert(schema.jobs).values(job).returning();
      return newJob;
    } catch (error) {
      console.error("Error creating job:", error);
      // Re-throw the original error to preserve error codes for retry logic
      throw error;
    }
  }
  async updateJob(id: string, businessId: string, job: Partial<InsertJob>): Promise<Job | undefined> {
    try {
      const [updated] = await db.update(schema.jobs)
        .set({ ...job, updatedAt: new Date() })
        .where(sql`${schema.jobs.id} = ${id} AND ${schema.jobs.businessId} = ${businessId}`)
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating job:", error);
      throw new Error("Failed to update job");
    }
  }

  async deleteJob(id: string, businessId: string): Promise<boolean> {
    try {
      await db.delete(schema.jobs)
        .where(and(
          eq(schema.jobs.id, id),
          eq(schema.jobs.businessId, businessId)
        ));
      return true;
    } catch (error) {
      console.error("Error deleting job:", error);
      throw new Error("Failed to delete job");
    }
  }
  async getTestimonial(id: string, businessId: string): Promise<Testimonial | undefined> {
    try {
      const [testimonial] = await db.select()
        .from(schema.testimonials)
        .where(sql`${schema.testimonials.id} = ${id} AND ${schema.testimonials.businessId} = ${businessId}`)
        .limit(1);
      return testimonial;
    } catch (error) {
      console.error("Error fetching testimonial:", error);
      throw new Error("Failed to fetch testimonial");
    }
  }
  async getTestimonialsByBusinessId(businessId: string, status?: string): Promise<Testimonial[]> {
    try {
      if (status) {
        return await db.select()
          .from(schema.testimonials)
          .where(sql`${schema.testimonials.businessId} = ${businessId} AND ${schema.testimonials.status} = ${status}`)
          .orderBy(schema.testimonials.displayOrder);
      }
      return await db.select()
        .from(schema.testimonials)
        .where(eq(schema.testimonials.businessId, businessId))
        .orderBy(schema.testimonials.displayOrder);
    } catch (error) {
      console.error("Error fetching testimonials by business ID:", error);
      throw new Error("Failed to fetch testimonials");
    }
  }
  async createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial> {
    try {
      const [newTestimonial] = await db.insert(schema.testimonials).values(testimonial).returning();
      return newTestimonial;
    } catch (error) {
      console.error("Error creating testimonial:", error);
      throw new Error("Failed to create testimonial");
    }
  }
  async updateTestimonial(id: string, businessId: string, testimonial: Partial<InsertTestimonial>): Promise<Testimonial | undefined> {
    try {
      const [updated] = await db.update(schema.testimonials)
        .set(testimonial)
        .where(sql`${schema.testimonials.id} = ${id} AND ${schema.testimonials.businessId} = ${businessId}`)
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating testimonial:", error);
      throw new Error("Failed to update testimonial");
    }
  }

  async deleteTestimonial(id: string, businessId: string): Promise<boolean> {
    try {
      await db.delete(schema.testimonials)
        .where(and(
          eq(schema.testimonials.id, id),
          eq(schema.testimonials.businessId, businessId)
        ));
      return true;
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      throw new Error("Failed to delete testimonial");
    }
  }
  async getCalendarSettings(businessId: string): Promise<CalendarSettings | undefined> {
    try {
      const [settings] = await db.select()
        .from(schema.calendarSettings)
        .where(eq(schema.calendarSettings.businessId, businessId))
        .limit(1);
      return settings;
    } catch (error) {
      console.error("Error fetching calendar settings:", error);
      throw new Error("Failed to fetch calendar settings");
    }
  }
  async createCalendarSettings(settings: InsertCalendarSettings): Promise<CalendarSettings> {
    try {
      const [newSettings] = await db.insert(schema.calendarSettings).values(settings).returning();
      return newSettings;
    } catch (error) {
      console.error("Error creating calendar settings:", error);
      throw new Error("Failed to create calendar settings");
    }
  }
  async updateCalendarSettings(businessId: string, settings: Partial<InsertCalendarSettings>): Promise<CalendarSettings | undefined> {
    try {
      const [updated] = await db.update(schema.calendarSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(schema.calendarSettings.businessId, businessId))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating calendar settings:", error);
      throw new Error("Failed to update calendar settings");
    }
  }
  async getInvoice(id: string, businessId: string): Promise<Invoice | undefined> {
    try {
      if (!businessId) {
        // Public access - get invoice by ID only
        const [invoice] = await db.select()
          .from(schema.invoices)
          .where(eq(schema.invoices.id, id))
          .limit(1);
        return invoice;
      }
      const [invoice] = await db.select()
        .from(schema.invoices)
        .where(sql`${schema.invoices.id} = ${id} AND ${schema.invoices.businessId} = ${businessId}`)
        .limit(1);
      return invoice;
    } catch (error) {
      console.error("Error fetching invoice:", error);
      throw new Error("Failed to fetch invoice");
    }
  }
  async getInvoicesByBusinessId(businessId: string): Promise<Invoice[]> {
    try {
      const invoices = await db.select({
        id: schema.invoices.id,
        businessId: schema.invoices.businessId,
        jobId: schema.invoices.jobId,
        contactId: schema.invoices.contactId,
        invoiceNumber: schema.invoices.invoiceNumber,
        title: schema.invoices.title,
        status: schema.invoices.status,
        dueDate: schema.invoices.dueDate,
        paidAt: schema.invoices.paidAt,
        paymentMethod: schema.invoices.paymentMethod,
        subtotal: schema.invoices.subtotal,
        taxAmount: schema.invoices.taxAmount,
        totalAmount: schema.invoices.totalAmount,
        notes: schema.invoices.notes,
        publicToken: schema.invoices.publicToken,
        remindersSent: schema.invoices.remindersSent,
        lastReminderSentAt: schema.invoices.lastReminderSentAt,
        createdAt: schema.invoices.createdAt,
        updatedAt: schema.invoices.updatedAt,
      })
        .from(schema.invoices)
        .where(eq(schema.invoices.businessId, businessId))
        .orderBy(sql`${schema.invoices.createdAt} DESC`);

      return invoices;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
  }
  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    try {
      const [newInvoice] = await db.insert(schema.invoices).values(invoice).returning();
      return newInvoice;
    } catch (error) {
      console.error("Error creating invoice:", error);
      throw new Error("Failed to create invoice");
    }
  }
  async updateInvoice(id: string, businessId: string, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    try {
      const [updated] = await db.update(schema.invoices)
        .set({ ...invoice, updatedAt: new Date() })
        .where(sql`${schema.invoices.id} = ${id} AND ${schema.invoices.businessId} = ${businessId}`)
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating invoice:", error);
      throw new Error("Failed to update invoice");
    }
  }

  async getInvoiceItemsByInvoiceId(invoiceId: string): Promise<InvoiceItem[]> {
    try {
      return await db.select()
        .from(schema.invoiceItems)
        .where(eq(schema.invoiceItems.invoiceId, invoiceId))
        .orderBy(schema.invoiceItems.displayOrder);
    } catch (error) {
      console.error("Error fetching invoice items:", error);
      throw new Error("Failed to fetch invoice items");
    }
  }

  async createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem> {
    try {
      const [newItem] = await db.insert(schema.invoiceItems)
        .values(item)
        .returning();
      return newItem;
    } catch (error) {
      console.error("Error creating invoice item:", error);
      throw new Error("Failed to create invoice item");
    }
  }

  async deleteInvoiceItems(invoiceId: string): Promise<void> {
    try {
      await db.delete(schema.invoiceItems)
        .where(eq(schema.invoiceItems.invoiceId, invoiceId));
    } catch (error) {
      console.error("Error deleting invoice items:", error);
      throw new Error("Failed to delete invoice items");
    }
  }

  async deleteInvoice(id: string, businessId: string): Promise<void> {
    try {
      await this.deleteInvoiceItems(id);
      await db.delete(schema.invoices)
        .where(sql`${schema.invoices.id} = ${id} AND ${schema.invoices.businessId} = ${businessId}`);
    } catch (error) {
      console.error("Error deleting invoice:", error);
      throw new Error("Failed to delete invoice");
    }
  }

  async getAttachment(id: string, businessId: string): Promise<Attachment | undefined> {
    try {
      const [attachment] = await db.select()
        .from(schema.attachments)
        .where(sql`${schema.attachments.id} = ${id} AND ${schema.attachments.businessId} = ${businessId}`)
        .limit(1);
      return attachment;
    } catch (error) {
      console.error("Error fetching attachment:", error);
      throw new Error("Failed to fetch attachment");
    }
  }
  async getAttachmentsByRelated(relatedType: string, relatedId: string, businessId: string): Promise<Attachment[]> {
    try {
      return await db.select()
        .from(schema.attachments)
        .where(sql`${schema.attachments.businessId} = ${businessId} AND ${schema.attachments.relatedType} = ${relatedType} AND ${schema.attachments.relatedId} = ${relatedId}`);
    } catch (error) {
      console.error("Error fetching attachments by related:", error);
      throw new Error("Failed to fetch attachments");
    }
  }
  async createAttachment(attachment: InsertAttachment): Promise<Attachment> {
    try {
      const [newAttachment] = await db.insert(schema.attachments).values(attachment).returning();
      return newAttachment;
    } catch (error) {
      console.error("Error creating attachment:", error);
      throw new Error("Failed to create attachment");
    }
  }
  async deleteAttachment(id: string, businessId: string): Promise<boolean> {
    try {
      const result = await db.delete(schema.attachments)
        .where(sql`${schema.attachments.id} = ${id} AND ${schema.attachments.businessId} = ${businessId}`);
      return result.count > 0;
    } catch (error) {
      console.error("Error deleting attachment:", error);
      throw new Error("Failed to delete attachment");
    }
  }
  async getEmailQueueItem(id: string, businessId: string): Promise<EmailQueue | undefined> {
    try {
      const [email] = await db.select()
        .from(schema.emailQueue)
        .where(sql`${schema.emailQueue.id} = ${id} AND ${schema.emailQueue.businessId} = ${businessId}`)
        .limit(1);
      return email;
    } catch (error) {
      console.error("Error fetching email queue item:", error);
      throw new Error("Failed to fetch email queue item");
    }
  }
  async getPendingEmails(businessId: string): Promise<EmailQueue[]> {
    try {
      return await db.select()
        .from(schema.emailQueue)
        .where(sql`${schema.emailQueue.businessId} = ${businessId} AND ${schema.emailQueue.status} = 'pending'`);
    } catch (error) {
      console.error("Error fetching pending emails:", error);
      throw new Error("Failed to fetch pending emails");
    }
  }
  async createEmailQueueItem(email: InsertEmailQueue): Promise<EmailQueue> {
    try {
      const [newEmail] = await db.insert(schema.emailQueue).values(email).returning();
      return newEmail;
    } catch (error) {
      console.error("Error creating email queue item:", error);
      throw new Error("Failed to create email queue item");
    }
  }
  async updateEmailQueueItem(id: string, businessId: string, email: Partial<InsertEmailQueue>): Promise<EmailQueue | undefined> {
    try {
      const [updated] = await db.update(schema.emailQueue)
        .set({ ...email, updatedAt: new Date() })
        .where(sql`${schema.emailQueue.id} = ${id} AND ${schema.emailQueue.businessId} = ${businessId}`)
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating email queue item:", error);
      throw new Error("Failed to update email queue item");
    }
  }
  async getEmailTemplate(id: string, businessId: string): Promise<EmailTemplate | undefined> {
    try {
      const [template] = await db.select()
        .from(schema.emailTemplates)
        .where(sql`${schema.emailTemplates.id} = ${id} AND ${schema.emailTemplates.businessId} = ${businessId}`)
        .limit(1);
      return template;
    } catch (error) {
      console.error("Error fetching email template:", error);
      throw new Error("Failed to fetch email template");
    }
  }
  async getEmailTemplatesByBusinessId(businessId: string): Promise<EmailTemplate[]> {
    try {
      return await db.select()
        .from(schema.emailTemplates)
        .where(eq(schema.emailTemplates.businessId, businessId));
    } catch (error) {
      console.error("Error fetching email templates by business ID:", error);
      throw new Error("Failed to fetch email templates");
    }
  }
  async getEmailTemplateByType(templateType: string, businessId: string): Promise<EmailTemplate | undefined> {
    try {
      const [template] = await db.select()
        .from(schema.emailTemplates)
        .where(sql`${schema.emailTemplates.businessId} = ${businessId} AND ${schema.emailTemplates.templateType} = ${templateType} AND ${schema.emailTemplates.isActive}`)
        .limit(1);
      return template;
    } catch (error) {
      console.error("Error fetching email template by type:", error);
      throw new Error("Failed to fetch email template");
    }
  }
  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    try {
      const [newTemplate] = await db.insert(schema.emailTemplates).values(template).returning();
      return newTemplate;
    } catch (error) {
      console.error("Error creating email template:", error);
      throw new Error("Failed to create email template");
    }
  }
  async updateEmailTemplate(id: string, businessId: string, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined> {
    try {
      const [updated] = await db.update(schema.emailTemplates)
        .set({ ...template, updatedAt: new Date() })
        .where(sql`${schema.emailTemplates.id} = ${id} AND ${schema.emailTemplates.businessId} = ${businessId}`)
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating email template:", error);
      throw new Error("Failed to update email template");
    }
  }
  async getActivityLog(id: string, businessId: string): Promise<ActivityLog | undefined> {
    try {
      const [log] = await db.select()
        .from(schema.activityLog)
        .where(sql`${schema.activityLog.id} = ${id} AND ${schema.activityLog.businessId} = ${businessId}`)
        .limit(1);
      return log;
    } catch (error) {
      console.error("Error fetching activity log:", error);
      throw new Error("Failed to fetch activity log");
    }
  }
  async getActivityLogsByBusinessId(businessId: string, limit?: number): Promise<ActivityLog[]> {
    try {
      const query = db.select()
        .from(schema.activityLog)
        .where(eq(schema.activityLog.businessId, businessId))
        .orderBy(sql`${schema.activityLog.createdAt} DESC`);
      if (limit) {
        query.limit(limit);
      }
      return await query;
    } catch (error) {
      console.error("Error fetching activity logs by business ID:", error);
      throw new Error("Failed to fetch activity logs");
    }
  }
  async getActivityLogsByEntity(entityType: string, entityId: string, businessId: string): Promise<ActivityLog[]> {
    try {
      return await db.select()
        .from(schema.activityLog)
        .where(sql`${schema.activityLog.businessId} = ${businessId} AND ${schema.activityLog.entityType} = ${entityType} AND ${schema.activityLog.entityId} = ${entityId}`)
        .orderBy(sql`${schema.activityLog.createdAt} DESC`);
    } catch (error) {
      console.error("Error fetching activity logs by entity:", error);
      throw new Error("Failed to fetch activity logs");
    }
  }
  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    try {
      const [newLog] = await db.insert(schema.activityLog).values({
        ...log,
        contactId: log.contactId || null,
      }).returning();
      return newLog;
    } catch (error) {
      console.error("Error creating activity log:", error);
      throw new Error("Failed to create activity log");
    }
  }
  async getPaymentTransaction(id: string, businessId: string): Promise<PaymentTransaction | undefined> {
    try {
      const [transaction] = await db.select()
        .from(schema.paymentTransactions)
        .where(sql`${schema.paymentTransactions.id} = ${id} AND ${schema.paymentTransactions.businessId} = ${businessId}`)
        .limit(1);
      return transaction;
    } catch (error) {
      console.error("Error fetching payment transaction:", error);
      throw new Error("Failed to fetch payment transaction");
    }
  }
  async getPaymentTransactionsByInvoice(invoiceId: string, businessId: string): Promise<PaymentTransaction[]> {
    try {
      return await db.select()
        .from(schema.paymentTransactions)
        .where(sql`${schema.paymentTransactions.businessId} = ${businessId} AND ${schema.paymentTransactions.invoiceId} = ${invoiceId}`);
    } catch (error) {
      console.error("Error fetching payment transactions by invoice:", error);
      throw new Error("Failed to fetch payment transactions");
    }
  }
  async getPaymentTransactionsByBusinessId(businessId: string): Promise<PaymentTransaction[]> {
    try {
      return await db.select()
        .from(schema.paymentTransactions)
        .where(eq(schema.paymentTransactions.businessId, businessId));
    } catch (error) {
      console.error("Error fetching payment transactions by business ID:", error);
      throw new Error("Failed to fetch payment transactions");
    }
  }
  async createPaymentTransaction(transaction: InsertPaymentTransaction): Promise<PaymentTransaction> {
    try {
      const [newTransaction] = await db.insert(schema.paymentTransactions).values(transaction).returning();
      return newTransaction;
    } catch (error) {
      console.error("Error creating payment transaction:", error);
      throw new Error("Failed to create payment transaction");
    }
  }
  async updatePaymentTransaction(id: string, businessId: string, transaction: Partial<InsertPaymentTransaction>): Promise<PaymentTransaction | undefined> {
    try {
      const [updated] = await db.update(schema.paymentTransactions)
        .set(transaction)
        .where(sql`${schema.paymentTransactions.id} = ${id} AND ${schema.paymentTransactions.businessId} = ${businessId}`)
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating payment transaction:", error);
      throw new Error("Failed to update payment transaction");
    }
  }
  async getServiceArea(id: string, businessId: string): Promise<ServiceArea | undefined> {
    try {
      const [area] = await db.select()
        .from(schema.serviceAreas)
        .where(sql`${schema.serviceAreas.id} = ${id} AND ${schema.serviceAreas.businessId} = ${businessId}`)
        .limit(1);
      return area;
    } catch (error) {
      console.error("Error fetching service area:", error);
      throw new Error("Failed to fetch service area");
    }
  }
  async getServiceAreasByBusinessId(businessId: string): Promise<ServiceArea[]> {
    try {
      return await db.select()
        .from(schema.serviceAreas)
        .where(eq(schema.serviceAreas.businessId, businessId));
    } catch (error) {
      console.error("Error fetching service areas by business ID:", error);
      throw new Error("Failed to fetch service areas");
    }
  }
  async createServiceArea(area: InsertServiceArea): Promise<ServiceArea> {
    try {
      const [newArea] = await db.insert(schema.serviceAreas).values(area).returning();
      return newArea;
    } catch (error) {
      console.error("Error creating service area:", error);
      throw new Error("Failed to create service area");
    }
  }
  async updateServiceArea(id: string, businessId: string, area: Partial<InsertServiceArea>): Promise<ServiceArea | undefined> {
    try {
      const [updated] = await db.update(schema.serviceAreas)
        .set({ ...area, updatedAt: new Date() })
        .where(sql`${schema.serviceAreas.id} = ${id} AND ${schema.serviceAreas.businessId} = ${businessId}`)
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating service area:", error);
      throw new Error("Failed to update service area");
    }
  }
  async getBusinessHours(id: string, businessId: string): Promise<BusinessHours | undefined> {
    try {
      const [hours] = await db.select()
        .from(schema.businessHours)
        .where(sql`${schema.businessHours.id} = ${id} AND ${schema.businessHours.businessId} = ${businessId}`)
        .limit(1);
      return hours;
    } catch (error) {
      console.error("Error fetching business hours:", error);
      throw new Error("Failed to fetch business hours");
    }
  }
  async getBusinessHoursByBusinessId(businessId: string): Promise<BusinessHours[]> {
    try {
      return await db.select()
        .from(schema.businessHours)
        .where(eq(schema.businessHours.businessId, businessId));
    } catch (error) {
      console.error("Error fetching business hours by business ID:", error);
      throw new Error("Failed to fetch business hours");
    }
  }
  async createBusinessHours(hours: InsertBusinessHours): Promise<BusinessHours> {
    try {
      const [newHours] = await db.insert(schema.businessHours).values(hours).returning();
      return newHours;
    } catch (error) {
      console.error("Error creating business hours:", error);
      throw new Error("Failed to create business hours");
    }
  }
  async updateBusinessHours(id: string, businessId: string, hours: Partial<InsertBusinessHours>): Promise<BusinessHours | undefined> {
    try {
      const [updated] = await db.update(schema.businessHours)
        .set({ ...hours, updatedAt: new Date() })
        .where(sql`${schema.businessHours.id} = ${id} AND ${schema.businessHours.businessId} = ${businessId}`)
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating business hours:", error);
      throw new Error("Failed to update business hours");
    }
  }
  async deleteBusinessHours(id: string, businessId: string): Promise<boolean> {
    try {
      const result = await db.delete(schema.businessHours)
        .where(and(
          eq(schema.businessHours.id, id),
          eq(schema.businessHours.businessId, businessId)
        ));
      return result.count > 0;
    } catch (error) {
      console.error("Error deleting business hours:", error);
      throw new Error("Failed to delete business hours");
    }
  }

  // Landing Page Content
  async getLandingPageContent(businessId: string): Promise<LandingPageContent[]> {
    try {
      return await db.select()
        .from(schema.landingPageContent)
        .where(eq(schema.landingPageContent.businessId, businessId))
        .orderBy(schema.landingPageContent.section, schema.landingPageContent.displayOrder);
    } catch (error) {
      console.error("Error fetching landing page content:", error);
      throw new Error("Failed to fetch landing page content");
    }
  }

  async getLandingPageContentBySection(businessId: string, section: string): Promise<LandingPageContent[]> {
    try {
      return await db.select()
        .from(schema.landingPageContent)
        .where(and(
          eq(schema.landingPageContent.businessId, businessId),
          eq(schema.landingPageContent.section, section)
        ))
        .orderBy(schema.landingPageContent.displayOrder);
    } catch (error) {
      console.error("Error fetching landing page content by section:", error);
      throw new Error("Failed to fetch landing page content");
    }
  }

  async createLandingPageContent(data: InsertLandingPageContent): Promise<LandingPageContent> {
    try {
      const [content] = await db.insert(schema.landingPageContent)
        .values(data)
        .returning();
      return content;
    } catch (error) {
      console.error("Error creating landing page content:", error);
      throw new Error("Failed to create landing page content");
    }
  }

  async updateLandingPageContent(id: string, businessId: string, data: Partial<InsertLandingPageContent>): Promise<LandingPageContent | undefined> {
    try {
      const [updated] = await db.update(schema.landingPageContent)
        .set({ ...data, updatedAt: new Date() })
        .where(and(
          eq(schema.landingPageContent.id, id),
          eq(schema.landingPageContent.businessId, businessId)
        ))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating landing page content:", error);
      throw new Error("Failed to update landing page content");
    }
  }

  async deleteLandingPageContent(id: string, businessId: string): Promise<void> {
    try {
      await db.delete(schema.landingPageContent)
        .where(and(
          eq(schema.landingPageContent.id, id),
          eq(schema.landingPageContent.businessId, businessId)
        ));
    } catch (error) {
      console.error("Error deleting landing page content:", error);
      throw new Error("Failed to delete landing page content");
    }
  }

  async createLandingPageFromTemplate(businessId: string, templateSections: any[]): Promise<LandingPageContent[]> {
    try {
      const results: LandingPageContent[] = [];
      for (const section of templateSections) {
        const created = await this.createLandingPageContent({
          businessId,
          section: section.section,
          elementKey: section.elementKey,
          contentType: section.contentType,
          value: section.value,
          altText: section.altText,
          url: section.url,
          displayOrder: section.displayOrder,
          isActive: section.isActive,
        });
        results.push(created);
      }
      return results;
    } catch (error) {
      console.error("Error creating landing page from template:", error);
      throw new Error("Failed to create landing page from template");
    }
  }

  // Phase 19A: AI Quote System Methods

  async getQuoteVersion(id: string): Promise<QuoteVersion | undefined> {
    try {
      const [version] = await db.select()
        .from(schema.quoteVersions)
        .where(eq(schema.quoteVersions.id, id))
        .limit(1);
      return version;
    } catch (error) {
      console.error("Error fetching quote version:", error);
      throw new Error("Failed to fetch quote version");
    }
  }

  async getQuoteVersionsByQuoteId(quoteId: string): Promise<QuoteVersion[]> {
    try {
      return await db.select()
        .from(schema.quoteVersions)
        .where(eq(schema.quoteVersions.quoteId, quoteId))
        .orderBy(schema.quoteVersions.versionNumber);
    } catch (error) {
      console.error("Error fetching quote versions:", error);
      throw new Error("Failed to fetch quote versions");
    }
  }

  async createQuoteVersion(version: InsertQuoteVersion): Promise<QuoteVersion> {
    try {
      const [newVersion] = await db.insert(schema.quoteVersions)
        .values(version)
        .returning();
      return newVersion;
    } catch (error) {
      console.error("Error creating quote version:", error);
      throw new Error("Failed to create quote version");
    }
  }

  async getLatestQuoteVersion(quoteId: string): Promise<QuoteVersion | undefined> {
    try {
      const [version] = await db.select()
        .from(schema.quoteVersions)
        .where(eq(schema.quoteVersions.quoteId, quoteId))
        .orderBy(desc(schema.quoteVersions.versionNumber))
        .limit(1);
      return version;
    } catch (error) {
      console.error("Error fetching latest quote version:", error);
      throw new Error("Failed to fetch latest quote version");
    }
  }

  // Quote Version Items (Phase 19A)
  async getQuoteVersionItems(versionId: string): Promise<any[]> {
    const result = await db.execute(sql`
      SELECT * FROM quote_version_items 
      WHERE quote_version_id = ${versionId}
      ORDER BY display_order
    `);
    return result.rows;
  }

  async createQuoteVersionItem(data: {
    quoteVersionId: string;
    serviceId?: string;
    description: string;
    quantity: string;
    unitPrice: string;
    lineTotal: string;
    displayOrder?: number;
  }): Promise<any> {
    const result = await db.execute(sql`
      INSERT INTO quote_version_items (
        quote_version_id, service_id, description, quantity, unit_price, line_total, display_order
      ) VALUES (
        ${data.quoteVersionId}, ${data.serviceId || null}, ${data.description}, 
        ${data.quantity}, ${data.unitPrice}, ${data.lineTotal}, ${data.displayOrder || 0}
      )
      RETURNING *
    `);
    return result.rows[0];
  }

  async deleteQuoteVersionItems(versionId: string): Promise<void> {
    await db.execute(sql`
      DELETE FROM quote_version_items WHERE quote_version_id = ${versionId}
    `);
  }


  async getAiQuoteLearningEvent(id: string): Promise<AiQuoteLearningEvent | undefined> {
    try {
      const [event] = await db.select()
        .from(schema.aiQuoteLearningEvents)
        .where(eq(schema.aiQuoteLearningEvents.id, id))
        .limit(1);
      return event;
    } catch (error) {
      console.error("Error fetching AI learning event:", error);
      throw new Error("Failed to fetch AI learning event");
    }
  }

  async getAiQuoteLearningEventsByBusinessId(businessId: string, limit?: number): Promise<AiQuoteLearningEvent[]> {
    try {
      const query = db.select()
        .from(schema.aiQuoteLearningEvents)
        .where(eq(schema.aiQuoteLearningEvents.businessId, businessId))
        .orderBy(desc(schema.aiQuoteLearningEvents.createdAt));

      if (limit) {
        query.limit(limit);
      }

      return await query;
    } catch (error) {
      console.error("Error fetching AI learning events:", error);
      throw new Error("Failed to fetch AI learning events");
    }
  }

  async createAiQuoteLearningEvent(event: InsertAiQuoteLearningEvent): Promise<AiQuoteLearningEvent> {
    try {
      const [newEvent] = await db.insert(schema.aiQuoteLearningEvents)
        .values(event)
        .returning();
      return newEvent;
    } catch (error) {
      console.error("Error creating AI learning event:", error);
      throw new Error("Failed to create AI learning event");
    }
  }

  // WhatsApp Queue Methods
  async createWhatsAppQueueItem(data: InsertWhatsappQueue): Promise<any> {
    try {
      const [item] = await db.insert(schema.whatsappQueue)
        .values(data)
        .returning();
      return item;
    } catch (error) {
      console.error("Error creating WhatsApp queue item:", error);
      throw new Error("Failed to create WhatsApp queue item");
    }
  }

  async getPendingWhatsAppMessages(businessId: string): Promise<any[]> {
    try {
      return await db.select()
        .from(schema.whatsappQueue)
        .where(and(
          eq(schema.whatsappQueue.businessId, businessId),
          eq(schema.whatsappQueue.status, 'pending')
        ))
        .orderBy(schema.whatsappQueue.createdAt);
    } catch (error) {
      console.error("Error fetching pending WhatsApp messages:", error);
      throw new Error("Failed to fetch pending WhatsApp messages");
    }
  }

  async updateWhatsAppQueueItem(id: string, businessId: string, data: any): Promise<any> {
    try {
      const [updated] = await db.update(schema.whatsappQueue)
        .set({ ...data, updatedAt: new Date() })
        .where(and(
          eq(schema.whatsappQueue.id, id),
          eq(schema.whatsappQueue.businessId, businessId)
        ))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating WhatsApp queue item:", error);
      throw new Error("Failed to update WhatsApp queue item");
    }
  }

  async getWhatsAppQueueByProviderMessageId(providerMessageId: string): Promise<any> {
    try {
      const [item] = await db.select()
        .from(schema.whatsappQueue)
        .where(eq(schema.whatsappQueue.providerMessageId, providerMessageId))
        .limit(1);
      return item;
    } catch (error) {
      console.error("Error fetching WhatsApp queue by provider message ID:", error);
      throw new Error("Failed to fetch WhatsApp queue item");
    }
  }

  async getWhatsAppQueueStats(businessId: string): Promise<any> {
    try {
      const [stats] = await db.select({
        pending: sql<number>`COUNT(CASE WHEN ${schema.whatsappQueue.status} = 'pending' THEN 1 END)`,
        sent: sql<number>`COUNT(CASE WHEN ${schema.whatsappQueue.status} = 'sent' THEN 1 END)`,
        delivered: sql<number>`COUNT(CASE WHEN ${schema.whatsappQueue.status} = 'delivered' THEN 1 END)`,
        failed: sql<number>`COUNT(CASE WHEN ${schema.whatsappQueue.status} = 'failed' THEN 1 END)`,
      })
        .from(schema.whatsappQueue)
        .where(eq(schema.whatsappQueue.businessId, businessId));
      return stats || { pending: 0, sent: 0, delivered: 0, failed: 0 };
    } catch (error) {
      console.error("Error fetching WhatsApp queue stats:", error);
      throw new Error("Failed to fetch WhatsApp queue stats");
    }
  }

  // WhatsApp Templates
  async createWhatsappTemplate(data: any): Promise<any> {
    try {
      const [template] = await db.insert(schema.whatsappTemplates).values(data).returning();
      return template;
    } catch (error) {
      console.error("Error creating WhatsApp template:", error);
      throw new Error("Failed to create WhatsApp template");
    }
  }

  async getWhatsappTemplatesByBusinessId(businessId: string): Promise<any[]> {
    try {
      return await db.select()
        .from(schema.whatsappTemplates)
        .where(eq(schema.whatsappTemplates.businessId, businessId))
        .orderBy(desc(schema.whatsappTemplates.createdAt));
    } catch (error) {
      console.error("Error fetching WhatsApp templates:", error);
      throw new Error("Failed to fetch WhatsApp templates");
    }
  }

  async updateWhatsappTemplate(id: string, businessId: string, data: any): Promise<any> {
    try {
      const [updated] = await db.update(schema.whatsappTemplates)
        .set({ ...data, updatedAt: new Date() })
        .where(and(
          eq(schema.whatsappTemplates.id, id),
          eq(schema.whatsappTemplates.businessId, businessId)
        ))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating WhatsApp template:", error);
      throw new Error("Failed to update WhatsApp template");
    }
  }

  async getWhatsappQueueByBusinessId(businessId: string, limit: number = 50): Promise<any[]> {
    try {
      return await db.select()
        .from(schema.whatsappQueue)
        .where(eq(schema.whatsappQueue.businessId, businessId))
        .orderBy(desc(schema.whatsappQueue.createdAt))
        .limit(limit);
    } catch (error) {
      console.error("Error fetching WhatsApp queue:", error);
      throw new Error("Failed to fetch WhatsApp queue");
    }
  }

  async getWhatsappTemplateByName(templateName: string): Promise<WhatsappTemplate | undefined> {
    try {
      const [template] = await db
        .select()
        .from(schema.whatsappTemplates)
        .where(eq(schema.whatsappTemplates.templateName, templateName))
        .limit(1);
      return template;
    } catch (error) {
      console.error("Error fetching WhatsApp template by name:", error);
      throw new Error("Failed to fetch WhatsApp template");
    }
  }

  // Deposit Policies (Phase 2 - Deposit System)
  async getDepositPolicies(businessId: string): Promise<any[]> {
    try {
      return await db.select()
        .from(schema.depositPolicies)
        .where(eq(schema.depositPolicies.businessId, businessId))
        .orderBy(schema.depositPolicies.createdAt);
    } catch (error) {
      console.error("Error fetching deposit policies:", error);
      throw new Error("Failed to fetch deposit policies");
    }
  }

  async getDepositPolicy(id: string, businessId: string): Promise<any | undefined> {
    try {
      const [policy] = await db.select()
        .from(schema.depositPolicies)
        .where(and(
          eq(schema.depositPolicies.id, id),
          eq(schema.depositPolicies.businessId, businessId)
        ))
        .limit(1);
      return policy;
    } catch (error) {
      console.error("Error fetching deposit policy:", error);
      throw new Error("Failed to fetch deposit policy");
    }
  }

  async createDepositPolicy(data: any): Promise<any> {
    try {
      const [policy] = await db.insert(schema.depositPolicies).values(data).returning();
      return policy;
    } catch (error) {
      console.error("Error creating deposit policy:", error);
      throw new Error("Failed to create deposit policy");
    }
  }

  async updateDepositPolicy(id: string, businessId: string, data: any): Promise<any | undefined> {
    try {
      const [updated] = await db.update(schema.depositPolicies)
        .set({ ...data, updatedAt: new Date() })
        .where(and(
          eq(schema.depositPolicies.id, id),
          eq(schema.depositPolicies.businessId, businessId)
        ))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating deposit policy:", error);
      throw new Error("Failed to update deposit policy");
    }
  }

  async deleteDepositPolicy(id: string, businessId: string): Promise<boolean> {
    try {
      await db.delete(schema.depositPolicies)
        .where(and(
          eq(schema.depositPolicies.id, id),
          eq(schema.depositPolicies.businessId, businessId)
        ));
      return true;
    } catch (error) {
      console.error("Error deleting deposit policy:", error);
      throw new Error("Failed to delete deposit policy");
    }
  }

  async getDepositPolicyByService(businessId: string, serviceId: string): Promise<any | undefined> {
    try {
      const [policy] = await db.select()
        .from(schema.depositPolicies)
        .where(and(
          eq(schema.depositPolicies.businessId, businessId),
          eq(schema.depositPolicies.serviceId, serviceId),
          eq(schema.depositPolicies.isActive, true)
        ))
        .limit(1);
      return policy;
    } catch (error) {
      console.error("Error fetching deposit policy by service:", error);
      throw new Error("Failed to fetch deposit policy");
    }
  }

  // Activity Logger Helper
  async logActivity(data: any): Promise<any> {
    try {
      const [activity] = await db.insert(schema.activityLog)
        .values(data)
        .returning();
      return activity;
    } catch (error) {
      console.error("Error logging activity:", error);
      throw new Error("Failed to log activity");
    }
  }

  // Quote & Job Deposit Settings
  async updateQuoteDepositSettings(quoteId: string, businessId: string, data: any): Promise<any | undefined> {
    try {
      const [updated] = await db.update(schema.quotes)
        .set({ ...data, updatedAt: new Date() })
        .where(and(
          eq(schema.quotes.id, quoteId),
          eq(schema.quotes.businessId, businessId)
        ))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating quote deposit settings:", error);
      throw new Error("Failed to update quote deposit settings");
    }
  }

  async updateJobDepositStatus(jobId: string, businessId: string, data: any): Promise<any | undefined> {
    try {
      const [updated] = await db.update(schema.jobs)
        .set({ ...data, updatedAt: new Date() })
        .where(and(
          eq(schema.jobs.id, jobId),
          eq(schema.jobs.businessId, businessId)
        ))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating job deposit status:", error);
      throw new Error("Failed to update job deposit status");
    }
  }

  async getInvoicesByType(businessId: string, invoiceType: string): Promise<Invoice[]> {
    try {
      return await db.select()
        .from(schema.invoices)
        .where(and(
          eq(schema.invoices.businessId, businessId),
          eq(schema.invoices.invoiceType, invoiceType)
        ))
        .orderBy(desc(schema.invoices.createdAt));
    } catch (error) {
      console.error("Error fetching invoices by type:", error);
      throw new Error("Failed to fetch invoices");
    }
  }

  async getAllBusinesses(): Promise<Business[]> {
    try {
      return await db.select()
        .from(schema.businesses);
    } catch (error) {
      console.error("Error fetching all businesses:", error);
      throw new Error("Failed to fetch businesses");
    }
  }


  // ============================================================================
  // WHATSAPP SESSIONS METHODS (WaSender Integration)
  // ============================================================================

  async createWhatsAppSession(data: InsertWhatsappSession): Promise<WhatsappSession> {
    try {
      const [session] = await db.insert(whatsappSessions).values({
        ...data,
        id: data.id || crypto.randomUUID(), // Generate ID if not provided
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      return session;
    } catch (error) {
      console.error("Error creating WhatsApp session:", error);
      throw new Error("Failed to create WhatsApp session");
    }
  }

  async getWhatsAppSession(id: string, businessId: string): Promise<WhatsappSession | null> {
    try {
      const [session] = await db
        .select()
        .from(whatsappSessions)
        .where(and(eq(whatsappSessions.id, id), eq(whatsappSessions.businessId, businessId)))
        .limit(1);
      return session || null;
    } catch (error) {
      console.error("Error fetching WhatsApp session:", error);
      throw new Error("Failed to fetch WhatsApp session");
    }
  }

  async getWhatsAppSessionBySessionId(sessionId: string): Promise<WhatsappSession | null> {
    try {
      const [session] = await db
        .select()
        .from(whatsappSessions)
        .where(eq(whatsappSessions.sessionId, sessionId))
        .limit(1);
      return session || null;
    } catch (error) {
      console.error("Error fetching WhatsApp session by session ID:", error);
      throw new Error("Failed to fetch WhatsApp session");
    }
  }

  async getWhatsAppSessionsByBusinessId(businessId: string): Promise<WhatsappSession[]> {
    try {
      return await db
        .select()
        .from(whatsappSessions)
        .where(eq(whatsappSessions.businessId, businessId))
        .orderBy(desc(whatsappSessions.createdAt));
    } catch (error) {
      console.error("Error fetching WhatsApp sessions by business ID:", error);
      throw new Error("Failed to fetch WhatsApp sessions");
    }
  }

  async getActiveWhatsAppSession(businessId: string): Promise<WhatsappSession | null> {
    try {
      const [session] = await db
        .select()
        .from(whatsappSessions)
        .where(
          and(
            eq(whatsappSessions.businessId, businessId),
            eq(whatsappSessions.status, 'connected')
          )
        )
        .limit(1);
      return session || null;
    } catch (error) {
      console.error("Error fetching active WhatsApp session:", error);
      throw new Error("Failed to fetch active WhatsApp session");
    }
  }

  async updateWhatsAppSession(
    id: string,
    businessId: string,
    data: Partial<WhatsappSession>
  ): Promise<WhatsappSession | null> {
    try {
      const [updated] = await db
        .update(whatsappSessions)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(whatsappSessions.id, id), eq(whatsappSessions.businessId, businessId)))
        .returning();
      return updated || null;
    } catch (error) {
      console.error("Error updating WhatsApp session:", error);
      throw new Error("Failed to update WhatsApp session");
    }
  }

  async deleteWhatsAppSession(id: string, businessId: string): Promise<boolean> {
    try {
      const result = await db
        .delete(whatsappSessions)
        .where(and(eq(whatsappSessions.id, id), eq(whatsappSessions.businessId, businessId)));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error("Error deleting WhatsApp session:", error);
      throw new Error("Failed to delete WhatsApp session");
    }
  }

  // ============================================================================
  // GOOGLE BUSINESS PROFILE METHODS
  // ============================================================================

  // Businesses
  async getBusiness(id: string): Promise<Business | undefined> {
    try {
      const [business] = await db.select()
        .from(schema.businesses)
        .where(sql`${schema.businesses.id} = ${id}`)
        .limit(1);

      // Add default values for payment settings if they don't exist
      if (business && !business.defaultPaymentDueDays) {
        business.defaultPaymentDueDays = 30;
      }
      if (business && !business.paymentReminderDays) {
        business.paymentReminderDays = [3, 7, 14];
      }

      return business;
    } catch (error) {
      console.error("Error fetching business:", error);
      // If it's a column missing error, return business without those fields
      if (error.code === '42703') {
        console.warn("Payment settings columns not found, using defaults");
        const [business] = await db.select()
          .from(schema.businesses)
          .where(sql`${schema.businesses.id} = ${id}`)
          .limit(1);
        return business;
      }
      throw new Error("Failed to fetch business");
    }
  }


  async createBusiness(business: InsertBusiness): Promise<Business> {
    try {
      const [newBusiness] = await db.insert(schema.businesses).values(business).returning();
      return newBusiness;
    } catch (error) {
      console.error("Error creating business:", error);
      throw new Error("Failed to create business");
    }
  }

  async updateBusiness(id: string, business: Partial<InsertBusiness>): Promise<Business | undefined> {
    try {
      // Drizzle ORM handles JSONB serialization automatically
      const [updated] = await db.update(schema.businesses)
        .set({ ...business, updatedAt: new Date() })
        .where(eq(schema.businesses.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating business:", error);
      throw new Error("Failed to update business");
    }
  }

  // WaSender API Key Management
  async getBusinessWasenderApiKey(businessId: string): Promise<string | null> {
    try {
      const business = await this.getBusiness(businessId);
      return business?.whatsappWasenderApiKey || null;
    } catch (error) {
      console.error("Error fetching WaSender API key:", error);
      throw new Error("Failed to fetch WaSender API key");
    }
  }

  async updateBusinessWasenderApiKey(businessId: string, apiKey: string | null): Promise<Business | undefined> {
    try {
      return await this.updateBusiness(businessId, {
        whatsappWasenderApiKey: apiKey,
      });
    } catch (error) {
      console.error("Error updating WaSender API key:", error);
      throw new Error("Failed to update WaSender API key");
    }
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
      return user;
    } catch (error) {
      console.error("Error fetching user:", error);
      throw new Error("Failed to fetch user");
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
      return user;
    } catch (error) {
      console.error("Error fetching user by email:", error);
      throw new Error("Failed to fetch user by email");
    }
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    try {
      const [user] = await db.select()
        .from(schema.users)
        .where(eq(schema.users.emailVerificationToken, token))
        .limit(1);
      return user;
    } catch (error) {
      console.error("Error fetching user by verification token:", error);
      throw new Error("Failed to fetch user by verification token");
    }
  }

  async getUserByPasswordResetToken(token: string): Promise<User | undefined> {
    try {
      const [user] = await db.select()
        .from(schema.users)
        .where(eq(schema.users.passwordResetToken, token))
        .limit(1);
      return user;
    } catch (error) {
      console.error("Error fetching user by password reset token:", error);
      throw new Error("Failed to fetch user by password reset token");
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      return await db.select().from(schema.users);
    } catch (error) {
      console.error("Error fetching all users:", error);
      throw new Error("Failed to fetch users");
    }
  }

  async getUsersByBusinessId(businessId: string): Promise<User[]> {
    try {
      return await db.select().from(schema.users).where(eq(schema.users.businessId, businessId));
    } catch (error) {
      console.error("Error fetching users by business ID:", error);
      throw new Error("Failed to fetch users");
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const [newUser] = await db.insert(schema.users).values(user).returning();
      return newUser;
    } catch (error) {
      console.error("Error creating user:", error);
      throw new Error("Failed to create user");
    }
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    try {
      const [updated] = await db.update(schema.users)
        .set({ ...user, updatedAt: new Date() })
        .where(eq(schema.users.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating user:", error);
      throw new Error("Failed to update user");
    }
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      const [user] = await db
        .insert(schema.users)
        .values({
          id: userData.id,
          email: userData.email ?? null,
          firstName: userData.firstName ?? null,
          lastName: userData.lastName ?? null,
          profileImageUrl: userData.profileImageUrl ?? null,
          emailVerified: true, // OAuth users are pre-verified
          passwordHash: null, // OAuth users don't need password
        })
        .onConflictDoUpdate({
          target: schema.users.id,
          set: {
            email: userData.email ?? null,
            firstName: userData.firstName ?? null,
            lastName: userData.lastName ?? null,
            profileImageUrl: userData.profileImageUrl ?? null,
            emailVerified: true, // Ensure OAuth users stay verified
            updatedAt: new Date(),
          },
        })
        .returning();
      return user;
    } catch (error) {
      console.error("Error upserting user:", error);
      throw new Error("Failed to upsert user");
    }
  }

  // Contacts
  async getContact(id: string, businessId: string): Promise<Contact | undefined> {
    try {
      const [contact] = await db.select()
        .from(schema.contacts)
        .where(sql`${schema.contacts.id} = ${id} AND ${schema.contacts.businessId} = ${businessId}`)
        .limit(1);
      return contact;
    } catch (error) {
      console.error("Error fetching contact:", error);
      throw new Error("Failed to fetch contact");
    }
  }

  async getContactsByBusinessId(businessId: string): Promise<Contact[]> {
    try {
      return await db.select()
        .from(schema.contacts)
        .where(eq(schema.contacts.businessId, businessId))
        .orderBy(sql`${schema.contacts.createdAt} DESC`);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      throw new Error("Failed to fetch contacts");
    }
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    try {
      const [newContact] = await db.insert(schema.contacts).values(contact).returning();
      return newContact;
    } catch (error) {
      console.error("Error creating contact:", error);
      throw new Error("Failed to create contact");
    }
  }

  async updateContact(id: string, businessId: string, contact: Partial<InsertContact>): Promise<Contact | undefined> {
    try {
      // Set opt-in/opt-out dates based on whatsappOptIn changes
      const updateData: any = { ...contact, updatedAt: new Date() };

      if (contact.whatsappOptIn !== undefined) {
        if (contact.whatsappOptIn === true) {
          updateData.whatsappOptInDate = new Date();
          updateData.whatsappOptOutDate = null;
        } else if (contact.whatsappOptIn === false) {
          updateData.whatsappOptOutDate = new Date();
        }
      }

      const [updated] = await db
        .update(schema.contacts)
        .set(updateData)
        .where(and(eq(schema.contacts.id, id), eq(schema.contacts.businessId, businessId)))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating contact:", error);
      throw new Error("Failed to update contact");
    }
  }

  async deleteContact(id: string, businessId: string): Promise<boolean> {
    try {
      await db.delete(schema.contacts)
        .where(and(
          eq(schema.contacts.id, id),
          eq(schema.contacts.businessId, businessId)
        ));
      return true;
    } catch (error) {
      console.error("Error deleting contact:", error);
      throw new Error("Failed to delete contact");
    }
  }

  // Services
  async getService(id: string, businessId: string): Promise<Service | undefined> {
    try {
      const [service] = await db.select()
        .from(schema.services)
        .where(sql`${schema.services.id} = ${id} AND ${schema.services.businessId} = ${businessId}`)
        .limit(1);
      return service;
    } catch (error) {
      console.error("Error fetching service:", error);
      throw new Error("Failed to fetch service");
    }
  }

  async getServicesByBusinessId(businessId: string): Promise<Service[]> {
    try {
      return await db.select()
        .from(schema.services)
        .where(eq(schema.services.businessId, businessId))
        .orderBy(schema.services.displayOrder);
    } catch (error) {
      console.error("Error fetching services by business ID:", error);
      throw new Error("Failed to fetch services");
    }
  }

  async createService(service: InsertService): Promise<Service> {
    try {
      const [newService] = await db.insert(schema.services).values(service).returning();
      return newService;
    } catch (error) {
      console.error("Error creating service:", error);
      throw new Error("Failed to create service");
    }
  }

  async updateService(id: string, businessId: string, service: Partial<InsertService>): Promise<Service | undefined> {
    try {
      const [updated] = await db.update(schema.services)
        .set({ ...service, updatedAt: new Date() })
        .where(sql`${schema.services.id} = ${id} AND ${schema.services.businessId} = ${businessId}`)
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating service:", error);
      throw new Error("Failed to update service");
    }
  }

  async deleteService(id: string, businessId: string): Promise<boolean> {
    try {
      const [deleted] = await db.delete(schema.services)
        .where(sql`${schema.services.id} = ${id} AND ${schema.services.businessId} = ${businessId}`)
        .returning();
      return !!deleted;
    } catch (error) {
      console.error("Error deleting service:", error);
      throw new Error("Failed to delete service");
    }
  }

  async getQuote(id: string, businessId: string): Promise<Quote | undefined> {
    try {
      if (!businessId) {
        // Public access - get quote by ID only
        const [quote] = await db.select()
          .from(schema.quotes)
          .where(eq(schema.quotes.id, id))
          .limit(1);
        return quote;
      }
      const [quote] = await db.select()
        .from(schema.quotes)
        .where(sql`${schema.quotes.id} = ${id} AND ${schema.quotes.businessId} = ${businessId}`)
        .limit(1);
      return quote;
    } catch (error) {
      console.error("Error fetching quote:", error);
      throw new Error("Failed to fetch quote");
    }
  }
  async getQuotesByBusinessId(businessId: string): Promise<Quote[]> {
    try {
      return await db.select()
        .from(schema.quotes)
        .where(eq(schema.quotes.businessId, businessId))
        .orderBy(sql`${schema.quotes.createdAt} DESC`);
    } catch (error) {
      console.error("Error fetching quotes by business ID:", error);
      throw new Error("Failed to fetch quotes");
    }
  }
  async getQuotesByContactId(contactId: string, businessId: string): Promise<Quote[]> {
    try {
      return await db.select()
        .from(schema.quotes)
        .where(sql`${schema.quotes.contactId} = ${contactId} AND ${schema.quotes.businessId} = ${businessId}`)
        .orderBy(sql`${schema.quotes.createdAt} DESC`);
    } catch (error) {
      console.error("Error fetching quotes by contact ID:", error);
      throw new Error("Failed to fetch quotes");
    }
  }
  async createQuote(quote: InsertQuote): Promise<Quote> {
    try {
      const [newQuote] = await db.insert(schema.quotes).values(quote).returning();
      return newQuote;
    } catch (error) {
      console.error("Error creating quote:", error);
      throw new Error("Failed to create quote");
    }
  }
  async updateQuote(id: string, businessId: string, quote: Partial<InsertQuote>): Promise<Quote | undefined> {
    try {
      const [updated] = await db.update(schema.quotes)
        .set({ ...quote, updatedAt: new Date() })
        .where(and(eq(schema.quotes.id, id), eq(schema.quotes.businessId, businessId)))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating quote:", error);
      throw new Error("Failed to update quote");
    }
  }
  async getQuoteItemsByQuoteId(quoteId: string): Promise<QuoteItem[]> {
    try {
      return await db.select()
        .from(schema.quoteItems)
        .where(eq(schema.quoteItems.quoteId, quoteId))
        .orderBy(schema.quoteItems.displayOrder);
    } catch (error) {
      console.error("Error fetching quote items by quote ID:", error);
      throw new Error("Failed to fetch quote items");
    }
  }
  async createQuoteItem(item: InsertQuoteItem): Promise<QuoteItem> {
    try {
      const [newItem] = await db.insert(schema.quoteItems).values(item).returning();
      return newItem;
    } catch (error) {
      console.error("Error creating quote item:", error);
      throw new Error("Failed to create quote item");
    }
  }

  async getQuoteStats(businessId: string): Promise<{
    totalThisMonth: number;
    pending: number;
    acceptedThisMonth: number;
    acceptedValue: number;
    conversionRate: number;
  }> {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const quotes = await db.select()
        .from(schema.quotes)
        .where(eq(schema.quotes.businessId, businessId));

      const thisMonth = quotes.filter(q => new Date(q.createdAt) >= startOfMonth);
      const pending = quotes.filter(q => q.status === 'sent' || q.status === 'viewed').length;
      const acceptedThisMonth = thisMonth.filter(q => q.status === 'accepted');
      const acceptedValue = acceptedThisMonth.reduce((sum, q) => sum + parseFloat(q.totalAmount), 0);
      const sent = thisMonth.filter(q => q.status !== 'draft').length;
      const conversionRate = sent > 0 ? Math.round((acceptedThisMonth.length / sent) * 100) : 0;

      return {
        totalThisMonth: thisMonth.length,
        pending,
        acceptedThisMonth: acceptedThisMonth.length,
        acceptedValue,
        conversionRate,
      };
    } catch (error) {
      console.error("Error fetching quote stats:", error);
      throw new Error("Failed to fetch quote stats");
    }
  }
  async deleteQuoteItem(id: string): Promise<boolean> {
    try {
      await db.delete(schema.quoteItems)
        .where(eq(schema.quoteItems.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting quote item:", error);
      throw new Error("Failed to delete quote item");
    }
  }
  async deleteQuote(id: string, businessId: string): Promise<boolean> {
    try {
      // First verify the quote exists and belongs to this business
      const quote = await this.getQuote(id, businessId);
      if (!quote) {
        throw new Error("Quote not found or access denied");
      }

      // Only allow deleting draft quotes
      if (quote.status !== "draft") {
        throw new Error("Only draft quotes can be deleted. Please archive instead.");
      }

      // Delete quote items first (due to foreign key constraint)
      await db.delete(schema.quoteItems)
        .where(eq(schema.quoteItems.quoteId, id));

      // Then delete the quote
      await db.delete(schema.quotes)
        .where(and(
          eq(schema.quotes.id, id),
          eq(schema.quotes.businessId, businessId)
        ));
      return true;
    } catch (error) {
      console.error("Error deleting quote:", error);
      throw error;
    }
  }
  async getJob(id: string, businessId: string): Promise<Job | undefined> {
    try {
      const [job] = await db.select()
        .from(schema.jobs)
        .where(sql`${schema.jobs.id} = ${id} AND ${schema.jobs.businessId} = ${businessId}`)
        .limit(1);
      return job;
    } catch (error) {
      console.error("Error fetching job:", error);
      throw new Error("Failed to fetch job");
    }
  }
  async getJobsByBusinessId(businessId: string): Promise<Job[]> {
    try {
      return await db.select()
        .from(schema.jobs)
        .where(eq(schema.jobs.businessId, businessId))
        .orderBy(desc(schema.jobs.createdAt));
    } catch (error) {
      console.error("Error fetching jobs by business ID:", error);
      throw new Error("Failed to fetch jobs");
    }
  }
  async createJobItem(data: InsertJobItem): Promise<JobItem> {
    try {
      const [item] = await db.insert(schema.jobItems)
        .values(data)
        .returning();
      return item;
    } catch (error) {
      console.error("Error creating job item:", error);
      throw new Error("Failed to create job item");
    }
  }
  async getJobItemsByJobId(jobId: string): Promise<JobItem[]> {
    try {
      return await db.select()
        .from(schema.jobItems)
        .where(eq(schema.jobItems.jobId, jobId))
        .orderBy(schema.jobItems.displayOrder);
    } catch (error) {
      console.error("Error fetching job items:", error);
      throw new Error("Failed to fetch job items");
    }
  }
  async deleteJobItems(jobId: string): Promise<void> {
    try {
      await db.delete(schema.jobItems)
        .where(eq(schema.jobItems.jobId, jobId));
    } catch (error) {
      console.error("Error deleting job items:", error);
      throw new Error("Failed to delete job items");
    }
  }
  async getJobsByDate(businessId: string, date: string): Promise<Job[]> {
    try {
      return await db.select()
        .from(schema.jobs)
        .where(sql`${schema.jobs.businessId} = ${businessId} AND ${schema.jobs.scheduledDate} = ${date}`)
        .orderBy(schema.jobs.scheduledStartTime);
    } catch (error) {
      console.error("Error fetching jobs by date:", error);
      throw new Error("Failed to fetch jobs");
    }
  }
  async createJob(job: InsertJob): Promise<Job> {
    try {
      const [newJob] = await db.insert(schema.jobs).values(job).returning();
      return newJob;
    } catch (error) {
      console.error("Error creating job:", error);
      // Re-throw the original error to preserve error codes for retry logic
      throw error;
    }
  }
  async updateJob(id: string, businessId: string, job: Partial<InsertJob>): Promise<Job | undefined> {
    try {
      const [updated] = await db.update(schema.jobs)
        .set({ ...job, updatedAt: new Date() })
        .where(sql`${schema.jobs.id} = ${id} AND ${schema.jobs.businessId} = ${businessId}`)
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating job:", error);
      throw new Error("Failed to update job");
    }
  }

  async deleteJob(id: string, businessId: string): Promise<boolean> {
    try {
      await db.delete(schema.jobs)
        .where(and(
          eq(schema.jobs.id, id),
          eq(schema.jobs.businessId, businessId)
        ));
      return true;
    } catch (error) {
      console.error("Error deleting job:", error);
      throw new Error("Failed to delete job");
    }
  }
  async getTestimonial(id: string, businessId: string): Promise<Testimonial | undefined> {
    try {
      const [testimonial] = await db.select()
        .from(schema.testimonials)
        .where(sql`${schema.testimonials.id} = ${id} AND ${schema.testimonials.businessId} = ${businessId}`)
        .limit(1);
      return testimonial;
    } catch (error) {
      console.error("Error fetching testimonial:", error);
      throw new Error("Failed to fetch testimonial");
    }
  }
  async getTestimonialsByBusinessId(businessId: string, status?: string): Promise<Testimonial[]> {
    try {
      if (status) {
        return await db.select()
          .from(schema.testimonials)
          .where(sql`${schema.testimonials.businessId} = ${businessId} AND ${schema.testimonials.status} = ${status}`)
          .orderBy(schema.testimonials.displayOrder);
      }
      return await db.select()
        .from(schema.testimonials)
        .where(eq(schema.testimonials.businessId, businessId))
        .orderBy(schema.testimonials.displayOrder);
    } catch (error) {
      console.error("Error fetching testimonials by business ID:", error);
      throw new Error("Failed to fetch testimonials");
    }
  }
  async createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial> {
    try {
      const [newTestimonial] = await db.insert(schema.testimonials).values(testimonial).returning();
      return newTestimonial;
    } catch (error) {
      console.error("Error creating testimonial:", error);
      throw new Error("Failed to create testimonial");
    }
  }
  async updateTestimonial(id: string, businessId: string, testimonial: Partial<InsertTestimonial>): Promise<Testimonial | undefined> {
    try {
      const [updated] = await db.update(schema.testimonials)
        .set(testimonial)
        .where(sql`${schema.testimonials.id} = ${id} AND ${schema.testimonials.businessId} = ${businessId}`)
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating testimonial:", error);
      throw new Error("Failed to update testimonial");
    }
  }

  async deleteTestimonial(id: string, businessId: string): Promise<boolean> {
    try {
      await db.delete(schema.testimonials)
        .where(and(
          eq(schema.testimonials.id, id),
          eq(schema.testimonials.businessId, businessId)
        ));
      return true;
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      throw new Error("Failed to delete testimonial");
    }
  }
  async getCalendarSettings(businessId: string): Promise<CalendarSettings | undefined> {
    try {
      const [settings] = await db.select()
        .from(schema.calendarSettings)
        .where(eq(schema.calendarSettings.businessId, businessId))
        .limit(1);
      return settings;
    } catch (error) {
      console.error("Error fetching calendar settings:", error);
      throw new Error("Failed to fetch calendar settings");
    }
  }
  async createCalendarSettings(settings: InsertCalendarSettings): Promise<CalendarSettings> {
    try {
      const [newSettings] = await db.insert(schema.calendarSettings).values(settings).returning();
      return newSettings;
    } catch (error) {
      console.error("Error creating calendar settings:", error);
      throw new Error("Failed to create calendar settings");
    }
  }
  async updateCalendarSettings(businessId: string, settings: Partial<InsertCalendarSettings>): Promise<CalendarSettings | undefined> {
    try {
      const [updated] = await db.update(schema.calendarSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(schema.calendarSettings.businessId, businessId))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating calendar settings:", error);
      throw new Error("Failed to update calendar settings");
    }
  }
  async getInvoice(id: string, businessId: string): Promise<Invoice | undefined> {
    try {
      if (!businessId) {
        // Public access - get invoice by ID only
        const [invoice] = await db.select()
          .from(schema.invoices)
          .where(eq(schema.invoices.id, id))
          .limit(1);
        return invoice;
      }
      const [invoice] = await db.select()
        .from(schema.invoices)
        .where(sql`${schema.invoices.id} = ${id} AND ${schema.invoices.businessId} = ${businessId}`)
        .limit(1);
      return invoice;
    } catch (error) {
      console.error("Error fetching invoice:", error);
      throw new Error("Failed to fetch invoice");
    }
  }
  async getInvoicesByBusinessId(businessId: string): Promise<Invoice[]> {
    try {
      const invoices = await db.select({
        id: schema.invoices.id,
        businessId: schema.invoices.businessId,
        jobId: schema.invoices.jobId,
        contactId: schema.invoices.contactId,
        invoiceNumber: schema.invoices.invoiceNumber,
        title: schema.invoices.title,
        status: schema.invoices.status,
        dueDate: schema.invoices.dueDate,
        paidAt: schema.invoices.paidAt,
        paymentMethod: schema.invoices.paymentMethod,
        subtotal: schema.invoices.subtotal,
        taxAmount: schema.invoices.taxAmount,
        totalAmount: schema.invoices.totalAmount,
        notes: schema.invoices.notes,
        publicToken: schema.invoices.publicToken,
        remindersSent: schema.invoices.remindersSent,
        lastReminderSentAt: schema.invoices.lastReminderSentAt,
        createdAt: schema.invoices.createdAt,
        updatedAt: schema.invoices.updatedAt,
      })
        .from(schema.invoices)
        .where(eq(schema.invoices.businessId, businessId))
        .orderBy(sql`${schema.invoices.createdAt} DESC`);

      return invoices;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
  }
  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    try {
      const [newInvoice] = await db.insert(schema.invoices).values(invoice).returning();
      return newInvoice;
    } catch (error) {
      console.error("Error creating invoice:", error);
      throw new Error("Failed to create invoice");
    }
  }
  async updateInvoice(id: string, businessId: string, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    try {
      const [updated] = await db.update(schema.invoices)
        .set({ ...invoice, updatedAt: new Date() })
        .where(sql`${schema.invoices.id} = ${id} AND ${schema.invoices.businessId} = ${businessId}`)
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating invoice:", error);
      throw new Error("Failed to update invoice");
    }
  }

  async getInvoiceItemsByInvoiceId(invoiceId: string): Promise<InvoiceItem[]> {
    try {
      return await db.select()
        .from(schema.invoiceItems)
        .where(eq(schema.invoiceItems.invoiceId, invoiceId))
        .orderBy(schema.invoiceItems.displayOrder);
    } catch (error) {
      console.error("Error fetching invoice items:", error);
      throw new Error("Failed to fetch invoice items");
    }
  }

  async createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem> {
    try {
      const [newItem] = await db.insert(schema.invoiceItems)
        .values(item)
        .returning();
      return newItem;
    } catch (error) {
      console.error("Error creating invoice item:", error);
      throw new Error("Failed to create invoice item");
    }
  }

  async deleteInvoiceItems(invoiceId: string): Promise<void> {
    try {
      await db.delete(schema.invoiceItems)
        .where(eq(schema.invoiceItems.invoiceId, invoiceId));
    } catch (error) {
      console.error("Error deleting invoice items:", error);
      throw new Error("Failed to delete invoice items");
    }
  }

  async deleteInvoice(id: string, businessId: string): Promise<void> {
    try {
      await this.deleteInvoiceItems(id);
      await db.delete(schema.invoices)
        .where(sql`${schema.invoices.id} = ${id} AND ${schema.invoices.businessId} = ${businessId}`);
    } catch (error) {
      console.error("Error deleting invoice:", error);
      throw new Error("Failed to delete invoice");
    }
  }

  async getAttachment(id: string, businessId: string): Promise<Attachment | undefined> {
    try {
      const [attachment] = await db.select()
        .from(schema.attachments)
        .where(sql`${schema.attachments.id} = ${id} AND ${schema.attachments.businessId} = ${businessId}`)
        .limit(1);
      return attachment;
    } catch (error) {
      console.error("Error fetching attachment:", error);
      throw new Error("Failed to fetch attachment");
    }
  }
  async getAttachmentsByRelated(relatedType: string, relatedId: string, businessId: string): Promise<Attachment[]> {
    try {
      return await db.select()
        .from(schema.attachments)
        .where(sql`${schema.attachments.businessId} = ${businessId} AND ${schema.attachments.relatedType} = ${relatedType} AND ${schema.attachments.relatedId} = ${relatedId}`);
    } catch (error) {
      console.error("Error fetching attachments by related:", error);
      throw new Error("Failed to fetch attachments");
    }
  }
  async createAttachment(attachment: InsertAttachment): Promise<Attachment> {
    try {
      const [newAttachment] = await db.insert(schema.attachments).values(attachment).returning();
      return newAttachment;
    } catch (error) {
      console.error("Error creating attachment:", error);
      throw new Error("Failed to create attachment");
    }
  }
  async deleteAttachment(id: string, businessId: string): Promise<boolean> {
    try {
      const result = await db.delete(schema.attachments)
        .where(sql`${schema.attachments.id} = ${id} AND ${schema.attachments.businessId} = ${businessId}`);
      return result.count > 0;
    } catch (error) {
      console.error("Error deleting attachment:", error);
      throw new Error("Failed to delete attachment");
    }
  }
  async getEmailQueueItem(id: string, businessId: string): Promise<EmailQueue | undefined> {
    try {
      const [email] = await db.select()
        .from(schema.emailQueue)
        .where(sql`${schema.emailQueue.id} = ${id} AND ${schema.emailQueue.businessId} = ${businessId}`)
        .limit(1);
      return email;
    } catch (error) {
      console.error("Error fetching email queue item:", error);
      throw new Error("Failed to fetch email queue item");
    }
  }
  async getPendingEmails(businessId: string): Promise<EmailQueue[]> {
    try {
      return await db.select()
        .from(schema.emailQueue)
        .where(sql`${schema.emailQueue.businessId} = ${businessId} AND ${schema.emailQueue.status} = 'pending'`);
    } catch (error) {
      console.error("Error fetching pending emails:", error);
      throw new Error("Failed to fetch pending emails");
    }
  }
  async createEmailQueueItem(email: InsertEmailQueue): Promise<EmailQueue> {
    try {
      const [newEmail] = await db.insert(schema.emailQueue).values(email).returning();
      return newEmail;
    } catch (error) {
      console.error("Error creating email queue item:", error);
      throw new Error("Failed to create email queue item");
    }
  }
  async updateEmailQueueItem(id: string, businessId: string, email: Partial<InsertEmailQueue>): Promise<EmailQueue | undefined> {
    try {
      const [updated] = await db.update(schema.emailQueue)
        .set({ ...email, updatedAt: new Date() })
        .where(sql`${schema.emailQueue.id} = ${id} AND ${schema.emailQueue.businessId} = ${businessId}`)
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating email queue item:", error);
      throw new Error("Failed to update email queue item");
    }
  }
  async getEmailTemplate(id: string, businessId: string): Promise<EmailTemplate | undefined> {
    try {
      const [template] = await db.select()
        .from(schema.emailTemplates)
        .where(sql`${schema.emailTemplates.id} = ${id} AND ${schema.emailTemplates.businessId} = ${businessId}`)
        .limit(1);
      return template;
    } catch (error) {
      console.error("Error fetching email template:", error);
      throw new Error("Failed to fetch email template");
    }
  }
  async getEmailTemplatesByBusinessId(businessId: string): Promise<EmailTemplate[]> {
    try {
      return await db.select()
        .from(schema.emailTemplates)
        .where(eq(schema.emailTemplates.businessId, businessId));
    } catch (error) {
      console.error("Error fetching email templates by business ID:", error);
      throw new Error("Failed to fetch email templates");
    }
  }
  async getEmailTemplateByType(templateType: string, businessId: string): Promise<EmailTemplate | undefined> {
    try {
      const [template] = await db.select()
        .from(schema.emailTemplates)
        .where(sql`${schema.emailTemplates.businessId} = ${businessId} AND ${schema.emailTemplates.templateType} = ${templateType} AND ${schema.emailTemplates.isActive}`)
        .limit(1);
      return template;
    } catch (error) {
      console.error("Error fetching email template by type:", error);
      throw new Error("Failed to fetch email template");
    }
  }
  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    try {
      const [newTemplate] = await db.insert(schema.emailTemplates).values(template).returning();
      return newTemplate;
    } catch (error) {
      console.error("Error creating email template:", error);
      throw new Error("Failed to create email template");
    }
  }
  async updateEmailTemplate(id: string, businessId: string, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined> {
    try {
      const [updated] = await db.update(schema.emailTemplates)
        .set({ ...template, updatedAt: new Date() })
        .where(sql`${schema.emailTemplates.id} = ${id} AND ${schema.emailTemplates.businessId} = ${businessId}`)
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating email template:", error);
      throw new Error("Failed to update email template");
    }
  }
  async getActivityLog(id: string, businessId: string): Promise<ActivityLog | undefined> {
    try {
      const [log] = await db.select()
        .from(schema.activityLog)
        .where(sql`${schema.activityLog.id} = ${id} AND ${schema.activityLog.businessId} = ${businessId}`)
        .limit(1);
      return log;
    } catch (error) {
      console.error("Error fetching activity log:", error);
      throw new Error("Failed to fetch activity log");
    }
  }
  async getActivityLogsByBusinessId(businessId: string, limit?: number): Promise<ActivityLog[]> {
    try {
      const query = db.select()
        .from(schema.activityLog)
        .where(eq(schema.activityLog.businessId, businessId))
        .orderBy(sql`${schema.activityLog.createdAt} DESC`);
      if (limit) {
        query.limit(limit);
      }
      return await query;
    } catch (error) {
      console.error("Error fetching activity logs by business ID:", error);
      throw new Error("Failed to fetch activity logs");
    }
  }
  async getActivityLogsByEntity(entityType: string, entityId: string, businessId: string): Promise<ActivityLog[]> {
    try {
      return await db.select()
        .from(schema.activityLog)
        .where(sql`${schema.activityLog.businessId} = ${businessId} AND ${schema.activityLog.entityType} = ${entityType} AND ${schema.activityLog.entityId} = ${entityId}`)
        .orderBy(sql`${schema.activityLog.createdAt} DESC`);
    } catch (error) {
      console.error("Error fetching activity logs by entity:", error);
      throw new Error("Failed to fetch activity logs");
    }
  }
  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    try {
      const [newLog] = await db.insert(schema.activityLog).values({
        ...log,
        contactId: log.contactId || null,
      }).returning();
      return newLog;
    } catch (error) {
      console.error("Error creating activity log:", error);
      throw new Error("Failed to create activity log");
    }
  }
  async getPaymentTransaction(id: string, businessId: string): Promise<PaymentTransaction | undefined> {
    try {
      const [transaction] = await db.select()
        .from(schema.paymentTransactions)
        .where(sql`${schema.paymentTransactions.id} = ${id} AND ${schema.paymentTransactions.businessId} = ${businessId}`)
        .limit(1);
      return transaction;
    } catch (error) {
      console.error("Error fetching payment transaction:", error);
      throw new Error("Failed to fetch payment transaction");
    }
  }
  async getPaymentTransactionsByInvoice(invoiceId: string, businessId: string): Promise<PaymentTransaction[]> {
    try {
      return await db.select()
        .from(schema.paymentTransactions)
        .where(sql`${schema.paymentTransactions.businessId} = ${businessId} AND ${schema.paymentTransactions.invoiceId} = ${invoiceId}`);
    } catch (error) {
      console.error("Error fetching payment transactions by invoice:", error);
      throw new Error("Failed to fetch payment transactions");
    }
  }
  async getPaymentTransactionsByBusinessId(businessId: string): Promise<PaymentTransaction[]> {
    try {
      return await db.select()
        .from(schema.paymentTransactions)
        .where(eq(schema.paymentTransactions.businessId, businessId));
    } catch (error) {
      console.error("Error fetching payment transactions by business ID:", error);
      throw new Error("Failed to fetch payment transactions");
    }
  }
  async createPaymentTransaction(transaction: InsertPaymentTransaction): Promise<PaymentTransaction> {
    try {
      const [newTransaction] = await db.insert(schema.paymentTransactions).values(transaction).returning();
      return newTransaction;
    } catch (error) {
      console.error("Error creating payment transaction:", error);
      throw new Error("Failed to create payment transaction");
    }
  }
  async updatePaymentTransaction(id: string, businessId: string, transaction: Partial<InsertPaymentTransaction>): Promise<PaymentTransaction | undefined> {
    try {
      const [updated] = await db.update(schema.paymentTransactions)
        .set(transaction)
        .where(sql`${schema.paymentTransactions.id} = ${id} AND ${schema.paymentTransactions.businessId} = ${businessId}`)
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating payment transaction:", error);
      throw new Error("Failed to update payment transaction");
    }
  }
  async getServiceArea(id: string, businessId: string): Promise<ServiceArea | undefined> {
    try {
      const [area] = await db.select()
        .from(schema.serviceAreas)
        .where(sql`${schema.serviceAreas.id} = ${id} AND ${schema.serviceAreas.businessId} = ${businessId}`)
        .limit(1);
      return area;
    } catch (error) {
      console.error("Error fetching service area:", error);
      throw new Error("Failed to fetch service area");
    }
  }
  async getServiceAreasByBusinessId(businessId: string): Promise<ServiceArea[]> {
    try {
      return await db.select()
        .from(schema.serviceAreas)
        .where(eq(schema.serviceAreas.businessId, businessId));
    } catch (error) {
      console.error("Error fetching service areas by business ID:", error);
      throw new Error("Failed to fetch service areas");
    }
  }
  async createServiceArea(area: InsertServiceArea): Promise<ServiceArea> {
    try {
      const [newArea] = await db.insert(schema.serviceAreas).values(area).returning();
      return newArea;
    } catch (error) {
      console.error("Error creating service area:", error);
      throw new Error("Failed to create service area");
    }
  }
  async updateServiceArea(id: string, businessId: string, area: Partial<InsertServiceArea>): Promise<ServiceArea | undefined> {
    try {
      const [updated] = await db.update(schema.serviceAreas)
        .set({ ...area, updatedAt: new Date() })
        .where(sql`${schema.serviceAreas.id} = ${id} AND ${schema.serviceAreas.businessId} = ${businessId}`)
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating service area:", error);
      throw new Error("Failed to update service area");
    }
  }
  async getBusinessHours(id: string, businessId: string): Promise<BusinessHours | undefined> {
    try {
      const [hours] = await db.select()
        .from(schema.businessHours)
        .where(sql`${schema.businessHours.id} = ${id} AND ${schema.businessHours.businessId} = ${businessId}`)
        .limit(1);
      return hours;
    } catch (error) {
      console.error("Error fetching business hours:", error);
      throw new Error("Failed to fetch business hours");
    }
  }
  async getBusinessHoursByBusinessId(businessId: string): Promise<BusinessHours[]> {
    try {
      return await db.select()
        .from(schema.businessHours)
        .where(eq(schema.businessHours.businessId, businessId));
    } catch (error) {
      console.error("Error fetching business hours by business ID:", error);
      throw new Error("Failed to fetch business hours");
    }
  }
  async createBusinessHours(hours: InsertBusinessHours): Promise<BusinessHours> {
    try {
      const [newHours] = await db.insert(schema.businessHours).values(hours).returning();
      return newHours;
    } catch (error) {
      console.error("Error creating business hours:", error);
      throw new Error("Failed to create business hours");
    }
  }
  async updateBusinessHours(id: string, businessId: string, hours: Partial<InsertBusinessHours>): Promise<BusinessHours | undefined> {
    try {
      const [updated] = await db.update(schema.businessHours)
        .set({ ...hours, updatedAt: new Date() })
        .where(sql`${schema.businessHours.id} = ${id} AND ${schema.businessHours.businessId} = ${businessId}`)
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating business hours:", error);
      throw new Error("Failed to update business hours");
    }
  }
  async deleteBusinessHours(id: string, businessId: string): Promise<boolean> {
    try {
      const result = await db.delete(schema.businessHours)
        .where(and(
          eq(schema.businessHours.id, id),
          eq(schema.businessHours.businessId, businessId)
        ));
      return result.count > 0;
    } catch (error) {
      console.error("Error deleting business hours:", error);
      throw new Error("Failed to delete business hours");
    }
  }

  // Landing Page Content
  async getLandingPageContent(businessId: string): Promise<LandingPageContent[]> {
    try {
      return await db.select()
        .from(schema.landingPageContent)
        .where(eq(schema.landingPageContent.businessId, businessId))
        .orderBy(schema.landingPageContent.section, schema.landingPageContent.displayOrder);
    } catch (error) {
      console.error("Error fetching landing page content:", error);
      throw new Error("Failed to fetch landing page content");
    }
  }

  async getLandingPageContentBySection(businessId: string, section: string): Promise<LandingPageContent[]> {
    try {
      return await db.select()
        .from(schema.landingPageContent)
        .where(and(
          eq(schema.landingPageContent.businessId, businessId),
          eq(schema.landingPageContent.section, section)
        ))
        .orderBy(schema.landingPageContent.displayOrder);
    } catch (error) {
      console.error("Error fetching landing page content by section:", error);
      throw new Error("Failed to fetch landing page content");
    }
  }

  async createLandingPageContent(data: InsertLandingPageContent): Promise<LandingPageContent> {
    try {
      const [content] = await db.insert(schema.landingPageContent)
        .values(data)
        .returning();
      return content;
    } catch (error) {
      console.error("Error creating landing page content:", error);
      throw new Error("Failed to create landing page content");
    }
  }

  async updateLandingPageContent(id: string, businessId: string, data: Partial<InsertLandingPageContent>): Promise<LandingPageContent | undefined> {
    try {
      const [updated] = await db.update(schema.landingPageContent)
        .set({ ...data, updatedAt: new Date() })
        .where(and(
          eq(schema.landingPageContent.id, id),
          eq(schema.landingPageContent.businessId, businessId)
        ))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating landing page content:", error);
      throw new Error("Failed to update landing page content");
    }
  }

  async deleteLandingPageContent(id: string, businessId: string): Promise<void> {
    try {
      await db.delete(schema.landingPageContent)
        .where(and(
          eq(schema.landingPageContent.id, id),
          eq(schema.landingPageContent.businessId, businessId)
        ));
    } catch (error) {
      console.error("Error deleting landing page content:", error);
      throw new Error("Failed to delete landing page content");
    }
  }

  async createLandingPageFromTemplate(businessId: string, templateSections: any[]): Promise<LandingPageContent[]> {
    try {
      const results: LandingPageContent[] = [];
      for (const section of templateSections) {
        const created = await this.createLandingPageContent({
          businessId,
          section: section.section,
          elementKey: section.elementKey,
          contentType: section.contentType,
          value: section.value,
          altText: section.altText,
          url: section.url,
          displayOrder: section.displayOrder,
          isActive: section.isActive,
        });
        results.push(created);
      }
      return results;
    } catch (error) {
      console.error("Error creating landing page from template:", error);
      throw new Error("Failed to create landing page from template");
    }
  }

  // Phase 19A: AI Quote System Methods

  async getQuoteVersion(id: string): Promise<QuoteVersion | undefined> {
    try {
      const [version] = await db.select()
        .from(schema.quoteVersions)
        .where(eq(schema.quoteVersions.id, id))
        .limit(1);
      return version;
    } catch (error) {
      console.error("Error fetching quote version:", error);
      throw new Error("Failed to fetch quote version");
    }
  }

  async getQuoteVersionsByQuoteId(quoteId: string): Promise<QuoteVersion[]> {
    try {
      return await db.select()
        .from(schema.quoteVersions)
        .where(eq(schema.quoteVersions.quoteId, quoteId))
        .orderBy(schema.quoteVersions.versionNumber);
    } catch (error) {
      console.error("Error fetching quote versions:", error);
      throw new Error("Failed to fetch quote versions");
    }
  }

  async createQuoteVersion(version: InsertQuoteVersion): Promise<QuoteVersion> {
    try {
      const [newVersion] = await db.insert(schema.quoteVersions)
        .values(version)
        .returning();
      return newVersion;
    } catch (error) {
      console.error("Error creating quote version:", error);
      throw new Error("Failed to create quote version");
    }
  }

  async getLatestQuoteVersion(quoteId: string): Promise<QuoteVersion | undefined> {
    try {
      const [version] = await db.select()
        .from(schema.quoteVersions)
        .where(eq(schema.quoteVersions.quoteId, quoteId))
        .orderBy(desc(schema.quoteVersions.versionNumber))
        .limit(1);
      return version;
    } catch (error) {
      console.error("Error fetching latest quote version:", error);
      throw new Error("Failed to fetch latest quote version");
    }
  }

  // Quote Version Items (Phase 19A)
  async getQuoteVersionItems(versionId: string): Promise<any[]> {
    const result = await db.execute(sql`
      SELECT * FROM quote_version_items 
      WHERE quote_version_id = ${versionId}
      ORDER BY display_order
    `);
    return result.rows;
  }

  async createQuoteVersionItem(data: {
    quoteVersionId: string;
    serviceId?: string;
    description: string;
    quantity: string;
    unitPrice: string;
    lineTotal: string;
    displayOrder?: number;
  }): Promise<any> {
    const result = await db.execute(sql`
      INSERT INTO quote_version_items (
        quote_version_id, service_id, description, quantity, unit_price, line_total, display_order
      ) VALUES (
        ${data.quoteVersionId}, ${data.serviceId || null}, ${data.description}, 
        ${data.quantity}, ${data.unitPrice}, ${data.lineTotal}, ${data.displayOrder || 0}
      )
      RETURNING *
    `);
    return result.rows[0];
  }

  async deleteQuoteVersionItems(versionId: string): Promise<void> {
    await db.execute(sql`
      DELETE FROM quote_version_items WHERE quote_version_id = ${versionId}
    `);
  }


  async getAiQuoteLearningEvent(id: string): Promise<AiQuoteLearningEvent | undefined> {
    try {
      const [event] = await db.select()
        .from(schema.aiQuoteLearningEvents)
        .where(eq(schema.aiQuoteLearningEvents.id, id))
        .limit(1);
      return event;
    } catch (error) {
      console.error("Error fetching AI learning event:", error);
      throw new Error("Failed to fetch AI learning event");
    }
  }

  async getAiQuoteLearningEventsByBusinessId(businessId: string, limit?: number): Promise<AiQuoteLearningEvent[]> {
    try {
      const query = db.select()
        .from(schema.aiQuoteLearningEvents)
        .where(eq(schema.aiQuoteLearningEvents.businessId, businessId))
        .orderBy(desc(schema.aiQuoteLearningEvents.createdAt));

      if (limit) {
        query.limit(limit);
      }

      return await query;
    } catch (error) {
      console.error("Error fetching AI learning events:", error);
      throw new Error("Failed to fetch AI learning events");
    }
  }

  async createAiQuoteLearningEvent(event: InsertAiQuoteLearningEvent): Promise<AiQuoteLearningEvent> {
    try {
      const [newEvent] = await db.insert(schema.aiQuoteLearningEvents)
        .values(event)
        .returning();
      return newEvent;
    } catch (error) {
      console.error("Error creating AI learning event:", error);
      throw new Error("Failed to create AI learning event");
    }
  }

  // WhatsApp Queue Methods
  async createWhatsAppQueueItem(data: InsertWhatsappQueue): Promise<any> {
    try {
      const [item] = await db.insert(schema.whatsappQueue)
        .values(data)
        .returning();
      return item;
    } catch (error) {
      console.error("Error creating WhatsApp queue item:", error);
      throw new Error("Failed to create WhatsApp queue item");
    }
  }

  async getPendingWhatsAppMessages(businessId: string): Promise<any[]> {
    try {
      return await db.select()
        .from(schema.whatsappQueue)
        .where(and(
          eq(schema.whatsappQueue.businessId, businessId),
          eq(schema.whatsappQueue.status, 'pending')
        ))
        .orderBy(schema.whatsappQueue.createdAt);
    } catch (error) {
      console.error("Error fetching pending WhatsApp messages:", error);
      throw new Error("Failed to fetch pending WhatsApp messages");
    }
  }

  async updateWhatsAppQueueItem(id: string, businessId: string, data: any): Promise<any> {
    try {
      const [updated] = await db.update(schema.whatsappQueue)
        .set({ ...data, updatedAt: new Date() })
        .where(and(
          eq(schema.whatsappQueue.id, id),
          eq(schema.whatsappQueue.businessId, businessId)
        ))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating WhatsApp queue item:", error);
      throw new Error("Failed to update WhatsApp queue item");
    }
  }

  async getWhatsAppQueueByProviderMessageId(providerMessageId: string): Promise<any> {
    try {
      const [item] = await db.select()
        .from(schema.whatsappQueue)
        .where(eq(schema.whatsappQueue.providerMessageId, providerMessageId))
        .limit(1);
      return item;
    } catch (error) {
      console.error("Error fetching WhatsApp queue by provider message ID:", error);
      throw new Error("Failed to fetch WhatsApp queue item");
    }
  }

  async getWhatsAppQueueStats(businessId: string): Promise<any> {
    try {
      const [stats] = await db.select({
        pending: sql<number>`COUNT(CASE WHEN ${schema.whatsappQueue.status} = 'pending' THEN 1 END)`,
        sent: sql<number>`COUNT(CASE WHEN ${schema.whatsappQueue.status} = 'sent' THEN 1 END)`,
        delivered: sql<number>`COUNT(CASE WHEN ${schema.whatsappQueue.status} = 'delivered' THEN 1 END)`,
        failed: sql<number>`COUNT(CASE WHEN ${schema.whatsappQueue.status} = 'failed' THEN 1 END)`,
      })
        .from(schema.whatsappQueue)
        .where(eq(schema.whatsappQueue.businessId, businessId));
      return stats || { pending: 0, sent: 0, delivered: 0, failed: 0 };
    } catch (error) {
      console.error("Error fetching WhatsApp queue stats:", error);
      throw new Error("Failed to fetch WhatsApp queue stats");
    }
  }

  // WhatsApp Templates
  async createWhatsappTemplate(data: any): Promise<any> {
    try {
      const [template] = await db.insert(schema.whatsappTemplates).values(data).returning();
      return template;
    } catch (error) {
      console.error("Error creating WhatsApp template:", error);
      throw new Error("Failed to create WhatsApp template");
    }
  }

  async getWhatsappTemplatesByBusinessId(businessId: string): Promise<any[]> {
    try {
      return await db.select()
        .from(schema.whatsappTemplates)
        .where(eq(schema.whatsappTemplates.businessId, businessId))
        .orderBy(desc(schema.whatsappTemplates.createdAt));
    } catch (error) {
      console.error("Error fetching WhatsApp templates:", error);
      throw new Error("Failed to fetch WhatsApp templates");
    }
  }

  async updateWhatsappTemplate(id: string, businessId: string, data: any): Promise<any> {
    try {
      const [updated] = await db.update(schema.whatsappTemplates)
        .set({ ...data, updatedAt: new Date() })
        .where(and(
          eq(schema.whatsappTemplates.id, id),
          eq(schema.whatsappTemplates.businessId, businessId)
        ))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating WhatsApp template:", error);
      throw new Error("Failed to update WhatsApp template");
    }
  }

  async getWhatsappQueueByBusinessId(businessId: string, limit: number = 50): Promise<any[]> {
    try {
      return await db.select()
        .from(schema.whatsappQueue)
        .where(eq(schema.whatsappQueue.businessId, businessId))
        .orderBy(desc(schema.whatsappQueue.createdAt))
        .limit(limit);
    } catch (error) {
      console.error("Error fetching WhatsApp queue:", error);
      throw new Error("Failed to fetch WhatsApp queue");
    }
  }

  async getWhatsappTemplateByName(templateName: string): Promise<WhatsappTemplate | undefined> {
    try {
      const [template] = await db
        .select()
        .from(schema.whatsappTemplates)
        .where(eq(schema.whatsappTemplates.templateName, templateName))
        .limit(1);
      return template;
    } catch (error) {
      console.error("Error fetching WhatsApp template by name:", error);
      throw new Error("Failed to fetch WhatsApp template");
    }
  }

  // Deposit Policies (Phase 2 - Deposit System)
  async getDepositPolicies(businessId: string): Promise<any[]> {
    try {
      return await db.select()
        .from(schema.depositPolicies)
        .where(eq(schema.depositPolicies.businessId, businessId))
        .orderBy(schema.depositPolicies.createdAt);
    } catch (error) {
      console.error("Error fetching deposit policies:", error);
      throw new Error("Failed to fetch deposit policies");
    }
  }

  async getDepositPolicy(id: string, businessId: string): Promise<any | undefined> {
    try {
      const [policy] = await db.select()
        .from(schema.depositPolicies)
        .where(and(
          eq(schema.depositPolicies.id, id),
          eq(schema.depositPolicies.businessId, businessId)
        ))
        .limit(1);
      return policy;
    } catch (error) {
      console.error("Error fetching deposit policy:", error);
      throw new Error("Failed to fetch deposit policy");
    }
  }

  async createDepositPolicy(data: any): Promise<any> {
    try {
      const [policy] = await db.insert(schema.depositPolicies).values(data).returning();
      return policy;
    } catch (error) {
      console.error("Error creating deposit policy:", error);
      throw new Error("Failed to create deposit policy");
    }
  }

  async updateDepositPolicy(id: string, businessId: string, data: any): Promise<any | undefined> {
    try {
      const [updated] = await db.update(schema.depositPolicies)
        .set({ ...data, updatedAt: new Date() })
        .where(and(
          eq(schema.depositPolicies.id, id),
          eq(schema.depositPolicies.businessId, businessId)
        ))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating deposit policy:", error);
      throw new Error("Failed to update deposit policy");
    }
  }

  async deleteDepositPolicy(id: string, businessId: string): Promise<boolean> {
    try {
      await db.delete(schema.depositPolicies)
        .where(and(
          eq(schema.depositPolicies.id, id),
          eq(schema.depositPolicies.businessId, businessId)
        ));
      return true;
    } catch (error) {
      console.error("Error deleting deposit policy:", error);
      throw new Error("Failed to delete deposit policy");
    }
  }

  async getDepositPolicyByService(businessId: string, serviceId: string): Promise<any | undefined> {
    try {
      const [policy] = await db.select()
        .from(schema.depositPolicies)
        .where(and(
          eq(schema.depositPolicies.businessId, businessId),
          eq(schema.depositPolicies.serviceId, serviceId),
          eq(schema.depositPolicies.isActive, true)
        ))
        .limit(1);
      return policy;
    } catch (error) {
      console.error("Error fetching deposit policy by service:", error);
      throw new Error("Failed to fetch deposit policy");
    }
  }

  // Activity Logger Helper
  async logActivity(data: any): Promise<any> {
    try {
      const [activity] = await db.insert(schema.activityLog)
        .values(data)
        .returning();
      return activity;
    } catch (error) {
      console.error("Error logging activity:", error);
      throw new Error("Failed to log activity");
    }
  }

  // Quote & Job Deposit Settings
  async updateQuoteDepositSettings(quoteId: string, businessId: string, data: any): Promise<any | undefined> {
    try {
      const [updated] = await db.update(schema.quotes)
        .set({ ...data, updatedAt: new Date() })
        .where(and(
          eq(schema.quotes.id, quoteId),
          eq(schema.quotes.businessId, businessId)
        ))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating quote deposit settings:", error);
      throw new Error("Failed to update quote deposit settings");
    }
  }

  async updateJobDepositStatus(jobId: string, businessId: string, data: any): Promise<any | undefined> {
    try {
      const [updated] = await db.update(schema.jobs)
        .set({ ...data, updatedAt: new Date() })
        .where(and(
          eq(schema.jobs.id, jobId),
          eq(schema.jobs.businessId, businessId)
        ))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating job deposit status:", error);
      throw new Error("Failed to update job deposit status");
    }
  }

  async getInvoicesByType(businessId: string, invoiceType: string): Promise<Invoice[]> {
    try {
      return await db.select()
        .from(schema.invoices)
        .where(and(
          eq(schema.invoices.businessId, businessId),
          eq(schema.invoices.invoiceType, invoiceType)
        ))
        .orderBy(desc(schema.invoices.createdAt));
    } catch (error) {
      console.error("Error fetching invoices by type:", error);
      throw new Error("Failed to fetch invoices");
    }
  }

  async getAllBusinesses(): Promise<Business[]> {
    try {
      return await db.select()
        .from(schema.businesses);
    } catch (error) {
      console.error("Error fetching all businesses:", error);
      throw new Error("Failed to fetch businesses");
    }
  }
}

export const storage = new DbStorage();