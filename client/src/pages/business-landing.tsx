import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useState } from "react";
import { SEOHead, createLocalBusinessSchema } from "./seo-head";

interface LandingPageContent {
  id: string;
  businessId: string;
  section: string;
  elementKey: string;
  contentType: string;
  value: string | null;
  altText: string | null;
  url: string | null;
  displayOrder: number;
  isActive: boolean;
}

interface BusinessData {
  business: {
    primaryColor?: string;
    businessWhatsapp?: string;
  };
}

interface BusinessLandingProps {
  params: {
    slug: string;
  };
}

export default function BusinessLanding({ params }: BusinessLandingProps) {
  const businessSlug = params.slug;
  
  // Hooks MUST be at top level before any early returns
  const [galleryIndex, setGalleryIndex] = useState(0);
  
  const { data: sections, isLoading, error } = useQuery<LandingPageContent[]>({
    queryKey: [`/api/public/landing-page-content/${businessSlug}`],
  });

  const { data: businessData } = useQuery<BusinessData>({
    queryKey: [`/api/public/services/${businessSlug}`],
    enabled: !!businessSlug,
  });

  // Helper to create WhatsApp link
  const whatsappNumber = businessData?.business?.businessWhatsapp;
  const whatsappLink = whatsappNumber ? `https://wa.me/${whatsappNumber.replace(/\D/g, '')}` : null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" data-testid="loader-landing" />
      </div>
    );
  }

  if (error || !sections || sections.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Business Not Found</h1>
          <p className="text-muted-foreground mb-6">
            Sorry, we couldn't find a business with the slug "{businessSlug}".
          </p>
          <Button onClick={() => window.location.href = '/'} data-testid="button-back-home">
            Go to Homepage
          </Button>
        </div>
      </div>
    );
  }

  // Helper function to get element by section and elementKey
  const getElement = (sectionName: string, elementKey: string) =>
    sections?.find(s => s.section === sectionName && s.elementKey === elementKey && s.isActive);

  // Helper function to get all elements in a section
  const getSection = (sectionName: string) => 
    sections?.filter(s => s.section === sectionName && s.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder) || [];

  // Extract hero elements
  const heroHeading = getElement('hero', 'heading');
  const heroSubheading = getElement('hero', 'subheading');
  const heroBackgroundImage = getElement('hero', 'background_image');
  const heroCtaButton = getElement('hero', 'cta_button');
  
  // Set default quote button URL if not specified
  const ctaUrl = heroCtaButton?.url || `/${businessSlug}/quote`;

  // Get services
  const servicesSection = getSection('services');
  
  // Extract about elements
  const aboutHeading = getElement('about', 'heading');
  const aboutBodyText = getElement('about', 'body_text');

  // Get testimonials
  const testimonialsSection = getSection('testimonials');

  // Get gallery
  const gallerySection = getSection('gallery');
  const galleryImages = gallerySection.filter(item => item.elementKey.includes('image_') && item.value);

  // Extract contact elements
  const contactHeading = getElement('contact', 'section_title');
  const contactBodyText = getElement('contact', 'body_text');

  // Create LocalBusiness structured data for SEO
  const structuredData = createLocalBusinessSchema(
    heroHeading?.value || 'Professional Services',
    heroSubheading?.value || 'Quality service you can trust',
    undefined,
    undefined,
    window.location.href
  );

  return (
    <>
      <SEOHead 
        title={`${heroHeading?.value || 'Professional Services'} | Smart Website`}
        description={heroSubheading?.value || 'Quality service you can trust'}
        keywords="services, professional, local business, South Africa"
        ogImage={heroBackgroundImage?.value || undefined}
        canonicalUrl={window.location.href}
        ogType="business.business"
        structuredData={structuredData}
      />
      <div className="min-h-screen bg-background">
        {/* Hero Section - Animated Entrance */}
        {heroHeading && (
          <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {heroBackgroundImage?.value && (
              <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${heroBackgroundImage.value})` }}
                role="img"
                aria-label={heroBackgroundImage.altText || 'Hero background'}
              >
                {/* Dark wash overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/60" />
              </div>
            )}
            <motion.div 
              className="relative z-10 container mx-auto px-4 text-center text-white"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <motion.h1 
                className="text-5xl md:text-7xl font-bold mb-6 leading-tight" 
                data-testid="text-hero-heading"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                {heroHeading.value}
              </motion.h1>
              {heroSubheading?.value && (
                <motion.p 
                  className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto" 
                  data-testid="text-hero-subheading"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                >
                  {heroSubheading.value}
                </motion.p>
              )}
              {heroCtaButton?.value && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                >
                  <Button 
                    size="lg" 
                    onClick={() => window.location.href = ctaUrl}
                    className="text-lg px-8 py-6 h-auto text-white"
                    style={{
                      backgroundColor: businessData?.business?.primaryColor || '#217BF4'
                    }}
                    data-testid="button-hero-cta"
                  >
                    {heroCtaButton.value}
                  </Button>
                </motion.div>
              )}
            </motion.div>

            {/* Scroll Indicator */}
            <motion.div 
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white"
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
                <motion.div 
                  className="w-1.5 h-1.5 bg-white rounded-full"
                  animate={{ y: [0, 12, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
              </div>
            </motion.div>
          </section>
        )}

        {/* Services Section - Stagger Animation */}
        {servicesSection.length > 1 && (
          <motion.section 
            className="py-20 md:py-32 container mx-auto px-4"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.h2 
              className="text-4xl md:text-5xl font-bold text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              viewport={{ once: true }}
            >
              {servicesSection[0]?.value || 'Our Services'}
            </motion.h2>
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { staggerChildren: 0.15 } }
              }}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-100px" }}
            >
              {servicesSection.slice(1).reduce((acc: any[], item, idx) => {
                if (item.elementKey.includes('_heading')) {
                  const itemNum = item.elementKey.split('_')[1];
                  const description = servicesSection.find(s => s.elementKey === `item_${itemNum}_description`);
                  acc.push({ heading: item, description });
                }
                return acc;
              }, []).map((service, idx) => (
                <motion.div
                  key={idx}
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    show: { opacity: 1, y: 0 }
                  }}
                >
                  <Card className="hover-elevate h-full" data-testid={`card-service-${idx}`}>
                    <CardContent className="p-6">
                      {service.heading && (
                        <h3 className="text-2xl font-semibold mb-3">
                          {service.heading.value}
                        </h3>
                      )}
                      {service.description && (
                        <p className="text-muted-foreground mb-4 leading-relaxed">
                          {service.description.value}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </motion.section>
        )}

        {/* About Section - Split Animation */}
        {aboutHeading && (
          <motion.section 
            className="py-20 md:py-32 bg-muted/50"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <motion.div 
                  className="order-1 lg:order-2"
                  initial={{ opacity: 0, x: 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.7 }}
                  viewport={{ once: true }}
                >
                  {aboutHeading && (
                    <h2 className="text-4xl md:text-5xl font-bold mb-6" data-testid="text-about-heading">
                      {aboutHeading.value}
                    </h2>
                  )}
                  {aboutBodyText && (
                    <p className="text-lg leading-relaxed mb-6">
                      {aboutBodyText.value}
                    </p>
                  )}
                </motion.div>
              </div>
            </div>
          </motion.section>
        )}

        {/* Testimonials Section */}
        {testimonialsSection.length > 1 && (
          <motion.section 
            className="py-20 md:py-32 container mx-auto px-4"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.h2 
              className="text-4xl md:text-5xl font-bold text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              viewport={{ once: true }}
            >
              {testimonialsSection[0]?.value || 'What Our Clients Say'}
            </motion.h2>
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { staggerChildren: 0.15 } }
              }}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-100px" }}
            >
              {testimonialsSection.slice(1).reduce((acc: any[], item, idx) => {
                if (item.elementKey.includes('_text')) {
                  const itemNum = item.elementKey.split('_')[1];
                  const author = testimonialsSection.find(s => s.elementKey === `item_${itemNum}_author`);
                  acc.push({ text: item, author });
                }
                return acc;
              }, []).map((testimonial, idx) => (
                <motion.div
                  key={idx}
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    show: { opacity: 1, y: 0 }
                  }}
                >
                  <Card className="hover-elevate h-full" data-testid={`card-testimonial-${idx}`}>
                    <CardContent className="p-6">
                      <div className="flex gap-1 mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      {testimonial.text && (
                        <p className="text-muted-foreground mb-4 leading-relaxed italic">
                          "{testimonial.text.value}"
                        </p>
                      )}
                      {testimonial.author && (
                        <p className="font-semibold">
                          — {testimonial.author.value}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </motion.section>
        )}

        {/* Gallery Section */}
        {galleryImages.length > 0 && (
          <motion.section 
            className="py-20 md:py-32 container mx-auto px-4"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.h2 
              className="text-4xl md:text-5xl font-bold text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              viewport={{ once: true }}
            >
              {getElement('gallery', 'section_title')?.value || 'Our Work'}
            </motion.h2>
            <div className="relative max-w-4xl mx-auto">
              <div className="overflow-hidden rounded-lg">
                <motion.img 
                  key={galleryIndex}
                  src={galleryImages[galleryIndex]?.value || ''}
                  alt={galleryImages[galleryIndex]?.altText || 'Gallery image'}
                  className="w-full h-96 object-cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  data-testid="img-gallery"
                />
              </div>
              {galleryImages.length > 1 && (
                <>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white"
                    onClick={() => setGalleryIndex((galleryIndex - 1 + galleryImages.length) % galleryImages.length)}
                    data-testid="button-gallery-prev"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white"
                    onClick={() => setGalleryIndex((galleryIndex + 1) % galleryImages.length)}
                    data-testid="button-gallery-next"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                  <div className="flex gap-2 justify-center mt-6">
                    {galleryImages.map((_, idx) => (
                      <button
                        key={idx}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          idx === galleryIndex ? 'bg-primary' : 'bg-muted-foreground/30'
                        }`}
                        onClick={() => setGalleryIndex(idx)}
                        data-testid={`button-gallery-dot-${idx}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.section>
        )}

        {/* Contact Section */}
        {contactHeading && (
          <motion.section 
            className="py-20 md:py-32 bg-muted/50"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <div className="container mx-auto px-4">
              <div className="text-center max-w-3xl mx-auto">
                {contactHeading && (
                  <h2 className="text-4xl md:text-5xl font-bold mb-6" data-testid="text-contact-heading">
                    {contactHeading.value}
                  </h2>
                )}
                {contactBodyText && (
                  <p className="text-lg leading-relaxed mb-12 max-w-3xl mx-auto">
                    {contactBodyText.value}
                  </p>
                )}
                <div className="flex gap-4 justify-center flex-wrap">
                  {heroCtaButton?.value && (
                    <Button 
                      size="lg"
                      onClick={() => window.location.href = ctaUrl}
                      className="text-lg px-8 py-6 h-auto text-white"
                      style={{
                        backgroundColor: businessData?.business?.primaryColor || '#217BF4'
                      }}
                      data-testid="button-contact-cta"
                    >
                      {heroCtaButton.value}
                    </Button>
                  )}
                  {whatsappLink && (
                    <Button 
                      size="lg"
                      onClick={() => window.open(whatsappLink, '_blank')}
                      className="text-lg px-8 py-6 h-auto text-white flex gap-2 items-center"
                      style={{
                        backgroundColor: '#25D366'
                      }}
                      data-testid="button-contact-whatsapp"
                    >
                      <SiWhatsapp className="h-5 w-5" />
                      Chat on WhatsApp
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </div>
    </>
  );
}
