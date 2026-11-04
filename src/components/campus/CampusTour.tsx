"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, MapPin, RotateCcw, Search, X } from "lucide-react";
import { FLOORS, FOOTPRINT, ROOMS, SLABS, floorOf, roomById, roomsOn, type FloorId, type Room } from "@/content/campus";
import { EXPLORE_AT, INTRO_STEPS } from "@/components/three/campus/constants";
import { useScene } from "@/lib/scene";
import type { CampusEngine, HotspotPoint } from "@/components/three/campus/CampusEngine";
import "./campus.css";

type Lang = "fr" | "en";
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** WebGL 2 disponible ? (sinon : vue statique + liste) */
function hasWebGL() {
  try {
    return !!document.createElement("canvas").getContext("webgl2");
  } catch {
    return false;
  }
}

/**
 * Visite 3D du campus HEI.
 * Intro au scroll (vue du ciel → demi-tour → entrée → étages qui s'écartent),
 * puis visite libre : points cliquables, vol de caméra, fiche animée,
 * mini-plan, recherche, étages. Sur mobile : rotation automatique + boutons,
 * fiche en bas d'écran. Sans WebGL ou en mouvement réduit : vue statique et
 * liste au clavier. Le moteur 3D n'est chargé qu'à l'approche de la section.
 */
export default function CampusTour() {
  const t = useTranslations("campus");
  const lang = useLocale() as Lang;
  const ref = useRef<HTMLElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<CampusEngine | null>(null);
  const spotRefs = useRef(new Map<string, HTMLButtonElement>());
  /** dernière progression du scroll, transmise au moteur s'il arrive après */
  const progressRef = useRef(0);

  const [mode, setMode] = useState<"pending" | "3d" | "static">("pending");
  const [explore, setExplore] = useState(false);
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [floor, setFloor] = useState<FloorId | null>(null);
  const [query, setQuery] = useState("");
  const [mobile, setMobile] = useState(false);
  const active = mode === "static" || explore;

  // mode décidé au chargement (comme le verre)
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- décision unique, après montage
    setMode(reduced || !hasWebGL() ? "static" : "3d");
    setMobile(window.matchMedia("(max-width: 767px)").matches);
  }, []);

  // positions des points cliquables : écrites directement dans le DOM, sans re-rendu
  const onFrame = useCallback((pts: HotspotPoint[]) => {
    for (const p of pts) {
      const el = spotRefs.current.get(p.id);
      if (!el) continue;
      el.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px)`;
      el.dataset.visible = String(p.visible);
      el.tabIndex = p.visible ? 0 : -1;
    }
  }, []);

  // chargement différé du moteur, à un écran de la section
  useEffect(() => {
    const root = ref.current;
    const host = hostRef.current;
    if (mode !== "3d" || !root || !host) return;
    let engine: CampusEngine | null = null;
    let disposed = false;
    const cleanups: (() => void)[] = [];

    const load = new IntersectionObserver(async ([e]) => {
      if (!e.isIntersecting || engine) return;
      load.disconnect();
      try {
        const { CampusEngine } = await import("@/components/three/campus/CampusEngine");
        if (disposed) return;
        engine = new CampusEngine(host, {
          onFrame,
          onPick: (id) => {
            setSelected(id);
            setFloor(roomById(id)!.floor);
            engine?.select(id);
          },
        });
        engineRef.current = engine;
        const e2 = engine;
        // le moteur peut finir de charger alors qu'on est déjà dans la section
        e2.setProgress(progressRef.current);
        // crochet de contrôle qualité (comme window.__glassSite pour le verre)
        (window as unknown as { __campus?: CampusEngine }).__campus = e2;
        e2.setAutoRotate(window.matchMedia("(max-width: 767px)").matches);
        // couleur de fond = celle du thème courant
        const syncBg = () => e2.setBackground(getComputedStyle(document.documentElement).getPropertyValue("--bg").trim() || "#000a1f");
        syncBg();
        const mo = new MutationObserver(syncBg);
        mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
        // rendu seulement quand la section est à l'écran
        const vis = new IntersectionObserver(([v]) => (v.isIntersecting ? e2.start() : e2.stop()));
        vis.observe(host);
        const ro = new ResizeObserver(() => e2.resize());
        ro.observe(host);
        cleanups.push(() => mo.disconnect(), () => vis.disconnect(), () => ro.disconnect());
      } catch {
        setMode("static");
      }
    }, { rootMargin: "100% 0px" });
    load.observe(root);

    return () => {
      disposed = true;
      load.disconnect();
      cleanups.forEach((c) => c());
      engine?.dispose();
      engineRef.current = null;
    };
  }, [mode, onFrame]);

  // scroll → intro (ScrollTrigger, via useScene)
  const exploreRef = useRef(false);
  useScene(ref, () => ({
    update(p) {
      progressRef.current = p;
      engineRef.current?.setProgress(p);
      const isExplore = p >= EXPLORE_AT;
      if (isExplore !== exploreRef.current) {
        exploreRef.current = isExplore;
        setExplore(isExplore);
        if (!isExplore) {
          // on remonte dans l'intro : la visite repart de zéro
          setSelected(null);
          setFloor(null);
          setQuery("");
        }
      }
      let s = 0;
      INTRO_STEPS.forEach((a, i) => {
        if (p >= a) s = i;
      });
      setStep(s);
    },
  }));

  // ── actions ──
  const choose = useCallback((id: string | null) => {
    setSelected(id);
    if (id) setFloor(roomById(id)!.floor);
    engineRef.current?.select(id);
  }, []);
  const pickFloor = (f: FloorId | null) => {
    setFloor(f);
    setSelected(null);
    engineRef.current?.setFloor(f);
  };
  const ordered = useMemo(() => FLOORS.flatMap((f) => roomsOn(f.id)), []);
  const step1 = (dir: 1 | -1) => {
    const i = ordered.findIndex((r) => r.id === selected);
    const next = ordered[(i + dir + ordered.length) % ordered.length];
    choose(next.id);
  };

  // Échap ferme la fiche
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && choose(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, choose]);

  const results = query.trim()
    ? ROOMS.filter((r) => norm(r.name[lang]).includes(norm(query.trim())) || norm(r.desc[lang]).includes(norm(query.trim()))).slice(0, 6)
    : [];
  const room = selected ? roomById(selected) : undefined;
  const planFloor: FloorId = floor ?? "rdc";

  const roomButton = (r: Room) => (
    <button type="button" className="campus-item" aria-pressed={selected === r.id} onClick={() => choose(r.id)}>
      <span>{r.name[lang]}</span>
      <span className="mono ash">{floorOf(r.floor).short[lang]}</span>
    </button>
  );

  return (
    <section
      ref={ref}
      id="campus"
      data-chapter="campus"
      className={`scene s-campus is-${mode}${active ? " is-explore" : ""}`}
      style={{ "--pin": 5 } as React.CSSProperties}
      aria-labelledby="campus-title"
    >
      <div className="pin">
        <div className="campus-host" ref={hostRef} aria-hidden="true" />
        {mode === "static" && (
          <div className="campus-still">
            <Image src="/campus/campus-overview.webp" alt={t("stillAlt")} width={1600} height={1000} sizes="(max-width: 900px) 100vw, 60vw" />
          </div>
        )}

        <header className="campus-head">
          <p className="label mono">{t("kicker")}</p>
          <h2 id="campus-title">
            {t("titleA")} <span className="it">{t("titleIt")}</span>
          </h2>
          {mode === "3d" && (
            <p className="campus-step mono" aria-live="polite">
              {t(`steps.${step}`)}
            </p>
          )}
        </header>

        {/* points cliquables sur les salles (positionnés par le moteur) */}
        {mode === "3d" && (
          <div className="campus-spots" inert={!explore}>
            {ROOMS.map((r) => (
              <button
                key={r.id}
                type="button"
                ref={(el) => {
                  if (el) spotRefs.current.set(r.id, el);
                  else spotRefs.current.delete(r.id);
                }}
                className="campus-spot"
                data-visible="false"
                tabIndex={-1}
                aria-pressed={selected === r.id}
                onPointerDown={() => engineRef.current?.poke()}
                onClick={() => choose(r.id)}
              >
                <span className="campus-dot" aria-hidden="true" />
                <span className="campus-spot-label">{r.name[lang]}</span>
              </button>
            ))}
          </div>
        )}

        {/* panneau : recherche, étages, mini-plan, liste */}
        <div className="campus-panel" inert={!active}>
          <div className="campus-search">
            <label htmlFor="campus-q" className="sr-only">
              {t("searchLabel")}
            </label>
            <Search size={16} strokeWidth={1.75} aria-hidden="true" />
            <input
              id="campus-q"
              type="search"
              placeholder={t("searchPlaceholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
          </div>
          {query.trim() && (
            <ul className="campus-results" aria-label={t("results", { n: results.length })}>
              {results.length ? results.map((r) => <li key={r.id}>{roomButton(r)}</li>) : <li className="ash">{t("noResult")}</li>}
            </ul>
          )}
          <p className="sr-only" aria-live="polite">
            {query.trim() ? t("results", { n: results.length }) : ""}
          </p>

          <div className="campus-floors" role="group" aria-label={t("floorsLabel")}>
            <button type="button" className="mono" aria-pressed={floor === null} onClick={() => pickFloor(null)}>
              {t("allFloors")}
            </button>
            {FLOORS.map((f) => (
              <button key={f.id} type="button" className="mono" aria-pressed={floor === f.id} onClick={() => pickFloor(f.id)}>
                {f.short[lang]}
              </button>
            ))}
          </div>

          {/* mini-plan de l'étage (repère visuel ; la liste ci-dessous est l'équivalent clavier) */}
          <figure className="campus-plan">
            <svg viewBox={`${FOOTPRINT.x - 1} -1 ${FOOTPRINT.w + 2} ${FOOTPRINT.d + 2}`} aria-hidden="true">
              {SLABS[planFloor].map(([x, z, w, d], i) => (
                <rect key={i} x={x} y={z} width={w} height={d} className="plan-wing" />
              ))}
              {roomsOn(planFloor).flatMap((r) =>
                (r.shape ?? [r.rect]).map(([x, z, w, d], i) => (
                  <rect
                    key={`${r.id}-${i}`}
                    x={x + 0.2}
                    y={z + 0.2}
                    width={w - 0.4}
                    height={d - 0.4}
                    rx={0.4}
                    className={`plan-room plan-${r.kind}${selected === r.id ? " is-on" : ""}`}
                    onClick={() => choose(r.id)}
                  />
                )),
              )}
            </svg>
            <figcaption className="mono ash">
              {t("planOf")} · {floorOf(planFloor).name[lang]}
            </figcaption>
          </figure>

          <details className="campus-list" open={mode === "static" || undefined}>
            <summary className="mono">{t("allRooms")}</summary>
            {/* data-lenis-prevent : la molette fait défiler la liste, pas la page */}
            <div className="campus-list-body" data-lenis-prevent>
            {FLOORS.map((f) => (
              <div key={f.id}>
                <p className="mono ash campus-list-floor">{f.name[lang]}</p>
                <ul>
                  {roomsOn(f.id).map((r) => (
                    <li key={r.id}>{roomButton(r)}</li>
                  ))}
                </ul>
              </div>
            ))}
            </div>
          </details>
        </div>

        {/* mobile : tourner et passer d'une salle à l'autre */}
        {mode === "3d" && mobile && (
          <div className="campus-mobile" inert={!explore}>
            <button type="button" onClick={() => engineRef.current?.rotateBy(-Math.PI / 4)} aria-label={t("rotateLeft")}>
              <RotateCcw size={18} strokeWidth={1.75} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => step1(-1)} aria-label={t("prev")}>
              <ChevronLeft size={18} strokeWidth={1.75} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => step1(1)} aria-label={t("next")}>
              <ChevronRight size={18} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        )}

        {/* fiche de la salle */}
        <AnimatePresence>
          {room && (
            <motion.aside
              key={room.id}
              className="campus-card"
              aria-labelledby="campus-card-title"
              initial={mobile ? { y: "100%" } : { x: 48, opacity: 0 }}
              animate={mobile ? { y: 0 } : { x: 0, opacity: 1 }}
              exit={mobile ? { y: "100%" } : { x: 48, opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
            >
              <p className="mono ash">
                <MapPin size={13} strokeWidth={1.75} aria-hidden="true" /> {floorOf(room.floor).name[lang]} · {t(`kinds.${room.kind}`)}
              </p>
              <h3 id="campus-card-title">{room.name[lang]}</h3>
              <p>{room.desc[lang]}</p>
              <div className="campus-card-nav">
                <button type="button" className="pill mono" onClick={() => step1(-1)}>
                  ← {t("prev")}
                </button>
                <button type="button" className="pill mono" onClick={() => step1(1)}>
                  {t("next")} →
                </button>
              </div>
              <button type="button" className="campus-close" onClick={() => choose(null)} aria-label={t("close")}>
                <X size={18} strokeWidth={1.75} aria-hidden="true" />
              </button>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
