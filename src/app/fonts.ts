import localFont from "next/font/local";
import { DM_Mono, Instrument_Serif } from "next/font/google";

// Space Grotesk : la grotesque des titres, fournie avec le skill verre
// (licence OFL, voir README). Chargée en local par next/font.
export const grotesk = localFont({
  src: [
    { path: "../fonts/space-grotesk-300.ttf", weight: "300" },
    { path: "../fonts/space-grotesk-400.ttf", weight: "400" },
    { path: "../fonts/space-grotesk-500.ttf", weight: "500" },
    { path: "../fonts/space-grotesk-600.ttf", weight: "600" },
    { path: "../fonts/space-grotesk-700.ttf", weight: "700" },
  ],
  variable: "--font-grotesk",
  display: "swap",
});

// DM Mono : les kickers en CAPITALES (règle du skill Site Immersif).
export const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

// Instrument Serif italique : UN mot par titre, pour la voix « humaine »
// (titres mixtes grotesque + serif italique). Voir DECISIONS.md, refonte.
export const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  variable: "--font-serif",
  display: "swap",
});
