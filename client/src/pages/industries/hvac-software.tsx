import { IndustryPageTemplate } from "@/components/IndustryPageTemplate";
import { Fan, Zap, Calendar, MessageCircle, FileText, DollarSign } from "lucide-react";

export default function HVACSoftwarePage() {
  return (
    <IndustryPageTemplate
      title="HVAC Software South Africa | Air Con Business Management - ServiceLoop"
      description="Manage your HVAC/aircon business efficiently. Schedule service calls, track maintenance contracts, invoice customers. From R350/month."
      keywords="hvac software south africa, aircon business software, hvac job management, air conditioning service software, hvac maintenance contracts, aircon scheduling"
      heroIcon={Fan}
      heroLabel="For HVAC Pros"
      heroHeading="HVAC Software for South African Businesses"
      heroSubheading="Manage installations, service contracts, and seasonal demand from one platform. Stop losing maintenance renewals and emergency call-outs to competitors."
      heroImage="https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=1920&q=80"
      heroImageAlt="Professional HVAC technician using ServiceLoop"
      problemHeading="Common Challenges for HVAC Businesses"
      problems={[
        {
          title: "Manual Quoting Takes Too Long",
          description: "Writing quotes for aircon installations and servicing manually wastes hours. Customers book with HVAC companies who respond faster."
        },
        {
          title: "Following Up on Quotes",
          description: "Manually chasing HVAC quotes means lost revenue. You forget to follow up and customers choose competitors."
        },
        {
          title: "Scheduling Chaos",
          description: "Managing summer rush installations alongside maintenance contracts becomes overwhelming without automation."
        },
        {
          title: "Chasing Payments",
          description: "Sending invoices manually and waiting for payment delays your cash flow. No automated reminders means late payments."
        }
      ]}
      solutionHeading="How ServiceLoop Helps HVAC Businesses"
      solutionSubheading="Everything you need to automate quotes, scheduling, and payments for your HVAC business."
      features={[
        {
          icon: <Zap className="h-8 w-8" />,
          title: "AI Quote Generation",
          description: "Generate professional HVAC quotes in seconds. AI suggests pricing based on your rules for installations, servicing, and repairs."
        },
        {
          icon: <MessageCircle className="h-8 w-8" />,
          title: "Smart Follow-ups",
          description: "Automated WhatsApp and email reminders sent to customers who haven't accepted quotes yet. Never lose a job to lack of follow-up."
        },
        {
          icon: <Calendar className="h-8 w-8" />,
          title: "Online Booking",
          description: "Customers book HVAC appointments directly from your live calendar. No more phone tag or double-bookings."
        },
        {
          icon: <FileText className="h-8 w-8" />,
          title: "Job Tracking",
          description: "Track every HVAC job from quote to completion. View history, notes, and service records all in one place."
        },
        {
          icon: <DollarSign className="h-8 w-8" />,
          title: "Quick Invoicing",
          description: "Send professional invoices with payment links instantly after completing HVAC work. Get paid faster."
        },
        {
          icon: <MessageCircle className="h-8 w-8" />,
          title: "Automated Reviews",
          description: "Automatically request Google reviews from happy customers after job completion. Build your reputation effortlessly."
        }
      ]}
      workflowHeading="How HVAC Companies Use ServiceLoop"
      workflowSubheading="From quote request to payment in 4 simple steps"
      workflowSteps={[
        {
          title: "Customer Requests Quote",
          description: "Customer fills out your website form describing their HVAC needs (installation, servicing, repair, etc.)."
        },
        {
          title: "AI Generates Quote",
          description: "ServiceLoop AI creates a professional quote based on your pricing rules and sends it via WhatsApp/email automatically."
        },
        {
          title: "Customer Books Online",
          description: "Customer accepts quote and books an appointment from your live calendar. No phone calls needed."
        },
        {
          title: "Complete & Get Paid",
          description: "Mark job complete, send invoice with payment link, and automatically request a Google review."
        }
      ]}
      useCaseHeading="What HVAC Companies Use ServiceLoop For"
      useCaseSubheading="Real scenarios from HVAC businesses using our platform"
      useCases={[
        "Send professional quotes for aircon installations in under 2 minutes",
        "Automated follow-ups for pending quotes on HVAC servicing",
        "Let customers book service calls online 24/7",
        "Track all jobs from emergency repairs to annual maintenance",
        "Invoice customers immediately after completing aircon installations",
        "Automatically request reviews from satisfied customers"
      ]}
      faqs={[
        {
          question: "How does automated quoting work for HVAC?",
          answer: "You set up your pricing rules once (e.g., R8000 for split unit installation, R600 for aircon service). When a customer requests a quote, ServiceLoop AI generates it automatically based on the work described and sends it via WhatsApp or email."
        },
        {
          question: "Can customers book appointments online?",
          answer: "Yes! When you send a quote, it includes a booking link. Customers can accept the quote and immediately book a time slot from your live calendar. This eliminates phone tag and reduces no-shows."
        },
        {
          question: "Does it send follow-ups automatically?",
          answer: "Absolutely. You choose when to send follow-ups (e.g., 2 days after quote sent). ServiceLoop automatically sends WhatsApp and email reminders to customers who haven't responded, increasing your conversion rate."
        },
        {
          question: "How do I get paid faster?",
          answer: "After completing HVAC work, ServiceLoop sends a professional invoice with a payment link via WhatsApp/email. Customers can pay instantly with their card. You can also request deposits upfront for larger jobs like multi-unit installations."
        },
        {
          question: "How much does it cost?",
          answer: "ServiceLoop costs R350/month for HVAC businesses. This includes everything: AI quotes, online booking, WhatsApp automation, invoicing, and review requests. Try it free for 14 days, no credit card required."
        }
      ]}
      ctaHeading="Ready to Grow Your HVAC Business?"
      ctaSubheading="Join HVAC professionals across South Africa who are winning more jobs and saving hours every week with ServiceLoop."
    />
  );
}