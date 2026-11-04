/**
 * Les deux-roues du parking, en volumes simples (même registre que la
 * maquette : formes propres, arêtes arrondies, pas de détail réaliste).
 * Trois silhouettes : scooter, moto de compétition (carénée), roadster.
 * Plus un SUV au centre (gabarit d'un Toyota Fortuner, stylisé, sans logo).
 * Géométries et matériaux partagés : 14 motos restent légères à dessiner.
 * Une moto est orientée le long de l'axe z, l'avant vers -z.
 */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export type BikeKind = "scooter" | "sport" | "roadster";

const rb = (w: number, h: number, d: number, r = 0.05) => new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2));

/** Géométries communes, créées une fois. */
function makeGeometries() {
  const wheel = (r: number) => {
    const g = new THREE.TorusGeometry(r, r * 0.32, 8, 20);
    g.rotateY(Math.PI / 2); // roue dans le plan y-z
    return g;
  };
  return {
    wheelSmall: wheel(0.17),
    wheelBig: wheel(0.24),
    // scooter
    scFloor: rb(0.3, 0.1, 0.62),
    scShield: rb(0.38, 0.62, 0.14, 0.07),
    scRear: rb(0.36, 0.34, 0.6, 0.12),
    scSeat: rb(0.3, 0.08, 0.5, 0.04),
    // compétition
    spFairing: rb(0.36, 0.42, 0.9, 0.14),
    spTail: rb(0.28, 0.14, 0.5, 0.05),
    spScreen: rb(0.26, 0.2, 0.04, 0.02),
    spSeat: rb(0.26, 0.06, 0.34, 0.03),
    // roadster
    rdTank: rb(0.34, 0.24, 0.5, 0.1),
    rdEngine: rb(0.3, 0.3, 0.45, 0.05),
    rdSeat: rb(0.28, 0.08, 0.5, 0.04),
    // commun
    bar: rb(0.62, 0.04, 0.04, 0.02),
    fork: rb(0.05, 0.6, 0.05, 0.02),
  };
}

type Geos = ReturnType<typeof makeGeometries>;

export function createBikeFactory(materials: THREE.MeshStandardMaterial[]) {
  const g: Geos = makeGeometries();
  const mk = (color: string, roughness = 0.5, metalness = 0.15) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness, metalness });
    m.userData.baseOpacity = 1;
    materials.push(m);
    return m;
  };
  const tyre = mk("#1b1d22", 0.9, 0);
  const dark = mk("#2b2f38", 0.6, 0.2);
  const chrome = mk("#c9ccd2", 0.25, 0.8);
  const paints = new Map<string, THREE.MeshStandardMaterial>();
  const paint = (c: string) => paints.get(c) ?? (paints.set(c, mk(c, 0.35, 0.25)), paints.get(c)!);

  const add = (grp: THREE.Group, geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, rx = 0) => {
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(x, y, z);
    mesh.rotation.x = rx;
    grp.add(mesh);
    return mesh;
  };

  return function bike(kind: BikeKind, color: string) {
    const grp = new THREE.Group();
    grp.name = `moto-${kind}`;
    const body = paint(color);
    if (kind === "scooter") {
      const r = 0.17 * 1.32;
      add(grp, g.wheelSmall, tyre, 0, r, -0.55);
      add(grp, g.wheelSmall, tyre, 0, r, 0.5);
      add(grp, g.scFloor, body, 0, 0.3, -0.02);
      add(grp, g.scShield, body, 0, 0.62, -0.42, -0.18);
      add(grp, g.scRear, body, 0, 0.5, 0.36);
      add(grp, g.scSeat, dark, 0, 0.71, 0.3);
      add(grp, g.fork, chrome, 0, 0.62, -0.52, -0.25);
      add(grp, g.bar, dark, 0, 0.98, -0.5);
    } else if (kind === "sport") {
      const r = 0.24 * 1.32;
      add(grp, g.wheelBig, tyre, 0, r, -0.68);
      add(grp, g.wheelBig, tyre, 0, r, 0.68);
      add(grp, g.spFairing, body, 0, 0.62, -0.12, 0.12);
      add(grp, g.spTail, body, 0, 0.86, 0.5, -0.22);
      add(grp, g.spScreen, chrome, 0, 0.88, -0.52, -0.55);
      add(grp, g.spSeat, dark, 0, 0.84, 0.22);
      add(grp, g.fork, chrome, 0, 0.55, -0.62, -0.3);
    } else {
      const r = 0.24 * 1.32;
      add(grp, g.wheelBig, tyre, 0, r, -0.66);
      add(grp, g.wheelBig, tyre, 0, r, 0.66);
      add(grp, g.rdEngine, chrome, 0, 0.5, 0.0);
      add(grp, g.rdTank, body, 0, 0.84, -0.12);
      add(grp, g.rdSeat, dark, 0, 0.83, 0.32);
      add(grp, g.fork, chrome, 0, 0.62, -0.6, -0.3);
      add(grp, g.bar, chrome, 0, 1.0, -0.48);
    }
    return grp;
  };
}

/**
 * Le parking : 14 motos en deux colonnes le long de z, allée au milieu.
 * Celles de gauche ont le nez tourné vers la gauche (ouest), celles de
 * droite vers la droite (est).
 */
export function parkBikes(bike: ReturnType<typeof createBikeFactory>, [px, pz, pw, pd]: [number, number, number, number]) {
  const out = new THREE.Group();
  out.name = "parking-motos";
  const kinds: BikeKind[] = ["scooter", "sport", "roadster", "scooter", "scooter", "sport", "roadster"];
  const colors = ["#c8102e", "#1d3f94", "#1b1d22", "#f4f1ea", "#dfa408", "#2a52c4", "#0b6e4f", "#8891a0"];
  const zs: number[] = [];
  for (let z = pz + 0.6; z < pz + pd - 0.4; z += 0.92) zs.push(z);
  let n = 0;
  // rotation.y : +π/2 envoie le nez (−z local) vers −x (gauche), −π/2 vers +x (droite)
  for (const [col, x, yaw] of [[0, px + 1.0, Math.PI / 2], [1, px + pw - 1.0, -Math.PI / 2]] as const) {
    zs.forEach((z, i) => {
      const seed = (((i + 1) * 9301 + (col + 1) * 49297) % 233280) / 233280; // pseudo-aléatoire stable
      const b = bike(kinds[(i + col * 3) % kinds.length], colors[n++ % colors.length]);
      b.position.set(x, 0.06, z);
      b.rotation.y = yaw + (seed - 0.5) * 0.2;
      out.add(b);
    });
  }
  return out;
}

/**
 * Le SUV garé au centre du parking (gabarit d'un Toyota Fortuner : environ
 * 4,8 × 1,85 × 1,8 m), stylisé comme le reste : caisse haute, vitres teintées,
 * gros pneus, barres de toit. Orienté le long de z, nez vers -z.
 */
export function createSuv(materials: THREE.MeshStandardMaterial[]) {
  const mk = (color: string, roughness: number, metalness: number) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness, metalness });
    m.userData.baseOpacity = 1;
    materials.push(m);
    return m;
  };
  const paint = mk("#3a3f47", 0.3, 0.5);
  const glass = mk("#141820", 0.15, 0.6);
  const tyre = mk("#1b1d22", 0.9, 0);
  const rim = mk("#c9ccd2", 0.3, 0.8);
  const light = mk("#f4f1ea", 0.2, 0.1);
  const grp = new THREE.Group();
  grp.name = "suv-fortuner";
  const add = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number) => {
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(x, y, z);
    grp.add(mesh);
    return mesh;
  };
  // caisse basse et cabine
  add(rb(1.85, 0.82, 4.8, 0.16), paint, 0, 0.86, 0);
  add(rb(1.72, 0.66, 2.9, 0.14), paint, 0, 1.58, 0.35);
  // vitres : un bandeau teinté légèrement en retrait de la cabine
  add(rb(1.76, 0.42, 2.7, 0.1), glass, 0, 1.6, 0.35);
  // barres de toit
  for (const x of [-0.7, 0.7]) add(rb(0.06, 0.06, 2.4, 0.02), rim, x, 1.95, 0.35);
  // calandre et phares (avant = -z)
  add(rb(1.4, 0.3, 0.06, 0.03), glass, 0, 0.92, -2.41);
  for (const x of [-0.72, 0.72]) add(rb(0.34, 0.12, 0.06, 0.03), light, x, 1.1, -2.41);
  // roues
  const wheel = new THREE.TorusGeometry(0.3, 0.13, 10, 24);
  wheel.rotateY(Math.PI / 2);
  const hub = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16);
  hub.rotateZ(Math.PI / 2);
  for (const x of [-0.86, 0.86]) {
    for (const z of [-1.5, 1.45]) {
      add(wheel, tyre, x, 0.43, z);
      add(hub, rim, x * 1.04, 0.43, z);
    }
  }
  return grp;
}
