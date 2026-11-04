import { defineRouting } from "next-intl/routing";

// Les deux langues du site. Le français est la langue par défaut :
// « / » redirige vers « /fr ».
export const routing = defineRouting({
  locales: ["fr", "en"],
  defaultLocale: "fr",
});

export type Locale = (typeof routing.locales)[number];
