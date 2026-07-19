
import { storage } from "./storage";
import type { Business, Contact } from "../shared/schema";
import { checkWhatsAppLimit, queueWhatsAppMessage, formatSAPhoneNumber } from "./whatsapp-service";
import { processWhatsAppQueue } from "./whatsapp-queue";

/**
 * Reusable WhatsApp Notification Service
 * Handles all the complexity of multi-channel communication in one place
 */

export interface WhatsAppNotificationParams {
  business: Business;
  contact: Contact;
  messageBody: string;
  templateName?: string;
  templateParams?: Record<string, any>;
  relatedType?: string;
  relatedId?: string;
}

export interface WhatsAppNotificationResult {
  sent: boolean;
  channel: 'whatsapp' | 'skipped';
  reason?: string;
  error?: string;
}

/**
 * Send a WhatsApp notification with all the necessary checks
 * This is the ONE function to call for all WhatsApp messaging
 */
export async function sendWhatsAppNotification(
  params: WhatsAppNotificationParams
): Promise<WhatsAppNotificationResult> {
  const { business, contact, messageBody, templateName, relatedType, relatedId } = params;

  console.log(`\n📱 [WhatsApp Notification] Processing for ${contact.fullName}`);
  console.log(`   - Business: ${business.businessName}`);
  console.log(`   - Template: ${templateName || 'none'}`);
  console.log(`   - Phone: ${contact.phone || 'none'}`);
  console.log(`   - Opted in: ${contact.whatsappOptIn}`);
  console.log(`   - Preferred channel: ${contact.preferredChannel}`);

  // Check 1: Business has WhatsApp enabled
  if (!business.whatsappProvider) {
    console.log(`⚠️ [WhatsApp Notification] Business doesn't have WhatsApp provider configured`);
    return {
      sent: false,
      channel: 'skipped',
      reason: 'WhatsApp not configured for business'
    };
  }

  // Check 2: Contact has opted in
  if (!contact.whatsappOptIn) {
    console.log(`⚠️ [WhatsApp Notification] Contact hasn't opted in to WhatsApp`);
    return {
      sent: false,
      channel: 'skipped',
      reason: 'Contact not opted in to WhatsApp'
    };
  }

  // Check 3: Contact has phone number
  if (!contact.phone) {
    console.log(`⚠️ [WhatsApp Notification] Contact has no phone number`);
    return {
      sent: false,
      channel: 'skipped',
      reason: 'Contact has no phone number'
    };
  }

  // Check 4: Contact prefers WhatsApp or both
  if (contact.preferredChannel !== 'whatsapp' && contact.preferredChannel !== 'both') {
    console.log(`⚠️ [WhatsApp Notification] Contact prefers ${contact.preferredChannel}`);
    return {
      sent: false,
      channel: 'skipped',
      reason: `Contact prefers ${contact.preferredChannel}`
    };
  }

  // Check 5: Usage limit
  const limitCheck = await checkWhatsAppLimit(business.id);
  if (!limitCheck.allowed) {
    console.log(`⚠️ [WhatsApp Notification] Usage limit reached (${limitCheck.percentage.toFixed(0)}%)`);
    return {
      sent: false,
      channel: 'skipped',
      reason: `WhatsApp usage limit reached (${limitCheck.percentage.toFixed(0)}%)`
    };
  }

  // All checks passed - queue the message
  try {
    const formattedPhone = formatSAPhoneNumber(contact.phone);
    
    console.log(`✅ [WhatsApp Notification] All checks passed, queueing message`);
    console.log(`   - Formatted phone: ${formattedPhone}`);
    
    await queueWhatsAppMessage({
      businessId: business.id,
      contactId: contact.id,
      toNumber: formattedPhone,
      messageBody,
      templateName,
      templateParams: params.templateParams,
      relatedType,
      relatedId,
    });

    console.log(`✅ [WhatsApp Notification] Message queued successfully`);

    return {
      sent: true,
      channel: 'whatsapp'
    };
  } catch (error: any) {
    console.error(`❌ [WhatsApp Notification] Error queueing message:`, error.message);
    return {
      sent: false,
      channel: 'skipped',
      error: error.message
    };
  }
}

/**
 * Send WhatsApp notification and process queue immediately
 * Use this when you want instant delivery (e.g., user-triggered actions)
 */
export async function sendWhatsAppNotificationNow(
  params: WhatsAppNotificationParams
): Promise<WhatsAppNotificationResult> {
  const result = await sendWhatsAppNotification(params);

  if (result.sent) {
    console.log(`⚙️ [WhatsApp Notification] Processing queue immediately...`);
    try {
      await processWhatsAppQueue(params.business.id);
      console.log(`✅ [WhatsApp Notification] Queue processed`);
    } catch (error: any) {
      console.error(`❌ [WhatsApp Notification] Queue processing failed:`, error.message);
    }
  }

  return result;
}
