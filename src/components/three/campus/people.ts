/**
 * Les étudiants du Rooftop. Silhouettes articulées (jambes et bras en deux
 * segments, mains, chaussures, cheveux), à l'échelle réelle (~1,70 m),
 * tee-shirts bleus, blancs et orange. Trois activités :
 *  - « laptop » : marche, un MacBook fermé sous le bras ;
 *  - « eat »    : marche lentement en mangeant un sandwich (la main monte à la bouche) ;
 *  - « dance »  : sur place, sous la toile : bras levés, hanches qui balancent.
 * Le moteur appelle `animatePeople(people, t)` à chaque image.
 */
import * as THREE from "three";

const SHIRTS = ["#2a52c4", "#f4f1ea", "#e8732a"]; // bleu, blanc, orange
const SKIN = ["#6b4a32", "#8a5f3f", "#5a3c28", "#7a5236"];
const HAIR = ["#16110d", "#2b1d14", "#0f0c0a"];
const PANTS = ["#2b3446", "#1f2733", "#4a4f5a", "#d9cfbd"];

type Activity = "laptop" | "eat" | "dance";
type Limb = { root: THREE.Group; joint: THREE.Group };
export type Person = {
  obj: THREE.Group;
  body: THREE.Group;
  legs: [Limb, Limb];
  arms: [Limb, Limb];
  activity: Activity;
  path: THREE.Vector3[];
  lengths: number[];
  total: number;
  speed: number;
  phase: number;
  home: THREE.Vector3;
};

/** Géométries partagées, en haute résolution (segments nombreux). */
function geometries() {
  const capsule = (r: number, len: number) => {
    const g = new THREE.CapsuleGeometry(r, len, 8, 18);
    g.translate(0, -(len / 2 + r), 0); // pivot en haut : l'articulation
    return g;
  };
  const head = new THREE.SphereGeometry(0.105, 28, 20);
  head.scale(0.92, 1.1, 1);
  const hair = new THREE.SphereGeometry(0.112, 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.55);
  hair.scale(0.95, 1.05, 1.04);
  const torso = new THREE.CapsuleGeometry(0.16, 0.34, 8, 20);
  torso.scale(1.12, 1, 0.68);
  return {
    thigh: capsule(0.078, 0.34),
    shin: capsule(0.06, 0.34),
    upper: capsule(0.058, 0.2),
    fore: capsule(0.046, 0.18),
    hand: new THREE.SphereGeometry(0.048, 16, 12),
    shoe: new THREE.BoxGeometry(0.11, 0.07, 0.26),
    torso,
    neck: new THREE.CylinderGeometry(0.045, 0.05, 0.1, 16),
    head,
    hair,
    // MacBook fermé : coque alu + filet sombre
    laptop: new THREE.BoxGeometry(0.31, 0.016, 0.22),
    // sandwich : deux tranches + garniture
    bread: new THREE.BoxGeometry(0.12, 0.025, 0.09),
    filling: new THREE.BoxGeometry(0.125, 0.018, 0.095),
  };
}

/** Une boucle fermée (x, z) à la hauteur y du toit. */
function loop(points: [number, number][], y: number) {
  const path = points.map(([x, z]) => new THREE.Vector3(x, y, z));
  const lengths = path.map((p, i) => p.distanceTo(path[(i + 1) % path.length]));
  return { path, lengths, total: lengths.reduce((a, b) => a + b, 0) };
}

export function createPeople(group: THREE.Group, materials: THREE.MeshStandardMaterial[], roofY: number) {
  const reg = (color: string, roughness = 0.85, metalness = 0) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness, metalness });
    m.userData.baseOpacity = 1;
    materials.push(m);
    return m;
  };
  const g = geometries();
  const shirts = SHIRTS.map((c) => reg(c, 0.9));
  const skins = SKIN.map((c) => reg(c, 0.65));
  const hairs = HAIR.map((c) => reg(c, 0.95));
  const pants = PANTS.map((c) => reg(c, 0.9));
  const shoe = reg("#f4f1ea", 0.6);
  const alu = reg("#c9ccd2", 0.25, 0.85);
  const bread = reg("#d9a85f", 0.8);
  const salad = reg("#5e8f3a", 0.8);

  const mesh = (geo: THREE.BufferGeometry, m: THREE.Material, parent: THREE.Object3D, x = 0, y = 0, z = 0) => {
    const o = new THREE.Mesh(geo, m);
    o.position.set(x, y, z);
    parent.add(o);
    return o;
  };

  /** Une jambe : hanche → cuisse → genou → tibia → chaussure. */
  const makeLeg = (body: THREE.Group, x: number, m: THREE.Material): Limb => {
    const root = new THREE.Group();
    root.position.set(x, 0.92, 0);
    body.add(root);
    mesh(g.thigh, m, root);
    const joint = new THREE.Group();
    joint.position.y = -0.46;
    root.add(joint);
    mesh(g.shin, m, joint);
    mesh(g.shoe, shoe, joint, 0, -0.42, 0.04);
    return { root, joint };
  };
  /** Un bras : épaule → manche (tee-shirt) → coude → avant-bras → main. */
  const makeArm = (body: THREE.Group, x: number, shirt: THREE.Material, skin: THREE.Material): Limb => {
    const root = new THREE.Group();
    root.position.set(x, 1.4, 0);
    body.add(root);
    mesh(g.upper, shirt, root);
    const joint = new THREE.Group();
    joint.position.y = -0.3;
    root.add(joint);
    mesh(g.fore, skin, joint);
    mesh(g.hand, skin, joint, 0, -0.27, 0);
    return { root, joint };
  };

  // rangée du fond, aile de NP, et une ligne sous la toile
  const loops = [
    loop([[1.6, 1.6], [22, 1.6], [22, 5.4], [1.6, 5.4]], roofY),
    loop([[25.6, 1.6], [29.4, 1.6], [29.4, 14.4], [25.6, 14.4]], roofY),
    loop([[19.5, 2.6], [8, 4.6]], roofY),
  ];
  // qui fait quoi : 4 avec un MacBook, 3 avec un sandwich, 4 qui dansent
  const plan: Activity[] = ["laptop", "eat", "laptop", "eat", "laptop", "eat", "laptop", "dance", "dance", "dance", "dance"];
  const dancers: [number, number][] = [[8.2, 2.6], [9.4, 3.8], [10.6, 2.4], [9.2, 1.5]];
  const people: Person[] = [];
  plan.forEach((activity, i) => {
    const shirt = shirts[i % shirts.length];
    const skin = skins[i % skins.length];
    const obj = new THREE.Group();
    obj.name = `etudiant-${i + 1}-${activity}`;
    const body = new THREE.Group();
    obj.add(body);
    const pant = pants[i % pants.length];
    const legs: [Limb, Limb] = [makeLeg(body, -0.09, pant), makeLeg(body, 0.09, pant)];
    mesh(g.torso, shirt, body, 0, 1.2, 0);
    mesh(g.neck, skin, body, 0, 1.47, 0);
    mesh(g.head, skin, body, 0, 1.6, 0);
    mesh(g.hair, hairs[i % hairs.length], body, 0, 1.63, -0.012);
    const arms: [Limb, Limb] = [makeArm(body, -0.225, shirt, skin), makeArm(body, 0.225, shirt, skin)];
    if (activity === "laptop") {
      // MacBook fermé, coincé sous le bras gauche, tenu par la main
      const lap = mesh(g.laptop, alu, arms[0].joint, 0.02, -0.18, 0.02);
      lap.rotation.set(0, 0, Math.PI / 2);
    }
    if (activity === "eat") {
      // sandwich dans la main droite
      const s = new THREE.Group();
      s.position.set(0, -0.31, 0.03);
      arms[1].joint.add(s);
      mesh(g.bread, bread, s, 0, -0.022, 0);
      mesh(g.filling, salad, s, 0, 0, 0);
      mesh(g.bread, bread, s, 0, 0.022, 0);
    }
    group.add(obj);
    const l = loops[activity === "dance" ? 2 : i % 2];
    const home = activity === "dance" ? new THREE.Vector3(dancers[(i - 7) % dancers.length][0], roofY, dancers[(i - 7) % dancers.length][1]) : new THREE.Vector3();
    if (activity === "dance") obj.position.copy(home);
    people.push({
      obj, body, legs, arms, activity, ...l, home,
      speed: activity === "eat" ? 0.55 : 0.8 + ((i * 37) % 10) / 30,
      phase: i * 1.7,
    });
  });
  return people;
}

/** Fait avancer et bouger chaque étudiant au temps t (secondes). */
export function animatePeople(people: Person[], t: number) {
  for (const p of people) {
    const [legL, legR] = p.legs;
    const [armL, armR] = p.arms;
    if (p.activity === "dance") {
      // sur place : rebond, balancement des hanches, bras levés en alternance
      const b = t * 4.2 + p.phase;
      p.body.position.y = Math.abs(Math.sin(b)) * 0.06;
      p.body.rotation.y = Math.sin(b * 0.5) * 0.5;
      p.body.rotation.z = Math.sin(b) * 0.06;
      armL.root.rotation.set(0, 0, -(1.6 + Math.sin(b) * 0.9));
      armR.root.rotation.set(0, 0, 1.6 + Math.sin(b + Math.PI) * 0.9);
      armL.joint.rotation.z = -0.6 - Math.sin(b) * 0.4;
      armR.joint.rotation.z = 0.6 + Math.sin(b) * 0.4;
      legL.root.rotation.x = Math.sin(b) * 0.25;
      legR.root.rotation.x = -Math.sin(b) * 0.25;
      legL.joint.rotation.x = Math.max(0, Math.sin(b)) * 0.5;
      legR.joint.rotation.x = Math.max(0, -Math.sin(b)) * 0.5;
      p.obj.rotation.y = t * 0.3 + p.phase;
      continue;
    }
    // marche le long de la boucle
    let d = (p.phase * 3 + p.speed * t) % p.total;
    let i = 0;
    while (d > p.lengths[i]) {
      d -= p.lengths[i];
      i = (i + 1) % p.lengths.length;
    }
    const a = p.path[i];
    const c = p.path[(i + 1) % p.path.length];
    p.obj.position.lerpVectors(a, c, p.lengths[i] ? d / p.lengths[i] : 0);
    p.obj.rotation.y = Math.atan2(c.x - a.x, c.z - a.z);
    const s = t * p.speed * 6.5 + p.phase;
    const swing = Math.sin(s) * 0.45;
    legL.root.rotation.x = swing;
    legR.root.rotation.x = -swing;
    legL.joint.rotation.x = Math.max(0, -Math.sin(s)) * 0.7; // genou qui plie au retour
    legR.joint.rotation.x = Math.max(0, Math.sin(s)) * 0.7;
    p.body.position.y = Math.abs(Math.cos(s)) * 0.03;
    if (p.activity === "laptop") {
      // bras gauche plaqué (il tient le MacBook), bras droit qui balance
      armL.root.rotation.set(-0.15, 0, -0.12);
      armL.joint.rotation.x = -1.2;
      armR.root.rotation.set(-swing * 0.8, 0, 0.06);
      armR.joint.rotation.x = -0.25;
    } else {
      // sandwich : la main droite monte à la bouche toutes les ~3 s
      const bite = Math.max(0, Math.sin(t * 2.1 + p.phase));
      armR.root.rotation.set(-0.35 - bite * 0.9, 0, 0.1);
      armR.joint.rotation.x = -1.0 - bite * 1.15;
      armL.root.rotation.set(swing * 0.7, 0, -0.06);
      armL.joint.rotation.x = -0.2;
    }
  }
}
