"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { Dices, Search } from "lucide-react";
import { ASTUCES, CATEGORIES, type Categorie } from "@/content/astuces";

type Lang = "fr" | "en";
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Toutes les astuces : recherche, filtres en pastilles (la pastille active
 * glisse grâce à `layoutId`), cartes qui se réorganisent (`layout`) et un
 * bouton « astuce au hasard » qui met une carte en avant.
 */
export default function AstucesBrowser() {
  const t = useTranslations("astuces");
  const lang = useLocale() as Lang;
  const [cat, setCat] = useState<Categorie | "all">("all");
  const [q, setQ] = useState("");
  const [lucky, setLucky] = useState<string | null>(null);

  const list = useMemo(() => {
    const query = norm(q.trim());
    return ASTUCES.filter(
      (a) =>
        (cat === "all" || a.categorie === cat) &&
        (!query || norm(a.titre[lang]).includes(query) || norm(a.texte[lang]).includes(query)),
    );
  }, [cat, q, lang]);

  const random = () => {
    const pool = ASTUCES.filter((a) => a.id !== lucky);
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setCat("all");
    setQ("");
    setLucky(pick.id);
    requestAnimationFrame(() => document.getElementById(`astuce-${pick.id}`)?.focus());
  };

  const chips: (Categorie | "all")[] = ["all", ...CATEGORIES];

  return (
    <div className="astuces">
      <div className="astuces-bar">
        <div className="astuces-search">
          <label htmlFor="astuces-q" className="sr-only">
            {t("searchLabel")}
          </label>
          <Search size={16} strokeWidth={1.75} aria-hidden="true" />
          <input
            id="astuces-q"
            type="search"
            value={q}
            placeholder={t("searchPlaceholder")}
            onChange={(e) => {
              setQ(e.target.value);
              setLucky(null);
            }}
            autoComplete="off"
          />
        </div>
        <LayoutGroup id="chips">
          <div className="chips" role="group" aria-label={t("filterLabel")}>
            {chips.map((c) => (
              <button
                key={c}
                type="button"
                className="chip mono"
                aria-pressed={cat === c}
                onClick={() => {
                  setCat(c);
                  setLucky(null);
                }}
              >
                {cat === c && (
                  <motion.span
                    layoutId="chip-pill"
                    className="chip-pill"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="chip-text">{t(`cat.${c}`)}</span>
              </button>
            ))}
          </div>
        </LayoutGroup>
        <button type="button" className="pill pill-solid mono" onClick={random}>
          <Dices size={16} strokeWidth={1.75} aria-hidden="true" />
          {t("random")}
        </button>
      </div>

      <p className="astuces-count mono ash" aria-live="polite">
        {t("count", { n: list.length })}
      </p>

      <motion.ul layout className="astuces-grid">
        <AnimatePresence mode="popLayout">
          {list.map((a) => (
            <motion.li
              key={a.id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.45, ease: [0.19, 1, 0.22, 1] }}
              className={`astuce-card${lucky === a.id ? " is-lucky" : ""}`}
              id={`astuce-${a.id}`}
              tabIndex={-1}
            >
              <p className="mono ash">{t(`cat.${a.categorie}`)}</p>
              <h3>{a.titre[lang]}</h3>
              <p className="astuce-text">{a.texte[lang]}</p>
              {(a.auteur || a.promo) && (
                <p className="mono ash astuce-by">
                  {[a.auteur, a.promo].filter(Boolean).join(" · ")}
                </p>
              )}
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
      {!list.length && <p className="astuces-empty">{t("empty")}</p>}
    </div>
  );
}
