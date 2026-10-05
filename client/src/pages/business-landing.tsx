import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { SEOHead, createLocalBusinessSchema } from "@/components/seo-head";
import { siteConfig } from "@/config/site";
import { Header, Footer } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { Numbers } from "@/components/landing/Numbers";
import { Statement } from "@/components/landing/Statement";
import { ServiceStack, type StackService } from "@/components/landing/ServiceStack";
import { Gallery } from "@/components/landing/Gallery";
import { Testimonials } from "@/components/landing/Testimonials";
import { Contact } from "@/components/landing/Contact";
import type { BusinessData } from "@/components/landing/types";
import * as demo from "@/components/landing/content";

/** Accent reserved for CTAs only, so the booking button is always the loudest thing. */
const ACCENT = "#C6F24E";

/**
 * The public homepage.
 *
 * Structure and motion are delivered as part of the product; the business owner
 * cannot alter them from the admin. What they DO control — name, contact details and
 * the services they offer — is read live from the API.
 *
 * Demo copy and imagery come from `components/landing/content.ts` (a landscaping
 * company, chosen because the before/after mechanic driving the page needs a service
 * where the transformation is the sale). Live services from the API take precedence
 * when present; the demo set fills in so every effect is visible out of the box.
 */
export default function BusinessLanding() {
  // Single-tenant: the public API resolves the one configured business.
  const { data, isLoading } = useQuery<BusinessData>({
    queryKey: ["/api/public/services/current"],
  });

  const business = data?.business;
  const apiServices = data?.services || [];
  const { locale } = siteConfig;

  const businessName = business?.businessName || "Thornhill & Vale";
  const accent = business?.primaryColor || ACCENT;

  const whatsappNumber = business?.businessWhatsapp;
  const whatsappLink = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/\D/g, "")}`
    : null;

  const bookingHref = siteConfig.bookingMode === "direct" ? "/book" : "/quote";

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950">
        <Loader2 className="h-8 w-8 animate-spin text-white/60" data-testid="loader-landing" />
      </div>
    );
  }

  /*
   * Live services replace the demo copy but reuse its imagery, so a real deployment
   * shows the owner's own services with the before/after mechanic intact until they
   * supply their own pairs.
   */
  const services: StackService[] = apiServices.length
    ? apiServices.slice(0, 3).map((s, i) => ({
        index: String(i + 1).padStart(2, "0"),
        name: s.serviceName,
        description: s.description || demo.services[i % demo.services.length].description,
        price: s.basePrice
          ? `From ${locale.currencySymbol}${parseFloat(s.basePrice).toFixed(0)}`
          : demo.services[i % demo.services.length].price,
        duration: s.durationMinutes
          ? `${s.durationMinutes} min`
          : demo.services[i % demo.services.length].duration,
        image: demo.services[i % demo.services.length].image,
      }))
    : demo.services;

  const structuredData = createLocalBusinessSchema({
    businessName,
    businessType: demo.hero.eyebrow,
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
        description={demo.hero.sub}
        ogImage={demo.hero.image.after}
        canonicalUrl={window.location.href}
        ogType="business.business"
        structuredData={structuredData}
      />

      {/*
       * `overflow-x-clip` contains the Statement section's horizontal drift without
       * creating a scroll container, which would break `position: sticky` in the stack.
       */}
      <div className="min-h-screen overflow-x-clip bg-neutral-950 font-sans">
        <Header
          businessName={businessName}
          bookingHref={bookingHref}
          cta={demo.hero.cta}
          accent={accent}
        />

        {/* Landmark so assistive tech can skip the nav straight to the content. */}
        <main>
          <Hero
            eyebrow={demo.hero.eyebrow}
            headline={demo.hero.headline}
            sub={demo.hero.sub}
            cta={demo.hero.cta}
            bookingHref={bookingHref}
            accent={accent}
            image={demo.hero.image}
            businessName={businessName}
          />

          <Numbers stats={demo.stats} />

          <Statement lines={demo.statement} />

          <ServiceStack services={services} bookingHref={bookingHref} accent={accent} />

          <Gallery images={demo.gallery} labels={demo.galleryLabels} />

          <Testimonials items={demo.testimonials} />

          <Contact
            heading={demo.contact.heading}
            body={demo.contact.body}
            cta={demo.contact.cta}
            bookingHref={bookingHref}
            accent={accent}
            business={business}
            whatsappLink={whatsappLink}
          />
        </main>

        <Footer businessName={businessName} />
      </div>
    </>
  );
}
