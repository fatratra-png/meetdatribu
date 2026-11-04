/** Seuil du scroll (0..1) où l'intro se termine et où la visite commence.
 *  Dans un fichier à part : l'interface le lit sans charger le moteur 3D. */
export const EXPLORE_AT = 0.72;

/** Étapes de l'intro, pour la légende affichée (début de chaque étape). */
export const INTRO_STEPS = [0, 0.12, 0.38, 0.52, EXPLORE_AT] as const;
