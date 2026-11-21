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
  if (/^Reliable/.test(page)) page = ru ? 'Главная' : 'Home';
  // 1. Кнопки «Написать» сразу подставляют текст с пометкой страницы
  var txt = ru ? 'Здравствуйте! Интересует SmartStrike. (с сайта: ' + page + ')'
               : 'Hello! I am interested in SmartStrike. (from website: ' + page + ')';
  var tgIco = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M21.4 3.6 2.9 10.8c-1.2.5-1.2 1.2-.2 1.5l4.7 1.5 1.8 5.6c.2.6.4.8.9.8.4 0 .6-.2.9-.4l2.3-2.2 4.7 3.5c.9.5 1.5.2 1.7-.8l3.1-14.6c.3-1.3-.5-1.8-1.4-1.4ZM9 14.2l9.1-7.6c.4-.4-.1-.5-.6-.2l-10 6.3"/></svg>';
  document.querySelectorAll('a[href="https://t.me/ricfxa"]').forEach(function (a) {
    a.dataset.txt = a.dataset.msg || txt; a.href += '?text=' + encodeURIComponent(a.dataset.txt);
    if (a.classList.contains('btn') && !a.classList.contains('btn-sm')) a.innerHTML = tgIco + ' ' + a.innerHTML;
  });
  // WhatsApp: кнопка рядом с каждой большой кнопкой Telegram, в шапке — выбор из двух
  var wa = B.dataset.wa;
  if (wa) {
    var waHref = 'https://wa.me/' + wa + '?text=' + encodeURIComponent(txt);
    var ico = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.5-.3z"/></svg>';
    document.querySelectorAll('a.btn[href^="https://t.me/ricfxa"]').forEach(function (a) {
      if (a.classList.contains('btn-sm')) {
        var m = document.createElement('div'); m.className = 'contact-menu';
        m.innerHTML = '<a href="' + a.href + '" target="_blank" rel="noopener">' + tgIco + ' Telegram</a><a href="' + waHref + '" target="_blank" rel="noopener">' + ico + ' WhatsApp</a>';
        var w = document.createElement('span'); w.className = 'contact-wrap'; a.parentNode.insertBefore(w, a); w.append(a, m);
        a.addEventListener('click', function (e) { e.preventDefault(); w.classList.toggle('open'); });
        document.addEventListener('click', function (e) { if (!w.contains(e.target)) w.classList.remove('open'); });
      } else {
        var b = document.createElement('a'); b.className = 'btn btn-wa'; b.target = '_blank'; b.rel = 'noopener';
        b.href = 'https://wa.me/' + wa + '?text=' + encodeURIComponent(a.dataset.txt);
        var label = a.textContent.trim();
        if (!/Telegram/.test(label)) { label += ru ? ' через Telegram' : ' via Telegram'; a.innerHTML = tgIco + ' ' + label; }
        b.innerHTML = ico + ' ' + label.replace('Telegram', 'WhatsApp'); a.after(b);
      }
    });
    document.querySelectorAll('a[href="https://wa.me/' + wa + '"]').forEach(function (a) { a.href = waHref; });
  }
  // 2. Учёт кликов по ссылкам наружу (работает, когда включён счётчик GoatCounter)
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="http"]');
    if (a && window.goatcounter && goatcounter.count) {
      var h = a.href.split('?')[0].replace(/^https?:\/\//, '');
      goatcounter.count({ path: 'click: ' + h + ' | ' + location.pathname, title: a.textContent.trim(), event: true });
    }
  });
  // Окно перед переходом на живой мониторинг: что именно там показано
  var mon = B.dataset.mon;
  if (mon) document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="' + mon + '"]');
    if (!a || a.dataset.ok) return;
    e.preventDefault();
    var br = B.dataset.monBroker, since = B.dataset.monSince;
    var w = document.createElement('div'); w.className = 'exit';
    w.innerHTML = '<div class="exit-box"><button class="exit-x" aria-label="close">×</button>' +
      '<div class="kicker">' + (ru ? 'Обратите внимание' : 'Please note') + '</div>' +
      '<h3>' + (ru ? 'Что показывает мониторинг' : 'What the monitor shows') + '</h3>' +
      '<p style="color:var(--muted);margin-bottom:12px">' + (ru
        ? 'Живой мониторинг показывает <b style="color:var(--text)">последнюю версию SmartStrike</b> после всех обновлений, на одном счёте у брокера <b style="color:var(--text)">' + br + '</b>, с <b style="color:var(--text)">' + since + '</b>.'
        : 'The live monitor shows <b style="color:var(--text)">the latest version of SmartStrike</b> after all updates, on one account with <b style="color:var(--text)">' + br + '</b>, since <b style="color:var(--text)">' + since + '</b>.') + '</p>' +
      '<p style="color:var(--muted);margin-bottom:20px">' + (ru
        ? 'Помесячные результаты на сайте — история стратегии за всё время, поэтому цифры на мониторинге могут немного отличаться.'
        : 'The monthly results on this site are the strategy history over the whole period, so the monitor figures may differ slightly.') + '</p>' +
      '<a class="btn btn-green" style="width:100%;justify-content:center" href="' + a.href + '" target="_blank" rel="noopener">' + (ru ? 'Понятно, открыть мониторинг' : 'Got it, open the monitor') + '</a></div>';
    B.appendChild(w); requestAnimationFrame(function () { w.classList.add('on'); });
    function close() { w.classList.remove('on'); setTimeout(function () { w.remove(); }, 300); }
    w.querySelector('.exit-x').onclick = close; w.onclick = function (ev) { if (ev.target === w) close(); };
    var go = w.querySelector('.btn'); go.dataset.ok = '1';
    go.addEventListener('click', function () { setTimeout(close, 200); });
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
      '<div class="exit-card"><b>📘 ' + (ru ? 'Самоучитель по техническому анализу' : 'Technical analysis guide') + '</b><span>' + (ru ? 'Бесплатно, без регистрации. Выберите язык, и PDF скачается:' : 'Free, no sign-up. Choose a language and the PDF downloads:') + '</span>' +
      '<div class="exit-dl"><a href="' + (ru ? B.dataset.guideRu : B.dataset.guideEn) + '" download>' + (ru ? 'Русский' : 'English') + '</a>' +
      '<a href="' + (ru ? B.dataset.guideEn : B.dataset.guideRu) + '" download>' + (ru ? 'English' : 'Russian') + '</a></div></div>' +
      '<a class="exit-card" href="' + ch + '" target="_blank" rel="noopener"><b>📈 ' + (ru ? 'Наш Telegram-канал' : 'Our Telegram channel') + '</b><span>' + (ru ? 'Итоги каждой недели, разборы рынка' : 'Weekly results and market reviews') + '</span></a>' +
      '<a class="exit-skip" href="#">' + (ru ? 'Нет, спасибо' : 'No, thanks') + '</a></div>';
    B.appendChild(w); requestAnimationFrame(function () { w.classList.add('on'); });
    function close(e) { if (e) e.preventDefault(); w.classList.remove('on'); setTimeout(function () { w.remove(); }, 300); }
    w.querySelector('.exit-x').onclick = close; w.querySelector('.exit-skip').onclick = close;
    w.onclick = function (e) { if (e.target === w) close(); };
    w.querySelectorAll('.exit-card, .exit-dl a').forEach(function (a) { if (a.tagName === 'A') a.addEventListener('click', function () { setTimeout(close, 200); }); });
  }
  document.addEventListener('mouseout', function (e) { if (!e.relatedTarget && e.clientY <= 5 && Date.now() - t0 > 5000) show(); });
  if (matchMedia('(hover: none)').matches) setTimeout(show, 40000);
})();
