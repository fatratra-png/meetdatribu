/**
 * Le campus HEI pour la visite 3D — étages, salles et zones, en FR et EN.
 *
 * Source : description du campus par un étudiant de HEI (assistant LEI 2026),
 * le 5 nov. 2026. L'agencement (qui est à côté de quoi, qui est au-dessus de
 * quoi) vient de cette description. Les DIMENSIONS et les distances, elles,
 * sont estimées : elles sont marquées // PLACEHOLDER.
 *
 * Coordonnées en MÈTRES, vues de dessus : x vers la droite (est), z vers le
 * bas (le côté du parking et de l'entrée).
 *
 *   RDC : Villa Joell (entrée, administration) → salle des profs → cuisine →
 *         WC filles (minuscule, non affiché dans la visite). Face au mur des WC, à droite sur 3 m, puis
 *         encore à droite : la salle B, dans l'aile perpendiculaire.
 *   1er : au-dessus de Villa Joell, la salle ALGÈBRE = salles PI et Sigma,
 *         séparées par une baie vitrée et reliées par une véranda. PI et
 *         Sigma s'étalent de Villa Joell jusqu'aux toilettes et forment un L
 *         avec NP (au-dessus de la salle B).
 *   Devant : pas de cour, un parking à motos de la taille de Villa Joell,
 *         vers le centre, dans l'axe du portail.
 *   Toit : le fameux Rooftop, c'est TOUT le toit, au-dessus de PI, Sigma et NP.
 * Recoupé avec la photo du campus publiée par HEI (public/hei/) : véranda en
 * L à garde-corps noirs, galerie à poteaux sous l'aile de droite, toile tendue
 * sur une partie du toit. Les escaliers ne sont pas représentés.
 */

export type Localized = { fr: string; en: string };
export type FloorId = "rdc" | "r1" | "toit";
export type RoomKind = "class" | "lab" | "admin" | "service" | "outdoor" | "circulation";
/** Rectangle au sol : x, z (coin nord-ouest), largeur w (x), profondeur d (z). */
export type Rect = [number, number, number, number];

export type Floor = { id: FloorId; level: number; name: Localized; short: Localized };

export type Room = {
  id: string;
  floor: FloorId;
  kind: RoomKind;
  name: Localized;
  desc: Localized;
  rect: Rect;
  /** forme en plusieurs rectangles (le Rooftop en L), pour le mini-plan */
  shape?: Rect[];
};

/** Hauteur d'un niveau (m). PLACEHOLDER : valeur courante, non mesurée. */
export const FLOOR_HEIGHT = 3.4;

/** Emprise totale du bâti, pour le mini-plan. PLACEHOLDER (estimée). */
export const FOOTPRINT = { x: 0, w: 31, d: 17 };

export const FLOORS: Floor[] = [
  { id: "rdc", level: 0, name: { fr: "Rez-de-chaussée", en: "Ground floor" }, short: { fr: "RDC", en: "GF" } },
  { id: "r1", level: 1, name: { fr: "1er étage", en: "1st floor" }, short: { fr: "1er", en: "1st" } },
  { id: "toit", level: 2, name: { fr: "Rooftop", en: "Rooftop" }, short: { fr: "Toit", en: "Roof" } },
];

/** Dalles bâties par niveau. PLACEHOLDER : dimensions estimées. */
export const SLABS: Record<FloorId, Rect[]> = {
  rdc: [
    [0, 0, 24, 7], // rangée du fond : Villa Joell, salle des profs, cuisine, WC
    [24, 0, 7, 16], // aile de droite, perpendiculaire : salle B
  ],
  r1: [
    [0, 0, 24, 7], // ALGÈBRE (PI + Sigma) sur toute la longueur
    [24, 0, 7, 16], // NP, au-dessus de la salle B : le L
  ],
  // le Rooftop : tout le toit, en L, au-dessus de PI, Sigma et NP
  toit: [
    [0, 0, 24, 7],
    [24, 0, 7, 16],
  ],
};

/** Contour du toit en L (pour le muret du Rooftop), dans l'ordre. */
export const ROOF_OUTLINE: [number, number][] = [
  [0, 0], [31, 0], [31, 16], [24, 16], [24, 7], [0, 7],
];

/** La toile tendue sur une partie du Rooftop (vue sur la photo). PLACEHOLDER. */
export const CANOPY: Rect = [3, 0.6, 14, 5.8];

/** Mur d'enceinte autour de l'école, avec le portail (ouverture) devant Villa Joell.
 *  PLACEHOLDER : tracé et hauteur estimés. */
export const ENCLOSURE = { x0: -2, z0: -2, x1: 33, z1: 17.5, height: 2.2, gate: [10.5, 17.5] as [number, number] }; // portail dans l'axe du parking

/** Véranda du 1er étage, en L, côté parking : devant PI et Sigma, puis devant NP.
 *  Au RDC, des poteaux la portent (galerie). PLACEHOLDER : largeurs estimées. */
export const VERANDAS: Rect[] = [
  [0, 7, 24, 2],
  [22, 9, 2, 7],
];

/** Baie vitrée entre PI et Sigma (segment au sol, au 1er). PLACEHOLDER : position estimée. */
export const GLASS_BAY = { x: 10.9, z0: 0, z1: 7 };

export const ROOMS: Room[] = [
  // ─── Rez-de-chaussée ───
  {
    id: "villa-joell",
    floor: "rdc",
    kind: "admin",
    name: { fr: "Villa Joell", en: "Villa Joell" },
    desc: {
      fr: "Le bureau de l'administration, juste à l'entrée : c'est ici qu'on s'adresse en premier (inscription, attestations, questions). Ouvert du lundi au vendredi, 8 h-12 h et 13 h-16 h.",
      en: "The administration office, right at the entrance: your first stop for enrolment, certificates and questions. Open Monday to Friday, 8am-12pm and 1pm-4pm.",
    },
    rect: [0, 0, 9, 7], // PLACEHOLDER : dimensions estimées
  },
  {
    id: "salle-profs",
    floor: "rdc",
    kind: "admin",
    name: { fr: "Salle des profs", en: "Staff room" },
    desc: {
      fr: "À droite de Villa Joell. Les formateurs s'y retrouvent entre deux cours : frappe avant d'entrer.",
      en: "To the right of Villa Joell. Trainers meet here between classes: knock before you go in.",
    },
    rect: [9, 0, 6, 7], // PLACEHOLDER
  },
  {
    id: "cuisine",
    floor: "rdc",
    kind: "service",
    name: { fr: "Cuisine", en: "Kitchen" },
    desc: {
      fr: "À droite de la salle des profs. Pour réchauffer ton repas ; on la laisse propre en partant.",
      en: "To the right of the staff room. To heat up your lunch; leave it clean when you go.",
    },
    rect: [15, 0, 5, 7], // PLACEHOLDER
  },
  {
    id: "salle-b",
    floor: "rdc",
    kind: "class",
    name: { fr: "Salle B", en: "Room B" },
    desc: {
      fr: "Face au mur des toilettes, tourne à droite, avance de 3 m, puis tourne encore à droite : c'est la salle B.",
      en: "Facing the restroom wall, turn right, walk 3 m, then turn right again: that's Room B.",
    },
    rect: [24, 3, 7, 13], // PLACEHOLDER : longueur estimée
  },
  {
    id: "parking",
    floor: "rdc",
    kind: "outdoor",
    name: { fr: "Parking motos", en: "Motorbike parking" },
    desc: {
      fr: "Pas de cour à HEI : le parking des deux-roues est juste derrière le portail, dans son axe. Scooters, motos de compétition, roadsters, et au milieu un Toyota Fortuner : gare-toi droit, nez vers l'extérieur.",
      en: "There's no courtyard at HEI: the two-wheeler parking is right behind the gate, in line with it. Scooters, racing bikes, roadsters, and a Toyota Fortuner in the middle: park straight, nose facing out.",
    },
    rect: [9.5, 9, 9, 7], // mêmes dimensions que Villa Joell, vers le centre, dans l'axe du portail
  },

  // ─── 1er étage ───
  {
    id: "pi",
    floor: "r1",
    kind: "class",
    name: { fr: "Salle PI", en: "Room PI" },
    desc: {
      fr: "Au-dessus de Villa Joell. Avec Sigma, elle forme la salle ALGÈBRE ; une baie vitrée les sépare, la véranda les relie.",
      en: "Above Villa Joell. Together with Sigma it makes up the ALGÈBRE room; a glass bay separates them, the veranda links them.",
    },
    rect: [0, 0, 10.9, 7], // PLACEHOLDER : de Villa Joell…
  },
  {
    id: "sigma",
    floor: "r1",
    kind: "class",
    name: { fr: "Salle Sigma", en: "Room Sigma" },
    desc: {
      fr: "L'autre moitié de la salle ALGÈBRE, derrière la baie vitrée. Elle file jusqu'à l'angle, où elle touche la salle NP : ensemble, elles forment un L.",
      en: "The other half of the ALGÈBRE room, behind the glass bay. It runs to the corner, where it meets Room NP: together they form an L.",
    },
    rect: [10.9, 0, 13.1, 7], // PLACEHOLDER : …jusqu'à l'angle, où elle touche NP
  },
  {
    id: "veranda",
    floor: "r1",
    kind: "circulation",
    name: { fr: "Véranda", en: "Veranda" },
    desc: {
      fr: "En L, côté parking : elle longe PI et Sigma, puis NP. C'est par là qu'on passe de la salle PI à la salle Sigma.",
      en: "L-shaped, on the parking side: it runs along PI and Sigma, then NP. This is how you go from Room PI to Room Sigma.",
    },
    rect: [0, 7, 24, 2],
  },
  {
    id: "np",
    floor: "r1",
    kind: "class",
    name: { fr: "Salle NP", en: "Room NP" },
    desc: {
      fr: "Au-dessus de la salle B, dans l'aile de droite : avec Sigma, elle forme le L de l'étage.",
      en: "Above Room B, in the right-hand wing: together with Sigma it forms the L of the upper floor.",
    },
    rect: [24, 0, 7, 16], // PLACEHOLDER : toute l'aile, elle touche Sigma
  },

  // ─── Toit ───
  {
    id: "rooftop",
    floor: "toit",
    kind: "outdoor",
    name: { fr: "Le Rooftop", en: "The Rooftop" },
    desc: {
      fr: "Tout en haut de HEI, le fameux Rooftop : tout le toit, au-dessus de PI, Sigma et NP. Pour souffler, réviser à plusieurs ou regarder Tana d'en haut.",
      en: "At the very top of HEI, the famous Rooftop: the whole roof, above PI, Sigma and NP. To take a breath, revise together or look at Tana from above.",
    },
    rect: [0, 0, 24, 7],
    shape: [
      [0, 0, 24, 7],
      [24, 0, 7, 16],
    ],
  },
];

/** Accès rapides pour l'interface. */
export const roomsOn = (floor: FloorId) => ROOMS.filter((r) => r.floor === floor);
export const floorOf = (id: FloorId) => FLOORS.find((f) => f.id === id)!;
export const roomById = (id: string) => ROOMS.find((r) => r.id === id);
