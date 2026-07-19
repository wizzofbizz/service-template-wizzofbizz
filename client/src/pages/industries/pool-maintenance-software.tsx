
import { IndustryPageTemplate } from "@/components/IndustryPageTemplate";
import { Droplet, Calendar, FileText, MessageSquare, Beaker, Camera } from "lucide-react";

export default function PoolMaintenanceSoftwarePage() {
  return (
    <IndustryPageTemplate
      title="Pool Maintenance Software South Africa | Service Management"
      description="Complete pool maintenance business software for South African pool technicians. Manage quotes, scheduling, invoicing & client communication from R350/month. Try free."
      keywords="pool maintenance software south africa, pool service software, pool cleaning business software, pool technician crm, pool route management, pool chemical tracking"
      heroIcon={Droplet}
      heroLabel="For Pool Technicians"
      heroHeading="Pool Maintenance Software for South African Businesses"
      heroSubheading="Automate quotes for pool cleaning and maintenance. Let customers book online 24/7 and get paid faster."
      heroImage="https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=1920&q=80"
      heroImageAlt="Professional pool maintenance services"
      problemHeading="Common Challenges for Pool Maintenance Businesses"
      problems={[
        {
          title: "Manual Quoting Takes Too Long",
          description: "Calculating pool cleaning, chemical balancing, and equipment service costs manually wastes hours."
        },
        {
          title: "Following Up on Quotes",
          description: "Manually chasing pool maintenance quotes means lost revenue. Customers book with competitors who respond faster."
        },
        {
          title: "Scheduling Chaos",
          description: "Managing weekly pool service routes across multiple properties becomes overwhelming without automation."
        },
        {
          title: "Chasing Payments",
          description: "Following up on monthly pool maintenance payments takes time away from actual pool servicing."
        }
      ]}
      solutionHeading="How ServiceLoop Helps Pool Maintenance Businesses"
      solutionSubheading="Purpose-built features for pool maintenance professionals"
      features={[
        {
          icon: <FileText className="h-8 w-8" />,
          title: "AI Quote Generation",
          description: "Generate professional pool maintenance quotes in minutes. Include weekly service, chemicals, and equipment checks."
        },
        {
          icon: <MessageSquare className="h-8 w-8" />,
          title: "Smart Follow-ups",
          description: "Automated quote reminders via WhatsApp and email. Never lose another pool maintenance contract to slow follow-up."
        },
        {
          icon: <Calendar className="h-8 w-8" />,
          title: "Online Booking",
          description: "Customers book pool service appointments from your live calendar 24/7."
        },
        {
          icon: <Droplet className="h-8 w-8" />,
          title: "Job Tracking",
          description: "Track all pool maintenance jobs from initial quote to completion in one place."
        },
        {
          icon: <Beaker className="h-8 w-8" />,
          title: "Quick Invoicing",
          description: "Send invoices for completed pool maintenance work instantly with payment links included."
        },
        {
          icon: <Camera className="h-8 w-8" />,
          title: "Automated Reviews",
          description: "Request reviews automatically after each service. Build trust with pool condition photos."
        }
      ]}
      workflowHeading="Your Pool Maintenance Business on Autopilot"
      workflowSubheading="From quote to payment—streamlined for efficiency"
      workflowSteps={[
        {
          title: "Customer Requests Quote",
          description: "Customer describes their pool maintenance needs (weekly service, one-off clean, equipment repair) via your website."
        },
        {
          title: "AI Generates Professional Quote",
          description: "System creates pool maintenance quote based on pool size, service frequency, and your pricing rules."
        },
        {
          title: "Customer Books Appointment Online",
          description: "Customer accepts quote and selects preferred service schedule from your calendar."
        },
        {
          title: "Complete Job, Invoice & Get Reviews",
          description: "Mark job complete, send invoice automatically, and request reviews to grow your pool maintenance business."
        }
      ]}
      useCaseHeading="Real Pool Maintenance Business Workflows"
      useCaseSubheading="See how pool technicians use ServiceLoop daily"
      useCases={[
        "Send professional quotes for weekly pool maintenance in minutes",
        "Automated follow-ups for pending pool service quotes via WhatsApp",
        "Let customers book pool cleaning appointments online 24/7",
        "Track all pool maintenance contracts from quote to payment in one dashboard",
        "Invoice immediately after completing weekly pool service",
        "Automatically request reviews from happy customers with pool photos"
      ]}
      faqs={[
        {
          question: "How does automated quoting work for pool maintenance?",
          answer: "Set your pricing for different pool services (weekly cleaning, chemical balancing, equipment checks). When customers request quotes, the system generates professional estimates based on pool size and service frequency."
        },
        {
          question: "Can customers book pool maintenance online?",
          answer: "Yes! After accepting a quote, customers can book service appointments directly from your live calendar. Perfect for scheduling weekly maintenance and one-off pool cleans."
        },
        {
          question: "Does it send follow-ups automatically?",
          answer: "Absolutely. The system sends automatic reminders to customers who haven't responded to pool maintenance quotes. Follow-ups are sent via WhatsApp and email to maximize response rates."
        },
        {
          question: "How do I get paid faster for pool maintenance?",
          answer: "Send invoices immediately after completing services with built-in payment links. Customers can pay online instantly. Set up automated payment reminders for overdue invoices."
        },
        {
          question: "How much does pool maintenance software cost?",
          answer: "ServiceLoop starts at R350/month for pool maintenance businesses. This includes everything: website, automated quotes, scheduling, invoicing, and client communication. Try it free for 14 days."
        }
      ]}
      ctaHeading="Ready to Grow Your Pool Maintenance Business?"
      ctaSubheading="Join pool technicians across South Africa who are managing more clients with less hassle."
    />
  );
}
