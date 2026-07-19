
import { IndustryPageTemplate } from "@/components/IndustryPageTemplate";
import { TreePine, Calendar, FileText, MessageSquare, DollarSign, Camera } from "lucide-react";

export default function LandscapingSoftwarePage() {
  return (
    <IndustryPageTemplate
      title="Landscaping Software South Africa | Job Management & Scheduling"
      description="Complete landscaping business software for South African landscapers. Manage quotes, scheduling, invoicing & client communication from R350/month. Try free."
      keywords="landscaping software south africa, landscaping business software, garden maintenance software, landscaping job management, landscaping crm, garden service scheduling"
      heroIcon={TreePine}
      heroLabel="For Landscapers"
      heroHeading="Landscaping Software for South African Businesses"
      heroSubheading="Automate quotes for garden maintenance and landscaping projects. Let customers book online 24/7 and get paid faster."
      heroImage="https://images.unsplash.com/photo-1558904541-efa843a96f01?w=1920&q=80"
      heroImageAlt="Professional landscaping services"
      problemHeading="Common Challenges for Landscaping Businesses"
      problems={[
        {
          title: "Manual Quoting Takes Too Long",
          description: "Calculating costs for different garden sizes, plant selections, and maintenance schedules manually wastes hours."
        },
        {
          title: "Following Up on Quotes",
          description: "Manually chasing landscaping quotes means lost revenue. Customers book with competitors who respond faster."
        },
        {
          title: "Scheduling Chaos",
          description: "Managing weekly garden maintenance schedules across multiple properties becomes overwhelming without automation."
        },
        {
          title: "Chasing Payments",
          description: "Monthly maintenance invoicing takes time away from actual landscaping work. Cash flow suffers from late payments."
        }
      ]}
      solutionHeading="How ServiceLoop Helps Landscaping Businesses"
      solutionSubheading="Purpose-built features for landscaping professionals"
      features={[
        {
          icon: <FileText className="h-8 w-8" />,
          title: "AI Quote Generation",
          description: "Generate professional landscaping quotes in minutes. Set pricing per square meter, plant type, or maintenance frequency."
        },
        {
          icon: <MessageSquare className="h-8 w-8" />,
          title: "Smart Follow-ups",
          description: "Automated quote reminders via WhatsApp and email. Never lose another landscaping project to slow follow-up."
        },
        {
          icon: <Calendar className="h-8 w-8" />,
          title: "Online Booking",
          description: "Customers book garden maintenance and project consultations from your live calendar 24/7."
        },
        {
          icon: <TreePine className="h-8 w-8" />,
          title: "Job Tracking",
          description: "Track all landscaping jobs from initial quote to project completion in one place."
        },
        {
          icon: <DollarSign className="h-8 w-8" />,
          title: "Quick Invoicing",
          description: "Send invoices for completed garden maintenance and landscaping projects instantly with payment links."
        },
        {
          icon: <Camera className="h-8 w-8" />,
          title: "Automated Reviews",
          description: "Request reviews automatically after completing landscaping projects. Build your portfolio with before/after photos."
        }
      ]}
      workflowHeading="Your Landscaping Business on Autopilot"
      workflowSubheading="From quote to payment—streamlined for efficiency"
      workflowSteps={[
        {
          title: "Customer Requests Quote",
          description: "Customer describes their garden maintenance or landscaping project needs via your website."
        },
        {
          title: "AI Generates Professional Quote",
          description: "System creates landscaping quote based on garden size, services required, and your pricing rules."
        },
        {
          title: "Customer Books Appointment Online",
          description: "Customer accepts quote and selects preferred date for consultation or maintenance from your calendar."
        },
        {
          title: "Complete Job, Invoice & Get Reviews",
          description: "Mark job complete, send invoice automatically, and request reviews to grow your landscaping business."
        }
      ]}
      useCaseHeading="Real Landscaping Business Workflows"
      useCaseSubheading="See how landscapers use ServiceLoop daily"
      useCases={[
        "Send professional quotes for garden redesign projects in minutes",
        "Automated follow-ups for pending landscaping quotes via WhatsApp",
        "Let customers book weekly garden maintenance slots online 24/7",
        "Track all maintenance contracts and one-off projects from quote to payment",
        "Invoice immediately after completing garden maintenance work",
        "Automatically request reviews from happy customers with before/after photos"
      ]}
      faqs={[
        {
          question: "How does automated quoting work for landscaping?",
          answer: "Set your pricing per square meter, plant type, or service (lawn mowing, hedge trimming, etc.). When customers request quotes, the system generates professional estimates based on your rules. You can review and adjust before sending."
        },
        {
          question: "Can customers book garden maintenance online?",
          answer: "Yes! After accepting a quote, customers can book appointments directly from your live calendar. Perfect for weekly/monthly maintenance schedules and project consultations."
        },
        {
          question: "Does it send follow-ups automatically?",
          answer: "Absolutely. The system sends automatic reminders to customers who haven't responded to landscaping quotes. Follow-ups are sent via WhatsApp and email to maximize response rates."
        },
        {
          question: "How do I get paid faster for landscaping work?",
          answer: "Send invoices immediately after completing jobs with built-in payment links. Customers can pay online instantly. Set up automated payment reminders for overdue invoices."
        },
        {
          question: "How much does landscaping business software cost?",
          answer: "ServiceLoop starts at R350/month for landscaping businesses. This includes everything: website, automated quotes, scheduling, invoicing, and client communication. Try it free for 14 days."
        }
      ]}
      ctaHeading="Ready to Grow Your Landscaping Business?"
      ctaSubheading="Join landscapers across South Africa who are managing more jobs with less hassle."
    />
  );
}
