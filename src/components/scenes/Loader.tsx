"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import "./scenes.css";

/**
 * Préchargeur : les deux crochets du logo HEI se dessinent pendant qu'un
 * compteur va de 00 à 100, puis ils s'écartent vers les coins de l'écran et
 * le voile se retire vers le haut. Le header entre à ce moment-là.
 */
export default function Loader({ name }: { name: string }) {
  const root = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const el = root.current;
    const done = () => {
      document.body.classList.add("is-ready");
      setGone(true);
    };
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      done();
      return;
    }
    const paths = el.querySelectorAll<SVGPathElement>("path");
    const frame = el.querySelector(".loader-frame");
    const count = el.querySelector(".loader-count");
    const counter = { v: 0 };
    paths.forEach((p) => {
      const L = p.getTotalLength();
      gsap.set(p, { strokeDasharray: L, strokeDashoffset: L });
    });
    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.to(paths, { strokeDashoffset: 0, duration: 0.9, stagger: 0.12, ease: "power3.inOut" })
      .to(counter, {
        v: 100, duration: 1.1, ease: "power2.inOut",
        onUpdate: () => { if (count) count.textContent = String(Math.round(counter.v)).padStart(2, "0"); },
      }, 0)
      // les crochets s'écartent : ils « cadrent » l'écran, comme sur le logo
      .to(frame, { scale: 3.2, opacity: 0, duration: 0.9, ease: "expo.in" }, 1.05)
      .to(el, { clipPath: "inset(0 0 100% 0)", duration: 0.9, ease: "expo.inOut" }, 1.55)
      .add(() => document.body.classList.add("is-ready"), 1.7)
      .add(() => setGone(true));
    return () => {
      tl.kill();
    };
  }, []);

  if (gone) return null;
  return (
    <div className="loader" ref={root} aria-hidden="true" data-loader>
      <div className="loader-frame">
        <svg viewBox="0 0 100 100">
          <path d="M8 46V8h38" />
          <path d="M92 54v38H54" />
        </svg>
        <div className="loader-center">
          <div>
            <p className="loader-count">00</p>
            <p className="loader-name mono">{name}</p>
          </div>
        </div>
      </div>
      <noscript>
        <style>{`.loader{display:none}.topbar{transform:none!important}`}</style>
      </noscript>
    </div>
  );
}
