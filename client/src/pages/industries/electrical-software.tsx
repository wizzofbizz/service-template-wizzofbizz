import { IndustryPageTemplate } from "@/components/IndustryPageTemplate";
import { Plug, Zap, Calendar, MessageCircle, FileText, DollarSign } from "lucide-react";

export default function ElectricalSoftwarePage() {
  return (
    <IndustryPageTemplate
      title="Electrical Software South Africa | Electrician Job Management - ServiceLoop"
      description="Complete software for electricians. Manage quotes, compliance certificates, job scheduling & invoicing. Built for SA electrical contractors. Try free."
      keywords="electrical software south africa, electrician crm, electrical job management software, compliance certificate software, electrician scheduling, electrical invoicing"
      heroIcon={Plug}
      heroLabel="For Electricians"
      heroHeading="Electrical Software for South African Contractors"
      heroSubheading="Manage electrical jobs, compliance certificates, and customer communication from one platform. Win more contracts and reduce admin time."
      heroImage="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1920&q=80"
      heroImageAlt="Professional electrician using ServiceLoop on tablet"
      problemHeading="Common Challenges for Electrical Contractors"
      problems={[
        {
          title: "Manual Quoting Takes Too Long",
          description: "Writing quotes for rewiring and compliance certificates manually wastes hours. Customers book with electricians who respond faster."
        },
        {
          title: "Following Up on Quotes",
          description: "Manually chasing electrical quotes means lost revenue. You forget to follow up and customers choose competitors."
        },
        {
          title: "Scheduling Chaos",
          description: "Managing emergency call-outs alongside planned installations becomes overwhelming without automation."
        },
        {
          title: "Chasing Payments",
          description: "Sending invoices manually and waiting for payment delays your cash flow. No automated reminders means late payments."
        }
      ]}
      solutionHeading="How ServiceLoop Helps Electrical Contractors"
      solutionSubheading="Everything you need to automate quotes, scheduling, and payments for your electrical business."
      features={[
        {
          icon: <Zap className="h-8 w-8" />,
          title: "AI Quote Generation",
          description: "Generate professional electrical quotes in seconds. AI suggests pricing based on your rules for rewiring, COCs, and installations."
        },
        {
          icon: <MessageCircle className="h-8 w-8" />,
          title: "Smart Follow-ups",
          description: "Automated WhatsApp and email reminders sent to customers who haven't accepted quotes yet. Never lose a job to lack of follow-up."
        },
        {
          icon: <Calendar className="h-8 w-8" />,
          title: "Online Booking",
          description: "Customers book electrical appointments directly from your live calendar. No more phone tag or double-bookings."
        },
        {
          icon: <FileText className="h-8 w-8" />,
          title: "Job Tracking",
          description: "Track every electrical job from quote to completion. View history, notes, and compliance documents all in one place."
        },
        {
          icon: <DollarSign className="h-8 w-8" />,
          title: "Quick Invoicing",
          description: "Send professional invoices with payment links instantly after completing electrical work. Get paid faster."
        },
        {
          icon: <MessageCircle className="h-8 w-8" />,
          title: "Automated Reviews",
          description: "Automatically request Google reviews from happy customers after job completion. Build your reputation effortlessly."
        }
      ]}
      workflowHeading="How Electricians Use ServiceLoop"
      workflowSubheading="From quote request to payment in 4 simple steps"
      workflowSteps={[
        {
          title: "Customer Requests Quote",
          description: "Customer fills out your website form describing their electrical needs (rewiring, COC, new installation, etc.)."
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
      useCaseHeading="What Electricians Use ServiceLoop For"
      useCaseSubheading="Real scenarios from electrical contractors using our platform"
      useCases={[
        "Send professional quotes for house rewiring in under 2 minutes",
        "Automated follow-ups for pending quotes on compliance certificates",
        "Let customers book electrical inspections online 24/7",
        "Track all jobs from emergency call-outs to planned installations",
        "Invoice customers immediately after completing DB board upgrades",
        "Automatically request reviews from satisfied customers"
      ]}
      faqs={[
        {
          question: "How does automated quoting work for electrical work?",
          answer: "You set up your pricing rules once (e.g., R1500 for COC, R800 per point for rewiring). When a customer requests a quote, ServiceLoop AI generates it automatically based on the work described and sends it via WhatsApp or email."
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
          answer: "After completing electrical work, ServiceLoop sends a professional invoice with a payment link via WhatsApp/email. Customers can pay instantly with their card. You can also request deposits upfront for larger jobs like house rewiring."
        },
        {
          question: "How much does it cost?",
          answer: "ServiceLoop costs R350/month for electricians. This includes everything: AI quotes, online booking, WhatsApp automation, invoicing, and review requests. Try it free for 14 days, no credit card required."
        }
      ]}
      ctaHeading="Ready to Grow Your Electrical Business?"
      ctaSubheading="Join electricians across South Africa who are winning more contracts and saving hours every week with ServiceLoop."
    />
  );
}