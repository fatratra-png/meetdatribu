import { create } from "zustand";

// Valeur partagée entre GSAP (qui écrit) et Three.js (qui lit).
// GSAP gère le scroll ; le canvas 3D ne fait que lire `glass` à chaque image.
type ScrollState = {
  /** progression globale de la page, de 0 à 1 */
  progress: number;
  /** progression de la chronologie du verre, de 0 à 1 (voir engine.md) */
  glass: number;
  /** vitesse de défilement Lenis (px/image), utile pour des effets d'inertie */
  velocity: number;
  setProgress: (p: number) => void;
  setGlass: (g: number) => void;
  setVelocity: (v: number) => void;
};

export const useScrollStore = create<ScrollState>((set) => ({
  progress: 0,
  glass: 0,
  velocity: 0,
  setProgress: (progress) => set({ progress }),
  setGlass: (glass) => set({ glass }),
  setVelocity: (velocity) => set({ velocity }),
}));
