"use client";

import { useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { easeInOut, easeOut, seg, useScene } from "@/lib/scene";

/**
 * Témoignage (skill Site Immersif) : guillemet, parole, filet, signature —
 * dans cet ordre. Le chiffre monte de 0 SOUS la signature : c'est une pièce
 * à conviction, jamais le sujet. La citation doit se lire seule.
 */
export default function Testimonial() {
  const t = useTranslations("testimonial");
  const locale = useLocale();
  const ref = useRef<HTMLElement>(null);
  const target = Number(t("figure"));
  const decimals = (t("figure").split(".")[1] || "").length;
  const fmt = (v: number) =>
    v.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  useScene(ref, () => {
    const root = ref.current!;
    const $ = (s: string) => root.querySelector<HTMLElement>(s)!;
    const glyph = $(".q-glyph"), text = $(".q-text"), rule = $(".q-rule");
    const name = $(".q-name"), ctx = $(".q-ctx"), fig = $(".q-fig"), val = $(".fig-val");
    let last = "";
    const rise = (el: HTMLElement, k: number, dist: number) => {
      el.style.opacity = k.toFixed(3);
      el.style.transform = `translateY(${((1 - k) * dist).toFixed(1)}px)`;
    };
    return {
      update(p) {
        rise(glyph, seg(p, 0.03, 0.15, easeOut), 28);
        rise(text, seg(p, 0.11, 0.36, easeOut), 32); // la parole, d'un bloc
        rule.style.transform = `scaleX(${seg(p, 0.38, 0.58, easeInOut).toFixed(4)})`;
        rise(name, seg(p, 0.52, 0.64, easeOut), 14);
        rise(ctx, seg(p, 0.57, 0.69, easeOut), 14);
        const f = seg(p, 0.58, 0.84, easeOut);
        fig.style.opacity = Math.min(1, f * 3.5).toFixed(3);
        const v = fmt(target * f);
        if (v !== last) {
          val.textContent = v;
          last = v;
        }
      },
    };
  });

  return (
    <section ref={ref} id="temoignage" className="scene s-quote" style={{ "--pin": 3 } as React.CSSProperties} aria-label={t("label")}>
      <div className="pin">
        <figure className="q-stack">
          <span className="q-glyph" aria-hidden="true">
            “
          </span>
          <blockquote>
            <p className="q-text">{t("quote")}</p>
          </blockquote>
          <figcaption className="q-sign">
            <span className="q-rule" aria-hidden="true" />
            <div className="q-sign-row">
              <p className="q-name">{t("author")}</p>
              <p className="q-ctx mono">{t("context")}</p>
              <p className="q-fig">
                <span className="fig-pre">{t("prefix")}</span>
                <span className="fig-val">{fmt(target)}</span>
                <span className="fig-unit">{t("unit")}</span>
              </p>
            </div>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
