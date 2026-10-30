/* Murith V2 — interactions partagées (clair / foncé) */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  root.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };

  /* En-tête */
  var hdr = $('.site-header');
  function onScroll() { if (hdr) hdr.classList.toggle('is-scrolled', window.scrollY > 24); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* Menu mobile */
  var mnav = $('#mnav'), mbtns = $$('.menu-btn');
  function setMenu(open) {
    if (!mnav) return;
    mnav.classList.toggle('open', open);
    mbtns.forEach(function (b) { b.setAttribute('aria-expanded', open ? 'true' : 'false'); });
    d.body.classList.toggle('no-scroll', open);
    mnav.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (open) { var c = $('.close', mnav); c && c.focus(); } else if (mbtns[0]) { mbtns[0].focus(); }
  }
  mbtns.forEach(function (b) { b.addEventListener('click', function () { setMenu(!mnav.classList.contains('open')); }); });
  if (mnav) {
    $('.close', mnav).addEventListener('click', function () { setMenu(false); });
    $$('a', mnav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  }
  d.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (mnav && mnav.classList.contains('open')) setMenu(false);
      $$('.pnav>li.open').forEach(function (li) { li.classList.remove('open'); $('button', li).setAttribute('aria-expanded', 'false'); });
    }
  });
  $$('.pnav>li>button').forEach(function (b) {
    b.addEventListener('click', function () {
      var li = b.parentNode, o = li.classList.toggle('open');
      b.setAttribute('aria-expanded', o ? 'true' : 'false');
    });
  });
  d.addEventListener('click', function (e) {
    if (!e.target.closest('.pnav')) $$('.pnav>li.open').forEach(function (li) { li.classList.remove('open'); });
  });

  /* Apparition */
  var rv = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });
    rv.forEach(function (el) { io.observe(el); });
  } else { rv.forEach(function (el) { el.classList.add('in'); }); }

  /* Compteurs */
  function count(el) {
    var to = parseFloat(el.getAttribute('data-count')), suf = el.getAttribute('data-suf') || '', t0 = null, dur = 1800;
    if (reduce) { el.textContent = to + suf; return; }
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(to * e) + suf;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var cs = $$('[data-count]');
  if (cs.length && 'IntersectionObserver' in window) {
    var ci = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { count(e.target); ci.unobserve(e.target); } });
    }, { threshold: 0.6 });
    cs.forEach(function (c) { ci.observe(c); });
  }

  /* Parallaxe douce */
  var par = $$('[data-par]');
  var tlv = $('.tl');
  function frame() {
    var vh = window.innerHeight;
    if (tlv) { var r2 = tlv.getBoundingClientRect(); tlv.style.setProperty('--p', Math.min(1, Math.max(0, (vh * 0.6 - r2.top) / r2.height)).toFixed(3)); }
    if (reduce) return;
    par.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      var p = (r.top + r.height / 2 - vh / 2) / vh;
      el.style.setProperty('--py', (p * -28).toFixed(1) + 'px');
    });
  }
  var ticking = false;
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(function () { frame(); ticking = false; }); } }, { passive: true });
  window.addEventListener('resize', frame); frame();

  $$('.tl-item').forEach(function (it) {
    if (!('IntersectionObserver' in window)) { it.classList.add('in'); return; }
    new IntersectionObserver(function (es, o) { es.forEach(function (e) { if (e.isIntersecting) { it.classList.add('in'); o.disconnect(); } }); }, { threshold: 0.35 }).observe(it);
  });

  /* ---------- Sliders ---------- */
  var sliders = [];
  function initSlider(root) {
    var tr = $('.s-track', root), prev = $('.s-prev', root), next = $('.s-next', root),
        bar = $('.s-bar i', root), cnt = $('.s-count', root), ctrl = $('.s-ctrl', root);
    if (!tr) return;
    var api = { root: root, track: tr, listeners: [] };
    function items() { return $$('.s-item', tr).filter(function (x) { return !x.hidden; }); }
    function stepW() {
      var it = items(), g = parseFloat(getComputedStyle(tr).columnGap) || 0;
      return it.length ? it[0].getBoundingClientRect().width + g : tr.clientWidth;
    }
    function index() { return Math.round(tr.scrollLeft / stepW()); }
    function update() {
      var max = tr.scrollWidth - tr.clientWidth, over = max > 4;
      if (ctrl) ctrl.hidden = !over;
      if (bar) {
        var vis = Math.min(1, tr.clientWidth / tr.scrollWidth), p = max > 0 ? tr.scrollLeft / max : 0;
        bar.style.width = (vis * 100) + '%'; bar.style.left = (p * (1 - vis) * 100) + '%';
      }
      if (prev) prev.disabled = tr.scrollLeft <= 2;
      if (next) next.disabled = tr.scrollLeft >= max - 2;
      if (cnt) { var n = items().length, i = Math.min(n, index() + 1); cnt.textContent = (i < 10 ? '0' : '') + i + ' / ' + (n < 10 ? '0' : '') + n; }
      api.listeners.forEach(function (f) { f(index()); });
    }
    api.update = update; api.index = index;
    api.go = function (i) { tr.scrollTo({ left: i * stepW(), behavior: reduce ? 'auto' : 'smooth' }); };
    api.on = function (f) { api.listeners.push(f); };
    if (prev) prev.addEventListener('click', function () { tr.scrollBy({ left: -stepW(), behavior: reduce ? 'auto' : 'smooth' }); });
    if (next) next.addEventListener('click', function () { tr.scrollBy({ left: stepW(), behavior: reduce ? 'auto' : 'smooth' }); });
    var raf = false;
    tr.addEventListener('scroll', function () { if (!raf) { raf = true; requestAnimationFrame(function () { update(); raf = false; }); } }, { passive: true });
    window.addEventListener('resize', update);
    tr.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); tr.scrollBy({ left: stepW(), behavior: 'smooth' }); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); tr.scrollBy({ left: -stepW(), behavior: 'smooth' }); }
    });
    /* glisser à la souris */
    var down = false, sx = 0, sl = 0, moved = false;
    tr.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = false; sx = e.clientX; sl = tr.scrollLeft;
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - sx;
      if (!moved && Math.abs(dx) > 6) { moved = true; tr.classList.add('drag'); }
      if (moved) tr.scrollLeft = sl - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!down) return; down = false;
      if (moved) { var t = tr; setTimeout(function () { t.classList.remove('drag'); }, 0); }
    });
    sliders.push(api); root._api = api;
    update();
    setTimeout(update, 400);
    window.addEventListener('load', update);
  }
  $$('[data-slider]').forEach(initSlider);

  /* Frise (histoire) : rail d'années synchronisé */
  var ts = $('[data-tslider]');
  if (ts && ts._api) {
    var yrs = $$('.t-yr', ts.parentNode), api = ts._api;
    yrs.forEach(function (b, i) { b.addEventListener('click', function () { api.go(i); }); });
    api.on(function (i) {
      yrs.forEach(function (b, k) { b.setAttribute('aria-current', k === i ? 'true' : 'false'); });
      var act = yrs[i]; if (act && act.scrollIntoView) { var rail = act.parentNode; rail.scrollTo({ left: act.offsetLeft - rail.clientWidth / 2 + act.clientWidth / 2, behavior: 'smooth' }); }
    });
  }

  /* Onglets des services */
  $$('[data-tabs]').forEach(function (box) {
    var tabs = $$('[role="tab"]', box), panels = $$('[role="tabpanel"]', box);
    function sel(i, focus) {
      tabs.forEach(function (t, k) { t.setAttribute('aria-selected', k === i ? 'true' : 'false'); t.tabIndex = k === i ? 0 : -1; });
      panels.forEach(function (p, k) { p.hidden = k !== i; });
      if (focus) tabs[i].focus();
      var t = tabs[i]; if (t && t.parentNode.scrollTo && t.parentNode.scrollWidth > t.parentNode.clientWidth) t.parentNode.scrollTo({ left: t.offsetLeft - 24, behavior: 'smooth' });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { sel(i); });
      t.addEventListener('keydown', function (e) {
        var n = tabs.length;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); sel((i + 1) % n, true); }
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); sel((i - 1 + n) % n, true); }
      });
    });
    $$('[data-tab-go]', box).forEach(function (b) {
      b.addEventListener('click', function () {
        var cur = tabs.findIndex(function (t) { return t.getAttribute('aria-selected') === 'true'; });
        var n = tabs.length, i = (cur + parseInt(b.getAttribute('data-tab-go'), 10) + n) % n;
        sel(i);
        var top = box.getBoundingClientRect().top + window.scrollY - 110;
        window.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
      });
    });
    var h = (location.hash || '').match(/^#s(\d+)$/);
    sel(h ? Math.min(parseInt(h[1], 10), tabs.length) - 1 : 0);
  });

  /* Filtres */
  $$('[data-filter-group]').forEach(function (g) {
    var items = $$(g.getAttribute('data-filter-group'));
    var key = g.getAttribute('data-key');
    $$('.chip', g).forEach(function (ch) {
      ch.addEventListener('click', function () {
        $$('.chip', g).forEach(function (c) { c.setAttribute('aria-pressed', c === ch ? 'true' : 'false'); });
        var v = ch.getAttribute('data-v');
        items.forEach(function (it) {
          var vals = (it.getAttribute(key) || '').split('|');
          it.hidden = !(v === '*' || vals.indexOf(v) > -1);
        });
        sliders.forEach(function (s) { if (s.root.contains(items[0])) { s.track.scrollLeft = 0; s.update(); } });
      });
    });
  });

  /* Lightbox */
  var lb = $('#lb');
  if (lb) {
    var list = [], cur = 0, im = $('img', lb), cap = $('.cap', lb);
    var show = function (i) {
      cur = (i + list.length) % list.length;
      im.src = list[cur].src; im.alt = list[cur].alt; cap.textContent = list[cur].cap;
    };
    $$('[data-lb]').forEach(function (el) {
      var g = el.getAttribute('data-lb');
      if (el.tagName !== 'BUTTON') {
        el.setAttribute('tabindex', '0'); el.setAttribute('role', 'button');
        el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); } });
      }
      el.addEventListener('click', function () {
        var vis = $$('[data-lb="' + g + '"]').filter(function (x) { return !x.closest('[hidden]'); });
        list = vis.map(function (x) { return { src: x.getAttribute('data-src'), alt: x.getAttribute('data-alt') || '', cap: x.getAttribute('data-cap') || '' }; });
        show(vis.indexOf(el)); lb.showModal();
      });
    });
    $('.x', lb).addEventListener('click', function () { lb.close(); });
    $('.p', lb).addEventListener('click', function () { show(cur - 1); });
    $('.nx', lb).addEventListener('click', function () { show(cur + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('lb-in')) lb.close(); });
    lb.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') show(cur - 1); if (e.key === 'ArrowRight') show(cur + 1); });
  }



  /* Vidéo compacte */
  $$('.vcard').forEach(function (c) {
    var v = $('video', c), b = $('.vplay', c);
    b.addEventListener('click', function () { v.controls = true; c.classList.add('playing'); v.play(); });
    v.addEventListener('ended', function () { c.classList.remove('playing'); v.controls = false; v.load(); });
  });

  /* Vidéo YouTube : l'iframe n'est chargée qu'au clic */
  $$('[data-yt]').forEach(function (b) {
    b.addEventListener('click', function () {
      var f = d.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + b.getAttribute('data-yt') + '?autoplay=1&rel=0&start=' + (b.getAttribute('data-start') || 0);
      f.title = b.getAttribute('aria-label'); f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'; f.allowFullscreen = true;
      b.parentNode.replaceChild(f, b);
    });
  });

  /* Étapes animées : tracé de la ligne et des icônes à l'arrivée à l'écran */
  $$('.flow').forEach(function (fl) {
    if (reduce || !('IntersectionObserver' in window)) return;
    $$('li', fl).forEach(function (li, i) { li.style.setProperty('--i', i); });
    $$('.node svg *', fl).forEach(function (n) { if (n.setAttribute && /^(path|circle|rect|line|polyline|polygon|ellipse)$/i.test(n.tagName)) n.setAttribute('pathLength', '1'); });
    fl.classList.add('fa');
    new IntersectionObserver(function (es, o) { es.forEach(function (e) { if (e.isIntersecting) { fl.classList.add('go'); o.disconnect(); } }); }, { threshold: 0.3 }).observe(fl);
  });

  /* Panneaux extensibles : survol, focus ou clic */
  $$('.xp').forEach(function (xp) {
    var items = $$('.xp-i', xp);
    function open(it) { items.forEach(function (x) { x.classList.toggle('on', x === it); }); }
    items.forEach(function (it) {
      it.addEventListener('mouseenter', function () { if (window.matchMedia('(min-width:861px)').matches) open(it); });
      it.addEventListener('click', function () { open(it); });
      it.addEventListener('focus', function () { open(it); });
    });
  });

  /* Diaporama du héros : fondu, légende, barres de progression, balayage tactile */
  $$('[data-hs]').forEach(function (hs) {
    var sl = $$('.hs-s', hs), caps = $$('.hs-c', hs), bars = $$('.hs-bars i', hs), n = sl.length, cur = 0, T = 6000, timer = null;
    hs.style.setProperty('--hs-t', T + 'ms');
    function go(i) {
      cur = (i + n) % n;
      sl.forEach(function (x, k) { x.classList.toggle('on', k === cur); });
      caps.forEach(function (x, k) { x.classList.toggle('on', k === cur); });
      bars.forEach(function (x, k) { x.classList.remove('on'); x.classList.toggle('done', k < cur); });
      void hs.offsetWidth; bars[cur].classList.add('on');
      play();
    }
    function play() { clearTimeout(timer); if (reduce || hs.hasAttribute('data-paused')) return; timer = setTimeout(function () { go(cur + 1); }, T); }
    $$('.hs-n', hs)[0].addEventListener('click', function () { go(cur + 1); });
    $$('.hs-p', hs)[0].addEventListener('click', function () { go(cur - 1); });
    hs.addEventListener('mouseenter', function () { hs.setAttribute('data-paused', ''); clearTimeout(timer); });
    hs.addEventListener('mouseleave', function () { hs.removeAttribute('data-paused'); go(cur); });
    var x0 = null;
    hs.addEventListener('pointerdown', function (e) { x0 = e.clientX; });
    hs.addEventListener('pointerup', function (e) { if (x0 !== null && Math.abs(e.clientX - x0) > 40) go(cur + (e.clientX < x0 ? 1 : -1)); x0 = null; });
    go(0);
  });

  /* Copier un texte de remerciement */
  $$('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var t = $('.tx-t', b.parentNode), txt = t.innerText.replace(/\n{2,}/g, '\n');
      function done() { var s = $('span', b), o = s.getAttribute('data-o') || s.textContent; s.setAttribute('data-o', o); b.classList.add('ok'); s.textContent = (window.MI18N && window.MI18N.copied) || 'Copié'; setTimeout(function () { b.classList.remove('ok'); s.textContent = o; }, 1800); }
      if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(txt).then(done, done); }
      else { var ta = d.createElement('textarea'); ta.value = txt; d.body.appendChild(ta); ta.select(); try { d.execCommand('copy'); } catch (e) { } d.body.removeChild(ta); done(); }
    });
  });

  /* Liste de contrôle */
  var KEY = 'murith-demarches', saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { }
  $$('.checks input').forEach(function (c) {
    if (saved[c.id]) c.checked = true;
    c.addEventListener('change', function () { saved[c.id] = c.checked; try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) { } });
  });

  /* Formulaires (prototype : mailto — renseigner FORM_ENDPOINT pour un envoi réel) */
  var FORM_ENDPOINT = '';
  function formText(form) {
    var out = [];
    $$('input,textarea,select', form).forEach(function (f) {
      if (!f.name) return;
      if ((f.type === 'radio' || f.type === 'checkbox') && !f.checked) return;
      if (f.value) out.push(f.getAttribute('data-label') + ' : ' + f.value);
    });
    return out.join('\n');
  }
  $$('form[data-mail]:not(#devis-form)').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var subj = form.getAttribute('data-mail');
      if (FORM_ENDPOINT) { fetch(FORM_ENDPOINT, { method: 'POST', body: new FormData(form) }); }
      else { window.location.href = 'mailto:murith@murith.ch?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(formText(form)); }
      var s = $('.sent', form.parentNode); if (s) s.classList.add('show');
    });
  });

  /* Devis interactif : tuiles, récapitulatif en direct, progression, validation, confirmation */
  var qf = $('#devis-form');
  if (qf) {
    var steps = $$('.fstep', qf), dots = $$('.stepper li'), bar = $('.qprog i', qf), n = 0;
    var sumLis = $$('[data-sum]'), pct = $('[data-pct]'), done = $('.qdone'), recap = $('.recap', done);
    var valOf = function (name) {
      var el = qf.elements[name]; if (!el) return '';
      if (el.length && el[0].type === 'radio') { var c = $('input[name="' + name + '"]:checked', qf); return c ? c.value : ''; }
      return (el.value || '').trim();
    };
    var update = function () {
      var filled = 0;
      sumLis.forEach(function (li) {
        var v = valOf(li.getAttribute('data-sum'));
        $('b', li).textContent = v || '—'; li.classList.toggle('ok', !!v); if (v) filled++;
      });
      var p = Math.round(filled / sumLis.length * 100);
      if (pct) pct.textContent = p + '%';
      if (bar) bar.style.width = Math.max(p, (n + 1) / steps.length * 22) + '%';
      steps.forEach(function (st) {
        var nb = $('[data-next]', st); if (!nb) return;
        var groups = $$('fieldset.field', st);
        nb.classList.toggle('ready', groups.length > 0 && groups.every(function (g) { return $('input:checked', g); }));
      });
    };
    var go = function (i, quiet) {
      n = i;
      steps.forEach(function (s, k) { s.classList.toggle('on', k === i); });
      dots.forEach(function (x, k) { x.classList.toggle('on', k === i); x.classList.toggle('done', k < i); });
      update();
      if (quiet) return;
      var top = qf.getBoundingClientRect().top + window.scrollY - 140;
      window.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
    };
    $$('[data-next]', qf).forEach(function (b) { b.addEventListener('click', function () { go(Math.min(n + 1, steps.length - 1)); }); });
    $$('[data-prev]', qf).forEach(function (b) { b.addEventListener('click', function () { go(Math.max(n - 1, 0)); }); });
    dots.forEach(function (x, k) { x.style.cursor = 'pointer'; x.addEventListener('click', function () { go(k); }); });
    qf.addEventListener('change', update); qf.addEventListener('input', update);
    $$('[data-fill]', qf).forEach(function (b) {
      b.addEventListener('click', function () {
        qf.elements.lieu.value = b.getAttribute('data-v');
        $$('[data-fill]', qf).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        update();
      });
    });
    qf.addEventListener('submit', function (e) {
      e.preventDefault();
      var em = qf.elements.email, ok = /^\S+@\S+\.\S+$/.test(em.value.trim());
      em.parentNode.classList.toggle('err', !ok);
      if (!ok) { go(2); em.focus(); return; }
      recap.innerHTML = ''; sumLis.forEach(function (li) { recap.appendChild(li.cloneNode(true)); });
      if (FORM_ENDPOINT) { fetch(FORM_ENDPOINT, { method: 'POST', body: new FormData(qf) }); }
      else { window.location.href = 'mailto:murith@murith.ch?subject=' + encodeURIComponent(qf.getAttribute('data-mail')) + '&body=' + encodeURIComponent(formText(qf)); }
      qf.style.display = 'none'; done.classList.add('show');
      window.scrollTo({ top: done.getBoundingClientRect().top + window.scrollY - 140, behavior: reduce ? 'auto' : 'smooth' });
    });
    $('[data-edit]', done).addEventListener('click', function () { done.classList.remove('show'); qf.style.display = ''; go(0); });
    go(0, true);
  }
})();

/* ===== Design « Lumen » : mouvement (titres, images, curseur, rideau, bandeau) ===== */
(function () {
  var d = document, root = d.documentElement;
  if (root.getAttribute('data-theme') !== 'lumen') return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  var io = 'IntersectionObserver' in window;

  /* Numérotation du menu plein écran (apparition en cascade) */
  $$('.mnav a.l, .mnav h4').forEach(function (el, i) { el.style.setProperty('--k', i); });

  /* Barre de progression de lecture */
  var bar = d.createElement('div'); bar.className = 'sprog'; bar.setAttribute('aria-hidden', 'true'); d.body.appendChild(bar);
  function prog() { var h = root.scrollHeight - window.innerHeight; bar.style.setProperty('--sp', h > 0 ? Math.min(1, window.scrollY / h) : 0); }
  window.addEventListener('scroll', prog, { passive: true }); prog();

  if (reduce) return;

  /* Titres : chaque mot monte depuis un masque */
  function split(el) {
    var n = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var frag = d.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function (t) {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.appendChild(d.createTextNode(' ')); return; }
            var w = d.createElement('span'), i = d.createElement('span');
            w.className = 'w'; i.textContent = t; i.style.setProperty('--wi', n++); w.appendChild(i); frag.appendChild(w);
          });
          c.parentNode.replaceChild(frag, c);
        } else if (c.nodeType === 1 && c.tagName !== 'BR' && !c.classList.contains('w')) walk(c);
      });
    })(el);
    el.classList.add('sx');
  }
  var heads = $$('main h1, main h2, .giant-h').filter(function (h) { return !h.closest('.faq, .lb, .mnav, summary'); });
  heads.forEach(split);
  var hio = io ? new IntersectionObserver(function (es, o) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); o.unobserve(e.target); } }); }, { threshold: 0.15 }) : null;
  heads.forEach(function (h) { if (hio) hio.observe(h); else h.classList.add('in'); });

  /* Images : rideau qui se lève */
  var sel = '.arch .a-in, .fs-media, figure.photo, .tl-body figure:not(.yt), .post-img, .contact-video .vcard, .map';
  var imgs = $$(sel);
  /* on observe le parent : un élément entièrement masqué par clip-path ne « croise » jamais l'écran */
  var iio = io ? new IntersectionObserver(function (es, o) { es.forEach(function (e) { if (e.isIntersecting) { (e.target._rv || []).forEach(function (x) { x.classList.add('in'); }); o.unobserve(e.target); } }); }, { threshold: 0.1 }) : null;
  imgs.forEach(function (el) {
    el.classList.add('img-rv');
    var p = el.parentNode;
    if (!iio) { el.classList.add('in'); return; }
    (p._rv = p._rv || []).push(el); iio.observe(p);
  });

  if (!fine) { transitions(); return; }

  /* Curseur : anneau fluide, qui grandit sur les liens et les images */
  var ring = d.createElement('div'), dot = d.createElement('div');
  ring.className = 'cur'; dot.className = 'cur-dot'; ring.setAttribute('aria-hidden', 'true'); dot.setAttribute('aria-hidden', 'true');
  d.body.appendChild(ring); d.body.appendChild(dot);
  var mx = 0, my = 0, rx = 0, ry = 0, shown = false;
  window.addEventListener('mousemove', function (e) {
    mx = e.clientX; my = e.clientY;
    if (!shown) { shown = true; rx = mx; ry = my; ring.classList.add('on'); dot.classList.add('on'); }
    dot.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
  }, { passive: true });
  d.addEventListener('mouseleave', function () { ring.classList.remove('on'); dot.classList.remove('on'); shown = false; });
  (function loop() { rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16; ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)'; requestAnimationFrame(loop); })();
  d.addEventListener('mouseover', function (e) { ring.classList.toggle('big', !!e.target.closest('a, button, summary, .s-btn, .fs-media, .arch')); });

  /* Boutons magnétiques */
  $$('.btn, .menu-btn, .tel-pill, .s-btn').forEach(function (b) {
    b.addEventListener('mousemove', function (e) {
      var r = b.getBoundingClientRect(), x = (e.clientX - r.left - r.width / 2) * 0.22, y = (e.clientY - r.top - r.height / 2) * 0.3;
      b.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    });
    b.addEventListener('mouseleave', function () { b.style.transform = ''; });
  });

  transitions();

  /* Rideau de transition entre les pages */
  function transitions() {
    var c = d.createElement('div'); c.className = 'curtain'; c.setAttribute('aria-hidden', 'true');
    c.innerHTML = '<img src="' + (root.getAttribute('data-base') || '../') + 'img/logo-blanc.png" alt="">'; d.body.appendChild(c);
    var came = false;
    try { came = sessionStorage.getItem('mc-curtain') === '1'; sessionStorage.removeItem('mc-curtain'); } catch (e) { }
    if (came) {
      c.classList.add('cover'); c.style.transition = 'none';
      requestAnimationFrame(function () { requestAnimationFrame(function () { c.style.transition = ''; c.classList.remove('cover'); c.classList.add('lift'); setTimeout(function () { c.style.display = 'none'; }, 1200); }); });
    }
    d.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank' || a.hasAttribute('download')) return;
      var h = a.getAttribute('href');
      if (!h || h.charAt(0) === '#' || /^(mailto:|tel:|https?:)/i.test(h) || h.indexOf('.html') < 0) return;
      e.preventDefault();
      c.style.display = ''; c.classList.remove('lift'); c.classList.add('cover');
      try { sessionStorage.setItem('mc-curtain', '1'); } catch (x) { }
      setTimeout(function () { window.location.href = a.href; }, 720);
    });
    window.addEventListener('pageshow', function (e) { if (e.persisted) { c.classList.remove('cover'); c.style.display = 'none'; } });
  }
})();


/* ===== V55 — Nuit : menu plein écran avec aperçu, animations des titres et des textes ===== */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  if (root.getAttribute('data-theme') !== 'fonce') return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(s, r) { return (r || d).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }
  var pre = root.getAttribute('data-base') ? '../../img/' : '../img/';

  /* ---------- menu : structure à deux colonnes + aperçu photo ---------- */
  var mnav = $('#mnav');
  if (mnav) {
    var top = $('.mnav-top', mnav), grid = $('.mnav-grid', mnav), call = $('.big-call', mnav), q = $('.big-q', mnav), soc = $('.social-m, .social', mnav);
    var body = d.createElement('div'); body.className = 'mn-body';
    var left = d.createElement('div'); left.className = 'mn-left';
    [grid, call, q, soc].forEach(function (x) { if (x) left.appendChild(x); });
    var prev = d.createElement('div'); prev.className = 'mn-prev'; prev.setAttribute('aria-hidden', 'true');
    var MAP = { 'notre-histoire': 'histoire3.jpg', 'obseques': 'deuil-ceremonie.jpg', 'salons': 'hero-salons.jpg', 'cercueils': 'hero-cercueils.jpg', 'fleurs': 'hero-fleurs.jpg', 'formalites': 'hero-formalites.jpg', 'devis': 'hero-devis.jpg', 'conseillers': 'equipe-chapelle-cluse.jpg', 'prevoyance': 'hero-prevoyance.jpg', 'transports': 'hero-transports.jpg', 'murith-care': 'hero-care.jpg', 'blog': 'cartes.jpg', 'remerciements': 'hero-remerciements.jpg', 'contact': 'hero-contact.jpg' };
    var DEF = 'equipe-chapelle-cluse.jpg', names = {}, imgs = {};
    function key(h) { var m = (h || '').match(/([a-z-]+)\.html/); return m ? m[1].replace(/^post-.*/, 'blog') : ''; }
    var files = [DEF]; Object.keys(MAP).forEach(function (k) { if (files.indexOf(MAP[k]) < 0) files.push(MAP[k]); });
    files.forEach(function (f, i) { var im = d.createElement('img'); im.src = pre + f; im.alt = ''; im.loading = 'lazy'; if (i === 0) im.className = 'on'; imgs[f] = im; prev.appendChild(im); });
    var cap = d.createElement('div'); cap.className = 'mn-cap'; cap.innerHTML = '<small></small><span></span>'; prev.appendChild(cap);
    body.appendChild(left); body.appendChild(prev); mnav.appendChild(body);
    var cur = DEF;
    function show(a) {
      var f = MAP[key(a.getAttribute('href'))] || DEF; if (f === cur) { $('span', cap).textContent = a.textContent.trim(); return; }
      imgs[cur].classList.remove('on'); imgs[f].classList.add('on'); cur = f; $('span', cap).textContent = a.textContent.trim();
    }
    $$('a.l', mnav).forEach(function (a) { a.addEventListener('mouseenter', function () { show(a); }); a.addEventListener('focus', function () { show(a); }); });
    $$('.mnav-grid > div', mnav).forEach(function (g, i) { g.style.setProperty('--k', i); });
    var tag = $('.mnav-top img', mnav); $('small', cap).textContent = (tag && tag.alt) || 'A. Murith SA';
  }

  /* ---------- animations ---------- */
  var groups = new Map();
  $$('.reveal').forEach(function (el) { if (/--d\s*:/.test(el.getAttribute('style') || '')) return; var p = el.parentNode; if (!groups.has(p)) groups.set(p, []); groups.get(p).push(el); });
  groups.forEach(function (list) { if (list.length > 1) list.forEach(function (el, i) { el.style.setProperty('--d', (i * 0.09).toFixed(2) + 's'); }); });
  if (reduce || !('IntersectionObserver' in window)) return;
  root.classList.add('tx-on');

  /* titre de l'accueil : un masque par mot */
  var h1 = $('.hero-a h1');
  if (h1) {
    var n = 0;
    Array.prototype.slice.call(h1.childNodes).forEach(function (c) {
      if (c.nodeType === 3 && c.textContent.trim()) {
        var f = d.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach(function (t) { if (!t) return; if (/^\s+$/.test(t)) { f.appendChild(d.createTextNode(' ')); return; } var w = d.createElement('span'), i = d.createElement('span'); w.className = 'hw'; i.textContent = t; i.style.setProperty('--i', n++); w.appendChild(i); f.appendChild(w); });
        c.parentNode.replaceChild(f, c);
      } else if (c.nodeType === 1 && c.tagName === 'SPAN') { var w2 = d.createElement('span'), i2 = d.createElement('span'); w2.className = 'hw'; i2.style.setProperty('--i', n++); c.parentNode.insertBefore(w2, c); i2.appendChild(c); w2.appendChild(i2); }
    });
  }
  /* titres de section et de page : mot après mot */
  var heads = $$('main .sec-head h2, main .intro-w h2, main .split h2, main .nband h2, main .cta-card h2, main .phead h1, main .quote').filter(function (h) { return !h.closest('.hero-a') && !h.closest('#faq'); });
  heads.forEach(function (h) {
    var n = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          if (!c.textContent.trim()) return; var f = d.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function (t) { if (!t) return; if (/^\s+$/.test(t)) { f.appendChild(d.createTextNode(' ')); return; } var w = d.createElement('span'); w.className = 'tw'; w.textContent = t; w.style.setProperty('--wi', n++); f.appendChild(w); });
          c.parentNode.replaceChild(f, c);
        } else if (c.nodeType === 1 && c.tagName !== 'BR' && !c.classList.contains('tw')) walk(c);
      });
    })(h);
  });
  $$('.reveal').forEach(function (b) { var i = 0; Array.prototype.slice.call(b.children).forEach(function (c) { if ((c.tagName === 'P' && !c.classList.contains('eyebrow')) || c.classList.contains('lead')) c.style.setProperty('--pi', i++); }); });
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('tin'); io.unobserve(e.target); } }); }, { threshold: 0.35, rootMargin: '0px 0px -6% 0px' });
  heads.forEach(function (h) { io.observe(h); });
  var sio = new IntersectionObserver(function (es, o) { es.forEach(function (e) { if (e.isIntersecting) { (e.target._sg || []).forEach(function (x) { setTimeout(function () { x.classList.add('written'); }, 450); }); o.unobserve(e.target); } }); }, { threshold: 0.2 });
  $$('.sign').forEach(function (s) { var p = s.parentNode; (p._sg = p._sg || []).push(s); sio.observe(p); });

  /* photo plein écran : parallaxe */
  var bands = $$('.nband'), tk = false;
  function onScroll() {
    tk = false; var vh = window.innerHeight;
    bands.forEach(function (b) { var r = b.getBoundingClientRect(); if (r.bottom < -100 || r.top > vh + 100) return; b.style.setProperty('--bp', (((r.top + r.height / 2 - vh / 2) / vh) * -70).toFixed(1) + 'px'); });
  }
  window.addEventListener('scroll', function () { if (!tk) { tk = true; requestAnimationFrame(onScroll); } }, { passive: true }); onScroll();
})();

/* ===== V56 — Nuit : menu déroulant sous l'en-tête ===== */
(function () {
  'use strict';
  var d = document; if (d.documentElement.getAttribute('data-theme') !== 'fonce') return;
  var mnav = d.getElementById('mnav'), hdr = d.querySelector('.site-header'); if (!mnav || !hdr) return;
  var bd = d.createElement('div'); bd.className = 'mn-bd'; d.body.appendChild(bd);
  function place() { var r = hdr.getBoundingClientRect(); var t = Math.max(0, Math.round(r.bottom)); d.documentElement.style.setProperty('--mn-top', t + 'px'); }
  new MutationObserver(function () { var open = mnav.classList.contains('open'); if (open) place(); bd.classList.toggle('on', open); }).observe(mnav, { attributes: true, attributeFilter: ['class'] });
  bd.addEventListener('click', function () { var c = mnav.querySelector('.close'); if (c) c.click(); else d.querySelector('.menu-btn').click(); });
  window.addEventListener('resize', function () { if (mnav.classList.contains('open')) place(); });
  place();
})();

/* ===== V56 — Nuit : questionnaire de prévoyance ===== */
(function () {
  'use strict';
  var d = document, box = d.querySelector('[data-qn]'); if (!box) return;
  function $(s, r) { return (r || d).querySelector(s); } function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }
  var steps = $$('.qn-s', box), form = $('.qn-form', box), bar = $('.qn-prog i', box), stepEl = $('.qn-step', box), err = $('.qn-err', form), next = $('[data-next]', box), back = $('[data-back]', box), n = 0;
  function show() {
    steps.forEach(function (s, i) { s.classList.toggle('on', i === n); }); box.setAttribute('data-step', n + 1);
    bar.style.width = ((n + 1) / steps.length * 100) + '%'; stepEl.textContent = stepEl.getAttribute('data-tpl').replace('{n}', n + 1);
    next.textContent = n === steps.length - 1 ? next.getAttribute('data-see') : next.getAttribute('data-n'); err.textContent = '';
  }
  function answered() { var s = steps[n]; return !!$('input:checked', s); }
  next.addEventListener('click', function () {
    if (!answered()) { err.textContent = err.getAttribute('data-msg'); var s = steps[n]; s.classList.remove('on'); void s.offsetWidth; s.classList.add('on'); return; }
    if (n < steps.length - 1) { n++; show(); return; }
    var labels = JSON.parse($('[data-sum]', box).getAttribute('data-labels')), vals = [
      ($('input[name=q1]:checked', box) || {}).value, ($('input[name=q2]:checked', box) || {}).value, $$('input[name=q3]:checked', box).map(function (x) { return x.value; }).join(' · ')];
    $('[data-sum]', box).innerHTML = labels.map(function (l, i) { return '<li><small>' + l + '</small><b>' + String(vals[i] || '').replace(/</g, '&lt;') + '</b></li>'; }).join('');
    box.classList.add('done'); box._vals = vals; box.scrollIntoView({ block: 'start', behavior: 'smooth' });
  });
  back.addEventListener('click', function () { if (n > 0) { n--; show(); } });
  $$('input', form).forEach(function (i) { i.addEventListener('change', function () { err.textContent = ''; if (i.type === 'radio' && n < steps.length - 1) setTimeout(function () { if (n < steps.length - 1 && answered()) { n++; show(); } }, 350); }); });
  $('[data-redo]', box).addEventListener('click', function () { box.classList.remove('done'); form.reset(); $('[data-ok]', box).hidden = true; $('[data-cbform]', box).hidden = true; n = 0; show(); });
  var cb = $('[data-cbform]', box);
  $('[data-cb]', box).addEventListener('click', function () { cb.hidden = false; var t = $('input[name=tel]', cb); t && t.focus(); });
  cb.addEventListener('submit', function (e) {
    e.preventDefault(); var t = $('input[name=tel]', cb), e2 = $('.qn-err', cb);
    if (t.value.replace(/\D/g, '').length < 6) { e2.textContent = e2.getAttribute('data-msg'); t.focus(); return; }
    e2.textContent = ''; var v = box._vals || [], body = ['Questionnaire prévoyance funéraire', '', 'Pour qui : ' + (v[0] || ''), 'Cérémonie : ' + (v[1] || ''), 'Priorités : ' + (v[2] || ''), '', 'Prénom : ' + ($('input[name=prenom]', cb).value || ''), 'Téléphone : ' + t.value].join('\n');
    $('[data-ok]', box).hidden = false; window.location.href = 'mailto:murith@murith.ch?subject=' + encodeURIComponent('Prévoyance funéraire — demande de rappel') + '&body=' + encodeURIComponent(body);
  });
  show();
})();

/* ===== V61 — Version mobile : contenu allégé (lire la suite, FAQ courte, pied de page en accordéon) ===== */
(function () {
  'use strict';
  var d = document;
  if (!window.matchMedia || !window.matchMedia('(max-width:700px)').matches) return;
  var lang = (d.documentElement.lang || 'fr').slice(0, 2);
  var L = { fr: ['Lire la suite', 'Réduire', 'Voir toutes les questions', 'Moins de questions'], en: ['Read more', 'Show less', 'Show all questions', 'Fewer questions'], de: ['Weiterlesen', 'Weniger', 'Alle Fragen anzeigen', 'Weniger Fragen'], es: ['Leer más', 'Menos', 'Ver todas las preguntas', 'Menos preguntas'], pt: ['Ler mais', 'Menos', 'Ver todas as perguntas', 'Menos perguntas'] }[lang];
  L = L || ['Lire la suite', 'Réduire', 'Voir toutes les questions', 'Moins de questions'];
  function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }
  function mkBtn(label, cb) { var b = d.createElement('button'); b.type = 'button'; b.className = 'm-more'; b.textContent = label; b.setAttribute('aria-expanded', 'false'); b.addEventListener('click', cb); return b; }

  /* 1) texte d'introduction de l'accueil : un seul paragraphe, le reste sur demande */
  var sign = d.querySelector('main .sign');
  if (sign) {
    var sec = sign.closest('section');
    var ps = $$('p', sec).filter(function (p) { return !p.classList.contains('sign') && !p.classList.contains('quote') && !p.classList.contains('lead') && !p.classList.contains('eyebrow') && p.textContent.trim().length > 80 && !p.closest('.btns'); });
    var quote = sec.querySelector('.quote');
    if (ps.length > 1) {
      var hid = ps.slice(1).concat(quote ? [quote] : []).concat([sign]);
      hid.forEach(function (e) { e.classList.add('m-hide'); });
      var btn = mkBtn(L[0], function () { var open = btn.getAttribute('aria-expanded') === 'true'; hid.forEach(function (e) { e.classList.toggle('m-hide', open); }); btn.setAttribute('aria-expanded', open ? 'false' : 'true'); btn.textContent = open ? L[0] : L[1]; });
      ps[0].parentNode.insertBefore(btn, ps[0].nextSibling);
    }
  }
  /* 2) FAQ : les trois premières questions */
  var faq = d.querySelector('.faq');
  if (faq) {
    var det = $$('details', faq);
    if (det.length > 3) {
      var rest = det.slice(3); rest.forEach(function (e) { e.classList.add('m-hide'); });
      var fb = mkBtn(L[2], function () { var open = fb.getAttribute('aria-expanded') === 'true'; rest.forEach(function (e) { e.classList.toggle('m-hide', open); }); fb.setAttribute('aria-expanded', open ? 'false' : 'true'); fb.textContent = open ? L[2] : L[3]; });
      faq.parentNode.insertBefore(fb, faq.nextSibling);
    }
  }
  /* 3) pied de page : colonnes de liens repliées */
  $$('.foot-main > div').forEach(function (c) {
    if (c.classList.contains('foot-brand') || c.classList.contains('foot-contact')) return;
    var h = c.querySelector(':scope > .fh, :scope > h3'), ul = c.querySelector(':scope > ul'); if (!h || !ul) return;
    c.classList.add('foot-acc'); h.setAttribute('role', 'button'); h.setAttribute('tabindex', '0'); h.setAttribute('aria-expanded', 'false');
    function tg() { var o = c.classList.toggle('open'); h.setAttribute('aria-expanded', o ? 'true' : 'false'); }
    h.addEventListener('click', tg); h.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tg(); } });
  });
  /* 4) sommaire des articles : replié */
  $$('.toc').forEach(function (t) { var h = t.querySelector('.toc-t'); if (h) h.addEventListener('click', function () { t.classList.toggle('open'); }); });
  /* 5) vidéo : pas de préchargement sur mobile */
  $$('video').forEach(function (v) { v.preload = 'none'; });
})();

/* ===== V61 — Mobile : articles longs repliés par rubrique ===== */
(function () {
  'use strict';
  var d = document;
  if (!window.matchMedia || !window.matchMedia('(max-width:700px)').matches) return;
  var art = d.querySelector('article.post-body'); if (!art) return;
  var level = art.querySelectorAll('h3').length >= 4 ? 'H3' : (art.querySelectorAll('h2').length >= 4 ? 'H2' : ''); if (!level) return;
  var kids = Array.prototype.slice.call(art.children), groups = [], cur = null, intro = d.createElement('div');
  kids.forEach(function (k) {
    if (k.tagName === level) { cur = { h: k, body: [] }; groups.push(cur); }
    else if (cur) cur.body.push(k);
    else intro.appendChild(k);
  });
  if (groups.length < 3) { while (intro.firstChild) art.insertBefore(intro.firstChild, art.firstChild); return; }
  art.innerHTML = ''; art.appendChild(intro);
  groups.forEach(function (g, i) {
    var s = d.createElement('section'); s.className = 'm-acc' + (i === 0 ? ' open' : ''); 
    var b = d.createElement('button'); b.type = 'button'; b.className = 'm-acc-h'; b.setAttribute('aria-expanded', i === 0 ? 'true' : 'false'); b.appendChild(g.h); 
    var p = d.createElement('div'); p.className = 'm-acc-b'; g.body.forEach(function (x) { p.appendChild(x); });
    s.appendChild(b); s.appendChild(p); art.appendChild(s);
    b.addEventListener('click', function () { var o = s.classList.toggle('open'); b.setAttribute('aria-expanded', o ? 'true' : 'false'); if (o) setTimeout(function () { var r = s.getBoundingClientRect(); if (r.top < 70) window.scrollBy({ top: r.top - 80, behavior: 'smooth' }); }, 30); });
  });
  /* le sommaire (liens #sec-n) ouvre la bonne rubrique */
  d.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('.toc a[href^="#"]'); if (!a) return; var t = d.getElementById(a.getAttribute('href').slice(1)); var s = t && t.closest('.m-acc'); if (s && !s.classList.contains('open')) { s.classList.add('open'); s.querySelector('.m-acc-h').setAttribute('aria-expanded', 'true'); } });
})();

/* ===== V64 — Mobile : téléphone dans l'en-tête, langues dans le menu, gestes de contact sur l'accueil ===== */
(function () {
  'use strict';
  var d = document, $ = function (s, r) { return (r || d).querySelector(s); };
  var hdr = $('.site-header .hdr');
  if (hdr && !$('.m-tel', hdr)) {
    var call = $('.callbar .c1');
    var a = d.createElement('a'); a.className = 'm-tel'; a.href = 'tel:+41228095600';
    a.setAttribute('aria-label', call ? call.textContent.trim() : 'Tel');
    a.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/></svg>';
    hdr.appendChild(a);
  }
  var lang = $('.lang'), mn = $('.mnav');
  if (lang && mn && !$('.m-lang', mn)) {
    var w = d.createElement('div'); w.className = 'm-lang'; w.setAttribute('aria-label', lang.getAttribute('aria-label') || 'Langue');
    Array.prototype.forEach.call(lang.querySelectorAll('a'), function (x) { w.appendChild(x.cloneNode(true)); });
    mn.appendChild(w);
  }
  var fh = $('.form-home .container');
  if (fh && !$('.m-actions', fh)) {
    var c1 = $('.callbar .c1'), c2 = $('.callbar .c2');
    var contact = $('.mnav a.l[href$="contact.html"]');
    var box = d.createElement('div'); box.className = 'm-actions';
    var items = [];
    if (c1) items.push(['btn btn-primary', c1.getAttribute('href'), c1.textContent.trim()]);
    if (c2) items.push(['btn btn-ghost', c2.getAttribute('href'), c2.textContent.trim()]);
    if (contact) items.push(['btn btn-ghost', contact.getAttribute('href'), contact.textContent.trim()]);
    items.forEach(function (it) { var l = d.createElement('a'); l.className = it[0]; l.href = it[1]; l.textContent = it[2]; box.appendChild(l); });
    fh.appendChild(box);
  }
})();
