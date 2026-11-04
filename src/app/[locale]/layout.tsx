import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { grotesk, dmMono, serif } from "../fonts";
import Header from "@/components/ui/Header";
import SmoothScroll from "@/components/ui/SmoothScroll";
import MotionProvider from "@/components/ui/MotionProvider";
import ThemeScript from "@/components/ui/ThemeScript";
import Loader from "@/components/scenes/Loader";
import FooterCta from "@/components/scenes/FooterCta";
import ChapterIndex from "@/components/ui/ChapterIndex";
import "../globals.css";
// styles des pages /astuces et /tribu, chargés partout : sinon Next les
// précharge sur l'accueil (préchargement des liens) sans les utiliser
import "@/components/content/pages.css";

export const SITE_URL = "https://meetdatribu.vercel.app";

// Pré-rend une version de chaque page par langue (/fr et /en) au build.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t("title"), template: `%s · Meet da Tribu` },
    description: t("description"),
    alternates: {
      canonical: `/${locale}`,
      languages: { fr: "/fr", en: "/en", "x-default": "/fr" },
    },
    openGraph: {
      type: "website",
      siteName: "Meet da Tribu",
      locale: locale === "fr" ? "fr_FR" : "en_US",
      title: t("title"),
      description: t("description"),
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#000a1f" },
    { media: "(prefers-color-scheme: light)", color: "#faf8f3" },
  ],
};

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Active le rendu statique pour cette langue (next-intl).
  setRequestLocale(locale);
  const t = await getTranslations("a11y");

  return (
    <html
      lang={locale}
      data-theme="dark"
      className={`${grotesk.variable} ${dmMono.variable} ${serif.variable}`}
      suppressHydrationWarning
    >
      <body>
        <ThemeScript />
        <NextIntlClientProvider>
          <MotionProvider>
            <a href="#contenu" className="skip-link">
              {t("skip")}
            </a>
            <Loader name="Meet da Tribu" />
            <SmoothScroll />
            <Header />
            <main id="contenu">{children}</main>
            <FooterCta />
            <ChapterIndex />
          </MotionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
