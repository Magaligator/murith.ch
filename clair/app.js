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
  $$('.mnav a.l, .mnav .fh').forEach(function (el, i) { el.style.setProperty('--k', i); });

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
        } else if (c.nodeType === 1 && c.tagName !== 'BR' && !c.classList.contains('w') && !c.classList.contains('eyebrow')) walk(c);
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

/* ===== Confort de navigation commun aux 4 designs ===== */
(function () {
  'use strict';
  var d = document, L = { fr: 'Retour en haut de la page', en: 'Back to top', de: 'Zurück nach oben', es: 'Volver arriba', pt: 'Voltar ao topo' };
  var b = d.createElement('button'); b.type = 'button'; b.className = 'to-top';
  b.setAttribute('aria-label', L[d.documentElement.lang] || L.fr);
  b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
  d.body.appendChild(b);
  var on = false, tk = false;
  function upd() { tk = false; var v = window.scrollY > 900; if (v !== on) { on = v; b.classList.toggle('on', v); } }
  window.addEventListener('scroll', function () { if (!tk) { tk = true; requestAnimationFrame(upd); } }, { passive: true });
  b.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); });
  /* liens externes : ouverture sûre */
  Array.prototype.forEach.call(d.querySelectorAll('a[target="_blank"]'), function (a) { if (!/noopener/.test(a.rel)) a.rel = (a.rel + ' noopener').trim(); });
})();

/* ===== V43 — Aube / Panorama : éléments dynamiques ===== */
(function () {
  'use strict';
  var d = document, $ = function (s, r) { return (r || d).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raf = window.requestAnimationFrame;

  /* Barre de progression */
  var sb = d.createElement('div'); sb.className = 'scrollbar'; sb.setAttribute('aria-hidden', 'true'); d.body.appendChild(sb);

  /* Diaporamas : arche de l'accueil (Aube) ou photo plein écran (Panorama) */
  $$('[data-aslide]').forEach(function (box) {
    var im = $$('img.as', box), n = im.length, cur = 0, T = 5600, timer = null;
    var sec = box.closest('section') || box, dots = $$('.pd', sec);
    if (n < 2) return;
    sec.style.setProperty('--slide-t', T + 'ms');
    function go(i) {
      cur = (i + n) % n;
      im.forEach(function (x, k) { x.classList.toggle('on', k === cur); });
      dots.forEach(function (x, k) { x.classList.remove('on'); x.classList.toggle('done', k < cur); });
      if (dots[cur]) { void dots[cur].offsetWidth; dots[cur].classList.add('on'); }
      play();
    }
    function play() { clearTimeout(timer); if (reduce) return; timer = setTimeout(function () { go(cur + 1); }, T); }
    dots.forEach(function (x, k) { x.addEventListener('click', function () { go(k); }); });
    if (dots[0]) dots[0].classList.add('on');
    d.addEventListener('visibilitychange', function () { if (d.hidden) clearTimeout(timer); else play(); });
    play();
  });

  /* Phrase qui s'illumine mot à mot */
  $$('[data-stmt]').forEach(function (sec) {
    var t = $('.stmt-t', sec); if (!t) return;
    var words = t.textContent.trim().split(/\s+/);
    t.setAttribute('aria-label', t.textContent.trim());
    t.innerHTML = words.map(function (w) { return '<span class="w" aria-hidden="true">' + w + '</span>'; }).join(' ');
    var ws = $$('.w', t);
    function upd() {
      var r = sec.getBoundingClientRect(), vh = window.innerHeight;
      var p = (vh * 0.85 - r.top) / (r.height * 0.75 + vh * 0.2);
      p = Math.max(0, Math.min(1, p));
      var k = Math.round(p * ws.length);
      ws.forEach(function (w, i) { w.classList.toggle('on', reduce || i < k); });
    }
    sec._upd = upd; upd();
  });

  /* Photo pleine largeur : parallaxe */
  var bands = $$('[data-band]');

  /* Mouvement souris sur le héros : les pastilles flottantes se décalent */
  var hm = $('.hero-media');
  if (hm && !reduce && window.matchMedia('(pointer:fine)').matches) {
    var c1 = $('.c1', hm), c2 = $('.c2', hm), a = $('.arch', hm);
    d.addEventListener('pointermove', function (e) {
      var x = e.clientX / window.innerWidth - .5, y = e.clientY / window.innerHeight - .5;
      if (c1) c1.style.transform = 'translate(' + (x * -26).toFixed(1) + 'px,' + (y * -18).toFixed(1) + 'px)';
      if (c2) c2.style.transform = 'translate(' + (x * 22).toFixed(1) + 'px,' + (y * 16).toFixed(1) + 'px)';
      if (a) a.style.transform = 'translate(' + (x * 8).toFixed(1) + 'px,' + (y * 6).toFixed(1) + 'px)';
    }, { passive: true });
  }

  /* Défilement : progression + parallaxe + phrase */
  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    raf(function () {
      ticking = false;
      var h = d.documentElement.scrollHeight - window.innerHeight;
      sb.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, window.scrollY / h) : 0).toFixed(4) + ')';
      if (!reduce) bands.forEach(function (b) {
        var r = b.getBoundingClientRect(), vh = window.innerHeight;
        if (r.bottom < -100 || r.top > vh + 100) return;
        var p = (r.top + r.height / 2 - vh / 2) / vh;
        b.style.setProperty('--bp', (p * -70).toFixed(1) + 'px');
      });
      $$('[data-stmt]').forEach(function (s) { s._upd && s._upd(); });
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true }); window.addEventListener('resize', onScroll); onScroll();

  /* Galerie des salons : cylindre 3D */
  $$('[data-cyl]').forEach(function (cyl) {
    var ring = $('.cyl-ring', cyl), figs = $$('figure', ring), N = figs.length, step = 360 / N;
    var ry = 0, vel = 0, drag = false, moved = 0, x0 = 0, xs = 0, inView = false, auto = true, goal = null, R = 0, pid = null;
    function layout() {
      var w = ring.offsetWidth;
      R = (w / 2) / Math.tan(Math.PI / N) * 1.0;
      figs.forEach(function (f, i) { f.style.transform = 'rotateY(' + (i * step) + 'deg) translateZ(' + R.toFixed(1) + 'px)'; });
    }
    layout(); window.addEventListener('resize', layout);
    function frame() {
      if (inView) {
        if (goal !== null && !drag) { var df = goal - ry; ry += df * 0.1; if (Math.abs(df) < 0.05) { ry = goal; goal = null; } }
        else if (!drag) { ry += vel; vel *= 0.94; if (auto && !reduce && Math.abs(vel) < 0.02) ry += 0.1; }
        ring.style.transform = 'translateZ(' + (-R).toFixed(1) + 'px) rotateY(' + ry.toFixed(2) + 'deg)';
        for (var i = 0; i < N; i++) {
          var a = (((i * step + ry) % 360) + 360) % 360, c = Math.cos(a * Math.PI / 180);
          figs[i].firstElementChild.firstElementChild.style.setProperty('--b', (0.62 + 0.42 * Math.max(0, c)).toFixed(2));
        }
      }
      raf(frame);
    }
    new IntersectionObserver(function (en) { inView = en[0].isIntersecting; }, { threshold: 0.05 }).observe(cyl);
    cyl.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.cyl-b')) return;
      drag = true; moved = 0; x0 = e.clientX; xs = e.clientX; pid = e.pointerId; goal = null; auto = false;
    });
    cyl.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var dx = e.clientX - x0; x0 = e.clientX; moved += Math.abs(dx);
      if (moved > 6) { cyl.classList.add('drag'); try { cyl.setPointerCapture(pid); } catch (x) { } }
      ry -= dx * -0.28; vel = dx * 0.28;
    });
    function up() { if (!drag) return; drag = false; cyl.classList.remove('drag'); setTimeout(function () { auto = true; }, 3500); }
    cyl.addEventListener('pointerup', up); cyl.addEventListener('pointercancel', up);
    cyl.addEventListener('click', function (e) { if (moved > 6) { e.preventDefault(); e.stopPropagation(); moved = 0; } }, true);
    function nudge(s) { auto = false; vel = 0; var base = goal === null ? ry : goal; goal = Math.round(base / step) * step + s * step; setTimeout(function () { auto = true; }, 4500); }
    $('.cyl-b.n', cyl).addEventListener('click', function () { nudge(-1); });
    $('.cyl-b.p', cyl).addEventListener('click', function () { nudge(1); });
    cyl.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') nudge(-1); if (e.key === 'ArrowLeft') nudge(1); });
    raf(frame);
  });
})();

/* ===== V47 — Aube : formulaire interactif (sujet, préférence de contact, validation en direct, confirmation) ===== */
(function () {
  'use strict';
  var d = document, lang = (d.documentElement.lang || 'fr').slice(0, 2);
  function $(s, r) { return (r || d).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }
  var L = {
    fr: { topic: 'Votre demande', t: ['Obsèques', 'Prévoyance', 'Rapatriement', 'Autre question'], pref: 'Comment souhaitez-vous être contacté ?', p: ['Par e-mail', 'Être rappelé(e)'], h: ['Nous vous répondons par e-mail.', 'Un conseiller vous rappelle au plus vite : merci d\'indiquer votre téléphone.'],
      eMail: 'Merci d\'indiquer votre adresse e-mail', eBad: 'Cette adresse e-mail semble incomplète', eTel: 'Merci d\'indiquer votre numéro de téléphone', eMsg: 'Merci d\'écrire quelques mots', left: ['Il reste 1 champ à compléter', 'Il reste {n} champs à compléter'], ready: 'Tout est prêt, vous pouvez envoyer',
      done: 'Merci, votre message est prêt', doneP: 'Votre messagerie s\'ouvre pour l\'envoyer. Pour une réponse immédiate, appelez-nous au 022 809 56 00, 24h/24.', again: 'Écrire un autre message', q: 'Besoin de nous joindre tout de suite ?', qa: 'Ligne d\'urgence · 24h/24 et 7j/7', qe: 'Écrivez-nous', hrs: 'Bureau : lundi – dimanche, 08:00 – 12:00 · 13:30 – 17:30' },
    en: { topic: 'Your request', t: ['Funeral', 'Pre-planning', 'Repatriation', 'Other question'], pref: 'How would you like to be contacted?', p: ['By e-mail', 'Call me back'], h: ['We will reply by e-mail.', 'An advisor will call you back as soon as possible: please give your phone number.'],
      eMail: 'Please enter your e-mail address', eBad: 'This e-mail address looks incomplete', eTel: 'Please enter your phone number', eMsg: 'Please write a few words', left: ['1 field left to complete', '{n} fields left to complete'], ready: 'All set, you can send it',
      done: 'Thank you, your message is ready', doneP: 'Your e-mail program opens to send it. For an immediate answer, call us on 022 809 56 00, 24/7.', again: 'Write another message', q: 'Need to reach us right now?', qa: 'Emergency line · 24/7', qe: 'Write to us', hrs: 'Office: Monday – Sunday, 08:00 – 12:00 · 13:30 – 17:30' },
    de: { topic: 'Ihr Anliegen', t: ['Bestattung', 'Vorsorge', 'Überführung', 'Andere Frage'], pref: 'Wie möchten Sie kontaktiert werden?', p: ['Per E-Mail', 'Rückruf'], h: ['Wir antworten Ihnen per E-Mail.', 'Ein Berater ruft Sie so schnell wie möglich zurück: bitte geben Sie Ihre Telefonnummer an.'],
      eMail: 'Bitte geben Sie Ihre E-Mail-Adresse an', eBad: 'Diese E-Mail-Adresse scheint unvollständig', eTel: 'Bitte geben Sie Ihre Telefonnummer an', eMsg: 'Bitte schreiben Sie ein paar Worte', left: ['Noch 1 Feld auszufüllen', 'Noch {n} Felder auszufüllen'], ready: 'Alles bereit, Sie können senden',
      done: 'Danke, Ihre Nachricht ist bereit', doneP: 'Ihr E-Mail-Programm öffnet sich zum Senden. Für eine sofortige Antwort rufen Sie uns an: 022 809 56 00, rund um die Uhr.', again: 'Weitere Nachricht schreiben', q: 'Sie möchten uns sofort erreichen?', qa: 'Notfallnummer · rund um die Uhr', qe: 'Schreiben Sie uns', hrs: 'Büro: Montag – Sonntag, 08:00 – 12:00 · 13:30 – 17:30' },
    es: { topic: 'Su solicitud', t: ['Funerales', 'Previsión', 'Repatriación', 'Otra consulta'], pref: '¿Cómo desea que le contactemos?', p: ['Por e-mail', 'Que me llamen'], h: ['Le responderemos por e-mail.', 'Un asesor le llamará lo antes posible: indique su teléfono.'],
      eMail: 'Indique su dirección de e-mail', eBad: 'Esta dirección de e-mail parece incompleta', eTel: 'Indique su número de teléfono', eMsg: 'Escriba unas palabras', left: ['Queda 1 campo por completar', 'Quedan {n} campos por completar'], ready: 'Todo listo, puede enviar',
      done: 'Gracias, su mensaje está listo', doneP: 'Se abre su correo para enviarlo. Para una respuesta inmediata, llámenos al 022 809 56 00, 24 h/24.', again: 'Escribir otro mensaje', q: '¿Necesita contactarnos ahora mismo?', qa: 'Línea de urgencia · 24 h/24', qe: 'Escríbanos', hrs: 'Oficina: lunes – domingo, 08:00 – 12:00 · 13:30 – 17:30' },
    pt: { topic: 'O seu pedido', t: ['Funeral', 'Previdência', 'Repatriamento', 'Outra questão'], pref: 'Como deseja ser contactado?', p: ['Por e-mail', 'Ligar-me de volta'], h: ['Respondemos por e-mail.', 'Um conselheiro liga-lhe o mais depressa possível: indique o seu telefone.'],
      eMail: 'Indique o seu endereço de e-mail', eBad: 'Este endereço de e-mail parece incompleto', eTel: 'Indique o seu número de telefone', eMsg: 'Escreva algumas palavras', left: ['Falta 1 campo por preencher', 'Faltam {n} campos por preencher'], ready: 'Tudo pronto, pode enviar',
      done: 'Obrigado, a sua mensagem está pronta', doneP: 'O seu programa de e-mail abre-se para a enviar. Para uma resposta imediata, ligue 022 809 56 00, 24h/24.', again: 'Escrever outra mensagem', q: 'Precisa de nos contactar já?', qa: 'Linha de urgência · 24h/24', qe: 'Escreva-nos', hrs: 'Escritório: segunda – domingo, 08:00 – 12:00 · 13:30 – 17:30' }
  };
  var T = L[lang] || L.fr;
  var ICON_TICK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 12.5 4 4 8-9"/></svg>';

  $$('form.form[data-mail]:not(#devis-form)').forEach(function (form) {
    var fEmail = form.elements.email, fTel = form.elements.tel, fMsg = form.elements.message;
    if (!fEmail || !fMsg) return;
    var card = form.parentNode, baseSubj = form.getAttribute('data-mail');

    /* --- Sujet de la demande --- */
    var topicVals = ['Obsèques', 'Prévoyance funéraire', 'Rapatriement', 'Autre question'];
    var g1 = d.createElement('fieldset'); g1.className = 'cf-group';
    g1.innerHTML = '<legend>' + T.topic + '</legend><div class="cf-opts">' + T.t.map(function (t, i) {
      return '<label class="cf"><input type="radio" name="sujet" value="' + topicVals[i] + '" data-label="Sujet"><span>' + t + '</span></label>';
    }).join('') + '</div>';
    form.insertBefore(g1, form.firstElementChild);

    /* --- Préférence de contact --- */
    var g2 = d.createElement('fieldset'); g2.className = 'cf-group';
    g2.innerHTML = '<legend>' + T.pref + '</legend><div class="cf-opts">' +
      '<label class="cf"><input type="radio" name="preference" value="E-mail" data-label="Préférence de contact" checked><span>' + T.p[0] + '</span></label>' +
      '<label class="cf"><input type="radio" name="preference" value="Être rappelé(e)" data-label="Préférence de contact"><span>' + T.p[1] + '</span></label></div><p class="cf-hint" aria-live="polite">' + T.h[0] + '</p>';
    var rows = $$('.f-row', form); form.insertBefore(g2, rows[1] ? rows[1].nextSibling : form.lastElementChild);
    var hint = $('.cf-hint', g2);

    /* --- Champs : message d'erreur, compteur, autosize --- */
    var fields = [fEmail, fTel, fMsg].filter(Boolean);
    fields.forEach(function (f) { var w = f.closest('.field'); if (!$('.err-msg', w)) { var s = d.createElement('span'); s.className = 'err-msg'; s.setAttribute('role', 'alert'); w.appendChild(s); } });
    var wMsg = fMsg.closest('.field'); wMsg.classList.add('area');
    fMsg.maxLength = 800;
    var cnt = d.createElement('span'); cnt.className = 'f-count'; cnt.setAttribute('aria-hidden', 'true'); wMsg.appendChild(cnt);

    /* --- Pied : progression + bouton --- */
    var sub = $('button[type=submit]', form), subWrap = sub.parentNode;
    subWrap.className = 'f-foot';
    var st = d.createElement('div'); st.className = 'f-status'; st.setAttribute('aria-live', 'polite'); st.innerHTML = '<span class="bar"><i></i></span><span class="tx"></span>';
    subWrap.insertBefore(st, sub);

    function pref() { var c = $('input[name=preference]:checked', form); return c ? c.value : 'E-mail'; }
    function reqTel() { return pref() !== 'E-mail'; }
    function check(f, show) {
      var v = f.value.trim(), w = f.closest('.field'), m = $('.err-msg', w), msg = '', digits = v.replace(/\D/g, '').length;
      if (f === fEmail) { if (!v && !reqTel()) msg = T.eMail; else if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) msg = T.eBad; }
      else if (f === fTel) { if ((reqTel() || v) && digits < 6) msg = T.eTel; }
      else if (f === fMsg) { if (v.length < 5) msg = T.eMsg; }
      var filled = !msg && !!v;
      if (show) { w.classList.toggle('err', !!msg); w.classList.toggle('ok', filled); m.textContent = msg; }
      return { filled: filled, bad: !!msg };
    }
    function requiredList() { return [reqTel() ? fTel : fEmail, fMsg]; }
    function update() {
      fEmail.required = !reqTel(); fTel.required = reqTel();
      fEmail.closest('.field').querySelector('label').textContent = (fEmail.getAttribute('data-label') || 'Email') + (reqTel() ? '' : '*');
      fTel.closest('.field').querySelector('label').textContent = (fTel.getAttribute('data-label') || 'Téléphone') + (reqTel() ? '*' : '');
      var rq = requiredList(), left = rq.filter(function (f) { var r = check(f, false); return !r.filled; }).length;
      var done = rq.length - left;
      $('.bar i', st).style.width = Math.round(done / rq.length * 100) + '%';
      $('.tx', st).textContent = left === 0 ? T.ready : (left === 1 ? T.left[0] : T.left[1].replace('{n}', left));
      st.classList.toggle('ready', left === 0);
      cnt.textContent = fMsg.value.length ? fMsg.value.length + ' / ' + fMsg.maxLength : '';
    }
    function autosize() { fMsg.style.height = 'auto'; fMsg.style.height = Math.min(Math.max(fMsg.scrollHeight + 2, 96), 260) + 'px'; }
    var touched = {};
    fields.forEach(function (f) {
      f.addEventListener('blur', function () { touched[f.name] = 1; check(f, true); update(); });
      f.addEventListener('input', function () { if (touched[f.name]) check(f, true); if (f === fMsg) autosize(); update(); });
    });
    $$('input[name=preference]', form).forEach(function (r) {
      r.addEventListener('change', function () { hint.textContent = reqTel() ? T.h[1] : T.h[0]; [fEmail, fTel].forEach(function (f) { if (touched[f.name] || f.value) check(f, true); }); update(); if (reqTel() && !fTel.value) fTel.focus(); });
    });
    $$('input[name=sujet]', form).forEach(function (r) {
      r.addEventListener('change', function () { form.setAttribute('data-mail', baseSubj + ' — ' + r.value); if (!fMsg.value) fMsg.focus(); });
    });

    /* --- Validation à l'envoi (avant le script d'origine) --- */
    form.addEventListener('submit', function (e) {
      var bad = null;
      requiredList().forEach(function (f) { touched[f.name] = 1; var r = check(f, true); if (!r.filled && !bad) bad = f; });
      [fEmail, fTel].forEach(function (f) { if (f.value) check(f, true); });
      if (bad || $('.field.err', form)) { e.preventDefault(); e.stopImmediatePropagation(); (bad || $('.field.err input', form)).focus(); update(); }
    }, true);

    /* --- Confirmation (après le script d'origine) --- */
    var done = d.createElement('div'); done.className = 'f-done'; done.setAttribute('role', 'status');
    done.innerHTML = '<div class="tick">' + ICON_TICK + '</div><h3>' + T.done + '</h3><p>' + T.doneP + '</p><button type="button" class="btn btn-ghost">' + T.again + '</button>';
    card.appendChild(done);
    form.addEventListener('submit', function () {
      if (!form.reportValidity()) return;
      card.classList.add('f-done-on'); done.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
    $('button', done).addEventListener('click', function () { form.reset(); card.classList.remove('f-done-on'); $$('.field', form).forEach(function (w) { w.classList.remove('ok', 'err'); }); var s = $('.sent', card); if (s) s.classList.remove('show'); touched = {}; autosize(); update(); hint.textContent = T.h[0]; form.setAttribute('data-mail', baseSubj); });
    update(); autosize();
  });

  /* --- Carte « joindre tout de suite » à côté du formulaire de l'accueil --- */
  var side = $('.form-home .contact-side');
  if (side) {
    var tel = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/></svg>';
    var mail = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m4 7 8 6 8-6"/></svg>';
    var c = d.createElement('div'); c.className = 'card reveal in f-quick';
    c.innerHTML = '<h3>' + T.q + '</h3><a class="q" href="tel:+41228095600">' + tel + '<span><small>' + T.qa + '</small><b>+41 22 809 56 00</b></span></a><a class="q" href="mailto:murith@murith.ch">' + mail + '<span><small>' + T.qe + '</small><b>murith@murith.ch</b></span></a><p class="hrs">' + T.hrs + '</p>';
    side.appendChild(c);
  }
})();

/* ===== V47 — Aube : animations ===== */
(function () {
  'use strict';
  var d = document, root = d.documentElement, reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }
  if (root.getAttribute('data-theme') !== 'clair') return;

  /* apparition en cascade des éléments d'une même rangée */
  var groups = new Map();
  $$('.reveal').forEach(function (el) { if (/--d\s*:/.test(el.getAttribute('style') || '')) return; var p = el.parentNode; if (!groups.has(p)) groups.set(p, []); groups.get(p).push(el); });
  groups.forEach(function (list) { if (list.length > 1) list.forEach(function (el, i) { el.style.setProperty('--d', (i * 0.09).toFixed(2) + 's'); }); });

  if (reduce) return;

  /* titre de l'accueil : un masque par mot */
  var h1 = d.querySelector('.hero-a h1');
  if (h1) {
    var n = 0;
    Array.prototype.slice.call(h1.childNodes).forEach(function (c) {
      if (c.nodeType === 3 && c.textContent.trim()) {
        var f = d.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach(function (t) {
          if (!t) return;
          if (/^\s+$/.test(t)) { f.appendChild(d.createTextNode(' ')); return; }
          var w = d.createElement('span'), i = d.createElement('span'); w.className = 'hw'; i.textContent = t; i.style.setProperty('--i', n++); w.appendChild(i); f.appendChild(w);
        });
        c.parentNode.replaceChild(f, c);
      } else if (c.nodeType === 1 && c.tagName === 'SPAN' && !c.classList.contains('eyebrow')) {
        var w2 = d.createElement('span'), i2 = d.createElement('span'); w2.className = 'hw'; i2.style.setProperty('--i', n++); c.parentNode.insertBefore(w2, c); i2.appendChild(c); w2.appendChild(i2);
      }
    });
  }

  if (fine) {
    /* halo du héros + lueur des cartes + boutons aimantés */
    var hero = d.querySelector('.hero-a');
    if (hero) hero.addEventListener('pointermove', function (e) { var r = hero.getBoundingClientRect(); hero.style.setProperty('--gx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%'); hero.style.setProperty('--gy', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%'); });
    $$('.card,.pcard,.step,.fl-item,.lane,.coffin,.pillar').forEach(function (c) {
      c.addEventListener('pointermove', function (e) { var r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px'); });
    });
    $$('.btn-primary').forEach(function (b) {
      b.addEventListener('pointermove', function (e) { var r = b.getBoundingClientRect(); var x = (e.clientX - r.left - r.width / 2) / r.width, y = (e.clientY - r.top - r.height / 2) / r.height; b.style.translate = (x * 10).toFixed(1) + 'px ' + (y * 7).toFixed(1) + 'px'; });
      b.addEventListener('pointerleave', function () { b.style.translate = ''; });
    });
  }

  /* en-tête : se range en descendant, revient en remontant */
  var hdr = d.querySelector('.site-header'), last = window.scrollY, tk = false;
  function hs() {
    tk = false; var y = window.scrollY, dy = y - last;
    if (Math.abs(dy) > 8) {
      var busy = d.body.classList.contains('no-scroll') || (hdr && hdr.matches(':hover,:focus-within'));
      if (hdr) hdr.classList.toggle('hide', dy > 0 && y > 520 && !busy);
      last = y;
    }
  }
  window.addEventListener('scroll', function () { if (!tk) { tk = true; requestAnimationFrame(hs); } }, { passive: true });

  /* transition entre pages : la page se range avant de changer */
  d.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (a.target && a.target !== '_self') return;
    if (a.protocol !== location.protocol || a.host !== location.host) return;
    if (!/\.html?$/.test(a.pathname) && !/\/$/.test(a.pathname)) return;
    if (a.pathname === location.pathname && a.hash) return;
    if (a.hasAttribute('download')) return;
    e.preventDefault(); root.classList.add('leaving');
    setTimeout(function () { location.href = a.href; }, 230);
  });
  window.addEventListener('pageshow', function (e) { if (e.persisted) root.classList.remove('leaving'); });
})();

/* ===== V48 — Aube : animation du texte ===== */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  if (root.getAttribute('data-theme') !== 'clair') return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lang = (root.lang || 'fr').slice(0, 2);
  function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }

  /* pastille ronde « À vos côtés 24h/24 » : appel direct */
  var B = { fr: ['À vos côtés · 24h/24 · Depuis 1888 · ', 'Appeler le 022 809 56 00, 24h/24'], en: ['By your side · 24/7 · Since 1888 · ', 'Call 022 809 56 00, 24/7'], de: ['An Ihrer Seite · rund um die Uhr · Seit 1888 · ', 'Anrufen: 022 809 56 00, rund um die Uhr'], es: ['A su lado · 24 h/24 · Desde 1888 · ', 'Llamar al 022 809 56 00, 24 h/24'], pt: ['Ao seu lado · 24h/24 · Desde 1888 · ', 'Ligar 022 809 56 00, 24h/24'] }[lang] || null;
  B = B || ['À vos côtés · 24h/24 · Depuis 1888 · ', 'Appeler le 022 809 56 00, 24h/24'];
  var badge = d.createElement('a'); badge.className = 'badge-rot'; badge.href = 'tel:+41228095600'; badge.setAttribute('aria-label', B[1]);
  badge.innerHTML = '<svg class="ring" viewBox="0 0 120 120" aria-hidden="true"><defs><path id="brp" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0"/></defs><text><textPath href="#brp" textLength="285" lengthAdjust="spacing">' + B[0] + '</textPath></text></svg><span class="core"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/></svg></span>';
  d.body.appendChild(badge);
  var bt = false;
  function bs() { bt = false; badge.classList.toggle('on', window.scrollY > 700); }
  window.addEventListener('scroll', function () { if (!bt) { bt = true; requestAnimationFrame(bs); } }, { passive: true }); bs();

  if (reduce || !('IntersectionObserver' in window)) return;
  root.classList.add('tx-on');

  /* titres : découpés en mots */
  var heads = $$('main .sec-head h2, main .intro-grid h2, main .split h2, main .band h2, main .cta-card h2, main .phead h1, main .stmt-t, main .f-quick h3').filter(function (h) { return !h.closest('.hero-a') && !h.classList.contains('stmt-t'); });
  heads.forEach(function (h) {
    var n = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          if (!c.textContent.trim()) return;
          var f = d.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function (t) {
            if (!t) return;
            if (/^\s+$/.test(t)) { f.appendChild(d.createTextNode(' ')); return; }
            var w = d.createElement('span'); w.className = 'tw'; w.textContent = t; w.style.setProperty('--wi', n++); f.appendChild(w);
          });
          c.parentNode.replaceChild(f, c);
        } else if (c.nodeType === 1 && c.tagName !== 'BR' && !c.classList.contains('tw')) walk(c);
      });
    })(h);
  });
  /* paragraphes d'un même bloc : décalage */
  $$('.reveal').forEach(function (b) {
    var i = 0; Array.prototype.slice.call(b.children).forEach(function (c) { if (c.tagName === 'P' && !c.classList.contains('eyebrow') || c.classList.contains('lead')) c.style.setProperty('--pi', i++); });
  });
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add(e.target.classList.contains('sign') ? 'written' : 'tin'); io.unobserve(e.target); } });
  }, { threshold: 0.35, rootMargin: '0px 0px -6% 0px' });
  heads.forEach(function (h) { io.observe(h); });
  /* signature : on observe le bloc parent (un élément entièrement rogné par clip-path ne « croise » jamais l'écran) */
  var sio = new IntersectionObserver(function (es, o) { es.forEach(function (e) { if (e.isIntersecting) { (e.target._sg || []).forEach(function (x) { setTimeout(function () { x.classList.add('written'); }, 450); }); o.unobserve(e.target); } }); }, { threshold: 0.2 });
  $$('.sign').forEach(function (s) { var p = s.parentNode; (p._sg = p._sg || []).push(s); sio.observe(p); });
})();

/* ===== V49 — Aube : toute la vignette vidéo est cliquable ===== */
(function () {
  Array.prototype.forEach.call(document.querySelectorAll('.vcard'), function (c) {
    c.addEventListener('click', function (e) {
      var b = c.querySelector('.vplay');
      if (!b || c.classList.contains('playing') || e.target.closest('.vplay') || c.querySelector('video[controls]')) return;
      b.click();
    });
  });
})();
