
/**
 * WhatsApp Consent Management
 * Handles user consent for WhatsApp messaging (POPIA compliance)
 */

import { storage } from './storage';

export interface ConsentData {
  businessId: string;
  contactId?: string;
  sessionId?: string;
  consentType: 'session_setup' | 'message_opt_in' | 'message_opt_out';
  consentText: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * WhatsApp Terms of Service
 */
export const WHATSAPP_TERMS_OF_SERVICE = `
**WhatsApp Business Messaging Terms**

By connecting your WhatsApp account, you agree to:

1. **Account Usage**: Use this connection solely for business communication with customers who have opted in to receive messages.

2. **Compliance**: Follow WhatsApp's Business Policy and South African POPIA regulations.

3. **Message Limits**: Respect daily message limits (1000 messages/day for new accounts, scaling up to 100,000/day).

4. **Customer Consent**: Only send messages to customers who have explicitly opted in to WhatsApp communication.

5. **Opt-Out Rights**: Honor all opt-out requests immediately by replying STOP.

6. **Data Protection**: Keep customer data secure and not share it with unauthorized parties.

7. **Prohibited Content**: Never send spam, promotional messages to non-consenting users, or violate WhatsApp's policies.

**Violations may result in account suspension by WhatsApp/Meta.**

By scanning the QR code, you confirm you have read and agree to these terms.
`;

/**
 * Customer opt-in consent text
 */
export const CUSTOMER_OPT_IN_TEXT = `
I consent to receive business updates, quotes, invoices, and appointment reminders via WhatsApp from this business. I understand I can opt out anytime by replying STOP.
`;

export class ConsentManager {
  /**
   * Record consent for session setup
   */
  static async recordSessionSetupConsent(data: ConsentData): Promise<void> {
    await storage.createActivityLog({
      businessId: data.businessId,
      action: 'whatsapp_consent_given',
      entityType: 'business',
      entityId: data.businessId,
      changes: {
        consentType: data.consentType,
        consentText: data.consentText,
        timestamp: new Date().toISOString(),
      },
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    });
  }

  /**
   * Record customer opt-in
   */
  static async recordCustomerOptIn(
    businessId: string,
    contactId: string,
    ipAddress?: string
  ): Promise<void> {
    await storage.updateContact(contactId, businessId, {
      whatsappOptIn: true,
      whatsappOptInDate: new Date(),
      whatsappOptOutDate: null,
    });

    await storage.createActivityLog({
      businessId,
      contactId,
      action: 'whatsapp_opt_in',
      entityType: 'contact',
      entityId: contactId,
      changes: {
        optInDate: new Date().toISOString(),
        consentText: CUSTOMER_OPT_IN_TEXT,
      },
      ipAddress,
    });
  }

  /**
   * Record customer opt-out
   */
  static async recordCustomerOptOut(
    businessId: string,
    contactId: string,
    reason?: string
  ): Promise<void> {
    await storage.updateContact(contactId, businessId, {
      whatsappOptIn: false,
      whatsappOptOutDate: new Date(),
    });

    await storage.createActivityLog({
      businessId,
      contactId,
      action: 'whatsapp_opt_out',
      entityType: 'contact',
      entityId: contactId,
      changes: {
        optOutDate: new Date().toISOString(),
        reason: reason || 'User request',
      },
    });
  }

  /**
   * Check if contact has valid consent
   */
  static async hasValidConsent(
    businessId: string,
    contactId: string
  ): Promise<boolean> {
    const contact = await storage.getContact(contactId, businessId);
    return contact?.whatsappOptIn === true;
  }

  /**
   * Get consent status for contact
   */
  static async getConsentStatus(businessId: string, contactId: string): Promise<{
    hasConsent: boolean;
    optInDate?: Date;
    optOutDate?: Date;
  }> {
    const contact = await storage.getContact(contactId, businessId);
    
    return {
      hasConsent: contact?.whatsappOptIn === true,
      optInDate: contact?.whatsappOptInDate || undefined,
      optOutDate: contact?.whatsappOptOutDate || undefined,
    };
  }
}
