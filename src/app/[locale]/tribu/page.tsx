import { use } from "react";
import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata({ params }: PageProps<"/[locale]/tribu">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: t("tribuTitle"),
    alternates: {
      canonical: `/${locale}/tribu`,
      languages: { fr: "/fr/tribu", en: "/en/tribu", "x-default": "/fr/tribu" },
    },
  };
}

// Page /tribu — squelette de la phase 1, rempli en phase 4.
export default function Page({ params }: PageProps<"/[locale]/tribu">) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("tribu");

  return (
    <section className="site-grid min-h-svh content-center pt-28">
      <p className="mono col-span-4 text-ink-soft md:col-span-12">{t("kicker")}</p>
      <h1 className="col-span-4 mt-4 text-[length:var(--t-heading)] leading-none tracking-[-0.02em] md:col-span-8">
        {t("title")}
      </h1>
    </section>
  );
}
