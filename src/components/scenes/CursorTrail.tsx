"use client";

import { useEffect, useRef } from "react";

/** Largeurs des 20 images de la réserve, reprises du skill (--tw). */
const WIDTHS = [150, 190, 120, 200, 96, 170, 34, 140, 200, 110, 28, 160, 130, 180, 40, 150, 120, 200, 100, 170];

/**
 * Traînée d'images sous la souris (skill Site Immersif) : chaque déplacement
 * de 38 px dépose la photo suivante à la position du curseur ; elle surgit,
 * tient, puis s'efface (3,6 s). DESKTOP UNIQUEMENT : sans curseur, ça n'a
 * pas de sens. Désactivée en mouvement réduit.
 */
export default function CursorTrail({ areaRef }: { areaRef: React.RefObject<HTMLElement | null> }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const area = areaRef.current;
    const box = ref.current;
    if (!area || !box) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;

    const imgs = [...box.querySelectorAll("img")];
    let idx = 0, z = 10, acc = 0;
    let px: number | null = null, py: number | null = null;

    const spawn = (x: number, y: number) => {
      const img = imgs[idx % imgs.length];
      idx++;
      const rot = ((idx * 47) % 17) - 8;
      img.style.zIndex = String(++z);
      img.getAnimations().forEach((a) => a.cancel());
      const at = (s: number) =>
        `translate(${x.toFixed(0)}px, ${y.toFixed(0)}px) translate(-50%, -50%) rotate(${rot}deg) scale(${s})`;
      img.animate(
        [
          { opacity: 0, transform: at(0.5) },
          { opacity: 1, transform: at(1), offset: 0.14 },
          { opacity: 1, transform: at(1), offset: 0.72 },
          { opacity: 0, transform: at(0.94) },
        ],
        { duration: 3600, easing: "cubic-bezier(0.19, 1, 0.22, 1)", fill: "forwards" },
      );
    };

    const onMove = (e: MouseEvent) => {
      const r = box.getBoundingClientRect();
      // seulement quand l'écran de la scène est visible
      if (r.bottom < 0 || r.top > innerHeight) {
        px = py = null;
        return;
      }
      if (px === null || py === null) {
        px = e.clientX;
        py = e.clientY;
        return;
      }
      acc += Math.hypot(e.clientX - px, e.clientY - py);
      px = e.clientX;
      py = e.clientY;
      if (acc < 38) return;
      acc = 0;
      spawn(e.clientX - r.left, e.clientY - r.top);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [areaRef]);

  return (
    <div className="trail" ref={ref} aria-hidden="true">
      {WIDTHS.map((w, i) => (
        // images décoratives, animées à la main : <img> simple, chargement différé
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={`/hei/scenes/trail-${String(i + 1).padStart(2, "0")}.webp`}
          alt=""
          loading="lazy"
          decoding="async"
          style={{ "--tw": `${w}px` } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
