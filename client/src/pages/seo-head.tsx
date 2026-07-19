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
    setMeta('og:site_name', 'ServiceLoop', true);
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

// Helper to create Organization structured data
export function createOrganizationSchema(url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ServiceLoop",
    "url": url,
    "logo": `${url}/logo.png`,
    "description": "All-in-one platform for South African service businesses: Website, CRM, booking system & invoicing.",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "ZA",
      "addressRegion": "Western Cape",
      "addressLocality": "Cape Town"
    },
    "areaServed": {
      "@type": "Country",
      "name": "South Africa"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Service",
      "availableLanguage": ["English", "Afrikaans"]
    },
    "sameAs": []
  };
}

// Helper to create LocalBusiness structured data
export function createLocalBusinessSchema(
  businessName: string,
  businessType: string,
  address?: string,
  phone?: string,
  url?: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": businessName,
    "description": businessType,
    ...(address && {
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "ZA",
        "streetAddress": address
      }
    }),
    ...(phone && { "telephone": phone }),
    ...(url && { "url": url }),
    "priceRange": "R",
    "areaServed": {
      "@type": "Country",
      "name": "South Africa"
    }
  };
}

// Helper to create WebSite structured data with search action
export function createWebSiteSchema(url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "ServiceLoop",
    "url": url,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${url}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };
}

// Helper to create SoftwareApplication structured data
export function createSoftwareApplicationSchema(url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Smart Website",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "350",
      "priceCurrency": "ZAR",
      "priceValidUntil": "2026-12-31"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "5",
      "ratingCount": "50"
    },
    "description": "All-in-one platform for South African service businesses: Website, CRM, booking system & invoicing. Setup in 24 hours from R350/month.",
    "url": url,
    "screenshot": `${url}/screenshot.png`
  };
}