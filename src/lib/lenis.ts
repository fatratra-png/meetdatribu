import type Lenis from "lenis";

// Référence vers l'instance Lenis active, pour pouvoir faire
// `getLenis()?.scrollTo('#section')` depuis n'importe quel composant.
let instance: Lenis | null = null;

export const setLenis = (l: Lenis | null) => {
  instance = l;
};
export const getLenis = () => instance;
