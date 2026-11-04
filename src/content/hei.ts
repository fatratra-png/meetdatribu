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

/** Crédit du footer : l'auteur du site (assistant pédagogique LEI 2026). */
export const CREDIT_NAME = "FATRATRA";

/** Réseaux affichés dans le footer, dans cet ordre. */
export const SOCIALS = [
  { label: "FACEBOOK", url: HEI.links.facebook },
  { label: "LINKEDIN", url: HEI.links.linkedin },
  { label: "INSTAGRAM", url: HEI.links.instagram },
  { label: "INTRANET", url: HEI.links.intranet },
] as const;

/**
 * L'équipe pédagogique, telle que présentée sur https://hei.school
 * (noms, titres et photos de la page d'accueil, dans le même ordre).
 */
export type Member = { name: string; photo: string; title: { fr: string; en: string } };

export const TEAM: Member[] = [
  {
    name: "Dr Lou MAURICA",
    photo: "/hei/equipe-47.webp",
    title: {
      fr: "Docteur-Ingénieur en informatique · Fondateur et Directeur pédagogique de HEI",
      en: "PhD engineer in computer science · Founder and Academic Director of HEI",
    },
  },
  {
    name: "Ryan ANDRIAMAHERY",
    photo: "/hei/equipe-46.webp",
    title: { fr: "Cofondateur et Directeur des opérations de HEI", en: "Co-founder and Chief Operating Officer of HEI" },
  },
  {
    name: "Dr Tokimahery RAMAROZAKA",
    photo: "/hei/equipe-44.webp",
    title: {
      fr: "Docteur en informatique de l'Université de Fianarantsoa",
      en: "PhD in computer science, University of Fianarantsoa",
    },
  },
  {
    name: "Dre Tahina RALITERA",
    photo: "/hei/equipe-51.webp",
    title: {
      fr: "Docteure-Ingénieure, CNRS France · Prix L'Oréal-UNESCO pour les Femmes en Science (2017)",
      en: "PhD engineer, CNRS France · L'Oréal-UNESCO For Women in Science award (2017)",
    },
  },
  {
    name: "Mirado RAFENOMAHENINTSOA",
    photo: "/hei/equipe-45.webp",
    title: {
      fr: "Spécialiste en data et Business Intelligence · Fondateur de DataBridge Madagascar",
      en: "Data and Business Intelligence specialist · Founder of DataBridge Madagascar",
    },
  },
  {
    name: "Julien RAJERISON",
    photo: "/hei/equipe-49.webp",
    title: {
      fr: "Lead Développeur · Fondateur de l'association Techzara Madagascar",
      en: "Lead Developer · Founder of the Techzara Madagascar association",
    },
  },
  {
    name: "Jean Aimé MAXA",
    photo: "/hei/equipe-50.webp",
    title: {
      fr: "Responsable technique cybersécurité chez CES France Continental (Toulouse, France)",
      en: "Cybersecurity technical lead at CES France Continental (Toulouse, France)",
    },
  },
  {
    name: "Allan RAOELIJAONA",
    photo: "/hei/equipe-52.webp",
    title: {
      fr: "Consultant en Système d'Informations chez A2Mi · Master MBDS, Nice Sophia-Antipolis",
      en: "Information Systems consultant at A2Mi · MBDS Master's, Nice Sophia-Antipolis",
    },
  },
];

/** Les entreprises partenaires (logos publiés sur https://hei.school). */
export const PARTNERS: { name: string; logo: string }[] = [
  "Axian", "Birdia", "CanCham", "Craft-lab", "Emit", "Etech", "JCI", "Kanteco",
  "Nexta", "Novity", "Numer", "PNM", "Stellarix", "Yas", "YF", "Yoooz",
].map((n) => ({ name: n.replace("-", " "), logo: `/hei/partenaires/${n.toLowerCase()}.webp` }));

/**
 * La Tribu en chiffres. Sources :
 *  - hei.school (accueil) : « +350 étudiants », « +4 ans » ;
 *  - infographie HEI « Situation des Mpamakilay ayant validé leur Licence,
 *    10 mois après leur soutenance » (public/hei/alumni-situation.webp).
 */
export const FIGURES = {
  students: 350,
  years: 4,
  alumni: [
    { key: "job", value: 41.9 },
    { key: "masterAbroad", value: 18.6 },
    { key: "masterMada", value: 7 },
    { key: "founder", value: 7 },
    { key: "searching", value: 20.9 },
    { key: "unknown", value: 4.6 },
  ],
} as const;
