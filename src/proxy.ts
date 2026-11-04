import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Next 16 : l'ancien « middleware » s'appelle désormais « proxy ».
// Il ajoute le préfixe de langue (/fr, /en) aux URL qui n'en ont pas.
export default createMiddleware(routing);

export const config = {
  // Tout sauf les fichiers internes de Next, l'API et les fichiers statiques.
  matcher: "/((?!api|_next|_vercel|sitemap.xml|robots.txt|.*\\..*).*)",
};
