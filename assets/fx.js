// Анимации сайта: живой свечной график на фоне .hero, появление блоков при прокрутке, рост столбиков.
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Фоновый свечной график
  function liveChart(host) {
    var c = document.createElement('canvas'); c.className = 'bg-chart'; host.prepend(c);
    var ctx = c.getContext('2d'), W, H, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cw = 14, candles = [], price = 100, offset = 0;
    function newCandle() {
      var o = price, ch = (Math.random() - 0.47) * 3.2, cl = o + ch;
      var hi = Math.max(o, cl) + Math.random() * 1.4, lo = Math.min(o, cl) - Math.random() * 1.4;
      price = cl; return { o: o, c: cl, h: hi, l: lo };
    }
    function size() {
      W = host.clientWidth; H = host.clientHeight;
      c.width = W * dpr; c.height = H * dpr; c.style.width = W + 'px'; c.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      while (candles.length < W / cw + 4) candles.push(newCandle());
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      var n = Math.ceil(W / cw) + 2, vis = candles.slice(-n);
      var mn = Infinity, mx = -Infinity;
      vis.forEach(function (k) { mn = Math.min(mn, k.l); mx = Math.max(mx, k.h); });
      var top = H * 0.18, bot = H * 0.92;
      function y(v) { return bot - (v - mn) / (mx - mn || 1) * (bot - top); }
      // сетка
      ctx.strokeStyle = 'rgba(42,46,57,.55)'; ctx.lineWidth = 1;
      for (var g = 0; g < 6; g++) { var gy = top + g * (bot - top) / 5; ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }
      // заливка под линией
      var grad = ctx.createLinearGradient(0, top, 0, bot);
      grad.addColorStop(0, 'rgba(0,210,106,.16)'); grad.addColorStop(1, 'rgba(0,210,106,0)');
      ctx.beginPath();
      vis.forEach(function (k, i) { var x = W - (vis.length - i) * cw + cw / 2 + offset; i ? ctx.lineTo(x, y(k.c)) : ctx.moveTo(x, y(k.c)); });
      ctx.lineTo(W + cw, bot); ctx.lineTo(0, bot); ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
      // свечи
      vis.forEach(function (k, i) {
        var x = W - (vis.length - i) * cw + offset, up = k.c >= k.o;
        ctx.strokeStyle = ctx.fillStyle = up ? 'rgba(0,210,106,.55)' : 'rgba(242,54,69,.45)';
        ctx.beginPath(); ctx.moveTo(x + cw / 2, y(k.h)); ctx.lineTo(x + cw / 2, y(k.l)); ctx.stroke();
        var t = y(Math.max(k.o, k.c)), b = y(Math.min(k.o, k.c));
        ctx.fillRect(x + 2, t, cw - 4, Math.max(1, b - t));
      });
      // линия цены и точка
      var last = vis[vis.length - 1], ly = y(last.c);
      ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(0,210,106,.6)';
      ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(W, ly); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#00d26a'; ctx.shadowColor = '#00d26a'; ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.arc(W - cw / 2 + offset, ly, 4, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
    }
    var lastT = 0;
    function tick(t) {
      if (t - lastT > 40) { // ~25 кадров в секунду, бережём батарею
        offset -= 0.6;
        var lk = candles[candles.length - 1]; lk.c += (Math.random() - 0.48) * 0.35;
        lk.h = Math.max(lk.h, lk.c); lk.l = Math.min(lk.l, lk.c); price = lk.c;
        if (offset <= -cw) { offset = 0; candles.push(newCandle()); if (candles.length > 400) candles.shift(); }
        draw(); lastT = t;
      }
      requestAnimationFrame(tick);
    }
    size(); draw(); window.addEventListener('resize', function () { size(); draw(); });
    if (!reduce) requestAnimationFrame(tick);
  }
  document.querySelectorAll('.hero').forEach(liveChart);

  // 2. Появление блоков и рост столбиков при прокрутке
  var els = document.querySelectorAll('.card,.step,.panel,.sec-head,.flow,.cta,.table-wrap,.note');
  els.forEach(function (e) { e.classList.add('reveal'); });
  if (!('IntersectionObserver' in window) || reduce) { els.forEach(function (e) { e.classList.add('in'); }); return; }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: 0.12 });
  els.forEach(function (e) { io.observe(e); });
})();
