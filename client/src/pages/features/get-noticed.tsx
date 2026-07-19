import { FeaturePageTemplate } from "@/components/FeaturePageTemplate";
import { FeatureGrid } from "@/components/feature-sections/FeatureGrid";
import { HowItWorks } from "@/components/feature-sections/HowItWorks";
import { AlternatingFeature } from "@/components/feature-sections/AlternatingFeature";
import { Footer } from "@/components/Footer";
import { RelatedContent } from "@/components/RelatedContent";
import { Orbit, MessageCircle, MapPin, Search, Star, Users } from "lucide-react";
import { SEOMetaTags } from "@/components/SEOMetaTags";
import { createSoftwareApplicationSchema } from "@/lib/structured-data";

export default function GetNoticedPage() {
  const fontFamily = 'AxLLCircular, Helvetica, Arial, sans-serif';
  const baseUrl = window.location.origin;
  const canonicalUrl = `${baseUrl}/features/get-noticed`;
  const structuredData = createSoftwareApplicationSchema(baseUrl);
  const features = [
    {
      icon: Orbit,
      title: "Professional Website Builder",
      description: "Create a stunning, mobile-responsive website in minutes. No coding required - just customize your industry template and publish.",
    },
    {
      icon: MessageCircle,
      title: "WhatsApp Communication",
      description: "Connect instantly with customers on their preferred platform. Automated responses and booking confirmations keep conversations flowing.",
    },
    {
      icon: MapPin,
      title: "Google Business Profile",
      description: "Optimize your local presence with automated Google Business Profile management. Show up when customers search for your services.",
    },
  ];

  const howItWorksSteps = [
    {
      title: "Choose Your Template",
      description: "Select from industry-specific website templates pre-loaded with content tailored to your services.",
    },
    {
      title: "Customize Your Brand",
      description: "Add your logo, colors, photos, and business details. The builder makes it simple to match your brand.",
    },
    {
      title: "Publish & Get Found",
      description: "Go live with built-in SEO optimization. Your website automatically connects to Google Business Profile for maximum visibility.",
    },
    {
      title: "Convert Visitors to Customers",
      description: "Quote request forms and WhatsApp integration make it easy for customers to reach you instantly.",
    },
  ];

  return (
    <>
      <SEOMetaTags
        title="Get Noticed Online | Professional Website & Local SEO - ServiceLoop"
        description="Build your professional online presence with a custom website, WhatsApp integration, and Google Business Profile optimization. Get found by more customers in South Africa."
        keywords="website builder south africa, whatsapp business, google business profile, local seo, online presence, service business website"
        canonicalUrl={canonicalUrl}
        ogImage={`${baseUrl}/hero-dashboard-mockup.png`}
        structuredData={structuredData}
      />
      <FeaturePageTemplate
        title="Get Noticed Online"
      description="Establish your professional online presence and make it easy for customers to find and contact you across all digital channels."
      keywords="website builder, whatsapp business, google business profile, online presence, local seo"
      heroHeading="Get Noticed by More Customers"
      heroSubheading="Build your professional online presence and capture more leads across all digital channels"
      heroImage="https://images.unsplash.com/photo-1581578731548-c64695c6e430?w=1920&q=80"
      heroImageAlt="Service professional using mobile technology on job site"
    >
      {/* Main Features Grid */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 md:px-12 lg:px-20">
          <div className="max-w-4xl mb-8">
            <h2 className="text-2xl md:text-3xl font-normal mb-3 leading-tight" style={{ fontFamily }}>
              Stand Out Online
            </h2>
            <p className="text-base text-gray-600 font-light leading-normal" style={{ fontFamily }}>
              In today's digital world, your online presence is your storefront.
              Make it count with tools designed specifically for service businesses
              to attract, engage, and convert local customers.
            </p>
          </div>

          <FeatureGrid features={features} />
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 md:px-12 lg:px-20">
          <div className="max-w-4xl mb-8">
            <h2 className="text-2xl md:text-3xl font-normal mb-3 leading-tight" style={{ fontFamily }}>
              How It Works
            </h2>
            <p className="text-base text-gray-600 font-light leading-normal" style={{ fontFamily }}>
              Get your business online in four simple steps. No technical skills required.
            </p>
          </div>

          <HowItWorks steps={howItWorksSteps} />
        </div>
      </section>

      {/* Website Builder Details */}
      <AlternatingFeature
        title="Professional Website in Minutes"
        description="Your website is preloaded with industry-specific copy and images. Just add your branding, customize the content, and publish. Mobile-responsive design ensures you look professional on every device."
        features={[
          "Ready-to-publish templates for your industry",
          "Custom domain connection included",
          "Built-in SEO optimization",
          "Quote request forms integrated",
          "Photo galleries and service showcases",
          "Google reviews integration",
        ]}
        image="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80"
        imageAlt="Professional website displayed on devices"
        imagePosition="right"
      />

      {/* WhatsApp Communication Details */}
      <AlternatingFeature
        title="Connect on WhatsApp"
        description="Meet customers where they are. WhatsApp integration lets you send instant booking confirmations, quote notifications, and appointment reminders directly to their phones."
        features={[
          "Automated booking confirmations",
          "Quote delivery via WhatsApp",
          "Appointment reminders reduce no-shows",
          "Two-way messaging with customers",
          "Template messages for compliance",
          "All conversations tracked in your CRM",
        ]}
        image="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80"
        imageAlt="Professional using smartphone for customer communication"
        imagePosition="left"
        darkMode={true}
      />

      {/* Google Business Profile Details */}
      <AlternatingFeature
        title="Dominate Local Search"
        description="Get found when customers search for your services on Google. Automated Google Business Profile management keeps your information up-to-date and showcases customer reviews."
        features={[
          "Automatic profile verification",
          "Business hours sync",
          "Service information updates",
          "Review display on your website",
          "Local SEO optimization",
          "Google Maps integration",
        ]}
        image="https://images.unsplash.com/photo-1562577309-2592ab84b1bc?w=800&q=80"
        imageAlt="Service van parked at residential location"
        imagePosition="right"
      />

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 md:px-12 lg:px-20">
          <div className="max-w-4xl mb-8">
            <h2 className="text-2xl md:text-3xl mb-3 leading-tight" style={{ fontFamily, fontWeight: 700 }}>
              Why Your Online Presence Matters
            </h2>
            <p className="text-base text-gray-600 leading-normal" style={{ fontFamily, fontWeight: 400 }}>
              Small businesses with a strong online presence grow 3x faster than those without one.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Search className="h-7 w-7 text-black" />
                <h3 className="text-xl" style={{ fontFamily, fontWeight: 600 }}>76% of customers</h3>
              </div>
              <p className="text-base text-gray-600 leading-normal" style={{ fontFamily, fontWeight: 400 }}>
                search online before calling a local business. If you're not online, you're invisible.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-3">
                <Star className="h-7 w-7 text-black" />
                <h3 className="text-xl" style={{ fontFamily, fontWeight: 600 }}>88% trust reviews</h3>
              </div>
              <p className="text-base text-gray-600 leading-normal" style={{ fontFamily, fontWeight: 400 }}>
                as much as personal recommendations. Showcase your Google reviews to build instant trust.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-3">
                <Users className="h-7 w-7 text-black" />
                <h3 className="text-xl" style={{ fontFamily, fontWeight: 600 }}>3x more leads</h3>
              </div>
              <p className="text-base text-gray-600 leading-normal" style={{ fontFamily, fontWeight: 400 }}>
                when you're available on multiple channels. Website + WhatsApp = more customers.
              </p>
            </div>
          </div>
        </div>
      </section>
    </FeaturePageTemplate>

      <RelatedContent 
        title="Explore More Features"
        links={[
          {
            title: "Win More Jobs",
            description: "Convert leads into customers with professional quotes and automated follow-ups.",
            url: "/features/win-jobs",
            category: "Sales"
          },
          {
            title: "Work Smarter",
            description: "Save 10+ hours per week with automated scheduling and job management.",
            url: "/features/work-smarter",
            category: "Operations"
          },
          {
            title: "Boost Your Profits",
            description: "Get paid faster with automated invoicing and financial insights.",
            url: "/features/boost-profits",
            category: "Finance"
          }
        ]}
      />

      <Footer />
    </>
  );
}