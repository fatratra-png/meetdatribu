import { use } from "react";
import { setRequestLocale } from "next-intl/server";
import GlassStage from "@/components/three/GlassStage";
import HeroCloud from "@/components/scenes/HeroCloud";
import BladeCurtain from "@/components/scenes/BladeCurtain";
import MottoBand from "@/components/scenes/MottoBand";
import Manifesto from "@/components/scenes/Manifesto";
import Objections from "@/components/scenes/Objections";
import Testimonial from "@/components/scenes/Testimonial";

/**
 * Page d'accueil : l'expérience principale, scrubée au scroll.
 * Ordre (pyramid-storyline-builder) :
 *   1. Accueil + Découvrir HEI — le verre (le symbole HEI, ses 4 piliers)
 *   2. La Tribu — le nuage de photos (on passe de l'école aux gens)
 *   3. Se repérer — le rideau de lames, une étape par moment clé
 *   4. Les outils — cartes interactives (phase 4)
 *   5. La devise — Penser, Travailler, Impacter
 *   6. Les bons conseils — manifeste, puis objections (« Pas de… »)
 *   7. La Tribu en chiffres (phase 4)
 *   8. Témoignage
 * Le footer est dans le layout (commun à toutes les pages).
 */
export default function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = use(params);
  setRequestLocale(locale);

  return (
    <>
      <GlassStage />
      <HeroCloud />
      <BladeCurtain />
      <MottoBand />
      <Manifesto />
      <Objections />
      <Testimonial />
    </>
  );
}
