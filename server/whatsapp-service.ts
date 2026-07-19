
import { storage } from "./storage";
import type { Business, Contact } from "../shared/schema";

/**
 * WhatsApp Service Interface
 * Provider-agnostic abstraction for WhatsApp messaging
 */
export interface WhatsAppProvider {
  sendMessage(params: SendMessageParams): Promise<SendMessageResult>;
  formatPhoneNumber(phone: string): string;
}

// Export provider implementations
export { TwilioWhatsAppProvider } from './whatsapp-twilio';
export { WaSenderWhatsAppProvider, createWaSenderProvider } from './whatsapp-wasender';

export interface SendMessageParams {
  to: string;
  body: string;
  mediaUrl?: string;
  templateName?: string;
  templateParams?: Record<string, any>;
}

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Check if business has reached WhatsApp usage limit
 */
export async function checkWhatsAppLimit(businessId: string): Promise<{
  allowed: boolean;
  remaining: number;
  percentage: number;
  message?: string;
}> {
  const business = await storage.getBusiness(businessId);
  
  if (!business) {
    return { allowed: false, remaining: 0, percentage: 100, message: "Business not found" };
  }

  const currentUsage = business.whatsappCurrentUsage || 0;
  const monthlyLimit = business.whatsappMonthlyLimit || 1000;
  const remaining = monthlyLimit - currentUsage;
  const percentage = (currentUsage / monthlyLimit) * 100;

  // Check if limit reached
  if (remaining <= 0 && !business.whatsappOverageAllowed) {
    return { 
      allowed: false, 
      remaining: 0, 
      percentage: 100,
      message: `WhatsApp monthly limit of ${monthlyLimit} messages reached` 
    };
  }

  return { allowed: true, remaining, percentage };
}

/**
 * Increment WhatsApp usage counter
 */
export async function incrementWhatsAppUsage(
  businessId: string,
  count: number = 1
): Promise<void> {
  const business = await storage.getBusiness(businessId);
  
  if (!business) {
    throw new Error("Business not found");
  }

  const newUsage = (business.whatsappCurrentUsage || 0) + count;
  
  await storage.updateBusiness(businessId, {
    whatsappCurrentUsage: newUsage,
  });

  // Check for threshold alerts (80%, 90%, 100%)
  const monthlyLimit = business.whatsappMonthlyLimit || 1000;
  const percentage = (newUsage / monthlyLimit) * 100;

  if (percentage >= 80 && !business.whatsappLimitAlertSent) {
    // Send alert email (implement email notification)
    await storage.updateBusiness(businessId, {
      whatsappLimitAlertSent: true,
    });
    
    console.warn(`⚠️ Business ${businessId} has reached ${percentage.toFixed(0)}% of WhatsApp limit`);
  }
}

/**
 * Get cost per message for a provider
 */
export function getProviderCost(providerName: string): number {
  const costs: Record<string, number> = {
    'twilio': 0.40,      // R0.40 per message
    'wasender': 0.25,    // R0.25 per message (utility)
  };
  return costs[providerName] || 0.40;
}

/**
 * Get the appropriate WhatsApp provider for a business
 * Checks for active WaSender session first, falls back to Twilio
 */
export async function getWhatsAppProviderForBusiness(businessId: string): Promise<{
  provider: WhatsAppProvider;
  providerName: string;
  sessionId?: string;
}> {
  const { storage } = await import('./storage');
  const { TwilioWhatsAppProvider } = await import('./whatsapp-twilio');
  const { createWaSenderProvider } = await import('./whatsapp-wasender');
  
  const business = await storage.getBusiness(businessId);
  if (!business) {
    throw new Error('Business not found');
  }

  // Check if business has WaSender configured
  if (business.whatsappProvider === 'wasender' && business.whatsappWasenderApiKey) {
    // Check for active WaSender session
    const sessions = await storage.getWhatsAppSessionsByBusinessId(businessId);
    const activeSession = sessions.find(s => s.status === 'connected' && s.healthStatus === 'healthy');
    
    if (activeSession) {
      console.log(`✅ [Provider Selection] Using WaSender session: ${activeSession.sessionId}`);
      return {
        provider: createWaSenderProvider(business.whatsappWasenderApiKey),
        providerName: 'wasender',
        sessionId: activeSession.sessionId,
      };
    } else {
      console.warn(`⚠️ [Provider Selection] WaSender selected but no active session found, falling back to Twilio`);
    }
  }

  // Default to Twilio
  console.log('✅ [Provider Selection] Using Twilio provider');
  return {
    provider: new TwilioWhatsAppProvider(),
    providerName: 'twilio',
  };
}

/**
 * Queue a WhatsApp message for sending
 */
export async function queueWhatsAppMessage(params: {
  businessId: string;
  contactId?: string;
  toNumber: string;
  messageBody: string;
  mediaUrl?: string;
  templateName?: string;
  templateParams?: Record<string, any>;
  relatedType?: string;
  relatedId?: string;
}): Promise<any> {
  // Check usage limit first
  const limitCheck = await checkWhatsAppLimit(params.businessId);
  
  if (!limitCheck.allowed) {
    throw new Error(limitCheck.message || "WhatsApp usage limit reached");
  }

  // Get business to determine provider and cost
  const business = await storage.getBusiness(params.businessId);
  const providerName = business?.whatsappProvider || 'twilio';
  const cost = getProviderCost(providerName);

  // Create queue item
  return await storage.createWhatsAppQueueItem({
    businessId: params.businessId,
    contactId: params.contactId,
    toNumber: params.toNumber,
    messageBody: params.messageBody,
    mediaUrl: params.mediaUrl,
    templateName: params.templateName,
    templateParams: params.templateParams,
    status: 'pending',
    providerName: providerName,
    cost: cost.toFixed(2),
    relatedType: params.relatedType,
    relatedId: params.relatedId,
  });
}

/**
 * Format South African phone number to E.164 format
 */
export function formatSAPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Already in international format (starts with 27)
  if (cleaned.startsWith('27')) {
    return `+${cleaned}`;
  }
  
  // National format (starts with 0)
  if (cleaned.startsWith('0')) {
    return `+27${cleaned.substring(1)}`;
  }
  
  // Just 9 digits (missing leading 0)
  if (cleaned.length === 9) {
    return `+27${cleaned}`;
  }
  
  throw new Error(`Invalid SA phone number: ${phone}`);
}
