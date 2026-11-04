"use client";

/**
 * Outils des scènes de scroll — port du moteur du skill Site Immersif
 * (assets/app.js). Les fonctions et les courbes sont celles du skill.
 * Ce qui change : le défilement est lissé par Lenis et la progression de
 * chaque scène vient de GSAP ScrollTrigger (au lieu du lerp maison).
 */
import { useEffect, useRef } from "react";
import { ScrollTrigger } from "@/lib/gsap";

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** Progression locale entre a et b (0..1), avec une courbe optionnelle. */
export const seg = (p: number, a: number, b: number, e?: (t: number) => number) => {
  const t = clamp((p - a) / (b - a), 0, 1);
  return e ? e(t) : t;
};

/** Mode statique : UNIQUEMENT sur prefers-reduced-motion (règle du skill). */
export const isStaticMode = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Position d'un élément dans le document (le docTop du skill). */
export function docTop(el: HTMLElement) {
  let t = 0;
  let n: HTMLElement | null = el;
  while (n) {
    t += n.offsetTop;
    n = n.offsetParent as HTMLElement | null;
  }
  return t;
}

/**
 * Trait SVG qui se dessine (ovales « à la main »). Longueur en pixels écran,
 * recalculée quand les polices arrivent ou que la fenêtre change.
 * Renvoie set(v) : v = 1 → invisible, v = 0 → entièrement dessiné.
 */
export function makeDraw(el: SVGPathElement) {
  if (isStaticMode()) {
    el.style.strokeDasharray = "none";
    el.style.strokeDashoffset = "0";
    return { set: () => {}, calc: () => {} };
  }
  let L = 1;
  let lastV = 1;
  const calc = () => {
    const svg = el.ownerSVGElement!;
    const vb = svg.viewBox.baseVal;
    const sx = (svg.clientWidth || 100) / ((vb && vb.width) || 100);
    const sy = (svg.clientHeight || 100) / ((vb && vb.height) || 100);
    L = el.getTotalLength() * Math.max(sx, sy, 1) * 1.25;
    el.style.strokeDasharray = String(L);
    el.style.strokeDashoffset = String(L * lastV);
    el.style.opacity = lastV >= 0.999 ? "0" : "1";
  };
  calc();
  return {
    calc,
    set: (v: number) => {
      lastV = clamp(v, 0, 1);
      el.style.strokeDashoffset = String(L * lastV);
      el.style.opacity = lastV >= 0.999 ? "0" : "1";
    },
  };
}

/**
 * Image qui naît entre deux mots puis remplit l'écran. Croissance en ratio
 * paysage (~1.9:1) avant d'atteindre 100vw × 100vh.
 */
export function makeGrow(el: HTMLElement) {
  const img = el.querySelector("img") as HTMLImageElement;
  const line = el.parentElement as HTMLElement;
  const pin = line.closest(".pin") as HTMLElement;
  let xOff = 0;
  let yOff = 0;
  let fs = 57;
  return {
    measure() {
      fs = parseFloat(getComputedStyle(line).fontSize);
      let leftW = 0;
      let rightW = 0;
      let seen = false;
      [...line.children].forEach((c) => {
        if (c === el) {
          seen = true;
          return;
        }
        if (c.classList.contains("hl")) {
          if (seen) rightW += (c as HTMLElement).offsetWidth;
          else leftW += (c as HTMLElement).offsetWidth;
        }
      });
      xOff = (leftW - rightW) / 2;
      // pin sticky : sa position de repos est celle de la ligne dans le pin
      yOff = docTop(line) - docTop(pin) + line.offsetHeight / 2 - pin.clientHeight / 2;
    },
    set(t: number, zoom = 1, lift = t) {
      const vw = pin.clientWidth;
      const vh = pin.clientHeight;
      const w = vw * t;
      const h = Math.min(vh, Math.max(w / 1.9, vh * Math.pow(t, 1.6)));
      el.style.width = w.toFixed(1) + "px";
      el.style.height = h.toFixed(1) + "px";
      const m = fs * 0.13 + Math.min(t * 60, fs * 0.12);
      el.style.marginLeft = el.style.marginRight = m.toFixed(1) + "px";
      el.style.borderRadius = t > 0.985 ? "0" : "2px";
      line.style.transform = `translate(${(-xOff * t).toFixed(1)}px, ${(-yOff * lift).toFixed(1)}px)`;
      img.style.transform = `translate(-50%, -50%) scale(${zoom})`;
    },
  };
}

/**
 * Branche une scène épinglée : `update(p)` reçoit la progression 0..1 de la
 * section (ScrollTrigger, du haut de la section au bas de la section) et
 * `measure()` est rappelé à chaque recalcul (polices, images, redimension).
 * En mode statique, rien n'est branché : la mise en page CSS suffit.
 */
export function useScene(
  ref: React.RefObject<HTMLElement | null>,
  setup: () => { update: (p: number) => void; measure?: () => void } | void,
) {
  const setupRef = useRef(setup);
  useEffect(() => {
    setupRef.current = setup;
  });

  useEffect(() => {
    const root = ref.current;
    if (!root || isStaticMode()) return;
    const scene = setupRef.current();
    if (!scene) return;
    let lastP = -1;
    const st = ScrollTrigger.create({
      trigger: root,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        if (Math.abs(self.progress - lastP) < 0.0004) return;
        lastP = self.progress;
        scene.update(self.progress);
      },
      onRefresh: (self) => {
        scene.measure?.();
        lastP = -1;
        scene.update(self.progress);
      },
    });
    scene.measure?.();
    scene.update(st.progress);
    // les longueurs des tracés et les mesures dépendent des polices :
    // UN seul recalcul global, quel que soit le nombre de scènes
    scheduleFontRefresh();
    return () => st.kill();
  }, [ref]);
}

let fontRefresh: Promise<void> | null = null;
function scheduleFontRefresh() {
  if (fontRefresh || !document.fonts) return;
  fontRefresh = document.fonts.ready.then(() => {
    requestAnimationFrame(() => ScrollTrigger.refresh());
  });
}

/** Révélation à l'entrée dans l'écran (classe `in-view`, comme le skill). */
export function useReveal(ref: React.RefObject<HTMLElement | null>, selector = ".reveal") {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const targets = [...root.querySelectorAll<HTMLElement>(selector)];
    if (root.matches(selector)) targets.push(root);
    if (isStaticMode()) {
      targets.forEach((t) => t.classList.add("in-view"));
      return;
    }
    // le skill déclenche quand le haut de l'élément passe à 88 % de l'écran
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in-view");
            io.unobserve(e.target);
          }
        }),
      { rootMargin: "0px 0px -12% 0px" },
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [ref, selector]);
}
