/**
 * Faits et liens HEI — source : https://hei.school (relevé le 4 nov. 2026).
 * Un seul endroit à modifier si une info change.
 */
export const HEI = {
  name: "Haute École d'Informatique",
  address: "II J 161 R, Ambodivoanjo, Ivandry, Antananarivo 101",
  hours: { days: "lun-ven", morning: "8h-12h", afternoon: "13h-16h" },
  phone: "034 94 041 16",
  phoneHref: "tel:+261349404116",
  email: "contact@hei.school",
  links: {
    site: "https://hei.school",
    intranet: "https://admin.hei.school/login",
    facebook: "https://www.facebook.com/hei.school",
    linkedin: "https://www.linkedin.com/company/hei-school",
    instagram: "https://www.instagram.com/hei.school",
  },
  /** Habilitation de la Licence par le MESupRES. */
  accreditation: "MESupRES n°31309/2023",
} as const;

/**
 * Crédit du footer. PLACEHOLDER : remplace « [Ton nom] » par ton nom.
 */
export const CREDIT_NAME = "[Ton nom]";

/** Réseaux affichés dans le footer, dans cet ordre. */
export const SOCIALS = [
  { label: "FACEBOOK", url: HEI.links.facebook },
  { label: "LINKEDIN", url: HEI.links.linkedin },
  { label: "INSTAGRAM", url: HEI.links.instagram },
  { label: "INTRANET", url: HEI.links.intranet },
] as const;
