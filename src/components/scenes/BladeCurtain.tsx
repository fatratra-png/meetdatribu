"use client";

import { useRef } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { clamp, easeInOut, easeOut, makeDraw, makeGrow, seg, useScene } from "@/lib/scene";

const OVAL = "M50,6 C88,4 98,22 97,50 C96,82 76,96 49,95 C16,94 3,76 4,48 C5,18 20,7 50,6 Z";
const STEPS = ["s1", "s2", "s3", "s4"] as const;
const SLATS = 7;

/**
 * « Se repérer » — le processus du skill Site Immersif (scène « nuit ») :
 * 1. les mots de l'intro se posent, une photo du campus naît entre eux et
 *    zoome jusqu'au plein écran (le zoom ne s'inverse JAMAIS) ;
 * 2. un rideau de 7 lames couvre de gauche à droite, puis se retire de
 *    droite à gauche : derrière, une scène 100 % typographique ;
 * 3. une étape par moment clé, le numéro géant défile comme un odomètre ;
 *    relais asymétrique : jamais deux étapes lisibles ensemble ;
 * 4. le CTA conclut, entouré d'un ovale dessiné.
 */
export default function BladeCurtain() {
  const t = useTranslations("reperes");
  const ref = useRef<HTMLElement>(null);

  useScene(ref, () => {
    const root = ref.current!;
    const grow = makeGrow(root.querySelector<HTMLElement>(".grow")!);
    const line = root.querySelector<HTMLElement>(".night-line")!;
    const words = [...root.querySelectorAll<HTMLElement>(".nw")];
    const slats = [...root.querySelectorAll<HTMLElement>(".wipe span")];
    const bigNum = root.querySelector<HTMLElement>(".bignum")!;
    const roll = root.querySelector<HTMLElement>(".bignum-roll > span")!;
    const steps = [...root.querySelectorAll<HTMLElement>(".pstep")];
    const cta = root.querySelector<HTMLElement>(".steps-cta")!;
    const oval = makeDraw(root.querySelector<SVGPathElement>(".cta-oval path")!);
    return {
      measure() {
        grow.measure();
        oval.calc();
      },
      update(p) {
        // intro : les mots se posent, l'image naît entre eux
        words.forEach((w, i) => {
          const k = seg(p, 0.01 + i * 0.024, 0.06 + i * 0.024, easeOut);
          w.style.opacity = k.toFixed(3);
          w.style.transform = `translateY(${((1 - k) * 16).toFixed(1)}px)`;
        });
        // plein écran PUIS on continue d'avancer : la caméra ne recule jamais
        const g = seg(p, 0.08, 0.3, easeInOut);
        grow.set(g, 1 + seg(p, 0.3, 0.52, easeOut) * 0.18);

        // lames : couvrent de gauche à droite, se retirent de droite à gauche.
        // Les fenêtres cover/clear d'une même lame ne se chevauchent jamais.
        slats.forEach((sl, i) => {
          const j = slats.length - 1 - i;
          const cover = seg(p, 0.3 + i * 0.005, 0.36 + i * 0.005, easeInOut);
          const clear = seg(p, 0.42 + j * 0.005, 0.48 + j * 0.005, easeInOut);
          sl.style.transformOrigin = clear > 0 ? "top" : "bottom";
          sl.style.transform = `scaleY(${(cover - clear).toFixed(4)})`;
        });
        line.style.opacity = p > 0.41 ? "0" : "1";

        // odomètre + étapes (montent dès que le rideau couvre)
        const cont = seg(p, 0.5, 0.88) * Math.max(steps.length - 1, 1);
        const gate = seg(p, 0.335, 0.44);
        bigNum.style.opacity = gate.toFixed(3);
        roll.style.transform = `translateY(${(-cont).toFixed(4)}em)`;
        steps.forEach((el, i) => {
          const d = cont - i;
          // relais asymétrique : l'étape en cours s'efface vite, la suivante entre tôt
          const vis = d >= 0 ? clamp(1 - d / 0.35, 0, 1) : clamp((d + 0.75) / 0.4, 0, 1);
          el.style.opacity = (vis * gate).toFixed(3);
          el.style.transform = `translateY(calc(-50% + ${(-d * 96).toFixed(1)}px))`;
          el.style.visibility = vis * gate > 0.01 ? "visible" : "hidden";
        });
        // CTA final, ovale dessiné à la main
        const e = seg(p, 0.89, 0.94, easeOut);
        cta.style.opacity = String(e);
        cta.style.transform = `translate(-50%, ${((1 - e) * 26).toFixed(1)}px)`;
        cta.style.visibility = e > 0.01 ? "visible" : "hidden";
        oval.set(1 - seg(p, 0.92, 0.99));
      },
    };
  });

  return (
    <section ref={ref} id="reperes" className="scene s-night" style={{ "--pin": 9 } as React.CSSProperties} aria-labelledby="reperes-title">
      <div className="pin">
        <h2 className="night-line" id="reperes-title">
          <span className="hl nw">{t("w1")}</span>
          <span className="hl nw">{t("w2")}</span>
          <span className="grow">
            <Image src="/hei/scenes/zoom-campus.webp" alt={t("imageAlt")} width={1082} height={721} sizes="100vw" />
          </span>
          <span className="hl nw">{t("w3")}</span>
        </h2>

        {/* compteur monumental : le numéro d'étape défile comme un odomètre */}
        <div className="bignum" aria-hidden="true">
          <span className="bignum-fixed">0</span>
          <span className="bignum-roll">
            <span>
              {STEPS.map((_, i) => (
                <i key={i}>{i + 1}</i>
              ))}
            </span>
          </span>
        </div>

        <ol className="psteps">
          {STEPS.map((k) => (
            <li key={k} className="pstep">
              <span className="pstep-meta mono">{t(`${k}.meta`)}</span>
              <h3>{t(`${k}.title`)}</h3>
              <p>{t(`${k}.desc`)}</p>
            </li>
          ))}
        </ol>

        <p className="steps-cta">
          <Link href="/astuces">
            {t("cta")}
            <svg className="cta-oval" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <path d={OVAL} />
            </svg>
          </Link>
        </p>

        <div className="wipe" aria-hidden="true">
          {Array.from({ length: SLATS }, (_, i) => (
            <span key={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
