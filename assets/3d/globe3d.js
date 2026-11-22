// 1. Глобус из точек: сделки летят дугами по миру.
import * as THREE from 'three';
import { C, TAU, LIGHT, EN, random, glow, comet, smooth, fract, play } from 'ric/common';
import { stage, points, labels } from 'ric/globe-base';
import LAND from 'ric/land';

const R = 5;
const ll = (lon, lat, r = R) => {
  const a = THREE.MathUtils.degToRad(lon), b = THREE.MathUtils.degToRad(lat);
  return new THREE.Vector3(Math.cos(b) * Math.sin(a), Math.sin(b), Math.cos(b) * Math.cos(a)).multiplyScalar(r);
};
const CITIES = [[-0.1, 51.5], [2.3, 48.9], [13.4, 52.5], [37.6, 55.8], [30.5, 50.4], [55.3, 25.2], [72.9, 19.1], [103.8, 1.35], [114.2, 22.3], [139.7, 35.7], [28, -26.2], [3.4, 6.5], [31.2, 30], [-74, 40.7], [-79.4, 43.7], [-46.6, -23.5], [-58.4, -34.6], [-3.7, 40.4], [18.1, 59.3], [76.9, 43.2], [100.5, 13.8], [36.8, -1.3], [-95.4, 29.8], [-118.2, 34], [-70.7, -33.4], [-21.9, 64.1]];

export default async function (canvas) {
  const FOV = 38, D = Math.hypot(3.6, 21.2), SR = R * 0.99;
  const disc = SR / Math.sqrt(D * D - SR * SR) / Math.tan(THREE.MathUtils.degToRad(FOV / 2)) / 2;
  const st = stage(canvas, { fov: FOV, disc });
  const { scene, camera, render } = st, tag = labels(canvas);
  const rand = random(11);
  camera.position.set(0, 3.6, 21.2);
  camera.lookAt(0, 0, 0);

  // карта суши
  const cv = document.createElement('canvas');
  cv.width = 2048; cv.height = 1024;
  const g = cv.getContext('2d', { willReadFrequently: true });
  g.fillStyle = '#fff';
  {
    const polys = LAND;
    for (const poly of polys) {
      g.beginPath();
      for (const ring of poly) {
        ring.forEach(([x, y], i) => g[i ? 'lineTo' : 'moveTo']((x + 180) / 360 * 2048, (90 - y) / 180 * 1024));
        g.closePath();
      }
      g.fill('evenodd');
    }
  }
  const mask = g.getImageData(0, 0, 2048, 1024).data;

  const world = new THREE.Group(), tilt = new THREE.Group();
  tilt.add(world);
  scene.add(tilt);
  const cityV = CITIES.map(([x, y]) => ll(x, y, 1));
  const pos = [], col = [], size = [], dark = new THREE.Color(0x22d684), light = new THREE.Color(C.mint), c = new THREE.Color();
  const N = LIGHT ? 42000 : 110000;
  for (let i = 0; i < N; i++) {
    const y = 1 - (2 * (i + 0.5)) / N, rr = Math.sqrt(1 - y * y), a = (i * 2.399963229728653) % TAU;
    const v = new THREE.Vector3(Math.sin(a) * rr, y, Math.cos(a) * rr);
    const u = (Math.atan2(v.x, v.z) / TAU + 0.5) * 2048, w = (0.5 - Math.asin(y) / Math.PI) * 1024;
    if (mask[((Math.min(1023, w | 0) * 2048) + Math.min(2047, u | 0)) * 4 + 3] < 120) continue;
    let near = 0;
    for (const cc of cityV) near = Math.max(near, smooth(0.9988, 1, v.dot(cc)));
    const spark = rand() < 0.012 ? 1 : 0, k = Math.min(1, near * rand() * 1.5 + spark * 0.8);
    c.copy(dark).lerp(light, k).multiplyScalar(0.75 + k * 0.6 + rand() * 0.3);
    v.multiplyScalar(R * 1.002);
    pos.push(v.x, v.y, v.z); col.push(c.r, c.g, c.b); size.push((0.034 + k * 0.014) * (LIGHT ? 1.45 : 1));
  }
  world.add(points(pos, col, size));

  const normalShader = 'varying vec3 vN; varying vec3 vP; void main(){ vN = normalize(normalMatrix * normal); vec4 m = modelViewMatrix * vec4(position, 1.); vP = m.xyz; gl_Position = projectionMatrix * m; }';
  tilt.add(new THREE.Mesh(new THREE.SphereGeometry(R * 0.99, 96, 64), new THREE.ShaderMaterial({
    vertexShader: normalShader,
    fragmentShader: 'varying vec3 vN; varying vec3 vP; void main(){ float f = pow(1. - abs(dot(normalize(vN), normalize(-vP))), 3.5); gl_FragColor = vec4(vec3(.002,.009,.012) + vec3(.0,.16,.12) * f, 1.); }',
  })));
  tilt.add(new THREE.Mesh(new THREE.SphereGeometry(R * 1.13, 96, 64), new THREE.ShaderMaterial({
    side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexShader: normalShader,
    fragmentShader: 'varying vec3 vN; varying vec3 vP; void main(){ float d = max(0., dot(normalize(vN), normalize(vP))); float a = pow(smoothstep(0., .52, d), 3.); gl_FragColor = vec4(vec3(.02,.75,.48) * a, a * .3); }',
  })));

  const grid = [];
  for (let lat = -60; lat <= 60; lat += 30) for (let x = -180; x < 180; x += 4) grid.push(...ll(x, lat, R).toArray(), ...ll(x + 4, lat, R).toArray());
  for (let x = -180; x < 180; x += 30) for (let y = -88; y < 88; y += 4) grid.push(...ll(x, y, R).toArray(), ...ll(x, y + 4, R).toArray());
  const gg = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(grid, 3));
  world.add(new THREE.LineSegments(gg, new THREE.LineBasicMaterial({ color: 0x0b5a44, transparent: true, opacity: 0.22 })));

  // центр копирования и дуги
  const hub = ll(19.2, 42.4, R * 1.012);
  const ring = new THREE.RingGeometry(0.8, 1, 48);
  const ringAt = (v, color) => {
    const m = new THREE.Mesh(ring, new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    m.position.copy(v);
    m.lookAt(v.clone().multiplyScalar(2));
    world.add(m);
    return m;
  };
  const hubRings = [0, 1, 2].map(() => ringAt(hub, C.mint));
  const hubGlow = glow(C.mint, 0.75, 0.8);
  hubGlow.position.copy(hub.clone().multiplyScalar(1.03));
  world.add(hubGlow);

  const arcs = CITIES.map(([x, y], i) => {
    const end = ll(x, y, R * 1.012), angle = hub.angleTo(end), line = [];
    const na = hub.clone().normalize(), nb = end.clone().normalize();
    for (let k = 0; k <= 40; k++) {
      const t = k / 40, n = na.clone().lerp(nb, t).normalize();
      line.push(n.multiplyScalar(R * 1.012 + Math.sin(Math.PI * t) * Math.min(2.1, 0.2 + angle * 1.05)));
    }
    const mesh = comet(new THREE.CatmullRomCurve3(line), i % 5 ? 0x1cf08a : 0x5b8cff, 0.016, 0.07);
    world.add(mesh);
    return { mesh, end, ring: ringAt(end, i % 5 ? C.green : 0x5b8cff), at: (i * 0.137) % 0.45 };
  });

  // кольца-орбиты и звёзды
  const orbit = new THREE.Group();
  [6.3, 6.75].forEach((r, i) => {
    const l = [];
    for (let k = 0; k < 160; k++) l.push(new THREE.Vector3(Math.cos(k / 160 * TAU) * r, 0, Math.sin(k / 160 * TAU) * r));
    const o = comet(new THREE.CatmullRomCurve3(l, true), i ? C.blue : C.green, 0.008, 0.045);
    o.rotation.set(0.45 - i * 0.8, 0, 0.35 + i * 0.15);
    o.userData.offset = i * 0.5;
    orbit.add(o);
  });
  scene.add(orbit);
  const sp = [], sc = [], ss = [];
  for (let i = 0; i < (LIGHT ? 450 : 1300); i++) {
    const b = 0.15 + rand() ** 3 * 0.8;
    sp.push((rand() - 0.5) * 100, (rand() - 0.5) * 60, -22 - rand() * 30);
    sc.push(b * 0.65, b, b * 0.9); ss.push(0.035 + rand() * 0.05);
  }
  scene.add(points(sp, sc, ss));

  const hubTag = tag('SmartStrike', 'hub');
  const tags = [5, 11, 18].map((i) => ({ i, show: tag(EN ? '<i>✓</i>Trade copied' : '<i>✓</i>Сделка скопирована') }));
  const wp = new THREE.Vector3(), normal = new THREE.Vector3(), toCam = new THREE.Vector3();
  const facing = (v) => {
    wp.copy(v); world.localToWorld(wp);
    normal.copy(wp).normalize(); toCam.copy(camera.position).sub(wp).normalize();
    return smooth(0.05, 0.3, normal.dot(toCam));
  };

  const frame = (p) => {
    world.rotation.y = -0.36 + Math.sin(p * TAU) * 0.5;
    tilt.rotation.x = 0.36 + Math.cos(p * TAU) * 0.05;
    scene.updateMatrixWorld();
    camera.updateMatrixWorld();
    hubRings.forEach((m, i) => {
      const f = fract(p * 6 + i / 3);
      m.scale.setScalar(0.08 + f * 0.75); m.material.opacity = (1 - f) * 0.9;
    });
    for (const a of arcs) {
      const f = fract(p * 3 - a.at);
      a.mesh.material.uniforms.head.value = f / 0.5 * 1.02 - 0.02;
      a.mesh.material.uniforms.base.value = 0.05 + 0.05 * Math.sin(Math.PI * f);
      if (f > 0.6) a.mesh.material.uniforms.head.value = 1 + (f - 0.5) * 3;
      const hit = fract(f - 0.49);
      a.ring.scale.setScalar(0.05 + hit * 0.9);
      a.ring.material.opacity = hit < 0.4 ? 1 - hit / 0.4 : 0;
    }
    orbit.children.forEach((o) => { o.material.uniforms.head.value = fract(p * 2 + o.userData.offset) * 1.2 - 0.05; });
    const f0 = facing(hub);
    hubTag(wp, camera, f0, 14, -44);
    for (const t of tags) {
      const a = arcs[t.i], h = fract(p * 3 - a.at - 0.49);
      const op = smooth(0, 0.04, h) * (1 - smooth(0.26, 0.36, h)), f = facing(a.end);
      t.show(wp, camera, op * f, 12, 4);
    }
    render();
  };
  play(canvas, st, frame, { still: 6, start: 2.4 });
}
