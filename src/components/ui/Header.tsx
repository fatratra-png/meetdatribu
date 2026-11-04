"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import LangSwitch from "./LangSwitch";
import ThemeToggle from "./ThemeToggle";

/**
 * Header flottant (le « dock » du skill Site Immersif) :
 * wordmark à gauche, 2 ancres, réglages (langue, thème), CTA en or.
 * Il entre en glissant depuis le haut quand <body> reçoit la classe `is-ready`
 * (posée par le loader en phase 3 ; ici, dès le montage).
 */
export default function Header() {
  const t = useTranslations();
  const pathname = usePathname();

  useEffect(() => {
    // Le loader (phase 3) prendra le relais de ce signal.
    if (!document.querySelector("[data-loader]")) {
      requestAnimationFrame(() => document.body.classList.add("is-ready"));
    }
  }, []);

  return (
    <header className="dock" data-dock>
      <Link href="/" className="dock-wordmark" aria-label={t("a11y.home")} data-dock-wordmark>
        Meet da Tribu
      </Link>
      <nav aria-label={t("a11y.mainNav")} className="dock-nav">
        <Link href={{ pathname: "/", hash: "decouvrir" }} className="dock-link">
          {t("nav.discover")}
        </Link>
        <Link
          href="/tribu"
          className="dock-link"
          aria-current={pathname === "/tribu" ? "page" : undefined}
        >
          {t("nav.tribu")}
        </Link>
      </nav>
      <div className="flex items-center gap-1">
        <LangSwitch />
        <ThemeToggle />
      </div>
      <Link
        href="/astuces"
        className="dock-cta"
        aria-current={pathname === "/astuces" ? "page" : undefined}
      >
        {t("nav.cta")}
      </Link>
    </header>
  );
}
