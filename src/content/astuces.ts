/**
 * Les astuces de la Tribu.
 *
 * PLACEHOLDER — les 15 astuces ci-dessous sont des exemples plausibles écrits
 * en attendant les vraies réponses du Google Form du LEI 2026. Pour les
 * remplacer : garder la même forme, une entrée par réponse. `auteur` et
 * `promo` sont facultatifs (ne jamais inventer de nom réel).
 *
 * Répartition MECE (mece-layout-architect) : une astuce = une seule catégorie.
 *   reperes  → l'espace et le temps : lieux, horaires, organisation
 *   outils   → ce qu'on utilise : logiciels, plateformes, IA
 *   conseils → comment s'y prendre : méthode, entraide, état d'esprit
 */

export type Categorie = "reperes" | "outils" | "conseils";
export type Astuce = {
  id: string;
  categorie: Categorie;
  titre: { fr: string; en: string };
  texte: { fr: string; en: string };
  auteur?: string;
  promo?: string;
};

export const CATEGORIES: Categorie[] = ["reperes", "outils", "conseils"];

export const ASTUCES: Astuce[] = [
  // ─── Se repérer ───
  {
    id: "villa-joell", // PLACEHOLDER
    categorie: "reperes",
    titre: { fr: "Villa Joell d'abord", en: "Villa Joell first" },
    texte: {
      fr: "Une question d'inscription, d'attestation ou d'absence ? Le bureau de l'administration, c'est Villa Joell, juste à l'entrée.",
      en: "A question about enrolment, certificates or absences? The administration office is Villa Joell, right at the entrance.",
    },
  },
  {
    id: "horaires", // PLACEHOLDER
    categorie: "reperes",
    titre: { fr: "Les horaires de l'accueil", en: "Front desk hours" },
    texte: {
      fr: "L'administration est ouverte du lundi au vendredi, de 8 h à 12 h et de 13 h à 16 h. Pas la peine de passer à 12 h 05.",
      en: "The administration is open Monday to Friday, 8am-12pm and 1pm-4pm. No point dropping by at 12:05.",
    },
  },
  {
    id: "algebre", // PLACEHOLDER
    categorie: "reperes",
    titre: { fr: "ALGÈBRE = PI + Sigma", en: "ALGÈBRE = PI + Sigma" },
    texte: {
      fr: "Si l'emploi du temps dit « ALGÈBRE », c'est la grande salle du 1er : PI et Sigma, de part et d'autre de la baie vitrée.",
      en: "If the timetable says \"ALGÈBRE\", it's the big room upstairs: PI and Sigma, on either side of the glass bay.",
    },
  },
  {
    id: "parking", // PLACEHOLDER
    categorie: "reperes",
    titre: { fr: "Le parking se remplit vite", en: "The parking fills up fast" },
    texte: {
      fr: "En moto ou en scooter, arrive tôt : le parking, juste derrière le portail, est petit. Gare-toi droit et laisse l'allée libre.",
      en: "On a motorbike or scooter, come early: the parking, right behind the gate, is small. Park straight and keep the aisle clear.",
    },
  },
  {
    id: "rooftop", // PLACEHOLDER
    categorie: "reperes",
    titre: { fr: "Le Rooftop pour souffler", en: "The Rooftop to breathe" },
    texte: {
      fr: "Besoin de calme entre deux sessions ? Monte au Rooftop. C'est aussi là qu'on révise le mieux à plusieurs.",
      en: "Need some quiet between sessions? Go up to the Rooftop. It's also the best place to revise together.",
    },
  },

  // ─── Outils ───
  {
    id: "drive-range", // PLACEHOLDER
    categorie: "outils",
    titre: { fr: "Un dossier Drive par matière", en: "One Drive folder per course" },
    texte: {
      fr: "Crée dès le jour 1 un dossier Google Drive par matière. En fin de semestre, tu retrouves tout en dix secondes.",
      en: "From day one, create one Google Drive folder per course. At the end of the semester, you find everything in ten seconds.",
    },
  },
  {
    id: "meet-camera", // PLACEHOLDER
    categorie: "outils",
    titre: { fr: "Meet : teste avant le cours", en: "Meet: test before class" },
    texte: {
      fr: "Pour un cours en ligne, ouvre le lien Meet cinq minutes avant et vérifie micro et caméra. Les problèmes de son, c'est jamais au bon moment.",
      en: "For an online class, open the Meet link five minutes early and check your mic and camera. Sound problems never come at a good time.",
    },
  },
  {
    id: "ia-mentor", // PLACEHOLDER
    categorie: "outils",
    titre: { fr: "L'IA explique, tu écris", en: "AI explains, you write" },
    texte: {
      fr: "Demande à l'IA de t'expliquer une erreur, pas de la corriger à ta place. Ce que tu comprends, tu le gardes pour l'examen.",
      en: "Ask AI to explain an error, not to fix it for you. What you understand, you keep for the exam.",
    },
  },
  {
    id: "mimo", // PLACEHOLDER
    categorie: "outils",
    titre: { fr: "Mimo dans le bus", en: "Mimo on the bus" },
    texte: {
      fr: "Dix minutes de Mimo par jour, dans le bus ou en attendant le cours : c'est là que le HTML/CSS devient un réflexe.",
      en: "Ten minutes of Mimo a day, on the bus or waiting for class: that's how HTML/CSS becomes second nature.",
    },
  },
  {
    id: "intranet-matin", // PLACEHOLDER
    categorie: "outils",
    titre: { fr: "L'intranet, chaque matin", en: "The intranet, every morning" },
    texte: {
      fr: "Salles, horaires, annonces : un coup d'œil à l'intranet chaque matin t'évite de te tromper de salle.",
      en: "Rooms, times, announcements: a quick look at the intranet every morning saves you from going to the wrong room.",
    },
  },

  // ─── Conseils ───
  {
    id: "questions-tot", // PLACEHOLDER
    categorie: "conseils",
    titre: { fr: "Pose tes questions tôt", en: "Ask your questions early" },
    texte: {
      fr: "Une question posée la première semaine t'en évite dix plus tard. Personne ne t'attend au tournant.",
      en: "One question asked in week one saves you ten later. Nobody is waiting for you to fail.",
    },
  },
  {
    id: "binome", // PLACEHOLDER
    categorie: "conseils",
    titre: { fr: "Trouve ton binôme", en: "Find your study partner" },
    texte: {
      fr: "Expliquer ton code à quelqu'un, c'est le meilleur débogueur. Trouve un binôme dès le LEI.",
      en: "Explaining your code to someone is the best debugger. Find a study partner during the LEI.",
    },
  },
  {
    id: "un-peu-chaque-jour", // PLACEHOLDER
    categorie: "conseils",
    titre: { fr: "Un peu chaque jour", en: "A little every day" },
    texte: {
      fr: "Trente minutes de code par jour valent mieux qu'une nuit blanche la veille du rendu.",
      en: "Thirty minutes of code a day beats an all-nighter before the deadline.",
    },
  },
  {
    id: "git-commit", // PLACEHOLDER
    categorie: "conseils",
    titre: { fr: "Sauvegarde ton travail", en: "Back up your work" },
    texte: {
      fr: "Enregistre et sauvegarde souvent (Drive, puis Git quand tu l'auras vu). Un ordinateur qui plante la veille d'un rendu, ça arrive.",
      en: "Save and back up often (Drive, then Git once you've learned it). A laptop crashing the night before a deadline happens.",
    },
  },
  {
    id: "clubs", // PLACEHOLDER
    categorie: "conseils",
    titre: { fr: "Rejoins un club", en: "Join a club" },
    texte: {
      fr: "Musique, foot, hackathons : les clubs, c'est là que tu rencontres les autres promos. Et les meilleurs conseils.",
      en: "Music, football, hackathons: clubs are where you meet the other classes. And get the best advice.",
    },
  },
];
