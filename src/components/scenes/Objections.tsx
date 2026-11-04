"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { makeDraw, seg, useScene } from "@/lib/scene";
import CursorTrail from "./CursorTrail";

const OVAL = "M50,6 C88,4 98,22 97,50 C96,82 76,96 49,95 C16,94 3,76 4,48 C5,18 20,7 50,6 Z";

/**
 * Objections (skill Site Immersif, scène finale) : trois « Pas de… » qui
 * s'encrent, une phrase finale dont 1-2 mots sont entourés d'une pilule
 * dessinée, et la traînée d'images sous la souris.
 * Cette scène recouvre le manifeste grisé SUR PLACE (margin-top: -100lvh).
 */
export default function Objections() {
  const t = useTranslations("objections");
  const ref = useRef<HTMLElement>(null);

  useScene(ref, () => {
    const root = ref.current!;
    const fs = [...root.querySelectorAll<HTMLElement>(".fs")];
    const pill = makeDraw(root.querySelector<SVGPathElement>(".pill-svg path")!);
    return {
      measure: () => pill.calc(),
      update(p) {
        [0.08, 0.2, 0.34, 0.52].forEach((th, i) => fs[i]?.classList.toggle("on", p > th));
        pill.set(1 - seg(p, 0.56, 0.72));
      },
    };
  });

  return (
    <section ref={ref} className="scene s-final" style={{ "--pin": 2.6 } as React.CSSProperties} aria-label={t("label")}>
      <div className="pin">
        <p className="final-text">
          <span className="fs">{t("no1")}</span> <span className="fs">{t("no2")}</span>{" "}
          <span className="fs">{t("no3")}</span>
          <br />
          <span className="fs">
            {t("finale")}{" "}
            <span className="pill">
              {t("pill")}
              <svg className="pill-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <path d={OVAL} />
              </svg>
            </span>
          </span>
        </p>
        <CursorTrail areaRef={ref} />
      </div>
    </section>
  );
}
