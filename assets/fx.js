// Анимации сайта: живой свечной график на фоне .hero, появление блоков при прокрутке, рост столбиков.
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Фоновый свечной график
  function liveChart(host) {
    var c = document.createElement('canvas'); c.className = 'bg-chart'; document.body.prepend(c);
    var ctx = c.getContext('2d'), W, H, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cw = 14, candles = [], price = 100, offset = 0;
    function newCandle() {
      var o = price, ch = (Math.random() - 0.47) * 3.2, cl = o + ch;
      var hi = Math.max(o, cl) + Math.random() * 1.4, lo = Math.min(o, cl) - Math.random() * 1.4;
      price = cl; return { o: o, c: cl, h: hi, l: lo };
    }
    function size() {
      W = window.innerWidth; H = window.innerHeight;
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
  liveChart();

  // 2. Появление блоков и рост столбиков при прокрутке
  var els = document.querySelectorAll('.card,.step,.panel,.sec-head,.flow,.cta,.table-wrap,.note');
  els.forEach(function (e) { e.classList.add('reveal'); });
  if (!('IntersectionObserver' in window) || reduce) { els.forEach(function (e) { e.classList.add('in'); }); return; }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: 0.12 });
  els.forEach(function (e) { io.observe(e); });
})();


// Воронка: готовый текст сообщения Игорю, учёт кликов, окно при уходе.
(function () {
  var ru = document.documentElement.lang === 'ru', B = document.body;
  var page = (document.title.split('—')[0] || '').trim() || location.pathname;
  // 1. Кнопки «Написать» сразу подставляют текст с пометкой страницы
  var txt = ru ? 'Здравствуйте! Интересует SmartStrike. (с сайта: ' + page + ')'
               : 'Hello! I am interested in SmartStrike. (from website: ' + page + ')';
  document.querySelectorAll('a[href="https://t.me/ricfxa"]').forEach(function (a) { a.href += '?text=' + encodeURIComponent(txt); });
  // 2. Учёт кликов по ссылкам наружу (работает, когда включён счётчик GoatCounter)
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="http"]');
    if (a && window.goatcounter && goatcounter.count) {
      var h = a.href.split('?')[0].replace(/^https?:\/\//, '');
      goatcounter.count({ path: 'click: ' + h + ' | ' + location.pathname, title: a.textContent.trim(), event: true });
    }
  });
  // 3. Окно при уходе: компьютер — мышь уходит вверх; телефон — через 40 сек. Раз в 3 дня.
  var KEY = 'ricExit', guide = B.dataset.guide, ch = B.dataset.ch;
  if (!guide) return;
  try { if (Date.now() - (+localStorage.getItem(KEY) || 0) < 3 * 864e5) return; } catch (e) {}
  var shown = false, t0 = Date.now();
  function show() {
    if (shown) return; shown = true; try { localStorage.setItem(KEY, Date.now()); } catch (e) {}
    var w = document.createElement('div'); w.className = 'exit';
    w.innerHTML = '<div class="exit-box"><button class="exit-x" aria-label="close">×</button>' +
      '<div class="kicker">' + (ru ? 'Подождите' : 'Before you go') + '</div>' +
      '<h3>' + (ru ? 'Заберите бесплатно' : 'Take these for free') + '</h3>' +
      '<a class="exit-card" href="' + guide + '" target="_blank" rel="noopener"><b>📘 ' + (ru ? 'Самоучитель по техническому анализу' : 'Technical analysis guide') + '</b><span>' + (ru ? 'Полный курс с нуля, без регистрации' : 'A full course from scratch, no sign-up') + '</span></a>' +
      '<a class="exit-card" href="' + ch + '" target="_blank" rel="noopener"><b>📈 ' + (ru ? 'Наш Telegram-канал' : 'Our Telegram channel') + '</b><span>' + (ru ? 'Итоги каждой недели, разборы рынка' : 'Weekly results and market reviews') + '</span></a>' +
      '<a class="exit-skip" href="#">' + (ru ? 'Нет, спасибо' : 'No, thanks') + '</a></div>';
    B.appendChild(w); requestAnimationFrame(function () { w.classList.add('on'); });
    function close(e) { if (e) e.preventDefault(); w.classList.remove('on'); setTimeout(function () { w.remove(); }, 300); }
    w.querySelector('.exit-x').onclick = close; w.querySelector('.exit-skip').onclick = close;
    w.onclick = function (e) { if (e.target === w) close(); };
    w.querySelectorAll('.exit-card').forEach(function (a) { a.addEventListener('click', function () { setTimeout(close, 200); }); });
  }
  document.addEventListener('mouseout', function (e) { if (!e.relatedTarget && e.clientY <= 5 && Date.now() - t0 > 5000) show(); });
  if (matchMedia('(hover: none)').matches) setTimeout(show, 40000);
})();
