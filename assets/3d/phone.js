// 3. Телефон: сделка копируется, ставится стоп, движется график. Цифр доходности нет, на экране пометка «пример».
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { C, TAU, LIGHT, EN, t, random, stage, dust, glow, comet, smooth, fract, play } from 'ric/common';

const PW = 3.6, PH = 7.5, SW = 780, SH = 1660;
const ease = (x) => 1 - (1 - x) ** 3;
const R_LOGO = [new Path2D('M0 0H58C71 0 79 5 81 14L64 29 58 26 44 37 36 34 22 47 16 44 0 50Z'), new Path2D('M0 56 16 50 22 53 36 40 44 43 58 32 64 35 83 20C88 33 86 49 70 57L88 100H0Z')];

function roundRect(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function box(g, x, y, w, h, r, fill, stroke) {
  g.beginPath(); g.roundRect(x, y, w, h, r);
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = 3; g.stroke(); }
}

function text(g, s, x, y, size, color = '#f4f6f8', weight = 600, align = 'left') {
  g.font = `${weight} ${size}px Jost, Arial, sans-serif`; g.fillStyle = color; g.textAlign = align; g.fillText(s, x, y);
}

export default async function (canvas) {
  await Promise.all([400, 600, 700, 800].map((w) => document.fonts.load(`${w} 30px Jost`, 'Сделка Trade'))).catch(() => {});
  const st = stage(canvas, { fov: 34 });
  const { renderer, scene, camera, render } = st;
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.5;
  camera.position.set(0, 0.8, 16.5);
  camera.lookAt(0, -0.38, 0);
  for (const [color, x, y, z, k] of [[C.green, -5, 3, 4, 60], [C.blue, 6, -1, 3, 45], [C.mint, 2, 5, -4, 50]]) {
    const l = new THREE.PointLight(color, k, 24);
    l.position.set(x, y, z);
    scene.add(l);
  }

  const back = glow(0x00713b, 17, 0.75);
  back.position.set(0, 0.2, -4);
  scene.add(back);

  const phone = new THREE.Group();
  scene.add(phone);
  phone.add(new THREE.Mesh(new RoundedBoxGeometry(PW, PH, 0.36, 8, 0.17), new THREE.MeshPhysicalMaterial({ color: 0x27332f, metalness: 1, roughness: 0.2, clearcoat: 1 })));
  const front = new THREE.Mesh(new THREE.ShapeGeometry(roundRect(PW - 0.1, PH - 0.1, 0.45), 16), new THREE.MeshBasicMaterial({ color: 0x010203 }));
  front.position.z = 0.185;
  phone.add(front);

  const cv = document.createElement('canvas');
  const K = LIGHT ? 0.6 : 1;
  cv.width = SW * K; cv.height = SH * K;
  const g = cv.getContext('2d');
  g.scale(K, K);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const sw = PW - 0.26, sh = PH - 0.28;
  const sg = new THREE.ShapeGeometry(roundRect(sw, sh, 0.38), 16), sp = sg.attributes.position, uv = sg.attributes.uv;
  for (let i = 0; i < sp.count; i++) uv.setXY(i, sp.getX(i) / sw + 0.5, sp.getY(i) / sh + 0.5);
  const screen = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  screen.position.z = 0.192;
  phone.add(screen);

  const rand = random(8), candles = [];
  let value = 0;
  for (let i = 0; i < 26; i++) {
    const o = value;
    value += (i < 12 ? -0.02 : 0.3) + (rand() - 0.5) * 1.5;
    candles.push({ o, c: value, h: Math.max(o, value) + rand() * 0.4, l: Math.min(o, value) - rand() * 0.4 });
  }
  const mn = Math.min(...candles.map((k) => k.l)), mx = Math.max(...candles.map((k) => k.h));
  const Y = (v) => 800 - (v - mn) / (mx - mn) * 420;

  function draw(t) {
    g.fillStyle = '#080d12'; g.fillRect(0, 0, SW, SH);
    box(g, 285, 26, 210, 52, 26, '#000');
    const grad = g.createLinearGradient(0, 100, 80, 180);
    grad.addColorStop(0, '#7dffb8'); grad.addColorStop(1, '#00b85c');
    g.save(); g.translate(54, 120); g.scale(0.78, 0.78); g.fillStyle = grad; R_LOGO.forEach((x) => g.fill(x)); g.restore();
    text(g, 'SmartStrike', 148, 172, 50, '#f4f6f8', 800);
    text(g, (EN ? t('copy trading') : 'копирование сделок'), 148, 212, 27, '#9aa3b2', 400);
    box(g, 598, 133, 130, 50, 25, 'rgba(245,194,66,.16)');
    text(g, (EN ? t('example') : 'пример'), 663, 168, 27, '#f5c242', 700, 'center');

    box(g, 36, 256, 708, 640, 38, '#101821', '#1f2b33');
    text(g, 'XAUUSD', 76, 326, 40, '#f4f6f8', 700);
    text(g, (EN ? t('gold') : 'золото'), 704, 326, 28, '#9aa3b2', 400, 'right');
    g.strokeStyle = '#1b262d'; g.lineWidth = 2;
    for (let y = 400; y <= 820; y += 84) { g.beginPath(); g.moveTo(70, y); g.lineTo(710, y); g.stroke(); }

    const fade = 1 - smooth(11.2, 11.95, t), shown = 12 + smooth(1.6, 10.6, t) * 14 * fade;
    for (let i = 0; i < shown && i < 26; i++) {
      const k = candles[i], part = Math.min(1, shown - i), c = k.o + (k.c - k.o) * part, x = 86 + i * 24;
      g.fillStyle = g.strokeStyle = c >= k.o ? '#00d26a' : '#f23645';
      g.lineWidth = 3;
      g.beginPath(); g.moveTo(x, Y(k.o + (k.h - k.o) * part)); g.lineTo(x, Y(k.o + (k.l - k.o) * part)); g.stroke();
      g.fillRect(x - 8, Math.min(Y(k.o), Y(c)), 16, Math.max(4, Math.abs(Y(k.o) - Y(c))));
    }
    const entry = Y(candles[12].o), dashed = (y, color, label, a) => {
      if (a <= 0) return;
      g.globalAlpha = a; g.setLineDash([12, 10]); g.strokeStyle = color; g.lineWidth = 4;
      g.beginPath(); g.moveTo(70, y); g.lineTo(710, y); g.stroke(); g.setLineDash([]);
      box(g, 70, y - 48, 124, 40, 12, color);
      text(g, label, 132, y - 18, 26, '#05080b', 700, 'center');
      g.globalAlpha = 1;
    };
    dashed(entry, '#7dffb8', (EN ? t('ENTRY') : 'ВХОД'), smooth(1.5, 2, t) * fade);
    dashed(Math.min(860, entry + 130), '#f23645', (EN ? t('STOP') : 'СТОП'), smooth(4, 4.5, t) * fade);

    const steps = [[0.4, (EN ? t('System opened a trade') : 'Система открыла сделку'), 'SmartStrike · BUY XAUUSD'], [1.8, (EN ? t('Trade copied') : 'Сделка скопирована'), (EN ? t('to your broker account') : 'на ваш счёт у брокера')], [4.2, (EN ? t('Stop-loss set') : 'Стоп-лосс установлен'), (EN ? t('trade risk is limited') : 'риск по сделке ограничен')], [7.2, (EN ? t('All visible in MetaTrader') : 'Всё видно в MetaTrader'), (EN ? t('the account stays yours') : 'счёт остаётся вашим')]];
    steps.forEach(([at, a, b], i) => {
      const k = smooth(at, at + 0.6, t) * fade, y = 934 + i * 154;
      box(g, 36, y, 708, 134, 32, '#0d141b', '#18232b');
      g.globalAlpha = k;
      if (k > 0) box(g, 36, y, 708, 134, 32, '#0f2a20', '#087a46');
      g.globalAlpha = 1;
      g.beginPath(); g.arc(106, y + 67, 32, 0, TAU);
      g.fillStyle = k > 0.5 ? '#00d26a' : '#1b262d'; g.fill();
      text(g, k > 0.5 ? '✓' : String(i + 1), 106, y + 80, 36, k > 0.5 ? '#03130a' : '#66717d', 800, 'center');
      text(g, a, 164, y + 60, 37, k > 0.5 ? '#f4f6f8' : '#66717d', 700);
      text(g, b, 164, y + 100, 28, k > 0.5 ? '#9fd8bb' : '#46515b', 400);
    });
    box(g, 250, 1600, 280, 10, 5, '#3b454d');
    tex.needsUpdate = true;
  }

  // карточки, вылетающие из экрана
  const card = (title, sub, icon, color) => {
    const c = document.createElement('canvas');
    c.width = 760; c.height = 190;
    const q = c.getContext('2d');
    box(q, 5, 5, 750, 180, 42, 'rgba(12,24,24,.95)', color);
    q.beginPath(); q.arc(94, 95, 46, 0, TAU); q.fillStyle = color; q.fill();
    text(q, icon, 94, 112, 50, '#03130a', 800, 'center');
    text(q, title, 164, 88, 46, '#f4f6f8', 700);
    text(q, sub, 164, 136, 33, '#9aa3b2', 400);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 0.95), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false }));
    m.renderOrder = 5;
    scene.add(m);
    return m;
  };
  const cards = [
    { m: card((EN ? t('Trade copied') : 'Сделка скопирована'), (EN ? t('in a split second') : 'за доли секунды'), '✓', '#00d26a'), at: 1.9, to: [2.55, 1.85, 1.5] },
    { m: card((EN ? t('Stop-loss set') : 'Стоп-лосс установлен'), (EN ? t('risk limited') : 'риск ограничен'), '●', '#f5c242'), at: 4.3, to: [-2.55, -0.2, 1.6] },
    { m: card((EN ? t('Account stays yours') : 'Счёт остаётся вашим'), (EN ? t('funds at your broker') : 'деньги у брокера'), '✓', '#5b8cff'), at: 7.3, to: [2.1, -3.0, 1.6] },
  ];

  // потоки сделок и подставка
  const streams = [];
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * TAU + 0.2, r = 9 + (i % 3);
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r * 0.65, -6), new THREE.Vector3(Math.cos(a + 0.4) * 4.6, Math.sin(a + 0.4) * 3.6, -3), new THREE.Vector3(0, 0, -0.4)]);
    const m = comet(curve, i % 4 ? C.green : C.blue, 0.014, 0.035);
    m.userData.offset = (i * 0.618) % 1;
    scene.add(m); streams.push(m);
  }
  const rings = [2.1, 2.7, 3.3].map((r) => {
    const m = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.025, 120), new THREE.MeshBasicMaterial({ color: C.green, transparent: true, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
    m.rotation.x = -Math.PI / 2; m.position.y = -4.05;
    scene.add(m);
    return m;
  });
  const motes = dust(LIGHT ? 180 : 600, [22, 13, 8], C.green, 12, 0.02);
  motes.position.z = -3;
  scene.add(motes);

  let drawn = -1;
  const frame = (p) => {
    const t = p * 12;
    const step = Math.floor(t * 12);
    if (step !== drawn) { drawn = step; draw(t); }
    phone.rotation.set(Math.sin(p * TAU * 2) * 0.035, -0.22 + Math.sin(p * TAU) * 0.3, 0.035 + Math.cos(p * TAU) * 0.025);
    phone.position.y = Math.sin(p * TAU * 2) * 0.12;
    for (const { m, at, to } of cards) {
      const k = ease(smooth(at, at + 0.9, t)), out = smooth(10.7, 11.6, t);
      m.position.set(to[0] * k, to[1] * k + Math.sin(t * Math.PI / 2 + at) * 0.08, 0.3 + to[2] * k + out);
      m.scale.setScalar(0.4 + k * 0.45);
      m.rotation.y = -to[0] * 0.06;
      m.material.opacity = k * (1 - out);
      m.visible = k > 0.001 && out < 0.999;
    }
    streams.forEach((m) => { m.material.uniforms.head.value = fract(p * 4 + m.userData.offset) * 1.5 - 0.1; });
    rings.forEach((m, i) => { m.material.opacity = 0.25 + 0.35 * Math.sin(p * TAU * 4 - i * 1.3) ** 2; });
    motes.userData.update(p);
    render();
  };
  play(canvas, st, frame);
}
