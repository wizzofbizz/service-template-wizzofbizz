
import { IndustryPageTemplate } from "@/components/IndustryPageTemplate";
import { Home, FileText, Calendar, MessageSquare, Camera, Shield } from "lucide-react";

export default function RoofingSoftwarePage() {
  return (
    <IndustryPageTemplate
      title="Roofing Software South Africa | Job Management & Quotes"
      description="Complete roofing business software for South African roofers. Manage quotes, scheduling, invoicing & client communication from R350/month. Try free."
      keywords="roofing software south africa, roofing business software, roofer job management, roofing quotes, roofer crm, roof repair software"
      heroIcon={Home}
      heroLabel="For Roofers"
      heroHeading="Roofing Software for South African Businesses"
      heroSubheading="Automate quotes for roof repairs and installations. Let customers book online 24/7 and get paid faster."
      heroImage="https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=1920&q=80"
      heroImageAlt="Professional roofing services"
      problemHeading="Common Challenges for Roofing Businesses"
      problems={[
        {
          title: "Manual Quoting Takes Too Long",
          description: "Calculating materials, labor, and roof area manually for each project wastes hours and leads to errors."
        },
        {
          title: "Following Up on Quotes",
          description: "Manually chasing roofing quotes means lost revenue. Customers book with competitors who respond faster."
        },
        {
          title: "Scheduling Chaos",
          description: "Managing emergency leak repairs alongside planned installations becomes overwhelming without automation."
        },
        {
          title: "Chasing Payments",
          description: "Following up on payments for completed roofing work takes time away from actual roofing jobs."
        }
      ]}
      solutionHeading="How ServiceLoop Helps Roofing Businesses"
      solutionSubheading="Purpose-built features for roofing professionals"
      features={[
        {
          icon: <FileText className="h-8 w-8" />,
          title: "AI Quote Generation",
          description: "Generate professional roofing quotes in minutes. Calculate materials and labor based on roof size automatically."
        },
        {
          icon: <MessageSquare className="h-8 w-8" />,
          title: "Smart Follow-ups",
          description: "Automated quote reminders via WhatsApp and email. Never lose another roofing project to slow follow-up."
        },
        {
          icon: <Calendar className="h-8 w-8" />,
          title: "Online Booking",
          description: "Customers book roof inspections and emergency repairs from your live calendar 24/7."
        },
        {
          icon: <Home className="h-8 w-8" />,
          title: "Job Tracking",
          description: "Track all roofing projects from initial inspection to completion in one place."
        },
        {
          icon: <Shield className="h-8 w-8" />,
          title: "Quick Invoicing",
          description: "Send invoices for completed roofing work instantly with payment links included."
        },
        {
          icon: <Camera className="h-8 w-8" />,
          title: "Automated Reviews",
          description: "Request reviews automatically after completing projects. Document work with inspection photos."
        }
      ]}
      workflowHeading="Your Roofing Business on Autopilot"
      workflowSubheading="From quote to payment—streamlined for efficiency"
      workflowSteps={[
        {
          title: "Customer Requests Quote",
          description: "Customer describes their roofing needs (leak repair, replacement, new installation) via your website."
        },
        {
          title: "AI Generates Professional Quote",
          description: "System creates roofing quote based on roof size, materials needed, and your pricing rules."
        },
        {
          title: "Customer Books Appointment Online",
          description: "Customer accepts quote and selects preferred date for inspection or work from your calendar."
        },
        {
          title: "Complete Job, Invoice & Get Reviews",
          description: "Mark job complete, send invoice automatically, and request reviews to grow your roofing business."
        }
      ]}
      useCaseHeading="Real Roofing Business Workflows"
      useCaseSubheading="See how roofers use ServiceLoop daily"
      useCases={[
        "Send professional quotes for roof repairs and replacements in minutes",
        "Automated follow-ups for pending roofing quotes via WhatsApp",
        "Let customers book emergency leak inspections online 24/7",
        "Track all roofing projects from quote to payment in one dashboard",
        "Invoice immediately after completing roofing work",
        "Automatically request reviews from happy customers with project photos"
      ]}
      faqs={[
        {
          question: "How does automated quoting work for roofing?",
          answer: "Set your pricing for different roof types (tiles, IBR sheets, Harvey tiles) and services (repairs, replacements, installations). When customers request quotes, the system generates professional estimates based on roof size and your pricing rules."
        },
        {
          question: "Can customers book roofing appointments online?",
          answer: "Yes! After accepting a quote, customers can book inspection dates and project start dates directly from your live calendar. Perfect for scheduling both emergency repairs and planned installations."
        },
        {
          question: "Does it send follow-ups automatically?",
          answer: "Absolutely. The system sends automatic reminders to customers who haven't responded to roofing quotes. Follow-ups are sent via WhatsApp and email to maximize response rates."
        },
        {
          question: "How do I get paid faster for roofing work?",
          answer: "Send invoices immediately after completing jobs with built-in payment links. Customers can pay online instantly. Set up automated payment reminders for overdue invoices."
        },
        {
          question: "How much does roofing business software cost?",
          answer: "ServiceLoop starts at R350/month for roofing businesses. This includes everything: website, automated quotes, scheduling, invoicing, and client communication. Try it free for 14 days."
        }
      ]}
      ctaHeading="Ready to Grow Your Roofing Business?"
      ctaSubheading="Join roofers across South Africa who are managing more projects with less hassle."
    />
  );
}
