"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useReveal } from "@/lib/scene";
import { FIGURES } from "@/content/hei";
import "./content.css";

/** Compteur qui monte de 0 à la valeur quand il entre à l'écran. */
function useCount(target: number, run: boolean, duration = 1400) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!run) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- valeur finale directe en mouvement réduit
      setV(target);
      return;
    }
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / duration);
      setV(target * (1 - Math.pow(1 - k, 4)));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, target, duration]);
  return v;
}

/**
 * « La Tribu en chiffres » : deux grands compteurs, puis la situation des
 * diplômés 10 mois après la Licence, en barres horizontales triées (une seule
 * série : une teinte neutre, l'or sur la barre qui porte le message).
 * Sources citées sous le graphique ; un tableau est lu par les lecteurs d'écran.
 */
export default function Figures() {
  const t = useTranslations("figures");
  const locale = useLocale();
  const ref = useRef<HTMLElement>(null);
  const chart = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useReveal(ref);

  useEffect(() => {
    const el = chart.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setInView(true);
        io.disconnect();
      }
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const students = useCount(FIGURES.students, inView);
  const years = useCount(FIGURES.years, inView, 900);
  const pct = (v: number) => v.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const rows = [...FIGURES.alumni].sort((a, b) => b.value - a.value);
  const max = rows[0].value;

  return (
    <section ref={ref} id="chiffres" data-chapter="figures" className="figures" aria-labelledby="figures-title">
      <header className="tools-head">
        <p className="label mono reveal">{t("kicker")}</p>
        <h2 id="figures-title" className="reveal" style={{ "--i": 1 } as React.CSSProperties}>
          {t("titleA")} <span className="it">{t("titleIt")}</span>
        </h2>
      </header>

      <div className="fig-grid" ref={chart}>
        <dl className="fig-big">
          <div className="reveal">
            <dt className="mono ash">{t("studentsLabel")}</dt>
            <dd>
              +{Math.round(students)}
            </dd>
          </div>
          <div className="reveal" style={{ "--i": 1 } as React.CSSProperties}>
            <dt className="mono ash">{t("yearsLabel")}</dt>
            <dd>
              +{Math.round(years)} <small>{t("yearsUnit")}</small>
            </dd>
          </div>
        </dl>

        <figure className="fig-chart reveal" style={{ "--i": 2 } as React.CSSProperties}>
          <figcaption>
            <p className="fig-chart-title">{t("chartTitle")}</p>
            <p className="mono ash">{t("chartSub")}</p>
          </figcaption>
          <ul className="bars" aria-hidden="true">
            {rows.map((r, i) => (
              <li key={r.key} className={r.key === "job" ? "is-key" : undefined} title={`${t(`alumni.${r.key}`)} : ${pct(r.value)} %`}>
                <span className="bar-label">{t(`alumni.${r.key}`)}</span>
                <span className="bar-track">
                  <span
                    className="bar-fill"
                    style={{ transform: `scaleX(${inView ? r.value / max : 0})`, transitionDelay: `${i * 90}ms` }}
                  />
                </span>
                <span className="bar-value">{pct(r.value)} %</span>
              </li>
            ))}
          </ul>
          {/* le même contenu en tableau, pour les lecteurs d'écran */}
          <div className="sr-only">
          <table>
            <caption>{t("chartTitle")}</caption>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key}>
                  <th scope="row">{t(`alumni.${r.key}`)}</th>
                  <td>{pct(r.value)} %</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <p className="fig-source mono ash">{t("source")}</p>
        </figure>
      </div>
    </section>
  );
}
