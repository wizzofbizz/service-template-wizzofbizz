
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsOfServicePage() {
  const fontFamily = 'AxLLCircular, Helvetica, Arial, sans-serif';

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <h1 style={{ fontFamily, fontWeight: 600, fontSize: '36px' }} className="mb-8 text-gray-900">
          Terms of Service
        </h1>

        <div className="space-y-8" style={{ fontFamily, fontWeight: 400, fontSize: '16px', lineHeight: '28px' }}>
          <section>
            <p className="text-gray-600 mb-4">
              <strong>Effective Date:</strong> January 1, 2025
            </p>
            <p className="text-gray-600 mb-4">
              <strong>Last Updated:</strong> January 1, 2025
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily, fontWeight: 600, fontSize: '24px' }} className="mb-4 text-gray-900">
              1. Acceptance of Terms
            </h2>
            <p className="text-gray-600 mb-4">
              By accessing or using ServiceLoop ("Service," "Platform," "we," "our," or "us"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the Service.
            </p>
            <p className="text-gray-600 mb-4">
              These Terms constitute a legally binding agreement between you and ServiceLoop. By creating an account, you represent that you are at least 18 years old and have the legal capacity to enter into this agreement.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily, fontWeight: 600, fontSize: '24px' }} className="mb-4 text-gray-900">
              2. Description of Service
            </h2>
            <p className="text-gray-600 mb-4">
              ServiceLoop provides a software-as-a-service (SaaS) platform designed for South African service businesses to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Create and manage professional websites</li>
              <li>Generate and send quotes and invoices</li>
              <li>Manage customer contacts and relationships</li>
              <li>Schedule jobs and appointments</li>
              <li>Process payments and track financial records</li>
              <li>Communicate with customers via email and WhatsApp</li>
              <li>Manage Google Business Profile integration</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontFamily, fontWeight: 600, fontSize: '24px' }} className="mb-4 text-gray-900">
              3. Account Registration and Security
            </h2>
            
            <h3 style={{ fontFamily, fontWeight: 600, fontSize: '18px' }} className="mb-3 text-gray-900">
              3.1 Account Creation
            </h3>
            <p className="text-gray-600 mb-4">
              To use the Service, you must create an account by providing accurate, complete, and current information. You are responsible for:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized access or security breach</li>
            </ul>

            <h3 style={{ fontFamily, fontWeight: 600, fontSize: '18px' }} className="mb-3 text-gray-900">
              3.2 Email Verification
            </h3>
            <p className="text-gray-600 mb-4">
              You must verify your email address to activate your account. Failure to verify within 7 days may result in account suspension.
            </p>

            <h3 style={{ fontFamily, fontWeight: 600, fontSize: '18px' }} className="mb-3 text-gray-900">
              3.3 Account Termination
            </h3>
            <p className="text-gray-600 mb-4">
              We reserve the right to suspend or terminate your account if you violate these Terms or engage in fraudulent, illegal, or harmful activities.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily, fontWeight: 600, fontSize: '24px' }} className="mb-4 text-gray-900">
              4. Subscription Plans and Billing
            </h2>

            <h3 style={{ fontFamily, fontWeight: 600, fontSize: '18px' }} className="mb-3 text-gray-900">
              4.1 Free Trial
            </h3>
            <p className="text-gray-600 mb-4">
              New users receive a 14-day free trial. No credit card is required. After the trial period, you must select a paid plan to continue using the Service.
            </p>

            <h3 style={{ fontFamily, fontWeight: 600, fontSize: '18px' }} className="mb-3 text-gray-900">
              4.2 Subscription Plans
            </h3>
            <p className="text-gray-600 mb-4">
              We offer monthly and annual subscription plans:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li><strong>Starter Plan:</strong> R299/month - Basic features for small businesses</li>
              <li><strong>Professional Plan:</strong> R599/month - Advanced features including WhatsApp integration</li>
              <li><strong>Business Plan:</strong> R999/month - Full features including AI tools and premium support</li>
            </ul>
            <p className="text-gray-600 mb-4">
              Annual plans receive a 20% discount. Prices are in South African Rands (ZAR) and inclusive of VAT where applicable.
            </p>

            <h3 style={{ fontFamily, fontWeight: 600, fontSize: '18px' }} className="mb-3 text-gray-900">
              4.3 Payment Terms
            </h3>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Payments are processed through PayFast, our secure payment provider</li>
              <li>Subscriptions automatically renew at the end of each billing period</li>
              <li>You authorize us to charge your payment method on file</li>
              <li>Failed payments may result in service suspension after 7 days</li>
              <li>All fees are non-refundable except as required by law</li>
            </ul>

            <h3 style={{ fontFamily, fontWeight: 600, fontSize: '18px' }} className="mb-3 text-gray-900">
              4.4 Plan Changes and Cancellations
            </h3>
            <p className="text-gray-600 mb-4">
              You may upgrade, downgrade, or cancel your subscription at any time:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li><strong>Upgrades:</strong> Take effect immediately; prorated charges apply</li>
              <li><strong>Downgrades:</strong> Take effect at the end of the current billing period</li>
              <li><strong>Cancellations:</strong> You retain access until the end of the paid period</li>
            </ul>

            <h3 style={{ fontFamily, fontWeight: 600, fontSize: '18px' }} className="mb-3 text-gray-900">
              4.5 Price Changes
            </h3>
            <p className="text-gray-600 mb-4">
              We reserve the right to modify pricing with 30 days' notice. Price changes will not affect your current billing period.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily, fontWeight: 600, fontSize: '24px' }} className="mb-4 text-gray-900">
              5. Acceptable Use Policy
            </h2>
            <p className="text-gray-600 mb-4">
              You agree not to use the Service to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Violate any laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Transmit malicious code, viruses, or harmful software</li>
              <li>Send spam, unsolicited messages, or engage in phishing</li>
              <li>Harass, abuse, or harm others</li>
              <li>Impersonate any person or entity</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Attempt to gain unauthorized access to systems or data</li>
              <li>Use the Service for illegal activities or fraud</li>
              <li>Resell or redistribute the Service without authorization</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontFamily, fontWeight: 600, fontSize: '24px' }} className="mb-4 text-gray-900">
              6. User Content and Data
            </h2>

            <h3 style={{ fontFamily, fontWeight: 600, fontSize: '18px' }} className="mb-3 text-gray-900">
              6.1 Your Content
            </h3>
            <p className="text-gray-600 mb-4">
              You retain ownership of all content, data, and information you upload to the Service ("User Content"). You grant us a limited license to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Store, process, and display your User Content to provide the Service</li>
              <li>Create backups for data protection purposes</li>
              <li>Use anonymized, aggregated data for analytics and improvements</li>
            </ul>

            <h3 style={{ fontFamily, fontWeight: 600, fontSize: '18px' }} className="mb-3 text-gray-900">
              6.2 Data Accuracy
            </h3>
            <p className="text-gray-600 mb-4">
              You are responsible for the accuracy, legality, and quality of your User Content. You represent that you have all necessary rights and permissions to upload and use your User Content.
            </p>

            <h3 style={{ fontFamily, fontWeight: 600, fontSize: '18px' }} className="mb-3 text-gray-900">
              6.3 Data Backup and Export
            </h3>
            <p className="text-gray-600 mb-4">
              While we perform regular backups, you are responsible for maintaining your own backups. You may export your data at any time through the platform.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily, fontWeight: 600, fontSize: '24px' }} className="mb-4 text-gray-900">
              7. Intellectual Property Rights
            </h2>
            <p className="text-gray-600 mb-4">
              The Service, including all software, designs, text, graphics, logos, and other content (excluding User Content), is owned by ServiceLoop and protected by copyright, trademark, and other intellectual property laws.
            </p>
            <p className="text-gray-600 mb-4">
              You may not copy, modify, distribute, sell, or create derivative works without our express written permission.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily, fontWeight: 600, fontSize: '24px' }} className="mb-4 text-gray-900">
              8. Third-Party Integrations
            </h2>
            <p className="text-gray-600 mb-4">
              Our Service integrates with third-party services (PayFast, WhatsApp, Google, etc.). Your use of these integrations is subject to their respective terms and policies. We are not responsible for third-party services or their availability.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily, fontWeight: 600, fontSize: '24px' }} className="mb-4 text-gray-900">
              9. Service Availability and Support
            </h2>

            <h3 style={{ fontFamily, fontWeight: 600, fontSize: '18px' }} className="mb-3 text-gray-900">
              9.1 Uptime
            </h3>
            <p className="text-gray-600 mb-4">
              We strive for 99.9% uptime but do not guarantee uninterrupted access. Scheduled maintenance will be announced in advance when possible.
            </p>

            <h3 style={{ fontFamily, fontWeight: 600, fontSize: '18px' }} className="mb-3 text-gray-900">
              9.2 Customer Support
            </h3>
            <p className="text-gray-600 mb-4">
              Support is available via email. Response times vary by plan:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li><strong>Starter:</strong> 48-hour response time</li>
              <li><strong>Professional:</strong> 24-hour response time</li>
              <li><strong>Business:</strong> 12-hour priority response time</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontFamily, fontWeight: 600, fontSize: '24px' }} className="mb-4 text-gray-900">
              10. Limitation of Liability
            </h2>
            <p className="text-gray-600 mb-4">
              To the maximum extent permitted by South African law:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>The Service is provided "as is" without warranties of any kind</li>
              <li>We are not liable for indirect, incidental, special, or consequential damages</li>
              <li>Our total liability is limited to the amount you paid in the 12 months preceding the claim</li>
              <li>We are not liable for data loss, business interruption, or lost profits</li>
              <li>We do not warrant that the Service will be error-free or uninterrupted</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontFamily, fontWeight: 600, fontSize: '24px' }} className="mb-4 text-gray-900">
              11. Indemnification
            </h2>
            <p className="text-gray-600 mb-4">
              You agree to indemnify and hold harmless ServiceLoop from any claims, damages, losses, or expenses (including legal fees) arising from:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Your use of the Service</li>
              <li>Your User Content</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any law or third-party rights</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontFamily, fontWeight: 600, fontSize: '24px' }} className="mb-4 text-gray-900">
              12. Dispute Resolution
            </h2>

            <h3 style={{ fontFamily, fontWeight: 600, fontSize: '18px' }} className="mb-3 text-gray-900">
              12.1 Governing Law
            </h3>
            <p className="text-gray-600 mb-4">
              These Terms are governed by the laws of the Republic of South Africa.
            </p>

            <h3 style={{ fontFamily, fontWeight: 600, fontSize: '18px' }} className="mb-3 text-gray-900">
              12.2 Dispute Process
            </h3>
            <p className="text-gray-600 mb-4">
              In the event of a dispute, you agree to first contact us at support@serviceloop.co.za to attempt informal resolution. If unresolved within 30 days, disputes will be resolved through arbitration in accordance with the Arbitration Act 42 of 1965.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily, fontWeight: 600, fontSize: '24px' }} className="mb-4 text-gray-900">
              13. Modifications to Terms
            </h2>
            <p className="text-gray-600 mb-4">
              We may modify these Terms at any time. Material changes will be communicated via email or platform notification at least 30 days before taking effect. Continued use of the Service after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily, fontWeight: 600, fontSize: '24px' }} className="mb-4 text-gray-900">
              14. Termination
            </h2>
            <p className="text-gray-600 mb-4">
              Either party may terminate this agreement:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li><strong>By You:</strong> Cancel your subscription at any time through account settings</li>
              <li><strong>By Us:</strong> Immediate termination for Terms violations or fraudulent activity</li>
            </ul>
            <p className="text-gray-600 mb-4">
              Upon termination, you will lose access to the Service. You may request data export within 30 days. After 90 days, all data may be permanently deleted.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily, fontWeight: 600, fontSize: '24px' }} className="mb-4 text-gray-900">
              15. Miscellaneous
            </h2>

            <h3 style={{ fontFamily, fontWeight: 600, fontSize: '18px' }} className="mb-3 text-gray-900">
              15.1 Entire Agreement
            </h3>
            <p className="text-gray-600 mb-4">
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and ServiceLoop.
            </p>

            <h3 style={{ fontFamily, fontWeight: 600, fontSize: '18px' }} className="mb-3 text-gray-900">
              15.2 Severability
            </h3>
            <p className="text-gray-600 mb-4">
              If any provision is found unenforceable, the remaining provisions will continue in full effect.
            </p>

            <h3 style={{ fontFamily, fontWeight: 600, fontSize: '18px' }} className="mb-3 text-gray-900">
              15.3 No Waiver
            </h3>
            <p className="text-gray-600 mb-4">
              Our failure to enforce any provision does not constitute a waiver of that provision.
            </p>

            <h3 style={{ fontFamily, fontWeight: 600, fontSize: '18px' }} className="mb-3 text-gray-900">
              15.4 Assignment
            </h3>
            <p className="text-gray-600 mb-4">
              You may not assign or transfer these Terms without our consent. We may assign our rights and obligations without restriction.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily, fontWeight: 600, fontSize: '24px' }} className="mb-4 text-gray-900">
              16. Contact Information
            </h2>
            <p className="text-gray-600 mb-4">
              For questions about these Terms, contact us at:
            </p>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-900 mb-2"><strong>ServiceLoop</strong></p>
              <p className="text-gray-600 mb-1">Email: legal@serviceloop.co.za</p>
              <p className="text-gray-600 mb-1">Support: support@serviceloop.co.za</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
