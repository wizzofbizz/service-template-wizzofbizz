
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSid || !authToken) {
  console.error('❌ Missing Twilio credentials. Please add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to Secrets.');
  process.exit(1);
}

const client = twilio(accountSid, authToken);

interface TemplateSubmission {
  friendlyName: string;
  language: string;
  variables: string[];
  body: string;
}

const templates: TemplateSubmission[] = [
  {
    friendlyName: 'quote_sent_whatsapp',
    language: 'en',
    variables: ['{{1}}', '{{2}}', '{{3}}', '{{4}}', '{{5}}', '{{6}}'],
    body: 'Hi {{1}}, your quote {{2}} for {{3}} is ready! Total: {{4}}. View: {{5}}. Reply YES to accept. - {{6}}'
  },
  {
    friendlyName: 'job_scheduled_whatsapp',
    language: 'en',
    variables: ['{{1}}', '{{2}}', '{{3}}', '{{4}}', '{{5}}'],
    body: 'Appointment confirmed! {{1}} scheduled for {{2}} at {{3}}. Address: {{4}}. We look forward to serving you! - {{5}}'
  },
  {
    friendlyName: 'job_rescheduled_whatsapp',
    language: 'en',
    variables: ['{{1}}', '{{2}}', '{{3}}', '{{4}}', '{{5}}'],
    body: 'Your appointment {{1}} has been rescheduled to {{2}} at {{3}}. Address: {{4}}. Sorry for any inconvenience! - {{5}}'
  },
  {
    friendlyName: 'job_reminder_whatsapp',
    language: 'en',
    variables: ['{{1}}', '{{2}}', '{{3}}', '{{4}}', '{{5}}'],
    body: 'Reminder: Your appointment {{1}} is scheduled for {{2}} at {{3}}. Address: {{4}}. See you soon! - {{5}}'
  },
  {
    friendlyName: 'invoice_sent_whatsapp',
    language: 'en',
    variables: ['{{1}}', '{{2}}', '{{3}}', '{{4}}', '{{5}}', '{{6}}'],
    body: 'Invoice {{1}} for {{2}} is ready. Amount: {{3}}. Due: {{4}}. Pay here: {{5}} - {{6}}'
  },
  {
    friendlyName: 'payment_reminder_whatsapp',
    language: 'en',
    variables: ['{{1}}', '{{2}}', '{{3}}', '{{4}}', '{{5}}'],
    body: 'Payment reminder: Invoice {{1}} ({{2}}) is {{3}} days overdue. Please pay: {{4}} - {{5}}'
  }
];

async function submitTemplates() {
  console.log('📝 Starting WhatsApp template submission to Twilio/Meta...\n');

  for (const template of templates) {
    try {
      console.log(`Submitting template: ${template.friendlyName}...`);

      const contentTemplate = await client.content.v1.contents.create({
        friendlyName: template.friendlyName,
        language: template.language,
        types: {
          'twilio/text': {
            body: template.body
          }
        }
      });

      console.log(`✅ Template submitted successfully!`);
      console.log(`   - Template SID: ${contentTemplate.sid}`);
      console.log(`   - Status: Pending Meta approval (1-3 days)`);
      console.log('');
    } catch (error: any) {
      console.error(`❌ Failed to submit ${template.friendlyName}:`);
      console.error(`   - Error: ${error.message}`);
      console.log('');
    }
  }

  console.log('\n🎉 Template submission complete!');
  console.log('\n📋 Next Steps:');
  console.log('1. Wait 1-3 business days for Meta to approve templates');
  console.log('2. Check approval status in Twilio Console → Messaging → Content Templates');
  console.log('3. Once approved, you can start sending WhatsApp messages!\n');
}

submitTemplates()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
