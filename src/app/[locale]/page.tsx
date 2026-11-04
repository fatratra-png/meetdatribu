import { use } from "react";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

// Page d'accueil — phase 1 : un hero minimal pour valider le socle
// (polices, thèmes, langues, header). Les scènes arrivent en phase 3.
export default function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("home");

  return (
    <section className="site-grid min-h-svh content-center pt-28">
      <p className="mono col-span-4 text-ink-soft md:col-span-12">{t("kicker")}</p>
      <h1 className="col-span-4 mt-4 text-[clamp(44px,9vw,128px)] leading-[0.95] tracking-[-0.03em] md:col-span-10">
        {t("title")}
      </h1>
      <p className="col-span-4 mt-6 max-w-[42ch] text-ink-soft md:col-span-6">{t("lead")}</p>
      <div id="decouvrir" className="col-span-4 h-[120vh] md:col-span-12" aria-hidden />
    </section>
  );
}
