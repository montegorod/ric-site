// 5. Бык и медведь из светящихся линий. Силуэты: PhyloPic, общественное достояние / CC0.
import * as THREE from 'three';
import { C as BASE_C, TAU, LIGHT, random, dust, glow, smooth, fract, play } from 'ric/common';
import { stage, points } from 'ric/globe-base';
import { BULL, BEAR } from 'ric/silhouettes';
const C = { ...BASE_C, red: 0xf23645, gold: 0xf5c242 };

async function shape(url, flip, height, rand, erase) {
  const im = new Image();
  im.src = url;
  await im.decode();
  const h = 420, w = Math.round(h * im.naturalWidth / im.naturalHeight), W = w + 8, H = h + 8;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true });
  if (flip) { g.translate(W, 0); g.scale(-1, 1); }
  g.drawImage(im, 4, 4, w, h);
  g.setTransform(1, 0, 0, 1, 0, 0);
  if (erase) g.clearRect(W * erase[0], H * erase[1], W * (erase[2] - erase[0]), H * (erase[3] - erase[1]));
  const a = g.getImageData(0, 0, W, H).data, dist = new Float32Array(W * H);
  const inside = (x, y) => x >= 0 && y >= 0 && x < W && y < H && a[(y * W + x) * 4 + 3] > 120;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) dist[y * W + x] = inside(x, y) ? 1e6 : 0;
  const rel = (i, j, d) => { if (dist[j] + d < dist[i]) dist[i] = dist[j] + d; };
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = y * W + x; rel(i, i - 1, 1); rel(i, i - W, 1); rel(i, i - W - 1, 1.41); rel(i, i - W + 1, 1.41);
  }
  for (let y = H - 2; y > 0; y--) for (let x = W - 2; x > 0; x--) {
    const i = y * W + x; rel(i, i + 1, 1); rel(i, i + W, 1); rel(i, i + W + 1, 1.41); rel(i, i + W - 1, 1.41);
  }
  const max = dist.reduce((m, v) => Math.max(m, v), 0), k = height / h;
  const depth = (x, y) => {
    const d = Math.min(1, dist[Math.round(y) * W + Math.round(x)] / max);
    return Math.sqrt(1 - (1 - d) ** 2) * height * 0.17;
  };
  const to = (x, y, side = 1) => new THREE.Vector3((x - W / 2) * k, (H / 2 - y) * k, depth(x, y) * side);

  const edge = [], all = [];
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    if (!inside(x, y)) continue;
    all.push([x, y]);
    if (!inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1)) edge.push([x, y]);
  }
  // равномерные узлы: не ближе gap друг к другу
  const pick = (src, gap, limit) => {
    const out = [];
    for (let i = 0; i < limit; i++) {
      const p = src[(rand() * src.length) | 0];
      if (out.every((q) => (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2 >= gap * gap)) out.push(p);
    }
    return out;
  };
  const border = pick(edge, 8, 9000), core = pick(all, 17, 14000);
  const nodes = border.map((p) => ({ p, v: to(...p), edge: true }));
  for (const p of core) {
    if (dist[p[1] * W + p[0]] < 7) continue;
    nodes.push({ p, v: to(...p, 1) }, { p, v: to(...p, -1) });
  }
  const links = new Set();
  nodes.forEach((a, i) => {
    nodes.map((b, j) => [j, a.v.distanceToSquared(b.v)])
      .filter(([j, d]) => j !== i && d < (height * 0.15) ** 2)
      .sort((x, y) => x[1] - y[1]).slice(0, a.edge ? 4 : 5)
      .forEach(([j]) => {
        const b = nodes[j];
        for (const t of [0.25, 0.5, 0.75]) if (!inside(Math.round(a.p[0] + (b.p[0] - a.p[0]) * t), Math.round(a.p[1] + (b.p[1] - a.p[1]) * t))) return;
        links.add(i < j ? `${i},${j}` : `${j},${i}`);
      });
  });
  return { nodes, links: [...links].map((s) => s.split(',').map(Number)), outline: edge.map((p) => to(...p)), width: W * k };
}

function creature(s, color, light, rand) {
  const group = new THREE.Group(), c = new THREE.Color(color), l = new THREE.Color(light);
  const lp = [], lc = [];
  for (const [i, j] of s.links) for (const n of [i, j]) { lp.push(...s.nodes[n].v.toArray()); lc.push(0, 0, 0); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(lc, 3));
  group.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })));

  const np = [], nc = [], ns = [];
  for (const n of s.nodes) {
    const k = n.edge ? 0.8 : 0.3 + rand() * 0.5;
    np.push(...n.v.toArray()); nc.push(l.r * k, l.g * k, l.b * k); ns.push(n.edge ? 0.022 : 0.013 + rand() * 0.02);
  }
  group.add(points(np, nc, ns));
  const op = [], oc = [], os = [];
  for (const v of s.outline) { op.push(...v.toArray()); oc.push(c.r * 1.3, c.g * 1.3, c.b * 1.3); os.push(0.015); }
  group.add(points(op, oc, os));

  group.userData.update = (p, dir) => {
    const a = geo.attributes.color, at = geo.attributes.position;
    for (let i = 0; i < a.count; i++) {
      const u = at.getX(i) / s.width + 0.5, wave = Math.max(0, Math.sin((u * dir * 1.5 - p * 6) * TAU + at.getY(i) * 0.5)) ** 8;
      a.setXYZ(i, c.r * (0.22 + wave * 1.1), c.g * (0.22 + wave * 1.1), c.b * (0.22 + wave * 1.1));
    }
    a.needsUpdate = true;
  };
  return group;
}

export default async function (canvas) {
  const st = stage(canvas, { fov: 22.8, disc: -1, bloom: 0.5, threshold: 0.16, radius: 0.4 });
  const { scene, camera, render } = st;
  const rand = random(5);
  const bs = await shape(BULL, true, 2.72, rand, [0.275, 0.64, 0.365, 0.8]);
  const es = await shape(BEAR, false, 2.68, rand);
  const bull = creature(bs, C.green, C.mint, rand), bear = creature(es, C.red, 0xff9a8a, rand);
  scene.add(bull, bear);

  // свечи под ногами: у быка растут, у медведя падают
  const box = new THREE.BoxGeometry(1, 1, 1), bars = [];
  for (let i = 0; i < 34; i++) {
    const x = (i - 16.5) * 0.31, good = x < 0;
    const m = new THREE.Mesh(box, new THREE.MeshBasicMaterial({ color: good ? C.green : C.red, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    m.position.set(x, 0, -1.7);
    m.userData = { x, good, h: 0.2 + rand() * 0.5 };
    scene.add(m); bars.push(m);
  }
  const grid = new THREE.GridHelper(26, 34, 0x12513a, 0x0b2a22);
  grid.position.y = -2.65;
  grid.material.transparent = true;
  grid.material.opacity = 0.45;
  scene.add(grid);

  const flash = glow(0xffe7a0, 3, 0.8);
  scene.add(flash);
  const left = glow(0x006b37, 9, 0.4), right = glow(0x7a1820, 9, 0.4);
  left.position.set(-3, 0, -4); right.position.set(3, 0, -4);
  scene.add(left, right);

  const N = LIGHT ? 300 : 700, dir = [], sc = [], ss = [], gold = new THREE.Color(C.gold);
  for (let i = 0; i < N; i++) {
    const a = rand() * TAU, e = (rand() - 0.3) * 1.5;
    dir.push(new THREE.Vector3(Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e)).multiplyScalar(0.8 + rand() * 2.4));
    const b = 0.5 + rand();
    sc.push(gold.r * b, gold.g * b, gold.b * b); ss.push(0.01 + rand() * 0.02);
  }
  const sparks = points(new Array(N * 3).fill(0), sc, ss);
  scene.add(sparks);
  const motes = dust(LIGHT ? 180 : 700, [20, 10, 8], 0x3a8f69, 21, 0.018);
  motes.position.z = -3;
  scene.add(motes);
  const contact = new THREE.Vector3(0, -0.25, 0.1);

  const frame = (p) => {
    const s = fract(p * 3); // три столкновения за ролик
    const charge = s < 0.4 ? smooth(0, 0.4, s) : 1 - smooth(0.4, 1, s), apart = (1 - charge) * 0.6;
    bull.position.set(-bs.width / 2 - 0.01 - apart, -0.35 + Math.sin(Math.PI * charge) * 0.16, 0);
    bear.position.set(es.width / 2 + 0.01 + apart, -0.3 + Math.sin(Math.PI * charge) * 0.1, 0);
    bull.rotation.z = -charge * 0.07; bear.rotation.z = -charge * 0.06;
    bull.rotation.y = 0.12; bear.rotation.y = -0.12;
    bull.userData.update(p, 1); bear.userData.update(p, -1);

    const a = fract(s - 0.4), pos = sparks.geometry.attributes.position;
    const burst = a < 0.45 ? 1 - a / 0.45 : 0;
    for (let i = 0; i < N; i++) {
      const r = 1 - (1 - Math.min(1, a * 2.2)) ** 3, d = dir[i];
      pos.setXYZ(i, contact.x + d.x * r, contact.y + d.y * r - a * a * 1.8, contact.z + d.z * r);
    }
    pos.needsUpdate = true;
    sparks.material.uniforms.opacity.value = burst;
    flash.position.copy(contact);
    flash.material.opacity = (a < 0.18 ? 1 - a / 0.18 : 0) * 0.9;
    flash.scale.setScalar(1 + a * 8);
    for (const m of bars) {
      const { x, good, h } = m.userData, wave = 0.5 + 0.5 * Math.sin(p * TAU * 3 + x * 1.3);
      const H = h + (good ? wave : 1 - wave) * 0.6;
      m.scale.set(0.16, H, 0.16);
      m.position.y = -2.65 + H / 2;
      m.material.opacity = 0.14 + wave * 0.12;
    }
    camera.position.set(Math.sin(p * TAU) * 1.5, 1.1 + Math.sin(p * TAU * 2) * 0.2, 17.2);
    camera.lookAt(0, -0.6, 0);
    motes.userData.update(p);
    render();
  };
  play(canvas, st, frame, { still: 5.75, start: 0.4 });
}
