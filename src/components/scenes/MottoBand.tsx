"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { clamp, mix, seg, useScene } from "@/lib/scene";

const KEYS = ["w1", "w2", "w3"] as const;

/**
 * Bande devise (skill Site Immersif) : sur fond d'accent (l'or HEI), un
 * train de 3 mots géants glisse ; chaque mot passe par le centre, ses
 * lettres se posent, et une ligne d'explication (hint) permute en dessous.
 */
export default function MottoBand() {
  const t = useTranslations("motto");
  const ref = useRef<HTMLElement>(null);

  useScene(ref, () => {
    const root = ref.current!;
    const pin = root.querySelector<HTMLElement>(".pin")!;
    const track = root.querySelector<HTMLElement>(".motto-track")!;
    const hint = root.querySelector<HTMLElement>(".motto-hint")!;
    const hints = KEYS.map((k) => t(`${k}.hint`));
    let words: { el: HTMLElement; chars: HTMLElement[]; amps: number[]; center: number }[] = [];
    let active = -1;
    let timer = 0;
    return {
      measure() {
        words = [...track.querySelectorAll<HTMLElement>(".mw")].map((el) => {
          const chars = [...el.querySelectorAll<HTMLElement>(".sc")];
          return {
            el,
            chars,
            // amplitudes pseudo-aléatoires mais stables (formule du skill)
            amps: chars.map((_, i) => (((i * 7919 + 31) % 13) - 6) / 6 || 0.45),
            center: el.offsetLeft + el.offsetWidth / 2,
          };
        });
      },
      update(p) {
        if (!words.length) return;
        const vw = pin.clientWidth;
        const vh = pin.clientHeight;
        const tt = seg(p, 0.03, 0.97);
        const x = vw / 2 - mix(words[0].center, words[words.length - 1].center, tt);
        track.style.transform = `translate(${x.toFixed(1)}px, -50%)`;
        let best = 0;
        let bestD = 1e9;
        words.forEach((w, wi) => {
          const rel = clamp((w.center + x - vw / 2) / vw, -1.3, 1.3);
          const d = Math.abs(rel);
          if (d < bestD) {
            bestD = d;
            best = wi;
          }
          // loin du centre : lettres dispersées ; au centre : posées
          w.el.style.opacity = (1 - Math.min(d * 1.1, 0.75)).toFixed(3);
          w.chars.forEach((c, i) => {
            c.style.transform = `translate3d(0, ${(w.amps[i] * rel * vh * 0.3).toFixed(1)}px, 0) rotate(${(w.amps[i] * rel * 6).toFixed(2)}deg)`;
          });
        });
        if (best !== active) {
          active = best;
          hint.classList.add("swap");
          window.clearTimeout(timer);
          timer = window.setTimeout(() => {
            hint.textContent = hints[best] || "";
            hint.classList.remove("swap");
          }, 150);
        }
      },
    };
  });

  return (
    <div className="band">
      <div className="diag to-accent" aria-hidden="true" />
      <section ref={ref} className="scene s-motto" style={{ "--pin": 4 } as React.CSSProperties} aria-labelledby="motto-kicker">
        <div className="pin">
          <h2 className="motto-kicker mono" id="motto-kicker">
            {t("kicker")}
          </h2>
          <p className="motto-track">
            {KEYS.map((k) => (
              <span key={k} className="mw" aria-label={t(`${k}.word`)}>
                {[...t(`${k}.word`)].map((c, i) => (
                  <span key={i} className="sc" aria-hidden="true">
                    {c}
                  </span>
                ))}
              </span>
            ))}
          </p>
          <p className="motto-hint mono" aria-live="polite">
            {t("w1.hint")}
          </p>
          {/* mode statique : les trois explications, lisibles d'un coup */}
          <ul className="motto-hints mono">
            {KEYS.map((k) => (
              <li key={k}>
                {t(`${k}.word`)} — {t(`${k}.hint`)}
              </li>
            ))}
          </ul>
        </div>
      </section>
      <div className="diag from-accent" aria-hidden="true" />
    </div>
  );
}
