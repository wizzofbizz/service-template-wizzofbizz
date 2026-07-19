
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, LucideIcon } from "lucide-react";
import { SEOMetaTags } from "@/components/SEOMetaTags";
import { createSoftwareApplicationSchema, createFAQSchema } from "@/lib/structured-data";
import { Footer } from "@/components/Footer";
import { FeatureNavigation } from "@/components/FeatureNavigation";
import { ReactNode } from "react";

interface Feature {
  icon: ReactNode;
  title: string;
  description: string;
}

interface WorkflowStep {
  title: string;
  description: string;
}

interface FAQ {
  question: string;
  answer: string;
}

interface IndustryPageTemplateProps {
  // SEO
  title: string;
  description: string;
  keywords: string;
  
  // Hero
  heroIcon: LucideIcon;
  heroLabel: string;
  heroHeading: string;
  heroSubheading: string;
  heroImage: string;
  heroImageAlt: string;
  
  // Problem Section
  problemHeading: string;
  problems: Array<{ title: string; description: string }>;
  
  // Solution Section
  solutionHeading: string;
  solutionSubheading: string;
  features: Feature[];
  
  // Workflow Section
  workflowHeading: string;
  workflowSubheading: string;
  workflowSteps: WorkflowStep[];
  
  // Use Cases Section
  useCaseHeading: string;
  useCaseSubheading: string;
  useCases: string[];
  
  // FAQs
  faqs: FAQ[];
  
  // CTA
  ctaHeading: string;
  ctaSubheading: string;
}

export function IndustryPageTemplate({
  title,
  description,
  keywords,
  heroIcon: HeroIcon,
  heroLabel,
  heroHeading,
  heroSubheading,
  heroImage,
  heroImageAlt,
  problemHeading,
  problems,
  solutionHeading,
  solutionSubheading,
  features,
  workflowHeading,
  workflowSubheading,
  workflowSteps,
  useCaseHeading,
  useCaseSubheading,
  useCases,
  faqs,
  ctaHeading,
  ctaSubheading,
}: IndustryPageTemplateProps) {
  const fontFamily = 'AxLLCircular, Helvetica, Arial, sans-serif';
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const canonicalUrl = `${baseUrl}${typeof window !== 'undefined' ? window.location.pathname : ''}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      createSoftwareApplicationSchema(baseUrl),
      createFAQSchema(faqs)
    ]
  };

  return (
    <>
      <SEOMetaTags 
        title={title}
        description={description}
        keywords={keywords}
        canonicalUrl={canonicalUrl}
        ogImage={`${baseUrl}/hero-dashboard-mockup.png`}
        structuredData={structuredData}
      />

      <div className="min-h-screen bg-white">
        {/* Feature Navigation */}
        <FeatureNavigation />

        {/* Hero Section */}
        <section className="pt-32 pb-20 md:pt-40 md:pb-32 container mx-auto px-6 md:px-12 lg:px-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <HeroIcon className="h-10 w-10" style={{ color: '#612fff' }} />
                <span className="text-sm uppercase tracking-wider" style={{ fontFamily, color: '#612fff' }}>
                  {heroLabel}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight" style={{ fontFamily, color: '#42474d' }}>
                {heroHeading}
              </h1>
              <p className="text-lg mb-8 leading-relaxed" style={{ fontFamily, color: '#42474d' }}>
                {heroSubheading}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register">
                  <Button size="lg" className="rounded-full px-8" style={{ backgroundColor: '#612fff', color: 'white', fontFamily }}>
                    Start Free Trial
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button size="lg" variant="outline" className="rounded-full px-8" style={{ fontFamily }}>
                    See Pricing
                  </Button>
                </Link>
              </div>
            </div>
            <div>
              <img 
                src={heroImage}
                alt={heroImageAlt}
                className="rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-6 md:px-12 lg:px-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center" style={{ fontFamily, color: '#42474d' }}>
              {problemHeading}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {problems.map((problem, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-3 text-lg" style={{ fontFamily }}>{problem.title}</h3>
                    <p className="text-sm text-gray-600" style={{ fontFamily }}>{problem.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Solution Section */}
        <section className="py-20">
          <div className="container mx-auto px-6 md:px-12 lg:px-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center" style={{ fontFamily, color: '#42474d' }}>
              {solutionHeading}
            </h2>
            <p className="text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto" style={{ fontFamily }}>
              {solutionSubheading}
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0" style={{ color: '#612fff' }}>
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 text-lg" style={{ fontFamily }}>{feature.title}</h3>
                    <p className="text-sm text-gray-600" style={{ fontFamily }}>{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Workflow Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-6 md:px-12 lg:px-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center" style={{ fontFamily, color: '#42474d' }}>
              {workflowHeading}
            </h2>
            <p className="text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto" style={{ fontFamily }}>
              {workflowSubheading}
            </p>
            <div className="max-w-3xl mx-auto">
              <div className="space-y-6">
                {workflowSteps.map((step, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1" style={{ fontFamily }}>{step.title}</h3>
                      <p className="text-sm text-gray-600" style={{ fontFamily }}>{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="py-20">
          <div className="container mx-auto px-6 md:px-12 lg:px-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center" style={{ fontFamily, color: '#42474d' }}>
              {useCaseHeading}
            </h2>
            <p className="text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto" style={{ fontFamily }}>
              {useCaseSubheading}
            </p>
            <div className="max-w-3xl mx-auto">
              <div className="space-y-4">
                {useCases.map((useCase, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#612fff' }} />
                    <span className="text-base text-gray-700" style={{ fontFamily }}>{useCase}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-6 md:px-12 lg:px-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center" style={{ fontFamily, color: '#42474d' }}>
              Simple Pricing
            </h2>
            <div className="max-w-md mx-auto">
              <Card className="border-2" style={{ borderColor: '#612fff' }}>
                <CardContent className="p-8">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold mb-2" style={{ fontFamily }}>Connect Plan</h3>
                    <div className="flex items-baseline justify-center gap-1 mb-2">
                      <span className="text-5xl font-bold" style={{ fontFamily }}>R350</span>
                      <span className="text-xl" style={{ fontFamily }}>/month</span>
                    </div>
                    <p className="text-sm text-gray-600" style={{ fontFamily }}>Everything you need</p>
                  </div>
                  <Link href="/register">
                    <Button size="lg" className="w-full rounded-full" style={{ backgroundColor: '#612fff', color: 'white', fontFamily }}>
                      Start Free Trial
                    </Button>
                  </Link>
                  <p className="text-xs text-center mt-4 text-gray-500" style={{ fontFamily }}>14-day free trial • No credit card required</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20">
          <div className="container mx-auto px-6 md:px-12 lg:px-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center" style={{ fontFamily, color: '#42474d' }}>
              Frequently Asked Questions
            </h2>
            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible>
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left" style={{ fontFamily }}>
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent style={{ fontFamily }}>
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20" style={{ background: 'linear-gradient(to bottom right, #612fff, #4a1fcc)' }}>
          <div className="container mx-auto px-6 md:px-12 lg:px-20 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{ fontFamily }}>
              {ctaHeading}
            </h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto" style={{ fontFamily }}>
              {ctaSubheading}
            </p>
            <Link href="/register">
              <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 rounded-full px-8" style={{ fontFamily }}>
                Start Free Trial - No Credit Card Required
              </Button>
            </Link>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
