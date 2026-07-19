interface EmailTemplateParams {
  businessName?: string;
  recipientName?: string;
  verificationLink?: string;
  resetLink?: string;
  // Quote params
  quoteNumber?: string;
  quoteTotal?: string;
  validUntil?: string;
  quoteViewLink?: string;
  // Job params
  jobNumber?: string;
  jobTitle?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  locationAddress?: string;
  // Invoice params
  invoiceNumber?: string;
  invoiceTotal?: string;
  dueDate?: string;
  invoiceViewLink?: string;
  // Business contact
  businessPhone?: string;
  businessEmail?: string;
  senderName?: string;
  // Visit params
  visitDate?: string;
  visitTime?: string;
}

export function getEmailVerificationTemplate(params: EmailTemplateParams): { subject: string; html: string; text: string } {
  const { businessName = 'Smart Website', recipientName = 'there', verificationLink = '#' } = params;

  return {
    subject: 'Verify Your Email Address',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to ${businessName}!</h1>
          </div>

          <div style="background: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hi ${recipientName},</p>

            <p style="font-size: 16px; margin-bottom: 20px;">
              Thank you for signing up! Please verify your email address to complete your registration and access all features.
            </p>

            <div style="text-align: center; margin: 35px 0;">
              <a href="${verificationLink}" 
                 style="background: #667eea; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
                Verify Email Address
              </a>
            </div>

            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Or copy and paste this link into your browser:
            </p>
            <p style="font-size: 13px; color: #667eea; word-break: break-all; background: #f5f5f5; padding: 12px; border-radius: 4px;">
              ${verificationLink}
            </p>

            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              This verification link will expire in <strong>24 hours</strong>.
            </p>

            <p style="font-size: 14px; color: #666; margin-top: 20px;">
              If you didn't create an account, you can safely ignore this email.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} ${businessName}. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `
Welcome to ${businessName}!

Hi ${recipientName},

Thank you for signing up! Please verify your email address to complete your registration and access all features.

Click the link below to verify your email:
${verificationLink}

This verification link will expire in 24 hours.

If you didn't create an account, you can safely ignore this email.

© ${new Date().getFullYear()} ${businessName}. All rights reserved.
    `.trim()
  };
}

export function getPasswordResetTemplate(params: EmailTemplateParams): { subject: string; html: string; text: string } {
  const { businessName = 'Smart Website', recipientName = 'there', resetLink = '#' } = params;

  return {
    subject: 'Reset Your Password',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset</h1>
          </div>

          <div style="background: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hi ${recipientName},</p>

            <p style="font-size: 16px; margin-bottom: 20px;">
              We received a request to reset your password. Click the button below to create a new password.
            </p>

            <div style="text-align: center; margin: 35px 0;">
              <a href="${resetLink}" 
                 style="background: #667eea; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
                Reset Password
              </a>
            </div>

            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Or copy and paste this link into your browser:
            </p>
            <p style="font-size: 13px; color: #667eea; word-break: break-all; background: #f5f5f5; padding: 12px; border-radius: 4px;">
              ${resetLink}
            </p>

            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              This password reset link will expire in <strong>1 hour</strong>.
            </p>

            <p style="font-size: 14px; color: #DC2626; margin-top: 20px; padding: 15px; background: #FEE2E2; border-radius: 4px;">
              <strong>⚠️ Security Notice:</strong> If you didn't request a password reset, please ignore this email or contact support if you're concerned about your account security.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} ${businessName}. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `
Password Reset

Hi ${recipientName},

We received a request to reset your password. Click the link below to create a new password:

${resetLink}

This password reset link will expire in 1 hour.

⚠️ Security Notice: If you didn't request a password reset, please ignore this email or contact support if you're concerned about your account security.

© ${new Date().getFullYear()} ${businessName}. All rights reserved.
    `.trim()
  };
}

export function getQuoteSentTemplate(params: EmailTemplateParams & { photoCount?: number }): { subject: string; html: string; text: string } {
  const { 
    businessName = 'Smart Website',
    senderName = 'Team',
    recipientName = 'Valued Customer',
    quoteNumber = 'QT-0000',
    quoteTotal = 'R0.00',
    validUntil = 'TBD',
    quoteViewLink = '#',
    businessPhone = '',
    businessEmail = '',
    photoCount = 0
  } = params;

  return {
    subject: `Quote ${quoteNumber} from ${businessName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Quote is Ready</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">${businessName}</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Your Quote is Ready</p>
          </div>

          <div style="background: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Dear ${recipientName},</p>

            <p style="font-size: 16px; margin-bottom: 20px;">
              Thank you for your interest in our services. We're pleased to provide you with the following quote:
            </p>

            <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin: 30px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Quote Number:</td>
                  <td style="padding: 8px 0; text-align: right; color: #667eea; font-weight: bold;">${quoteNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Total Amount:</td>
                  <td style="padding: 8px 0; text-align: right; font-size: 20px; color: #2d3748; font-weight: bold;">${quoteTotal}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Valid Until:</td>
                  <td style="padding: 8px 0; text-align: right; color: #666;">${validUntil}</td>
                </tr>
                ${photoCount > 0 ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Attached Photos:</td>
                  <td style="padding: 8px 0; text-align: right; color: #667eea; font-weight: bold;">${photoCount} photo${photoCount > 1 ? 's' : ''}</td>
                </tr>
                ` : ''}
              </table>
            </div>

            <div style="text-align: center; margin: 35px 0;">
              <a href="${quoteViewLink}" 
                 style="background: #667eea; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
                View Full Quote
              </a>
            </div>

            <p style="font-size: 16px; margin-top: 30px;">
              If you have any questions or would like to discuss this quote further, please don't hesitate to contact us.
            </p>

            <p style="font-size: 16px; margin-top: 20px;">
              We look forward to working with you!
            </p>

            <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e0e0e0;">
              <p style="font-size: 16px; margin-bottom: 5px;"><strong>${senderName}</strong></p>
              <p style="font-size: 14px; color: #666; margin: 5px 0;">${businessName}</p>
              ${businessPhone ? `<p style="font-size: 14px; color: #666; margin: 5px 0;">📞 ${businessPhone}</p>` : ''}
              ${businessEmail ? `<p style="font-size: 14px; color: #666; margin: 5px 0;">✉️ ${businessEmail}</p>` : ''}
            </div>
          </div>

          <div style="text-align: center; margin-top: 30px; padding: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} ${businessName}. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `
${businessName}
Your Quote is Ready

Dear ${recipientName},

Thank you for your interest in our services. We're pleased to provide you with the following quote:

Quote Number: ${quoteNumber}
Total Amount: ${quoteTotal}
Valid Until: ${validUntil}

View your full quote here: ${quoteViewLink}

If you have any questions or would like to discuss this quote further, please don't hesitate to contact us.

We look forward to working with you!

${senderName}
${businessName}
${businessPhone ? `Phone: ${businessPhone}` : ''}
${businessEmail ? `Email: ${businessEmail}` : ''}

© ${new Date().getFullYear()} ${businessName}. All rights reserved.
    `.trim()
  };
}

export function getJobConfirmationTemplate(params: EmailTemplateParams): { subject: string; html: string; text: string } {
  const { 
    businessName = 'Smart Website',
    senderName = 'Team',
    recipientName = 'Valued Customer',
    jobNumber = 'JOB-0000',
    jobTitle = 'Service Appointment',
    scheduledDate = 'TBD',
    scheduledTime = 'TBD',
    locationAddress = '',
    businessPhone = '',
    businessEmail = ''
  } = params;

  return {
    subject: `Appointment Confirmed: ${jobTitle} - ${scheduledDate}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Appointment Confirmed</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">${businessName}</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Appointment Confirmed ✓</p>
          </div>

          <div style="background: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Dear ${recipientName},</p>

            <p style="font-size: 16px; margin-bottom: 20px;">
              Your appointment has been confirmed! We're looking forward to serving you.
            </p>

            <div style="background: #f0fdf4; padding: 25px; border-left: 4px solid #10b981; border-radius: 4px; margin: 30px 0;">
              <h3 style="margin-top: 0; color: #059669; font-size: 18px;">Appointment Details</h3>
              <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Job Number:</td>
                  <td style="padding: 8px 0; color: #2d3748;">${jobNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Service:</td>
                  <td style="padding: 8px 0; color: #2d3748;">${jobTitle}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Date:</td>
                  <td style="padding: 8px 0; color: #2d3748; font-weight: bold;">${scheduledDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Time:</td>
                  <td style="padding: 8px 0; color: #2d3748; font-weight: bold;">${scheduledTime}</td>
                </tr>
                ${locationAddress ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555; vertical-align: top;">Location:</td>
                  <td style="padding: 8px 0; color: #2d3748;">${locationAddress}</td>
                </tr>
                ` : ''}
              </table>
            </div>

            <p style="font-size: 16px; margin-top: 30px;">
              Please ensure someone is available at the scheduled time. If you need to reschedule or have any questions, please contact us as soon as possible.
            </p>

            <p style="font-size: 16px; margin-top: 20px;">
              We appreciate your business and look forward to serving you!
            </p>

            <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e0e0e0;">
              <p style="font-size: 16px; margin-bottom: 5px;"><strong>${senderName}</strong></p>
              <p style="font-size: 14px; color: #666; margin: 5px 0;">${businessName}</p>
              ${businessPhone ? `<p style="font-size: 14px; color: #666; margin: 5px 0;">📞 ${businessPhone}</p>` : ''}
              ${businessEmail ? `<p style="font-size: 14px; color: #666; margin: 5px 0;">✉️ ${businessEmail}</p>` : ''}
            </div>
          </div>

          <div style="text-align: center; margin-top: 30px; padding: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} ${businessName}. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `
${businessName}
Appointment Confirmed ✓

Dear ${recipientName},

Your appointment has been confirmed! We're looking forward to serving you.

APPOINTMENT DETAILS
-------------------
Job Number: ${jobNumber}
Service: ${jobTitle}
Date: ${scheduledDate}
Time: ${scheduledTime}
${locationAddress ? `Location: ${locationAddress}` : ''}

Please ensure someone is available at the scheduled time. If you need to reschedule or have any questions, please contact us as soon as possible.

We appreciate your business and look forward to serving you!

${senderName}
${businessName}
${businessPhone ? `Phone: ${businessPhone}` : ''}
${businessEmail ? `Email: ${businessEmail}` : ''}

© ${new Date().getFullYear()} ${businessName}. All rights reserved.
    `.trim()
  };
}

export function getInvoiceSentTemplate(params: EmailTemplateParams): { subject: string; html: string; text: string } {
  const { 
    businessName = 'Smart Website',
    senderName = 'Team',
    recipientName = 'Valued Customer',
    invoiceNumber = 'INV-0000',
    invoiceTotal = 'R0.00',
    dueDate = 'TBD',
    invoiceViewLink = '#',
    businessPhone = '',
    businessEmail = ''
  } = params;

  return {
    subject: `Invoice ${invoiceNumber} from ${businessName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Invoice</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">${businessName}</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Invoice for Services</p>
          </div>

          <div style="background: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Dear ${recipientName},</p>

            <p style="font-size: 16px; margin-bottom: 20px;">
              Thank you for choosing ${businessName}. Please find your invoice details below.
            </p>

            <div style="background: #fffbeb; padding: 25px; border-left: 4px solid #f59e0b; border-radius: 4px; margin: 30px 0;">
              <h3 style="margin-top: 0; color: #d97706; font-size: 18px;">Invoice Summary</h3>
              <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Invoice Number:</td>
                  <td style="padding: 8px 0; text-align: right; color: #d97706; font-weight: bold;">${invoiceNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Amount Due:</td>
                  <td style="padding: 8px 0; text-align: right; font-size: 24px; color: #2d3748; font-weight: bold;">${invoiceTotal}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Due Date:</td>
                  <td style="padding: 8px 0; text-align: right; color: #dc2626; font-weight: bold;">${dueDate}</td>
                </tr>
              </table>
            </div>

            <div style="text-align: center; margin: 35px 0;">
              <a href="${invoiceViewLink}" 
                 style="background: #f59e0b; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
                View & Pay Invoice
              </a>
            </div>

            <div style="background: #f3f4f6; padding: 20px; border-radius: 6px; margin-top: 30px;">
              <p style="font-size: 14px; color: #555; margin: 0;">
                <strong>Payment Instructions:</strong><br>
                Please settle this invoice by the due date. Click the button above to view full details and payment options.
              </p>
            </div>

            <p style="font-size: 16px; margin-top: 30px;">
              If you have any questions about this invoice or need to arrange alternative payment terms, please contact us immediately.
            </p>

            <p style="font-size: 16px; margin-top: 20px;">
              Thank you for your business!
            </p>

            <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e0e0e0;">
              <p style="font-size: 16px; margin-bottom: 5px;"><strong>${senderName}</strong></p>
              <p style="font-size: 14px; color: #666; margin: 5px 0;">${businessName}</p>
              ${businessPhone ? `<p style="font-size: 14px; color: #666; margin: 5px 0;">📞 ${businessPhone}</p>` : ''}
              ${businessEmail ? `<p style="font-size: 14px; color: #666; margin: 5px 0;">✉️ ${businessEmail}</p>` : ''}
            </div>
          </div>

          <div style="text-align: center; margin-top: 30px; padding: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} ${businessName}. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `
${businessName}
Invoice for Services

Dear ${recipientName},

Thank you for choosing ${businessName}. Please find your invoice details below.

INVOICE SUMMARY
---------------
Invoice Number: ${invoiceNumber}
Amount Due: ${invoiceTotal}
Due Date: ${dueDate}

View and pay your invoice here: ${invoiceViewLink}

PAYMENT INSTRUCTIONS
Please settle this invoice by the due date. Click the link above to view full details and payment options.

If you have any questions about this invoice or need to arrange alternative payment terms, please contact us immediately.

Thank you for your business!

${senderName}
${businessName}
${businessPhone ? `Phone: ${businessPhone}` : ''}
${businessEmail ? `Email: ${businessEmail}` : ''}

© ${new Date().getFullYear()} ${businessName}. All rights reserved.
    `.trim()
  };
}

export function getInvoiceReminderTemplate(params: EmailTemplateParams & { daysOverdue: number }): { subject: string; html: string; text: string } {
  const { 
    businessName = 'Smart Website',
    senderName = 'Team',
    recipientName = 'Valued Customer',
    invoiceNumber = 'INV-0000',
    invoiceTotal = 'R0.00',
    dueDate = 'TBD',
    daysOverdue = 0,
    invoiceViewLink = '#',
    businessPhone = '',
    businessEmail = ''
  } = params;

  return {
    subject: `Payment Reminder: Invoice ${invoiceNumber} - ${daysOverdue} Days Overdue`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Reminder</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #DC2626 0%, #991B1B 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">⚠️ Payment Reminder</h1>
          </div>

          <div style="background: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Dear ${recipientName},</p>

            <p style="font-size: 16px; margin-bottom: 20px;">
              This is a friendly reminder that invoice <strong>${invoiceNumber}</strong> is now <strong style="color: #DC2626;">${daysOverdue} days overdue</strong>.
            </p>

            <div style="background: #FEE2E2; padding: 25px; border-left: 4px solid #DC2626; border-radius: 4px; margin: 30px 0;">
              <h3 style="margin-top: 0; color: #991B1B; font-size: 18px;">Invoice Details</h3>
              <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Invoice Number:</td>
                  <td style="padding: 8px 0; text-align: right; color: #DC2626; font-weight: bold;">${invoiceNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Original Due Date:</td>
                  <td style="padding: 8px 0; text-align: right; color: #666;">${dueDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Amount Due:</td>
                  <td style="padding: 8px 0; text-align: right; font-size: 24px; color: #DC2626; font-weight: bold;">${invoiceTotal}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Days Overdue:</td>
                  <td style="padding: 8px 0; text-align: right; font-size: 18px; color: #DC2626; font-weight: bold;">${daysOverdue} days</td>
                </tr>
              </table>
            </div>

            <div style="text-align: center; margin: 35px 0;">
              <a href="${invoiceViewLink}" 
                 style="background: #DC2626; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
                View & Pay Invoice Now
              </a>
            </div>

            <div style="background: #FEF3C7; padding: 20px; border-radius: 6px; margin-top: 30px; border: 1px solid #F59E0B;">
              <p style="font-size: 14px; color: #92400E; margin: 0;">
                <strong>⚡ Immediate Action Required:</strong><br>
                Please arrange payment at your earliest convenience. If you have already sent payment, please disregard this notice.
              </p>
            </div>

            <p style="font-size: 16px; margin-top: 30px;">
              If you have any questions or need to discuss payment arrangements, please contact us immediately.
            </p>

            <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e0e0e0;">
              <p style="font-size: 16px; margin-bottom: 5px;"><strong>${senderName}</strong></p>
              <p style="font-size: 14px; color: #666; margin: 5px 0;">${businessName}</p>
              ${businessPhone ? `<p style="font-size: 14px; color: #666; margin: 5px 0;">📞 ${businessPhone}</p>` : ''}
              ${businessEmail ? `<p style="font-size: 14px; color: #666; margin: 5px 0;">✉️ ${businessEmail}</p>` : ''}
            </div>
          </div>

          <div style="text-align: center; margin-top: 30px; padding: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} ${businessName}. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `
⚠️ PAYMENT REMINDER

Dear ${recipientName},

Invoice ${invoiceNumber} is now ${daysOverdue} days overdue.

INVOICE DETAILS
---------------
Invoice Number: ${invoiceNumber}
Original Due Date: ${dueDate}
Amount Due: ${invoiceTotal}
Days Overdue: ${daysOverdue} days

⚡ IMMEDIATE ACTION REQUIRED
Please arrange payment at your earliest convenience. If you have already sent payment, please disregard this notice.

View and pay your invoice here: ${invoiceViewLink}

If you have any questions or need to discuss payment arrangements, please contact us immediately.

${senderName}
${businessName}
${businessPhone ? `Phone: ${businessPhone}` : ''}
${businessEmail ? `Email: ${businessEmail}` : ''}

© ${new Date().getFullYear()} ${businessName}. All rights reserved.
    `.trim()
  };
}


export function getEmailVerifiedWelcomeTemplate(params: EmailTemplateParams): { subject: string; html: string; text: string } {
  const { businessName = 'Smart Website', recipientName = 'there' } = params;

  return {
    subject: 'Welcome! Your Email is Verified',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Email Verified!</h1>
          </div>

          <div style="background: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hi ${recipientName},</p>

            <p style="font-size: 16px; margin-bottom: 20px;">
              Great news! Your email has been successfully verified. You're all set to start using ${businessName}.
            </p>

            <p style="font-size: 16px; margin-bottom: 20px;">
              Next step: Complete your business profile to unlock all features and start managing your business more efficiently.
            </p>

            <p style="font-size: 16px; margin-top: 20px;">
              Welcome aboard!
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} ${businessName}. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `
🎉 Email Verified!

Hi ${recipientName},

Great news! Your email has been successfully verified. You're all set to start using ${businessName}.

Next step: Complete your business profile to unlock all features and start managing your business more efficiently.

Welcome aboard!

© ${new Date().getFullYear()} ${businessName}. All rights reserved.
    `.trim()
  };
}

export function getBusinessOnboardingWelcomeTemplate(params: EmailTemplateParams): { subject: string; html: string; text: string } {
  const { businessName = 'Smart Website', recipientName = 'there' } = params;

  return {
    subject: 'Welcome! Your Business is All Set',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🚀 Your Business is Ready!</h1>
          </div>

          <div style="background: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hi ${recipientName},</p>

            <p style="font-size: 16px; margin-bottom: 20px;">
              Congratulations! Your business profile has been successfully set up on ${businessName}.
            </p>

            <p style="font-size: 16px; margin-bottom: 20px;">
              You can now:
            </p>

            <ul style="font-size: 16px; margin-bottom: 20px;">
              <li>Manage contacts and leads</li>
              <li>Create and send professional quotes</li>
              <li>Schedule jobs and appointments</li>
              <li>Track invoices and payments</li>
              <li>Build your online presence</li>
            </ul>

            <p style="font-size: 16px; margin-top: 20px;">
              Let's get started and grow your business together!
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} ${businessName}. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `
🚀 Your Business is Ready!

Hi ${recipientName},

Congratulations! Your business profile has been successfully set up on ${businessName}.

You can now:
- Manage contacts and leads
- Create and send professional quotes
- Schedule jobs and appointments
- Track invoices and payments
- Build your online presence

Let's get started and grow your business together!

© ${new Date().getFullYear()} ${businessName}. All rights reserved.
    `.trim()
  };
}

export function getPasswordResetConfirmationTemplate(params: EmailTemplateParams): { subject: string; html: string; text: string } {
  const { businessName = 'Smart Website', recipientName = 'there' } = params;

  return {
    subject: 'Password Successfully Changed',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🔒 Password Changed</h1>
          </div>

          <div style="background: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hi ${recipientName},</p>

            <p style="font-size: 16px; margin-bottom: 20px;">
              Your password has been successfully changed. You can now log in with your new password.
            </p>

            <div style="background: #FEF3C7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #F59E0B;">
              <p style="margin: 0; font-size: 14px; color: #92400E;">
                <strong>Security Tip:</strong> If you didn't make this change, please contact our support team immediately.
              </p>
            </div>

            <p style="font-size: 16px; margin-top: 20px;">
              Thank you for keeping your account secure.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} ${businessName}. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `
🔒 Password Changed

Hi ${recipientName},

Your password has been successfully changed. You can now log in with your new password.

Security Tip: If you didn't make this change, please contact our support team immediately.

Thank you for keeping your account secure.

© ${new Date().getFullYear()} ${businessName}. All rights reserved.
    `.trim()
  };
}

export function getPaymentReceiptTemplate(params: EmailTemplateParams & { paymentMethod?: string; pdfReceiptUrl?: string }): { subject: string; html: string; text: string } {
  const { 
    businessName = 'Smart Website',
    senderName = 'Team',
    recipientName = 'Valued Customer',
    invoiceNumber = 'INV-0000',
    invoiceTotal = 'R0.00',
    paymentMethod = 'Not specified',
    invoiceViewLink = '#',
    businessPhone = '',
    businessEmail = ''
  } = params;

  return {
    subject: `Payment Receipt - Invoice ${invoiceNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">✅ Payment Received</h1>
          </div>

          <div style="background: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Dear ${recipientName},</p>

            <p style="font-size: 16px; margin-bottom: 20px;">
              Thank you! We've received your payment for invoice ${invoiceNumber}.
            </p>

            <div style="background: #F0FDF4; padding: 25px; border-left: 4px solid #10b981; border-radius: 4px; margin: 30px 0;">
              <h3 style="margin-top: 0; color: #059669; font-size: 18px;">Payment Details</h3>
              <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Invoice Number:</td>
                  <td style="padding: 8px 0; color: #2d3748;">${invoiceNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Amount Paid:</td>
                  <td style="padding: 8px 0; font-size: 20px; color: #10b981; font-weight: bold;">${invoiceTotal}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Payment Method:</td>
                  <td style="padding: 8px 0; color: #2d3748;">${paymentMethod}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Status:</td>
                  <td style="padding: 8px 0; color: #10b981; font-weight: bold;">PAID</td>
                </tr>
              </table>
            </div>

            <div style="text-align: center; margin: 35px 0;">
              <a href="${invoiceViewLink}" 
                 style="background: #10b981; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
                View Receipt
              </a>
            </div>

            <p style="font-size: 16px; margin-top: 30px;">
              Thank you for your business!
            </p>

            <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e0e0e0;">
              <p style="font-size: 16px; margin-bottom: 5px;"><strong>${senderName}</strong></p>
              <p style="font-size: 14px; color: #666; margin: 5px 0;">${businessName}</p>
              ${businessPhone ? `<p style="font-size: 14px; color: #666; margin: 5px 0;">📞 ${businessPhone}</p>` : ''}
              ${businessEmail ? `<p style="font-size: 14px; color: #666; margin: 5px 0;">✉️ ${businessEmail}</p>` : ''}
            </div>
          </div>

          <div style="text-align: center; margin-top: 30px; padding: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} ${businessName}. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `
✅ Payment Received

Dear ${recipientName},

Thank you! We've received your payment for invoice ${invoiceNumber}.

PAYMENT DETAILS
---------------
Invoice Number: ${invoiceNumber}
Amount Paid: ${invoiceTotal}
Payment Method: ${paymentMethod}
Status: PAID

View your receipt here: ${invoiceViewLink}

Thank you for your business!

${senderName}
${businessName}
${businessPhone ? `Phone: ${businessPhone}` : ''}
${businessEmail ? `Email: ${businessEmail}` : ''}

© ${new Date().getFullYear()} ${businessName}. All rights reserved.
    `.trim()
  };
}

export function getDepositInvoiceSentTemplate(params: EmailTemplateParams & { depositAmount: string; jobNumber: string; depositDeadline: string }): { subject: string; html: string; text: string } {
  const {
    businessName = 'Smart Website',
    senderName = 'Team',
    recipientName = 'Valued Customer',
    invoiceNumber = 'INV-0000',
    depositAmount = 'R0.00',
    jobNumber = 'JOB-0000',
    depositDeadline = 'TBD',
    invoiceViewLink = '#',
    businessPhone = '',
    businessEmail = ''
  } = params;

  return {
    subject: `Pay Your R${depositAmount} Deposit to Confirm Booking - ${invoiceNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">💰 Deposit Required</h1>
          </div>

          <div style="background: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Dear ${recipientName},</p>

            <p style="font-size: 16px; margin-bottom: 20px;">
              To confirm your booking (${jobNumber}), please pay the required deposit by <strong>${depositDeadline}</strong>.
            </p>

            <div style="background: #fffbeb; padding: 25px; border-left: 4px solid #f59e0b; border-radius: 4px; margin: 30px 0;">
              <h3 style="margin-top: 0; color: #d97706; font-size: 18px;">Deposit Payment Details</h3>
              <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Invoice Number:</td>
                  <td style="padding: 8px 0; text-align: right; color: #d97706; font-weight: bold;">${invoiceNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Deposit Amount:</td>
                  <td style="padding: 8px 0; text-align: right; font-size: 24px; color: #2d3748; font-weight: bold;">${depositAmount}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Due By:</td>
                  <td style="padding: 8px 0; text-align: right; color: #dc2626; font-weight: bold;">${depositDeadline}</td>
                </tr>
              </table>
            </div>

            <div style="text-align: center; margin: 35px 0;">
              <a href="${invoiceViewLink}" 
                 style="background: #f59e0b; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
                Pay Deposit Now
              </a>
            </div>

            <div style="background: #fee2e2; padding: 20px; border-radius: 6px; margin-top: 30px; border: 1px solid #dc2626;">
              <p style="font-size: 14px; color: #991b1b; margin: 0;">
                <strong>⚠️ Important:</strong> Your booking will be cancelled if the deposit is not received by the deadline.
              </p>
            </div>

            <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e0e0e0;">
              <p style="font-size: 16px; margin-bottom: 5px;"><strong>${senderName}</strong></p>
              <p style="font-size: 14px; color: #666; margin: 5px 0;">${businessName}</p>
              ${businessPhone ? `<p style="font-size: 14px; color: #666; margin: 5px 0;">📞 ${businessPhone}</p>` : ''}
              ${businessEmail ? `<p style="font-size: 14px; color: #666; margin: 5px 0;">✉️ ${businessEmail}</p>` : ''}
            </div>
          </div>

          <div style="text-align: center; margin-top: 30px; padding: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} ${businessName}. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `
💰 Deposit Required

Dear ${recipientName},

To confirm your booking (${jobNumber}), please pay the required deposit by ${depositDeadline}.

DEPOSIT PAYMENT DETAILS:
- Invoice Number: ${invoiceNumber}
- Deposit Amount: ${depositAmount}
- Due By: ${depositDeadline}

Pay your deposit here: ${invoiceViewLink}

⚠️ IMPORTANT: Your booking will be cancelled if the deposit is not received by the deadline.

${senderName}
${businessName}
${businessPhone ? `Phone: ${businessPhone}` : ''}
${businessEmail ? `Email: ${businessEmail}` : ''}

© ${new Date().getFullYear()} ${businessName}. All rights reserved.
    `.trim()
  };
}

export function getDepositReminderTemplate(params: EmailTemplateParams & { depositAmount: string; jobNumber: string; hoursRemaining: number }): { subject: string; html: string; text: string } {
  const {
    businessName = 'Smart Website',
    senderName = 'Team',
    recipientName = 'Valued Customer',
    invoiceNumber = 'INV-0000',
    depositAmount = 'R0.00',
    jobNumber = 'JOB-0000',
    hoursRemaining = 24,
    invoiceViewLink = '#',
    businessPhone = '',
    businessEmail = ''
  } = params;

  const urgency = hoursRemaining <= 24 ? 'URGENT' : 'REMINDER';
  const urgencyColor = hoursRemaining <= 24 ? '#dc2626' : '#f59e0b';

  return {
    subject: `${urgency}: Deposit Due in ${hoursRemaining} Hours - ${invoiceNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, ${urgencyColor} 0%, #991b1b 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">⏰ ${urgency}: Deposit Due Soon</h1>
          </div>

          <div style="background: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Dear ${recipientName},</p>

            <p style="font-size: 16px; margin-bottom: 20px;">
              This is a ${hoursRemaining <= 24 ? 'final' : 'friendly'} reminder that your deposit payment is due in <strong style="color: ${urgencyColor};">${hoursRemaining} hours</strong>.
            </p>

            <div style="background: #fee2e2; padding: 25px; border-left: 4px solid ${urgencyColor}; border-radius: 4px; margin: 30px 0;">
              <h3 style="margin-top: 0; color: #991b1b; font-size: 18px;">Payment Due</h3>
              <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Booking:</td>
                  <td style="padding: 8px 0; text-align: right; color: #2d3748;">${jobNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Deposit Amount:</td>
                  <td style="padding: 8px 0; text-align: right; font-size: 24px; color: ${urgencyColor}; font-weight: bold;">${depositAmount}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Time Remaining:</td>
                  <td style="padding: 8px 0; text-align: right; font-size: 18px; color: ${urgencyColor}; font-weight: bold;">${hoursRemaining} hours</td>
                </tr>
              </table>
            </div>

            <div style="text-align: center; margin: 35px 0;">
              <a href="${invoiceViewLink}" 
                 style="background: ${urgencyColor}; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
                Pay Deposit Now
              </a>
            </div>

            <div style="background: #fef3c7; padding: 20px; border-radius: 6px; margin-top: 30px; border: 1px solid #f59e0b;">
              <p style="font-size: 14px; color: #92400e; margin: 0;">
                <strong>⚡ Action Required:</strong> If payment is not received within ${hoursRemaining} hours, your booking will be automatically cancelled.
              </p>
            </div>

            <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e0e0e0;">
              <p style="font-size: 16px; margin-bottom: 5px;"><strong>${senderName}</strong></p>
              <p style="font-size: 14px; color: #666; margin: 5px 0;">${businessName}</p>
              ${businessPhone ? `<p style="font-size: 14px; color: #666; margin: 5px 0;">📞 ${businessPhone}</p>` : ''}
              ${businessEmail ? `<p style="font-size: 14px; color: #666; margin: 5px 0;">✉️ ${businessEmail}</p>` : ''}
            </div>
          </div>

          <div style="text-align: center; margin-top: 30px; padding: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} ${businessName}. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `
⏰ ${urgency}: Deposit Due in ${hoursRemaining} Hours

Dear ${recipientName},

This is a ${hoursRemaining <= 24 ? 'final' : 'friendly'} reminder that your deposit payment is due in ${hoursRemaining} hours.

PAYMENT DUE:
- Booking: ${jobNumber}
- Deposit Amount: ${depositAmount}
- Time Remaining: ${hoursRemaining} hours

Pay your deposit here: ${invoiceViewLink}

⚡ ACTION REQUIRED: If payment is not received within ${hoursRemaining} hours, your booking will be automatically cancelled.

${senderName}
${businessName}
${businessPhone ? `Phone: ${businessPhone}` : ''}
${businessEmail ? `Email: ${businessEmail}` : ''}

© ${new Date().getFullYear()} ${businessName}. All rights reserved.
    `.trim()
  };
}

export function getDepositReceivedTemplate(params: EmailTemplateParams & { depositAmount: string; jobNumber: string; balanceDue: string }): { subject: string; html: string; text: string } {
  const {
    businessName = 'Smart Website',
    senderName = 'Team',
    recipientName = 'Valued Customer',
    depositAmount = 'R0.00',
    jobNumber = 'JOB-0000',
    balanceDue = 'R0.00',
    scheduledDate = 'TBD',
    scheduledTime = 'TBD',
    businessPhone = '',
    businessEmail = ''
  } = params;

  return {
    subject: `✅ Deposit Confirmed - Your Booking is Secured (${jobNumber})`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">✅ Deposit Confirmed!</h1>
          </div>

          <div style="background: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Dear ${recipientName},</p>

            <p style="font-size: 16px; margin-bottom: 20px;">
              Great news! We've received your deposit payment of <strong>${depositAmount}</strong>. Your booking is now confirmed and secured.
            </p>

            <div style="background: #f0fdf4; padding: 25px; border-left: 4px solid #10b981; border-radius: 4px; margin: 30px 0;">
              <h3 style="margin-top: 0; color: #059669; font-size: 18px;">Booking Confirmed</h3>
              <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Booking Number:</td>
                  <td style="padding: 8px 0; text-align: right; color: #2d3748; font-weight: bold;">${jobNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Deposit Paid:</td>
                  <td style="padding: 8px 0; text-align: right; font-size: 20px; color: #10b981; font-weight: bold;">${depositAmount}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Balance Due:</td>
                  <td style="padding: 8px 0; text-align: right; font-size: 20px; color: #2d3748; font-weight: bold;">${balanceDue}</td>
                </tr>
                ${scheduledDate !== 'TBD' ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Scheduled:</td>
                  <td style="padding: 8px 0; text-align: right; color: #2d3748;">${scheduledDate} at ${scheduledTime}</td>
                </tr>
                ` : ''}
              </table>
            </div>

            <div style="background: #fffbeb; padding: 20px; border-radius: 6px; margin-top: 30px; border: 1px solid #f59e0b;">
              <p style="font-size: 14px; color: #92400e; margin: 0;">
                <strong>ℹ️ Next Steps:</strong> The remaining balance of ${balanceDue} will be due upon completion of the work.
              </p>
            </div>

            <p style="font-size: 16px; margin-top: 30px;">
              We look forward to serving you!
            </p>

            <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e0e0e0;">
              <p style="font-size: 16px; margin-bottom: 5px;"><strong>${senderName}</strong></p>
              <p style="font-size: 14px; color: #666; margin: 5px 0;">${businessName}</p>
              ${businessPhone ? `<p style="font-size: 14px; color: #666; margin: 5px 0;">📞 ${businessPhone}</p>` : ''}
              ${businessEmail ? `<p style="font-size: 14px; color: #666; margin: 5px 0;">✉️ ${businessEmail}</p>` : ''}
            </div>
          </div>

          <div style="text-align: center; margin-top: 30px; padding: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} ${businessName}. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `
✅ Deposit Confirmed!

Dear ${recipientName},

Great news! We've received your deposit payment of ${depositAmount}. Your booking is now confirmed and secured.

BOOKING CONFIRMED:
- Booking Number: ${jobNumber}
- Deposit Paid: ${depositAmount}
- Balance Due: ${balanceDue}
${scheduledDate !== 'TBD' ? `- Scheduled: ${scheduledDate} at ${scheduledTime}` : ''}

ℹ️ NEXT STEPS: The remaining balance of ${balanceDue} will be due upon completion of the work.

We look forward to serving you!

${senderName}
${businessName}
${businessPhone ? `Phone: ${businessPhone}` : ''}
${businessEmail ? `Email: ${businessEmail}` : ''}

© ${new Date().getFullYear()} ${businessName}. All rights reserved.
    `.trim()
  };
}

export function getDepositCancelledTemplate(params: EmailTemplateParams & { jobNumber: string; reason: 'auto' | 'manual'; cancellationReason?: string }): { subject: string; html: string; text: string } {
  const {
    businessName = 'Smart Website',
    senderName = 'Team',
    recipientName = 'Valued Customer',
    jobNumber = 'JOB-0000',
    reason = 'auto',
    cancellationReason = '',
    businessPhone = '',
    businessEmail = ''
  } = params;

  const isAuto = reason === 'auto';

  return {
    subject: `Booking Cancelled - ${jobNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">❌ Booking Cancelled</h1>
          </div>

          <div style="background: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Dear ${recipientName},</p>

            <p style="font-size: 16px; margin-bottom: 20px;">
              ${isAuto 
                ? 'Your booking has been automatically cancelled because the required deposit was not received by the deadline.'
                : `Your booking has been cancelled. ${cancellationReason ? `Reason: ${cancellationReason}` : ''}`
              }
            </p>

            <div style="background: #fee2e2; padding: 25px; border-left: 4px solid #dc2626; border-radius: 4px; margin: 30px 0;">
              <h3 style="margin-top: 0; color: #991b1b; font-size: 18px;">Cancellation Details</h3>
              <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Booking Number:</td>
                  <td style="padding: 8px 0; text-align: right; color: #2d3748;">${jobNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Reason:</td>
                  <td style="padding: 8px 0; text-align: right; color: #dc2626;">${isAuto ? 'Deposit Not Received' : 'Cancelled by Business'}</td>
                </tr>
              </table>
            </div>

            ${isAuto ? `
            <div style="background: #f0fdf4; padding: 20px; border-radius: 6px; margin-top: 30px; border: 1px solid #10b981;">
              <p style="font-size: 14px; color: #065f46; margin: 0;">
                <strong>💡 Want to Reschedule?</strong> We'd love to work with you. Please contact us to discuss a new booking.
              </p>
            </div>
            ` : ''}

            <p style="font-size: 16px; margin-top: 30px;">
              If you have any questions, please don't hesitate to contact us.
            </p>

            <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e0e0e0;">
              <p style="font-size: 16px; margin-bottom: 5px;"><strong>${senderName}</strong></p>
              <p style="font-size: 14px; color: #666; margin: 5px 0;">${businessName}</p>
              ${businessPhone ? `<p style="font-size: 14px; color: #666; margin: 5px 0;">📞 ${businessPhone}</p>` : ''}
              ${businessEmail ? `<p style="font-size: 14px; color: #666; margin: 5px 0;">✉️ ${businessEmail}</p>` : ''}
            </div>
          </div>

          <div style="text-align: center; margin-top: 30px; padding: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} ${businessName}. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `
❌ Booking Cancelled

Dear ${recipientName},

${isAuto 
  ? 'Your booking has been automatically cancelled because the required deposit was not received by the deadline.'
  : `Your booking has been cancelled. ${cancellationReason ? `Reason: ${cancellationReason}` : ''}`
}

CANCELLATION DETAILS:
- Booking Number: ${jobNumber}
- Reason: ${isAuto ? 'Deposit Not Received' : 'Cancelled by Business'}

${isAuto ? '💡 WANT TO RESCHEDULE? We\'d love to work with you. Please contact us to discuss a new booking.' : ''}

If you have any questions, please don't hesitate to contact us.

${senderName}
${businessName}
${businessPhone ? `Phone: ${businessPhone}` : ''}
${businessEmail ? `Email: ${businessEmail}` : ''}

© ${new Date().getFullYear()} ${businessName}. All rights reserved.
    `.trim()
  };
}

export function getFinalInvoiceWithCreditTemplate(params: EmailTemplateParams & { depositAmount: string; totalAmount: string; balanceDue: string }): { subject: string; html: string; text: string } {
  const {
    businessName = 'Smart Website',
    senderName = 'Team',
    recipientName = 'Valued Customer',
    invoiceNumber = 'INV-0000',
    depositAmount = 'R0.00',
    totalAmount = 'R0.00',
    balanceDue = 'R0.00',
    dueDate = 'TBD',
    invoiceViewLink = '#',
    businessPhone = '',
    businessEmail = ''
  } = params;

  return {
    subject: `Final Invoice ${invoiceNumber} - Deposit Applied`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">📄 Final Invoice</h1>
          </div>

          <div style="background: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Dear ${recipientName},</p>

            <p style="font-size: 16px; margin-bottom: 20px;">
              Thank you for choosing ${businessName}! Here's your final invoice with your deposit credit applied.
            </p>

            <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin: 30px 0;">
              <h3 style="margin-top: 0; color: #667eea; font-size: 18px;">Invoice Summary</h3>
              <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Invoice Number:</td>
                  <td style="padding: 8px 0; text-align: right; color: #667eea; font-weight: bold;">${invoiceNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #555;">Total Amount:</td>
                  <td style="padding: 8px 0; text-align: right; color: #2d3748;">${totalAmount}</td>
                </tr>
                <tr style="border-top: 1px solid #e0e0e0;">
                  <td style="padding: 8px 0; color: #10b981; font-weight: bold;">Deposit Credit:</td>
                  <td style="padding: 8px 0; text-align: right; color: #10b981; font-weight: bold;">-${depositAmount}</td>
                </tr>
                <tr style="border-top: 2px solid #667eea;">
                  <td style="padding: 12px 0; font-weight: bold; color: #555; font-size: 18px;">Balance Due:</td>
                  <td style="padding: 12px 0; text-align: right; font-size: 24px; color: #667eea; font-weight: bold;">${balanceDue}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Due Date:</td>
                  <td style="padding: 8px 0; text-align: right; color: #dc2626; font-weight: bold;">${dueDate}</td>
                </tr>
              </table>
            </div>

            <div style="text-align: center; margin: 35px 0;">
              <a href="${invoiceViewLink}" 
                 style="background: #667eea; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
                View & Pay Invoice
              </a>
            </div>

            <div style="background: #f0fdf4; padding: 20px; border-radius: 6px; margin-top: 30px; border: 1px solid #10b981;">
              <p style="font-size: 14px; color: #065f46; margin: 0;">
                <strong>✅ Deposit Applied:</strong> Your ${depositAmount} deposit has been credited to this invoice. Thank you for your payment!
              </p>
            </div>

            <p style="font-size: 16px; margin-top: 30px;">
              Thank you for your business!
            </p>

            <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e0e0e0;">
              <p style="font-size: 16px; margin-bottom: 5px;"><strong>${senderName}</strong></p>
              <p style="font-size: 14px; color: #666; margin: 5px 0;">${businessName}</p>
              ${businessPhone ? `<p style="font-size: 14px; color: #666; margin: 5px 0;">📞 ${businessPhone}</p>` : ''}
              ${businessEmail ? `<p style="font-size: 14px; color: #666; margin: 5px 0;">✉️ ${businessEmail}</p>` : ''}
            </div>
          </div>

          <div style="text-align: center; margin-top: 30px; padding: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} ${businessName}. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `
📄 Final Invoice

Dear ${recipientName},

Thank you for choosing ${businessName}! Here's your final invoice with your deposit credit applied.

INVOICE SUMMARY:
- Invoice Number: ${invoiceNumber}
- Total Amount: ${totalAmount}
- Deposit Credit: -${depositAmount}
- Balance Due: ${balanceDue}
- Due Date: ${dueDate}

View and pay your invoice here: ${invoiceViewLink}

✅ DEPOSIT APPLIED: Your ${depositAmount} deposit has been credited to this invoice. Thank you for your payment!

${senderName}
${businessName}
${businessPhone ? `Phone: ${businessPhone}` : ''}
${businessEmail ? `Email: ${businessEmail}` : ''}

© ${new Date().getFullYear()} ${businessName}. All rights reserved.
    `.trim()
  };
}

export function getQuoteVisitConfirmationTemplate(params: EmailTemplateParams): { subject: string; html: string; text: string } {
  const { businessName, recipientName, quoteNumber, visitDate, visitTime, businessPhone, businessEmail, locationAddress } = params;

  return {
    subject: `Site Visit Confirmed - ${quoteNumber || 'Quote'} - ${businessName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Site Visit Confirmed</h1>
          </div>

          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hi ${recipientName},</p>

            <p style="font-size: 16px; margin-bottom: 20px;">
              Your site visit has been confirmed! We're looking forward to meeting with you.
            </p>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h2 style="margin-top: 0; color: #667eea; font-size: 20px;">Appointment Details</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; width: 40%;">Quote Number:</td>
                  <td style="padding: 8px 0;">${quoteNumber || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Date:</td>
                  <td style="padding: 8px 0;">${visitDate || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Time:</td>
                  <td style="padding: 8px 0;">${visitTime || 'N/A'}</td>
                </tr>
                ${locationAddress ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Location:</td>
                  <td style="padding: 8px 0;">${locationAddress}</td>
                </tr>
                ` : ''}
              </table>
            </div>

            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <p style="margin: 0; font-size: 14px;">
                <strong>Important:</strong> Please ensure someone is available at the scheduled time. If you need to reschedule, please contact us as soon as possible.
              </p>
            </div>

            <h3 style="color: #333; font-size: 18px; margin-top: 30px;">Need to Contact Us?</h3>
            <p style="font-size: 14px; margin: 10px 0;">
              📞 Phone: ${businessPhone || 'N/A'}<br>
              ✉️ Email: ${businessEmail || 'N/A'}
            </p>

            <p style="font-size: 16px; margin-top: 30px;">
              Thank you for choosing ${businessName}!
            </p>

            <p style="font-size: 14px; color: #666; margin-top: 20px;">
              Best regards,<br>
              <strong>${businessName}</strong>
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} ${businessName}. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `
Site Visit Confirmed

Hi ${recipientName},

Your site visit has been confirmed! We're looking forward to meeting with you.

APPOINTMENT DETAILS:
- Quote Number: ${quoteNumber || 'N/A'}
- Date: ${visitDate || 'N/A'}
- Time: ${visitTime || 'N/A'}
${locationAddress ? `- Location: ${locationAddress}` : ''}

IMPORTANT: Please ensure someone is available at the scheduled time. If you need to reschedule, please contact us as soon as possible.

NEED TO CONTACT US?
Phone: ${businessPhone || 'N/A'}
Email: ${businessEmail || 'N/A'}

Thank you for choosing ${businessName}!

Best regards,
${businessName}

© ${new Date().getFullYear()} ${businessName}. All rights reserved.
    `.trim()
  };
}