
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { SEOHead } from "./seo-head";

interface LandingPageContent {
  id: string;
  section: string;
  contentType: string;
  heading: string | null;
  subheading: string | null;
  bodyText: string | null;
  ctaText: string | null;
  ctaUrl: string | null;
  mediaUrl: string | null;
  mediaAlt: string | null;
  displayOrder: number;
  isActive: boolean;
}

export default function LandingPage() {
  // Extract business slug from subdomain or path
  // For now, use 'demo' as default - this would be dynamic in production
  const businessSlug = 'demo';
  
  const { data: sections, isLoading } = useQuery<LandingPageContent[]>({
    queryKey: [`/api/public/landing-page-content/${businessSlug}`],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getSection = (sectionName: string) => 
    sections?.filter(s => s.section === sectionName && s.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder) || [];

  const hero = getSection('hero')[0];
  const services = getSection('services');
  const about = getSection('about')[0];
  const portfolio = getSection('portfolio');
  const testimonials = getSection('testimonials');
  const contact = getSection('contact')[0];

  return (
    <>
      <SEOHead 
        title={hero?.heading || 'Professional Services'}
        description={hero?.subheading || 'Quality service you can trust'}
        keywords="services, professional, local business"
        ogImage={hero?.mediaUrl || undefined}
        canonicalUrl={window.location.href}
      />
      <div className="min-h-screen bg-background">
      {/* Hero Section */}
      {hero && (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          {hero.mediaUrl && (
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${hero.mediaUrl})` }}
              role="img"
              aria-label={hero.mediaAlt || 'Hero background'}
            >
              <div className="absolute inset-0 bg-black/50" />
            </div>
          )}
          <div className="relative z-10 container mx-auto px-4 text-center text-white">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              {hero.heading}
            </h1>
            {hero.subheading && (
              <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
                {hero.subheading}
              </p>
            )}
            {hero.ctaText && hero.ctaUrl && (
              <Button 
                size="lg" 
                className="text-lg px-8 py-6"
                onClick={() => window.location.href = hero.ctaUrl!}
              >
                {hero.ctaText}
              </Button>
            )}
          </div>
        </section>
      )}

      {/* Services Section */}
      {services.length > 0 && (
        <section className="py-20 md:py-32 container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            Our Services
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <Card key={service.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  {service.mediaUrl && (
                    <img 
                      src={service.mediaUrl} 
                      alt={service.mediaAlt || service.heading || 'Service'}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  )}
                  {service.heading && (
                    <h3 className="text-2xl font-semibold mb-3">
                      {service.heading}
                    </h3>
                  )}
                  {service.bodyText && (
                    <p className="text-muted-foreground mb-4">
                      {service.bodyText}
                    </p>
                  )}
                  {service.ctaText && service.ctaUrl && (
                    <Button 
                      variant="outline"
                      onClick={() => window.location.href = service.ctaUrl!}
                    >
                      {service.ctaText}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* About Section */}
      {about && (
        <section className="py-20 md:py-32 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                {about.heading && (
                  <h2 className="text-4xl md:text-5xl font-bold mb-6">
                    {about.heading}
                  </h2>
                )}
                {about.subheading && (
                  <h3 className="text-xl md:text-2xl text-muted-foreground mb-6">
                    {about.subheading}
                  </h3>
                )}
                {about.bodyText && (
                  <p className="text-lg leading-relaxed mb-6">
                    {about.bodyText}
                  </p>
                )}
                {about.ctaText && about.ctaUrl && (
                  <Button 
                    size="lg"
                    onClick={() => window.location.href = about.ctaUrl!}
                  >
                    {about.ctaText}
                  </Button>
                )}
              </div>
              {about.mediaUrl && (
                <div>
                  <img 
                    src={about.mediaUrl} 
                    alt={about.mediaAlt || 'About us'}
                    className="w-full h-auto rounded-xl shadow-lg"
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Portfolio Section */}
      {portfolio.length > 0 && (
        <section className="py-20 md:py-32 container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            Our Work
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolio.map((item) => (
              <div key={item.id} className="group relative overflow-hidden rounded-lg">
                {item.mediaUrl && (
                  <img 
                    src={item.mediaUrl} 
                    alt={item.mediaAlt || item.heading || 'Portfolio item'}
                    className="w-full h-64 object-cover transition-transform group-hover:scale-110"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                  {item.heading && (
                    <h3 className="text-white text-xl font-semibold">
                      {item.heading}
                    </h3>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      {testimonials.length > 0 && (
        <section className="py-20 md:py-32 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
              What Our Clients Say
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonials.map((testimonial) => (
                <Card key={testimonial.id}>
                  <CardContent className="p-6">
                    {testimonial.bodyText && (
                      <p className="text-lg mb-6 italic">"{testimonial.bodyText}"</p>
                    )}
                    <div className="flex items-center gap-4">
                      {testimonial.mediaUrl && (
                        <img 
                          src={testimonial.mediaUrl} 
                          alt={testimonial.mediaAlt || testimonial.heading || 'Client'}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      )}
                      <div>
                        {testimonial.heading && (
                          <p className="font-semibold">{testimonial.heading}</p>
                        )}
                        {testimonial.subheading && (
                          <p className="text-sm text-muted-foreground">
                            {testimonial.subheading}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      {contact && (
        <section className="py-20 md:py-32 container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            {contact.heading && (
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                {contact.heading}
              </h2>
            )}
            {contact.subheading && (
              <p className="text-xl text-muted-foreground mb-8">
                {contact.subheading}
              </p>
            )}
            {contact.ctaText && contact.ctaUrl && (
              <Button 
                size="lg"
                className="text-lg px-8 py-6"
                onClick={() => window.location.href = contact.ctaUrl!}
              >
                {contact.ctaText}
              </Button>
            )}
          </div>
        </section>
      )}
      </div>
    </>
  );
}
