
import { IndustryPageTemplate } from "@/components/IndustryPageTemplate";
import { Wrench, Calendar, FileText, MessageSquare, Camera, DollarSign } from "lucide-react";

export default function HandymanSoftwarePage() {
  return (
    <IndustryPageTemplate
      title="Handyman Software South Africa | Job Management & Invoicing"
      description="Complete handyman business software for South African handymen. Manage quotes, scheduling, invoicing & client communication from R350/month. Try free."
      keywords="handyman software south africa, handyman business software, handyman job management, handyman crm, maintenance service software, home repair software"
      heroIcon={Wrench}
      heroLabel="For Handymen"
      heroHeading="Handyman Software for South African Businesses"
      heroSubheading="Automate quotes for home repairs and maintenance. Let customers book online 24/7 and get paid faster."
      heroImage="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1920&q=80"
      heroImageAlt="Professional handyman services"
      problemHeading="Common Challenges for Handyman Businesses"
      problems={[
        {
          title: "Manual Quoting Takes Too Long",
          description: "Quoting multiple small jobs combining different repairs manually is time-consuming and error-prone."
        },
        {
          title: "Following Up on Quotes",
          description: "Manually chasing handyman quotes means lost revenue. Customers book with competitors who respond faster."
        },
        {
          title: "Scheduling Chaos",
          description: "Managing multiple small jobs across different locations becomes overwhelming without proper scheduling tools."
        },
        {
          title: "Chasing Payments",
          description: "Following up on payments for completed repair work takes time away from actual handyman jobs."
        }
      ]}
      solutionHeading="How ServiceLoop Helps Handyman Businesses"
      solutionSubheading="Purpose-built features for handyman professionals"
      features={[
        {
          icon: <FileText className="h-8 w-8" />,
          title: "AI Quote Generation",
          description: "Generate professional handyman quotes in minutes. Combine multiple repairs into one quote automatically."
        },
        {
          icon: <MessageSquare className="h-8 w-8" />,
          title: "Smart Follow-ups",
          description: "Automated quote reminders via WhatsApp and email. Never lose another repair job to slow follow-up."
        },
        {
          icon: <Calendar className="h-8 w-8" />,
          title: "Online Booking",
          description: "Customers book handyman appointments from your live calendar 24/7. Perfect for emergency repairs."
        },
        {
          icon: <Wrench className="h-8 w-8" />,
          title: "Job Tracking",
          description: "Track all handyman jobs from initial quote to completion in one place."
        },
        {
          icon: <DollarSign className="h-8 w-8" />,
          title: "Quick Invoicing",
          description: "Send invoices for completed repair work instantly with payment links included."
        },
        {
          icon: <Camera className="h-8 w-8" />,
          title: "Automated Reviews",
          description: "Request reviews automatically after completing jobs. Build trust with before/after photos."
        }
      ]}
      workflowHeading="Your Handyman Business on Autopilot"
      workflowSubheading="From quote to payment—streamlined for efficiency"
      workflowSteps={[
        {
          title: "Customer Requests Quote",
          description: "Customer describes their home repair needs (leaking tap, broken door, etc.) via your website."
        },
        {
          title: "AI Generates Professional Quote",
          description: "System creates handyman quote based on repair type, materials needed, and your pricing rules."
        },
        {
          title: "Customer Books Appointment Online",
          description: "Customer accepts quote and selects preferred time slot from your calendar."
        },
        {
          title: "Complete Job, Invoice & Get Reviews",
          description: "Mark job complete, send invoice automatically, and request reviews to grow your handyman business."
        }
      ]}
      useCaseHeading="Real Handyman Business Workflows"
      useCaseSubheading="See how handymen use ServiceLoop daily"
      useCases={[
        "Send professional quotes combining multiple small repairs in minutes",
        "Automated follow-ups for pending handyman quotes via WhatsApp",
        "Let customers book emergency repair slots online 24/7",
        "Track all jobs from quote to payment in one dashboard",
        "Invoice immediately after completing repair work",
        "Automatically request reviews from happy customers"
      ]}
      faqs={[
        {
          question: "How does automated quoting work for handyman services?",
          answer: "Set your pricing for common repairs (tap fixing, door hanging, shelf installation, etc.). When customers request quotes, the system generates professional estimates. You can add multiple services to one quote automatically."
        },
        {
          question: "Can customers book handyman appointments online?",
          answer: "Yes! After accepting a quote, customers can book appointments directly from your live calendar. Perfect for scheduling emergency repairs and regular maintenance."
        },
        {
          question: "Does it send follow-ups automatically?",
          answer: "Absolutely. The system sends automatic reminders to customers who haven't responded to handyman quotes. Follow-ups are sent via WhatsApp and email."
        },
        {
          question: "How do I get paid faster for handyman work?",
          answer: "Send invoices immediately after completing jobs with built-in payment links. Customers can pay online instantly. Set up automated payment reminders for overdue invoices."
        },
        {
          question: "How much does handyman business software cost?",
          answer: "ServiceLoop starts at R350/month for handyman businesses. This includes everything: website, automated quotes, scheduling, invoicing, and client communication. Try it free for 14 days."
        }
      ]}
      ctaHeading="Ready to Grow Your Handyman Business?"
      ctaSubheading="Join handymen across South Africa who are managing more jobs with less hassle."
    />
  );
}
