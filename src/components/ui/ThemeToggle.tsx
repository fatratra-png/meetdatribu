"use client";

import { useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";

type Theme = "dark" | "light";

// Le thème vit dans l'attribut data-theme de <html>. Un petit script dans
// le layout le pose AVANT l'affichage (pas de flash). Ici on l'observe.
function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => obs.disconnect();
}
const getTheme = (): Theme =>
  document.documentElement.dataset.theme === "light" ? "light" : "dark";

export default function ThemeToggle() {
  const t = useTranslations("theme");
  // côté serveur : sombre (le thème par défaut)
  const theme = useSyncExternalStore(subscribe, getTheme, () => "dark" as Theme);
  const next: Theme = theme === "dark" ? "light" : "dark";

  const toggle = () => {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* stockage indisponible (navigation privée) : tant pis, ça marche quand même */
    }
  };

  return (
    <motion.button
      type="button"
      onClick={toggle}
      aria-label={next === "light" ? t("toLight") : t("toDark")}
      className="relative grid size-10 place-items-center overflow-hidden rounded-[var(--radius)] text-ink"
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.92 }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ y: 14, rotate: -90, opacity: 0 }}
          animate={{ y: 0, rotate: 0, opacity: 1 }}
          exit={{ y: -14, rotate: 90, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.19, 1, 0.22, 1] }}
          className="grid place-items-center"
        >
          {theme === "dark" ? (
            <Moon size={18} strokeWidth={1.75} aria-hidden />
          ) : (
            <Sun size={18} strokeWidth={1.75} aria-hidden />
          )}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
