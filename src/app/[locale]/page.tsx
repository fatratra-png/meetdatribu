import { use } from "react";
import { setRequestLocale } from "next-intl/server";
import GlassStage from "@/components/three/GlassStage";
import OrbitTribe from "@/components/scenes/OrbitTribe";
import Timeline from "@/components/scenes/Timeline";
import MottoBand from "@/components/scenes/MottoBand";
import CampusTour from "@/components/campus/CampusTour";
import ToolsBento from "@/components/content/ToolsBento";
import Figures from "@/components/content/Figures";
import AdviceDeck from "@/components/scenes/AdviceDeck";
import Testimonial from "@/components/scenes/Testimonial";

/**
 * Page d'accueil : l'expérience principale, scrubée au scroll.
 * Ordre (pyramid-storyline-builder) :
 *   1. Accueil + Découvrir HEI — le verre (le symbole HEI, ses 4 piliers)
 *   2. La Tribu — l'anneau de photos (on passe de l'école aux gens)
 *   3. Se repérer — la frise des 4 repères
 *   3 bis. Le campus — la visite 3D, étage par étage
 *   4. Les outils — bento de 4 cartes qui se retournent
 *   5. La devise — Penser, Travailler, Impacter
 *   6. Les bons conseils — le paquet de cartes
 *   7. La Tribu en chiffres — compteurs et situation des diplômés
 *   8. Témoignage
 * Le footer et l'index des chapitres sont dans le layout.
 */
export default function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = use(params);
  setRequestLocale(locale);

  return (
    <>
      <GlassStage />
      <OrbitTribe />
      <Timeline />
      <CampusTour />
      <ToolsBento />
      <MottoBand />
      <AdviceDeck />
      <Figures />
      <Testimonial />
    </>
  );
}
