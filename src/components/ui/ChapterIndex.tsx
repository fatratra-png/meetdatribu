"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { getLenis } from "@/lib/lenis";

type Chapter = { key: string; el: HTMLElement };
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/_";

/**
 * Index des chapitres, collé à droite (desktop, ≥ 1100 px).
 * Il lit les sections marquées `data-chapter` sur la page ; le chapitre
 * courant grossit et son libellé se « brouille » puis se recompose.
 * Un clic fait défiler jusqu'au chapitre.
 */
export default function ChapterIndex() {
  const t = useTranslations("chapters");
  const pathname = usePathname();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [active, setActive] = useState(0);
  const btns = useRef<(HTMLButtonElement | null)[]>([]);
  const bar = useRef<HTMLElement>(null);

  // relève les chapitres de la page courante
  useEffect(() => {
    const found = [...document.querySelectorAll<HTMLElement>("[data-chapter]")].map((el) => ({
      key: el.dataset.chapter!,
      el,
    }));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture du DOM après rendu
    setChapters(found);
  }, [pathname]);

  // chapitre courant = celui qui couvre le milieu de l'écran
  useEffect(() => {
    if (!chapters.length) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const mid = window.innerHeight / 2;
        let idx = 0;
        chapters.forEach((c, i) => {
          if (c.el.getBoundingClientRect().top <= mid) idx = i;
        });
        setActive(idx);
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [chapters]);

  // effet « brouillé » sur le libellé qui devient actif
  useEffect(() => {
    const b = btns.current[active];
    const c = chapters[active];
    if (!b || !c || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const final = t(c.key);
    let frame = 0;
    const id = window.setInterval(() => {
      frame++;
      const settled = Math.floor(frame / 2);
      b.textContent = [...final]
        .map((ch, i) => (i < settled || ch === " " ? ch : GLYPHS[(i * 7 + frame * 13) % GLYPHS.length]))
        .join("");
      if (settled >= final.length) {
        window.clearInterval(id);
        b.textContent = final;
      }
    }, 28);
    return () => {
      window.clearInterval(id);
      b.textContent = final;
    };
  }, [active, chapters, t]);

  if (!chapters.length) return null;
  return (
    <nav className="chapters" aria-label={t("label")}>
      <ol>
        {chapters.map((c, i) => (
          <li key={c.key}>
            <button
              type="button"
              ref={(el) => { btns.current[i] = el; }}
              aria-current={i === active ? "true" : undefined}
              onClick={() => {
                const lenis = getLenis();
                if (lenis) lenis.scrollTo(c.el, { duration: 1.4 });
                else c.el.scrollIntoView({ behavior: "smooth" });
              }}
            >
              {t(c.key)}
            </button>
          </li>
        ))}
      </ol>
      <span className="chapters-progress" aria-hidden="true">
        <i ref={bar} />
      </span>
    </nav>
  );
}
