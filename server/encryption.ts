
import crypto from 'crypto';

/**
 * Encryption Service for WhatsApp Session Tokens
 * Uses AES-256-GCM encryption with business-specific keys
 */

// Master encryption key from environment (32 bytes, hex-encoded).
//
// A random fallback key CANNOT be used here: it changes on every restart, which
// silently renders every previously-encrypted value permanently undecryptable.
// So we fail fast in production, and warn loudly in development.
//
// Generate one with:
//   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
function resolveMasterKey(): string {
  const fromEnv = process.env.ENCRYPTION_MASTER_KEY;

  if (fromEnv) return fromEnv;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'ENCRYPTION_MASTER_KEY is required in production. Without a stable key, ' +
      'encrypted data (WhatsApp session tokens, provider API keys) becomes ' +
      'permanently unreadable after a restart. Generate one with: ' +
      'node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }

  console.warn(
    '⚠️  ENCRYPTION_MASTER_KEY is not set. Using an ephemeral development key — ' +
    'anything encrypted now will NOT be decryptable after this process restarts. ' +
    'Set ENCRYPTION_MASTER_KEY in your .env to persist encrypted data.'
  );
  return crypto.randomBytes(32).toString('hex');
}

const MASTER_KEY = resolveMasterKey();

export class EncryptionService {
  /**
   * Generate a business-specific encryption key
   */
  static generateBusinessKey(businessId: string): Buffer {
    // Derive a unique key for each business using PBKDF2
    const salt = Buffer.from(businessId, 'utf-8');
    return crypto.pbkdf2Sync(MASTER_KEY, salt, 100000, 32, 'sha256');
  }

  /**
   * Encrypt sensitive data (e.g., session tokens, API keys)
   */
  static encrypt(plaintext: string, businessId: string): string {
    try {
      const key = this.generateBusinessKey(businessId);
      const iv = crypto.randomBytes(16); // Initialization vector
      
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
      
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      // Format: iv:authTag:encrypted
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
      console.error('❌ Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   */
  static decrypt(encryptedData: string, businessId: string): string {
    try {
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const [ivHex, authTagHex, encrypted] = parts;
      
      const key = this.generateBusinessKey(businessId);
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv, {
        authTagLength: 16 // Enforce 16-byte (128-bit) auth tag
      });
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('❌ Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash data for verification (one-way)
   */
  static hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate secure random token
   */
  static generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}

/**
 * Webhook signature validation
 */
export class WebhookSecurity {
  /**
   * Validate WaSender webhook signature
   */
  static validateWaSenderSignature(
    payload: any,
    signature: string,
    secret: string
  ): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('hex');
      
      // Constant-time comparison to prevent timing attacks
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      console.error('❌ Signature validation error:', error);
      return false;
    }
  }

  /**
   * Generate webhook signature for outgoing requests
   */
  static generateSignature(payload: any, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
  }
}
