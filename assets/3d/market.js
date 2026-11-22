// 2. Объёмный график: город из свечей, камера следует за мышкой.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { C as BASE_C, TAU, LIGHT, EN, REDUCE, random, dust, glow, smooth, fract, play } from 'ric/common';
import { stage, labels } from 'ric/globe-base';
const C = { ...BASE_C, red: 0xf23645 };

const ROWS = 4, N = 30, STEP = 0.92, COPIES = [-1, 0, 1];

export default async function (canvas) {
  const st = stage(canvas, { fov: 40, disc: -1, bloom: 0.38, threshold: 0.55, radius: 0.4 });
  const { renderer, scene, camera, render } = st, tag = labels(canvas);
  scene.fog = new THREE.FogExp2(0x000000, 0.04);
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.28;
  const key = new THREE.DirectionalLight(0xbfffe0, 1.5);
  key.position.set(4, 10, 8);
  scene.add(key);
  const blue = new THREE.PointLight(C.blue, 90, 30);
  blue.position.set(9, 7, -5);
  scene.add(blue);

  const rand = random(29), rows = [];
  for (let r = 0; r < ROWS; r++) {
    const a = rand() * TAU, b = rand() * TAU, c = rand() * TAU;
    const f = (i) => 2.7 + r * 0.3 + Math.sin(i / N * TAU + a) * 1.5 + Math.sin(i / N * TAU * 3 + b) * 0.95 + Math.sin(i / N * TAU * 7 + c) * 0.45;
    rows.push(Array.from({ length: N }, (_, i) => {
      const o = f(i), cl = f(i + 1);
      return { o, c: cl, h: Math.max(o, cl) + 0.12 + rand() * 0.42, l: Math.min(o, cl) - 0.12 - rand() * 0.42 };
    }));
  }

  const total = ROWS * N * COPIES.length;
  const body = new RoundedBoxGeometry(1, 1, 1, 2, 0.07), wick = new THREE.BoxGeometry(1, 1, 1);
  const pillar = new THREE.BoxGeometry(1, 1, 1);
  const inst = (geo, mat, n = total) => {
    const m = new THREE.InstancedMesh(geo, mat, n);
    m.frustumCulled = false;
    scene.add(m);
    return m;
  };
  const solid = (color, glowK) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: glowK, metalness: 0.5, roughness: 0.22 });
  const up = inst(body, solid(C.green, 0.16)), down = inst(body, solid(C.red, 0.14));
  const upW = inst(wick, solid(C.green, 0.4)), downW = inst(wick, solid(C.red, 0.35));
  const ghost = (color, opacity) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending });
  const upR = inst(body, ghost(C.green, 0.04)), downR = inst(body, ghost(C.red, 0.028));
  const stem = inst(pillar, ghost(0x0a6b45, 0.06));

  // пол-сетка
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(90, 60), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { move: { value: 0 } },
    vertexShader: 'varying vec2 q; void main(){ q = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: `varying vec2 q; uniform float move;
      void main(){ vec2 g = vec2((q.x + move) / 1.84, q.y / 1.84); vec2 d = abs(fract(g - .5) - .5) / fwidth(g);
        float l = 1. - min(min(d.x, d.y), 1.); float fade = exp(-length(q) * .085);
        gl_FragColor = vec4(vec3(0., .75, .4), l * fade * .36); }`,
  }));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const ribbonMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(C.mint).multiplyScalar(1.2) });
  const ribbon = new THREE.Mesh(new THREE.BufferGeometry(), ribbonMat);
  ribbon.frustumCulled = false;
  scene.add(ribbon);
  const dot = glow(C.mint, 1.1, 0.9);
  scene.add(dot);
  const price = new THREE.Mesh(new THREE.BoxGeometry(16, 0.012, 0.012), ghost(C.mint, 0.5));
  scene.add(price);
  const motes = dust(LIGHT ? 300 : 1400, [34, 14, 22], C.green, 3, 0.022);
  motes.position.y = 4;
  scene.add(motes);

  const copied = tag(EN ? '<i>✓</i>Trade copied' : '<i>✓</i>Сделка скопирована'), stop = tag(EN ? '<i>●</i>Stop-loss set' : '<i>●</i>Стоп-лосс установлен');
  let mouse = null, sx = 0, sy = 0;
  if (!LIGHT && !REDUCE) addEventListener('pointermove', (e) => { mouse = [e.clientX / innerWidth * 2 - 1, e.clientY / innerHeight * 2 - 1]; }, { passive: true });
  const o = new THREE.Object3D(), v = new THREE.Vector3();

  const frame = (p) => {
    const tx = mouse ? mouse[0] : Math.sin(p * TAU), ty = mouse ? mouse[1] * 0.7 : Math.sin(p * TAU * 2) * 0.7;
    const ease = REDUCE ? 1 : 0.14; sx += (tx - sx) * ease; sy += (ty - sy) * ease;
    const mx = sx, my = sy;
    camera.position.set(1.5 + mx * 2.8, 6.4 - my * 1.6, 15.2 - Math.abs(mx) * 0.8);
    camera.lookAt(0.6, 2.6, -1.5);
    camera.updateMatrixWorld();

    const move = p * N * STEP;
    floor.material.uniforms.move.value = move;
    const n = { up: 0, down: 0, stem: 0 };
    for (let r = 0; r < ROWS; r++) {
      const z = 3 - r * 4.2;
      for (const copy of COPIES) for (let i = 0; i < N; i++) {
        const x = (i + copy * N) * STEP - move + 0.5 * N * STEP;
        const s = smooth(-7.6, -2.8, x) * (1 - smooth(10, 17, x));
        if (s < 0.01) continue;
        const k = rows[r][i], good = k.c >= k.o, idx = good ? n.up++ : n.down++;
        const lo = Math.min(k.o, k.c), h = Math.max(0.09, Math.abs(k.c - k.o));
        o.position.set(x, (lo + h / 2) * s, z); o.scale.set(0.56 * s, h * s, 0.56 * s); o.updateMatrix();
        (good ? up : down).setMatrixAt(idx, o.matrix);
        o.position.y *= -1; o.updateMatrix();
        (good ? upR : downR).setMatrixAt(idx, o.matrix);
        o.position.set(x, (k.h + k.l) / 2 * s, z); o.scale.set(0.07 * s, (k.h - k.l) * s, 0.07 * s); o.updateMatrix();
        (good ? upW : downW).setMatrixAt(idx, o.matrix);
        o.position.set(x, lo * s / 2, z); o.scale.set(0.56 * s, lo * s, 0.56 * s); o.updateMatrix();
        stem.setMatrixAt(n.stem++, o.matrix);
      }
    }
    for (const [m, count] of [[up, n.up], [upW, n.up], [upR, n.up], [down, n.down], [downW, n.down], [downR, n.down], [stem, n.stem]]) {
      m.count = count; m.instanceMatrix.needsUpdate = true;
    }

    // светящаяся линия цены над передним рядом
    const at = (x) => {
      const u = (x + move - 0.5 * N * STEP) / STEP, i = Math.floor(u), t = u - i;
      const a = rows[0][((i % N) + N) % N], b = rows[0][(((i + 1) % N) + N) % N];
      return (a.o + a.c) / 2 * (1 - t) + (b.o + b.c) / 2 * t + 0.85;
    };
    const line = [];
    for (let x = -4.4; x <= 2.801; x += 0.45) line.push(new THREE.Vector3(x, at(x), 3.15));
    ribbon.geometry.dispose();
    ribbon.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(line), LIGHT ? 48 : 120, 0.03, LIGHT ? 5 : 8);
    const head = line[line.length - 1];
    dot.position.copy(head);
    price.position.set(head.x + 8, head.y, 3.15);
    motes.userData.update(p);

    const a = fract(p * 3);
    camera.updateProjectionMatrix();
    copied(head, camera, smooth(0.08, 0.14, a) * (1 - smooth(0.5, 0.58, a)), 12, -46);
    v.set(head.x, head.y - 1.7, head.z);
    stop(v, camera, smooth(0.3, 0.36, a) * (1 - smooth(0.82, 0.9, a)), 12, 0);
    render();
  };
  play(canvas, st, frame, { still: 5.4, start: 1.2 });
}
