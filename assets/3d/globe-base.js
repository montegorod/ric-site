// Основа живого глобуса: сияние как в ролике (bloom) на прозрачном фоне страницы, точки, подписи.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { LIGHT, REDUCE } from 'ric/common';

const K = { value: 900 };

export function stage(canvas, { fov = 38, disc, bloom = 0.48, threshold = 0.4, radius = 0.45 } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: REDUCE });
  const ratio = Math.min(devicePixelRatio || 1, 1.5);
  renderer.setPixelRatio(ratio);
  renderer.setClearColor(0x000000, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 300);

  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: LIGHT ? 2 : 4 }));
  composer.setPixelRatio(ratio);
  composer.addPass(new RenderPass(scene, camera));
  const glowPass = new UnrealBloomPass(new THREE.Vector2(256, 256), bloom, radius, threshold);
  composer.addPass(glowPass);
  composer.addPass(new OutputPass());
  // bloom прозрачность не хранит: планета непрозрачна по кругу, вокруг прозрачность по яркости
  composer.addPass(new ShaderPass({
    uniforms: { tDiffuse: { value: null }, disc: { value: disc } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float disc; varying vec2 vUv;
      void main(){ vec3 c = min(texture2D(tDiffuse, vUv).rgb, vec3(1.));
        float planet = 1. - smoothstep(disc - .003, disc + .002, length(vUv - .5));
        gl_FragColor = vec4(c, max(planet, max(c.r, max(c.g, c.b)))); }`,
  }));

  const size = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    if (LIGHT) glowPass.setSize(w * ratio * 0.6, h * ratio * 0.6);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    K.value = h * ratio * 1.6 * Math.tan(THREE.MathUtils.degToRad(17)) / Math.tan(THREE.MathUtils.degToRad(fov / 2));
  };
  size();
  return { renderer, scene, camera, size, render: () => composer.render() };
}

export function points(pos, col, size) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('size', new THREE.Float32BufferAttribute(size, 1));
  const p = new THREE.Points(g, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { k: K, opacity: { value: 1 } },
    vertexShader: `attribute float size; attribute vec3 color; varying vec3 vC; uniform float k;
      void main(){ vC = color; vec4 mv = modelViewMatrix * vec4(position, 1.); gl_PointSize = max(1.2, size * k / -mv.z); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying vec3 vC; uniform float opacity;
      void main(){ float d = length(gl_PointCoord - .5) * 2.; float a = 1. - smoothstep(.25, 1., d); gl_FragColor = vec4(vC, a * opacity); }`,
  }));
  p.frustumCulled = false;
  return p;
}

export function labels(canvas) {
  const box = canvas.parentElement.querySelector('.globe-tags');
  return (text, cls = '') => {
    const e = document.createElement('span');
    e.className = `globe-tag ${cls}`;
    e.innerHTML = text;
    box.appendChild(e);
    const v = new THREE.Vector3();
    let width = 0, tries = 0;
    return (world, camera, opacity = 1, dx = 12, dy = -14) => {
      v.copy(world).project(camera);
      if (!width || tries++ % 60 === 0) width = e.offsetWidth;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      // подпись не выходит за экран: у края уходит влево от точки
      const left = canvas.getBoundingClientRect().left;
      const min = Math.max(2, 4 - left), max = Math.min(w - 2, document.documentElement.clientWidth - 4 - left) - width;
      let x = ((v.x + 1) / 2) * w + dx;
      if (x > max) x = Math.min(max, ((v.x + 1) / 2) * w - dx - width);
      const y = Math.min(h - 40, Math.max(2, ((1 - v.y) / 2) * h + dy));
      e.style.transform = `translate(${Math.max(min, x)}px, ${y}px)`;
      e.style.opacity = v.z < 1 ? opacity : 0;
    };
  };
}
