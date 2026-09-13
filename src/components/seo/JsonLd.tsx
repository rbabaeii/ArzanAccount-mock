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
  priceToman: number;
  ratingValue: number;
  reviewCount: number;
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
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    image,
    description,
    sku,
    category,
    offers: {
      "@type": "Offer",
      url: `https://arzanaccount.ir/products/${sku}`,
      priceCurrency: "IRR",
      price: priceRial,
      priceValidUntil: "2026-12-31",
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue,
      reviewCount,
    },
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

