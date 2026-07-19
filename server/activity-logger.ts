import { storage } from "./storage";

interface LogActivityParams {
  businessId: string;
  contactId: string | null;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  changes?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    await storage.createActivityLog({
      businessId: params.businessId,
      contactId: params.contactId,
      userId: params.userId || null,
      action: params.action as any,
      entityType: params.entityType as any,
      entityId: params.entityId || null,
      changes: params.changes || null,
      ipAddress: params.ipAddress || null,
      userAgent: params.userAgent || null,
    });
  } catch (error) {
    // Log error but don't fail the main operation
    console.error('Failed to log activity:', error);
  }
}

// Helper functions for common activity types
export const ActivityLogger = {
  // Contact activities
  contactCreated: (businessId: string, contactId: string) =>
    logActivity({
      businessId,
      contactId,
      action: 'create',
      entityType: 'contact',
      entityId: contactId,
    }),

  // Quote activities
  quoteRequested: (businessId: string, quoteId: string, contactId: string, metadata: Record<string, any>, ipAddress?: string) =>
    logActivity({
      businessId,
      contactId,
      action: 'quote_requested',
      entityType: 'quote',
      entityId: quoteId,
      changes: metadata,
      ipAddress,
    }),

  quoteSent: (businessId: string, quoteId: string, contactId: string, channel: string) =>
    logActivity({
      businessId,
      contactId,
      action: 'quote_sent',
      entityType: 'quote',
      entityId: quoteId,
      changes: { channel },
    }),

  quoteViewed: (businessId: string, quoteId: string, contactId: string, ipAddress?: string) =>
    logActivity({
      businessId,
      contactId,
      action: 'quote_viewed',
      entityType: 'quote',
      entityId: quoteId,
      ipAddress,
    }),

  quoteAccepted: (businessId: string, quoteId: string, contactId: string, ipAddress?: string) =>
    logActivity({
      businessId,
      contactId,
      action: 'quote_accepted',
      entityType: 'quote',
      entityId: quoteId,
      ipAddress,
    }),

  quoteDeclined: (businessId: string, quoteId: string, contactId: string, reason: string, ipAddress?: string) =>
    logActivity({
      businessId,
      contactId,
      action: 'quote_declined',
      entityType: 'quote',
      entityId: quoteId,
      changes: { reason },
      ipAddress,
    }),

  // Booking activities
  bookingRequested: (businessId: string, jobId: string, contactId: string, metadata: Record<string, any>, ipAddress?: string) =>
    logActivity({
      businessId,
      contactId,
      action: 'booking_requested',
      entityType: 'job',
      entityId: jobId,
      changes: metadata,
      ipAddress,
    }),

  bookingRescheduled: (businessId: string, jobId: string, contactId: string, metadata: Record<string, any>, ipAddress?: string) =>
    logActivity({
      businessId,
      contactId,
      action: 'booking_rescheduled',
      entityType: 'job',
      entityId: jobId,
      changes: metadata,
      ipAddress,
    }),

  // Communication activities
  emailSent: (businessId: string, entityType: string, entityId: string, contactId: string, toEmail: string) =>
    logActivity({
      businessId,
      action: 'email_sent',
      entityType,
      entityId,
      contactId,
      changes: { toEmail },
    }),

  whatsappSent: (businessId: string, entityType: string, entityId: string, contactId: string, toNumber: string) =>
    logActivity({
      businessId,
      contactId,
      action: 'whatsapp_sent',
      entityType,
      entityId,
      changes: { toNumber },
    }),

  whatsappDelivered: (businessId: string, entityType: string, entityId: string, contactId: string) =>
    logActivity({
      businessId,
      contactId,
      action: 'whatsapp_delivered',
      entityType,
      entityId,
    }),

  whatsappRead: (businessId: string, entityType: string, entityId: string, contactId: string) =>
    logActivity({
      businessId,
      contactId,
      action: 'whatsapp_read',
      entityType,
      entityId,
    }),

  // Job activities
  jobStarted: (businessId: string, jobId: string, contactId: string, metadata: Record<string, any>) =>
    logActivity({
      businessId,
      contactId,
      action: 'job_started',
      entityType: 'job',
      entityId: jobId,
      changes: metadata,
    }),

  jobCompleted: (businessId: string, jobId: string, contactId: string, metadata: Record<string, any>) =>
    logActivity({
      businessId,
      contactId,
      action: 'job_completed',
      entityType: 'job',
      entityId: jobId,
      changes: metadata,
    }),

  // Invoice activities
  invoiceSent: (businessId: string, invoiceId: string, contactId: string, channel: string) =>
    logActivity({
      businessId,
      contactId,
      action: 'invoice_sent',
      entityType: 'invoice',
      entityId: invoiceId,
      changes: { channel },
    }),

  invoiceViewed: (businessId: string, invoiceId: string, contactId: string, ipAddress?: string) =>
    logActivity({
      businessId,
      contactId,
      action: 'invoice_viewed',
      entityType: 'invoice',
      entityId: invoiceId,
      ipAddress,
    }),

  // Deposit Payment activities
  depositPaid: (businessId: string, jobId: string, contactId: string, depositAmount: number, ipAddress?: string) =>
    logActivity({
      businessId,
      contactId,
      action: "payment_received",
      entityType: "job",
      entityId: jobId,
      changes: {
        depositAmount,
        paymentType: "deposit",
      },
      ipAddress,
    }),

  // Generic log method for cases where contactId is optional
  log: (params: {
    businessId: string;
    userId?: string;
    contactId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    changes?: Record<string, any>;
    ipAddress?: string;
  }) =>
    logActivity({
      businessId: params.businessId,
      contactId: params.contactId || null,
      userId: params.userId || null,
      action: params.action as any,
      entityType: params.entityType as any,
      entityId: params.entityId || null,
      changes: params.changes || null,
      ipAddress: params.ipAddress || null,
      userAgent: null,
    }),
};
