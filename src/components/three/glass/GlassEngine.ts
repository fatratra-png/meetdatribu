/**
 * Moteur de verre — port TypeScript du moteur du skill premium-3d-glass
 * (template/js/app.js). Three.js « brut » : c'est la façon la plus fidèle de
 * reprendre le skill (même scène, mêmes lumières, même chronologie).
 *
 * Chronologie du scroll (references/engine.md), `scroll` de 0 à 1 :
 *   0    → 12 %  forme assemblée
 *   12   → 28 %  les quatre fragments s'écartent, la caméra recule
 *   28   → 40 %  fragments séparés
 *   40   → 54 %  les fragments reviennent à leur place
 *   54   → 60 %  prisme unique, biseaux qui grandissent, trous qui se percent
 *   60   → 100 % forme recomposée, identique au départ
 *
 * Ce qui a été retiré (sans objet ici) : curseur réticule, header, formulaire
 * de contact et sa dalle de verre, ombres (aucun objet ne les reçoit).
 */
import * as THREE from "three";
import {
  fitShape,
  makePrism,
  matchMorphContours,
  parseShape,
  recentre,
  shapeFragments,
  shapeSolids,
  smoothScrollRange,
  vec2,
  type Pair,
  type V2,
} from "./geometry";
import { createGlassEnvironment, createGlassMaterial } from "./material";
import { createBackground, createBackgroundUniforms } from "./background";

// ---- Réglages (valeurs du skill) ------------------------------------------
const LOGO_HEIGHT = 3.1;
const LOGO_DEPTH = 0.44;
const LOGO_BEVEL = { size: 0.042, thickness: 0.052 };
// Une seule forme : le prisme recomposé est identique à celui qui s'est brisé.
const ICON_DEPTH = LOGO_DEPTH;
const ICON_BEVEL = LOGO_BEVEL;
const SEAM_BEVEL = 0.006; // biseau pendant la fusion des fragments
const FRAGMENTS = 4;
const SPARK_COUNT = 450;
/** Plafond du pixel ratio (prompt : 1.75 ; skill : 1.5). */
const MAX_DPR = 1.75;

const lerp = THREE.MathUtils.lerp;
const geometryStep = (value: number) => Math.round(value * 96) / 96;

type Piece = {
  name: string;
  mesh: THREE.Mesh;
  home: THREE.Vector3;
  targetHome: THREE.Vector3;
  offset: THREE.Vector3;
  twist: THREE.Vector3;
  correspondence: Pair[];
  originalGeometry: THREE.BufferGeometry;
  cache: Map<string, THREE.BufferGeometry>;
};

type SolidBody = {
  whole: THREE.Mesh; // le solide entier, tant que la forme est assemblée
  final: THREE.Mesh; // le prisme final, recomposé
  outline: V2[];
  holes: V2[][];
  progress: string;
  cache: Map<string, THREE.BufferGeometry>;
};

export type GlassEngineOptions = {
  /** Lit la cible de scroll (0..1) à chaque image — fournie par ScrollTrigger. */
  getTarget: () => number;
  /** Appelé à chaque image avec le scroll lissé (pour les textes des chapitres). */
  onFrame?: (scroll: number) => void;
};

/** Cache LRU de géométries (24 entrées, comme le skill). */
function cachedGeometry(cache: Map<string, THREE.BufferGeometry>, key: string, build: () => THREE.BufferGeometry) {
  let geometry = cache.get(key);
  if (geometry) cache.delete(key);
  else geometry = build();
  cache.set(key, geometry);
  if (cache.size > 24) {
    const oldest = cache.keys().next().value as string;
    cache.get(oldest)?.dispose();
    cache.delete(oldest);
  }
  return geometry;
}

export class GlassEngine {
  private canvas: HTMLCanvasElement;
  private opts: GlassEngineOptions;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private uniforms = createBackgroundUniforms();
  private modelPivot = new THREE.Group();
  private pieces: Piece[] = [];
  private bodies: SolidBody[] = [];
  private sparks!: THREE.Points;
  private sparkData: { speedX: number; speedY: number; speedZ: number; swaySpeed: number; swayRadius: number; phase: number }[] = [];
  private disposables: { dispose: () => void }[] = [];

  private size = { width: 1, height: 1 };
  private currentScroll = 0;
  private mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  private raf = 0;
  private running = false;
  private lastFrameAt = 0;
  private lastTick = 0;
  private elapsed = 0;
  private lastInputAt = performance.now();

  constructor(canvas: HTMLCanvasElement, svgText: string, opts: GlassEngineOptions) {
    this.canvas = canvas;
    this.opts = opts;

    this.scene.background = new THREE.Color("#000000");
    this.scene.fog = new THREE.FogExp2("#000000", 0.01);
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    this.camera.position.set(0, 0.2, 3.0);
    this.scene.add(this.camera);
    createBackground(this.camera, this.uniforms);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 2.2;

    // Lumières du skill : clé blanche, contre-jour froid, débouchage crème.
    this.scene.add(new THREE.AmbientLight("#ffffff", 0.1));
    const key = new THREE.SpotLight("#ffffff", 18.0);
    key.position.set(4, 6, 3);
    key.angle = Math.PI / 4;
    key.penumbra = 0.9;
    this.scene.add(key);
    const rim = new THREE.DirectionalLight("#e3f2ff", 10.0);
    rim.position.set(-5, 3, -4);
    this.scene.add(rim);
    const fill = new THREE.DirectionalLight("#fff3e6", 0.8);
    fill.position.set(-2, -4, 2);
    this.scene.add(fill);

    this.createSparks();
    this.createGlassShape(svgText);
    this.resize();
    this.snap(0);

    window.addEventListener("pointermove", this.onPointer, { passive: true });
    for (const ev of ["scroll", "pointerdown", "keydown", "resize"] as const) {
      window.addEventListener(ev, this.onInput, { passive: true });
    }
  }

  // ---- Construction ----------------------------------------------------------

  private createSparks() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(SPARK_COUNT * 3);
    const colors = new Float32Array(SPARK_COUNT * 3);
    for (let i = 0; i < SPARK_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 6.5;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 5.0 - 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6.5;
      if (Math.random() < 0.6) {
        // poussière de verre, blanc froid
        colors[i * 3] = 0.82 + Math.random() * 0.18;
        colors[i * 3 + 1] = 0.9 + Math.random() * 0.1;
        colors[i * 3 + 2] = 1.0;
      } else {
        // accents dorés, accordés à la palette HEI (skill : violet-rose)
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.72 + Math.random() * 0.12;
        colors[i * 3 + 2] = 0.3 + Math.random() * 0.15;
      }
      this.sparkData.push({
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: 0.15 + Math.random() * 0.3,
        speedZ: (Math.random() - 0.5) * 0.4,
        swaySpeed: 0.5 + Math.random() * 1.5,
        swayRadius: 0.05 + Math.random() * 0.15,
        phase: Math.random() * Math.PI * 2,
      });
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const c = document.createElement("canvas");
    c.width = c.height = 16;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.25, "rgba(255,255,255,0.85)");
    g.addColorStop(0.6, "rgba(255,255,255,0.3)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 16, 16);
    const map = new THREE.CanvasTexture(c);

    const material = new THREE.PointsMaterial({
      size: 0.025,
      vertexColors: true,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      map,
    });
    this.sparks = new THREE.Points(geometry, material);
    this.scene.add(this.sparks);
    this.disposables.push(geometry, material, map);
  }

  private createGlassShape(svgText: string) {
    this.disposables.push(createGlassEnvironment(this.renderer, this.scene));
    this.modelPivot.position.y = -0.3;
    this.scene.add(this.modelPivot);

    const glass = createGlassMaterial();
    this.disposables.push(glass);
    const logo = new THREE.Group();
    logo.rotation.set(-0.08, 0.28, -0.08);
    this.modelPivot.add(logo);

    // Une seule forme : source et cible sont la même silhouette, donc chaque
    // fragment revient exactement d'où il est parti (correspondance identité).
    const fit = fitShape(parseShape(svgText), LOGO_HEIGHT);

    // Solides entiers (assemblés) et prismes finaux (recomposés), un par solide.
    for (const solid of shapeSolids(fit)) {
      const whole = recentre(solid.outline);
      const offset = vec2(whole.home.x, whole.home.y);
      const holes = solid.holes.map((h) => h.map((p) => p.clone().sub(offset)));
      const wholeMesh = new THREE.Mesh(
        makePrism(whole.contour, LOGO_DEPTH, LOGO_BEVEL.size, LOGO_BEVEL.thickness, holes),
        glass,
      );
      wholeMesh.position.copy(whole.home);
      logo.add(wholeMesh);

      const body: SolidBody = {
        whole: wholeMesh,
        final: new THREE.Mesh(undefined, glass),
        outline: solid.outline,
        holes: solid.holes,
        progress: "",
        cache: new Map(),
      };
      body.final.geometry = this.makeFinalPrism(body, SEAM_BEVEL, SEAM_BEVEL, 0);
      body.final.visible = false;
      logo.add(body.final);
      this.bodies.push(body);
    }

    // Les quatre fragments.
    const sources = shapeFragments(fit, FRAGMENTS);
    sources.forEach(({ contour }, index) => {
      const source = recentre(contour);
      const target = source; // forme unique : la cible est la source
      const geometry = makePrism(source.contour, LOGO_DEPTH, LOGO_BEVEL.size, LOGO_BEVEL.thickness);
      const mesh = new THREE.Mesh(geometry, glass);
      mesh.position.copy(source.home);
      mesh.visible = false;
      logo.add(mesh);
      const radial = vec2(source.home.x, source.home.y);
      if (radial.lengthSq() < 1e-6) radial.set(Math.cos(index), Math.sin(index));
      const offset = new THREE.Vector3(radial.x, radial.y, 0).normalize().multiplyScalar(1.15);
      offset.z = (index % 2 === 0 ? 1 : -1) * 0.55;
      const side = Math.sign(offset.x) || 1;
      const vertical = Math.sign(offset.y) || 1;
      this.pieces.push({
        name: `fragment-${index}`,
        mesh,
        home: source.home,
        targetHome: target.home,
        offset,
        twist: new THREE.Vector3(vertical * 0.12, side * 0.18, -side * vertical * 0.09),
        correspondence: matchMorphContours(source.contour, target.contour, `fragment-${index}`),
        originalGeometry: geometry,
        cache: new Map(),
      });
    });
  }

  /** Prisme final d'un solide : biseau et trous dosés par la recomposition. */
  private makeFinalPrism(body: SolidBody, bevelSize: number, bevelThickness: number, holeScale: number) {
    const holes =
      holeScale > 0.02
        ? body.holes.map((hole) => {
            const centre = new THREE.Box2().setFromPoints(hole).getCenter(vec2());
            return hole.map((p) => p.clone().sub(centre).multiplyScalar(holeScale).add(centre));
          })
        : [];
    return makePrism(body.outline, ICON_DEPTH, bevelSize, bevelThickness, holes);
  }

  // ---- Chronologie -----------------------------------------------------------

  private separation(scroll: number) {
    return smoothScrollRange(scroll, 0.12, 0.28) * (1 - smoothScrollRange(scroll, 0.4, 0.54));
  }

  /**
   * Cadrage caméra. Paysage : l'objet est poussé sur le côté pour dégager le
   * texte (un poids par chapitre). Portrait : la caméra recule et l'objet
   * alterne moitié basse (chapitres 1 et 3) et moitié haute (2 et 4).
   */
  private cameraFrame(scroll: number) {
    const aspect = this.size.width / this.size.height;
    const portrait = THREE.MathUtils.clamp((1.0 - aspect) / 0.2, 0, 1);
    const separation = this.separation(scroll);
    const morph = smoothScrollRange(scroll, 0.4, 0.54);
    const landscapeRadius = 4.7 - Math.sin(scroll * Math.PI) * 0.6 + separation * 2.6 + morph * 0.9;
    // Portrait : recul pendant l'éclatement porté de 2.0 (skill) à 2.8, pour
    // que les fragments laissent la place au texte du chapitre 2 sur téléphone.
    const portraitRadius = 8.9 - Math.sin(scroll * Math.PI) * 0.4 + separation * 2.8 + morph * 0.4;
    const radius = lerp(landscapeRadius, portraitRadius, portrait);
    const ch1 = 1 - smoothScrollRange(scroll, 0.12, 0.24);
    const ch2 = smoothScrollRange(scroll, 0.12, 0.24) - smoothScrollRange(scroll, 0.4, 0.5);
    const ch3 = smoothScrollRange(scroll, 0.52, 0.62) - smoothScrollRange(scroll, 0.74, 0.86);
    const ch4 = smoothScrollRange(scroll, 0.74, 0.86);
    const x = (-1.5 * ch1 + 1.5 * ch2 - 1.8 * ch3 - 1.4 * ch4) * (1 - portrait);
    const stack =
      1 -
      2 * smoothScrollRange(scroll, 0.16, 0.26) +
      2 * smoothScrollRange(scroll, 0.44, 0.54) -
      2 * smoothScrollRange(scroll, 0.72, 0.82);
    const visibleHeight = 2 * radius * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    const y = -0.15 + portrait * stack * (stack > 0 ? 0.2 : 0.19) * visibleHeight;
    const phi = scroll * Math.PI * 2.0;
    const right = new THREE.Vector3(Math.cos(phi), 0, -Math.sin(phi));
    const lookAt = new THREE.Vector3(0, y, 0).addScaledVector(right, x);
    return { radius, lookAt };
  }

  private updatePieces(scroll: number) {
    const separation = this.separation(scroll);
    const morph = smoothScrollRange(scroll, 0.4, 0.54);
    const geometryMorph = geometryStep(morph);
    const complete = morph >= 1;
    const assembled = separation <= 0 && morph <= 0;

    for (const body of this.bodies) {
      body.whole.visible = assembled;
      body.final.visible = complete;
      if (complete) {
        const bevel = geometryStep(smoothScrollRange(scroll, 0.54, 0.56));
        const hole = geometryStep(smoothScrollRange(scroll, 0.54, 0.6));
        const key = `${bevel}:${hole}`;
        if (key !== body.progress) {
          body.final.geometry = cachedGeometry(body.cache, key, () =>
            this.makeFinalPrism(
              body,
              lerp(SEAM_BEVEL, ICON_BEVEL.size, bevel),
              lerp(SEAM_BEVEL, ICON_BEVEL.thickness, bevel),
              hole,
            ),
          );
          body.progress = key;
        }
      }
    }

    for (const piece of this.pieces) {
      const { mesh, home, targetHome, offset, twist, correspondence } = piece;
      mesh.visible = !complete && !assembled;
      mesh.position.copy(home).lerp(targetHome, morph).addScaledVector(offset, separation);
      mesh.rotation.set(twist.x * separation, twist.y * separation, twist.z * separation);
      if (!mesh.visible) continue;
      if (morph <= 0) {
        mesh.geometry = piece.originalGeometry;
      } else {
        mesh.geometry = cachedGeometry(piece.cache, `morph:${geometryMorph}`, () => {
          const contour = correspondence.map(({ source, target }) => source.clone().lerp(target, geometryMorph));
          return makePrism(
            contour,
            lerp(LOGO_DEPTH, ICON_DEPTH, geometryMorph),
            lerp(LOGO_BEVEL.size, SEAM_BEVEL, geometryMorph),
            lerp(LOGO_BEVEL.thickness, SEAM_BEVEL, geometryMorph),
          );
        });
      }
    }
  }

  // ---- Boucle ----------------------------------------------------------------

  private onPointer = (e: PointerEvent) => {
    this.mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
    this.lastInputAt = performance.now();
  };
  private onInput = () => {
    this.lastInputAt = performance.now();
  };

  private animate = (now: number) => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.animate);
    const target = THREE.MathUtils.clamp(this.opts.getTarget(), 0, 1);
    const unsettled = Math.abs(target - this.currentScroll) > 0.0001;
    // 60 i/s quand ça bouge, 30 i/s au repos (économie de batterie)
    const fps = unsettled || now - this.lastInputAt < 1500 ? 60 : 30;
    if (this.lastFrameAt && now - this.lastFrameAt < 1000 / fps - 1) return;
    this.lastFrameAt = now;
    const deltaTime = Math.min(this.lastTick ? (now - this.lastTick) / 1000 : 0, 0.1);
    this.lastTick = now;
    this.elapsed += deltaTime;
    const damping = (factor: number) => 1 - Math.pow(1 - factor, deltaTime * 60);

    // inertie physique du skill (lerp 0.025)
    this.currentScroll += (target - this.currentScroll) * damping(0.025);
    this.mouse.x += (this.mouse.tx - this.mouse.x) * damping(0.05);
    this.mouse.y += (this.mouse.ty - this.mouse.y) * damping(0.05);
    this.modelPivot.rotation.y = this.mouse.x * 0.25;
    this.modelPivot.rotation.x = this.mouse.y * 0.15;

    this.updateSparks(deltaTime, Math.abs(target - this.currentScroll));
    this.placeCamera(this.currentScroll, damping(0.025));

    this.uniforms.uTime.value = this.elapsed;
    this.uniforms.uMouse.value.set(this.mouse.x, -this.mouse.y);
    this.uniforms.uScroll.value = this.currentScroll;
    this.uniforms.uVelocity.value +=
      (Math.min(1, Math.abs(target - this.currentScroll) * 14) - this.uniforms.uVelocity.value) * damping(0.06);

    this.updatePieces(this.currentScroll);
    this.opts.onFrame?.(this.currentScroll);
    this.renderer.render(this.scene, this.camera);
  };

  private placeCamera(scroll: number, follow: number) {
    const frame = this.cameraFrame(scroll);
    const phi = scroll * Math.PI * 2.0;
    const y = 0.35 + Math.sin(scroll * Math.PI) * 0.8;
    const targetPos = new THREE.Vector3(frame.radius * Math.sin(phi), y, frame.radius * Math.cos(phi));
    this.camera.position.lerp(targetPos, follow);
    this.camera.lookAt(frame.lookAt);
  }

  private updateSparks(deltaTime: number, scrollVelocity: number) {
    const positions = this.sparks.geometry.attributes.position.array as Float32Array;
    const speedMultiplier = 1.0 + scrollVelocity * 9.0;
    const turbulence = scrollVelocity * 0.8;
    for (let i = 0; i < SPARK_COUNT; i++) {
      const idx = i * 3;
      const d = this.sparkData[i];
      positions[idx] += d.speedX * deltaTime * speedMultiplier;
      positions[idx + 1] += d.speedY * deltaTime * speedMultiplier;
      positions[idx + 2] += d.speedZ * deltaTime * speedMultiplier;
      const sway = d.swayRadius * (1.0 + turbulence * 4.0);
      positions[idx] += Math.sin(this.elapsed * d.swaySpeed + d.phase) * sway * deltaTime;
      positions[idx + 2] += Math.cos(this.elapsed * d.swaySpeed + d.phase) * sway * deltaTime;
      if (positions[idx + 1] > 3.0 || Math.abs(positions[idx]) > 3.5 || Math.abs(positions[idx + 2]) > 3.5) {
        positions[idx + 1] = -2.5;
        positions[idx] = (Math.random() - 0.5) * 3.0;
        positions[idx + 2] = (Math.random() - 0.5) * 3.0;
      }
    }
    this.sparks.geometry.attributes.position.needsUpdate = true;
  }

  // ---- API publique ----------------------------------------------------------

  /** Taille du canvas = taille de son conteneur. */
  resize() {
    const parent = this.canvas.parentElement ?? this.canvas;
    this.size.width = Math.max(1, parent.clientWidth);
    this.size.height = Math.max(1, parent.clientHeight);
    this.camera.aspect = this.size.width / this.size.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_DPR));
    this.renderer.setSize(this.size.width, this.size.height, false);
    this.renderer.getDrawingBufferSize(this.uniforms.uResolution.value);
    this.lastInputAt = performance.now();
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTick = 0;
    this.lastFrameAt = 0;
    this.raf = requestAnimationFrame(this.animate);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  /** Crochet de contrôle qualité (skill : window.__glassSite.snap). */
  snap(value: number) {
    this.currentScroll = value;
    const phi = value * Math.PI * 2.0;
    const { radius } = this.cameraFrame(value);
    this.camera.position.set(radius * Math.sin(phi), 0.35 + Math.sin(value * Math.PI) * 0.8, radius * Math.cos(phi));
    this.placeCamera(value, 1);
    this.updatePieces(value);
    this.uniforms.uScroll.value = value;
    this.renderer.render(this.scene, this.camera);
  }

  get scroll() {
    return this.currentScroll;
  }

  get fragmentNames() {
    return this.pieces.map((p) => ({ name: p.name, points: p.correspondence.length }));
  }

  dispose() {
    this.stop();
    window.removeEventListener("pointermove", this.onPointer);
    for (const ev of ["scroll", "pointerdown", "keydown", "resize"] as const) {
      window.removeEventListener(ev, this.onInput);
    }
    this.scene.traverse((o) => {
      if (o instanceof THREE.Mesh) o.geometry?.dispose();
    });
    for (const p of this.pieces) p.cache.forEach((g) => g.dispose());
    for (const b of this.bodies) b.cache.forEach((g) => g.dispose());
    this.disposables.forEach((d) => d.dispose());
    this.renderer.dispose();
  }
}
