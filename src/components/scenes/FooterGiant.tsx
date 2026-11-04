"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { useReveal } from "@/lib/scene";
import { CREDIT_NAME, HEI, SOCIALS } from "@/content/hei";

/**
 * Footer (skill Site Immersif) : kicker, e-mail, réassurance, puis le nom
 * géant qui monte en rideau de lettres, et les liens sociaux réels.
 */
export default function FooterGiant() {
  const t = useTranslations("footer");
  const ref = useRef<HTMLElement>(null);
  useReveal(ref, ".reveal, .footer-name");
  const name = "Meet da Tribu";

  return (
    <footer ref={ref} className="footer" id="contact">
      <p className="footer-kicker mono ash reveal">{t("kicker")}</p>
      <a className="footer-mail reveal" href={`mailto:${HEI.email}`}>
        <span className="footer-mail-text">{HEI.email}</span>
      </a>
      <p className="footer-reassurance mono ash reveal">
        <a href={HEI.phoneHref}>{HEI.phone}</a> · {t("hours")}
      </p>
      <p className="footer-reassurance mono ash reveal">{HEI.address.toUpperCase()}</p>

      <p className="footer-name" aria-label={name}>
        {[...name].map((c, i) =>
          c === " " ? (
            " "
          ) : (
            <span key={i} className="ch" aria-hidden="true">
              <span className="chi" style={{ "--i": i } as React.CSSProperties}>
                {c}
              </span>
            </span>
          ),
        )}
      </p>

      <div className="footer-bottom">
        <p className="mono ash">{t("credit", { name: CREDIT_NAME })}</p>
        <nav aria-label={t("socialLabel")}>
          <ul className="footer-socials mono">
            {SOCIALS.map((s) => (
              <li key={s.label}>
                <a href={s.url} target="_blank" rel="noopener noreferrer">
                  {s.label} ↗<span className="sr-only"> {t("newTab")}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <p className="mono ash">{t("rights")}</p>
      </div>
    </footer>
  );
}
