"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { Bot, Code2, FolderOpen, KeyRound, RotateCw } from "lucide-react";
import { useReveal } from "@/lib/scene";
import "./content.css";

/** Les 4 outils, dans l'ordre du bento : grande / haute / haute / grande. */
const TOOLS = [
  { key: "workspace", size: "big", Icon: FolderOpen },
  { key: "web", size: "tall", Icon: Code2 },
  { key: "ai", size: "tall", Icon: Bot },
  { key: "intranet", size: "big", Icon: KeyRound },
] as const;

/**
 * « Les outils à connaître » : un bento de 4 cartes de tailles contrastées
 * (grande, haute, haute, grande, en diagonale). Chaque carte se retourne
 * (Framer Motion) : recto = à quoi ça sert, verso = l'astuce.
 * Mimo est rangé avec HTML/CSS (s'entraîner au web) : 4 piliers valent mieux
 * que 5 demi-piliers (règle du skill Site Immersif).
 */
export default function ToolsBento() {
  const t = useTranslations("tools");
  const ref = useRef<HTMLElement>(null);
  const [flipped, setFlipped] = useState<string | null>(null);
  useReveal(ref);

  return (
    <section ref={ref} id="outils" data-chapter="tools" className="tools" aria-labelledby="tools-title">
      <header className="tools-head">
        <p className="label mono reveal">{t("kicker")}</p>
        <h2 id="tools-title" className="reveal" style={{ "--i": 1 } as React.CSSProperties}>
          {t("titleA")} <span className="it">{t("titleIt")}</span>
        </h2>
        <p className="tools-lead reveal" style={{ "--i": 2 } as React.CSSProperties}>
          {t("lead")}
        </p>
        {/* l'indication : les cartes se retournent */}
        <p className="tools-hint mono reveal" style={{ "--i": 3 } as React.CSSProperties}>
          <RotateCw size={14} strokeWidth={1.75} aria-hidden="true" />
          {t("hint")}
        </p>
      </header>

      <ul className="bento">
        {TOOLS.map(({ key, size, Icon }, i) => {
          const isFlipped = flipped === key;
          return (
            <li key={key} className={`bento-cell bento-${size} reveal`} style={{ "--i": i } as React.CSSProperties}>
              <motion.div
                className="flip"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.7, ease: [0.19, 1, 0.22, 1] }}
              >
                {/* recto */}
                <div className="face face-front" aria-hidden={isFlipped}>
                  <p className="mono ash">
                    {String(i + 1).padStart(2, "0")} / 04
                  </p>
                  <Icon className="tool-icon" size={size === "big" ? 44 : 36} strokeWidth={1.25} aria-hidden="true" />
                  <h3>{t(`${key}.name`)}</h3>
                  <p className="tool-what">{t(`${key}.what`)}</p>
                  <p className="tool-tags mono">{t(`${key}.tags`)}</p>
                </div>
                {/* verso : l'astuce */}
                <div className="face face-back" aria-hidden={!isFlipped}>
                  <p className="mono">{t("tipLabel")}</p>
                  <p className="tool-tip it">« {t(`${key}.tip`)} »</p>
                </div>
              </motion.div>
              <button
                type="button"
                className="flip-btn mono"
                aria-expanded={isFlipped}
                aria-label={`${isFlipped ? t("back") : t("showTip")} : ${t(`${key}.name`)}`}
                onClick={() => setFlipped(isFlipped ? null : key)}
              >
                <RotateCw size={14} strokeWidth={1.75} aria-hidden="true" />
                {isFlipped ? t("back") : t("showTip")}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
