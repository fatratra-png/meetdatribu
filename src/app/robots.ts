import type { MetadataRoute } from "next";

// Tout le site est public ; on indique où se trouve le plan du site.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://meetdatribu.vercel.app/sitemap.xml",
  };
}
