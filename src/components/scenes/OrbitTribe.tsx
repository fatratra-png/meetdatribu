"use client";

import { Fragment, useEffect, useRef } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { easeInOut, easeOut, mix, seg, useScene } from "@/lib/scene";

/** 14 photos HEI sur l'anneau : [fichier, largeur, hauteur]. */
const CARDS: [string, number, number][] = [
  ["cloud-01", 2, 3], ["cloud-02", 3, 2], ["cloud-03", 3, 2], ["cloud-04", 2, 3], ["cloud-05", 3, 2],
  ["cloud-06", 2, 3], ["cloud-07", 3, 2], ["cloud-08", 2, 3], ["cloud-09", 3, 2], ["cloud-10", 3, 2],
  ["trail-01", 3, 4], ["trail-02", 4, 3], ["trail-05", 3, 4], ["trail-07", 3, 4],
];

/**
 * « La Tribu » : un anneau de photos HEI en orbite autour du titre, vu en
 * perspective. Au scroll, l'anneau tourne, se couche, puis s'élargit au-delà
 * de l'écran ; une photo s'ouvre alors du centre jusqu'au plein écran, et
 * une phrase monte mot à mot. Le défilement pilote tout ; une lente rotation
 * continue garde l'anneau vivant quand on ne bouge pas.
 */
export default function OrbitTribe() {
  const t = useTranslations("orbit");
  const ref = useRef<HTMLElement>(null);
  const say = t("say").split(" ");
  const state = useRef({ p: 0, spin: 0, render: (() => {}) as (p: number) => void });

  // rotation continue (seulement quand la scène est à l'écran)
  useEffect(() => {
    const root = ref.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let last = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = last ? Math.min(now - last, 50) : 16;
      last = now;
      state.current.spin += dt * 0.006; // ≈ 6°/s
      state.current.render(state.current.p);
    };
    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf);
      last = 0;
      if (e.isIntersecting) raf = requestAnimationFrame(loop);
    });
    io.observe(root);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  useScene(ref, () => {
    const root = ref.current!;
    const pin = root.querySelector<HTMLElement>(".pin")!;
    const ring = root.querySelector<HTMLElement>(".orbit-ring")!;
    const lines = root.querySelector<SVGSVGElement>(".orbit-lines")!;
    const cards = [...root.querySelectorAll<HTMLElement>(".orbit-card")];
    const copy = root.querySelector<HTMLElement>(".orbit-copy")!;
    const zoom = root.querySelector<HTMLElement>(".orbit-zoom")!;
    const zoomImg = zoom.querySelector("img")!;
    const words = [...root.querySelectorAll<HTMLElement>(".orbit-say span")];
    let R = 300;

    const render = (p: number) => {
      // l'anneau se couche (68° → 12°) et s'élargit au-delà de l'écran
      const lay = seg(p, 0.12, 0.55, easeInOut);
      const tilt = mix(68, 12, lay);
      const radius = R * mix(1, 2.6, seg(p, 0.2, 0.62, (x) => x * x));
      const spin = state.current.spin + p * 200;
      ring.style.transform = `rotateX(${tilt}deg)`;
      // les cercles du SVG sont dessinés pour un rayon de 300
      lines.style.transform = `translate(-50%, -50%) scale(${(radius / 300).toFixed(3)})`;
      cards.forEach((c, i) => {
        const a = ((i / cards.length) * 360 + spin) * (Math.PI / 180);
        const x = Math.cos(a) * radius;
        const y = Math.sin(a) * radius;
        // les cartes restent face à nous (« billboard ») malgré l'inclinaison
        c.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotateX(${-tilt}deg) rotateZ(${(Math.sin(a) * 6).toFixed(2)}deg)`;
        c.style.opacity = String(1 - seg(p, 0.5, 0.62));
      });
      // le titre s'efface, la photo s'ouvre du centre au plein écran
      // le titre part AVANT que l'anneau ne le traverse
      const out = seg(p, 0.08, 0.2, easeOut);
      copy.style.opacity = String(1 - out);
      copy.style.transform = `translateY(${(-out * 40).toFixed(1)}px) scale(${(1 - out * 0.06).toFixed(3)})`;
      const g = seg(p, 0.42, 0.72, easeInOut);
      const ix = (1 - g) * 40;
      const iy = (1 - g) * 34;
      zoom.style.clipPath = `inset(${iy.toFixed(2)}% ${ix.toFixed(2)}% ${iy.toFixed(2)}% ${ix.toFixed(2)}% round ${((1 - g) * 14).toFixed(1)}px)`;
      // la photo n'apparaît qu'une fois le titre parti
      zoom.style.opacity = seg(p, 0.34, 0.42).toFixed(3);
      zoomImg.style.transform = `scale(${(1.25 - g * 0.25 + seg(p, 0.72, 1) * 0.06).toFixed(3)})`;
      const fade = seg(p, 0.93, 1);
      words.forEach((w, i) => {
        const k = seg(p, 0.7 + i * 0.018, 0.8 + i * 0.018, easeOut);
        w.style.opacity = (k * (1 - fade)).toFixed(3);
        w.style.transform = `translateY(${((1 - k) * 0.5).toFixed(3)}em)`;
      });
    };
    state.current.render = render;

    return {
      measure() {
        // rayon : l'anneau entoure le titre, un peu plus large que l'écran en portrait
        // portrait : l'anneau déborde des côtés, pour rester sous le titre
        const portrait = pin.clientWidth / pin.clientHeight < 0.8;
        R = portrait ? pin.clientWidth * 0.58 : Math.min(pin.clientWidth * 0.42, pin.clientHeight * 0.55);
      },
      update(p) {
        state.current.p = p;
        render(p);
      },
    };
  });

  return (
    <section
      ref={ref}
      id="tribu"
      data-chapter="tribe"
      className="scene s-orbit"
      style={{ "--pin": 5 } as React.CSSProperties}
      aria-labelledby="orbit-title"
    >
      <div className="pin">
        <div className="orbit-stage" aria-hidden="true">
          <div className="orbit-ring">
            <svg className="orbit-lines" width="1000" height="1000" viewBox="-500 -500 1000 1000">
              {[0.45, 0.62, 0.8, 1].map((k) => (
                <circle key={k} r={300 * k} />
              ))}
            </svg>
            {CARDS.map(([f, w, h], i) => (
              <figure key={f} className="orbit-card" style={{ "--cw": `clamp(${w > h ? 58 : 44}px, ${w > h ? 9.5 : 6.6}vw, ${w > h ? 160 : 112}px)` } as React.CSSProperties} data-i={i}>
                <Image src={`/hei/scenes/${f}.webp`} alt="" width={w * 100} height={h * 100} sizes="160px" />
              </figure>
            ))}
          </div>
        </div>

        <div className="orbit-copy">
          <p className="label mono">{t("kicker")}</p>
          <h2 id="orbit-title" style={{ marginTop: 18 }}>
            {t("titleA")} <span className="it">{t("titleIt")}</span>
          </h2>
          <p>{t("lead")}</p>
        </div>

        <div className="orbit-zoom">
          <Image src="/hei/scenes/zoom-tribu.webp" alt={t("imageAlt")} fill sizes="100vw" />
          <p className="orbit-say">
            {say.map((w, i) => (
              <Fragment key={i}>
                {i > 0 && " "}
                <span>{w}</span>
              </Fragment>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}
