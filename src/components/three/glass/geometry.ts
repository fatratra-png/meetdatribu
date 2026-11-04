/**
 * Géométrie 2D du moteur de verre — port TypeScript de
 * `premium-3d-glass/template/js/app.js` (skill premium-3d-glass).
 *
 * Rôle : lire la silhouette SVG, la découper en fragments, et préparer la
 * correspondance point à point qui permet aux fragments de se recomposer.
 * Les algorithmes et les constantes sont ceux du skill, inchangés.
 */
import * as THREE from "three";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";

export type V2 = THREE.Vector2;
export type Contour = V2[] & { isExtra?: boolean };

export const vec2 = (x = 0, y = 0) => new THREE.Vector2(x, y);
const cross2 = (a: V2, b: V2) => a.x * b.y - a.y * b.x;

/** Retire les points en double et les points alignés, impose le sens anti-horaire. */
export function cleanContour(points: V2[], epsilon = 1e-4): V2[] {
  const contour: V2[] = [];
  for (const p of points) {
    if (!contour.length || contour[contour.length - 1].distanceTo(p) > epsilon) contour.push(p.clone());
  }
  while (contour.length > 1 && contour[0].distanceTo(contour[contour.length - 1]) <= epsilon) contour.pop();
  const result = contour.filter((p, i) => {
    const prev = contour[(i - 1 + contour.length) % contour.length];
    const next = contour[(i + 1) % contour.length];
    return Math.abs(cross2(p.clone().sub(prev), next.clone().sub(p))) > 1e-7;
  });
  if (THREE.ShapeUtils.isClockWise(result)) result.reverse();
  return result;
}

type HalfPlane = { origin: V2; normal: V2 };

/** Découpage de Sutherland-Hodgman par un ensemble convexe de demi-plans. */
function clipContour(points: V2[], halfPlanes: HalfPlane[]): V2[] {
  let polygon = points.map((p) => p.clone());
  for (const { origin, normal } of halfPlanes) {
    const clipped: V2[] = [];
    for (let i = 0; i < polygon.length; i++) {
      const p = polygon[i];
      const q = polygon[(i + 1) % polygon.length];
      const dp = p.clone().sub(origin).dot(normal);
      const dq = q.clone().sub(origin).dot(normal);
      if (dp >= 0) clipped.push(p);
      if (dp >= 0 !== dq >= 0) clipped.push(p.clone().lerp(q, dp / (dp - dq)));
    }
    polygon = clipped;
    if (!polygon.length) break;
  }
  return cleanContour(polygon);
}

/** Secteur convexe entre deux rayons (sens anti-horaire, moins de 180°). */
function wedgeHalfPlanes(center: V2, startDeg: number, endDeg: number): HalfPlane[] {
  const dir = (deg: number) =>
    vec2(Math.cos(THREE.MathUtils.degToRad(deg)), Math.sin(THREE.MathUtils.degToRad(deg)));
  const a = dir(startDeg);
  const b = dir(endDeg);
  return [
    { origin: center, normal: vec2(-a.y, a.x) },
    { origin: center, normal: vec2(b.y, -b.x) },
  ];
}

/** Contour recentré sur le centre de sa boîte, plus ce centre (« home »). */
export function recentre(points: V2[]) {
  const centre = new THREE.Box2().setFromPoints(points).getCenter(vec2());
  return {
    contour: points.map((p) => p.clone().sub(centre)),
    home: new THREE.Vector3(centre.x, centre.y, 0),
  };
}

// ---- Correspondance pour la recomposition ---------------------------------

export type Pair = { source: V2; target: V2 };

/** Correspondance radiale autour du noyau de visibilité : sans pli. */
function matchRadially(source: V2[], target: V2[]): Pair[] {
  const prepare = (points: V2[]) => {
    const contour = points.filter((p, i) => i === 0 || p.distanceToSquared(points[i - 1]) > 1e-12);
    if (contour[0].distanceToSquared(contour[contour.length - 1]) < 1e-12) contour.pop();
    if (THREE.ShapeUtils.isClockWise(contour)) contour.reverse();
    let kernel = [vec2(-10, -10), vec2(10, -10), vec2(10, 10), vec2(-10, 10)];
    for (let i = 0; i < contour.length; i++) {
      const a = contour[i];
      const edge = contour[(i + 1) % contour.length].clone().sub(a);
      const clipped: V2[] = [];
      for (let j = 0; j < kernel.length; j++) {
        const p = kernel[j];
        const q = kernel[(j + 1) % kernel.length];
        const dp = cross2(edge, p.clone().sub(a));
        const dq = cross2(edge, q.clone().sub(a));
        if (dp >= -1e-10) clipped.push(p);
        if (dp >= 0 !== dq >= 0) clipped.push(p.clone().lerp(q, dp / (dp - dq)));
      }
      kernel = clipped;
    }
    if (!kernel.length) throw new Error("Contour has no visibility kernel.");
    const center = kernel.reduce((sum, p) => sum.add(p), vec2()).multiplyScalar(1 / kernel.length);
    return { contour, center };
  };
  const a = prepare(source);
  const b = prepare(target);
  const angle = (p: V2, center: V2) =>
    (Math.atan2(p.y - center.y, p.x - center.x) + Math.PI * 2) % (Math.PI * 2);
  const angles = [
    ...a.contour.map((p) => angle(p, a.center)),
    ...b.contour.map((p) => angle(p, b.center)),
    ...Array.from({ length: 32 }, (_, i) => (i / 32) * Math.PI * 2),
  ]
    .sort((x, y) => x - y)
    .filter((value, i, values) => i === 0 || value - values[i - 1] > 1e-8);
  const sample = ({ contour, center }: { contour: V2[]; center: V2 }, ang: number) => {
    const direction = vec2(Math.cos(ang), Math.sin(ang));
    let distance = Infinity;
    for (let i = 0; i < contour.length; i++) {
      const p = contour[i];
      const edge = contour[(i + 1) % contour.length].clone().sub(p);
      const denominator = cross2(direction, edge);
      if (Math.abs(denominator) < 1e-12) continue;
      const relative = p.clone().sub(center);
      const t = cross2(relative, edge) / denominator;
      const u = cross2(relative, direction) / denominator;
      if (t >= 0 && u >= -1e-8 && u <= 1 + 1e-8) distance = Math.min(distance, t);
    }
    if (!isFinite(distance)) throw new Error("Ray missed the contour.");
    return center.clone().addScaledVector(direction, distance);
  };
  return angles.map((ang) => ({ source: sample(a, ang), target: sample(b, ang) }));
}

/** Secours : rééchantillonnage à abscisse curviligne égale. */
function matchByArcLength(source: V2[], target: V2[], samples = 160): Pair[] {
  const resample = (points: V2[]) => {
    const lengths = [0];
    for (let i = 0; i < points.length; i++) {
      lengths.push(lengths[i] + points[i].distanceTo(points[(i + 1) % points.length]));
    }
    const total = lengths[points.length];
    const out: V2[] = [];
    let segment = 0;
    for (let i = 0; i < samples; i++) {
      const d = (i / samples) * total;
      while (segment < points.length - 1 && lengths[segment + 1] < d) segment++;
      const p = points[segment];
      const q = points[(segment + 1) % points.length];
      const span = lengths[segment + 1] - lengths[segment];
      out.push(p.clone().lerp(q, span > 0 ? (d - lengths[segment]) / span : 0));
    }
    return out;
  };
  const a = resample(source);
  const b = resample(target);
  let best = 0;
  let bestCost = Infinity;
  for (let k = 0; k < samples; k++) {
    let cost = 0;
    for (let i = 0; i < samples; i++) cost += a[i].distanceToSquared(b[(i + k) % samples]);
    if (cost < bestCost) {
      bestCost = cost;
      best = k;
    }
  }
  return a.map((p, i) => ({ source: p, target: b[(i + best) % samples] }));
}

export function matchMorphContours(source: V2[], target: V2[], name: string): Pair[] {
  try {
    return matchRadially(source, target);
  } catch (error) {
    console.warn(
      `[glass] radial morph unavailable for "${name}" (${(error as Error).message}); using arc-length matching.`,
    );
    return matchByArcLength(source, target);
  }
}

// ---- Lecture de la forme ----------------------------------------------------

function pointInPolygon(point: V2, polygon: V2[]) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    if (a.y > point.y !== b.y > point.y && point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x)
      inside = !inside;
  }
  return inside;
}

export type ParsedShape = { outline: V2[]; holes: V2[][]; extras: V2[][] };

/** Le plus grand contour est le pourtour ; ceux dedans sont des trous ; les autres, des solides séparés. */
export function parseShape(svgText: string): ParsedShape {
  const svg = new SVGLoader().parse(svgText);
  const contours = svg.paths
    .flatMap((path) =>
      path.subPaths.map((sub) => cleanContour(sub.getPoints(6).map((p) => vec2(p.x, -p.y)))),
    )
    .filter((c) => c.length >= 3 && Math.abs(THREE.ShapeUtils.area(c)) > 1e-9)
    .sort((a, b) => Math.abs(THREE.ShapeUtils.area(b)) - Math.abs(THREE.ShapeUtils.area(a)));
  if (!contours.length) throw new Error("This SVG has no closed contour.");
  const [outline, ...rest] = contours;
  const holes: V2[][] = [];
  const extras: V2[][] = [];
  for (const contour of rest) {
    const centre = new THREE.Box2().setFromPoints(contour).getCenter(vec2());
    (pointInPolygon(centre, outline) ? holes : extras).push(contour);
  }
  return { outline, holes, extras };
}

/** Centre la forme sur l'origine et la met à `height` unités monde. */
export function fitShape(shape: ParsedShape, height: number): ParsedShape {
  const bounds = new THREE.Box2().setFromPoints([shape.outline, ...shape.holes, ...shape.extras].flat());
  const centre = bounds.getCenter(vec2());
  const size = bounds.getSize(vec2());
  const scale = height / Math.max(size.x, size.y);
  const fit = (contour: V2[]) => contour.map((p) => p.clone().sub(centre).multiplyScalar(scale));
  return { outline: fit(shape.outline), holes: shape.holes.map(fit), extras: shape.extras.map(fit) };
}

/** Noyau de visibilité : la zone d'où l'on voit tout le contour. */
function visibilityKernel(points: V2[]): V2[] {
  const contour = points.slice();
  if (THREE.ShapeUtils.isClockWise(contour)) contour.reverse();
  const span = new THREE.Box2().setFromPoints(contour).getSize(vec2()).length() * 2 + 1;
  let kernel = [vec2(-span, -span), vec2(span, -span), vec2(span, span), vec2(-span, span)];
  for (let i = 0; i < contour.length; i++) {
    const a = contour[i];
    const edge = contour[(i + 1) % contour.length].clone().sub(a);
    const clipped: V2[] = [];
    for (let j = 0; j < kernel.length; j++) {
      const p = kernel[j];
      const q = kernel[(j + 1) % kernel.length];
      const dp = cross2(edge, p.clone().sub(a));
      const dq = cross2(edge, q.clone().sub(a));
      if (dp >= -1e-10) clipped.push(p);
      if (dp >= 0 !== dq >= 0) clipped.push(p.clone().lerp(q, dp / (dp - dq)));
    }
    kernel = clipped;
    if (!kernel.length) return [];
  }
  return kernel;
}

/**
 * Coupe un contour en `count` secteurs radiaux. L'angle de départ est choisi
 * par balayage (pas de 5°) : gagne celui dont le pire fragment a le plus grand
 * noyau de visibilité.
 */
function partitionContour(outline: V2[], count: number): V2[][] {
  if (count <= 1) return [outline];
  const centre = new THREE.Box2().setFromPoints(outline).getCenter(vec2());
  const step = 360 / count;
  let best: { worst: number; pieces: V2[][] } | null = null;
  for (let offset = 0; offset < step - 0.001; offset += 5) {
    const pieces: V2[][] = [];
    let worst = Infinity;
    for (let i = 0; i < count; i++) {
      const piece = clipContour(outline, wedgeHalfPlanes(centre, offset + i * step, offset + (i + 1) * step));
      if (piece.length < 3) {
        worst = -1;
        break;
      }
      const kernel = visibilityKernel(piece);
      const ratio = kernel.length
        ? Math.abs(THREE.ShapeUtils.area(kernel)) / Math.abs(THREE.ShapeUtils.area(piece))
        : 0;
      worst = Math.min(worst, ratio);
      pieces.push(piece);
    }
    if (worst >= 0 && (!best || worst > best.worst)) best = { worst, pieces };
  }
  if (!best) throw new Error(`Could not split this shape into ${count} fragments.`);
  if (best.worst === 0) {
    console.warn("[glass] a fragment has no visibility kernel; using arc-length morphing there.");
  }
  return best.pieces;
}

/**
 * Les solides d'une forme : le pourtour (avec ses trous) puis chaque solide séparé.
 * ADAPTATION Meet da Tribu : le symbole HEI est fait de DEUX solides égaux (les
 * deux crochets). Le moteur d'origine aurait découpé le premier en 3 et laissé
 * le second entier ; ici chaque solide reçoit la même part de fragments
 * (2 + 2 = 4, un par bras de crochet). Avec un seul solide, le comportement
 * est exactement celui du skill.
 */
export type Solid = { outline: V2[]; holes: V2[][] };

export function shapeSolids(fit: ParsedShape): Solid[] {
  return [{ outline: fit.outline, holes: fit.holes }, ...fit.extras.map((e) => ({ outline: e, holes: [] }))];
}

export function shapeFragments(fit: ParsedShape, count: number): { contour: Contour; solid: number }[] {
  const solids = shapeSolids(fit);
  const per = solids.length > 1 && count % solids.length === 0 ? count / solids.length : 0;
  let pieces: { contour: Contour; solid: number }[];
  if (per > 0) {
    pieces = solids.flatMap((s, solid) =>
      partitionContour(s.outline, per).map((contour) => ({ contour: contour as Contour, solid })),
    );
  } else {
    // comportement d'origine : secteurs du pourtour + solides séparés entiers
    const wedges = Math.max(1, count - fit.extras.length);
    const extras = fit.extras.map((c) => ({ contour: Object.assign(c.slice(), { isExtra: true }), solid: 0 }));
    pieces = [...partitionContour(fit.outline, wedges).map((c) => ({ contour: c as Contour, solid: 0 })), ...extras]
      .slice(0, Math.max(1, count));
  }
  const angle = (contour: V2[]) => {
    const c = new THREE.Box2().setFromPoints(contour).getCenter(vec2());
    return (Math.atan2(c.y, c.x) + Math.PI * 2) % (Math.PI * 2);
  };
  return pieces.sort((a, b) => angle(a.contour) - angle(b.contour));
}

/** Prisme biseauté extrudé depuis un contour (et ses trous éventuels). */
export function makePrism(
  points: V2[],
  depth: number,
  bevelSize: number,
  bevelThickness: number,
  holes: V2[][] = [],
) {
  const shape = new THREE.Shape(points);
  for (const h of holes) shape.holes.push(new THREE.Path(h));
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    steps: 1,
    bevelEnabled: true,
    bevelSize,
    bevelThickness,
    bevelSegments: 6,
    curveSegments: 24,
  });
  geometry.translate(0, 0, -depth / 2);
  return geometry;
}

/** Courbe de lissage du skill (smootherstep sur une fenêtre de scroll). */
export function smoothScrollRange(scroll: number, start: number, end: number) {
  const t = THREE.MathUtils.clamp((scroll - start) / (end - start), 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
}
