
import { FeaturePageTemplate } from "@/components/FeaturePageTemplate";
import { FeatureGrid } from "@/components/feature-sections/FeatureGrid";
import { HowItWorks } from "@/components/feature-sections/HowItWorks";
import { AlternatingFeature } from "@/components/feature-sections/AlternatingFeature";
import { Footer } from "@/components/Footer";
import { CalendarDays, Briefcase, UserCircle, Clock, CheckCircle, MessageSquare } from "lucide-react";
import { SEOMetaTags } from "@/components/SEOMetaTags";
import { createSoftwareApplicationSchema } from "@/lib/structured-data";

export default function WorkSmarterPage() {
  const fontFamily = 'AxLLCircular, Helvetica, Arial, sans-serif';
  const baseUrl = window.location.origin;
  const canonicalUrl = `${baseUrl}/features/work-smarter`;
  const structuredData = createSoftwareApplicationSchema(baseUrl);
  const features = [
    {
      icon: CalendarDays,
      title: "Calendar & Scheduling",
      description: "Manage your team's schedule with drag-and-drop simplicity. Automated reminders keep everyone on track and reduce no-shows.",
    },
    {
      icon: Briefcase,
      title: "Complete Job Workflow",
      description: "Track jobs from booking to completion. Assign tasks, update status, and communicate with customers all in one place.",
    },
    {
      icon: UserCircle,
      title: "Client Portal",
      description: "Give customers 24/7 access to quotes, invoices, and job status. Reduce phone calls and emails with self-service tools.",
    },
  ];

  const howItWorksSteps = [
    {
      title: "Organize Your Calendar",
      description: "Visual calendar shows all jobs and appointments at a glance. Drag-and-drop scheduling makes adjustments instant.",
    },
    {
      title: "Manage Jobs Start to Finish",
      description: "Track job status from scheduled to completed. Access customer details, job notes, and service history on-site.",
    },
    {
      title: "Automate Customer Updates",
      description: "Send automatic appointment reminders, job completion surveys, and thank-you messages via email and WhatsApp.",
    },
    {
      title: "Self-Service for Customers",
      description: "Client portal lets customers view quotes, approve estimates, check appointment details, and request new work 24/7.",
    },
  ];

  return (
    <>
      <SEOMetaTags
        title="Work Smarter | Scheduling & Job Management - ServiceLoop"
        description="Save 10+ hours per week with automated scheduling, job tracking, and client communication. Reduce no-shows by 40% with automated reminders."
        keywords="scheduling software south africa, job management, client portal, workflow automation, productivity tools, service business software"
        canonicalUrl={canonicalUrl}
        ogImage={`${baseUrl}/hero-dashboard-mockup.png`}
        structuredData={structuredData}
      />
      <FeaturePageTemplate
        title="Work Smarter, Not Harder"
      description="Streamline operations with automated scheduling, job tracking, and client communication that saves hours every week."
      keywords="scheduling software, job management, client portal, workflow automation, productivity"
      heroHeading="Work Smarter, Not Harder"
      heroSubheading="Streamline operations and save hours every week with intelligent automation"
      heroImage="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1920&q=80"
      heroImageAlt="Organized professional workspace with technology"
    >
      {/* Main Features Grid */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-6 md:px-12 lg:px-20">
          <div className="max-w-4xl mb-8">
            <h2 className="text-2xl md:text-3xl font-normal mb-3 leading-tight" style={{ fontFamily }}>
              Eliminate Busy Work
            </h2>
            <p className="text-sm md:text-base text-gray-600 font-light leading-normal" style={{ fontFamily }}>
              Stop juggling spreadsheets, notebooks, and multiple apps. Everything 
              you need to run your business efficiently is in one organized system 
              that works the way you do.
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
              Simplified workflow that handles scheduling, job tracking, and customer communication automatically.
            </p>
          </div>

          <HowItWorks steps={howItWorksSteps} />
        </div>
      </section>

      {/* Calendar Details */}
      <AlternatingFeature
        title="Visual Scheduling Made Simple"
        description="See your entire schedule at a glance with color-coded job types and team assignments. Drag-and-drop makes rescheduling instant when plans change."
        features={[
          "Visual calendar with job overview",
          "Drag-and-drop scheduling",
          "Automated appointment reminders",
          "Recurring job support",
          "Team member assignment",
          "Buffer time management",
        ]}
        image="https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&q=80"
        imageAlt="Professional managing calendar and schedule"
        imagePosition="right"
      />

      {/* Job Workflow Details */}
      <AlternatingFeature
        title="Complete Job Management"
        description="Track every job from booking to completion. Access customer details, service history, and job notes while on-site. Update status in real-time and keep customers informed automatically."
        features={[
          "Job details and customer information",
          "Photo documentation (before/after)",
          "Real-time status updates",
          "Service address with directions",
          "Job notes and special instructions",
          "Automated completion follow-ups",
        ]}
        image="https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?w=800&q=80"
        imageAlt="Professional documenting completed work"
        imagePosition="left"
        darkMode={true}
      />

      {/* Client Portal Details */}
      <AlternatingFeature
        title="Customer Self-Service Portal"
        description="Reduce phone calls and emails by giving customers 24/7 access to their account. They can request work, approve quotes, view appointments, and check invoice status anytime."
        features={[
          "Submit new work requests online",
          "Review and approve quotes",
          "View upcoming appointments",
          "Access invoice history",
          "Update contact information",
          "Download completed invoices",
        ]}
        image="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80"
        imageAlt="Customer using online portal at home"
        imagePosition="right"
      />

      {/* Efficiency Stats */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto px-6 md:px-12 lg:px-20">
          <div className="max-w-4xl mb-8">
            <h2 className="text-2xl md:text-3xl mb-3 leading-tight" style={{ fontFamily, fontWeight: 700 }}>
              Time Saved, Productivity Gained
            </h2>
            <p className="text-sm md:text-base text-gray-600 leading-normal" style={{ fontFamily, fontWeight: 400 }}>
              Automation and smart tools give you back time to focus on what matters - growing your business.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Clock className="h-7 w-7 text-black" />
                <h3 className="text-xl" style={{ fontFamily, fontWeight: 600 }}>10+ hours saved</h3>
              </div>
              <p className="text-base text-gray-600 leading-normal" style={{ fontFamily, fontWeight: 400 }}>
                per week with automated scheduling, reminders, and customer communication.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle className="h-7 w-7 text-black" />
                <h3 className="text-xl" style={{ fontFamily, fontWeight: 600 }}>40% fewer no-shows</h3>
              </div>
              <p className="text-base text-gray-600 leading-normal" style={{ fontFamily, fontWeight: 400 }}>
                with automated appointment reminders sent via email and WhatsApp.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-3">
                <MessageSquare className="h-7 w-7 text-black" />
                <h3 className="text-xl" style={{ fontFamily, fontWeight: 600 }}>60% less admin</h3>
              </div>
              <p className="text-base text-gray-600 leading-normal" style={{ fontFamily, fontWeight: 400 }}>
                time spent answering customer questions with self-service client portal.
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
