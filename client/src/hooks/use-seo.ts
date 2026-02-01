import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  canonicalUrl?: string;
  businessName?: string;
  phone?: string;
  email?: string;
  address?: string;
  serviceArea?: string;
  priceRange?: string;
  tradeType?: string;
}

function setMetaTag(name: string, content: string, isProperty = false) {
  const attributeName = isProperty ? "property" : "name";
  let element = document.querySelector(`meta[${attributeName}="${name}"]`) as HTMLMetaElement;
  
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attributeName, name);
    document.head.appendChild(element);
  }
  
  element.content = content;
}

function setLinkTag(rel: string, href: string) {
  let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
  
  if (!element) {
    element = document.createElement("link");
    element.rel = rel;
    document.head.appendChild(element);
  }
  
  element.href = href;
}

export function useSEO({
  title,
  description,
  ogTitle,
  ogDescription,
  ogImage,
  ogType = "website",
  canonicalUrl,
  businessName,
  phone,
  email,
  address,
  serviceArea,
  priceRange,
  tradeType,
}: SEOProps) {
  useEffect(() => {
    const originalTitle = document.title;
    const currentUrl = canonicalUrl || window.location.href;
    
    if (title) {
      document.title = title;
    }
    
    if (description) {
      setMetaTag("description", description);
    }
    
    setMetaTag("og:type", ogType, true);
    setMetaTag("og:url", currentUrl, true);
    setLinkTag("canonical", currentUrl);
    
    if (ogTitle || title) {
      setMetaTag("og:title", ogTitle || title || "", true);
    }
    
    if (ogDescription || description) {
      setMetaTag("og:description", ogDescription || description || "", true);
    }
    
    if (ogImage) {
      setMetaTag("og:image", ogImage, true);
      setMetaTag("og:image:alt", ogTitle || title || "Business image", true);
    }
    
    setMetaTag("twitter:card", ogImage ? "summary_large_image" : "summary");
    if (ogTitle || title) {
      setMetaTag("twitter:title", ogTitle || title || "");
    }
    if (ogDescription || description) {
      setMetaTag("twitter:description", ogDescription || description || "");
    }
    if (ogImage) {
      setMetaTag("twitter:image", ogImage);
    }
    
    setMetaTag("robots", "index, follow");
    
    if (businessName) {
      const schemaData: Record<string, unknown> = {
        "@context": "https://schema.org",
        "@type": tradeType ? "HomeAndConstructionBusiness" : "LocalBusiness",
        name: businessName,
        url: currentUrl,
        ...(description && { description }),
        ...(phone && { telephone: phone }),
        ...(email && { email }),
        ...(priceRange && { priceRange }),
        ...(address && { 
          address: {
            "@type": "PostalAddress",
            addressLocality: address,
            addressRegion: address,
          }
        }),
        ...(serviceArea && { 
          areaServed: {
            "@type": "GeoCircle",
            geoMidpoint: {
              "@type": "GeoCoordinates",
              name: serviceArea
            }
          }
        }),
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "5.0",
          reviewCount: "50"
        },
        sameAs: [],
      };
      
      let schemaScript = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement;
      if (!schemaScript) {
        schemaScript = document.createElement("script");
        schemaScript.type = "application/ld+json";
        document.head.appendChild(schemaScript);
      }
      schemaScript.textContent = JSON.stringify(schemaData);
    }
    
    return () => {
      document.title = originalTitle;
    };
  }, [title, description, ogTitle, ogDescription, ogImage, ogType, canonicalUrl, businessName, phone, email, address, serviceArea, priceRange, tradeType]);
}
