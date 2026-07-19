
import type { WhatsAppProvider, SendMessageParams, SendMessageResult } from './whatsapp-service';
import { formatSAPhoneNumber } from './whatsapp-service';

/**
 * WaSender WhatsApp Provider Implementation
 * API Documentation: https://wasenderapi.com/docs
 */
export class WaSenderWhatsAppProvider implements WhatsAppProvider {
  private apiKey: string;
  private apiUrl: string = 'https://www.wasenderapi.com/api/send-message';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('WaSender API key is required');
    }
    this.apiKey = apiKey;
    console.log('✅ WaSender WhatsApp provider initialized');
    console.log(`🔧 [WaSender] Using endpoint: ${this.apiUrl}`);
  }

  /**
   * Send WhatsApp message via WaSender API
   */
  async sendMessage(params: SendMessageParams): Promise<SendMessageResult> {
    try {
      // Format phone number for WaSender (no whatsapp: prefix, just 27XXXXXXXXX)
      const formattedNumber = this.formatPhoneNumber(params.to);
      
      console.log(`📤 [WaSender] Sending message to ${formattedNumber}`);

      // Build request body with correct WaSender field names
      const requestBody: any = {
        to: formattedNumber,        // ✅ Correct: 'to' not 'phone'
        text: params.body,           // ✅ Correct: 'text' not 'message'
      };

      // Add media URL if provided
      if (params.mediaUrl) {
        requestBody.image_url = params.mediaUrl;  // WaSender uses image_url, video_url, etc.
      }

      console.log(`📋 [WaSender] Request body:`, JSON.stringify(requestBody, null, 2));

      // Make API request
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      const responseData = await response.json();

      // Check for success
      if (!response.ok) {
        console.error('❌ [WaSender] API error:', responseData);
        return {
          success: false,
          error: responseData.message || responseData.error || 'WaSender API request failed',
        };
      }

      // WaSender returns { success: true, data: { msgId: ..., jid: ..., status: ... } }
      if (responseData.success && responseData.data) {
        console.log(`✅ [WaSender] Message sent: ${responseData.data.msgId} to ${formattedNumber}`);
        return {
          success: true,
          messageId: responseData.data.msgId,
        };
      } else {
        console.error('❌ [WaSender] Failed response:', responseData);
        return {
          success: false,
          error: responseData.message || responseData.error || 'Unknown WaSender error',
        };
      }
    } catch (error: any) {
      console.error('❌ [WaSender] Exception:', error);
      return {
        success: false,
        error: error.message || 'Failed to send WhatsApp message via WaSender',
      };
    }
  }

  /**
   * Format phone number for WaSender
   * WaSender expects: +27XXXXXXXXX (E.164 format with + prefix)
   */
  formatPhoneNumber(phone: string): string {
    // Use the shared SA phone formatter which returns E.164 format (+27XXXXXXXXX)
    return formatSAPhoneNumber(phone); // Returns +27XXXXXXXXX
  }
}

// Export factory function to create provider with API key
export function createWaSenderProvider(apiKey: string): WaSenderWhatsAppProvider {
  return new WaSenderWhatsAppProvider(apiKey);
}
