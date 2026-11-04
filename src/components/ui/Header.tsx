"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import LangSwitch from "./LangSwitch";
import ThemeToggle from "./ThemeToggle";
import HeiMark from "./HeiMark";

/**
 * Barre de navigation : wordmark à gauche, ancres en mono, réglages, CTA en
 * pilule d'or. Elle se cache quand on descend, revient quand on remonte.
 * Elle entre quand <body> reçoit `is-ready` (posée par le loader).
 */
export default function Header() {
  const t = useTranslations();
  const pathname = usePathname();
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!document.querySelector("[data-loader]")) {
      requestAnimationFrame(() => document.body.classList.add("is-ready"));
    }
    // cacher en descendant, montrer en remontant (au-delà du premier écran)
    let last = window.scrollY;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY;
        const down = y > last + 4;
        const up = y < last - 4;
        if (down && y > window.innerHeight * 0.6) ref.current?.classList.add("is-hidden");
        else if (up || y < 80) ref.current?.classList.remove("is-hidden");
        last = y;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="topbar" ref={ref} onFocusCapture={() => ref.current?.classList.remove("is-hidden")}>
      <Link href="/" className="topbar-mark" aria-label={t("a11y.home")}>
        <HeiMark />
        <span className="topbar-name">Meet da Tribu</span>
      </Link>
      <nav aria-label={t("a11y.mainNav")} className="topbar-nav">
        <Link href={{ pathname: "/", hash: "decouvrir" }} className="topbar-link mono">
          {t("nav.discover")}
        </Link>
        <Link href="/tribu" className="topbar-link mono" aria-current={pathname === "/tribu" ? "page" : undefined}>
          {t("nav.tribu")}
        </Link>
      </nav>
      <div className="topbar-tools">
        <LangSwitch />
        <ThemeToggle />
      </div>
      <Link href="/astuces" className="pill pill-solid mono" aria-current={pathname === "/astuces" ? "page" : undefined}>
        {t("nav.cta")}
      </Link>
    </header>
  );
}
