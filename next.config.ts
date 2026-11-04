import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Le plugin next-intl indique à Next où trouver la config des traductions.
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // cacheComponents est désactivé volontairement : le site est 100 % statique
  // (aucune donnée serveur) et next-intl s'appuie sur setRequestLocale +
  // generateStaticParams pour pré-rendre chaque langue. Voir DECISIONS.md.
  images: {
    formats: ["image/avif", "image/webp"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withNextIntl(nextConfig);
