import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.ancraze.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/about",
          "/courses",
          "/why-ancraze",
          "/what-we-provide",
          "/faculties",
          "/contact",
          "/privacy",
        ],
        disallow: [
          "/superadmin/",
          "/dashboard/",
          "/trainer/",
          "/student/",
          "/api/",
          "/blocked/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
