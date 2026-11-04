/**
 * UN SEUL contexte WebGL pour tout le site.
 * Le verre (accueil) et la maquette du campus partagent le même
 * WebGLRenderer : son <canvas> est déplacé dans la section qui s'affiche
 * (`claimRenderer`). Les deux scènes ne sont jamais à l'écran en même temps,
 * et chaque moteur ne dessine que s'il possède le canvas (`ownsRenderer`).
 */
import * as THREE from "three";

let renderer: THREE.WebGLRenderer | null = null;
let host: HTMLElement | null = null;

/** Crée le renderer au premier appel (lève une erreur si WebGL est absent). */
export function getSharedRenderer() {
  if (!renderer) {
    const canvas = document.createElement("canvas");
    canvas.className = "webgl-shared";
    canvas.setAttribute("aria-hidden", "true");
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
  }
  return renderer;
}

/** Déplace le canvas dans `el` ; renvoie vrai si le propriétaire a changé. */
export function claimRenderer(el: HTMLElement) {
  const r = getSharedRenderer();
  if (host === el && r.domElement.parentElement === el) return false;
  el.appendChild(r.domElement);
  host = el;
  return true;
}

export const ownsRenderer = (el: HTMLElement) => host === el;
