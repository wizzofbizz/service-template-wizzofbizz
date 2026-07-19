
import { FeaturePageTemplate } from "@/components/FeaturePageTemplate";
import { FeatureGrid } from "@/components/feature-sections/FeatureGrid";
import { HowItWorks } from "@/components/feature-sections/HowItWorks";
import { AlternatingFeature } from "@/components/feature-sections/AlternatingFeature";
import { Footer } from "@/components/Footer";
import { Users, FileText, Calendar, TrendingUp, Clock, DollarSign } from "lucide-react";
import { SEOMetaTags } from "@/components/SEOMetaTags";
import { createSoftwareApplicationSchema } from "@/lib/structured-data";

export default function WinJobsPage() {
  const fontFamily = 'AxLLCircular, Helvetica, Arial, sans-serif';
  const baseUrl = window.location.origin;
  const canonicalUrl = `${baseUrl}/features/win-jobs`;
  const structuredData = createSoftwareApplicationSchema(baseUrl);
  const features = [
    {
      icon: Users,
      title: "Lead & Contact Management",
      description: "Track every lead from first contact to loyal customer. See complete customer history, preferences, and communication in one place.",
    },
    {
      icon: FileText,
      title: "Quote Management",
      description: "Create professional quotes in minutes. Send, track, and follow up automatically. Convert more quotes to jobs with smart automation.",
    },
    {
      icon: Calendar,
      title: "Online Booking",
      description: "Let customers book services 24/7 from your website. Automated calendar syncing prevents double-bookings and saves time.",
    },
  ];

  const howItWorksSteps = [
    {
      title: "Capture Every Lead",
      description: "Website forms, phone calls, referrals - all leads automatically enter your CRM with complete contact details.",
    },
    {
      title: "Send Professional Quotes",
      description: "AI-powered quote generation uses your service catalog and pricing rules to create accurate estimates in seconds.",
    },
    {
      title: "Automated Follow-Ups",
      description: "Smart reminders ensure no quote falls through the cracks. Follow-ups are sent automatically via email and WhatsApp.",
    },
    {
      title: "One-Click Acceptance",
      description: "Customers approve quotes with a single click. Jobs are automatically created and added to your calendar.",
    },
  ];

  return (
    <>
      <SEOMetaTags
        title="Win More Jobs | CRM & Quote Management - ServiceLoop"
        description="Convert more leads into paying customers with professional quotes, automated follow-ups, and seamless online booking. Increase your quote acceptance rate by 35%."
        keywords="crm south africa, quote management software, online booking, lead conversion, sales automation, service business crm"
        canonicalUrl={canonicalUrl}
        ogImage={`${baseUrl}/hero-dashboard-mockup.png`}
        structuredData={structuredData}
      />
      <FeaturePageTemplate
        title="Win More Jobs"
      description="Convert more leads into paying customers with professional quotes, seamless booking, and automated follow-ups that close deals."
      keywords="crm, quote management, online booking, lead conversion, sales automation"
      heroHeading="Win More Jobs, Faster"
      heroSubheading="Convert leads into customers with professional quotes and seamless booking experiences"
      heroImage="https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1920&q=80"
      heroImageAlt="Professional handshake closing a deal"
    >
      {/* Main Features Grid */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-6 md:px-12 lg:px-20">
          <div className="max-w-4xl mb-8">
            <h2 className="text-2xl md:text-3xl font-normal mb-3 leading-tight" style={{ fontFamily }}>
              Close More Deals
            </h2>
            <p className="text-sm md:text-base text-gray-600 font-light leading-normal" style={{ fontFamily }}>
              Turn inquiries into jobs with a seamless customer journey. From first 
              contact to signed quote, every touchpoint is designed to build trust 
              and make saying "yes" easy.
            </p>
          </div>

          <FeatureGrid features={features} />
        </div>
      </section>

      {/* How It Works */}
      <section className="py-10 md:py-12 bg-gray-50">
        <div className="container mx-auto px-6 md:px-12 lg:px-20">
          <div className="max-w-4xl mb-6">
            <h2 className="text-2xl md:text-3xl font-normal mb-3 leading-tight" style={{ fontFamily }}>
              How It Works
            </h2>
            <p className="text-sm md:text-base text-gray-600 font-light leading-normal" style={{ fontFamily }}>
              A streamlined process that takes leads from inquiry to booked job automatically.
            </p>
          </div>

          <HowItWorks steps={howItWorksSteps} />
        </div>
      </section>

      {/* CRM Details */}
      <AlternatingFeature
        title="Never Lose Track of a Customer"
        description="Your CRM captures every interaction automatically. See the complete customer journey - from first website visit to repeat business - all in one organized dashboard."
        features={[
          "Automatic lead capture from website forms",
          "Complete communication history",
          "Customer segmentation and tagging",
          "Service address management",
          "Custom notes and preferences",
          "Activity timeline for every contact",
        ]}
        image="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80"
        imageAlt="Professional reviewing information with customer"
        imagePosition="right"
      />

      {/* Quote Management Details */}
      <AlternatingFeature
        title="Professional Quotes That Win Jobs"
        description="AI-powered quote generation creates accurate estimates using your service catalog and pricing history. Send branded quotes via email and WhatsApp, then track approval status in real-time."
        features={[
          "AI quote generation from customer requests",
          "Line-item pricing with descriptions",
          "Quote versioning and tracking",
          "One-click online approval",
          "Automated deposit requests",
          "Email and WhatsApp delivery",
        ]}
        image="https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&q=80"
        imageAlt="Professional reviewing digital quote on tablet"
        imagePosition="left"
        darkMode={true}
      />

      {/* Online Booking Details */}
      <AlternatingFeature
        title="24/7 Online Booking"
        description="Let customers book appointments any time of day from your website. Automated calendar syncing prevents double-bookings, and instant confirmations keep customers informed."
        features={[
          "Calendar availability settings",
          "Automatic scheduling when booked",
          "Instant email and WhatsApp confirmations",
          "Booking buffer management",
          "Minimum notice period controls",
          "Recurring appointment support",
        ]}
        image="https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&q=80"
        imageAlt="Customer booking appointment online"
        imagePosition="right"
      />

      {/* Conversion Stats */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto px-6 md:px-12 lg:px-20">
          <div className="max-w-4xl mb-8">
            <h2 className="text-2xl md:text-3xl mb-3 leading-tight" style={{ fontFamily, fontWeight: 700 }}>
              Win More, Work Less
            </h2>
            <p className="text-sm md:text-base text-gray-600 leading-normal" style={{ fontFamily, fontWeight: 400 }}>
              Automation and professional tools improve your conversion rate dramatically.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <TrendingUp className="h-7 w-7 text-black" />
                <h3 className="text-xl" style={{ fontFamily, fontWeight: 600 }}>35% higher</h3>
              </div>
              <p className="text-base text-gray-600 leading-normal" style={{ fontFamily, fontWeight: 400 }}>
                quote acceptance rate with professional, branded quotes and automated follow-ups.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-3">
                <Clock className="h-7 w-7 text-black" />
                <h3 className="text-xl" style={{ fontFamily, fontWeight: 600 }}>5 hours saved</h3>
              </div>
              <p className="text-base text-gray-600 leading-normal" style={{ fontFamily, fontWeight: 400 }}>
                per week with automated quote creation, follow-ups, and booking confirmations.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-3">
                <DollarSign className="h-7 w-7 text-black" />
                <h3 className="text-xl" style={{ fontFamily, fontWeight: 600 }}>2x more bookings</h3>
              </div>
              <p className="text-base text-gray-600 leading-normal" style={{ fontFamily, fontWeight: 400 }}>
                with 24/7 online booking compared to phone-only scheduling.
              </p>
            </div>
          </div>
        </div>
      </section>

      </FeaturePageTemplate>

      <Footer />
    </>
  );
}
