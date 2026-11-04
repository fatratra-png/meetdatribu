import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Image de partage (réseaux, messageries), générée au build pour chaque langue.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Meet da Tribu — le guide de survie à HEI";

// pré-générée au build, une par langue
export function generateStaticParams() {
  return [{ locale: "fr" }, { locale: "en" }];
}

const TEXT = {
  fr: { kicker: "LEI 2026 · LE GUIDE DE SURVIE À HEI", a: "Bienvenue dans", b: "la Tribu." },
  en: { kicker: "LEI 2026 · THE HEI SURVIVAL GUIDE", a: "Welcome to", b: "the Tribe." },
} as const;

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = TEXT[locale === "en" ? "en" : "fr"];
  const font = await readFile(join(process.cwd(), "src/fonts/space-grotesk-500.ttf"));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between",
          padding: 72, background: "#000a1f", color: "#f4f1ea", fontFamily: "Grotesk",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 30, letterSpacing: -1 }}>
          {/* les crochets du logo HEI */}
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#dfa408" strokeWidth="2.6" strokeLinecap="square">
            <path d="M3 11V3h8" />
            <path d="M21 13v8h-8" />
          </svg>
          MEET DA TRIBU
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 22, letterSpacing: 2, color: "#a6afc2" }}>{t.kicker}</div>
          <div style={{ fontSize: 112, lineHeight: 1, letterSpacing: -5, marginTop: 20 }}>{t.a}</div>
          <div style={{ fontSize: 112, lineHeight: 1, letterSpacing: -5, color: "#dfa408" }}>{t.b}</div>
        </div>
        <div style={{ fontSize: 22, color: "#a6afc2" }}>meetdatribu.vercel.app</div>
      </div>
    ),
    { ...size, fonts: [{ name: "Grotesk", data: font, weight: 500, style: "normal" }] },
  );
}
