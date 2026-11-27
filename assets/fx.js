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
  var ru = document.documentElement.lang === 'ru', B = document.body, P = location.pathname;
  // другие языки (es, pt, de, tr, id, ar): перевод английского текста из window.RIC_I18N (его пишет build.py)
  var tr = function (s) { return (window.RIC_I18N || {})[s] || s; };
  var page = B.dataset.page || (document.title.split('—')[0] || '').trim() || P;  // короткое имя страницы (data-page из build.py)
  if (/^Reliable/.test(page)) page = ru ? 'Главная' : tr('Home');
  var mon = B.dataset.mon;

  // 0. Откуда пришёл (первое касание, 26.11.2026): метки utm_source/utm_campaign или известный referrer.
  // Запоминается на 30 дней (localStorage ric_ft) и дописывается ко ВСЕМ событиям: «click: t.me/ricfxa | /ru/results.html [src=tg-ru/results-20261126]».
  // Прямой заход ничего не записывает: без [src] = прямой или неизвестный источник. Расшифровка: research/site-message-codes.md
  var FT = 'ric_ft', ft = null;
  var slug = function (s) { try { s = decodeURIComponent(s.replace(/\+/g, ' ')); } catch (e) {} return String(s).toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40); };
  var get = function () { try { return localStorage.getItem(FT); } catch (e) { try { return sessionStorage.getItem(FT); } catch (e2) { return null; } } };
  var put = function (v) { try { localStorage.setItem(FT, v); } catch (e) { try { sessionStorage.setItem(FT, v); } catch (e2) {} } };
  function detect() {
    var q = location.search.replace(/&amp;/gi, '&');  // посты Radar с ошибкой «&amp;amp;» в адресе
    var us = slug((q.match(/[?&]utm_source=([^&#]*)/i) || [])[1] || ''), uc = slug((q.match(/[?&]utm_campaign=([^&#]*)/i) || [])[1] || '');
    if (us || uc) return { s: us || 'utm', c: uc, k: 'u' };
    var r = ((window.goatcounter && goatcounter.referrer) || document.referrer || '').toLowerCase();
    var h = ((r.match(/^[a-z][a-z0-9+.-]*:\/\/([^\/:?#]+)/) || [])[1] || '').replace(/^www\./, '');
    if (!h || /(^|\.)ricforex\.com$/.test(h) || h === 'localhost' || /^127\./.test(h)) return null;
    var s = /(^|\.)t\.me$|telegram/.test(h) ? 'tg'
          : /chatgpt|openai|perplexity|copilot|gemini|claude|deepseek/.test(h) ? 'ai-' + h
          : /(^|\.)google\.|googlequicksearchbox/.test(h) ? 'google'
          : /yandex|(^|\.)ya\.ru$/.test(h) ? 'yandex' : /(^|\.)bing\.com$/.test(h) ? 'bing'
          : /duckduckgo|ecosia|yahoo|baidu|search\.brave|qwant|startpage|go\.mail\.ru|rambler/.test(h) ? 'search-' + h
          : /scribd/.test(h) ? 'scribd' : /githubusercontent/.test(h) ? 'guide' : h;
    return { s: slug(s), c: '', k: 'r' };
  }
  try { ft = JSON.parse(get() || 'null'); } catch (e) {}
  if (!ft || typeof ft.s !== 'string' || !(Date.now() - ft.t < 30 * 864e5)) {
    ft = detect();
    if (ft) { ft.t = Date.now(); put(JSON.stringify(ft)); }
  }
  var SRC = ft ? ' [src=' + ft.s + (ft.c ? '/' + ft.c : '') + ']' : '';

  // События GoatCounter; клики до загрузки count.js ждут в очереди до 10 сек
  var Q = [];
  function flush(n) {
    setTimeout(function () {
      if (window.goatcounter && goatcounter.count) Q.splice(0).forEach(function (e) { goatcounter.count(e); });
      else if (n < 20) flush(n + 1); else Q.length = 0;
    }, 500);
  }
  function gcEv(path, title) {
    var ev = { path: path + SRC, title: title || '', event: true };
    if (window.goatcounter && goatcounter.count) goatcounter.count(ev);
    else if (Q.push(ev) === 1) flush(0);
  }

  // 1. Кнопки «Написать» сразу подставляют текст с пометкой страницы
  // Код в конце: 2 цифры страницы (data-code) + 2 цифры источника первого захода (research/site-message-codes.md), например 0311
  function srcCode(f) {
    if (!f) return '00';
    var s = f.s, T = [
      [/^tg-ru(-|$)/, '11'], [/^tg-en(-|$)/, '12'], [/^tg-free/, '13'], [/^tg-vip/, '14'], [/^tg-radar-ru/, '15'], [/^tg-radar/, '16'],
      [/^tg-chat/, '17'], [/^tg-reviews/, '18'], [/^ricfxa/, '19'], [/^(tg|telegram)/, '10'],
      [/^guide/, '20'], [/^scribd/, '21'], [/^github/, '22'], [/^fxa-docs/, '23'],
      [/^blog/, '30'], [/^wa(-|$)|whatsapp/, '31'],
      [/^google/, '01'], [/^yandex/, '02'], [/^bing/, '03'], [/^search/, '04'], [/^ai-|chatgpt|perplexity/, '05']];
    for (var i = 0; i < T.length; i++) if (T[i][0].test(s)) return T[i][1];
    return f.k === 'u' ? '91' : '90';
  }
  var code = (B.dataset.code || '99') + srcCode(ft);
  var txt = (ru ? 'Здравствуйте! Пишу с сайта ricforex.com, интересует SmartStrike. '
                : "Hello! I'm writing from ricforex.com, I'm interested in SmartStrike. ") + code;
  var tgIco = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M21.4 3.6 2.9 10.8c-1.2.5-1.2 1.2-.2 1.5l4.7 1.5 1.8 5.6c.2.6.4.8.9.8.4 0 .6-.2.9-.4l2.3-2.2 4.7 3.5c.9.5 1.5.2 1.7-.8l3.1-14.6c.3-1.3-.5-1.8-1.4-1.4ZM9 14.2l9.1-7.6c.4-.4-.1-.5-.6-.2l-10 6.3"/></svg>';
  document.querySelectorAll('a[href="https://t.me/ricfxa"]').forEach(function (a) {
    a.dataset.txt = a.dataset.msg ? a.dataset.msg + ' ' + code : txt; a.href += '?text=' + encodeURIComponent(a.dataset.txt);
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
        m.innerHTML = '<a href="' + a.href + '" target="_blank" rel="noopener" data-from="menu">' + tgIco + ' Telegram</a><a href="' + waHref + '" target="_blank" rel="noopener" data-from="menu">' + ico + ' WhatsApp</a>';
        var w = document.createElement('span'); w.className = 'contact-wrap'; a.parentNode.insertBefore(w, a); w.append(a, m);
        // кнопка шапки только открывает меню: это не клик по @ricfxa (считаем «menu: contact»), клик — по пункту меню
        a.dataset.menu = '1';
        a.addEventListener('click', function (e) { e.preventDefault(); if (w.classList.toggle('open')) gcEv('menu: contact | ' + P); });
        document.addEventListener('click', function (e) { if (!w.contains(e.target)) w.classList.remove('open'); });
      } else {
        var b = document.createElement('a'); b.className = 'btn btn-wa'; b.target = '_blank'; b.rel = 'noopener';
        b.href = 'https://wa.me/' + wa + '?text=' + encodeURIComponent(a.dataset.txt);
        var label = a.textContent.trim();
        if (!/Telegram/.test(label)) { label += ru ? ' через Telegram' : tr(' via Telegram'); a.innerHTML = tgIco + ' ' + label; }
        b.innerHTML = ico + ' ' + label.replace('Telegram', 'WhatsApp'); a.after(b);
      }
    });
    document.querySelectorAll('a[href="https://wa.me/' + wa + '"]').forEach(function (a) { a.href = waHref; });
  }
  // 2. Учёт кликов по ссылкам наружу (работает, когда включён счётчик GoatCounter)
  // «click: адрес | страница[ | откуда: menu/exit/monitor-note] [src=…]»
  var outClick = function (e) {  // левый клик и клик колёсиком (открыть в новой вкладке)
    var a = e.target.closest && e.target.closest('a[href^="http"]');
    if (!a || a.dataset.menu) return;                                  // кнопка шапки «Написать» — только меню
    if (e.type === 'click' && mon && a.href.indexOf(mon) === 0 && !a.dataset.ok) return;  // мониторинг: один раз, на «Понятно, открыть» (колёсиком — сразу)
    // ссылки-приглашения в каналы (t.me/+…, с 26.11.2026): в событии имя канала, а не код, — «click: tg RICforex (invite site) | …»
    var to = a.dataset.tg ? 'tg ' + a.dataset.tg + ' (invite site)' : a.href.split('?')[0].replace(/^https?:\/\//, '');
    gcEv('click: ' + to + ' | ' + P + (a.dataset.from ? ' | ' + a.dataset.from : ''), a.textContent.trim());
  };
  document.addEventListener('click', outClick);
  document.addEventListener('auxclick', function (e) { if (e.button === 1) outClick(e); });
  // 3. Действия на сайте (Игорь 23.11: собирать максимум статистики)
  document.addEventListener('click', function (e) {
    var l = e.target.closest && e.target.closest('a.lang');
    if (l) gcEv('lang: ' + l.textContent.trim() + ' | ' + P);
    var d = e.target.closest && e.target.closest('a[href*="#demo"]');
    if (d) gcEv('demo-button | ' + P, d.textContent.trim());
  });
  document.addEventListener('toggle', function (e) {  // открыли вопрос, архив дайджеста и т.п.
    var t = e.target;
    if (t.tagName === 'DETAILS' && t.open) { var s = t.querySelector('summary'); gcEv('open: ' + P, s ? s.textContent.trim().slice(0, 80) : ''); }
  }, true);
  var depth = {};  // дочитал ли страницу: 50% и 90%
  window.addEventListener('scroll', function () {
    var h = document.documentElement, p = (h.scrollTop + innerHeight) / h.scrollHeight;
    [50, 90].forEach(function (m) { if (p >= m / 100 && !depth[m]) { depth[m] = 1; gcEv('scroll ' + m + '% | ' + P); } });
  }, { passive: true });
  // Окно перед переходом на живой мониторинг: что именно там показано
  if (mon) document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="' + mon + '"]');
    if (!a || a.dataset.ok) return;
    e.preventDefault();
    gcEv('popup: monitor-note | ' + P);  // показ окна; переход — «click: fxmonitor.online/… | monitor-note»
    var br = B.dataset.monBroker, since = B.dataset.monSince;
    var w = document.createElement('div'); w.className = 'exit';
    w.innerHTML = '<div class="exit-box"><button class="exit-x" aria-label="close">×</button>' +
      '<div class="kicker">' + (ru ? 'Обратите внимание' : tr('Please note')) + '</div>' +
      '<h3>' + (ru ? 'Что показывает мониторинг' : tr('What the monitor shows')) + '</h3>' +
      '<p style="color:var(--muted);margin-bottom:12px">' + (ru
        ? 'Живой мониторинг показывает <b style="color:var(--text)">последнюю версию SmartStrike</b> после всех обновлений, на одном счёте у брокера <b style="color:var(--text)">' + br + '</b>, с <b style="color:var(--text)">' + since + '</b>.'
        : tr('The live monitor shows <b>the latest version of SmartStrike</b> after all updates, on one account with <b>{broker}</b>, since <b>{date}</b>.').replace(/<b>/g, '<b style="color:var(--text)">').replace('{broker}', br).replace('{date}', since)) + '</p>' +
      '<p style="color:var(--muted);margin-bottom:20px">' + (ru
        ? 'Помесячные результаты на сайте — история стратегии за всё время, поэтому цифры на мониторинге могут немного отличаться.'
        : tr('The monthly results on this site are the strategy history over the whole period, so the monitor figures may differ slightly.')) + '</p>' +
      '<a class="btn btn-green" style="width:100%;justify-content:center" href="' + a.href + '" target="_blank" rel="noopener" data-from="monitor-note">' + (ru ? 'Понятно, открыть мониторинг' : tr('Got it, open the monitor')) + '</a></div>';
    B.appendChild(w); requestAnimationFrame(function () { w.classList.add('on'); });
    function close() { w.classList.remove('on'); setTimeout(function () { w.remove(); }, 300); }
    w.querySelector('.exit-x').onclick = close; w.onclick = function (ev) { if (ev.target === w) close(); };
    var go = w.querySelector('.btn'); go.dataset.ok = '1';
    go.addEventListener('click', function () { setTimeout(close, 200); });
  });
  // 3. Окно при уходе: компьютер — мышь уходит вверх; телефон — через 40 сек. Раз в 3 дня.
  // Показ считается «popup: exit-offer», клики из окна — с пометкой «| exit».
  var KEY = 'ricExit', guide = B.dataset.guide, ch = B.dataset.ch, chName = B.dataset.chName, free = B.dataset.free;
  if (!guide) return;
  try { if (Date.now() - (+localStorage.getItem(KEY) || 0) < 3 * 864e5) return; } catch (e) {}
  var shown = false, t0 = Date.now();
  function show() {
    if (shown) return; shown = true; try { localStorage.setItem(KEY, Date.now()); } catch (e) {}
    gcEv('popup: exit-offer | ' + P);
    var w = document.createElement('div'); w.className = 'exit';
    w.innerHTML = '<div class="exit-box"><button class="exit-x" aria-label="close">×</button>' +
      '<div class="kicker">' + (ru ? 'Подождите' : tr('Before you go')) + '</div>' +
      '<h3>' + (ru ? 'Заберите бесплатно' : tr('Take these for free')) + '</h3>' +
      '<a class="exit-card" href="' + guide + '" download data-from="exit"><b>📘 ' + (ru ? 'Самоучитель по техническому анализу' : tr('Technical analysis guide')) + '</b><span>' + (ru ? 'Бесплатно, без регистрации. Нажмите, и PDF скачается' : tr('Free, no sign-up. Click and the PDF downloads')) + '</span></a>' +
      '<a class="exit-card" href="' + ch + '" target="_blank" rel="noopener" data-from="exit" data-tg="' + chName + '"><b>📈 ' + (ru ? 'Наш Telegram-канал' : tr('Our Telegram channel')) + '</b><span>' + (ru ? 'Результаты каждый день, итоги недели, обзоры рынка' : tr('Daily results, weekly summaries, market reviews')) + '</span></a>' +
      // остальное бесплатное — маленькими кнопками (Игорь, 25.11.2026)
      '<div class="exit-chips">' + [
        ['🥇', ru ? 'Сигналы по золоту' : tr('Gold signals'), free, 'RICsignalsFREE'],  // приглашение «site» из build.py (data-free)
        ['📡', ru ? 'Окна риска новостей' : tr('News risk windows'), 'radar.html'],
        ['🏦', ru ? 'Рейтинг брокеров' : tr('Broker rating'), 'brokers.html'],
        ['🗓', ru ? 'Дайджест недели' : tr('Weekly digest'), 'digest.html'],
        ['🧰', ru ? 'Инструменты трейдера' : tr('Trader tools'), 'tools.html'],
        ['⭐', ru ? 'Отзывы клиентов' : tr('Client reviews'), 'reviews.html']
      ].map(function (c) { return '<a class="chip exit-card-mini" href="' + c[2] + '" data-from="exit"' + (c[3] ? ' data-tg="' + c[3] + '"' : '') + (/^http/.test(c[2]) ? ' target="_blank" rel="noopener"' : '') + '>' + c[0] + ' ' + c[1] + '</a>'; }).join('') + '</div>' +
      '<a class="exit-skip" href="#">' + (ru ? 'Нет, спасибо' : tr('No, thanks')) + '</a></div>';
    B.appendChild(w); requestAnimationFrame(function () { w.classList.add('on'); });
    function close(e) { if (e) e.preventDefault(); w.classList.remove('on'); setTimeout(function () { w.remove(); }, 300); }
    w.querySelector('.exit-x').onclick = close; w.querySelector('.exit-skip').onclick = close;
    w.onclick = function (e) { if (e.target === w) close(); };
    w.querySelectorAll('.exit-card, .exit-card-mini').forEach(function (a) {
      a.addEventListener('click', function () {
        if (!/^http/.test(a.getAttribute('href'))) gcEv('click: ' + a.getAttribute('href') + ' | ' + P + ' | exit', a.textContent.trim());  // свои страницы (наружу считает outClick)
        setTimeout(close, 200);
      });
    });
  }
  document.addEventListener('mouseout', function (e) { if (!e.relatedTarget && e.clientY <= 5 && Date.now() - t0 > 5000) show(); });
  if (matchMedia('(hover: none)').matches) setTimeout(show, 40000);
})();
