
import { Link } from "wouter";
import { FeaturePageTemplate } from "@/components/FeaturePageTemplate";
import { FeatureGrid } from "@/components/feature-sections/FeatureGrid";
import { HowItWorks } from "@/components/feature-sections/HowItWorks";
import { AlternatingFeature } from "@/components/feature-sections/AlternatingFeature";
import { Footer } from "@/components/Footer";
import { FileText, TrendingUp, DollarSign, Clock, CreditCard, BarChart3 } from "lucide-react";
import { SEOMetaTags } from "@/components/SEOMetaTags";
import { createSoftwareApplicationSchema } from "@/lib/structured-data";

export default function BoostProfitsPage() {
  const fontFamily = 'AxLLCircular, Helvetica, Arial, sans-serif';
  const baseUrl = window.location.origin;
  const canonicalUrl = `${baseUrl}/features/boost-profits`;
  const structuredData = createSoftwareApplicationSchema(baseUrl);
  const features = [
    {
      icon: FileText,
      title: "Invoice Management",
      description: "Create and send professional invoices in seconds. Get paid faster with automated reminders and multiple payment options.",
    },
    {
      icon: TrendingUp,
      title: "Financial Insights",
      description: "Track revenue, profit margins, and cash flow at a glance. Make informed decisions with real-time financial dashboards.",
    },
    {
      icon: DollarSign,
      title: "Deposit Management",
      description: "Secure jobs with automated deposit requests. Track payments and reduce no-shows with upfront commitments.",
    },
  ];

  const howItWorksSteps = [
    {
      title: "Create Professional Invoices",
      description: "Generate invoices automatically from completed jobs with all details pre-filled. Send via email and WhatsApp instantly.",
    },
    {
      title: "Automate Payment Reminders",
      description: "Set up automatic reminders that send to customers at scheduled intervals, reducing late payments dramatically.",
    },
    {
      title: "Request Deposits Upfront",
      description: "Automatically request deposits when quotes are accepted. Secure bookings and improve cash flow from day one.",
    },
    {
      title: "Track Financial Performance",
      description: "Real-time dashboards show pending quotes, scheduled jobs, outstanding invoices, and revenue trends at a glance.",
    },
  ];

  return (
    <>
      <SEOMetaTags
        title="Boost Your Profits | Invoicing & Financial Management - ServiceLoop"
        description="Get paid 2x faster with automated invoicing and payment reminders. Improve cash flow with deposit management and real-time financial insights."
        keywords="invoicing software south africa, financial management, deposit management, cash flow, profit tracking, payment automation"
        canonicalUrl={canonicalUrl}
        ogImage={`${baseUrl}/hero-dashboard-mockup.png`}
        structuredData={structuredData}
      />
      <FeaturePageTemplate
        title="Boost Your Profits"
      description="Increase revenue and improve cash flow with automated invoicing, payment tracking, and financial insights that drive growth."
      keywords="invoicing software, financial insights, deposit management, cash flow, profit tracking"
      heroHeading="Boost Your Bottom Line"
      heroSubheading="Get paid faster and grow revenue with automated billing and financial insights"
      heroImage="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1920&q=80"
      heroImageAlt="Business analytics and growth dashboard"
    >
      {/* Main Features Grid */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-6 md:px-12 lg:px-20">
          <div className="max-w-4xl mb-8">
            <h2 className="text-2xl md:text-3xl font-normal mb-3 leading-tight" style={{ fontFamily }}>
              Maximize Revenue
            </h2>
            <p className="text-sm md:text-base text-gray-600 font-light leading-normal" style={{ fontFamily }}>
              Get paid faster, reduce late payments, and gain visibility into your 
              financial performance. Every feature is designed to improve your cash 
              flow and help your business thrive.
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
              Streamlined billing and financial tracking that runs on autopilot.
            </p>
          </div>

          <HowItWorks steps={howItWorksSteps} />
        </div>
      </section>

      {/* Invoice Management Details */}
      <AlternatingFeature
        title="Professional Invoicing Made Easy"
        description="Create clean, branded invoices in seconds. All job details are pre-filled automatically. Send via email and WhatsApp with one click, then track payment status in real-time."
        features={[
          "Quick invoice creation from jobs",
          "Professional branded design",
          "Automated payment reminders",
          "Deposit invoice support",
          "Automatic deposit credit application",
          "Invoice status tracking (paid/pending/overdue)",
        ]}
        image="https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&q=80"
        imageAlt="Professional creating invoice on mobile device"
        imagePosition="right"
      />

      {/* Financial Insights Details */}
      <AlternatingFeature
        title="Real-Time Financial Dashboard"
        description="Monitor your business performance with at-a-glance insights. Track pending quotes, scheduled jobs, outstanding invoices, and revenue trends to make data-driven decisions."
        features={[
          "Dashboard with key metrics",
          "Quote conversion tracking",
          "Job completion metrics",
          "Payment status monitoring",
          "Revenue trends and forecasting",
          "Overdue invoice alerts",
        ]}
        image="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80"
        imageAlt="Business financial dashboard and analytics"
        imagePosition="left"
        darkMode={true}
      />

      {/* Deposit Management Details */}
      <AlternatingFeature
        title="Secure Jobs with Deposits"
        description="Request deposits automatically when quotes are accepted. Set deadlines based on appointment dates and send automatic reminders. Track which jobs have deposits paid and which are awaiting payment."
        features={[
          "Automated deposit requests",
          "Configurable deposit percentages",
          "Deadline tracking by appointment",
          "Automated deposit reminders",
          "Deposit payment status tracking",
          "Reduced no-shows and cancellations",
        ]}
        image="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80"
        imageAlt="Customer making secure online payment"
        imagePosition="right"
      />

      {/* Financial Impact Stats */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto px-6 md:px-12 lg:px-20">
          <div className="max-w-4xl mb-8">
            <h2 className="text-2xl md:text-3xl mb-3 leading-tight" style={{ fontFamily, fontWeight: 700 }}>
              Improve Cash Flow, Grow Faster
            </h2>
            <p className="text-sm md:text-base text-gray-600 leading-normal" style={{ fontFamily, fontWeight: 400 }}>
              Better billing and payment tracking directly impacts your bottom line.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Clock className="h-7 w-7 text-black" />
                <h3 className="text-xl" style={{ fontFamily, fontWeight: 600 }}>Paid 2x faster</h3>
              </div>
              <p className="text-base text-gray-600 leading-normal" style={{ fontFamily, fontWeight: 400 }}>
                with automated invoice reminders and WhatsApp delivery, customers pay invoices twice as fast.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-3">
                <CreditCard className="h-7 w-7 text-black" />
                <h3 className="text-xl" style={{ fontFamily, fontWeight: 600 }}>50% fewer no-shows</h3>
              </div>
              <p className="text-base text-gray-600 leading-normal" style={{ fontFamily, fontWeight: 400 }}>
                when deposits are required upfront, protecting your time and revenue.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-3">
                <BarChart3 className="h-7 w-7 text-black" />
                <h3 className="text-xl" style={{ fontFamily, fontWeight: 600 }}>20% revenue growth</h3>
              </div>
              <p className="text-base text-gray-600 leading-normal" style={{ fontFamily, fontWeight: 400 }}>
                average increase when businesses track financial metrics and optimize pricing.
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
