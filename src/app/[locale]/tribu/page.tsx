import { use } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PARTNERS, TEAM } from "@/content/hei";
import PartnersMarquee from "@/components/content/PartnersMarquee";

export async function generateMetadata({ params }: PageProps<"/[locale]/tribu">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: t("tribuTitle"),
    description: t("tribuDescription"),
    alternates: {
      canonical: `/${locale}/tribu`,
      languages: { fr: "/fr/tribu", en: "/en/tribu", "x-default": "/fr/tribu" },
    },
  };
}

/** /tribu — l'équipe pédagogique (site HEI) et les partenaires en bandeau infini. */
export default function Page({ params }: PageProps<"/[locale]/tribu">) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("tribu");
  const lang = useLocale() as "fr" | "en";

  return (
    <section className="page" aria-labelledby="tribu-title">
      <header className="page-head">
        <p className="label mono">{t("kicker")}</p>
        <h1 id="tribu-title">
          {t("titleA", { team: TEAM.length })} <span className="it">{t("titleIt", { partners: PARTNERS.length })}</span>
        </h1>
        <p>{t("lead")}</p>
      </header>

      <h2 className="label mono">{t("teamTitle")}</h2>
      <ul className="team" style={{ marginTop: 20 }}>
        {TEAM.map((m) => (
          <li key={m.name} className="member">
            <div className="member-photo">
              <Image src={m.photo} alt={t("photoAlt", { name: m.name })} fill sizes="(max-width: 600px) 100vw, 25vw" />
            </div>
            <h3>{m.name}</h3>
            <p>{m.title[lang]}</p>
          </li>
        ))}
      </ul>

      <h2 className="label mono section-gap">{t("partnersTitle")}</h2>
      <p className="ash" style={{ margin: "14px 0 24px", maxWidth: "56ch" }}>
        {t("partnersLead")}
      </p>
      <PartnersMarquee label={t("partnersTitle")} />
      <p className="mono ash" style={{ marginTop: 18 }}>
        {t("source")}
      </p>
    </section>
  );
}
