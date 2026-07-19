/**
 * WaSender Session Monitoring Service
 * Handles session expiry, rate limiting, and notifications
 */

import { storage } from "./storage";

/**
 * Detect and handle expired sessions
 */
export async function handleExpiredSessions(businessId: string): Promise<void> {
  try {
    const sessions = await storage.getWhatsAppSessionsByBusinessId(businessId);
    const expiredSessions = sessions.filter(s => s.status === 'expired' || s.healthStatus === 'unhealthy');

    for (const session of expiredSessions) {
      console.log(`⏰ [Session Monitor] Handling expired session: ${session.sessionName}`);

      // Update session status
      await storage.updateWhatsAppSession(session.sessionId, businessId, {
        status: 'expired',
        disconnectedAt: new Date(),
      });

      // Notify business owner
      await notifySessionExpired(businessId, session.sessionName, session.sessionId);
    }
  } catch (error) {
    console.error('❌ [Session Monitor] Error handling expired sessions:', error);
  }
}

/**
 * Notify business owner of session expiry
 */
async function notifySessionExpired(businessId: string, sessionName: string, sessionId: string): Promise<void> {
  try {
    const business = await storage.getBusiness(businessId);
    if (!business) return;

    const users = await storage.getAllUsers();
    const businessOwner = users.find(u => u.businessId === businessId && u.role === 'owner');

    if (!businessOwner?.email) return;

    // Queue notification email
    await storage.createEmailQueueItem({
      businessId,
      toEmail: businessOwner.email,
      toName: businessOwner.firstName || 'Business Owner',
      subject: `⚠️ WhatsApp Session Expired: ${sessionName}`,
      bodyHtml: `
        <h2>WhatsApp Session Disconnected</h2>
        <p>Your WhatsApp session "${sessionName}" has been disconnected.</p>
        <p><strong>Action Required:</strong> Please reconnect your WhatsApp account to continue sending automated messages.</p>
        <p><a href="${getPublicBaseUrl()}/dashboard/settings?tab=whatsapp" style="background: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reconnect WhatsApp</a></p>
        <p>Messages will be queued until you reconnect.</p>
        <p>- ${business.businessName}</p>
      `,
      bodyText: `WhatsApp Session Disconnected\n\nYour WhatsApp session "${sessionName}" has been disconnected.\n\nAction Required: Please reconnect your WhatsApp account to continue sending automated messages.\n\nReconnect at: ${getPublicBaseUrl()}/dashboard/settings?tab=whatsapp\n\nMessages will be queued until you reconnect.\n\n- ${business.businessName}`,
      status: 'pending',
    });

    console.log(`✅ [Session Monitor] Notification queued for ${businessOwner.email}`);
  } catch (error) {
    console.error('❌ [Session Monitor] Error sending notification:', error);
  }
}

/**
 * Track and enforce rate limiting per session
 */
export async function checkSessionRateLimit(sessionId: string, businessId: string): Promise<{
  allowed: boolean;
  remaining: number;
  percentage: number;
  message?: string;
}> {
  try {
    const session = await storage.getWhatsAppSessionBySessionId(sessionId);
    if (!session) {
      return { allowed: false, remaining: 0, percentage: 100, message: 'Session not found' };
    }

    // Meta's limits: 1000 messages/day for utility conversations
    const dailyLimit = 1000;
    const messagesSentToday = session.messagesSentCount || 0;
    const remaining = dailyLimit - messagesSentToday;
    const percentage = (messagesSentToday / dailyLimit) * 100;

    // Warning at 80%
    if (percentage >= 80 && percentage < 100) {
      console.warn(`⚠️ [Rate Limit] Session ${session.sessionName} at ${percentage.toFixed(0)}% of daily limit`);
      await notifyRateLimitWarning(businessId, session.sessionName, percentage);
    }

    // Block at 100%
    if (remaining <= 0) {
      console.error(`🚫 [Rate Limit] Session ${session.sessionName} exceeded daily limit`);
      return {
        allowed: false,
        remaining: 0,
        percentage: 100,
        message: `Daily message limit of ${dailyLimit} reached. Limit resets in 24 hours.`
      };
    }

    return { allowed: true, remaining, percentage };
  } catch (error) {
    console.error('❌ [Rate Limit] Error checking rate limit:', error);
    return { allowed: true, remaining: 1000, percentage: 0 }; // Fail open
  }
}

/**
 * Notify business owner of rate limit warning
 */
async function notifyRateLimitWarning(businessId: string, sessionName: string, percentage: number): Promise<void> {
  try {
    const business = await storage.getBusiness(businessId);
    if (!business) return;

    const users = await storage.getAllUsers();
    const businessOwner = users.find(u => u.businessId === businessId && u.role === 'owner');

    if (!businessOwner?.email) return;

    await storage.createEmailQueueItem({
      businessId,
      toEmail: businessOwner.email,
      toName: businessOwner.firstName || 'Business Owner',
      subject: `⚠️ WhatsApp Rate Limit Warning: ${sessionName}`,
      bodyHtml: `
        <h2>WhatsApp Rate Limit Warning</h2>
        <p>Your WhatsApp session "${sessionName}" has reached ${percentage.toFixed(0)}% of the daily message limit.</p>
        <p><strong>Daily Limit:</strong> 1000 messages</p>
        <p><strong>Usage:</strong> ${percentage.toFixed(0)}%</p>
        <p>Messages will be blocked once you reach 100%. The limit resets in 24 hours.</p>
        <p>- ${business.businessName}</p>
      `,
      bodyText: `WhatsApp Rate Limit Warning\n\nYour WhatsApp session "${sessionName}" has reached ${percentage.toFixed(0)}% of the daily message limit.\n\nDaily Limit: 1000 messages\nUsage: ${percentage.toFixed(0)}%\n\nMessages will be blocked once you reach 100%. The limit resets in 24 hours.\n\n- ${business.businessName}`,
      status: 'pending',
    });

    console.log(`✅ [Rate Limit] Warning notification queued for ${businessOwner.email}`);
  } catch (error) {
    console.error('❌ [Rate Limit] Error sending warning:', error);
  }
}

/**
 * Reset daily message counters (run via cron at midnight)
 */
export async function resetDailyMessageCounters(): Promise<void> {
  try {
    console.log('🔄 [Rate Limit] Resetting daily message counters...');

    const businesses = await storage.getAllUsers();
    const uniqueBusinessIds = [...new Set(businesses.map(u => u.businessId).filter(Boolean))];

    for (const businessId of uniqueBusinessIds) {
      if (!businessId) continue;

      const sessions = await storage.getWhatsAppSessionsByBusinessId(businessId);
      for (const session of sessions) {
        await storage.updateWhatsAppSession(session.sessionId, businessId, {
          messagesSentCount: 0,
        });
      }
    }

    console.log('✅ [Rate Limit] Daily counters reset');
  } catch (error) {
    console.error('❌ [Rate Limit] Error resetting counters:', error);
  }
}