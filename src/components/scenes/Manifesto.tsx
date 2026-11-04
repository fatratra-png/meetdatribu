"use client";

import { Fragment, useRef } from "react";
import { useTranslations } from "next-intl";
import { makeDraw, seg, useScene } from "@/lib/scene";

const OVAL = "M50,6 C88,4 98,22 97,50 C96,82 76,96 49,95 C16,94 3,76 4,48 C5,18 20,7 50,6 Z";

/** Un mot = un bloc insécable de caractères `.fc`. */
function Chars({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\s+)/).map((part, i) =>
        /^\s+$/.test(part) || !part ? (
          part ? " " : null
        ) : (
          <span key={i} style={{ whiteSpace: "nowrap" }}>
            {[...part].map((c, j) => (
              <span key={j} className="fc">
                {c}
              </span>
            ))}
          </span>
        ),
      )}
    </>
  );
}

/**
 * Manifeste (skill Site Immersif, scène 2) : le texte s'encre caractère par
 * caractère au scroll ; l'ovale dessiné à la main n'apparaît QUE quand le
 * remplissage atteint les 2-3 mots qu'il entoure. Puis le texte se grise et
 * la scène suivante le recouvre sur place.
 * Le texte vient des messages : la partie entourée est notée [[…]].
 */
export default function Manifesto() {
  const t = useTranslations("manifesto");
  const ref = useRef<HTMLElement>(null);
  const raw = t("text");
  const plain = raw.replace(/\[\[|\]\]/g, "");
  const parts = raw.split(/\[\[(.+?)\]\]/);

  useScene(ref, () => {
    const root = ref.current!;
    const text = root.querySelector<HTMLElement>(".fill-text")!;
    const chars = [...root.querySelectorAll<HTMLElement>(".fc")];
    const draw = makeDraw(root.querySelector<SVGPathElement>(".box-svg path")!);
    // l'ovale se dessine quand l'encre arrive aux mots entourés
    const firstBoxed = chars.findIndex((c) => c.closest(".boxed"));
    const lastBoxed = chars.length - 1 - [...chars].reverse().findIndex((c) => c.closest(".boxed"));
    const at = (i: number) => 0.05 + (i / chars.length) * 0.53;
    const drawStart = at(firstBoxed);
    const drawEnd = Math.max(at(lastBoxed + 1) + 0.04, drawStart + 0.1);
    let lastIdx = 0;
    return {
      measure: () => draw.calc(),
      update(p) {
        const idx = Math.round(seg(p, 0.05, 0.58) * chars.length);
        if (idx !== lastIdx) {
          const lo = Math.min(idx, lastIdx);
          const hi = Math.max(idx, lastIdx);
          for (let i = lo; i < hi; i++) chars[i].classList.toggle("on", i < idx);
          lastIdx = idx;
        }
        draw.set(1 - seg(p, drawStart, drawEnd));
        text.classList.toggle("greyed", p > 0.68);
      },
    };
  });

  return (
    <section ref={ref} id="conseils" className="scene s-fill" style={{ "--pin": 3.5 } as React.CSSProperties} aria-labelledby="conseils-title">
      <div className="pin">
        <div className="fill-wrap">
          <h2 className="fill-kicker mono" id="conseils-title">
            {t("kicker")}
          </h2>
          <p className="fill-text">
            <span className="sr-only">{plain}</span>
            <span aria-hidden="true">
              {parts.map((part, i) =>
                i % 2 === 1 ? (
                  <span key={i} className="boxed">
                    <Chars text={part} />
                    <svg className="box-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <path d={OVAL} />
                    </svg>
                  </span>
                ) : (
                  <Fragment key={i}>
                    <Chars text={part} />
                  </Fragment>
                ),
              )}
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
