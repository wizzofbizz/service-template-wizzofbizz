
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicyPage() {
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
          Privacy Policy
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
              1. Introduction
            </h2>
            <p className="text-gray-600 mb-4">
              ServiceLoop ("we," "our," or "us") is committed to protecting your privacy and personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our software-as-a-service platform.
            </p>
            <p className="text-gray-600 mb-4">
              We comply with the Protection of Personal Information Act, 2013 (POPIA) and other applicable South African data protection laws.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily, fontWeight: 600, fontSize: '24px' }} className="mb-4 text-gray-900">
              2. Information We Collect
            </h2>
            
            <h3 style={{ fontFamily, fontWeight: 600, fontSize: '18px' }} className="mb-3 text-gray-900">
              2.1 Information You Provide
            </h3>
            <p className="text-gray-600 mb-4">
              We collect information that you voluntarily provide when using our service:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li><strong>Account Information:</strong> Name, email address, phone number, business name, and billing details</li>
              <li><strong>Business Data:</strong> Customer contacts, quotes, invoices, jobs, services, and other business information you enter into the platform</li>
              <li><strong>Communications:</strong> Messages, support requests, and feedback you send to us</li>
              <li><strong>Payment Information:</strong> Credit card details and billing addresses (processed securely through third-party payment providers)</li>
            </ul>

            <h3 style={{ fontFamily, fontWeight: 600, fontSize: '18px' }} className="mb-3 text-gray-900">
              2.2 Automatically Collected Information
            </h3>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li><strong>Usage Data:</strong> Pages viewed, features used, time spent on platform, and interaction patterns</li>
              <li><strong>Device Information:</strong> IP address, browser type, operating system, and device identifiers</li>
              <li><strong>Location Data:</strong> Approximate geographic location based on IP address</li>
              <li><strong>Cookies:</strong> Small data files stored on your device to improve your experience</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontFamily, fontWeight: 600, fontSize: '24px' }} className="mb-4 text-gray-900">
              3. How We Use Your Information
            </h2>
            <p className="text-gray-600 mb-4">
              We use your information for the following purposes:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li><strong>Service Delivery:</strong> To provide, maintain, and improve our platform</li>
              <li><strong>Account Management:</strong> To create and manage your account, process payments, and provide customer support</li>
              <li><strong>Communications:</strong> To send service updates, security alerts, and marketing communications (with your consent)</li>
              <li><strong>Analytics:</strong> To understand how users interact with our platform and improve user experience</li>
              <li><strong>Security:</strong> To detect, prevent, and address fraud, security issues, and technical problems</li>
              <li><strong>Legal Compliance:</strong> To comply with legal obligations and enforce our terms</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontFamily, fontWeight: 600, fontSize: '24px' }} className="mb-4 text-gray-900">
              4. Legal Basis for Processing (POPIA Compliance)
            </h2>
            <p className="text-gray-600 mb-4">
              Under POPIA, we process your personal information based on:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li><strong>Consent:</strong> You have given explicit consent for specific purposes</li>
              <li><strong>Contract Performance:</strong> Processing is necessary to fulfill our service agreement with you</li>
              <li><strong>Legal Obligation:</strong> We must process your data to comply with South African law</li>
              <li><strong>Legitimate Interests:</strong> Processing is necessary for our legitimate business interests, provided your rights are not overridden</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontFamily, fontWeight: 600, fontSize: '24px' }} className="mb-4 text-gray-900">
              5. Data Sharing and Disclosure
            </h2>
            <p className="text-gray-600 mb-4">
              We do not sell your personal information. We may share your information with:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li><strong>Service Providers:</strong> Third-party vendors who provide hosting, payment processing, email delivery, and analytics services</li>
              <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets</li>
              <li><strong>Legal Requirements:</strong> When required by law, court order, or to protect our rights and safety</li>
              <li><strong>With Your Consent:</strong> When you explicitly authorize us to share your information</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontFamily, fontWeight: 600, fontSize: '24px' }} className="mb-4 text-gray-900">
              6. Data Security
            </h2>
            <p className="text-gray-600 mb-4">
              We implement appropriate technical and organizational measures to protect your personal information:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security assessments and audits</li>
              <li>Access controls and authentication mechanisms</li>
              <li>Secure data centers with physical security</li>
              <li>Regular backups and disaster recovery procedures</li>
            </ul>
            <p className="text-gray-600 mb-4">
              However, no method of transmission over the Internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily, fontWeight: 600, fontSize: '24px' }} className="mb-4 text-gray-900">
              7. Your Rights Under POPIA
            </h2>
            <p className="text-gray-600 mb-4">
              As a South African data subject, you have the following rights:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li><strong>Right to Access:</strong> Request copies of your personal information</li>
              <li><strong>Right to Correction:</strong> Request correction of inaccurate or incomplete data</li>
              <li><strong>Right to Deletion:</strong> Request deletion of your personal information (subject to legal obligations)</li>
              <li><strong>Right to Object:</strong> Object to processing of your personal information</li>
              <li><strong>Right to Data Portability:</strong> Request transfer of your data to another service provider</li>
              <li><strong>Right to Withdraw Consent:</strong> Withdraw consent for processing at any time</li>
              <li><strong>Right to Complain:</strong> Lodge a complaint with the Information Regulator</li>
            </ul>
            <p className="text-gray-600 mb-4">
              To exercise these rights, please contact us at privacy@serviceloop.co.za
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily, fontWeight: 600, fontSize: '24px' }} className="mb-4 text-gray-900">
              8. Data Retention
            </h2>
            <p className="text-gray-600 mb-4">
              We retain your personal information for as long as necessary to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Provide our services to you</li>
              <li>Comply with legal, tax, and accounting obligations (minimum 5 years for financial records)</li>
              <li>Resolve disputes and enforce our agreements</li>
            </ul>
            <p className="text-gray-600 mb-4">
              When you close your account, we will delete or anonymize your personal information within 90 days, except where retention is required by law.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily, fontWeight: 600, fontSize: '24px' }} className="mb-4 text-gray-900">
              9. Cookies and Tracking Technologies
            </h2>
            <p className="text-gray-600 mb-4">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Keep you signed in</li>
              <li>Remember your preferences</li>
              <li>Analyze platform usage</li>
              <li>Improve our services</li>
            </ul>
            <p className="text-gray-600 mb-4">
              You can control cookies through your browser settings. However, disabling cookies may limit your ability to use certain features.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily, fontWeight: 600, fontSize: '24px' }} className="mb-4 text-gray-900">
              10. Third-Party Services
            </h2>
            <p className="text-gray-600 mb-4">
              Our platform integrates with third-party services:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li><strong>Payment Processing:</strong> PayFast for payment processing</li>
              <li><strong>Email Services:</strong> For transactional and marketing emails</li>
              <li><strong>WhatsApp API:</strong> For customer communications (with consent)</li>
              <li><strong>Google Services:</strong> For maps, geocoding, and business profiles</li>
            </ul>
            <p className="text-gray-600 mb-4">
              These services have their own privacy policies. We encourage you to review them.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily, fontWeight: 600, fontSize: '24px' }} className="mb-4 text-gray-900">
              11. Children's Privacy
            </h2>
            <p className="text-gray-600 mb-4">
              Our service is not intended for children under 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily, fontWeight: 600, fontSize: '24px' }} className="mb-4 text-gray-900">
              12. International Data Transfers
            </h2>
            <p className="text-gray-600 mb-4">
              Your information may be transferred to and processed in countries outside South Africa. We ensure appropriate safeguards are in place to protect your information in accordance with POPIA.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily, fontWeight: 600, fontSize: '24px' }} className="mb-4 text-gray-900">
              13. Changes to This Policy
            </h2>
            <p className="text-gray-600 mb-4">
              We may update this Privacy Policy periodically. We will notify you of material changes by email or through our platform. The "Last Updated" date at the top indicates when changes were made.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily, fontWeight: 600, fontSize: '24px' }} className="mb-4 text-gray-900">
              14. Contact Information
            </h2>
            <p className="text-gray-600 mb-4">
              For questions about this Privacy Policy or to exercise your rights, contact us at:
            </p>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-900 mb-2"><strong>ServiceLoop</strong></p>
              <p className="text-gray-600 mb-1">Email: privacy@serviceloop.co.za</p>
              <p className="text-gray-600 mb-1">Support: support@serviceloop.co.za</p>
            </div>
          </section>

          <section>
            <h2 style={{ fontFamily, fontWeight: 600, fontSize: '24px' }} className="mb-4 text-gray-900">
              15. Information Regulator
            </h2>
            <p className="text-gray-600 mb-4">
              If you are not satisfied with our response to your privacy concerns, you may lodge a complaint with the Information Regulator:
            </p>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-900 mb-2"><strong>Information Regulator (South Africa)</strong></p>
              <p className="text-gray-600 mb-1">Email: inforeg@justice.gov.za</p>
              <p className="text-gray-600 mb-1">Website: www.justice.gov.za/inforeg</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
