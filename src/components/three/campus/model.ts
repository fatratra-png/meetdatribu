/**
 * Maquette stylisée du campus HEI, construite en code (Blender n'est pas
 * installé : pas de .glb). Volumes propres, arêtes arrondies, socle, et les
 * couleurs du site : blanc cassé pour la structure, nuances du navy HEI pour
 * les salles, or HEI pour le chemin d'entrée et la salle choisie.
 * L'agencement vient de src/content/campus.ts (SLABS, VERANDAS, GLASS_BAY,
 * STAIRS, ROOF_OUTLINE, CANOPY, ROOMS). Chaque niveau est un groupe nommé `floor-<id>`, chaque salle un
 * mesh nommé `room-<id>`.
 */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import {
  FLOOR_HEIGHT,
  FLOORS,
  GLASS_BAY,
  ROOMS,
  SLABS,
  CANOPY as CANOPY_RECT,
  ROOF_OUTLINE,
  STAIRS,
  VERANDAS,
  type FloorId,
  type Rect,
  type RoomKind,
} from "@/content/campus";

/** Couleur des salles par type : des nuances, pas des teintes (color-and-brand-discipline). */
const KIND_COLOR: Record<RoomKind, string> = {
  class: "#2a52c4",
  lab: "#3a6ee8",
  admin: "#1d3f94",
  service: "#8891a0",
  circulation: "#c9cfdb",
  outdoor: "#c9cfdb",
};
const STRUCTURE = "#f4f1ea";
const BASE = "#e6e0d4";
const COURT = "#d6ccb8";
const CANOPY = "#e8cfa3";
export const GOLD = "#dfa408";
/** Le centre de la maquette (m) : cible des vues d'ensemble. */
export const MODEL_CENTER = new THREE.Vector3(14, 2, 9.5);

export type FloorNode = { id: FloorId; level: number; group: THREE.Group; materials: THREE.MeshStandardMaterial[] };
export type RoomNode = { id: string; floor: FloorId; mesh: THREE.Mesh | null; anchor: THREE.Object3D; base: THREE.Color };

/** Matériau mat, rangé dans la liste de son niveau (pour pouvoir estomper un niveau seul). */
function mat(color: string, list: THREE.MeshStandardMaterial[], opts: THREE.MeshStandardMaterialParameters = {}) {
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0, ...opts });
  // opacité « de base » (la vitre est déjà transparente) : le fondu la multiplie
  m.userData.baseOpacity = opts.opacity ?? 1;
  list.push(m);
  return m;
}

function box(w: number, h: number, d: number, r: number, m: THREE.Material) {
  return new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2)), m);
}

/** Pose une boîte sur un rectangle au sol (x, z, w, d), de y à y + h. */
function onRect([x, z, w, d]: Rect, y: number, h: number, r: number, m: THREE.Material, inset = 0) {
  const b = box(w - inset * 2, h, d - inset * 2, r, m);
  b.position.set(x + w / 2, y + h / 2, z + d / 2);
  return b;
}

export function buildCampus() {
  const root = new THREE.Group();
  root.name = "campus";
  const shared: THREE.MeshStandardMaterial[] = [];
  const floors = new Map<FloorId, FloorNode>();
  const rooms = new Map<string, RoomNode>();

  // ── socle, cour, chemin d'entrée vers Villa Joell ──
  const base = box(40, 0.8, 25, 0.35, mat(BASE, shared));
  base.position.set(MODEL_CENTER.x, -0.4, MODEL_CENTER.z);
  base.name = "socle";
  root.add(base);
  const cour = ROOMS.find((r) => r.id === "cour");
  if (cour) root.add(onRect(cour.rect, 0, 0.06, 0.03, mat(COURT, shared)));
  // le chemin vers l'entrée, en or : il dit « c'est par ici »
  // (le tapis rouge de la photo mène à la porte de Villa Joell)
  const pathMesh = onRect([3.4, 7, 1.2, 12], 0.03, 0.08, 0.03, mat(GOLD, shared, { roughness: 0.6 }));
  pathMesh.name = "chemin-entree";
  root.add(pathMesh);
  for (const x of [2.1, 5.9]) {
    const pillar = box(0.6, 2.2, 0.6, 0.08, mat(STRUCTURE, shared)); // portail
    pillar.position.set(x, 1.1, 18.7);
    root.add(pillar);
  }
  const leaf = mat("#8fa58a", shared, { flatShading: true });
  const trunk = mat("#a08f78", shared);
  for (const [x, z, s] of [[14, 15, 1.1], [18, 12, 0.85]] as const) {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.4, 8), trunk);
    t.position.set(x, 0.7, z);
    const c = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1 * s, 0), leaf);
    c.position.set(x, 1.4 + 0.9 * s, z);
    root.add(t, c);
  }

  // ── niveaux ──
  for (const f of FLOORS) {
    const group = new THREE.Group();
    group.name = `floor-${f.id}`;
    group.position.y = f.level * FLOOR_HEIGHT;
    const materials: THREE.MeshStandardMaterial[] = [];
    const structure = mat(STRUCTURE, materials);

    // dalles du niveau
    for (const r of SLABS[f.id]) group.add(onRect(r, 0, 0.3, 0.12, structure));

    if (f.id === "rdc") {
      // galerie : les poteaux qui portent la véranda du 1er, côté cour
      for (const [vx, vz, vw, vd] of VERANDAS) {
        const along = vw > vd;
        const n = Math.max(2, Math.round((along ? vw : vd) / 3.5));
        for (let i = 0; i <= n; i++) {
          const k = i / n;
          const col = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, FLOOR_HEIGHT, 10), structure);
          col.position.set(along ? vx + 0.3 + k * (vw - 0.6) : vx + 0.25, FLOOR_HEIGHT / 2, along ? vz + vd - 0.25 : vz + 0.3 + k * (vd - 0.6));
          group.add(col);
        }
      }
    }

    // escaliers extérieurs : une volée du RDC au 1er (dans le groupe du RDC)
    if (f.id === "rdc") {
      const stepMat = mat("#d9d3c6", materials);
      for (const { rect: [sx, sz, sw, sd], rise } of STAIRS) {
        const steps = 12;
        const alongX = rise === "west" || rise === "east";
        const len = alongX ? sw : sd;
        const run = len / steps;
        for (let i = 0; i < steps; i++) {
          const h = ((i + 1) / steps) * FLOOR_HEIGHT;
          // la marche i est à la distance i * run du BAS de la volée
          const d = i * run + run / 2;
          const x = rise === "east" ? sx + d : rise === "west" ? sx + sw - d : sx + sw / 2;
          const z = rise === "south" ? sz + d : rise === "north" ? sz + sd - d : sz + sd / 2;
          const step = box(alongX ? run + 0.02 : sw, h, alongX ? sd : run + 0.02, 0.03, stepMat);
          step.position.set(x, h / 2, z);
          group.add(step);
        }
      }
    }

    if (f.id === "r1") {
      // paliers en haut des escaliers, qui rejoignent la véranda
      for (const st of STAIRS) if (st.landing) group.add(onRect(st.landing, 0, 0.22, 0.08, structure));
      // véranda en L côté cour, avec garde-corps (noirs sur la photo, ici en navy)
      const rail = mat("#1d2433", materials);
      for (const [vx, vz, vw, vd] of VERANDAS) {
        group.add(onRect([vx, vz, vw, vd], 0, 0.22, 0.08, structure));
        const along = vw > vd;
        group.add(onRect(along ? [vx, vz + vd - 0.08, vw - 2, 0.06] : [vx, vz, 0.06, vd], 1.0, 0.06, 0.02, rail));
      }
      // baie vitrée entre PI et Sigma
      const glass = mat("#bcd4ff", materials, { transparent: true, opacity: 0.38, roughness: 0.1, metalness: 0.1 });
      const bay = box(0.08, 2.7, GLASS_BAY.z1 - GLASS_BAY.z0, 0.02, glass);
      bay.position.set(GLASS_BAY.x, 0.3 + 1.35, (GLASS_BAY.z0 + GLASS_BAY.z1) / 2);
      bay.name = "baie-vitree";
      group.add(bay);
    }

    if (f.id === "toit") {
      // le Rooftop : un seul toit-terrasse en L, avec son muret sur le contour
      for (let i = 0; i < ROOF_OUTLINE.length; i++) {
        const [ax, az] = ROOF_OUTLINE[i];
        const [bx, bz] = ROOF_OUTLINE[(i + 1) % ROOF_OUTLINE.length];
        const len = Math.hypot(bx - ax, bz - az);
        const wall = box(ax === bx ? 0.25 : len, 0.7, ax === bx ? len : 0.25, 0.06, structure);
        wall.position.set((ax + bx) / 2, 0.65, (az + bz) / 2);
        group.add(wall);
      }
    }

    // salles
    for (const r of ROOMS.filter((room) => room.floor === f.id)) {
      const [x, z, w, d] = r.rect;
      const anchor = new THREE.Object3D();
      anchor.name = `anchor-${r.id}`;
      group.add(anchor);
      let mesh: THREE.Mesh | null = null;

      if (r.kind === "outdoor" && f.id === "toit") {
        // le Rooftop : tout le toit ; une toile y fait le ventre, sur 4 poteaux
        const [cx, cz, cw, cd] = CANOPY_RECT;
        const geo = new THREE.PlaneGeometry(cw, cd, 24, 12);
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const u = pos.getX(i) / cw + 0.5;
          const v = pos.getY(i) / cd + 0.5;
          pos.setZ(i, -0.5 * Math.sin(Math.PI * u) * Math.sin(Math.PI * v));
        }
        geo.computeVertexNormals();
        mesh = new THREE.Mesh(geo, mat(CANOPY, materials, { side: THREE.DoubleSide, roughness: 0.95 }));
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(cx + cw / 2, 3.0, cz + cd / 2);
        for (const [px, pz] of [[cx, cz], [cx + cw, cz], [cx, cz + cd], [cx + cw, cz + cd]]) {
          const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3, 8), structure);
          post.position.set(px, 1.5, pz);
          group.add(post);
        }
        // le point du Rooftop : au coin du L, au centre du toit
        anchor.position.set(22, 1.4, 4);
      } else if (r.kind === "outdoor") {
        // la cour : pas de volume, un repère au sol
        anchor.position.set(x + w / 2 + 2, 0.6, z + d / 2);
      } else if (r.kind === "circulation") {
        // la véranda : son volume est la dalle et le garde-corps
        anchor.position.set(x + w / 2, 1.4, z + d / 2);
      } else {
        mesh = onRect(r.rect, 0.3, 2.7, 0.14, mat(KIND_COLOR[r.kind], materials, { roughness: 0.7 }), 0.18);
        anchor.position.set(x + w / 2, 3.5, z + d / 2);
      }
      if (mesh) {
        mesh.name = `room-${r.id}`;
        mesh.userData.roomId = r.id;
        group.add(mesh);
      }
      // couleur d'origine, pour revenir après une sélection (en or)
      const baseColor = mesh
        ? (mesh.material as THREE.MeshStandardMaterial).color.clone()
        : new THREE.Color(KIND_COLOR[r.kind]);
      rooms.set(r.id, { id: r.id, floor: f.id, mesh, anchor, base: baseColor });
    }

    root.add(group);
    floors.set(f.id, { id: f.id, level: f.level, group, materials });
  }

  // ombre de contact douce sous le socle (texture dégradée, pas de shadow map)
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 10, 64, 64, 64);
  g.addColorStop(0, "rgba(0,0,0,0.45)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const shadowTex = new THREE.CanvasTexture(c);
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(58, 40),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(MODEL_CENTER.x, -0.82, MODEL_CENTER.z);
  root.add(shadow);

  return { root, floors, rooms, shadowTex };
}
