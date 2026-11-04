"use client";

import { Fragment, useEffect, useRef } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { easeInOut, easeOut, makeGrow, mix, seg, useScene } from "@/lib/scene";

/**
 * Positions du nuage, reprises À L'IDENTIQUE de l'index.html du skill
 * (--x, --y, --w, profondeur data-d). Seuls les visuels changent.
 * Ratios : portrait 2:3 ou paysage 3:2 (voir tools/crop_scenes.py).
 */
const FLOATERS = [
  { x: "-4%", y: "13%", w: 196, d: 0.55, src: "/hei/scenes/cloud-01.webp", r: [2, 3] },
  { x: "21%", y: "3%", w: 142, d: 0.9, src: "/hei/scenes/cloud-02.webp", r: [3, 2] },
  { x: "40%", y: "-8%", w: 232, d: 0.4, src: "/hei/scenes/cloud-03.webp", r: [3, 2] },
  { x: "63%", y: "7%", w: 126, d: 0.75, src: "/hei/scenes/cloud-04.webp", r: [2, 3] },
  { x: "85%", y: "1%", w: 208, d: 1.0, src: "/hei/scenes/cloud-05.webp", r: [3, 2] },
  { x: "-2%", y: "45%", w: 116, d: 0.5, src: "/hei/scenes/cloud-06.webp", r: [2, 3] },
  { x: "94%", y: "37%", w: 172, d: 0.7, src: "/hei/scenes/cloud-07.webp", r: [3, 2] },
  { x: "13%", y: "71%", w: 248, d: 0.35, src: "/hei/scenes/cloud-08.webp", r: [2, 3] },
  { x: "44%", y: "81%", w: 134, d: 0.85, src: "/hei/scenes/cloud-09.webp", r: [3, 2] },
  { x: "73%", y: "64%", w: 188, d: 0.6, src: "/hei/scenes/cloud-10.webp", r: [3, 2] },
] as const;

/**
 * Scène « nuage » (skill Site Immersif, scène 1) : on TRAVERSE un nuage de
 * photos HEI. Elles naissent petites et resserrées au centre, s'ouvrent vers
 * leur place, puis dérivent vers les bords. La ligne 1 s'efface, la ligne 2
 * monte seule au centre, puis une image naît entre ses mots et remplit
 * l'écran ; le positionnement apparaît mot à mot.
 */
export default function HeroCloud() {
  const t = useTranslations("cloud");
  const ref = useRef<HTMLElement>(null);

  // révélation du nuage quand la scène approche (le skill : au boot)
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        root.classList.add("is-shown");
        io.disconnect();
      }
    }, { rootMargin: "0px 0px 20% 0px" });
    io.observe(root);
    return () => io.disconnect();
  }, []);

  useScene(ref, () => {
    const root = ref.current!;
    const pin = root.querySelector<HTMLElement>(".pin")!;
    const floaters = [...root.querySelectorAll<HTMLElement>(".fl")];
    const grow = makeGrow(root.querySelector<HTMLElement>(".grow")!);
    const growImg = root.querySelector<HTMLImageElement>(".grow img")!;
    const line1 = root.querySelector<HTMLElement>(".hero-line1")!;
    const kicker = root.querySelector<HTMLElement>(".hero-kicker")!;
    const words = [...root.querySelectorAll<HTMLElement>(".spot-intro span")];
    let dirs: { x: number; y: number; d: number; ex: number; ey: number }[] = [];
    let vh = pin.clientHeight;

    // souris : parallaxe douce du nuage (lerp 0.06 comme le skill)
    let mx = 0, my = 0, mxT = 0, myT = 0, lastP = 0, raf = 0;
    const onMove = (e: MouseEvent) => {
      mxT = (e.clientX / innerWidth - 0.5) * 2;
      myT = (e.clientY / innerHeight - 0.5) * 2;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const tick = () => {
      raf = 0;
      mx += (mxT - mx) * 0.06;
      my += (myT - my) * 0.06;
      placeFloaters(lastP);
      if (Math.abs(mxT - mx) > 0.001 || Math.abs(myT - my) > 0.001) raf = requestAnimationFrame(tick);
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    const placeFloaters = (p: number) => {
      const enter = seg(p, 0, 0.17, easeOut);
      // dérive sur toute la première moitié (fenêtre du skill), départ en douceur
      const drift = seg(p, 0.06, 0.46, (t) => t * t);
      const flScale = mix(0.74, 1, enter) * mix(1, 1.22, drift);
      floaters.forEach((f, i) => {
        const dir = dirs[i] || { x: 0, y: -1, d: 0.5, ex: 0, ey: 0 };
        const pull = (1 - enter) * 0.16;
        // skill : dérive linéaire et vh * 1.15. Ici dérive en t² et vh * 0.4 :
        // sinon plus aucune photo n'est à l'écran quand l'image naît entre les
        // mots (p = 0.26), or c'est le repère de fidélité de la checklist.
        const dist = drift * (0.8 + dir.d) * vh * 0.4;
        const tx = -dir.ex * pull + dir.x * dist + mx * dir.d * 40;
        const ty = -dir.ey * pull + dir.y * dist + my * dir.d * 26;
        f.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) rotate(${(drift * dir.d * (i % 2 ? 8 : -8)).toFixed(2)}deg) scale(${flScale.toFixed(3)})`;
      });
    };

    return {
      measure() {
        vh = pin.clientHeight;
        const vw = pin.clientWidth;
        const pr = pin.getBoundingClientRect();
        dirs = floaters.map((f) => {
          const prev = f.style.transform;
          f.style.transform = "none"; // position de repos, sans le transform précédent
          const r = f.getBoundingClientRect();
          f.style.transform = prev;
          const ex = r.left - pr.left + r.width / 2 - vw / 2;
          const ey = r.top - pr.top + r.height / 2 - vh / 2;
          const n = Math.max(1, Math.hypot(ex, ey));
          return { x: ex / n, y: (ey / n) * 1.5, d: Number(f.dataset.d), ex, ey };
        });
        grow.measure();
      },
      update(p) {
        lastP = p;
        placeFloaters(p);
        // le kicker et la ligne 1 s'estompent sur place…
        kicker.style.opacity = String(1 - seg(p, 0.01, 0.1));
        line1.style.opacity = String(1 - seg(p, 0.03, 0.15));
        // …puis la ligne 2 monte occuper le centre, SEULE, avant tout zoom
        const lift = seg(p, 0.05, 0.22, easeInOut);
        // l'image naît entre les mots puis remplit l'écran
        const g = seg(p, 0.26, 0.58, easeInOut);
        grow.set(g, 1 + seg(p, 0.58, 1) * 0.06, Math.max(lift, g));
        // skill : -16 %. Les photos HEI (foules, plein jour) sont plus chargées
        // que les visuels du template : -42 % pour que le texte blanc se lise.
        growImg.style.filter = `brightness(${(1 - seg(p, 0.58, 0.7) * 0.42).toFixed(3)})`;
        // positionnement mot à mot, puis il s'efface avant la sortie
        const fadeOut = seg(p, 0.82, 0.92);
        words.forEach((w, i) => {
          const k = seg(p, 0.5 + i * 0.022, 0.6 + i * 0.022, easeOut);
          w.style.opacity = (k * (1 - fadeOut)).toFixed(3);
          w.style.transform = `translateY(${((1 - k) * 14).toFixed(1)}px)`;
        });
      },
    };
  });

  const positioning = t("positioning").split(" ");

  return (
    <section ref={ref} className="scene s-hero" style={{ "--pin": 5 } as React.CSSProperties} aria-labelledby="cloud-title">
      <div className="pin">
        <div className="floaters" aria-hidden="true">
          {FLOATERS.map((f, i) => (
            <figure
              key={f.src}
              className="fl"
              data-d={f.d}
              style={{ "--x": f.x, "--y": f.y, "--w": `${f.w}px`, "--fi": i } as React.CSSProperties}
            >
              <Image src={f.src} alt="" width={f.r[0] * 100} height={f.r[1] * 100} sizes="260px" />
            </figure>
          ))}
        </div>

        <div className="hero-copy">
          <p className="hero-kicker mono">{t("kicker")}</p>
          <h2 className="hero-title" id="cloud-title">
            <span className="hero-line1">{t("line1")}</span>
            <span className="hero-line2">
              <span className="hl">{t("line2a")}</span>
              <span className="grow">
                <Image src="/hei/scenes/zoom-tribu.webp" alt={t("imageAlt")} width={1600} height={1067} sizes="100vw" />
              </span>
              <span className="hl">{t("line2b")}</span>
            </span>
          </h2>
        </div>

        <div className="spot">
          {/* en mode statique : l'image en plein écran derrière le positionnement */}
          <div className="spot-bg" aria-hidden="true">
            <Image src="/hei/scenes/zoom-tribu.webp" alt="" fill sizes="100vw" style={{ objectFit: "cover" }} />
          </div>
          <p className="spot-intro">
            {positioning.map((w, i) => (
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
