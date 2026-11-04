import { use } from "react";
import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import AstucesBrowser from "@/components/content/AstucesBrowser";
import { ASTUCES } from "@/content/astuces";

export async function generateMetadata({ params }: PageProps<"/[locale]/astuces">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: t("astucesTitle"),
    description: t("astucesDescription"),
    alternates: {
      canonical: `/${locale}/astuces`,
      languages: { fr: "/fr/astuces", en: "/en/astuces", "x-default": "/fr/astuces" },
    },
  };
}

/** /astuces — toutes les astuces collectées, filtrables et cherchables. */
export default function Page({ params }: PageProps<"/[locale]/astuces">) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("astuces");

  return (
    <section className="page" aria-labelledby="astuces-title">
      <header className="page-head">
        <p className="label mono">{t("kicker")}</p>
        <h1 id="astuces-title">
          {t("titleA", { n: ASTUCES.length })} <span className="it">{t("titleIt")}</span>
        </h1>
        <p>{t("lead")}</p>
      </header>
      <AstucesBrowser />
    </section>
  );
}
