/**
 * Moteur de la visite 3D du campus. Three.js « brut », comme le verre, et
 * sur le MÊME renderer (sharedRenderer.ts) : un seul contexte WebGL.
 *
 * Deux régimes :
 *  - INTRO, pilotée par le scroll (p de 0 à EXPLORE_AT) : vue du ciel,
 *    demi-tour, plongée vers l'entrée, puis recul en vue 3/4 pendant que
 *    les étages s'écartent et que le toit se soulève ;
 *  - VISITE (p ≥ EXPLORE_AT) : la caméra obéit à l'interface (salle choisie,
 *    étage, rotation au doigt ou automatique), avec des vols animés par GSAP.
 */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { gsap } from "gsap";
import { FLOOR_HEIGHT, type FloorId } from "@/content/campus";
import { buildCampus, GOLD, MODEL_CENTER } from "./model";
import { animatePeople } from "./people";
import { claimRenderer, getSharedRenderer, ownsRenderer } from "../sharedRenderer";
import { EXPLORE_AT } from "./constants";

const MAX_DPR = 1.75;
/** Écartement des niveaux une fois « éclatés » (m), par niveau. */
const LIFT = [0, 3.4, 8];
const CENTER = MODEL_CENTER;

type Pose = { pos: THREE.Vector3; target: THREE.Vector3 };
const pose = (px: number, py: number, pz: number, tx: number, ty: number, tz: number): Pose => ({
  pos: new THREE.Vector3(px, py, pz),
  target: new THREE.Vector3(tx, ty, tz),
});

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Pose sur une orbite autour de CENTER (angle en radians, 0 = côté entrée). */
function orbit(angle: number, radius: number, height: number): Pose {
  return {
    pos: new THREE.Vector3(CENTER.x + Math.sin(angle) * radius, height, CENTER.z + Math.cos(angle) * radius),
    target: CENTER.clone(),
  };
}

/** Pose de vue d'ensemble, une fois la maquette éclatée (vue 3/4 côté entrée). */
const OVERVIEW = pose(52, 50, 64, 13, 5, 8);
/** Devant le portail, à hauteur d'yeux : le parking dans l'axe, l'école derrière. */
const ENTRANCE = pose(14, 2.2, 22, 14, 2.0, 4);

export type HotspotPoint = { id: string; x: number; y: number; visible: boolean };

export type CampusEngineOptions = {
  /** Positions écran des points cliquables, à chaque image. */
  onFrame?: (points: HotspotPoint[]) => void;
  /** Un clic sur un volume de salle dans la 3D. */
  onPick?: (id: string) => void;
};

export class CampusEngine {
  private host: HTMLElement;
  private opts: CampusEngineOptions;
  private renderer = getSharedRenderer();
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(32, 1, 0.5, 400);
  private model = buildCampus();
  private envTexture: THREE.Texture;
  private size = { w: 1, h: 1 };

  private progress = 0;
  private explode = 0;
  private selected: string | null = null;
  private floor: FloorId | null = null;
  /** pose courante en visite, animée par GSAP */
  private view = { px: OVERVIEW.pos.x, py: OVERVIEW.pos.y, pz: OVERVIEW.pos.z, tx: OVERVIEW.target.x, ty: OVERVIEW.target.y, tz: OVERVIEW.target.z };
  private tween: gsap.core.Tween | null = null;
  /** rotation autour de la cible (glisser, ou rotation automatique) */
  private yaw = 0;
  private autoRotate = false;
  private lastInput = 0;
  private fade = new Map<FloorId, number>();

  private raf = 0;
  private running = false;
  private last = 0;
  private dirty = true;
  private raycaster = new THREE.Raycaster();
  private drag: { x: number; yaw: number; moved: boolean } | null = null;

  constructor(host: HTMLElement, opts: CampusEngineOptions = {}) {
    this.host = host;
    this.opts = opts;
    claimRenderer(host);

    // lumière : ciel blanc / sol navy, un soleil, et un studio doux pour les reflets
    this.scene.add(new THREE.HemisphereLight("#ffffff", "#1d3f94", 1.15));
    const sun = new THREE.DirectionalLight("#fff6e8", 2.1);
    sun.position.set(22, 34, 26);
    this.scene.add(sun);
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    this.scene.environment = this.envTexture;
    this.scene.environmentIntensity = 0.35;

    this.scene.add(this.model.root);
    this.model.floors.forEach((f) => this.fade.set(f.id, 1));
    this.setBackground("#000a1f");
    this.resize();

    host.addEventListener("pointerdown", this.onDown);
    window.addEventListener("pointermove", this.onMove, { passive: true });
    window.addEventListener("pointerup", this.onUp);
  }

  // ── réglages ─────────────────────────────────────────────────────────────

  setBackground(color: string) {
    this.scene.background = new THREE.Color(color);
    this.dirty = true;
  }

  /** Progression de l'intro (0..1), écrite par ScrollTrigger. */
  setProgress(p: number) {
    const wasExplore = this.progress >= EXPLORE_AT;
    this.progress = p;
    if (wasExplore && p < EXPLORE_AT) {
      // on remonte dans l'intro : la visite repart de zéro
      this.selected = null;
      this.floor = null;
      this.yaw = 0;
      this.tween?.kill();
      Object.assign(this.view, { px: OVERVIEW.pos.x, py: OVERVIEW.pos.y, pz: OVERVIEW.pos.z, tx: OVERVIEW.target.x, ty: OVERVIEW.target.y, tz: OVERVIEW.target.z });
    }
    this.dirty = true;
  }

  get exploring() {
    return this.progress >= EXPLORE_AT;
  }

  setAutoRotate(on: boolean) {
    this.autoRotate = on;
  }

  /** Crochet de contrôle qualité : place la caméra (captures automatisées). */
  inspect(px: number, py: number, pz: number, tx: number, ty: number, tz: number) {
    this.tween?.kill();
    Object.assign(this.view, { px, py, pz, tx, ty, tz });
    this.yaw = 0;
    this.dirty = true;
  }

  /** Une interaction de l'utilisateur : la rotation automatique se met en pause. */
  poke() {
    this.lastInput = performance.now();
  }

  /** Tourner la maquette (boutons ◀ ▶ sur mobile). */
  rotateBy(delta: number) {
    const from = { yaw: this.yaw };
    gsap.to(from, { yaw: this.yaw + delta, duration: 0.8, ease: "power3.out", onUpdate: () => { this.yaw = from.yaw; this.dirty = true; } });
    this.lastInput = performance.now();
  }

  /** Choisir une salle (ou null pour revenir à la vue d'ensemble). */
  select(id: string | null, instant = false) {
    this.selected = id;
    if (id) this.floor = this.model.rooms.get(id)?.floor ?? null;
    this.flyTo(this.poseFor(), instant);
  }

  /** Filtrer un étage (ou null pour tout voir). */
  setFloor(f: FloorId | null, instant = false) {
    this.floor = f;
    this.selected = null;
    this.flyTo(this.poseFor(), instant);
  }

  // ── poses ────────────────────────────────────────────────────────────────

  /** Position monde d'un point d'ancrage, étages éclatés compris. */
  private anchorWorld(id: string) {
    const r = this.model.rooms.get(id)!;
    return r.anchor.getWorldPosition(new THREE.Vector3());
  }

  private poseFor(): Pose {
    if (this.selected) {
      const c = this.anchorWorld(this.selected);
      const room = this.model.rooms.get(this.selected)!;
      const outdoor = !room.mesh || room.floor === "toit";
      const k = outdoor ? 1.5 : 1;
      return { pos: new THREE.Vector3(c.x + 19 * k, c.y + 21 * k, c.z + 28 * k), target: new THREE.Vector3(c.x, c.y - 1, c.z) };
    }
    if (this.floor) {
      const lvl = this.model.floors.get(this.floor)!.level;
      const y = lvl * FLOOR_HEIGHT + LIFT[lvl] + 1.5;
      return { pos: new THREE.Vector3(45, y + 34, 54), target: new THREE.Vector3(13, y, 8) };
    }
    return OVERVIEW;
  }

  private flyTo(to: Pose, instant: boolean) {
    this.tween?.kill();
    const dest = { px: to.pos.x, py: to.pos.y, pz: to.pos.z, tx: to.target.x, ty: to.target.y, tz: to.target.z };
    if (instant || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      Object.assign(this.view, dest);
      this.dirty = true;
      return;
    }
    this.tween = gsap.to(this.view, { ...dest, duration: 1.5, ease: "power3.inOut", onUpdate: () => { this.dirty = true; } });
    this.lastInput = performance.now();
  }

  /** Chemin de l'intro : ciel → demi-tour → entrée → recul en 3/4. */
  private introPose(p: number): Pose {
    const aerial = orbit(Math.PI, 10, 82); // au-dessus, côté rue
    if (p < 0.12) return aerial;
    if (p < 0.38) {
      const t = ease(seg(p, 0.12, 0.38));
      // demi-tour : de l'arrière (π) à l'entrée (2π), en descendant
      return orbit(Math.PI + t * Math.PI, 10 + t * 44, 82 - t * 48);
    }
    const turned = orbit(2 * Math.PI, 54, 34);
    if (p < 0.52) return lerpPose(turned, ENTRANCE, ease(seg(p, 0.38, 0.52)));
    return lerpPose(ENTRANCE, OVERVIEW, ease(seg(p, 0.52, EXPLORE_AT)));
  }

  // ── boucle ───────────────────────────────────────────────────────────────

  private frame = (now: number) => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.frame);
    const dt = this.last ? Math.min(now - this.last, 50) / 1000 : 0;
    this.last = now;

    // rotation automatique en visite, après 3 s sans interaction
    if (this.exploring && this.autoRotate && !this.selected && !this.drag && now - this.lastInput > 3000) {
      this.yaw += dt * 0.12;
      this.dirty = true;
    }
    // étages : écart et fondu tendent vers leur cible (amorti)
    const explodeTarget = ease(seg(this.progress, 0.55, EXPLORE_AT));
    if (Math.abs(explodeTarget - this.explode) > 0.0005) {
      this.explode += (explodeTarget - this.explode) * Math.min(1, dt * 10 || 1);
      this.dirty = true;
    }
    for (const f of this.model.floors.values()) {
      const want = !this.exploring || !this.floor || this.floor === f.id ? 1 : 0.1;
      const cur = this.fade.get(f.id)!;
      if (Math.abs(want - cur) > 0.003) {
        this.fade.set(f.id, cur + (want - cur) * Math.min(1, dt * 8 || 1));
        this.dirty = true;
      }
    }
    // les étudiants du Rooftop bougent en continu (seulement quand on dessine)
    if (this.model.people.length) {
      animatePeople(this.model.people, now / 1000);
      this.dirty = true;
    }
    if (!this.dirty) return;
    this.dirty = false;
    this.render();
  };

  private render() {
    // étages éclatés et estompés
    for (const f of this.model.floors.values()) {
      f.group.position.y = f.level * FLOOR_HEIGHT + LIFT[f.level] * this.explode;
      const o = this.fade.get(f.id)!;
      for (const m of f.materials) {
        // la vitre garde sa transparence propre : le fondu la multiplie
        const op = o * (m.userData.baseOpacity ?? 1);
        const transparent = op < 0.999;
        if (m.transparent !== transparent) {
          // r187 : un matériau opaque est compilé en « OPAQUE » (alpha forcé à 1) ;
          // passer en transparent demande de recompiler son shader
          m.transparent = transparent;
          m.needsUpdate = true;
        }
        m.opacity = op;
        m.depthWrite = o > 0.5 && op > 0.5;
      }
    }
    // salle choisie en or, les autres à leur nuance
    for (const r of this.model.rooms.values()) {
      if (!r.mesh) continue;
      const m = r.mesh.material as THREE.MeshStandardMaterial;
      if (r.id === this.selected) {
        m.color.set(GOLD);
        m.emissive.set(GOLD).multiplyScalar(0.25);
      } else {
        m.color.copy(r.base);
        m.emissive.set(0x000000);
      }
    }

    // caméra : chemin de l'intro, ou pose de visite + rotation
    let p: Pose;
    if (this.exploring) {
      p = { pos: new THREE.Vector3(this.view.px, this.view.py, this.view.pz), target: new THREE.Vector3(this.view.tx, this.view.ty, this.view.tz) };
      if (this.yaw) {
        const off = p.pos.clone().sub(p.target).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
        p.pos = p.target.clone().add(off);
      }
    } else {
      p = this.introPose(this.progress);
      // portrait : la maquette est plus large que l'écran, on recule l'intro
      // (sauf la vue à hauteur d'yeux devant l'entrée)
      if (this.camera.aspect < 0.8 && (this.progress < 0.4 || this.progress > 0.5)) {
        p.pos = p.target.clone().add(p.pos.clone().sub(p.target).multiplyScalar(1.45));
      }
    }
    this.camera.position.copy(p.pos);
    this.camera.lookAt(p.target);
    this.camera.updateMatrixWorld();

    if (ownsRenderer(this.host)) {
      this.renderer.toneMapping = THREE.NeutralToneMapping;
      this.renderer.toneMappingExposure = 1.0;
      this.renderer.render(this.scene, this.camera);
    }

    // points cliquables projetés à l'écran
    if (this.opts.onFrame) {
      const pts: HotspotPoint[] = [];
      const v = new THREE.Vector3();
      for (const r of this.model.rooms.values()) {
        r.anchor.getWorldPosition(v);
        v.project(this.camera);
        const onScreen = v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05;
        const floorOk = (this.fade.get(r.floor) ?? 1) > 0.5;
        pts.push({
          id: r.id,
          x: (v.x * 0.5 + 0.5) * this.size.w,
          y: (-v.y * 0.5 + 0.5) * this.size.h,
          visible: this.exploring && this.explode > 0.95 && onScreen && floorOk,
        });
      }
      this.opts.onFrame(pts);
    }
  }

  // ── interactions pointeur : glisser pour tourner, cliquer pour choisir ──

  private onDown = (e: PointerEvent) => {
    if (!this.exploring) return;
    this.drag = { x: e.clientX, yaw: this.yaw, moved: false };
    this.lastInput = performance.now();
  };
  private onMove = (e: PointerEvent) => {
    if (!this.drag) return;
    const dx = e.clientX - this.drag.x;
    if (Math.abs(dx) > 4) this.drag.moved = true;
    this.yaw = this.drag.yaw - dx * 0.006;
    this.dirty = true;
    this.lastInput = performance.now();
  };
  private onUp = (e: PointerEvent) => {
    const d = this.drag;
    this.drag = null;
    if (!d || d.moved || !this.opts.onPick) return;
    const rect = this.host.getBoundingClientRect();
    const ndc = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    const meshes = [...this.model.rooms.values()]
      .filter((r) => r.mesh && (this.fade.get(r.floor) ?? 1) > 0.5)
      .map((r) => r.mesh!);
    const hit = this.raycaster.intersectObjects(meshes, false)[0];
    const id = hit?.object.userData.roomId as string | undefined;
    if (id) this.opts.onPick(id);
  };

  // ── cycle de vie ─────────────────────────────────────────────────────────

  resize() {
    this.size.w = Math.max(1, this.host.clientWidth);
    this.size.h = Math.max(1, this.host.clientHeight);
    this.camera.aspect = this.size.w / this.size.h;
    // portrait : on élargit le champ pour garder toute la maquette
    this.camera.fov = this.camera.aspect < 0.8 ? 52 : 32;
    this.camera.updateProjectionMatrix();
    if (ownsRenderer(this.host)) {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_DPR));
      this.renderer.setSize(this.size.w, this.size.h, false);
    }
    this.dirty = true;
  }

  start() {
    if (claimRenderer(this.host)) this.resize();
    if (this.running) return;
    this.running = true;
    this.last = 0;
    this.dirty = true;
    this.raf = requestAnimationFrame(this.frame);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  dispose() {
    this.stop();
    this.tween?.kill();
    this.host.removeEventListener("pointerdown", this.onDown);
    window.removeEventListener("pointermove", this.onMove);
    window.removeEventListener("pointerup", this.onUp);
    this.scene.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        (o.material as THREE.Material).dispose();
      }
    });
    this.model.shadowTex.dispose();
    this.envTexture.dispose();
  }
}

function lerpPose(a: Pose, b: Pose, t: number): Pose {
  return { pos: a.pos.clone().lerp(b.pos, t), target: a.target.clone().lerp(b.target, t) };
}
