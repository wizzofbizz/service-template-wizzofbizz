import { getPublicBaseUrl } from "./config";

import { storage } from "./storage";
import { processEmailQueue } from "./email";
import { getQuoteSentTemplate, getJobConfirmationTemplate } from "./email-templates";

// Use the real row type from the schema rather than a hand-written partial
// stand-in. The local interface was missing columns this file actually reads
// (depositReminderHours, depositCancellationMode) and was structurally
// incompatible with what storage.getBusiness() returns.
import type { Business } from "@shared/schema";

// Track sent reminders to avoid duplicates within the same day
const sentRemindersToday = new Set<string>();

async function processQuoteFollowups(business: Business) {
  try {
    // quoteFollowupDays is a number[] on the businesses table (default
    // [3, 7, 14]). This routine works off a single offset, so take the first
    // configured value and fall back to 3.
    const followupDays = business.quoteFollowupDays?.[0] ?? 3;
    const quotes = await storage.getQuotesByBusinessId(business.id);
    
    // Find quotes that were sent X days ago
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - followupDays);
    targetDate.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    for (const quote of quotes) {
      // Skip declined, expired, or archived quotes
      if (quote.status === 'declined' || quote.status === 'expired' || quote.status === 'archived') continue;
      
      const sentDate = quote.sentAt ? new Date(quote.sentAt) : null;
      const acceptedDate = quote.acceptedAt ? new Date(quote.acceptedAt) : null;
      
      // Determine which date to use for follow-up
      let referenceDate = null;
      let messageType = '';
      
      if (quote.status === 'accepted') {
        // For accepted quotes, follow up based on acceptance date
        referenceDate = acceptedDate;
        messageType = 'booking_reminder';
      } else if (quote.status === 'sent' || quote.status === 'viewed') {
        // For sent/viewed quotes, follow up based on sent date
        referenceDate = sentDate;
        messageType = 'quote_reminder';
      }
      
      if (!referenceDate) continue;
      
      // Check if the reference date was exactly X days ago (within the day)
      if (referenceDate >= targetDate && referenceDate < nextDay) {
        const reminderKey = `quote-${quote.id}-${messageType}-${targetDate.toISOString().split('T')[0]}`;
        if (sentRemindersToday.has(reminderKey)) continue;
        
        const contact = await storage.getContact(quote.contactId, business.id);
        if (!contact) continue;

        // Check if there's already a job with a scheduled date (booking made)
        const jobs = await storage.getJobsByBusinessId(business.id);
        const relatedJob = jobs.find(j => j.quoteId === quote.id || j.relatedQuoteId === quote.id);
        const hasScheduledBooking = relatedJob && relatedJob.scheduledDate;
        
        // Skip if booking is already made
        if (quote.status === 'accepted' && hasScheduledBooking) {
          console.log(`⏭️ Skipping reminder for ${quote.quoteNumber} - booking already made`);
          continue;
        }

        // Generate appropriate link
        const quoteLink = `${getPublicBaseUrl()}/quotes/${quote.id}/view?token=${quote.publicToken}`;
        
        const { sendWhatsAppNotification } = await import('./whatsapp-notification');
        
        // Craft message based on quote status
        let messageBody = '';
        let templateName = '';
        let emailSubject = '';
        let emailBodyPrefix = '';
        
        if (messageType === 'booking_reminder') {
          // Accepted quote - remind to book appointment
          messageBody = `Hi ${contact.fullName}, thank you for accepting quote ${quote.quoteNumber}!\n\nPlease book your appointment at your earliest convenience:\n${quoteLink}\n\n- ${business.businessName}`;
          templateName = 'booking_reminder';
          emailSubject = `Reminder: Book Your Appointment - ${quote.quoteNumber}`;
          emailBodyPrefix = 'Thank you for accepting our quote! Please book your appointment';
        } else {
          // Sent/viewed quote - remind to accept
          messageBody = `Hi ${contact.fullName}, just following up on your quote ${quote.quoteNumber}.\n\nTotal: R${parseFloat(quote.totalAmount).toFixed(2)}\nView: ${quoteLink}\n\n- ${business.businessName}`;
          templateName = 'quote_followup';
          emailSubject = `Follow-up: Quote ${quote.quoteNumber}`;
          emailBodyPrefix = 'Just following up on your quote';
        }
        
        const whatsappResult = await sendWhatsAppNotification({
          business,
          contact,
          messageBody,
          templateName,
          relatedType: 'quote',
          relatedId: quote.id,
        });

        if (whatsappResult.sent) {
          console.log(`✅ WhatsApp ${messageType} sent for ${quote.quoteNumber}`);
        } else {
          console.log(`⚠️ WhatsApp ${messageType} skipped for ${quote.quoteNumber}: ${whatsappResult.reason || whatsappResult.error}`);
        }

        // Email follow-up
        if (contact.email) {
          const emailContent = getQuoteSentTemplate({
            businessName: business.businessName,
            senderName: business.senderName || business.businessName,
            recipientName: contact.fullName,
            quoteNumber: quote.quoteNumber,
            quoteTotal: `R${parseFloat(quote.totalAmount).toFixed(2)}`,
            validUntil: quote.validUntil || 'TBD',
            quoteViewLink: quoteLink,
            businessPhone: business.phone || '',
            businessEmail: business.email || '',
          });

          await storage.createEmailQueueItem({
            businessId: business.id,
            toEmail: contact.email,
            toName: contact.fullName,
            subject: emailSubject,
            bodyHtml: emailContent.html.replace('Thank you for your interest', emailBodyPrefix),
            bodyText: emailContent.text.replace('Thank you for your interest', emailBodyPrefix),
            status: 'pending',
            relatedType: 'quote',
            relatedId: quote.id,
          });
        }

        sentRemindersToday.add(reminderKey);
        console.log(`Queued ${messageType} for ${quote.quoteNumber} to ${contact.fullName}`);
      }
    }
  } catch (error) {
    console.error(`Error processing quote follow-ups for business ${business.id}:`, error);
  }
}

async function processJobReminders(business: Business) {
  try {
    const reminderDays = business.jobReminderDays || [1, 3, 7];
    const jobs = await storage.getJobsByBusinessId(business.id);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const job of jobs) {
      // Only send reminders for scheduled jobs
      if (job.status !== 'scheduled') continue;
      if (!job.scheduledDate) continue;

      const scheduledDate = new Date(job.scheduledDate);
      scheduledDate.setHours(0, 0, 0, 0);

      // Calculate days until job
      const daysUntil = Math.floor((scheduledDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Check if we should send a reminder today
      if (reminderDays.includes(daysUntil)) {
        const reminderKey = `job-${job.id}-${daysUntil}-${today.toISOString().split('T')[0]}`;
        if (sentRemindersToday.has(reminderKey)) continue;

        const contact = await storage.getContact(job.contactId, business.id);
        if (!contact?.email) continue;

        const scheduledTime = job.scheduledStartTime && job.scheduledEndTime 
          ? `${job.scheduledStartTime} - ${job.scheduledEndTime}`
          : job.scheduledStartTime || 'TBD';

        // Send job reminder via WhatsApp or Email
        if (
          contact.whatsappOptIn && 
          contact.phone && 
          (contact.preferredChannel === 'whatsapp' || contact.preferredChannel === 'both')
        ) {
          const { checkWhatsAppLimit, queueWhatsAppMessage } = await import('./whatsapp-service');
          const limitCheck = await checkWhatsAppLimit(business.id);
          
          if (limitCheck.allowed) {
            try {
              await queueWhatsAppMessage({
                businessId: business.id,
                contactId: contact.id,
                toNumber: contact.phone,
                templateName: 'job_reminder_whatsapp',
                messageBody: `Reminder: Your appointment ${job.jobNumber} is scheduled for ${scheduledDate.toLocaleDateString()} at ${scheduledTime}.\n\nAddress: ${job.locationAddress || 'TBD'}\n\nSee you soon!\n- ${business.businessName}`,
                relatedType: 'job',
                relatedId: job.id,
              });
              
              console.log(`✅ WhatsApp job reminder queued for ${job.jobNumber}`);
            } catch (error) {
              console.error('WhatsApp job reminder failed:', error);
            }
          }
        }

        // Email reminder
        if (contact.email) {
          const emailContent = getJobConfirmationTemplate({
            businessName: business.businessName,
            senderName: business.senderName || business.businessName,
            recipientName: contact.fullName,
            jobNumber: job.jobNumber,
            jobTitle: job.title,
            scheduledDate: job.scheduledDate,
            scheduledTime,
            locationAddress: job.locationAddress || '',
            businessPhone: business.phone || '',
            businessEmail: business.email || '',
          });

          await storage.createEmailQueueItem({
            businessId: business.id,
            toEmail: contact.email,
            toName: contact.fullName,
            subject: `Reminder: ${emailContent.subject} in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`,
            bodyHtml: emailContent.html.replace('Your appointment has been confirmed', `Reminder: Your appointment is in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`),
            bodyText: emailContent.text.replace('Your appointment has been confirmed', `Reminder: Your appointment is in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`),
            status: 'pending',
            relatedType: 'job',
            relatedId: job.id,
          });
        }

        sentRemindersToday.add(reminderKey);
        console.log(`Queued job reminder for ${job.jobNumber} to ${contact.fullName} (${daysUntil} days before)`);
      }
    }
  } catch (error) {
    console.error(`Error processing job reminders for business ${business.id}:`, error);
  }
}

async function processDepositReminders(business: Business) {
  try {
    const reminderHours = business.depositReminderHours || [48, 24, 12];
    const jobs = await storage.getJobsByBusinessId(business.id);
    
    const now = new Date();

    for (const job of jobs) {
      // Only process jobs pending deposit
      if (job.status !== 'pending_deposit') continue;
      if (!job.depositDeadline || !job.depositInvoiceId) continue;

      const depositDeadline = new Date(job.depositDeadline);
      const hoursUntilDeadline = Math.floor((depositDeadline.getTime() - now.getTime()) / (1000 * 60 * 60));

      // Check if we should send a reminder
      if (reminderHours.includes(hoursUntilDeadline)) {
        const reminderKey = `deposit-${job.id}-${hoursUntilDeadline}h-${now.toISOString().split('T')[0]}`;
        if (sentRemindersToday.has(reminderKey)) continue;

        const contact = await storage.getContact(job.contactId, business.id);
        if (!contact) continue;

        const depositInvoice = await storage.getInvoice(job.depositInvoiceId, business.id);
        if (!depositInvoice) continue;

        const depositAmount = depositInvoice.depositAmount || depositInvoice.totalAmount;

        // Build payment link
        const paymentLink = `${getPublicBaseUrl()}/invoices/${depositInvoice.id}/view?token=${depositInvoice.publicToken}`;

        // WhatsApp reminder
        const { sendWhatsAppNotification } = await import('./whatsapp-notification');

        const templateName = hoursUntilDeadline <= 24 ? 'deposit_reminder_24h' : 'deposit_reminder_48h';
        const messageBody = hoursUntilDeadline <= 24
          ? `🚨 URGENT: Deposit due in ${hoursUntilDeadline} hours!\n\nBooking: ${job.jobNumber}\nAmount: R${parseFloat(depositAmount).toFixed(2)}\n\nPay now or booking will be cancelled: ${paymentLink}\n\n- ${business.businessName}`
          : `⏰ Reminder: Deposit due in ${hoursUntilDeadline} hours!\n\nBooking: ${job.jobNumber}\nAmount: R${parseFloat(depositAmount).toFixed(2)}\n\nPay now: ${paymentLink}\n\n- ${business.businessName}`;

        const whatsappResult = await sendWhatsAppNotification({
          business,
          contact,
          messageBody,
          templateName,
          relatedType: 'invoice',
          relatedId: depositInvoice.id,
        });

        if (whatsappResult.sent) {
          console.log(`✅ WhatsApp deposit reminder sent for ${job.jobNumber} (${hoursUntilDeadline}h)`);
        }

        // Email reminder
        if (contact.email) {
          const { getDepositReminderTemplate } = await import('./email-templates');
          const emailContent = getDepositReminderTemplate({
            businessName: business.businessName,
            senderName: business.senderName || business.businessName,
            recipientName: contact.fullName,
            invoiceNumber: depositInvoice.invoiceNumber,
            depositAmount: `R${parseFloat(depositAmount).toFixed(2)}`,
            jobNumber: job.jobNumber,
            hoursRemaining: hoursUntilDeadline,
            invoiceViewLink: paymentLink,
            businessPhone: business.phone || '',
            businessEmail: business.email || '',
          });

          await storage.createEmailQueueItem({
            businessId: business.id,
            toEmail: contact.email,
            toName: contact.fullName,
            subject: emailContent.subject,
            bodyHtml: emailContent.html,
            bodyText: emailContent.text,
            status: 'pending',
            relatedType: 'invoice',
            relatedId: depositInvoice.id,
          });
        }

        // Update reminder count
        await storage.updateJob(job.id, business.id, {
          depositRemindersSent: (job.depositRemindersSent || 0) + 1,
          lastDepositReminderAt: now,
        });

        sentRemindersToday.add(reminderKey);
        console.log(`Queued deposit reminder for ${job.jobNumber} (${hoursUntilDeadline}h until deadline)`);
      }

      // Auto-cancel if past deadline and auto-cancellation enabled
      if (hoursUntilDeadline < 0 && business.depositCancellationMode === 'auto') {
        const cancelKey = `deposit-cancel-${job.id}`;
        if (sentRemindersToday.has(cancelKey)) continue;

        // Cancel job
        await storage.updateJob(job.id, business.id, {
          status: 'cancelled',
          cancellationReason: 'Deposit not paid by deadline (auto-cancelled)',
        });

        // Cancel deposit invoice
        await storage.updateInvoice(job.depositInvoiceId, business.id, {
          status: 'cancelled',
        });

        const contact = await storage.getContact(job.contactId, business.id);
        if (contact) {
          // Send cancellation notification
          const { sendWhatsAppNotification } = await import('./whatsapp-notification');

          await sendWhatsAppNotification({
            business,
            contact,
            messageBody: `❌ Booking ${job.jobNumber} cancelled - deposit not received by deadline.\n\nWant to reschedule? Contact us.\n\n- ${business.businessName}`,
            templateName: 'deposit_cancelled_auto',
            relatedType: 'job',
            relatedId: job.id,
          });

          if (contact.email) {
            const { getDepositCancelledTemplate } = await import('./email-templates');
            const emailContent = getDepositCancelledTemplate({
              businessName: business.businessName,
              senderName: business.senderName || business.businessName,
              recipientName: contact.fullName,
              jobNumber: job.jobNumber,
              reason: 'auto',
              businessPhone: business.phone || '',
              businessEmail: business.email || '',
            });

            await storage.createEmailQueueItem({
              businessId: business.id,
              toEmail: contact.email,
              toName: contact.fullName,
              subject: emailContent.subject,
              bodyHtml: emailContent.html,
              bodyText: emailContent.text,
              status: 'pending',
              relatedType: 'job',
              relatedId: job.id,
            });
          }
        }

        sentRemindersToday.add(cancelKey);
        console.log(`Auto-cancelled job ${job.jobNumber} - deposit deadline passed`);
      }
    }
  } catch (error) {
    console.error(`Error processing deposit reminders for business ${business.id}:`, error);
  }
}

async function processPaymentReminders(business: Business) {
  try {
    const reminderDays = business.paymentReminderDays || [3, 7, 14];
    const invoices = await storage.getInvoicesByBusinessId(business.id);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const invoice of invoices) {
      // Only send reminders for overdue invoices
      if (invoice.status !== 'overdue') continue;
      if (!invoice.dueDate) continue;

      const dueDate = new Date(invoice.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      // Calculate days overdue
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      // Check if we should send a reminder today
      if (reminderDays.includes(daysOverdue)) {
        const reminderKey = `invoice-${invoice.id}-${daysOverdue}-${today.toISOString().split('T')[0]}`;
        if (sentRemindersToday.has(reminderKey)) continue;

        const contact = await storage.getContact(invoice.contactId, business.id);
        if (!contact?.email) continue;

        // Send payment reminder via WhatsApp or Email
        const invoiceLink = `${getPublicBaseUrl()}/invoices/${invoice.id}/view?token=${invoice.publicToken || invoice.id}`;
        
        if (
          contact.whatsappOptIn && 
          contact.phone && 
          (contact.preferredChannel === 'whatsapp' || contact.preferredChannel === 'both')
        ) {
          const { checkWhatsAppLimit, queueWhatsAppMessage } = await import('./whatsapp-service');
          const limitCheck = await checkWhatsAppLimit(business.id);
          
          if (limitCheck.allowed) {
            try {
              await queueWhatsAppMessage({
                businessId: business.id,
                contactId: contact.id,
                toNumber: contact.phone,
                templateName: 'payment_reminder_whatsapp',
                messageBody: `Payment reminder: Invoice ${invoice.invoiceNumber} (R${parseFloat(invoice.totalAmount).toFixed(2)}) is ${daysOverdue} days overdue.\n\nPlease pay: ${invoiceLink}\n\n- ${business.businessName}`,
                relatedType: 'invoice',
                relatedId: invoice.id,
              });
              
              console.log(`✅ WhatsApp payment reminder queued for ${invoice.invoiceNumber}`);
            } catch (error) {
              console.error('WhatsApp payment reminder failed:', error);
            }
          }
        }

        // Email reminder
        if (contact.email) {
          const { getInvoiceReminderTemplate } = await import('./email-templates');
          const emailContent = getInvoiceReminderTemplate({
            businessName: business.businessName,
            senderName: business.senderName || business.businessName,
            recipientName: contact.fullName,
            invoiceNumber: invoice.invoiceNumber,
            invoiceTotal: `R${parseFloat(invoice.totalAmount).toFixed(2)}`,
            dueDate: new Date(invoice.dueDate).toLocaleDateString(),
            daysOverdue,
            invoiceViewLink: invoiceLink,
            businessPhone: business.phone || '',
            businessEmail: business.email || '',
          });

          await storage.createEmailQueueItem({
            businessId: business.id,
            toEmail: contact.email,
            toName: contact.fullName,
            subject: emailContent.subject,
            bodyHtml: emailContent.html,
            bodyText: emailContent.text,
            status: 'pending',
            relatedType: 'invoice',
            relatedId: invoice.id,
          });
        }

        // Update invoice reminder count
        await storage.updateInvoice(invoice.id, business.id, {
          remindersSent: (invoice.remindersSent || 0) + 1,
          lastReminderSentAt: new Date(),
        });

        sentRemindersToday.add(reminderKey);
        console.log(`Queued payment reminder for ${invoice.invoiceNumber} to ${contact.fullName} (${daysOverdue} days overdue)`);
      }
    }
  } catch (error) {
    console.error(`Error processing payment reminders for business ${business.id}:`, error);
  }
}

/**
 * Check health of all WaSender sessions and auto-reconnect if needed
 */
async function checkWhatsAppSessionHealth() {
  try {
    console.log('\n🏥 [Session Health] Starting WaSender session health checks...');
    const businesses = await storage.getAllUsers();
    const uniqueBusinessIds = [...new Set(businesses.map(u => u.businessId).filter(Boolean))];

    for (const businessId of uniqueBusinessIds) {
      if (!businessId) continue;

      const sessions = await storage.getWhatsAppSessionsByBusinessId(businessId);
      const activeSessions = sessions.filter(s => s.status === 'connected' || s.status === 'connecting');

      for (const session of activeSessions) {
        try {
          const business = await storage.getBusiness(businessId);
          if (!business?.whatsappWasenderApiKey) continue;

          const { createWaSenderSessionService } = await import('./whatsapp-wasender-sessions');
          const sessionService = createWaSenderSessionService(business.whatsappWasenderApiKey);

          // Check session status
          const statusResult = await sessionService.getSessionStatus(session.sessionId);

          if (statusResult.success) {
            // Update session health
            await storage.updateWhatsAppSession(session.sessionId, businessId, {
              status: statusResult.status || 'connected',
              lastHeartbeatAt: new Date(),
              healthStatus: 'healthy',
              consecutiveFailures: 0,
              whatsappNumber: statusResult.whatsappNumber || session.whatsappNumber,
              whatsappName: statusResult.whatsappName || session.whatsappName,
            });

            console.log(`✅ [Session Health] ${session.sessionName} is healthy`);
          } else {
            // Handle unhealthy session
            const consecutiveFailures = (session.consecutiveFailures || 0) + 1;
            const healthStatus = consecutiveFailures >= 3 ? 'unhealthy' : 'degraded';

            await storage.updateWhatsAppSession(session.sessionId, businessId, {
              healthStatus,
              consecutiveFailures,
              lastErrorMessage: statusResult.error,
              lastErrorAt: new Date(),
              errorCount: (session.errorCount || 0) + 1,
            });

            console.warn(`⚠️ [Session Health] ${session.sessionName} is ${healthStatus} (${consecutiveFailures} failures)`);

            // Auto-reconnect if enabled and session is unhealthy
            if (session.autoReconnect && healthStatus === 'unhealthy') {
              console.log(`🔄 [Session Health] Auto-reconnecting ${session.sessionName}...`);
              const reconnectResult = await sessionService.startConnection(session.sessionId);
              
              if (reconnectResult.success) {
                await storage.updateWhatsAppSession(session.sessionId, businessId, {
                  status: 'connecting',
                  healthStatus: 'degraded',
                  consecutiveFailures: 0,
                });
                console.log(`✅ [Session Health] Reconnection initiated for ${session.sessionName}`);
              }
            }
          }
        } catch (error: any) {
          console.error(`❌ [Session Health] Error checking session ${session.sessionName}:`, error.message);
        }
      }
    }

    console.log('✅ [Session Health] Health checks completed');
  } catch (error) {
    console.error('❌ [Session Health] Health check job failed:', error);
  }
}

export async function runEmailReminders() {
  console.log('Starting email reminder job...');
  
  try {
    // Run WaSender session health checks
    await checkWhatsAppSessionHealth();
    
    // Get all active businesses
    const businesses = await storage.getAllUsers();
    const uniqueBusinessIds = [...new Set(businesses.map(u => u.businessId).filter(Boolean))];
    
    for (const businessId of uniqueBusinessIds) {
      if (!businessId) continue;
      
      const business = await storage.getBusiness(businessId);
      if (!business) continue;

      console.log(`Processing reminders for business: ${business.businessName}`);
      
      // Process all reminder types
      await processQuoteFollowups(business as Business);
      await processJobReminders(business as Business);
      await processDepositReminders(business as Business);
      await processPaymentReminders(business as Business);
      
      // Process the email queue for this business
      const sentCount = await processEmailQueue(storage, businessId);
      if (sentCount > 0) {
        console.log(`Sent ${sentCount} emails for ${business.businessName}`);
      }

      // Process WhatsApp queue
      try {
        const { processWhatsAppQueue } = await import('./whatsapp-queue');
        const whatsappSentCount = await processWhatsAppQueue(businessId);
        if (whatsappSentCount > 0) {
          console.log(`Sent ${whatsappSentCount} WhatsApp messages for ${business.businessName}`);
        }
      } catch (error) {
        console.error(`Error processing WhatsApp queue for ${business.businessName}:`, error);
      }
    }
    
    console.log('Email reminder job completed successfully');
  } catch (error) {
    console.error('Email reminder job failed:', error);
    throw error;
  }
}

// For running as a standalone script
// In ES modules, check if this file was run directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  runEmailReminders()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
