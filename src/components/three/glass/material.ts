/**
 * Verre optique et studio d'éclairage — port du skill premium-3d-glass.
 * Valeurs reprises telles quelles : transmission 1, rugosité 0.025, IOR 1.46,
 * iridescence 0.60, vernis 0.65, dispersion 0.018.
 */
import * as THREE from "three";

/**
 * Studio procédural : des panneaux lumineux (softboxes) convertis en
 * environnement par PMREMGenerator. Ils donnent au verre ses reflets.
 * Teintes du skill, sauf deux panneaux passés à l'or HEI (reflets chauds).
 */
export function createGlassEnvironment(renderer: THREE.WebGLRenderer, scene: THREE.Scene) {
  const studio = new THREE.Scene();
  studio.background = new THREE.Color("#080b10");
  const panels: [number, number, number, number, number, string, number][] = [
    [2.8, 8, -4, 2, 3, "#ffffff", 2.6],
    [0.65, 7, 3, 1, 2, "#dceeff", 4.0],
    [5, 0.7, 0, 5, -1, "#ffffff", 3.5],
    [0.5, 6, -2, 0, -4, "#6f8fe8", 3.0], // bleu HEI (skill : violet)
    [1.0, 5, 3, -1, -3, "#ffd88a", 2.4], // or doux (skill : rose)
    [4, 0.35, 0, -3, 3, "#92bbff", 3.0],
    [0.16, 5, -3, 0, 2, "#ffffff", 5.0],
    [0.35, 4, 4, 0, -2, "#dfa408", 2.0], // or HEI (skill : orange)
  ];
  for (const [w, h, x, y, z, color, intensity] of panels) {
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(color).multiplyScalar(intensity),
        side: THREE.DoubleSide,
      }),
    );
    panel.position.set(x, y, z);
    panel.lookAt(0, 0, 0);
    studio.add(panel);
  }
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(studio, 0.025, 0.1, 100);
  scene.environment = environment.texture;
  studio.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
      (object.material as THREE.Material).dispose();
    }
  });
  pmrem.dispose();
  return environment;
}

/**
 * Le verre. Three.js r187 a un paramètre `dispersion`, mais le skill a son
 * propre réglage : trois réfractions (rouge / vert / bleu) dont l'écart
 * grandit aux angles rasants. On greffe donc le même calcul dans le shader.
 * La signature de getIBLVolumeRefraction a changé depuis r160 (le skill) :
 * elle prend maintenant `diffuseContribution`, `specularColorBlended` et
 * `dispersion` — la greffe ci-dessous suit la nouvelle signature.
 */
export function createGlassMaterial() {
  const glass = new THREE.MeshPhysicalMaterial({
    color: "#fafcff",
    metalness: 0.0,
    roughness: 0.025,
    transmission: 1.0,
    thickness: 0.48,
    ior: 1.46,
    attenuationColor: new THREE.Color("#edf7ff"),
    attenuationDistance: 8.0,
    clearcoat: 0.65,
    clearcoatRoughness: 0.018,
    iridescence: 0.6,
    iridescenceIOR: 1.3,
    // r187 : iridescenceThicknessRange [100, 420] du skill, renommé en min / max
    iridescenceThicknessMinimum: 100,
    iridescenceThicknessMaximum: 420,
    envMapIntensity: 1.1,
    side: THREE.DoubleSide,
  });

  glass.onBeforeCompile = (shader) => {
    shader.uniforms.uChromaticSpread = { value: 0.018 };
    shader.fragmentShader = "uniform float uChromaticSpread;\n" + shader.fragmentShader;
    const call = (ior: string) => `getIBLVolumeRefraction(
        n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
        pos, modelMatrix, viewMatrix, projectionMatrix, 0.0, ${ior}, material.thickness,
        material.attenuationColor, material.attenuationDistance )`;
    const transmission = THREE.ShaderChunk.transmission_fragment.replace(
      /vec4 transmitted = getIBLVolumeRefraction\([\s\S]*?\);/,
      `// Faces avant claires, accents spectraux sur les bords rasants.
      float chromaticSpread = uChromaticSpread * mix(0.35, 1.0,
          smoothstep(0.15, 0.85, 1.0 - abs(dot(n, v))));
      vec4 transmitted = ${call("material.ior")};
      vec4 transmittedRed = ${call("material.ior - chromaticSpread")};
      vec4 transmittedBlue = ${call("material.ior + chromaticSpread")};
      transmitted = vec4(transmittedRed.r, transmitted.g, transmittedBlue.b,
          (transmittedRed.a + transmitted.a + transmittedBlue.a) / 3.0);`,
    );
    if (transmission === THREE.ShaderChunk.transmission_fragment) {
      // la greffe n'a pas pris (nouvelle version de Three) : on garde le verre sans dispersion
      console.warn("[glass] dispersion graft skipped: transmission chunk changed");
    }
    shader.fragmentShader = shader.fragmentShader.replace("#include <transmission_fragment>", transmission);
  };
  glass.customProgramCacheKey = () => "hei-clear-glass-edge-dispersion-r187";
  return glass;
}
