"use client";

import { useSyncExternalStore } from "react";

// Vrai si l'utilisateur a demandé moins d'animations dans son système.
// useSyncExternalStore évite tout décalage d'hydratation : côté serveur,
// on suppose « pas de réduction » puis le navigateur corrige.
const query = "(prefers-reduced-motion: reduce)";

function subscribe(cb: () => void) {
  const mq = window.matchMedia(query);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

export function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
