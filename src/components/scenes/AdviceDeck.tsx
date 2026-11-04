"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { clamp, seg, useScene } from "@/lib/scene";

const CARDS = ["a1", "a2", "a3", "a4", "a5"] as const;

/**
 * « Les bons conseils » : ce que les anciens auraient aimé savoir, en paquet
 * de cartes. Au scroll, la carte du dessus s'envole en tournant, la suivante
 * avance ; à gauche, le compteur 01 / 05 et des points suivent.
 * Chaque carte : une phrase d'ancien (serif italique), puis le conseil.
 */
export default function AdviceDeck() {
  const t = useTranslations("advice");
  const ref = useRef<HTMLElement>(null);
  const n = CARDS.length;

  useScene(ref, () => {
    const root = ref.current!;
    const cards = [...root.querySelectorAll<HTMLElement>(".deck-card")];
    const count = root.querySelector<HTMLElement>(".deck-count b")!;
    const dots = [...root.querySelectorAll<HTMLElement>(".deck-dots i")];
    let shown = -1;
    return {
      update(p) {
        const c = seg(p, 0.08, 0.92) * (n - 1);
        cards.forEach((el, i) => {
          const d = i - c;
          let tf: string;
          let op: number;
          if (d < 0) {
            // carte passée : elle s'envole vers le haut-gauche en tournant
            const k = clamp(-d, 0, 1);
            tf = `translate3d(${(-k * 38).toFixed(2)}%, ${(-k * 22).toFixed(2)}%, 0) rotate(${(-k * 12).toFixed(2)}deg)`;
            op = 1 - k * 2.2; // elle disparaît vite : jamais deux conseils lisibles ensemble
          } else {
            // cartes à venir : empilées derrière, plus petites
            tf = `translate3d(0, ${(d * 16).toFixed(1)}px, 0) scale(${(1 - d * 0.05).toFixed(3)})`;
            op = d > 3 ? 0 : 1 - d * 0.18;
          }
          el.style.transform = tf;
          el.style.opacity = clamp(op, 0, 1).toFixed(3);
          el.style.zIndex = String(n - i);
          el.style.visibility = op > 0.02 ? "visible" : "hidden";
          el.setAttribute("aria-hidden", Math.round(c) === i ? "false" : "true");
        });
        const idx = Math.round(c);
        if (idx !== shown) {
          shown = idx;
          count.textContent = String(idx + 1).padStart(2, "0");
          dots.forEach((dot, i) => dot.classList.toggle("on", i === idx));
        }
      },
    };
  });

  return (
    <section
      ref={ref}
      id="conseils"
      data-chapter="advice"
      className="scene s-deck"
      style={{ "--pin": 5 } as React.CSSProperties}
      aria-labelledby="advice-title"
    >
      <div className="pin">
        <div className="deck-side">
          <p className="label mono">{t("kicker")}</p>
          <h2 id="advice-title">
            {t("titleA")} <span className="it">{t("titleIt")}</span>
          </h2>
          <p className="deck-count" aria-hidden="true">
            <b>01</b>
            <span>/ {String(n).padStart(2, "0")}</span>
          </p>
          <p className="deck-dots" aria-hidden="true">
            {CARDS.map((k, i) => (
              <i key={k} className={i === 0 ? "on" : undefined} />
            ))}
          </p>
        </div>

        <ol className="deck">
          {CARDS.map((k, i) => (
            <li key={k} className="deck-card">
              <p className="mono">
                {String(i + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
              </p>
              <blockquote className="deck-quote it">« {t(`${k}.quote`)} »</blockquote>
              <hr />
              <h3>
                <em>→</em> {t(`${k}.title`)}
              </h3>
              <p>{t(`${k}.text`)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
