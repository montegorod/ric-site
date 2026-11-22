// Живой глобус для главной (согласован Игорем 22.11.2026).
// Без библиотек: Canvas 2D. Материки — своя упрощённая карта (долгота, широта).
(function () {
  var cv = document.querySelector('canvas.globe');
  if (!cv || !cv.getContext) return;
  var ctx = cv.getContext('2d'), TAU = Math.PI * 2, RAD = Math.PI / 180;

  var LAND = [
    // Северная и Центральная Америка
    '-168,66 -162,70 -156,71 -141,70 -128,70 -115,68 -108,68 -96,68 -94,72 -86,70 -82,67 -87,65 -94,59 -92,57 -82,55 -82,52 -79,51 -78,58 -78,62 -70,61 -65,59 -61,56 -56,52 -60,50 -66,50 -65,47 -61,46 -66,44 -70,43 -74,40.5 -76,38 -76,35 -81,31 -80,25.5 -82,27 -84,30 -90,29 -95,29 -97,26 -97,22 -95,19 -91,19 -90,21 -87,21.5 -88,16 -83,15 -83,10 -79,9.5 -77,8 -80,7 -85,10 -92,14.5 -96,16 -105,20 -110,25 -114,31 -112,30 -109,23 -112,25 -115,28 -117,32.5 -121,34.5 -124,40 -124,47 -130,54 -137,58 -146,61 -152,59 -158,56 -164,55 -158,59 -165,62 -165,64',
    // острова Канады, Гренландия, Исландия
    '-85,66 -78,64 -66,62 -62,67 -72,72 -82,74 -90,73 -80,70',
    '-118,71 -110,69 -102,70 -105,73 -117,73',
    '-95,77 -80,76 -62,82 -75,83 -92,81',
    '-73,78 -60,82 -40,83.5 -20,82 -18,76 -22,70 -32,68 -42,61 -46,60 -51,64 -54,69 -58,75.5 -68,76',
    '-24,65.5 -22,63.8 -18,63.4 -13.5,65 -16,66.5 -21,66',
    // Карибы
    '-85,22 -80,23 -74,20.3 -78,20 -82,22',
    '-74,18.2 -72,20 -68.5,18.5 -71,17.8',
    // Южная Америка
    '-77,8 -72,12 -64,10.5 -60,8 -52,5 -50,0 -44,-2.5 -38,-4 -35,-8 -39,-14 -40,-21 -47,-24.5 -49,-28 -53,-34 -57,-36.5 -62,-39 -65,-42 -67,-46 -69,-50 -68,-54 -72,-54 -75,-50 -74,-44 -73.5,-38 -71.5,-31 -70.3,-18.5 -76,-14 -81,-6 -80,-1 -78,3',
    // Африка и Мадагаскар
    '-6,35.8 3,37 10,37.2 11,34 19,30.3 22,33 31,31.3 34,29 36,23 39,16 43,12 51,11.8 48,5 41,-2 39,-6 40.5,-15 35,-20 35.5,-24 32,-29 27,-34 18.5,-34.5 15,-27 11.7,-17 13.5,-11 9,-1 9.5,4 5,6 -2,5 -8,4.5 -13,8 -17.5,14.7 -16,20 -14,26 -9.5,30.5',
    '49,-12.5 50.5,-16 47,-25 44,-25 43.5,-20 46,-15.5',
    // Евразия
    '-9,37 -9.3,43.5 -2,43.6 -1.5,46.5 -4.5,48.3 1.5,50.2 4.5,52.5 8,54 8.2,57 10.5,57.5 10,54.5 14,54 19,54.5 21,56 24,57.5 24,59.5 29,60 23,60 21.5,62.5 25,65.5 21,65 17.5,62 18.5,59.5 16,56.3 13,55.5 10.5,59.5 7,58 5,62 12,65.5 15,68.5 25,71 31,70 41,67.5 35,66.5 38,64.5 44,66 46,68 55,68.5 67,69 69,73 73,73 74,68 80,72.5 87,75 104,77.5 113,74 130,71.5 140,72.5 160,70 178,69 179.9,65 178,62.5 170,60 163,58 162,55 156.7,51 155.5,56 162,61 156,61.5 143,59 135,54.5 141,53 139,48 132,43 129,41 129.5,35.5 126.5,34.5 126,38 121,39 122,37 119,35 122,31 121,28 117,23 110,20 106,20 109,14 108.5,11 105,9 100,13.5 100,7 104,1.5 101,3 98,8 98,16 94,16 91.5,22.5 87,21 80,15 80,11 77.5,8 73,16 72.5,21 67,25 57,25.5 56,27 50,30 48,30 52,24.5 56.5,26 59.5,22.5 55,17 48,14 43,13 39,21 35,28 34,31.5 36,36.5 30,36.3 27,37 26,40 22.5,40.5 24,38 23,36.5 19.5,40 19,42 14,45.2 12.3,45 13.5,43.5 18.5,40 16,38 15,40.5 10,44 6,43 3,42.5 0,39.5 -2,36.8 -5.5,36',
    // острова Европы
    '-5.5,50 1.5,51.3 0,53.5 -2,56 -2,57.7 -5,58.6 -6,56.5 -3,54.5 -5,52',
    '-10,52 -6,52.2 -6,55.2 -10,54.2',
    '12.5,38 15.5,38.2 15,36.8',
    '8.3,39 9.7,39 9.5,43 8.5,41',
    // острова Азии
    '130,31.5 131.5,34 136,35 140,35.2 142,39.5 141,41.5 139.5,40 136,37 131,35 129,33',
    '140,42 145.5,43.5 142,45.5',
    '142,46 144,49 142.5,54 141.8,50',
    '120,22.5 122,25 120.2,23.5',
    '80,6.5 81.8,7 80.3,9.8',
    '95.5,5.5 98,4 104,-2 106,-5.8 102,-4 97,2',
    '105.5,-6.5 114,-8.3 108,-7.8',
    '109,1.5 113,3 117,7 119,5 117,1 116,-4 110,-3',
    '120,-5 125,1.5 121,1 119,-2',
    '120,18.5 122,18.5 124,13 126,7 122,7 120,14',
    '131,-1 138,-1.8 146,-6 150.5,-10.5 143,-9 138,-8 132,-3',
    // Австралия, Новая Зеландия, Антарктида
    '114,-22 122,-18 130,-12 136,-12 136,-15 140,-17.5 142.5,-10.7 146,-19 150,-22 153.5,-28 150,-37 144,-38.5 139,-36 135,-34.5 129,-31.5 124,-34 115,-34.5',
    '145,-41 148,-41 147,-43.5',
    '173,-35 178,-38 175,-41.5 174,-39',
    '173,-40.5 174,-42 169,-46.5 166.5,-46',
    '-180,-90 -180,-78 -140,-75 -100,-73 -75,-72 -60,-64 -62,-76 -35,-78 -10,-71 40,-69 90,-66 140,-67 170,-72 180,-78 180,-90'
  ].map(function (s) {
    var p = s.split(' ').map(function (q) { return q.split(',').map(Number); });
    var xs = p.map(function (q) { return q[0]; }), ys = p.map(function (q) { return q[1]; });
    return { p: p, a: Math.min.apply(0, xs), b: Math.max.apply(0, xs), c: Math.min.apply(0, ys), d: Math.max.apply(0, ys) };
  });

  function isLand(x, y) {
    for (var n = 0; n < LAND.length; n++) {
      var o = LAND[n];
      if (x < o.a || x > o.b || y < o.c || y > o.d) continue;
      var p = o.p, inside = false;
      for (var i = 0, j = p.length - 1; i < p.length; j = i++) {
        if ((p[i][1] > y) !== (p[j][1] > y) && x < (p[j][0] - p[i][0]) * (y - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) inside = !inside;
      }
      if (inside) return true;
    }
    return false;
  }
  function vec(lon, lat) { var a = lon * RAD, b = lat * RAD; return [Math.cos(b) * Math.sin(a), Math.sin(b), Math.cos(b) * Math.cos(a)]; }

  var light = matchMedia('(max-width:700px), (pointer:coarse)').matches;
  var reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  var N = light ? 9000 : 22000, FPS = light ? 24 : 30, dots = [];
  for (var i = 0; i < N; i++) {
    var y = 1 - 2 * (i + .5) / N, lat = Math.asin(y) / RAD, lon = (i * 2.399963229728653 / RAD) % 360 - 180;
    if (isLand(lon, lat)) dots.push(vec(lon, lat));
  }

  var HUB = vec(19.2, 42.4);
  var ENDS = [[-.1, 51.5], [13.4, 52.5], [37.6, 55.8], [55.3, 25.2], [72.9, 19.1], [103.8, 1.35], [28, -26.2], [3.4, 6.5], [-74, 40.7], [-46.6, -23.5], [-3.7, 40.4], [18.1, 59.3], [76.9, 43.2], [36.8, -1.3], [-21.9, 64.1], [114.2, 22.3]];
  if (light) ENDS = ENDS.slice(0, 10);
  var arcs = ENDS.map(function (e, k) {
    var b = vec(e[0], e[1]), line = [], ang = Math.acos(HUB[0] * b[0] + HUB[1] * b[1] + HUB[2] * b[2]);
    for (var s = 0; s <= 32; s++) {
      var t = s / 32, v = [0, 1, 2].map(function (m) { return HUB[m] + (b[m] - HUB[m]) * t; });
      var r = (1 + Math.sin(Math.PI * t) * Math.min(.24, .04 + ang * .17)) / Math.hypot(v[0], v[1], v[2]);
      line.push([v[0] * r, v[1] * r, v[2] * r]);
    }
    return { line: line, end: b, at: k * .137 % 1, color: k % 5 ? '28,240,138' : '91,140,255' };
  });

  var W = 0, H = 0, R = 0, dpr = 1, cy, sy, cx, sx;
  function project(v) {
    var x = v[0] * cy + v[2] * sy, z = v[2] * cy - v[0] * sy;
    return [W / 2 + x * R, H / 2 - (v[1] * cx - z * sx) * R, v[1] * sx + z * cx];
  }
  function circle(x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); }

  function draw(sec) {
    if (!W) return;
    var turn = -.25 + Math.sin(sec * TAU / 24) * .55, tilt = .5;
    cy = Math.cos(turn); sy = Math.sin(turn); cx = Math.cos(tilt); sx = Math.sin(tilt);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var mx = W / 2, my = H / 2, g = ctx.createRadialGradient(mx, my, R * .9, mx, my, R * 1.22);
    g.addColorStop(0, 'rgba(0,210,106,0)'); g.addColorStop(.3, 'rgba(0,210,106,.2)'); g.addColorStop(1, 'rgba(0,210,106,0)');
    ctx.fillStyle = g; circle(mx, my, R * 1.22); ctx.fill();
    g = ctx.createRadialGradient(mx - R * .3, my - R * .4, 0, mx, my, R);
    g.addColorStop(0, '#0b1a1b'); g.addColorStop(.75, '#071012'); g.addColorStop(1, '#0c2b24');
    ctx.fillStyle = g; circle(mx, my, R); ctx.fill();

    // точки суши: четыре уровня яркости, ближе к центру светлее
    var paths = [new Path2D(), new Path2D(), new Path2D(), new Path2D()], size = Math.max(1.1, R * (light ? .011 : .0075));
    for (var i = 0; i < dots.length; i++) {
      var p = project(dots[i]);
      if (p[2] > .02) paths[Math.min(3, p[2] * 4 | 0)].rect(p[0] - size / 2, p[1] - size / 2, size, size);
    }
    ['rgba(24,140,92,.6)', 'rgba(30,175,110,.8)', '#22c67c', '#4be69e'].forEach(function (c, k) { ctx.fillStyle = c; ctx.fill(paths[k]); });

    ctx.lineCap = 'round';
    arcs.forEach(function (a) {
      var f = (sec / 4 + a.at) % 1, head = f / .5, pts = a.line.map(project);
      for (var s = 1; s < pts.length; s++) {
        var q = pts[s], o = pts[s - 1];
        if (q[2] < 0 && Math.hypot(q[0] - mx, q[1] - my) < R) continue; // за планетой
        var d = head - s / 32, tail = d > 0 ? Math.exp(-d * 5) : 0;
        ctx.strokeStyle = 'rgba(' + a.color + ',' + Math.min(1, .13 + tail) + ')';
        ctx.lineWidth = .8 + tail * 1.5;
        ctx.beginPath(); ctx.moveTo(o[0], o[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
      }
      var e = project(a.end), hit = (f - .5) / .3;
      if (e[2] < .05) return;
      ctx.fillStyle = 'rgb(' + a.color + ')'; circle(e[0], e[1], 2); ctx.fill();
      if (hit > 0 && hit < 1) { ctx.strokeStyle = 'rgba(' + a.color + ',' + (1 - hit) + ')'; ctx.lineWidth = 1.5; circle(e[0], e[1], 3 + hit * R * .09); ctx.stroke(); }
    });

    var h = project(HUB);
    for (var k = 0; k < 3; k++) {
      var w = (sec / 2 + k / 3) % 1;
      ctx.strokeStyle = 'rgba(125,255,184,' + (1 - w) + ')'; ctx.lineWidth = 1.5; circle(h[0], h[1], 4 + w * R * .13); ctx.stroke();
    }
    ctx.fillStyle = '#b8ffd8'; circle(h[0], h[1], 4); ctx.fill();
    ctx.font = '700 ' + (W < 400 ? 14 : 16) + 'px Jost,sans-serif';
    var tw = ctx.measureText('SmartStrike').width + 20, lx = Math.max(2, Math.min(W - tw - 2, h[0] + 14)), ly = h[1] - 40;
    ctx.fillStyle = '#25e083'; ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(lx, ly, tw, 28, 9); else ctx.rect(lx, ly, tw, 28);
    ctx.fill();
    ctx.fillStyle = '#03130a'; ctx.textBaseline = 'middle'; ctx.fillText('SmartStrike', lx + 10, ly + 14.5);
  }

  var seen = true, raf = 0, last = 0, clock = reduce ? 2.2 : 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (now - last < 1000 / FPS - 4) return;
    if (last) clock += Math.min(.1, (now - last) / 1000);
    last = now; draw(clock);
    cv.dataset.frames = (+cv.dataset.frames || 0) + 1;
  }
  function state() {
    var on = seen && !document.hidden && !reduce;
    if (on && !raf) { last = 0; raf = requestAnimationFrame(frame); }
    if (!on && raf) { cancelAnimationFrame(raf); raf = 0; }
  }
  function resize() {
    W = cv.clientWidth; H = cv.clientHeight;
    dpr = Math.min(devicePixelRatio || 1, light ? 1.5 : 2);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    R = Math.min(W, H) * .41;
    draw(clock);
  }
  addEventListener('resize', resize);
  document.addEventListener('visibilitychange', state);
  if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { seen = e[e.length - 1].isIntersecting; state(); }).observe(cv);
  if (document.fonts) document.fonts.ready.then(function () { draw(clock); });
  resize(); state();
})();
