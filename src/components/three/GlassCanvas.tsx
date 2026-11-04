"use client";

import { useEffect, useRef } from "react";
import { GlassEngine } from "./glass/GlassEngine";
import { useScrollStore } from "@/lib/scrollStore";

type Props = {
  /** Appelé à chaque image avec le scroll lissé du verre (0..1). */
  onFrame?: (scroll: number) => void;
  /** Appelé si WebGL est indisponible ou si le moteur échoue : on bascule sur l'image. */
  onFail?: () => void;
};

declare global {
  interface Window {
    /** Crochets de contrôle qualité, comme dans le skill (window.__glassSite). */
    __glassSite?: { snap: (v: number) => void; readonly scroll: number; readonly pieces: unknown };
  }
}

/**
 * Le canvas WebGL du verre. Chargé uniquement côté navigateur
 * (dynamic(..., { ssr: false }) dans GlassStage).
 * - lit la progression du verre dans le store (écrite par ScrollTrigger) ;
 * - se met en pause quand il sort de l'écran (IntersectionObserver) ;
 * - suit la taille de son conteneur (ResizeObserver).
 */
export default function GlassCanvas({ onFrame, onFail }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const onFrameRef = useRef(onFrame);
  const onFailRef = useRef(onFail);
  useEffect(() => {
    onFrameRef.current = onFrame;
    onFailRef.current = onFail;
  });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let engine: GlassEngine | null = null;
    let disposed = false;
    const observers: { disconnect: () => void }[] = [];

    (async () => {
      try {
        const svg = await (await fetch("/glass/hei-mark.svg")).text();
        if (disposed) return;
        engine = new GlassEngine(canvas, svg, {
          getTarget: () => useScrollStore.getState().glass,
          onFrame: (s) => onFrameRef.current?.(s),
        });
        const e = engine;

        // pause hors écran : aucune image calculée pour rien
        const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? e.start() : e.stop()));
        io.observe(canvas);
        const ro = new ResizeObserver(() => e.resize());
        ro.observe(canvas.parentElement ?? canvas);
        observers.push(io, ro);

        window.__glassSite = {
          snap: (v: number) => e.snap(v),
          get scroll() {
            return e.scroll;
          },
          get pieces() {
            return e.fragmentNames;
          },
        };
        canvas.dataset.ready = "true";
      } catch {
        // WebGL indisponible ou contexte refusé : image de secours, sans bruit en console
        onFailRef.current?.();
      }
    })();

    return () => {
      disposed = true;
      observers.forEach((o) => o.disconnect());
      engine?.dispose();
      delete window.__glassSite;
    };
  }, []);

  return <canvas ref={ref} className="glass-canvas" aria-hidden="true" />;
}
