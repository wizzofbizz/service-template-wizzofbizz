
import twilio from 'twilio';
import type { WhatsAppProvider, SendMessageParams, SendMessageResult } from './whatsapp-service';
import { formatSAPhoneNumber } from './whatsapp-service';
import { storage } from './storage';

/**
 * Twilio WhatsApp Provider Implementation
 */
export class TwilioWhatsAppProvider implements WhatsAppProvider {
  private client: any;
  private whatsappNumber: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

    if (!accountSid || !authToken) {
      console.warn('⚠️ Twilio credentials not configured. WhatsApp messaging will not work.');
      console.warn('   Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables.');
    } else {
      this.client = twilio(accountSid, authToken);
      console.log('✅ Twilio WhatsApp provider initialized');
    }
  }

  /**
   * Send WhatsApp message via Twilio
   */
  async sendMessage(params: SendMessageParams): Promise<SendMessageResult> {
    if (!this.client) {
      return {
        success: false,
        error: 'Twilio not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.',
      };
    }

    try {
      // Format phone number
      const formattedNumber = this.formatPhoneNumber(params.to);

      // Check if we have an approved template SID for this template
      let templateSid: string | undefined;
      if (params.templateName) {
        const envKey = `TWILIO_TEMPLATE_${params.templateName.toUpperCase()}`;
        templateSid = process.env[envKey];
      }

      let message;

      if (templateSid && params.templateParams) {
        // Production: Use approved Twilio Content Template
        console.log(`📋 Using approved template: ${templateSid}`);
        
        // Build ContentVariables object (Twilio expects {"1": "value1", "2": "value2"})
        const contentVariables: Record<string, string> = {};
        Object.values(params.templateParams).forEach((value, index) => {
          contentVariables[(index + 1).toString()] = String(value);
        });

        message = await this.client.messages.create({
          from: this.whatsappNumber,
          to: `whatsapp:${formattedNumber}`,
          contentSid: templateSid,
          contentVariables: JSON.stringify(contentVariables),
        });

        console.log(`✅ WhatsApp sent via template: ${message.sid} to ${formattedNumber}`);
      } else {
        // Development/Fallback: Send plain text (works in Twilio sandbox)
        console.log(`📝 Sending plain text (sandbox mode)`);
        
        message = await this.client.messages.create({
          from: this.whatsappNumber,
          to: `whatsapp:${formattedNumber}`,
          body: params.body,
          mediaUrl: params.mediaUrl ? [params.mediaUrl] : undefined,
        });

        console.log(`✅ WhatsApp sent via Twilio: ${message.sid} to ${formattedNumber}`);
      }

      return {
        success: true,
        messageId: message.sid,
      };
    } catch (error: any) {
      console.error('❌ Twilio WhatsApp error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send WhatsApp message',
      };
    }
  }

  /**
   * Format phone number for Twilio (E.164 format)
   */
  formatPhoneNumber(phone: string): string {
    return formatSAPhoneNumber(phone);
  }
}

// Export singleton instance
export const twilioProvider = new TwilioWhatsAppProvider();
