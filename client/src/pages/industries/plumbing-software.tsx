import { IndustryPageTemplate } from "@/components/IndustryPageTemplate";
import { Droplet, Zap, Calendar, MessageCircle, FileText, DollarSign } from "lucide-react";

export default function PlumbingSoftwarePage() {
  return (
    <IndustryPageTemplate
      title="Plumbing Software South Africa | Job Management & Invoicing - ServiceLoop"
      description="Complete plumbing business software for South African plumbers. Manage quotes, jobs, invoicing & customer communication from R350/month. Try free."
      keywords="plumbing software south africa, plumber crm, plumbing job management software, plumbing invoicing software, plumber scheduling app, plumbing business management"
      heroIcon={Droplet}
      heroLabel="For Plumbers"
      heroHeading="Plumbing Software for South African Businesses"
      heroSubheading="Stop losing jobs to phone tag. Automate quotes, let customers book online 24/7, and manage your plumbing business from one simple platform."
      heroImage="https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=1920&q=80"
      heroImageAlt="Professional plumber using ServiceLoop on tablet"
      problemHeading="Common Challenges for Plumbing Businesses"
      problems={[
        {
          title: "Manual Quoting Takes Too Long",
          description: "Writing quotes for burst pipes and geyser installations manually wastes hours. Customers book with plumbers who respond faster."
        },
        {
          title: "Following Up on Quotes",
          description: "Manually chasing plumbing quotes means lost revenue. You forget to follow up and customers choose competitors."
        },
        {
          title: "Scheduling Emergency Call-Outs",
          description: "Managing emergency leak repairs alongside planned installations becomes chaos without proper scheduling."
        },
        {
          title: "Chasing Payments",
          description: "Sending invoices manually and waiting for payment delays your cash flow. No automated reminders means late payments."
        }
      ]}
      solutionHeading="How ServiceLoop Helps Plumbing Businesses"
      solutionSubheading="Everything you need to automate quotes, scheduling, and payments for your plumbing business."
      features={[
        {
          icon: <Zap className="h-8 w-8" />,
          title: "AI Quote Generation",
          description: "Generate professional plumbing quotes in seconds. AI suggests pricing based on your rules for burst pipes, geyser repairs, and drain cleaning."
        },
        {
          icon: <MessageCircle className="h-8 w-8" />,
          title: "Smart Follow-ups",
          description: "Automated WhatsApp and email reminders sent to customers who haven't accepted quotes yet. Never lose a job to lack of follow-up."
        },
        {
          icon: <Calendar className="h-8 w-8" />,
          title: "Online Booking",
          description: "Customers book plumbing appointments directly from your live calendar. No more phone tag or double-bookings."
        },
        {
          icon: <FileText className="h-8 w-8" />,
          title: "Job Tracking",
          description: "Track every plumbing job from quote to completion. View history, notes, and photos all in one place."
        },
        {
          icon: <DollarSign className="h-8 w-8" />,
          title: "Quick Invoicing",
          description: "Send professional invoices with payment links instantly after completing plumbing work. Get paid faster."
        },
        {
          icon: <MessageCircle className="h-8 w-8" />,
          title: "Automated Reviews",
          description: "Automatically request Google reviews from happy customers after job completion. Build your reputation effortlessly."
        }
      ]}
      workflowHeading="How Plumbers Use ServiceLoop"
      workflowSubheading="From quote request to payment in 4 simple steps"
      workflowSteps={[
        {
          title: "Customer Requests Quote",
          description: "Customer fills out your website form describing their plumbing issue (burst pipe, geyser replacement, etc.)."
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
      useCaseHeading="What Plumbers Use ServiceLoop For"
      useCaseSubheading="Real scenarios from plumbing businesses using our platform"
      useCases={[
        "Send professional quotes for geyser installations in under 2 minutes",
        "Automated follow-ups for pending quotes on bathroom renovations",
        "Let customers book emergency call-outs online 24/7",
        "Track all jobs from burst pipe repairs to compliance certificates",
        "Invoice customers immediately after completing drain cleaning",
        "Automatically request reviews from satisfied customers"
      ]}
      faqs={[
        {
          question: "How does automated quoting work for plumbing?",
          answer: "You set up your pricing rules once (e.g., R800 for burst pipe repair, R5000 for geyser installation). When a customer requests a quote, ServiceLoop AI generates it automatically based on the work described and sends it via WhatsApp or email."
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
          answer: "After completing a plumbing job, ServiceLoop sends a professional invoice with a payment link via WhatsApp/email. Customers can pay instantly with their card. You can also request deposits upfront for larger jobs like bathroom installations."
        },
        {
          question: "How much does it cost?",
          answer: "ServiceLoop costs R350/month for plumbers. This includes everything: AI quotes, online booking, WhatsApp automation, invoicing, and review requests. Try it free for 14 days, no credit card required."
        }
      ]}
      ctaHeading="Ready to Grow Your Plumbing Business?"
      ctaSubheading="Join plumbers across South Africa who are winning more jobs and saving hours every week with ServiceLoop."
    />
  );
}