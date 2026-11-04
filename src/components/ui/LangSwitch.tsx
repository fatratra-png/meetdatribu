"use client";

import { useTransition } from "react";
import { motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

/**
 * Sélecteur FR / EN. La pastille glisse d'une langue à l'autre grâce à
 * `layoutId` (Framer Motion anime automatiquement le déplacement).
 */
export default function LangSwitch() {
  const t = useTranslations("lang");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const change = (next: Locale) => {
    if (next === locale) return;
    startTransition(() => {
      // même page, autre langue ; on garde la position de défilement
      router.replace(pathname, { locale: next, scroll: false });
    });
  };

  return (
    <div
      role="group"
      aria-label={t("label")}
      className="lang-switch relative flex items-center rounded-[var(--radius)] p-0.5"
      style={{ boxShadow: "inset 0 0 0 1px var(--hairline)" }}
      aria-busy={pending}
    >
      {routing.locales.map((l) => {
        const active = l === locale;
        return (
          <button
            key={l}
            type="button"
            lang={l}
            onClick={() => change(l)}
            aria-pressed={active}
            aria-label={t(l)}
            className="mono relative z-10 h-9 w-9 rounded-[var(--radius)] transition-colors duration-300"
            style={{ color: active ? "var(--bg)" : "var(--ink)" }}
          >
            {active && (
              <motion.span
                layoutId="lang-pill"
                className="absolute inset-0 -z-10 rounded-[var(--radius)] bg-ink"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            {l.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
