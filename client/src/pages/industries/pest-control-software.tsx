
import { IndustryPageTemplate } from "@/components/IndustryPageTemplate";
import { Bug, Calendar, FileText, MessageSquare, Shield, Camera } from "lucide-react";

export default function PestControlSoftwarePage() {
  return (
    <IndustryPageTemplate
      title="Pest Control Software South Africa | Treatment Scheduling"
      description="Complete pest control business software for South African pest control operators. Manage quotes, scheduling, invoicing & client communication from R350/month. Try free."
      keywords="pest control software south africa, pest control business software, pest control management, pest control crm, fumigation software, pest control scheduling"
      heroIcon={Bug}
      heroLabel="For Pest Control"
      heroHeading="Pest Control Software for South African Businesses"
      heroSubheading="Automate quotes for pest treatments. Let customers book online 24/7 and get paid faster."
      heroImage="https://images.unsplash.com/photo-1582719366680-97b0a17832cc?w=1920&q=80"
      heroImageAlt="Professional pest control services"
      problemHeading="Common Challenges for Pest Control Businesses"
      problems={[
        {
          title: "Manual Quoting Takes Too Long",
          description: "Calculating treatment costs for different pest types and property sizes manually wastes hours."
        },
        {
          title: "Following Up on Quotes",
          description: "Manually chasing pest control quotes means lost revenue. Customers book with competitors who respond faster."
        },
        {
          title: "Scheduling Chaos",
          description: "Managing emergency call-outs alongside scheduled treatments becomes overwhelming without automation."
        },
        {
          title: "Chasing Payments",
          description: "Following up on payments for completed treatments takes time away from actual pest control work."
        }
      ]}
      solutionHeading="How ServiceLoop Helps Pest Control Businesses"
      solutionSubheading="Purpose-built features for pest control professionals"
      features={[
        {
          icon: <FileText className="h-8 w-8" />,
          title: "AI Quote Generation",
          description: "Generate professional pest control quotes in minutes. Include treatment type, follow-ups, and guarantees automatically."
        },
        {
          icon: <MessageSquare className="h-8 w-8" />,
          title: "Smart Follow-ups",
          description: "Automated quote reminders via WhatsApp and email. Never lose another pest control job to slow follow-up."
        },
        {
          icon: <Calendar className="h-8 w-8" />,
          title: "Online Booking",
          description: "Customers book pest inspections and emergency treatments from your live calendar 24/7."
        },
        {
          icon: <Bug className="h-8 w-8" />,
          title: "Job Tracking",
          description: "Track all pest control jobs from initial inspection to follow-up treatments in one place."
        },
        {
          icon: <Shield className="h-8 w-8" />,
          title: "Quick Invoicing",
          description: "Send invoices for completed treatments instantly with payment links included."
        },
        {
          icon: <Camera className="h-8 w-8" />,
          title: "Automated Reviews",
          description: "Request reviews automatically after completing treatments. Document work with inspection photos."
        }
      ]}
      workflowHeading="Your Pest Control Business on Autopilot"
      workflowSubheading="From quote to payment—streamlined for efficiency"
      workflowSteps={[
        {
          title: "Customer Requests Quote",
          description: "Customer describes their pest problem (termites, cockroaches, rodents, etc.) via your website."
        },
        {
          title: "AI Generates Professional Quote",
          description: "System creates pest control quote based on pest type, property size, and your pricing rules."
        },
        {
          title: "Customer Books Appointment Online",
          description: "Customer accepts quote and selects preferred inspection date from your calendar."
        },
        {
          title: "Complete Job, Invoice & Get Reviews",
          description: "Mark job complete, send invoice automatically, and request reviews to grow your pest control business."
        }
      ]}
      useCaseHeading="Real Pest Control Business Workflows"
      useCaseSubheading="See how pest control operators use ServiceLoop daily"
      useCases={[
        "Send professional quotes for pest treatments in minutes",
        "Automated follow-ups for pending pest control quotes via WhatsApp",
        "Let customers book emergency treatments online 24/7",
        "Track all pest control jobs from quote to payment in one dashboard",
        "Invoice immediately after completing treatments",
        "Automatically request reviews from happy customers"
      ]}
      faqs={[
        {
          question: "How does automated quoting work for pest control?",
          answer: "Set your pricing for different pest types (termites, cockroaches, rodents, bedbugs) and property sizes. When customers request quotes, the system generates professional estimates including treatment and follow-up visits."
        },
        {
          question: "Can customers book pest control appointments online?",
          answer: "Yes! After accepting a quote, customers can book inspection dates and treatment appointments directly from your live calendar. Perfect for scheduling both emergency call-outs and preventative treatments."
        },
        {
          question: "Does it send follow-ups automatically?",
          answer: "Absolutely. The system sends automatic reminders to customers who haven't responded to pest control quotes. Follow-ups are sent via WhatsApp and email to maximize response rates."
        },
        {
          question: "How do I get paid faster for pest control work?",
          answer: "Send invoices immediately after completing treatments with built-in payment links. Customers can pay online instantly. Set up automated payment reminders for overdue invoices."
        },
        {
          question: "How much does pest control software cost?",
          answer: "ServiceLoop starts at R350/month for pest control businesses. This includes everything: website, automated quotes, scheduling, invoicing, and client communication. Try it free for 14 days."
        }
      ]}
      ctaHeading="Ready to Grow Your Pest Control Business?"
      ctaSubheading="Join pest control operators across South Africa who are managing more clients with less hassle."
    />
  );
}
