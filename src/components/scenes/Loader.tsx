"use client";

import { useEffect, useRef, useState } from "react";
import "./scenes.css";

const HANDOFF_MS = 900; // durée du vol du nom vers le dock
const FILL_MS = 700; // le trait se remplit en 700 ms

/**
 * Préchargeur (skill Site Immersif) : le nom + un trait qui se remplit,
 * puis le voile s'efface et le nom REJOINT sa place dans le header.
 * Trois pièges résolus, à ne pas réintroduire :
 *  (a) le dock ne descend PAS pendant le vol : la classe `handoff` le pose
 *      déjà à sa place, invisible — la cible ne bouge pas ;
 *  (b) le nom du loader s'éteint et le dock s'allume dans la MÊME frame ;
 *  (c) en fondu croisé de même durée (.32 s), jamais en bascule sèche.
 */
export default function Loader({ name }: { name: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLElement>(null);
  const wordRef = useRef<HTMLParagraphElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const body = document.body;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timers: number[] = [];

    const boot = () => {
      body.classList.add("is-ready");
      // passage de relais : le nom vole jusqu'au wordmark du dock
      const target = document.querySelector<HTMLElement>("[data-dock-wordmark]");
      const word = wordRef.current;
      if (target && word) {
        body.classList.add("handoff");
        const from = word.getBoundingClientRect();
        const to = target.getBoundingClientRect();
        if (from.width && to.width) {
          const dx = to.left + to.width / 2 - (from.left + from.width / 2);
          const dy = to.top + to.height / 2 - (from.top + from.height / 2);
          word.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${(to.width / from.width).toFixed(4)})`;
          timers.push(
            window.setTimeout(() => {
              // bascule atomique : même frame pour les deux
              word.classList.add("landed");
              body.classList.remove("handoff");
            }, HANDOFF_MS),
          );
        } else body.classList.remove("handoff");
      }
      rootRef.current?.classList.add("done");
      timers.push(window.setTimeout(() => setGone(true), 1400));
    };

    if (reduced) {
      body.classList.add("is-ready");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- pas de loader en mouvement réduit
      setGone(true);
      return;
    }

    // setInterval plutôt que rAF : continue (ralenti) en arrière-plan
    const t0 = performance.now();
    const timer = window.setInterval(() => {
      const p = Math.min(1, (performance.now() - t0) / FILL_MS);
      if (barRef.current) barRef.current.style.transform = `scaleX(${(1 - Math.pow(1 - p, 2)).toFixed(4)})`;
      if (p >= 1) {
        window.clearInterval(timer);
        timers.push(window.setTimeout(boot, 60));
      }
    }, 16);

    return () => {
      window.clearInterval(timer);
      timers.forEach(window.clearTimeout);
    };
  }, []);

  if (gone) return null;
  return (
    <div className="loader" ref={rootRef} aria-hidden="true" data-loader>
      <div className="loader-inner">
        <p className="loader-wordmark" ref={wordRef}>
          {name}
        </p>
        <span className="loader-rule">
          <i ref={barRef} />
        </span>
      </div>
      {/* sans JavaScript, le voile ne doit jamais bloquer la page */}
      <noscript>
        <style>{`.loader{display:none}.dock{transform:translate(-50%,0)!important}`}</style>
      </noscript>
    </div>
  );
}
