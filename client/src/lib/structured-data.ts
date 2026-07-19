
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
        "urlTemplate": `${url}/help-center?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };
}

export function createSoftwareApplicationSchema(url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "ServiceLoop",
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

export function createBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
}

export function createHowToSchema(
  name: string,
  description: string,
  steps: Array<{ name: string; text: string; image?: string }>,
  totalTime?: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": name,
    "description": description,
    ...(totalTime && { "totalTime": totalTime }),
    "step": steps.map((step, index) => ({
      "@type": "HowToStep",
      "position": index + 1,
      "name": step.name,
      "text": step.text,
      ...(step.image && { "image": step.image })
    }))
  };
}

export function createFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}

export function createArticleSchema(
  title: string,
  description: string,
  author: string,
  publishedDate: string,
  modifiedDate: string,
  imageUrl?: string,
  keywords?: string[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "description": description,
    "author": {
      "@type": "Person",
      "name": author
    },
    "datePublished": publishedDate,
    "dateModified": modifiedDate,
    ...(imageUrl && { "image": imageUrl }),
    ...(keywords && { "keywords": keywords.join(', ') }),
    "publisher": {
      "@type": "Organization",
      "name": "ServiceLoop",
      "logo": {
        "@type": "ImageObject",
        "url": "https://serviceloop.co.za/logo.png"
      }
    }
  };
}
