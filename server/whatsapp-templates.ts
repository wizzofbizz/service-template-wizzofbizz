
import { storage } from "./storage";
import { twilioProvider } from "./whatsapp-twilio";

/**
 * WhatsApp Template Definitions
 * Templates must be approved by Meta before use
 */

export const DEFAULT_TEMPLATES = {
  quote_sent: {
    name: "quote_sent_whatsapp",
    type: "quote",
    category: "utility",
    content: `Hi {{1}}, your quote {{2}} for {{3}} is ready! 

Total: {{4}}
Valid until: {{5}}

View and accept: {{6}}

- {{7}}`,
    variables: ["customer_name", "quote_number", "service_name", "total_amount", "valid_until", "quote_link", "business_name"],
  },

  deposit_invoice_sent: {
    name: "deposit_invoice_sent",
    type: "invoice",
    category: "utility",
    content: `Hi {{1}}, pay your {{2}} deposit to confirm booking {{3}}!

Invoice: {{4}}
Due: {{5}}

Pay here: {{6}}

- {{7}}`,
    variables: ["customer_name", "deposit_amount", "job_number", "invoice_number", "due_date", "payment_link", "business_name"],
  },

  deposit_reminder_48h: {
    name: "deposit_reminder_48h",
    type: "invoice",
    category: "utility",
    content: `⏰ Reminder: Deposit due in 48 hours!

Booking: {{1}}
Amount: {{2}}

Pay now: {{3}}

- {{4}}`,
    variables: ["job_number", "deposit_amount", "payment_link", "business_name"],
  },

  deposit_reminder_24h: {
    name: "deposit_reminder_24h",
    type: "invoice",
    category: "utility",
    content: `🚨 URGENT: Deposit due tomorrow!

Booking: {{1}}
Amount: {{2}}

Pay now or booking will be cancelled: {{3}}

- {{4}}`,
    variables: ["job_number", "deposit_amount", "payment_link", "business_name"],
  },

  deposit_received: {
    name: "deposit_received",
    type: "invoice",
    category: "utility",
    content: `✅ Deposit confirmed! Your booking {{1}} is secured.

Paid: {{2}}
Balance due: {{3}}

Thank you!
- {{4}}`,
    variables: ["job_number", "deposit_amount", "balance_due", "business_name"],
  },

  deposit_cancelled_auto: {
    name: "deposit_cancelled_auto",
    type: "job",
    category: "utility",
    content: `❌ Booking {{1}} cancelled - deposit not received by deadline.

Want to reschedule? Contact us.

- {{2}}`,
    variables: ["job_number", "business_name"],
  },

  deposit_cancelled_manual: {
    name: "deposit_cancelled_manual",
    type: "job",
    category: "utility",
    content: `Your booking {{1}} has been cancelled.

{{2}}

Questions? Contact us.

- {{3}}`,
    variables: ["job_number", "cancellation_reason", "business_name"],
  },

  final_invoice_with_credit: {
    name: "final_invoice_with_credit",
    type: "invoice",
    category: "utility",
    content: `📄 Final invoice {{1}} ready!

Total: {{2}}
Deposit credit: -{{3}}
Balance due: {{4}}

Pay here: {{5}}

- {{6}}`,
    variables: ["invoice_number", "total_amount", "deposit_amount", "balance_due", "payment_link", "business_name"],
  },
  
  job_scheduled: {
    name: "job_scheduled_whatsapp",
    type: "job",
    category: "utility",
    content: `Appointment confirmed! {{1}} scheduled for {{2}} at {{3}}.

Address: {{4}}

We look forward to serving you!
- {{5}}`,
    variables: ["job_number", "date", "time", "address", "business_name"],
  },
  
  job_rescheduled: {
    name: "job_rescheduled_whatsapp",
    type: "job",
    category: "utility",
    content: `Your appointment {{1}} has been rescheduled to {{2}} at {{3}}.

Address: {{4}}

Sorry for any inconvenience!
- {{5}}`,
    variables: ["job_number", "date", "time", "address", "business_name"],
  },
  
  job_reminder: {
    name: "job_reminder_whatsapp",
    type: "job",
    category: "utility",
    content: `Reminder: Your appointment {{1}} is scheduled for {{2}} at {{3}}.

Address: {{4}}

See you soon!
- {{5}}`,
    variables: ["job_number", "date", "time", "address", "business_name"],
  },
  
  invoice_sent: {
    name: "invoice_sent_whatsapp",
    type: "invoice",
    category: "utility",
    content: `Invoice {{1}} for {{2}} is ready.

Amount: {{3}}
Due: {{4}}

Pay here: {{5}}

- {{6}}`,
    variables: ["invoice_number", "service_description", "total_amount", "due_date", "payment_link", "business_name"],
  },
  
  payment_reminder: {
    name: "payment_reminder_whatsapp",
    type: "invoice",
    category: "utility",
    content: `Payment reminder: Invoice {{1}} ({{2}}) is {{3}} days overdue.

Please pay: {{4}}

- {{5}}`,
    variables: ["invoice_number", "amount", "days_overdue", "payment_link", "business_name"],
  },
};

/**
 * Submit template to Twilio for Meta approval
 */
export async function submitTemplate(
  businessId: string,
  templateName: string,
  templateType: string,
  contentText: string
): Promise<{ success: boolean; templateId?: string; error?: string }> {
  try {
    // In production, this would submit to Twilio Content API
    // For now, we'll store it locally and mark as pending approval
    
    const template = await storage.createWhatsappTemplate({
      businessId,
      templateName,
      templateType,
      contentText,
      status: "pending",
      submittedAt: new Date(),
      language: "en",
      category: "utility",
    });

    console.log(`📝 WhatsApp template submitted for approval: ${templateName}`);
    
    // Auto-approve for development (in production, submit to Twilio properly)
    await storage.updateWhatsappTemplate(template.id, businessId, {
      status: "approved",
      approvedAt: new Date(),
      twilioTemplateSid: `HX${Math.random().toString(36).substring(2, 15)}`, // Mock SID
    });
    console.log(`✅ WhatsApp template auto-approved: ${templateName}`);

    return {
      success: true,
      templateId: template.id,
    };
  } catch (error: any) {
    console.error("Template submission error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Initialize default templates for a business
 */
export async function initializeDefaultTemplates(businessId: string): Promise<void> {
  try {
    for (const [key, template] of Object.entries(DEFAULT_TEMPLATES)) {
      await submitTemplate(
        businessId,
        template.name,
        template.type,
        template.content
      );
    }
    console.log(`✅ Initialized ${Object.keys(DEFAULT_TEMPLATES).length} default WhatsApp templates for business ${businessId}`);
  } catch (error) {
    console.error("Error initializing templates:", error);
  }
}

/**
 * Format a template with variables
 */
export function formatTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let formatted = template;
  
  Object.entries(variables).forEach(([key, value], index) => {
    formatted = formatted.replace(`{{${index + 1}}}`, value);
  });
  
  return formatted;
}
