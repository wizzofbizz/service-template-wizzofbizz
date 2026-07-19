import { siteConfig } from "@/config/site";
import { useEffect } from "react";

interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  canonicalUrl?: string;
  ogType?: "website" | "article" | "business.business";
  structuredData?: object;
}

export function SEOHead({ 
  title, 
  description, 
  keywords, 
  ogImage, 
  canonicalUrl,
  ogType = "website",
  structuredData
}: SEOHeadProps) {
  useEffect(() => {
    // Set page title
    document.title = title;

    // Set or update meta tags
    const setMeta = (name: string, content: string, property = false) => {
      const attr = property ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attr}="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Basic Meta Tags
    setMeta('description', description);
    if (keywords) setMeta('keywords', keywords);
    setMeta('robots', 'index, follow');
    setMeta('viewport', 'width=device-width, initial-scale=1');

    // Open Graph tags
    setMeta('og:type', ogType, true);
    setMeta('og:title', title, true);
    setMeta('og:description', description, true);
    setMeta('og:site_name', siteConfig.name, true);
    if (ogImage) {
      setMeta('og:image', ogImage, true);
      setMeta('og:image:alt', title, true);
      setMeta('og:image:width', '1200', true);
      setMeta('og:image:height', '630', true);
    }
    if (canonicalUrl) {
      setMeta('og:url', canonicalUrl, true);
    }

    // Twitter Card tags
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    if (ogImage) {
      setMeta('twitter:image', ogImage);
      setMeta('twitter:image:alt', title);
    }

    // Canonical URL
    if (canonicalUrl) {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', canonicalUrl);
    }

    // Structured Data (JSON-LD)
    const scriptId = 'structured-data-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (structuredData) {
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(structuredData);
    } else if (script) {
      script.remove();
    }
  }, [title, description, keywords, ogImage, canonicalUrl, ogType, structuredData]);

  return null;
}
interface LocalBusinessSchemaOptions {
  businessName: string;
  businessType: string;
  address?: string;
  phone?: string;
  url?: string;
  /** ISO 3166-1 alpha-2, e.g. "ZA", "GB", "US". */
  countryCode?: string;
  /** Display name of the served country, e.g. "South Africa". */
  countryName?: string;
  /** Currency symbol used in the priceRange hint, e.g. "R", "£", "$". */
  currencySymbol?: string;
}

/**
 * Builds schema.org LocalBusiness structured data.
 *
 * Locale defaults are configurable so the template is not tied to one country
 * — override them from site config when deploying outside South Africa.
 */
export function createLocalBusinessSchema({
  businessName,
  businessType,
  address,
  phone,
  url,
  countryCode = "ZA",
  countryName = "South Africa",
  currencySymbol = "R",
}: LocalBusinessSchemaOptions) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": businessName,
    "description": businessType,
    ...(address && {
      "address": {
        "@type": "PostalAddress",
        "addressCountry": countryCode,
        "streetAddress": address
      }
    }),
    ...(phone && { "telephone": phone }),
    ...(url && { "url": url }),
    "priceRange": currencySymbol,
    "areaServed": {
      "@type": "Country",
      "name": countryName
    }
  };
}
