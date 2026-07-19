/**
 * WaSender WhatsApp Session Management Service
 * Handles QR code generation, session monitoring, and connection management
 * API Documentation: https://wasenderapi.com/docs
 */

interface CreateSessionResponse {
  success: boolean;
  sessionId?: string;
  error?: string;
}

interface QRCodeResponse {
  success: boolean;
  qrCode?: string; // Base64 data URL
  expiresIn?: number; // Seconds until expiration
  error?: string;
}

interface SessionStatusResponse {
  success: boolean;
  status?: 'disconnected' | 'connecting' | 'connected' | 'expired' | 'error';
  whatsappNumber?: string;
  whatsappName?: string;
  profilePictureUrl?: string;
  deviceInfo?: any;
  error?: string;
}

import { EncryptionService } from './encryption';

export class WaSenderSessionService {
  private apiKey: string;
  private personalAccessToken: string;
  private baseUrl: string = 'https://wasenderapi.com/api';

  constructor(apiKey: string, personalAccessToken?: string) {
    if (!apiKey) {
      throw new Error('WaSender API key is required');
    }
    this.apiKey = apiKey;

    // Use provided PAT or fall back to environment variable
    this.personalAccessToken = personalAccessToken || process.env.WASENDER_PERSONAL_ACCESS_TOKEN || '';

    if (!this.personalAccessToken) {
      console.warn('⚠️ [WaSender] No Personal Access Token provided. Session management may fail.');
    }
  }

  /**
   * Encrypt session token before storing
   */
  static encryptSessionToken(token: string, businessId: string): string {
    return EncryptionService.encrypt(token, businessId);
  }

  /**
   * Decrypt session token for API calls
   */
  static decryptSessionToken(encryptedToken: string, businessId: string): string {
    return EncryptionService.decrypt(encryptedToken, businessId);
  }

  /**
   * Step 1: Create a new WhatsApp session
   * POST /whatsapp-sessions
   */
  async createSession(sessionName: string, phoneNumber: string): Promise<CreateSessionResponse> {
    try {
      console.log(`🔧 [WaSender] Creating session: ${sessionName} with phone: ${phoneNumber}`);

      const requestBody = {
        name: sessionName,
        phone_number: phoneNumber,
        account_protection: false, // Disable account protection for easier setup
        log_messages: true // Enable message logging for debugging
      };

      console.log(`📋 [WaSender] Request body:`, JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${this.baseUrl}/whatsapp-sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.personalAccessToken}`,
        },
        body: JSON.stringify(requestBody),
      });

      const responseData = await response.json();
      console.log(`📦 [WaSender] Full API Response:`, JSON.stringify(responseData, null, 2));

      if (!response.ok) {
        console.error('❌ [WaSender] Create session error:', responseData);
        return {
          success: false,
          error: responseData.message || responseData.error || 'Failed to create session',
        };
      }

      // WaSender returns nested structure: { data: { id: ..., name: ..., ... } }
      const sessionData = responseData.data || responseData;
      console.log(`🔍 [WaSender] Extracted sessionData:`, JSON.stringify(sessionData, null, 2));
      
      const sessionId = sessionData.id;
      console.log(`🆔 [WaSender] Extracted sessionId:`, sessionId, `(type: ${typeof sessionId})`);

      if (!sessionId) {
        console.error('❌ [WaSender] No session ID in response:', responseData);
        return {
          success: false,
          error: 'No session ID returned from WaSender',
        };
      }

      const sessionIdString = String(sessionId);
      console.log(`✅ [WaSender] Session created successfully`);
      console.log(`   - Session Name: ${sessionName}`);
      console.log(`   - Session ID: ${sessionIdString}`);
      console.log(`   - Phone: ${phoneNumber}`);
      
      return {
        success: true,
        sessionId: sessionIdString,
      };
    } catch (error: any) {
      console.error('❌ [WaSender] Create session exception:', error);
      return {
        success: false,
        error: error.message || 'Failed to create session',
      };
    }
  }

  /**
   * Step 2: Start connection and trigger QR code generation
   * POST /whatsapp-sessions/:whatsappSession/connect
   */
  async startConnection(sessionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🔧 [WaSender] Starting connection...`);
      console.log(`   - sessionId parameter received: "${sessionId}" (type: ${typeof sessionId})`);
      console.log(`   - API URL will be: ${this.baseUrl}/whatsapp-sessions/${sessionId}/connect`);

      const response = await fetch(`${this.baseUrl}/whatsapp-sessions/${sessionId}/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.personalAccessToken}`,
        },
      });

      console.log(`📡 [WaSender] Response status: ${response.status}`);
      const data = await response.json();
      console.log(`📦 [WaSender] Response data:`, JSON.stringify(data, null, 2));

      if (!response.ok) {
        console.error('❌ [WaSender] Start connection error:', data);
        console.error('   - This usually means the sessionId is wrong or session does not exist');
        console.error(`   - We tried to connect using: "${sessionId}"`);
        return {
          success: false,
          error: data.message || data.error || 'Failed to start connection',
        };
      }

      console.log(`✅ [WaSender] Connection started successfully for session: ${sessionId}`);
      return { success: true };
    } catch (error: any) {
      console.error('❌ [WaSender] Start connection exception:', error);
      return {
        success: false,
        error: error.message || 'Failed to start connection',
      };
    }
  }

  /**
   * Step 3: Get QR code for scanning
   * GET /whatsapp-sessions/:whatsappSession/qrcode
   */
  async getQRCode(sessionId: string): Promise<QRCodeResponse> {
    try {
      console.log(`🔧 [WaSender] Getting QR code for session: ${sessionId}`);

      const response = await fetch(`${this.baseUrl}/whatsapp-sessions/${sessionId}/qrcode`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.personalAccessToken}`,
        },
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('❌ [WaSender] Get QR code error:', responseData);
        return {
          success: false,
          error: responseData.message || responseData.error || 'Failed to get QR code',
        };
      }

      // WaSender may return nested data
      const data = responseData.data || responseData;

      console.log(`✅ [WaSender] QR code retrieved for session: ${sessionId}`);
      return {
        success: true,
        qrCode: data.qrCode || data.qr || data.code, // Try different possible field names
        expiresIn: data.expiresIn || 60, // Default 60 seconds
      };
    } catch (error: any) {
      console.error('❌ [WaSender] Get QR code exception:', error);
      return {
        success: false,
        error: error.message || 'Failed to get QR code',
      };
    }
  }

  /**
   * Step 4: Check session status
   * GET /whatsapp-sessions/:whatsappSession
   */
  async getSessionStatus(sessionId: string): Promise<SessionStatusResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/whatsapp-sessions/${sessionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.personalAccessToken}`,
        },
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('❌ [WaSender] Get session status error:', responseData);
        return {
          success: false,
          error: responseData.message || responseData.error || 'Failed to get session status',
        };
      }

      // WaSender may return nested data
      const data = responseData.data || responseData;

      return {
        success: true,
        status: data.status,
        whatsappNumber: data.whatsappNumber || data.phone,
        whatsappName: data.whatsappName || data.name,
        profilePictureUrl: data.profilePictureUrl || data.profilePicture,
        deviceInfo: data.deviceInfo || data.device,
      };
    } catch (error: any) {
      console.error('❌ [WaSender] Get session status exception:', error);
      return {
        success: false,
        error: error.message || 'Failed to get session status',
      };
    }
  }

  /**
   * Disconnect session
   * POST /whatsapp-sessions/:whatsappSession/disconnect
   */
  async disconnectSession(sessionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🔧 [WaSender] Disconnecting session: ${sessionId}`);

      const response = await fetch(`${this.baseUrl}/whatsapp-sessions/${sessionId}/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.personalAccessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ [WaSender] Disconnect session error:', data);
        return {
          success: false,
          error: data.message || data.error || 'Failed to disconnect session',
        };
      }

      console.log(`✅ [WaSender] Session disconnected: ${sessionId}`);
      return { success: true };
    } catch (error: any) {
      console.error('❌ [WaSender] Disconnect session exception:', error);
      return {
        success: false,
        error: error.message || 'Failed to disconnect session',
      };
    }
  }
}

// Export factory function
export function createWaSenderSessionService(apiKey: string): WaSenderSessionService {
  return new WaSenderSessionService(apiKey);
}