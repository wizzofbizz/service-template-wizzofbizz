
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { SEOMetaTags } from "@/components/SEOMetaTags";
import { createFAQSchema } from "@/lib/structured-data";
import { Footer } from "@/components/Footer";
import { FeatureNavigation } from "@/components/FeatureNavigation";

const faqCategories = [
  {
    category: "Getting Started",
    questions: [
      {
        question: "What is ServiceLoop?",
        answer: "ServiceLoop is an all-in-one business management platform for service professionals in South Africa. We help plumbers, electricians, landscapers, and other home service businesses automate quotes, manage schedules, and get paid faster—all from one simple platform."
      },
      {
        question: "How much does ServiceLoop cost?",
        answer: "ServiceLoop starts at R350/month with our Connect plan. This includes your professional website, automated quotes, WhatsApp integration, calendar scheduling, invoicing, and more. We offer a 14-day free trial with no credit card required, so you can try everything risk-free."
      },
      {
        question: "Can I try ServiceLoop for free?",
        answer: "Yes! We offer a 14-day free trial with full access to all features. No credit card required to start. You can explore automated quotes, calendar booking, WhatsApp notifications, and everything else ServiceLoop offers before committing."
      },
      {
        question: "How long does setup take?",
        answer: "Most businesses are up and running in under 1 hour. Our onboarding wizard guides you through adding your business info, services, and pricing. Your professional website goes live immediately, and you can start sending quotes the same day."
      },
      {
        question: "Do I need technical skills to use ServiceLoop?",
        answer: "No technical skills required. ServiceLoop is designed for busy service professionals, not IT experts. If you can send a WhatsApp message, you can use ServiceLoop. Our interface is simple, intuitive, and built for people on the go."
      }
    ]
  },
  {
    category: "Features & Capabilities",
    questions: [
      {
        question: "How does automated quote generation work?",
        answer: "When a customer requests a quote through your website, our AI uses your service catalog and pricing rules to generate an instant, accurate quote. The quote is automatically sent via email and WhatsApp. If the quote is accepted, the customer can immediately book a time slot from your live calendar—no phone calls needed."
      },
      {
        question: "Can customers book appointments directly?",
        answer: "Yes! When a customer accepts a quote online, they instantly see your available time slots and can self-schedule their appointment. You receive a notification with all the details. You can review and confirm, or let the system auto-confirm based on your settings."
      },
      {
        question: "Does ServiceLoop work on mobile?",
        answer: "Absolutely. ServiceLoop is mobile-first. Manage jobs, send quotes, view your calendar, and communicate with customers—all from your phone. The dashboard is fully responsive and works perfectly on any device."
      },
      {
        question: "Which industries does ServiceLoop support?",
        answer: "ServiceLoop is built for home service professionals including: Plumbing, Electrical, HVAC, Landscaping, Cleaning, Painting, Roofing, Pool Maintenance, Pest Control, Handyman services, and more. Our platform adapts to your industry with custom service catalogs and pricing."
      },
      {
        question: "Can I customize my quotes and invoices?",
        answer: "Yes. Add your logo, business colors, and custom terms. Each quote and invoice includes line-item pricing, descriptions, VAT calculations, and payment terms. Everything is professionally branded to match your business."
      }
    ]
  },
  {
    category: "WhatsApp & Communication",
    questions: [
      {
        question: "How does WhatsApp integration work?",
        answer: "ServiceLoop sends automated WhatsApp messages for quotes, appointment reminders, job updates, and payment requests. Messages are sent from your business WhatsApp number, keeping all communication in one place. You can also manually message customers directly through the platform."
      },
      {
        question: "Do I need a special WhatsApp account?",
        answer: "You'll need a WhatsApp Business account (free). During setup, we'll guide you through connecting your WhatsApp number. Messages sent through ServiceLoop appear as if you sent them manually—customers won't know it's automated."
      },
      {
        question: "Can I see WhatsApp message history?",
        answer: "Yes. All automated WhatsApp messages are tracked in your CRM. You can view the full conversation history with each customer, including quotes sent, reminders delivered, and responses received."
      },
      {
        question: "What if I want to take over a conversation?",
        answer: "You can jump into any automated conversation at any time. If a customer replies to an automated message with a question, you'll be notified and can respond manually through the platform."
      }
    ]
  },
  {
    category: "Payments & Deposits",
    questions: [
      {
        question: "Can I request deposits on quotes?",
        answer: "Yes. You can set deposit requirements per service or per quote (e.g., 50% upfront). When a customer accepts a quote, they're automatically prompted to pay the deposit before booking. The system tracks deposit status and sends reminders if needed."
      },
      {
        question: "How do customers pay?",
        answer: "Customers can pay via bank transfer (EFT). Payment instructions are included in every invoice. You manually mark invoices as paid once you receive payment. (Online card payments coming soon.)"
      },
      {
        question: "Does ServiceLoop handle VAT?",
        answer: "Yes. Enter your VAT number in settings, and all quotes and invoices automatically calculate VAT. You can also set whether each service is VAT-inclusive or VAT-exclusive."
      },
      {
        question: "Can I track outstanding payments?",
        answer: "Absolutely. The dashboard shows total receivables, overdue invoices, and paid invoices. Automated payment reminders are sent via WhatsApp and email for overdue balances."
      }
    ]
  },
  {
    category: "Technical & Support",
    questions: [
      {
        question: "Is my data secure?",
        answer: "Yes. All data is encrypted in transit and at rest. We use industry-standard security practices to protect your business and customer information. Your data is stored securely in South Africa and is never shared with third parties."
      },
      {
        question: "Can I export my data?",
        answer: "Yes. You can export contacts, quotes, jobs, and invoices as CSV files at any time. Your data belongs to you, and you can take it with you if you ever decide to leave."
      },
      {
        question: "What happens if I cancel?",
        answer: "You can cancel anytime, no questions asked. Your account remains active until the end of your billing period. After cancellation, you'll have 30 days to export your data before it's permanently deleted."
      },
      {
        question: "Do you offer customer support?",
        answer: "Yes! We offer email support for all customers. Most questions are answered within 24 hours. We also have a comprehensive help center with guides, tutorials, and FAQs."
      },
      {
        question: "Can I upgrade or downgrade my plan?",
        answer: "Currently, we offer one plan (Connect) that includes everything. As we add more plans in the future, you'll be able to upgrade or downgrade at any time. Changes take effect immediately."
      }
    ]
  }
];

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategories = faqCategories.map(cat => ({
    ...cat,
    questions: cat.questions.filter(q => 
      searchQuery === "" || 
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.questions.length > 0);

  const baseUrl = window.location.origin;
  const canonicalUrl = `${baseUrl}/faq`;
  
  // Generate FAQPage schema using helper
  const allFaqs = faqCategories.flatMap(cat => 
    cat.questions.map(q => ({
      question: q.question,
      answer: q.answer
    }))
  );
  
  const faqSchema = createFAQSchema(allFaqs);

  return (
    <>
      <SEOMetaTags 
        title="Frequently Asked Questions - ServiceLoop"
        description="Find answers to common questions about ServiceLoop, the all-in-one business management platform for South African service professionals. Learn about pricing, features, setup, and more."
        keywords="ServiceLoop FAQ, service business software questions, pricing, features, WhatsApp automation, quote management, small business tools South Africa"
        canonicalUrl={canonicalUrl}
        structuredData={faqSchema}
      />

      <div className="min-h-screen bg-white">
        {/* Navigation */}
        <FeatureNavigation />

        {/* Hero Section */}
        <section className="bg-black text-white py-16 md:py-24">
          <div className="container mx-auto px-6 md:px-12 lg:px-20">
            <div className="max-w-3xl mx-auto text-center">
              <h1 
                className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
                style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif' }}
              >
                Frequently Asked Questions
              </h1>
              <p 
                className="text-lg md:text-xl text-white/80 mb-8"
                style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400 }}
              >
                Everything you need to know about ServiceLoop
              </p>

              {/* Search */}
              <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search FAQs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 bg-white text-gray-900 border-0 text-base"
                  style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif' }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Content */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-6 md:px-12 lg:px-20">
            <div className="max-w-4xl mx-auto space-y-12">
              {filteredCategories.map((category, idx) => (
                <div key={idx}>
                  <h2 
                    className="text-2xl md:text-3xl font-semibold mb-6"
                    style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', color: '#42474d' }}
                  >
                    {category.category}
                  </h2>
                  <Accordion type="single" collapsible className="space-y-0">
                    {category.questions.map((item, qIdx) => (
                      <AccordionItem 
                        key={qIdx} 
                        value={`${idx}-${qIdx}`}
                        className="border-b border-gray-200"
                      >
                        <AccordionTrigger 
                          className="text-left py-6 hover:no-underline"
                          style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 600, fontSize: '18px', color: '#42474d' }}
                        >
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent 
                          className="pb-6 pt-2"
                          style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400, fontSize: '16px', lineHeight: '24px', color: '#42474d' }}
                        >
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))}

              {filteredCategories.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-600" style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif' }}>
                    No FAQs found matching your search.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-black text-white py-16 md:py-20">
          <div className="container mx-auto px-6 md:px-12 lg:px-20">
            <div className="max-w-3xl mx-auto text-center">
              <h3 
                className="text-3xl md:text-4xl font-bold mb-4"
                style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif' }}
              >
                Still have questions?
              </h3>
              <p 
                className="text-lg text-white/80 mb-8"
                style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 400 }}
              >
                Can't find what you're looking for? Our support team is here to help.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/help">
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-black"
                    style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 500 }}
                  >
                    Visit Help Center
                  </Button>
                </Link>
                <Link href="/register">
                  <Button 
                    size="lg"
                    className="bg-white text-black hover:bg-white/90"
                    style={{ fontFamily: 'AxLLCircular, Helvetica, Arial, sans-serif', fontWeight: 500 }}
                  >
                    Start Free Trial
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <Footer />
      </div>
    </>
  );
}
