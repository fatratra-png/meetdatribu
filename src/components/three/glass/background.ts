/**
 * Fond en dégradé piloté par le scroll — shader du skill premium-3d-glass,
 * inchangé hormis la palette : cinq couleurs, une par chapitre.
 */
import * as THREE from "three";

/**
 * Palette HEI le long du scroll. Le navy #001948 pur serait invisible dans
 * ce shader (il éclaire à 13 % sur du noir) : on utilise donc des bleus de la
 * même teinte que le navy HEI, plus lumineux, et l'or HEI pour le moment de la
 * recomposition (le chapitre où le symbole redevient entier).
 */
export const HEI_PALETTE = ["#3a6ee8", "#2a52c4", "#dfa408", "#4a78e6", "#1d3f94"];

export function createBackgroundUniforms(palette = HEI_PALETTE) {
  const paletteUniforms = Object.fromEntries(
    palette.map((hex, i) => [`uC${i}`, { value: new THREE.Color(hex) }]),
  );
  return {
    ...paletteUniforms,
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uScroll: { value: 0 },
    uVelocity: { value: 0 },
  } as Record<string, THREE.IUniform> & {
    uTime: THREE.IUniform<number>;
    uResolution: THREE.IUniform<THREE.Vector2>;
    uMouse: THREE.IUniform<THREE.Vector2>;
    uScroll: THREE.IUniform<number>;
    uVelocity: THREE.IUniform<number>;
  };
}

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uMouse;
  uniform float uScroll;
  uniform float uVelocity;

  mat2 rotate2d(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a)); }
  float fineLine(float d, float width) {
    return 1.0 - smoothstep(width, width + 1.5 / uResolution.y, abs(d));
  }
  uniform vec3 uC0; uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3; uniform vec3 uC4;
  vec3 chapterColor(float progress) {
    if (progress < 0.34) return mix(uC0, uC1, smoothstep(0.02, 0.32, progress));
    if (progress < 0.62) return mix(uC1, uC2, smoothstep(0.36, 0.60, progress));
    if (progress < 1.0) return mix(uC2, uC3, smoothstep(0.66, 0.94, progress));
    return mix(uC3, uC4, smoothstep(1.0, 1.2, progress));
  }
  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
    float s = uScroll;
    float time = uTime * 0.065;
    vec3 primary = chapterColor(s);
    vec3 secondary = chapterColor(min(1.22, s + 0.18));
    // base : un noir légèrement navy (skill : noir neutre 0.003/0.005/0.010)
    vec3 color = vec3(0.0, 0.016, 0.05);

    vec2 haloUv = (uv - vec2(0.16 + 0.16 * sin(s * 4.0), 0.14)) * vec2(1.20, 1.8);
    float halo = exp(-dot(haloUv, haloUv) * 2.8);
    vec2 lowerUv = (uv + vec2(0.40, 0.30)) * vec2(1.6, 2.6);
    color += primary * halo * 0.13;
    color += secondary * exp(-dot(lowerUv, lowerUv) * 2.0) * 0.04;

    vec2 p = rotate2d(-0.24 + s * 0.65) * (uv - vec2(0.06, -0.08));
    p += uMouse * 0.018;
    p.x += 0.15 * sin(p.y * 2.8 + s * 4.8 + time * 0.3);
    p.y += 0.09 * cos(p.x * 3.1 - s * 3.8 - time * 0.2);

    for (int i = 0; i < 3; i++) {
      float k = float(i);
      vec2 q = p + vec2(0.0, 0.012 * sin(time + k));
      float radius = length(q * vec2(0.90, 1.22));
      float angle = atan(q.y, q.x);
      float contour = 0.34 + k * 0.145
        + 0.075 * sin(angle * 2.0 + s * 5.0 + k * 0.28)
        + 0.022 * cos(angle * 3.0 - time);
      float d = radius - contour;
      float arc = smoothstep(-0.65, 0.65, sin(angle + k * 0.55 + s * 3.5));
      vec3 tint = mix(primary, secondary, k * 0.38);
      float body = exp(-pow(d * 25.0, 2.0));
      float shoulder = exp(-pow((d + 0.018) * 13.0, 2.0));
      color += tint * (body * 0.10 + shoulder * 0.025) * arc;
      color += mix(tint, vec3(0.72, 0.82, 0.94), 0.20)
        * fineLine(d, 0.0008) * arc * (0.16 + uVelocity * 0.06);
    }

    vec2 gridUv = rotate2d(-0.20 + s * 0.18) * uv + vec2(s * 0.08, s * 0.16);
    vec2 cell = abs(fract(gridUv * 10.0) - 0.5);
    float grid = max(fineLine((0.5 - cell.x) / 10.0, 0.0002), fineLine((0.5 - cell.y) / 10.0, 0.0002));
    float periphery = smoothstep(0.28, 0.80, length(uv));
    color += primary * grid * periphery * 0.025;

    float vignette = 1.0 - smoothstep(0.36, 1.20, length(uv * vec2(0.8, 1.0)));
    color *= mix(0.25, 1.0, vignette);
    float textShade = (1.0 - smoothstep(-0.5, 0.1, uv.y)) * (1.0 - smoothstep(-0.25, 0.3, uv.x));
    color *= 1.0 - textShade * 0.38;
    gl_FragColor = vec4(color, 1.0);
  }
`;

/** Plan accroché à la caméra, loin derrière : il remplit toujours le cadre. */
export function createBackground(camera: THREE.Camera, uniforms: Record<string, THREE.IUniform>) {
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    depthWrite: false,
    depthTest: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), material);
  mesh.position.set(0, 0, -8);
  mesh.renderOrder = -10;
  camera.add(mesh);
  return mesh;
}
