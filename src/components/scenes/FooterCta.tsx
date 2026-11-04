"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useReveal } from "@/lib/scene";
import { CREDIT_NAME, HEI, SOCIALS } from "@/content/hei";
import HeiMark from "@/components/ui/HeiMark";
import "./scenes.css";

/**
 * Footer : un grand appel (« Rejoins la Tribu. »), trois boutons, une grille
 * de liens en 4 colonnes, une ligne légale, puis le mot TRIBU géant, coupé
 * par le bas de l'écran : ses lettres sortent du flou à l'arrivée et un halo
 * doré glisse derrière au fil du défilement.
 */
export default function FooterCta() {
  const t = useTranslations("footer");
  const ref = useRef<HTMLElement>(null);
  const giant = useRef<HTMLParagraphElement>(null);
  useReveal(ref, ".reveal, .foot-giant");

  // halo : sa position suit la fin du défilement (-1 → 1)
  useEffect(() => {
    const el = giant.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = el.getBoundingClientRect();
        const k = Math.max(-1, Math.min(1, (window.innerHeight - r.top) / window.innerHeight * 2 - 1));
        el.style.setProperty("--glow", k.toFixed(3));
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const word = t("giant");

  return (
    <footer ref={ref} className="foot" id="contact" data-chapter="contact">
      <div className="foot-cta">
        <h2 className="reveal">
          {t("titleA")}
          <br />
          <span className="it">{t("titleIt")}</span>
        </h2>
        <p className="reveal" style={{ "--i": 1 } as React.CSSProperties}>
          {t("lead")}
        </p>
        <div className="foot-pills reveal" style={{ "--i": 2 } as React.CSSProperties}>
          <Link href="/astuces" className="pill pill-light mono">
            {t("ctaTips")} ↗
          </Link>
          <a href={HEI.links.intranet} className="pill mono" target="_blank" rel="noopener noreferrer">
            {t("ctaIntranet")} ↗<span className="sr-only"> {t("newTab")}</span>
          </a>
          <a href={`mailto:${HEI.email}`} className="pill mono">
            {t("ctaMail")}
          </a>
        </div>
      </div>

      <div className="foot-grid">
        <div>
          <p className="foot-brand">
            <HeiMark />
            Meet da Tribu
          </p>
          <p className="foot-tag">{t("tagline")}</p>
        </div>
        <nav aria-label={t("guide")}>
          <h3>{t("guide")}</h3>
          <ul>
            <li><Link href={{ pathname: "/", hash: "decouvrir" }}>{t("lDiscover")}</Link></li>
            <li><Link href={{ pathname: "/", hash: "reperes" }}>{t("lFind")}</Link></li>
            <li><Link href={{ pathname: "/", hash: "conseils" }}>{t("lAdvice")}</Link></li>
            <li><Link href="/astuces">{t("lTips")}</Link></li>
            <li><Link href="/tribu">{t("lTribe")}</Link></li>
          </ul>
        </nav>
        <div>
          <h3>HEI</h3>
          <ul>
            <li><a href={`mailto:${HEI.email}`}>{HEI.email}</a></li>
            <li><a href={HEI.phoneHref}>{HEI.phone}</a></li>
            <li>{t("hours")}</li>
            <li>{HEI.address}</li>
          </ul>
        </div>
        <nav aria-label={t("socialLabel")}>
          <h3>{t("socialLabel")}</h3>
          <ul>
            {SOCIALS.map((s) => (
              <li key={s.label}>
                <a href={s.url} target="_blank" rel="noopener noreferrer">
                  {s.label.charAt(0) + s.label.slice(1).toLowerCase()} ↗<span className="sr-only"> {t("newTab")}</span>
                </a>
              </li>
            ))}
            <li><a href={HEI.links.site} target="_blank" rel="noopener noreferrer">hei.school ↗<span className="sr-only"> {t("newTab")}</span></a></li>
          </ul>
        </nav>
      </div>

      <div className="foot-legal mono">
        <p>{t("credit", { name: CREDIT_NAME })}</p>
        <p>{t("rights")}</p>
        <p>{t("place")}</p>
      </div>

      <p className="foot-giant" ref={giant} aria-hidden="true">
        {[...word].map((c, i) => (
          <span key={i} style={{ "--i": i } as React.CSSProperties}>
            {c}
          </span>
        ))}
      </p>
    </footer>
  );
}
