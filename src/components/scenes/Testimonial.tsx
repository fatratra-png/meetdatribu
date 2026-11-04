"use client";

import { Fragment, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { easeOut, seg, useScene } from "@/lib/scene";

/**
 * Témoignage : la parole d'un ancien se défloute mot à mot au scroll, puis la
 * signature monte et le chiffre compte depuis 0. Le chiffre appuie la
 * parole ; il n'est pas le sujet.
 */
export default function Testimonial() {
  const t = useTranslations("testimonial");
  const locale = useLocale();
  const ref = useRef<HTMLElement>(null);
  const target = Number(t("figure"));
  const decimals = (t("figure").split(".")[1] || "").length;
  const fmt = (v: number) =>
    v.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const words = t("quote").split(" ");

  useScene(ref, () => {
    const root = ref.current!;
    const ws = [...root.querySelectorAll<HTMLElement>(".qt-text .w")];
    const sign = root.querySelector<HTMLElement>(".qt-sign")!;
    const val = root.querySelector<HTMLElement>(".qt-val")!;
    let last = "";
    return {
      update(p) {
        const span = 0.55 / ws.length;
        ws.forEach((w, i) => {
          const k = seg(p, 0.05 + i * span, 0.05 + i * span + 0.12, easeOut);
          w.style.opacity = (0.12 + k * 0.88).toFixed(3);
          w.style.filter = `blur(${((1 - k) * 8).toFixed(2)}px)`;
        });
        const s = seg(p, 0.62, 0.74, easeOut);
        sign.style.opacity = s.toFixed(3);
        sign.style.transform = `translateY(${((1 - s) * 16).toFixed(1)}px)`;
        const v = fmt(target * seg(p, 0.66, 0.9, easeOut));
        if (v !== last) {
          val.textContent = v;
          last = v;
        }
      },
    };
  });

  return (
    <section
      ref={ref}
      id="temoignage"
      data-chapter="voice"
      className="scene s-quote"
      style={{ "--pin": 3 } as React.CSSProperties}
      aria-label={t("label")}
    >
      <div className="pin">
        <figure className="qt">
          <p className="label mono">{t("kicker")}</p>
          <blockquote className="qt-text it">
            <span className="sr-only">{t("quote")}</span>
            <span aria-hidden="true">
              {words.map((w, i) => (
                <Fragment key={i}>
                  {i > 0 && " "}
                  <span className="w">{w}</span>
                </Fragment>
              ))}
            </span>
          </blockquote>
          <figcaption className="qt-sign">
            <div>
              <p className="qt-name">{t("author")}</p>
              <p className="qt-ctx mono">{t("context")}</p>
            </div>
            <p className="qt-fig">
              <span className="qt-val">{fmt(target)}</span>
              <small>{t("unit")}</small>
            </p>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
