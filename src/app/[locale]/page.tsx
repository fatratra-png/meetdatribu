import { use } from "react";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import GlassStage from "@/components/three/GlassStage";

// Page d'accueil — phase 2 : la scène du verre (accueil + Découvrir HEI).
// Les scènes de scroll (phase 3) et le contenu (phase 4) viendront à la suite.
export default function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("home");

  return (
    <>
      <GlassStage />
      <section className="site-grid min-h-svh content-center">
        <p className="mono col-span-4 text-ink-soft md:col-span-12">{t("kicker")}</p>
        <p className="col-span-4 mt-6 max-w-[42ch] text-ink-soft md:col-span-6">{t("lead")}</p>
      </section>
    </>
  );
}
