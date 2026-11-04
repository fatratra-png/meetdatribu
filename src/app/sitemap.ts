import type { MetadataRoute } from "next";

const SITE = "https://meetdatribu.vercel.app";
const PAGES = ["", "/astuces", "/tribu"];

// Plan du site : chaque page en FR et en EN, avec ses alternatives de langue.
export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.flatMap((page) =>
    (["fr", "en"] as const).map((locale) => ({
      url: `${SITE}/${locale}${page}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: page === "" ? 1 : 0.7,
      alternates: { languages: { fr: `${SITE}/fr${page}`, en: `${SITE}/en${page}` } },
    })),
  );
}
