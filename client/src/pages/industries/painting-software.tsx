
import { IndustryPageTemplate } from "@/components/IndustryPageTemplate";
import { PaintBucket, Calculator, FileText, MessageSquare, Calendar, Camera } from "lucide-react";

export default function PaintingSoftwarePage() {
  return (
    <IndustryPageTemplate
      title="Painting Software South Africa | Quotes & Project Management"
      description="Complete painting business software for South African painters. Manage quotes, scheduling, invoicing & client communication from R350/month. Try free."
      keywords="painting software south africa, painting business software, painter job management, painting quotes, painter crm, house painting software"
      heroIcon={PaintBucket}
      heroLabel="For Painters"
      heroHeading="Painting Software for South African Businesses"
      heroSubheading="Automate quotes for painting projects. Let customers book online 24/7 and get paid faster."
      heroImage="https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=1920&q=80"
      heroImageAlt="Professional painting services"
      problemHeading="Common Challenges for Painting Businesses"
      problems={[
        {
          title: "Manual Quoting Takes Too Long",
          description: "Calculating paint quantities, surface prep, and labor costs manually for each room wastes hours."
        },
        {
          title: "Following Up on Quotes",
          description: "Manually chasing painting quotes means lost revenue. Customers book with competitors who respond faster."
        },
        {
          title: "Scheduling Chaos",
          description: "Managing multi-day painting projects across different properties becomes overwhelming without automation."
        },
        {
          title: "Chasing Payments",
          description: "Following up on payments for completed painting work takes time away from actual painting jobs."
        }
      ]}
      solutionHeading="How ServiceLoop Helps Painting Businesses"
      solutionSubheading="Purpose-built features for painting professionals"
      features={[
        {
          icon: <Calculator className="h-8 w-8" />,
          title: "AI Quote Generation",
          description: "Generate professional painting quotes in minutes based on square meters, paint type, and number of coats."
        },
        {
          icon: <MessageSquare className="h-8 w-8" />,
          title: "Smart Follow-ups",
          description: "Automated quote reminders via WhatsApp and email. Never lose another painting project to slow follow-up."
        },
        {
          icon: <Calendar className="h-8 w-8" />,
          title: "Online Booking",
          description: "Customers book painting consultations and project start dates from your live calendar 24/7."
        },
        {
          icon: <PaintBucket className="h-8 w-8" />,
          title: "Job Tracking",
          description: "Track all painting projects from initial quote to completion in one place."
        },
        {
          icon: <Camera className="h-8 w-8" />,
          title: "Quick Invoicing",
          description: "Send invoices for completed painting work instantly with payment links included."
        },
        {
          icon: <FileText className="h-8 w-8" />,
          title: "Automated Reviews",
          description: "Request reviews automatically after completing projects. Showcase your work with before/after photos."
        }
      ]}
      workflowHeading="Your Painting Business on Autopilot"
      workflowSubheading="From quote to payment—streamlined for efficiency"
      workflowSteps={[
        {
          title: "Customer Requests Quote",
          description: "Customer describes their painting project (interior/exterior, room sizes, paint preferences) via your website."
        },
        {
          title: "AI Generates Professional Quote",
          description: "System creates painting quote based on square meters, paint type, prep work, and your pricing rules."
        },
        {
          title: "Customer Books Appointment Online",
          description: "Customer accepts quote and selects preferred start date from your calendar."
        },
        {
          title: "Complete Job, Invoice & Get Reviews",
          description: "Mark job complete, send invoice automatically, and request reviews to grow your painting business."
        }
      ]}
      useCaseHeading="Real Painting Business Workflows"
      useCaseSubheading="See how painters use ServiceLoop daily"
      useCases={[
        "Send professional quotes for interior/exterior painting in minutes",
        "Automated follow-ups for pending painting quotes via WhatsApp",
        "Let customers book project consultations online 24/7",
        "Track all painting projects from quote to payment in one dashboard",
        "Invoice immediately after completing painting work",
        "Automatically request reviews from happy customers with project photos"
      ]}
      faqs={[
        {
          question: "How does automated quoting work for painting?",
          answer: "Set your pricing per square meter for different paint types (interior, exterior, premium, standard). When customers request quotes, the system generates professional estimates based on room sizes and your pricing rules."
        },
        {
          question: "Can customers book painting appointments online?",
          answer: "Yes! After accepting a quote, customers can book project start dates and consultations directly from your live calendar. Perfect for scheduling multi-day painting projects."
        },
        {
          question: "Does it send follow-ups automatically?",
          answer: "Absolutely. The system sends automatic reminders to customers who haven't responded to painting quotes. Follow-ups are sent via WhatsApp and email to maximize response rates."
        },
        {
          question: "How do I get paid faster for painting work?",
          answer: "Send invoices immediately after completing jobs with built-in payment links. Customers can pay online instantly. Set up automated payment reminders for overdue invoices."
        },
        {
          question: "How much does painting business software cost?",
          answer: "ServiceLoop starts at R350/month for painting businesses. This includes everything: website, automated quotes, scheduling, invoicing, and client communication. Try it free for 14 days."
        }
      ]}
      ctaHeading="Ready to Grow Your Painting Business?"
      ctaSubheading="Join painters across South Africa who are managing more projects with less hassle."
    />
  );
}
