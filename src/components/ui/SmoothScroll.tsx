"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { setLenis } from "@/lib/lenis";
import { useScrollStore } from "@/lib/scrollStore";

/**
 * Défilement fluide avec Lenis, synchronisé avec GSAP ScrollTrigger.
 * - Lenis lisse la molette / le trackpad.
 * - À chaque défilement, on prévient ScrollTrigger (scènes épinglées).
 * - Lenis est piloté par le « ticker » de GSAP : une seule boucle d'animation.
 * Si l'utilisateur préfère moins d'animations, Lenis n'est pas créé du tout.
 */
export default function SmoothScroll() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const { setProgress, setVelocity } = useScrollStore.getState();

    // Progression globale, utile au fond en dégradé et au verre.
    const onNativeScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? window.scrollY / max : 0);
    };

    // Mode statique des scènes (règle du skill : UNIQUEMENT sur mouvement réduit)
    document.body.classList.toggle("static", reduced);

    if (reduced) {
      window.addEventListener("scroll", onNativeScroll, { passive: true });
      onNativeScroll();
      return () => window.removeEventListener("scroll", onNativeScroll);
    }

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => 1 - Math.pow(1 - t, 4), // proche de --ease-out
      smoothWheel: true,
    });
    setLenis(lenis);

    lenis.on("scroll", (e: Lenis) => {
      ScrollTrigger.update();
      setProgress(e.progress || 0);
      setVelocity(e.velocity);
    });

    const tick = (time: number) => lenis.raf(time * 1000); // GSAP donne des secondes
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      setLenis(null);
    };
  }, []);

  return null;
}
