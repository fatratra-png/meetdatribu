"use client";

import { useRef } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { seg, useScene } from "@/lib/scene";

/** Les 4 repères, chacun avec sa photo HEI. */
const STEPS = [
  { key: "s1", img: "/hei/scenes/zoom-campus.webp", w: 1082, h: 721 },
  { key: "s2", img: "/hei/scenes/trail-09.webp", w: 420, h: 560 },
  { key: "s3", img: "/hei/scenes/trail-01.webp", w: 404, h: 538 },
  { key: "s4", img: "/hei/scenes/trail-04.webp", w: 420, h: 315 },
] as const;

/**
 * « Se repérer » : une frise horizontale épinglée. Le défilement vertical fait
 * glisser 4 panneaux de droite à gauche ; un rail se remplit, un point
 * s'allume par repère, et le grand repère (J-1, J1…) monte lettre à lettre
 * quand son panneau arrive.
 */
export default function Timeline() {
  const t = useTranslations("reperes");
  const ref = useRef<HTMLElement>(null);

  useScene(ref, () => {
    const root = ref.current!;
    const pin = root.querySelector<HTMLElement>(".pin")!;
    const track = root.querySelector<HTMLElement>(".tl-track")!;
    const fill = root.querySelector<HTMLElement>(".tl-rail i")!;
    const ticks = [...root.querySelectorAll<HTMLElement>(".tl-ticks b")];
    const panels = [...root.querySelectorAll<HTMLElement>(".tl-panel")];
    let span = 0;
    let current = -1;
    return {
      measure() {
        span = Math.max(0, track.scrollWidth - pin.clientWidth);
      },
      update(p) {
        const k = seg(p, 0.06, 0.94);
        track.style.transform = `translate3d(${(-k * span).toFixed(1)}px, 0, 0)`;
        fill.style.transform = `scaleX(${k.toFixed(4)})`;
        const idx = Math.min(panels.length - 1, Math.round(k * (panels.length - 1)));
        ticks.forEach((b, i) => b.classList.toggle("on", i <= idx));
        if (idx !== current) {
          current = idx;
          // le panneau courant et ceux déjà passés gardent leur repère affiché
          panels.forEach((pl, i) => pl.classList.toggle("is-on", i <= idx));
        }
      },
    };
  });

  return (
    <section
      ref={ref}
      id="reperes"
      data-chapter="find"
      className="scene s-timeline"
      style={{ "--pin": 5 } as React.CSSProperties}
      aria-labelledby="reperes-title"
    >
      <div className="pin">
        <div className="tl-head">
          <h2 id="reperes-title">
            {t("titleA")} <span className="it">{t("titleIt")}</span>
          </h2>
          <p className="label mono">{t("kicker")}</p>
        </div>
        <div className="tl-rail" aria-hidden="true">
          <i />
          <span className="tl-ticks">
            {STEPS.map((s) => (
              <b key={s.key} />
            ))}
          </span>
        </div>

        <ol className="tl-track">
          {STEPS.map((s, i) => (
            <li key={s.key} className={`tl-panel${i === 0 ? " is-on" : ""}`}>
              <div>
                <p className="tl-big" aria-hidden="true">
                  {[...t(`${s.key}.big`)].map((c, j) => (
                    <span key={j} style={{ "--i": j } as React.CSSProperties}>
                      {c}
                    </span>
                  ))}
                </p>
                <figure className="tl-photo">
                  <Image src={s.img} alt={t(`${s.key}.imageAlt`)} fill sizes="300px" />
                </figure>
              </div>
              <div className="tl-text">
                <p className="mono ash">{t(`${s.key}.meta`)}</p>
                <h3>{t(`${s.key}.title`)}</h3>
                <p>{t(`${s.key}.desc`)}</p>
                {i === STEPS.length - 1 && (
                  <Link href="/astuces" className="pill pill-solid mono">
                    {t("cta")}
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
