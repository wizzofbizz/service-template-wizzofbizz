import { siteConfig } from "@/config/site";

import { useEffect } from "react";

interface SEOMetaTagsProps {
  title: string;
  description: string;
  keywords: string;
  canonicalUrl: string;
  ogImage?: string;
  ogType?: "website" | "article" | "business.business";
  structuredData?: object;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

export function SEOMetaTags({
  title,
  description,
  keywords,
  canonicalUrl,
  ogImage,
  ogType = "website",
  structuredData,
  author,
  publishedTime,
  modifiedTime,
}: SEOMetaTagsProps) {
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
    setMeta('keywords', keywords);
    setMeta('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    setMeta('viewport', 'width=device-width, initial-scale=1');
    setMeta('language', 'en-ZA');
    setMeta('geo.region', 'ZA');
    setMeta('geo.placename', 'South Africa');
    
    // Author meta
    if (author) {
      setMeta('author', author);
    }

    // Open Graph tags
    setMeta('og:type', ogType, true);
    setMeta('og:title', title, true);
    setMeta('og:description', description, true);
    setMeta('og:site_name', siteConfig.name, true);
    setMeta('og:locale', 'en_ZA', true);
    
    if (ogImage) {
      setMeta('og:image', ogImage, true);
      setMeta('og:image:alt', title, true);
      setMeta('og:image:width', '1200', true);
      setMeta('og:image:height', '630', true);
      setMeta('og:image:type', 'image/png', true);
    }
    
    if (canonicalUrl) {
      setMeta('og:url', canonicalUrl, true);
    }

    // Article-specific OG tags
    if (ogType === 'article') {
      if (publishedTime) {
        setMeta('article:published_time', publishedTime, true);
      }
      if (modifiedTime) {
        setMeta('article:modified_time', modifiedTime, true);
      }
      if (author) {
        setMeta('article:author', author, true);
      }
    }

    // Twitter Card tags
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    if (siteConfig.social.twitter) setMeta('twitter:site', siteConfig.social.twitter);
    
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
  }, [title, description, keywords, canonicalUrl, ogImage, ogType, structuredData, author, publishedTime, modifiedTime]);

  return null;
}
