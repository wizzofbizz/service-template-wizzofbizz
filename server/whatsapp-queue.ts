import { storage } from "./storage";
import { twilioProvider } from "./whatsapp-twilio";
import { createWaSenderProvider } from "./whatsapp-wasender";
import { incrementWhatsAppUsage, getProviderCost } from "./whatsapp-service";
import type { WhatsAppProvider } from "./whatsapp-service";
import type { Business } from "../shared/schema";

/**
 * Get the appropriate WhatsApp provider for a business (with session checking)
 * Returns configured provider based on active session status
 */
async function getProviderForBusiness(businessId: string): Promise<{
  provider: WhatsAppProvider;
  providerName: string;
  sessionId?: string;
}> {
  const { getWhatsAppProviderForBusiness } = await import('./whatsapp-service');
  return await getWhatsAppProviderForBusiness(businessId);
}

/**
 * Process pending WhatsApp messages in the queue
 * This should be run periodically (every 5 minutes via cron/scheduled job)
 */
export async function processWhatsAppQueue(businessId: string): Promise<number> {
  try {
    const pendingMessages = await storage.getPendingWhatsAppMessages(businessId);
    let sentCount = 0;

    console.log(`\n📤 [WhatsApp Queue] Processing ${pendingMessages.length} pending messages for business ${businessId}`);
    console.log(`⏰ [WhatsApp Queue] Started at: ${new Date().toISOString()}`);

    // Get business to determine provider
    const business = await storage.getBusiness(businessId);
    if (!business) {
      console.error(`❌ [WhatsApp Queue] Business ${businessId} not found`);
      return 0;
    }

    // Get the appropriate provider for this business (checks for active session)
    const { provider, providerName, sessionId } = await getProviderForBusiness(businessId);

    for (const msg of pendingMessages) {
      try {
        console.log(`\n📧 [Message ${msg.id}] Attempting to send to ${msg.toNumber}`);
        console.log(`   - Provider: ${providerName}`);
        console.log(`   - Session: ${sessionId || 'N/A'}`);
        console.log(`   - Template: ${msg.templateName || 'none'}`);
        console.log(`   - Retry count: ${msg.retryCount || 0}/${msg.maxRetries || 3}`);

        // Check rate limit if using WaSender session
        if (sessionId) {
          const { checkSessionRateLimit } = await import('./whatsapp-session-monitor');
          const rateLimitCheck = await checkSessionRateLimit(sessionId, businessId);
          
          if (!rateLimitCheck.allowed) {
            console.error(`🚫 [Message ${msg.id}] Rate limit exceeded: ${rateLimitCheck.message}`);
            await storage.updateWhatsAppQueueItem(msg.id, businessId, {
              status: 'failed',
              errorMessage: rateLimitCheck.message,
              failedAt: new Date(),
            });
            continue;
          }
        }

        // Send via selected provider
        const result = await provider.sendMessage({
          to: msg.toNumber,
          body: msg.messageBody || '',
          mediaUrl: msg.mediaUrl || undefined,
          templateName: msg.templateName || undefined,
          templateParams: msg.templateParams as Record<string, any> || undefined,
        });

        if (result.success) {
          // Update queue item as sent
          await storage.updateWhatsAppQueueItem(msg.id, businessId, {
            status: 'sent',
            providerName: providerName,
            providerMessageId: result.messageId,
            sentAt: new Date(),
          });

          // Log activity: whatsapp_sent
          if (msg.relatedType && msg.relatedId) {
            await storage.createActivityLog({
              businessId: msg.businessId,
              action: "whatsapp_sent",
              entityType: msg.relatedType as any,
              entityId: msg.relatedId,
              contactId: msg.contactId || null,
              changes: {
                messageId: result.messageId,
                sentAt: new Date().toISOString(),
                toNumber: msg.toNumber,
                provider: providerName,
              },
            });
          }

          // Increment usage counter
          await incrementWhatsAppUsage(businessId, 1);

          sentCount++;
          console.log(`✅ [Message ${msg.id}] Sent successfully via ${providerName}`);
          console.log(`   - Provider Message ID: ${result.messageId}`);
          console.log(`   - Cost: R${msg.cost || getProviderCost(providerName)}`);
        } else {
          // Handle failure with retry logic
          const retryCount = (msg.retryCount || 0) + 1;
          const maxRetries = msg.maxRetries || 3;
          const newStatus = retryCount >= maxRetries ? 'failed' : 'pending';

          // Check if error is due to session expiry
          const isSessionExpired = result.error?.includes('session') || result.error?.includes('expired') || result.error?.includes('disconnected');
          
          if (isSessionExpired && sessionId) {
            console.warn(`⚠️ [Message ${msg.id}] Session expired, updating session status`);
            await storage.updateWhatsAppSession(sessionId, businessId, {
              status: 'expired',
              lastErrorMessage: result.error,
              lastErrorAt: new Date(),
              errorCount: (await storage.getWhatsAppSession(sessionId, businessId))?.errorCount || 0 + 1,
            });
          }

          await storage.updateWhatsAppQueueItem(msg.id, businessId, {
            status: newStatus,
            errorMessage: result.error,
            retryCount,
            failedAt: newStatus === 'failed' ? new Date() : undefined,
          });

          console.error(`❌ [Message ${msg.id}] Send failed: ${result.error}`);
          console.error(`   - Retry ${retryCount}/${maxRetries}`);
          console.error(`   - Status: ${newStatus}`);
        }
      } catch (error: any) {
        console.error(`\n❌ [Message ${msg.id}] Exception occurred:`, error.message);
        console.error(`   - Stack trace:`, error.stack);

        // Mark as failed after retries
        const retryCount = (msg.retryCount || 0) + 1;
        const newStatus = retryCount >= 3 ? 'failed' : 'pending';

        await storage.updateWhatsAppQueueItem(msg.id, businessId, {
          status: newStatus,
          errorMessage: error.message,
          retryCount,
          failedAt: newStatus === 'failed' ? new Date() : undefined,
        });
      }
    }

    console.log(`\n✅ [WhatsApp Queue] Completed: ${sentCount}/${pendingMessages.length} messages sent`);
    console.log(`⏰ [WhatsApp Queue] Finished at: ${new Date().toISOString()}`);

    return sentCount;
  } catch (error) {
    console.error('\n❌ [WhatsApp Queue] Fatal error:', error);
    return 0;
  }
}

/**
 * Process all businesses' WhatsApp queues
 * Use this for global queue processing
 */
export async function processAllWhatsAppQueues(): Promise<number> {
  try {
    const businesses = await storage.getAllBusinesses();
    let totalSent = 0;

    for (const business of businesses) {
      const sent = await processWhatsAppQueue(business.id);
      totalSent += sent;
    }

    return totalSent;
  } catch (error) {
    console.error('❌ Error processing all WhatsApp queues:', error);
    return 0;
  }
}