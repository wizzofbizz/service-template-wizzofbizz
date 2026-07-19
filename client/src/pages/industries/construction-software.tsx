
import { IndustryPageTemplate } from "@/components/IndustryPageTemplate";
import { Hammer, FileText, Calendar, Camera, DollarSign, Wrench } from "lucide-react";

export default function ConstructionSoftwarePage() {
  return (
    <IndustryPageTemplate
      title="Construction Software South Africa | Project Management & Quotes"
      description="Complete construction business software for South African builders. Manage quotes, scheduling, invoicing & client communication from R350/month. Try free."
      keywords="construction software south africa, construction business software, builder job management, construction quotes, builder crm, construction project management"
      heroIcon={Hammer}
      heroLabel="For Builders"
      heroHeading="Construction Software for South African Businesses"
      heroSubheading="Automate quotes for building projects. Let customers book online 24/7 and get paid faster."
      heroImage="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1920&q=80"
      heroImageAlt="Professional construction services"
      problemHeading="Common Challenges for Construction Businesses"
      problems={[
        {
          title: "Manual Quoting Takes Too Long",
          description: "Calculating materials, labor, and timelines for construction projects manually wastes hours and leads to errors."
        },
        {
          title: "Following Up on Quotes",
          description: "Manually chasing construction quotes means lost revenue. Customers book with competitors who respond faster."
        },
        {
          title: "Scheduling Chaos",
          description: "Managing multi-phase construction projects becomes overwhelming without proper scheduling tools."
        },
        {
          title: "Chasing Payments",
          description: "Following up on milestone payments for construction work takes time away from actual building."
        }
      ]}
      solutionHeading="How ServiceLoop Helps Construction Businesses"
      solutionSubheading="Purpose-built features for construction professionals"
      features={[
        {
          icon: <FileText className="h-8 w-8" />,
          title: "AI Quote Generation",
          description: "Generate professional construction quotes in minutes. Include materials, labor, and timelines automatically."
        },
        {
          icon: <Wrench className="h-8 w-8" />,
          title: "Smart Follow-ups",
          description: "Automated quote reminders via WhatsApp and email. Never lose another construction project to slow follow-up."
        },
        {
          icon: <Calendar className="h-8 w-8" />,
          title: "Online Booking",
          description: "Customers book site assessments and consultations from your live calendar 24/7."
        },
        {
          icon: <Hammer className="h-8 w-8" />,
          title: "Job Tracking",
          description: "Track all construction projects from initial quote to completion in one place."
        },
        {
          icon: <DollarSign className="h-8 w-8" />,
          title: "Quick Invoicing",
          description: "Send invoices for completed construction work instantly with payment links included."
        },
        {
          icon: <Camera className="h-8 w-8" />,
          title: "Automated Reviews",
          description: "Request reviews automatically after completing projects. Showcase your work with progress photos."
        }
      ]}
      workflowHeading="Your Construction Business on Autopilot"
      workflowSubheading="From quote to payment—streamlined for efficiency"
      workflowSteps={[
        {
          title: "Customer Requests Quote",
          description: "Customer describes their building project (extension, renovation, new build) via your website."
        },
        {
          title: "AI Generates Professional Quote",
          description: "System creates construction quote based on project scope, materials needed, and your pricing rules."
        },
        {
          title: "Customer Books Appointment Online",
          description: "Customer accepts quote and selects preferred date for site assessment from your calendar."
        },
        {
          title: "Complete Job, Invoice & Get Reviews",
          description: "Mark job complete, send invoice automatically, and request reviews to grow your construction business."
        }
      ]}
      useCaseHeading="Real Construction Business Workflows"
      useCaseSubheading="See how builders use ServiceLoop daily"
      useCases={[
        "Send professional quotes for building projects in minutes",
        "Automated follow-ups for pending construction quotes via WhatsApp",
        "Let customers book site assessments online 24/7",
        "Track all construction projects from quote to payment in one dashboard",
        "Invoice immediately after completing project milestones",
        "Automatically request reviews from happy customers with project photos"
      ]}
      faqs={[
        {
          question: "How does automated quoting work for construction?",
          answer: "Set your pricing for different construction services (foundations, walls, roofing, etc.). When customers request quotes, the system generates professional estimates based on project scope and your pricing rules. You can break down costs by phase."
        },
        {
          question: "Can customers book construction appointments online?",
          answer: "Yes! After accepting a quote, customers can book site assessments and project start dates directly from your live calendar. Perfect for scheduling consultations and multi-phase construction projects."
        },
        {
          question: "Does it send follow-ups automatically?",
          answer: "Absolutely. The system sends automatic reminders to customers who haven't responded to construction quotes. Follow-ups are sent via WhatsApp and email to maximize response rates."
        },
        {
          question: "How do I get paid faster for construction work?",
          answer: "Send invoices immediately after completing project milestones with built-in payment links. Customers can pay online instantly. Set up automated payment reminders for overdue invoices."
        },
        {
          question: "How much does construction business software cost?",
          answer: "ServiceLoop starts at R350/month for construction businesses. This includes everything: website, automated quotes, scheduling, invoicing, and client communication. Try it free for 14 days."
        }
      ]}
      ctaHeading="Ready to Grow Your Construction Business?"
      ctaSubheading="Join builders across South Africa who are managing more projects with less hassle."
    />
  );
}
