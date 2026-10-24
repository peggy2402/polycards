import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/tools", "/api/"],
    },
    sitemap: "https://polycards-one.vercel.app/sitemap.xml",
  };
}
