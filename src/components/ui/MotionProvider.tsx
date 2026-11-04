"use client";

import { MotionConfig } from "motion/react";

// reducedMotion="user" : Framer Motion coupe ses animations de déplacement
// si le système de l'utilisateur demande moins d'animations.
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
