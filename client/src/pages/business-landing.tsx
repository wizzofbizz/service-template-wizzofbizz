import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Clock } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { SEOHead, createLocalBusinessSchema } from "@/components/seo-head";
import { siteConfig } from "@/config/site";

interface Service {
  id: string;
  serviceName: string;
  description: string | null;
  basePrice: string | null;
  durationMinutes: number | null;
}

interface BusinessData {
  business: {
    businessName?: string;
    primaryColor?: string;
    businessWhatsapp?: string;
    phone?: string;
    email?: string;
    addressLine1?: string;
    city?: string;
  };
  services: Service[];
}

/**
 * The public homepage.
 *
 * Copy and imagery come from site config (see client/src/config/site.ts), not
 * from the database: the design is delivered as part of the product, so the
 * business owner cannot alter it from the admin. What they DO control — their
 * name, contact details, and the services they offer — is read live from the
 * API, so those stay self-service.
 */
export default function BusinessLanding() {
  // Single-tenant: the public API resolves the one configured business, so
  // there is no tenant slug in the URL.
  const { data, isLoading } = useQuery<BusinessData>({
    queryKey: ["/api/public/services/current"],
  });

  const business = data?.business;
  const services = data?.services || [];
  const { home, locale } = siteConfig;

  const businessName = business?.businessName || siteConfig.name;
  const whatsappNumber = business?.businessWhatsapp;
  const whatsappLink = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/\D/g, "")}`
    : null;

  const bookingHref = siteConfig.bookingMode === "direct" ? "/book" : "/quote";

  const formatPrice = (price: string | null) =>
    price ? `From ${locale.currencySymbol}${parseFloat(price).toFixed(2)}` : null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" data-testid="loader-landing" />
      </div>
    );
  }

  const structuredData = createLocalBusinessSchema({
    businessName,
    businessType: home.heroSubheading,
    phone: business?.phone,
    address: business?.addressLine1,
    url: window.location.href,
    countryCode: locale.countryCode,
    countryName: locale.countryName,
    currencySymbol: locale.currencySymbol,
  });

  return (
    <>
      <SEOHead
        title={businessName}
        description={home.heroSubheading}
        ogImage={home.heroBackgroundImage || undefined}
        canonicalUrl={window.location.href}
        ogType="business.business"
        structuredData={structuredData}
      />

      <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          {home.heroBackgroundImage && (
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${home.heroBackgroundImage})` }}
              role="img"
              aria-label={`${businessName} hero image`}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/60" />
            </div>
          )}

          <motion.div
            className="relative z-10 container mx-auto px-4 text-center text-white"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight" data-testid="text-hero-heading">
              {home.heroHeading}
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto" data-testid="text-hero-subheading">
              {home.heroSubheading}
            </p>
            <Button
              size="lg"
              onClick={() => (window.location.href = bookingHref)}
              className="text-lg px-8 py-6 h-auto text-white"
              style={{ backgroundColor: business?.primaryColor || "hsl(var(--brand))" }}
              data-testid="button-hero-cta"
            >
              {home.heroCtaLabel}
            </Button>
          </motion.div>
        </section>

        {/* Services — read live from the admin, so the owner controls these */}
        {services.length > 0 && (
          <section className="py-20 md:py-28">
            <div className="container mx-auto px-4">
              <motion.h2
                className="text-4xl md:text-5xl font-bold text-center mb-12"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                data-testid="text-services-heading"
              >
                {home.servicesHeading}
              </motion.h2>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
                {services.map((service, idx) => (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.08 }}
                  >
                    <Card className="h-full hover-elevate" data-testid={`card-service-${idx}`}>
                      <CardContent className="p-6">
                        <h3 className="text-2xl font-semibold mb-3">{service.serviceName}</h3>
                        {service.description && (
                          <p className="text-muted-foreground mb-4 leading-relaxed">
                            {service.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm">
                          {formatPrice(service.basePrice) && (
                            <span className="font-medium">{formatPrice(service.basePrice)}</span>
                          )}
                          {service.durationMinutes && (
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {service.durationMinutes} min
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <div className="text-center mt-12">
                <Button
                  size="lg"
                  onClick={() => (window.location.href = bookingHref)}
                  style={{ backgroundColor: business?.primaryColor || "hsl(var(--brand))" }}
                  className="text-white"
                  data-testid="button-services-cta"
                >
                  {home.heroCtaLabel}
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* About */}
        <section className="py-20 md:py-28 bg-muted/50">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6" data-testid="text-about-heading">
                {home.aboutHeading}
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">{home.aboutBody}</p>
            </motion.div>
          </div>
        </section>

        {/* Contact — details come from the business record, not config */}
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6" data-testid="text-contact-heading">
                {home.contactHeading}
              </h2>
              <p className="text-lg text-muted-foreground mb-8">{home.contactBody}</p>

              <div className="space-y-2 mb-8 text-lg">
                {business?.phone && (
                  <p>
                    <a href={`tel:${business.phone}`} className="hover:underline">
                      {business.phone}
                    </a>
                  </p>
                )}
                {business?.email && (
                  <p>
                    <a href={`mailto:${business.email}`} className="hover:underline">
                      {business.email}
                    </a>
                  </p>
                )}
                {business?.addressLine1 && (
                  <p className="text-muted-foreground">
                    {business.addressLine1}
                    {business.city ? `, ${business.city}` : ""}
                  </p>
                )}
              </div>

              <div className="flex gap-3 justify-center flex-wrap">
                <Button
                  size="lg"
                  onClick={() => (window.location.href = bookingHref)}
                  style={{ backgroundColor: business?.primaryColor || "hsl(var(--brand))" }}
                  className="text-white"
                  data-testid="button-contact-cta"
                >
                  {home.heroCtaLabel}
                </Button>

                {whatsappLink && (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => window.open(whatsappLink, "_blank")}
                    data-testid="button-whatsapp"
                  >
                    <SiWhatsapp className="mr-2 h-5 w-5" />
                    WhatsApp
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        <footer className="py-8 border-t text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} {businessName}
          </p>
        </footer>
      </div>
    </>
  );
}
