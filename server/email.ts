import sgMail from '@sendgrid/mail';
import type { EmailQueue } from '../shared/schema';

// Configure SendGrid with API key from environment
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export interface SendEmailParams {
  to: string;
  toName?: string;
  subject: string;
  html?: string;
  text?: string;
  fromName?: string;
  fromEmail?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!SENDGRID_API_KEY) {
      console.error('SENDGRID_API_KEY not configured');
      return { success: false, error: 'SendGrid API key not configured' };
    }

    // Use business sender info if provided and verified, otherwise use default
    let fromAddress: string;
    if (params.fromEmail && params.fromName) {
      fromAddress = params.fromEmail;
    } else {
      // Replace with your verified SendGrid sender email
      fromAddress = process.env.SENDGRID_FROM_EMAIL || 'noreply@yourdomain.com';
    }

    const msg = {
      to: params.toName ? `${params.toName} <${params.to}>` : params.to,
      from: {
        email: fromAddress,
        name: params.fromName || 'Smart Website'
      },
      subject: params.subject,
      text: params.text || '',
      html: params.html || params.text || '',
    };

    const [response] = await sgMail.send(msg);

    return { 
      success: true, 
      messageId: response.headers['x-message-id'] as string 
    };
  } catch (error: any) {
    console.error('SendGrid email sending error:', error);

    let errorMessage = 'Unknown error';
    if (error.response?.body?.errors) {
      errorMessage = error.response.body.errors.map((e: any) => e.message).join(', ');
    } else if (error.message) {
      errorMessage = error.message;
    }

    return { 
      success: false, 
      error: errorMessage
    };
  }
}

export async function processEmailQueue(storage: any, businessId: string): Promise<number> {
  const pendingEmails = await storage.getPendingEmails(businessId);
  let sentCount = 0;

  // Get business info for sender details
  const business = await storage.getBusiness(businessId);

  for (const email of pendingEmails) {
    // Skip if scheduled for future
    if (email.scheduledFor && new Date(email.scheduledFor) > new Date()) {
      continue;
    }

    const result = await sendEmail({
      to: email.toEmail,
      toName: email.toName || undefined,
      subject: email.subject,
      html: email.bodyHtml || undefined,
      text: email.bodyText || undefined,
      fromName: business?.senderName || business?.businessName || undefined,
      fromEmail: business?.senderEmailVerified ? business?.senderEmail || undefined : undefined,
    });

    if (result.success) {
      await storage.updateEmailQueueItem(email.id, email.businessId, {
        status: 'sent',
        sentAt: new Date(),
      });

      // Activity logging is handled by ActivityLogger.emailSent() when emails are queued
      // No need to log again here when sending
      
      sentCount++;
    } else {
      const retryCount = (email.retryCount || 0) + 1;
      const newStatus = retryCount >= 3 ? 'failed' : 'pending';

      await storage.updateEmailQueueItem(email.id, businessId, {
        status: newStatus,
        errorMessage: result.error,
        retryCount,
      });
    }
  }

  return sentCount;
}