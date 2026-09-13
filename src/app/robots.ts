import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://arzanaccount.ir";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/admin/*",
          "/api/",
          "/cart",
          "/checkout",
          "/payment/",
          "/profile",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

