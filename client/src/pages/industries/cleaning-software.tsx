import { IndustryPageTemplate } from "@/components/IndustryPageTemplate";
import { Sparkles, Zap, Calendar, MessageCircle, FileText, DollarSign } from "lucide-react";

export default function CleaningSoftwarePage() {
  return (
    <IndustryPageTemplate
      title="Cleaning Business Software SA | Scheduling & Client Management - ServiceLoop"
      description="Manage your cleaning business with ease. Schedule cleaners, track jobs, send quotes & invoices. Built for SA cleaning companies. From R350/month."
      keywords="cleaning business software south africa, cleaning company crm, cleaning service scheduling software, cleaning business management app, cleaner scheduling, cleaning invoicing"
      heroIcon={Sparkles}
      heroLabel="For Cleaning Companies"
      heroHeading="Cleaning Software for South African Businesses"
      heroSubheading="Manage your cleaning teams, recurring jobs, and customer communication all in one place. Spend less time on admin, more time growing your business."
      heroImage="https://images.unsplash.com/photo-1581578731548-c64695c6e430?w=1920&q=80"
      heroImageAlt="Professional cleaning company using ServiceLoop"
      problemHeading="Common Challenges for Cleaning Businesses"
      problems={[
        {
          title: "Manual Quoting Takes Too Long",
          description: "Writing quotes for office cleaning and home deep cleans manually wastes hours. Customers book with companies who respond faster."
        },
        {
          title: "Following Up on Quotes",
          description: "Manually chasing cleaning quotes means lost revenue. You forget to follow up and customers choose competitors."
        },
        {
          title: "Scheduling Chaos",
          description: "Managing recurring weekly cleans across multiple properties becomes overwhelming without automation."
        },
        {
          title: "Chasing Payments",
          description: "Sending invoices manually and waiting for payment delays your cash flow. No automated reminders means late payments."
        }
      ]}
      solutionHeading="How ServiceLoop Helps Cleaning Businesses"
      solutionSubheading="Everything you need to automate quotes, scheduling, and payments for your cleaning business."
      features={[
        {
          icon: <Zap className="h-8 w-8" />,
          title: "AI Quote Generation",
          description: "Generate professional cleaning quotes in seconds. AI suggests pricing based on your rules for office cleaning, deep cleans, and move-out cleans."
        },
        {
          icon: <MessageCircle className="h-8 w-8" />,
          title: "Smart Follow-ups",
          description: "Automated WhatsApp and email reminders sent to customers who haven't accepted quotes yet. Never lose a job to lack of follow-up."
        },
        {
          icon: <Calendar className="h-8 w-8" />,
          title: "Online Booking",
          description: "Customers book cleaning appointments directly from your live calendar. No more phone tag or double-bookings."
        },
        {
          icon: <FileText className="h-8 w-8" />,
          title: "Job Tracking",
          description: "Track every cleaning job from quote to completion. View history, notes, and photos all in one place."
        },
        {
          icon: <DollarSign className="h-8 w-8" />,
          title: "Quick Invoicing",
          description: "Send professional invoices with payment links instantly after completing cleaning work. Get paid faster."
        },
        {
          icon: <MessageCircle className="h-8 w-8" />,
          title: "Automated Reviews",
          description: "Automatically request Google reviews from happy customers after job completion. Build your reputation effortlessly."
        }
      ]}
      workflowHeading="How Cleaning Companies Use ServiceLoop"
      workflowSubheading="From quote request to payment in 4 simple steps"
      workflowSteps={[
        {
          title: "Customer Requests Quote",
          description: "Customer fills out your website form describing their cleaning needs (office cleaning, deep clean, etc.)."
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
      useCaseHeading="What Cleaning Companies Use ServiceLoop For"
      useCaseSubheading="Real scenarios from cleaning businesses using our platform"
      useCases={[
        "Send professional quotes for office cleaning in under 2 minutes",
        "Automated follow-ups for pending quotes on deep cleaning services",
        "Let customers book cleaning appointments online 24/7",
        "Track all jobs from initial clean to recurring weekly services",
        "Invoice customers immediately after completing move-out cleans",
        "Automatically request reviews from satisfied customers"
      ]}
      faqs={[
        {
          question: "How does automated quoting work for cleaning?",
          answer: "You set up your pricing rules once (e.g., R500 for 2-bedroom apartment, R1200 for office cleaning). When a customer requests a quote, ServiceLoop AI generates it automatically based on the work described and sends it via WhatsApp or email."
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
          answer: "After completing a cleaning job, ServiceLoop sends a professional invoice with a payment link via WhatsApp/email. Customers can pay instantly with their card. You can also request deposits upfront for larger jobs."
        },
        {
          question: "How much does it cost?",
          answer: "ServiceLoop costs R350/month for cleaning companies. This includes everything: AI quotes, online booking, WhatsApp automation, invoicing, and review requests. Try it free for 14 days, no credit card required."
        }
      ]}
      ctaHeading="Ready to Grow Your Cleaning Business?"
      ctaSubheading="Join cleaning companies across South Africa who are winning more jobs and saving hours every week with ServiceLoop."
    />
  );
}