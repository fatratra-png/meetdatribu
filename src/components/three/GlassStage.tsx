"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { GitBranch, Hammer, Layers, Target } from "lucide-react";
import { ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useScrollStore } from "@/lib/scrollStore";
import "./glass-stage.css";

// Le canvas 3D n'est jamais rendu côté serveur et se charge en différé.
const GlassCanvas = dynamic(() => import("./GlassCanvas"), { ssr: false });

/**
 * Fenêtres d'affichage des 4 chapitres (scroll lissé du verre), reprises du
 * skill : un texte reste au moins MIN_SHOW ms une fois montré, et persiste
 * LEAVE_HOLD ms après la sortie de sa fenêtre — jamais de texte qui « flashe ».
 */
const SLIDE_WINDOWS: [number, number][] = [
  [-0.1, 0.15],
  [0.26, 0.43],
  [0.54, 0.71],
  [0.82, 1.05],
];
const SLIDE_MIN_SHOW = 1500;
const SLIDE_LEAVE_HOLD = 400;

const PILLAR_ICONS = [Target, Layers, GitBranch, Hammer];
const PILLARS = ["mission", "domains", "tracks", "approach"] as const;

/** Vrai si le navigateur sait faire du WebGL 2 (sinon : image de secours). */
function hasWebGL() {
  try {
    return !!document.createElement("canvas").getContext("webgl2");
  } catch {
    return false;
  }
}

/**
 * La scène du verre : le symbole HEI assemblé (accueil), éclaté en 4
 * fragments (les 4 piliers de HEI), puis recomposé.
 * - 900vh de scroll (comme le skill), avec un écran épinglé (sticky).
 * - ScrollTrigger écrit la progression dans le store ; le moteur la lit.
 * - Mouvement réduit ou pas de WebGL : mise en page statique + image du verre.
 */
export default function GlassStage() {
  const t = useTranslations("glass");
  const stageRef = useRef<HTMLElement>(null);
  const slidesRef = useRef<(HTMLDivElement | null)[]>([]);
  // le chapitre 1 est actif dès le rendu serveur (lisible même avant le JS)
  const state = useRef(SLIDE_WINDOWS.map((_, i) => ({ active: i === 0, since: 0, left: 0 })));
  const [mode, setMode] = useState<"pending" | "3d" | "static">("pending");
  /** Le moteur 3D démarre à la première interaction : le premier affichage
   *  reste léger (pas de Three.js), l'image du verre sert d'affiche. */
  const [boot, setBoot] = useState(false);
  const [ready, setReady] = useState(false);

  // Le mode se décide AU CHARGEMENT, comme dans le skill (pas de bascule au redimensionnement).
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- décision unique, après montage
    setMode(reduced || !hasWebGL() ? "static" : "3d");
  }, []);

  // Un titre tient sur deux lignes, jamais trois : si sa plus longue ligne
  // déborde de sa colonne, on réduit la police (fitTitles du skill).
  useEffect(() => {
    const fit = () => {
      stageRef.current?.querySelectorAll<HTMLElement>(".glass-title").forEach((title) => {
        title.style.fontSize = "";
        const widest = Math.max(
          ...[...title.querySelectorAll(".line-inner")].map((line) => {
            const range = document.createRange();
            range.selectNodeContents(line);
            return range.getBoundingClientRect().width;
          }),
        );
        const available = title.clientWidth;
        if (widest > available && available > 0) {
          const size = parseFloat(getComputedStyle(title).fontSize);
          title.style.fontSize = `${Math.floor(((size * available) / widest) * 0.985)}px`;
        }
      });
    };
    fit();
    document.fonts?.ready.then(fit);
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [mode]);

  // première interaction (souris, toucher, molette, clavier, défilement) → 3D
  useEffect(() => {
    if (mode !== "3d" || boot) return;
    const events = ["pointermove", "pointerdown", "touchstart", "wheel", "keydown", "scroll"] as const;
    const go = () => setBoot(true);
    events.forEach((e) => window.addEventListener(e, go, { once: true, passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, go));
  }, [mode, boot]);

  // ScrollTrigger → store : progression 0..1 sur toute la hauteur de la scène.
  useGSAP(
    () => {
      if (mode !== "3d" || !stageRef.current) return;
      const st = ScrollTrigger.create({
        trigger: stageRef.current,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => useScrollStore.getState().setGlass(self.progress),
      });
      useScrollStore.getState().setGlass(st.progress);
    },
    { dependencies: [mode], scope: stageRef },
  );

  // Activation des chapitres, appelée à chaque image par le moteur.
  const onFrame = useCallback((scroll: number) => {
    const now = performance.now();
    const inside = SLIDE_WINDOWS.map(([a, b]) => scroll >= a && scroll <= b);
    const current = inside.indexOf(true);
    state.current.forEach((s, i) => {
      let active = false;
      if (current === i) {
        if (!s.active) s.since = now;
        s.left = 0;
        active = true;
      } else if (s.active && current === -1) {
        if (!s.left) s.left = now;
        active = now - s.since < SLIDE_MIN_SHOW || now - s.left < SLIDE_LEAVE_HOLD;
      }
      if (!active) s.left = 0;
      if (active !== s.active) slidesRef.current[i]?.classList.toggle("active", active);
      s.active = active;
    });
  }, []);

  const title = (n: number) => (
    <h2 className="glass-title">
      <span className="line">
        <span className="line-inner">{t(`s${n}.l1`)}</span>
      </span>
      <span className="line muted">
        <span className="line-inner">{t(`s${n}.l2`)}</span>
      </span>
    </h2>
  );

  return (
    <section
      ref={stageRef}
      className={`glass-stage stage-dark is-${mode}`}
      data-chapter="discover"
      aria-label={t("label")}
    >
      {/* ancre du lien « Découvrir HEI » : le début de l'éclatement */}
      <span id="decouvrir" className="glass-anchor" aria-hidden="true" />

      <div className="glass-sticky">
        {mode === "3d" && (
          <>
            {/* affiche : le verre rendu par le moteur, le temps que la 3D démarre */}
            <div className={`glass-poster${ready ? " is-hidden" : ""}`} aria-hidden="true">
              <Image src="/glass/hei-glass.webp" alt="" width={1100} height={1075} sizes="50vw" priority />
            </div>
            {boot && (
              <GlassCanvas onFrame={onFrame} onReady={() => setReady(true)} onFail={() => setMode("static")} />
            )}
          </>
        )}
        {mode === "static" && (
          <div className="glass-fallback">
            <Image
              src="/glass/hei-glass.webp"
              alt={t("fallbackAlt")}
              width={1100}
              height={1075}
              sizes="(max-width: 900px) 90vw, 50vw"
              priority
            />
          </div>
        )}

        <div className="glass-slides">
          {/* 1 — accueil : le symbole HEI assemblé */}
          <div className="glass-slide active" id="slide-1" ref={(el) => { slidesRef.current[0] = el; }}>
            <p className="mono glass-kicker">{t("s1.kicker")}</p>
            {title(1)}
            <p className="glass-desc">{t("s1.lead")}</p>
          </div>

          {/* 2 — éclatement : un fragment = un pilier */}
          <div className="glass-slide" id="slide-2" ref={(el) => { slidesRef.current[1] = el; }}>
            {title(2)}
            <ul className="glass-pillars">
              {PILLARS.map((key, i) => {
                const Icon = PILLAR_ICONS[i];
                return (
                  <li key={key} className="glass-pillar">
                    <span className="glass-pillar-icon" aria-hidden="true">
                      <Icon size={16} strokeWidth={1.5} />
                    </span>
                    <p>
                      <strong>{t(`s2.${key}.title`)}</strong>{" "}
                      <span className="glass-pillar-text">{t(`s2.${key}.text`)}</span>
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* 3 — recomposition */}
          <div className="glass-slide" id="slide-3" ref={(el) => { slidesRef.current[2] = el; }}>
            {title(3)}
            <p className="glass-desc">{t("s3.desc")}</p>
          </div>

          {/* 4 — la forme entière, identique au départ */}
          <div className="glass-slide" id="slide-4" ref={(el) => { slidesRef.current[3] = el; }}>
            {title(4)}
            <p className="glass-desc">{t("s4.desc")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
