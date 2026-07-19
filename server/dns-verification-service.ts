
import { Resolver } from 'dns/promises';
import { db } from './db';
import { customDomains } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

interface VerificationResult {
  verified: boolean;
  method: 'a_record' | 'txt_record';
  error?: string;
  details?: {
    expectedValue: string;
    actualValue?: string;
  };
}

export class DNSVerificationService {
  private resolver: Resolver;

  constructor() {
    this.resolver = new Resolver();
    // Use Google's DNS servers for more reliable lookups
    this.resolver.setServers(['8.8.8.8', '8.8.4.4']);
  }

  /**
   * Verify domain ownership via DNS records
   */
  async verifyDomain(domainId: string, businessId: string): Promise<VerificationResult> {
    try {
      // Get domain record from database
      const [domain] = await db
        .select()
        .from(customDomains)
        .where(
          and(
            eq(customDomains.id, domainId),
            eq(customDomains.businessId, businessId)
          )
        )
        .limit(1);

      if (!domain) {
        return {
          verified: false,
          method: 'txt_record',
          error: 'Domain not found'
        };
      }

      // Try TXT record verification first
      const txtResult = await this.verifyTXTRecord(domain.domain, domain.verificationToken);
      
      if (txtResult.verified) {
        // Update domain status in database
        await db
          .update(customDomains)
          .set({
            status: 'verified',
            verificationMethod: 'txt_record',
            lastVerifiedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(customDomains.id, domainId));

        return txtResult;
      }

      // Fallback to A record verification
      const aResult = await this.verifyARecord(domain.domain);
      
      if (aResult.verified) {
        // Update domain status in database
        await db
          .update(customDomains)
          .set({
            status: 'verified',
            verificationMethod: 'a_record',
            lastVerifiedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(customDomains.id, domainId));

        return aResult;
      }

      // Neither verification method succeeded
      await db
        .update(customDomains)
        .set({
          status: 'failed',
          updatedAt: new Date(),
        })
        .where(eq(customDomains.id, domainId));

      return {
        verified: false,
        method: 'txt_record',
        error: 'DNS verification failed. Please ensure DNS records are correctly configured.',
        details: txtResult.details
      };

    } catch (error) {
      console.error('DNS verification error:', error);
      return {
        verified: false,
        method: 'txt_record',
        error: error instanceof Error ? error.message : 'Unknown verification error'
      };
    }
  }

  /**
   * Verify TXT record for domain ownership
   */
  private async verifyTXTRecord(domain: string, expectedToken: string): Promise<VerificationResult> {
    try {
      // Check both root domain and _verification subdomain
      const txtHosts = [
        `_verification.${domain}`,
        domain
      ];

      for (const host of txtHosts) {
        try {
          const records = await this.resolver.resolveTxt(host);
          
          // Flatten TXT records (they come as arrays of strings)
          const flatRecords = records.map(record => record.join(''));
          
          // Check if any record matches our token
          const verified = flatRecords.some(record => 
            record === expectedToken || 
            record === `replit-verification=${expectedToken}`
          );

          if (verified) {
            return {
              verified: true,
              method: 'txt_record',
              details: {
                expectedValue: expectedToken,
                actualValue: flatRecords.find(r => r.includes(expectedToken))
              }
            };
          }
        } catch (err) {
          // Continue to next host if this one fails
          continue;
        }
      }

      return {
        verified: false,
        method: 'txt_record',
        error: 'TXT record not found or does not match verification token',
        details: {
          expectedValue: expectedToken
        }
      };

    } catch (error) {
      return {
        verified: false,
        method: 'txt_record',
        error: error instanceof Error ? error.message : 'TXT record lookup failed',
        details: {
          expectedValue: expectedToken
        }
      };
    }
  }

  /**
   * Verify A record points to Replit infrastructure
   */
  private async verifyARecord(domain: string): Promise<VerificationResult> {
    try {
      // Get Replit's IP address from environment or use a default
      const expectedIP = process.env.REPLIT_SERVER_IP || this.getReplitIP();

      const records = await this.resolver.resolve4(domain);

      const verified = records.includes(expectedIP);

      return {
        verified,
        method: 'a_record',
        error: verified ? undefined : 'A record does not point to Replit infrastructure',
        details: {
          expectedValue: expectedIP,
          actualValue: records.join(', ')
        }
      };

    } catch (error) {
      return {
        verified: false,
        method: 'a_record',
        error: error instanceof Error ? error.message : 'A record lookup failed',
        details: {
          expectedValue: process.env.REPLIT_SERVER_IP || 'unknown'
        }
      };
    }
  }

  /**
   * Get Replit's IP address for A record verification
   * In production, this should come from environment variables
   */
  private getReplitIP(): string {
    // This is a placeholder - in production, Replit will provide the actual IP
    // You can get this from your deployment settings or Replit support
    return '0.0.0.0'; // Replace with actual Replit IP
  }

  /**
   * Check current DNS status without updating database
   */
  async checkDNSStatus(domain: string, verificationToken: string): Promise<{
    txtRecord: VerificationResult;
    aRecord: VerificationResult;
  }> {
    const [txtRecord, aRecord] = await Promise.all([
      this.verifyTXTRecord(domain, verificationToken),
      this.verifyARecord(domain)
    ]);

    return { txtRecord, aRecord };
  }

  /**
   * Periodic verification check for all pending domains
   */
  async verifyPendingDomains(): Promise<void> {
    try {
      const pendingDomains = await db
        .select()
        .from(customDomains)
        .where(eq(customDomains.status, 'pending'));

      console.log(`🔍 Checking ${pendingDomains.length} pending domains...`);

      for (const domain of pendingDomains) {
        try {
          await this.verifyDomain(domain.id, domain.businessId);
          console.log(`✅ Verified domain: ${domain.domain}`);
        } catch (error) {
          console.error(`❌ Failed to verify domain ${domain.domain}:`, error);
        }
      }

    } catch (error) {
      console.error('Error in periodic domain verification:', error);
    }
  }

  /**
   * Re-verify an already verified domain (for monitoring)
   */
  async reverifyDomain(domainId: string, businessId: string): Promise<VerificationResult> {
    try {
      const [domain] = await db
        .select()
        .from(customDomains)
        .where(
          and(
            eq(customDomains.id, domainId),
            eq(customDomains.businessId, businessId)
          )
        )
        .limit(1);

      if (!domain) {
        return {
          verified: false,
          method: 'txt_record',
          error: 'Domain not found'
        };
      }

      // Check using the previously successful method first
      let result: VerificationResult;
      
      if (domain.verificationMethod === 'txt_record') {
        result = await this.verifyTXTRecord(domain.domain, domain.verificationToken);
        if (!result.verified) {
          // Fallback to A record
          result = await this.verifyARecord(domain.domain);
        }
      } else {
        result = await this.verifyARecord(domain.domain);
        if (!result.verified) {
          // Fallback to TXT record
          result = await this.verifyTXTRecord(domain.domain, domain.verificationToken);
        }
      }

      // Update verification status
      if (result.verified) {
        await db
          .update(customDomains)
          .set({
            lastVerifiedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(customDomains.id, domainId));
      } else {
        // Mark as failed if verification no longer works
        await db
          .update(customDomains)
          .set({
            status: 'failed',
            updatedAt: new Date(),
          })
          .where(eq(customDomains.id, domainId));
      }

      return result;

    } catch (error) {
      console.error('Re-verification error:', error);
      return {
        verified: false,
        method: 'txt_record',
        error: error instanceof Error ? error.message : 'Unknown re-verification error'
      };
    }
  }
}

// Export singleton instance
export const dnsVerificationService = new DNSVerificationService();
