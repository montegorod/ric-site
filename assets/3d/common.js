// Основа живых сцен сайта: то же, что src/common.js, но для блока страницы и без тяжёлого bloom.
import * as THREE from 'three';

export const TAU = Math.PI * 2;
export const C = { green: 0x00d26a, mint: 0x7dffb8, blue: 0x2962ff };
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const fract = (x) => x - Math.floor(x);
export const LIGHT = matchMedia('(max-width:700px), (pointer:coarse)').matches;
export const REDUCE = matchMedia('(prefers-reduced-motion:reduce)').matches;
export const EN = document.documentElement.lang === 'en';

export function random(seed = 1) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function stage(canvas, { fov = 36 } = {}) {
  // preserveDrawingBuffer только для неподвижного кадра: из него снимается запасная картинка
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: REDUCE });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 300);
  const size = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  size();
  return { renderer, scene, camera, size, render: () => renderer.render(scene, camera) };
}

export function glow(color, size, opacity = 1) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d'), r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  for (let i = 0; i <= 10; i++) r.addColorStop(i / 10, `rgba(255,255,255,${((1 - i / 10) ** 2.3).toFixed(3)})`);
  g.fillStyle = r;
  g.fillRect(0, 0, 256, 256);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending }));
  s.scale.setScalar(size);
  return s;
}

export function comet(curve, color, radius = 0.015, base = 0.1) {
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { head: { value: 0 }, color: { value: new THREE.Color(color) }, base: { value: base } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: `varying vec2 vUv; uniform float head; uniform float base; uniform vec3 color;
      void main(){ float d = head - vUv.x; float tail = d > 0. ? exp(-d * 7.) : exp(d * 90.); float edge = smoothstep(0., .03, vUv.x);
        gl_FragColor = vec4(color * (base + tail * 2.6), min(1., base + tail) * edge); }`,
  });
  return new THREE.Mesh(new THREE.TubeGeometry(curve, LIGHT ? 32 : 64, radius, 5), m);
}

export function dust(n, box, color = C.green, seed = 7, size = 0.025) {
  const r = random(seed), base = [];
  for (let i = 0; i < n; i++) base.push((r() - 0.5) * box[0], (r() - 0.5) * box[1], (r() - 0.5) * box[2]);
  const geo = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(base.slice(), 3));
  const obj = new THREE.Points(geo, new THREE.PointsMaterial({ color, size: size * 2, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending }));
  obj.userData.update = (p) => {
    const a = geo.attributes.position;
    for (let i = 0; i < n; i++) a.setXYZ(i, base[i * 3] + Math.sin(TAU * p + i) * 0.35, base[i * 3 + 1] + Math.sin(TAU * p * 2 + i * 1.7) * 0.3, base[i * 3 + 2] + Math.cos(TAU * p + i) * 0.35);
    a.needsUpdate = true;
  };
  return obj;
}

// 12 секунд по кругу; стоит вне экрана, в скрытой вкладке и при «меньше движения»
export function play(canvas, st, frame, { seconds = 12, still = 9.4, start = 1.6 } = {}) {
  const FPS = LIGHT ? 24 : 30;
  let seen = true, raf = 0, last = 0, t = REDUCE ? still : start;
  // слабая машина: два замера подряд ниже 14 к/с, и вместо анимации остаётся картинка
  let slow = false, warm = 0, from = 0, count = 0, strikes = 0;
  const tooSlow = (now) => {
    if (!warm) warm = now + 1500;
    if (now < warm) return false;
    if (!from) { from = now; count = 0; return false; }
    count++;
    if (now - from < 2000) return false;
    strikes = count / ((now - from) / 1000) < 14 ? strikes + 1 : 0;
    from = now; count = 0;
    return strikes >= 2;
  };
  const draw = () => frame((t % seconds) / seconds);
  const tick = (now) => {
    raf = requestAnimationFrame(tick);
    if (now - last < 1000 / FPS - 4) return;
    if (last) t += Math.min(0.1, (now - last) / 1000);
    last = now;
    if (tooSlow(now)) {
      slow = true; cancelAnimationFrame(raf); raf = 0;
      canvas.classList.remove('ready'); canvas.dataset.slow = 'fps';
      return;
    }
    draw();
    canvas.dataset.frames = (+canvas.dataset.frames || 0) + 1;
  };
  const state = () => {
    const on = seen && !document.hidden && !REDUCE && !slow;
    if (on && !raf) { last = warm = from = 0; raf = requestAnimationFrame(tick); }
    if (!on && raf) { cancelAnimationFrame(raf); raf = 0; }
  };
  new IntersectionObserver((e) => { seen = e[e.length - 1].isIntersecting; state(); }).observe(canvas);
  new ResizeObserver(() => { if (slow) return; st.size(); draw(); }).observe(canvas);
  document.addEventListener('visibilitychange', state);
  canvas.addEventListener('webglcontextlost', () => canvas.classList.remove('ready'));
  canvas.addEventListener('webglcontextrestored', () => { if (!slow) canvas.classList.add('ready'); });
  draw();
  canvas.classList.add('ready');
  state();
}
