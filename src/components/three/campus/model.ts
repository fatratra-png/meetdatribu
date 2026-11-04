/**
 * Maquette stylisée du campus HEI, construite en code (Blender n'est pas
 * installé : pas de .glb). Volumes propres, arêtes arrondies, socle, et les
 * couleurs du site : blanc cassé pour la structure, nuances du navy HEI pour
 * les salles, or HEI pour le chemin d'entrée et la salle choisie.
 * L'agencement vient de src/content/campus.ts (SLABS, VERANDAS, GLASS_BAY,
 * ENCLOSURE, ROOF_OUTLINE, CANOPY, ROOMS). Les escaliers ne sont pas représentés. Chaque niveau est un groupe nommé `floor-<id>`, chaque salle un
 * mesh nommé `room-<id>`.
 */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { createBikeFactory, parkBikes } from "./bikes";
import {
  FLOOR_HEIGHT,
  FLOORS,
  GLASS_BAY,
  ROOMS,
  SLABS,
  CANOPY as CANOPY_RECT,
  ENCLOSURE,
  ROOF_OUTLINE,
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
const CANOPY = "#e8cfa3";
export const GOLD = "#dfa408";
/** Le centre de la maquette (m) : cible des vues d'ensemble. */
export const MODEL_CENTER = new THREE.Vector3(14, 2, 8);

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

  // ── socle, parking motos, allée d'entrée vers Villa Joell ──
  const base = box(38, 0.8, 22, 0.35, mat(BASE, shared));
  base.position.set(15.5, -0.4, 7.75);
  base.name = "socle";
  root.add(base);
  // pas de cour : un parking à motos, de la taille de Villa Joell, devant l'entrée
  const parking = ROOMS.find((r) => r.id === "parking");
  if (parking) {
    const [px, pz, pw, pd] = parking.rect;
    root.add(onRect(parking.rect, 0, 0.05, 0.03, mat("#8a8d93", shared, { roughness: 0.95 })));
    // marquage au sol : une ligne blanche par rangée
    const line = mat("#f4f1ea", shared);
    for (const z of [pz + 0.3, pz + pd - 0.3]) root.add(onRect([px + 0.2, z - 0.04, pw - 0.4, 0.08], 0.05, 0.02, 0.01, line));
    root.add(parkBikes(createBikeFactory(shared), parking.rect, [3.4, 4.6]));
  }
  // l'allée vers la porte de Villa Joell, en or : elle dit « c'est par ici »
  const pathMesh = onRect([3.4, 7, 1.2, ENCLOSURE.z1 - 7], 0.03, 0.08, 0.03, mat(GOLD, shared, { roughness: 0.6 }));
  pathMesh.name = "chemin-entree";
  root.add(pathMesh);

  // mur d'enceinte tout autour de l'école, ouvert sur le portail devant Villa Joell
  const { x0, z0, x1, z1, height, gate } = ENCLOSURE;
  const wallMat = mat("#cfc6b6", shared);
  const wall = (r: Rect) => root.add(onRect(r, 0, height, 0.06, wallMat));
  wall([x0, z0, x1 - x0, 0.25]); // nord
  wall([x0, z0, 0.25, z1 - z0]); // ouest
  wall([x1 - 0.25, z0, 0.25, z1 - z0]); // est
  wall([x0, z1 - 0.25, gate[0] - x0, 0.25]); // sud, à gauche du portail
  wall([gate[1], z1 - 0.25, x1 - gate[1], 0.25]); // sud, à droite du portail
  // grand portail : deux piliers hauts et une traverse au-dessus de l'ouverture
  const gateMat = mat(STRUCTURE, shared);
  const pillarH = height + 1.2;
  for (const x of gate) {
    const pillar = box(0.9, pillarH, 0.9, 0.1, gateMat);
    pillar.position.set(x, pillarH / 2, z1 - 0.12);
    root.add(pillar);
  }
  const lintel = box(gate[1] - gate[0] + 0.9, 0.35, 0.5, 0.08, gateMat);
  lintel.position.set((gate[0] + gate[1]) / 2, pillarH - 0.18, z1 - 0.12);
  root.add(lintel);

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
      // galerie : les poteaux qui portent la véranda du 1er, côté parking
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

    if (f.id === "r1") {
      // véranda en L côté parking, avec garde-corps (noirs sur la photo, ici en navy)
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
        // le parking : pas de volume propre, le repère flotte au-dessus des motos
        anchor.position.set(x + w / 2 + 2.2, 1.7, z + d / 2);
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
  shadow.position.set(15.5, -0.82, 7.75);
  root.add(shadow);

  return { root, floors, rooms, shadowTex };
}
