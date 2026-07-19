
import { ReactNode } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { FeatureNavigation } from "./FeatureNavigation";
import { SEOHead } from "@/pages/seo-head";
import { useRef } from "react";

interface FeaturePageTemplateProps {
  // SEO
  title: string;
  description: string;
  keywords: string;

  // Hero Section
  heroHeading: string;
  heroSubheading: string;
  heroImage: string;
  heroImageAlt: string;

  // Content Sections
  children: ReactNode;

  // CTA Section
  ctaHeading?: string;
  ctaSubheading?: string;
  ctaButtonText?: string;
}

export function FeaturePageTemplate({
  title,
  description,
  keywords,
  heroHeading,
  heroSubheading,
  heroImage,
  heroImageAlt,
  children,
  ctaHeading = "Ready to Transform Your Business?",
  ctaSubheading = "Join service businesses across South Africa using Smart Website to grow.",
  ctaButtonText = "Start Your Free Trial",
}: FeaturePageTemplateProps) {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.3]);

  return (
    <>
      <SEOHead
        title={`${title} | Smart Website`}
        description={description}
        keywords={keywords}
        canonicalUrl={window.location.href}
        ogType="website"
      />

      <div className="min-h-screen bg-white">
        <FeatureNavigation />

        {/* Hero Section with Parallax */}
        <section
          ref={heroRef}
          className="relative h-[50vh] flex items-center overflow-hidden"
        >
          <motion.div className="absolute inset-0 w-full h-full" style={{ y: heroY }}>
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${heroImage})`, height: "120%" }}
            />
            <div className="absolute inset-0 bg-black/40" />
          </motion.div>

          <div className="relative z-10 container mx-auto px-6 md:px-12 lg:px-20 pt-16 md:pt-20">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              style={{ opacity: heroOpacity }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-normal mb-4 leading-tight text-white max-w-4xl">
                {heroHeading}
              </h1>
              <p className="text-base md:text-lg text-white/90 mb-6 max-w-3xl font-light leading-normal">
                {heroSubheading}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Content Sections */}
        {children}

        {/* Final CTA Section */}
        <section className="relative py-16 flex items-center bg-black overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{
              backgroundImage: `url(https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1920&q=80)`,
            }}
          />

          <div className="relative z-10 container mx-auto px-6 md:px-12 lg:px-20">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="max-w-4xl"
            >
              <h2 className="text-3xl md:text-4xl font-normal mb-4 leading-tight text-white">
                {ctaHeading}
              </h2>
              <p className="text-base md:text-lg mb-6 leading-normal font-light text-white/80">
                {ctaSubheading}
              </p>
              <Link href="/register">
                <Button
                  size="lg"
                  className="bg-white text-black hover:bg-gray-100 rounded-full px-12 py-6 text-base font-medium uppercase tracking-wider"
                >
                  {ctaButtonText}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <p className="mt-6 text-base text-white/60 tracking-wide font-light">
                No credit card required • Setup in 24 hours • Cancel anytime
              </p>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
}
