import React from "react";

interface OrganizationJsonLdProps {
  name: string;
  url: string;
  logo: string;
  description: string;
}

export function OrganizationJsonLd({ name, url, logo, description }: OrganizationJsonLdProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name,
    url,
    logo,
    description,
    priceRange: "IRR",
    paymentAccepted: "Card to Card (CartBeCart)",
    currenciesAccepted: "IRR, USD",
    potentialAction: {
      "@type": "SearchAction",
      target: `${url}/products?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface ProductJsonLdProps {
  name: string;
  description: string;
  image: string;
  sku: string;
  priceRial: number;
  priceToman?: number;
  ratingValue?: number;
  reviewCount?: number;
  inStock: boolean;
  category: string;
}

export function ProductJsonLd({
  name,
  description,
  image,
  sku,
  priceRial,
  ratingValue,
  reviewCount,
  inStock,
  category,
}: ProductJsonLdProps) {
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  const priceValidUntil = nextYear.toISOString().split("T")[0];

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    image,
    description: description ? description.replace(/<[^>]+>/g, "").slice(0, 300) : name,
    sku,
    category,
    offers: {
      "@type": "Offer",
      url: `https://arzanaccount.ir/products/${sku}`,
      priceCurrency: "IRR",
      price: priceRial,
      priceValidUntil,
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: "ارزان اکانت",
        url: "https://arzanaccount.ir",
      },
    },
    ...(ratingValue && reviewCount && reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(ratingValue.toFixed(1)),
            reviewCount,
            bestRating: "5",
            worstRating: "1",
          },
        }
      : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface BreadcrumbJsonLdProps {
  items: { name: string; url: string }[];
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqJsonLdProps {
  items: FaqItem[];
}

export function FaqJsonLd({ items }: FaqJsonLdProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface WebSiteJsonLdProps {
  name: string;
  url: string;
  potentialActionUrl?: string;
}

export function WebSiteJsonLd({
  name,
  url,
  potentialActionUrl,
}: WebSiteJsonLdProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url,
    ...(potentialActionUrl
      ? {
          potentialAction: {
            "@type": "SearchAction",
            target: `${potentialActionUrl}?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        }
      : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}


