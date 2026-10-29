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

/* ===== V52 — Panorama : frise chronologique + compteur des salons ===== */
(function () {
  'use strict';
  var d = document;
  if (d.documentElement.getAttribute('data-theme') !== 'panorama') return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }

  /* ---------- Frise : l'année défile pendant la lecture de l'histoire ---------- */
  var rail = d.querySelector('[data-rail]'), items = $$('.tl-item');
  if (rail && items.length) {
    var yearEl = rail.querySelector('.hr-year'), titleEl = rail.querySelector('.hr-title'), track = rail.querySelector('.hr-track'), bar = rail.querySelector('.hr-bar i');
    var data = items.map(function (it) { var b = it.querySelector('.tl-year b'), h = it.querySelector('h3'); var lab = b ? b.textContent.trim() : ''; return { y: parseInt(lab, 10) || 0, l: lab, t: h ? h.textContent.trim() : '' }; });
    var btns = data.map(function (x, i) {
      var li = d.createElement('li'), b = d.createElement('button'); b.type = 'button'; b.textContent = x.l; b.setAttribute('aria-label', x.l + ' — ' + x.t);
      b.addEventListener('click', function () { items[i].scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); });
      li.appendChild(b); track.appendChild(li); return b;
    });
    var cur = -1, shown = data[0].y, raf = null;
    function roll(to, lab) {
      if (!to) { cancelAnimationFrame(raf); shown = 0; yearEl.textContent = lab; yearEl.classList.remove('tick'); void yearEl.offsetWidth; yearEl.classList.add('tick'); return; }
      if (reduce || !shown) { shown = to; yearEl.textContent = to; return; }
      cancelAnimationFrame(raf); var from = shown, t0 = null, dur = 650;
      (function step(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); shown = Math.round(from + (to - from) * e); yearEl.textContent = shown; if (p < 1) raf = requestAnimationFrame(step); })(performance.now());
      yearEl.classList.remove('tick'); void yearEl.offsetWidth; yearEl.classList.add('tick');
    }
    function setActive(i) {
      if (i === cur) return; cur = i;
      btns.forEach(function (b, k) { b.classList.toggle('on', k === i); b.classList.toggle('past', k < i); });
      titleEl.textContent = data[i].t; roll(data[i].y, data[i].l);
    }
    function onScroll() {
      var mid = window.innerHeight * 0.42, best = 0, bd = 1e9;
      items.forEach(function (it, i) { var r = it.getBoundingClientRect(); var c = Math.abs((r.top + Math.min(r.height, 500) / 2) - mid); if (r.top < mid + 80 && c < bd) { bd = c; best = i; } });
      setActive(best);
      var first = items[0].getBoundingClientRect().top + window.scrollY, last = items[items.length - 1].getBoundingClientRect().bottom + window.scrollY;
      var p = (window.scrollY + window.innerHeight * 0.5 - first) / Math.max(1, last - first);
      bar.style.width = Math.max(0, Math.min(1, p)) * 100 + '%';
    }
    var tk = false; window.addEventListener('scroll', function () { if (!tk) { tk = true; requestAnimationFrame(function () { tk = false; onScroll(); }); } }, { passive: true }); window.addEventListener('resize', onScroll);
    yearEl.textContent = data[0].l; onScroll();
  }

  /* ---------- Salons : le chiffre « 60 » en grand, qui compte ---------- */
  var f3 = d.querySelector('.facts.f5 .fact:nth-child(3) > span:not(.ico-ring)');
  if (f3) {
    var m = f3.textContent.match(/\b(\d{2,3})\b/);
    if (m) {
      var n = parseInt(m[1], 10), big = d.createElement('span'); big.className = 'big'; big.textContent = reduce ? n : '0'; big.setAttribute('aria-hidden', 'true');
      f3.setAttribute('aria-label', f3.textContent.trim());
      f3.parentNode.insertBefore(big, f3);
      if (!reduce && 'IntersectionObserver' in window) {
        new IntersectionObserver(function (es, o) { es.forEach(function (e) { if (e.isIntersecting) { o.disconnect(); var t0 = null; (function s(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / 1400); big.textContent = Math.round(n * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(s); })(performance.now()); } }); }, { threshold: 0.5 }).observe(big);
      } else big.textContent = n;
    }
  }
})();

/* ===== V52 — Panorama : formalités interactives (check-list à cocher, PDF, envoi sur le téléphone) ===== */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  if (root.getAttribute('data-theme') !== 'panorama') return;
  var fl = d.querySelector('.fl'); if (!fl) return;
  function $(s, r) { return (r || d).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }
  var lang = (root.lang || 'fr').slice(0, 2);
  var L = {
    fr: { t: 'Ma check-list', prog: '{n} sur {m} démarches cochées', hint: 'Cochez au fur et à mesure : votre progression reste enregistrée sur cet appareil.', all: 'Tout', todo: 'À faire', done: 'Fait', pdf: 'Télécharger en PDF', share: 'Envoyer sur mon téléphone', print: 'Imprimer', reset: 'Tout décocher', sure: 'Confirmer ?', det: 'Voir le détail', hide: 'Masquer', mark: 'Fait', copied: 'Check-list copiée : collez-la dans vos notes', shared: 'Check-list envoyée', cleared: 'Check-list réinitialisée', fin: 'Tout est coché. Prenez soin de vous.', ttl: 'Check-list des formalités de décès', call: 'Une question ? Appelez-nous, 24h/24 : 022 809 56 00' },
    en: { t: 'My checklist', prog: '{n} of {m} steps ticked', hint: 'Tick as you go: your progress stays saved on this device.', all: 'All', todo: 'To do', done: 'Done', pdf: 'Download as PDF', share: 'Send to my phone', print: 'Print', reset: 'Untick all', sure: 'Confirm?', det: 'Show details', hide: 'Hide', mark: 'Done', copied: 'Checklist copied: paste it into your notes', shared: 'Checklist sent', cleared: 'Checklist reset', fin: 'Everything is ticked. Take care of yourself.', ttl: 'Checklist of formalities after a death', call: 'A question? Call us, 24/7: 022 809 56 00' },
    de: { t: 'Meine Checkliste', prog: '{n} von {m} Schritten abgehakt', hint: 'Haken Sie nach und nach ab: Ihr Fortschritt bleibt auf diesem Gerät gespeichert.', all: 'Alle', todo: 'Offen', done: 'Erledigt', pdf: 'Als PDF herunterladen', share: 'An mein Handy senden', print: 'Drucken', reset: 'Alle zurücksetzen', sure: 'Bestätigen?', det: 'Details anzeigen', hide: 'Ausblenden', mark: 'Erledigt', copied: 'Checkliste kopiert: in Ihre Notizen einfügen', shared: 'Checkliste gesendet', cleared: 'Checkliste zurückgesetzt', fin: 'Alles abgehakt. Passen Sie auf sich auf.', ttl: 'Checkliste der Formalitäten nach einem Todesfall', call: 'Eine Frage? Rufen Sie uns an, rund um die Uhr: 022 809 56 00' },
    es: { t: 'Mi lista de tareas', prog: '{n} de {m} trámites marcados', hint: 'Marque a medida que avance: su progreso queda guardado en este dispositivo.', all: 'Todo', todo: 'Pendiente', done: 'Hecho', pdf: 'Descargar en PDF', share: 'Enviar a mi teléfono', print: 'Imprimir', reset: 'Desmarcar todo', sure: '¿Confirmar?', det: 'Ver el detalle', hide: 'Ocultar', mark: 'Hecho', copied: 'Lista copiada: péguela en sus notas', shared: 'Lista enviada', cleared: 'Lista reiniciada', fin: 'Todo está marcado. Cuídese.', ttl: 'Lista de trámites tras un fallecimiento', call: '¿Una pregunta? Llámenos, 24 h/24: 022 809 56 00' },
    pt: { t: 'A minha lista', prog: '{n} de {m} diligências assinaladas', hint: 'Assinale à medida que avança: o seu progresso fica guardado neste dispositivo.', all: 'Tudo', todo: 'Por fazer', done: 'Feito', pdf: 'Descarregar em PDF', share: 'Enviar para o meu telemóvel', print: 'Imprimir', reset: 'Desmarcar tudo', sure: 'Confirmar?', det: 'Ver o detalhe', hide: 'Ocultar', mark: 'Feito', copied: 'Lista copiada: cole-a nas suas notas', shared: 'Lista enviada', cleared: 'Lista reiniciada', fin: 'Tudo assinalado. Cuide de si.', ttl: 'Lista de diligências após um falecimento', call: 'Uma dúvida? Ligue-nos, 24h/24: 022 809 56 00' }
  };
  var T = L[lang] || L.fr;
  var KEY = 'murith-demarches-steps', saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) { } }

  var items = $$('.fl-item', fl);
  var model = items.map(function (it, i) {
    var title = $('h3', it), box = title ? title.parentNode : it.children[1];
    var more = d.createElement('div'); more.className = 'fl-more';
    Array.prototype.slice.call(box.children).forEach(function (c) { if (c !== title) more.appendChild(c); });
    box.appendChild(more);
    var subs = $$('.checks input', it);
    var lab = d.createElement('label'); lab.className = 'fl-done'; lab.innerHTML = '<span>' + T.mark + '</span><input type="checkbox" aria-label="' + (title ? title.textContent.trim().replace(/"/g, '') : '') + '">';
    it.insertBefore(lab, it.firstChild);
    var cb = $('input', lab), tg = d.createElement('button'); tg.type = 'button'; tg.className = 'fl-toggle'; tg.textContent = T.det; box.appendChild(tg);
    var m = { el: it, title: title ? title.textContent.trim() : '', cb: cb, subs: subs, id: 'step' + i, toggle: tg };
    if (!subs.length) cb.checked = !!saved[m.id];
    return m;
  });
  function isDone(m) { return m.subs.length ? m.subs.every(function (s) { return s.checked; }) : m.cb.checked; }
  function totals() { var n = 0, t = 0; model.forEach(function (m) { if (m.subs.length) { t += m.subs.length; m.subs.forEach(function (s) { if (s.checked) n++; }); } else { t++; if (m.cb.checked) n++; } }); return [n, t]; }

  /* barre d'outils */
  var pdfBase = (lang === 'fr' ? 'docs/' : '../docs/') + 'checklist-formalites-deces-' + lang + '.pdf';
  var ic = {
    dl: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11m-4-4 4 4 4-4M5 20h14"/></svg>',
    ph: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M11 18h2"/></svg>',
    pr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 9V4h10v5M7 17H5v-6h14v6h-2M8 14h8v6H8z"/></svg>',
    rs: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12a8 8 0 1 0 3-6.2M4 4v4h4"/></svg>'
  };
  var tool = d.createElement('div'); tool.className = 'fl-tool'; tool.setAttribute('role', 'region'); tool.setAttribute('aria-label', T.t);
  tool.innerHTML = '<div class="fl-ring"><svg viewBox="0 0 88 88" aria-hidden="true"><circle class="bg" cx="44" cy="44" r="38"/><circle class="fg" cx="44" cy="44" r="38"/></svg><b>0%</b></div>' +
    '<div class="fl-info"><p class="t">' + T.t + '</p><p class="s" aria-live="polite"></p>' +
    '<div class="fl-filters" role="group"><button type="button" data-f="all" aria-pressed="true">' + T.all + '</button><button type="button" data-f="todo" aria-pressed="false">' + T.todo + '</button><button type="button" data-f="done" aria-pressed="false">' + T.done + '</button></div>' +
    '<div class="fl-acts"><a class="fb main" href="' + pdfBase + '" download>' + ic.dl + T.pdf + '</a><button type="button" class="fb" data-a="share">' + ic.ph + T.share + '</button><button type="button" class="fb" data-a="reset">' + ic.rs + '<span>' + T.reset + '</span></button></div></div>';
  fl.parentNode.insertBefore(tool, fl);
  var hint = d.createElement('p'); hint.className = 'fl-hint muted'; hint.style.cssText = 'max-width:960px;margin:-8px auto 22px;font-size:var(--fs-s)'; hint.textContent = T.hint; fl.parentNode.insertBefore(hint, fl);
  var fg = $('.fg', tool), pctEl = $('.fl-ring b', tool), sEl = $('.s', tool), filter = 'all';
  var toast = d.createElement('div'); toast.className = 'fl-toast'; toast.setAttribute('role', 'status'); d.body.appendChild(toast);
  function say(t) { toast.textContent = t; toast.classList.add('on'); clearTimeout(say._t); say._t = setTimeout(function () { toast.classList.remove('on'); }, 2600); }

  function update(pulse) {
    var tt = totals(), n = tt[0], t = tt[1], p = t ? n / t : 0;
    fg.style.strokeDashoffset = (238.76 * (1 - p)).toFixed(2); pctEl.textContent = Math.round(p * 100) + '%';
    sEl.textContent = T.prog.replace('{n}', n).replace('{m}', t); tool.classList.toggle('all', n === t && t > 0);
    model.forEach(function (m) {
      var dn = isDone(m); m.el.classList.toggle('is-done', dn); if (m.subs.length) m.cb.checked = dn;
      if (dn && !m.el.classList.contains('was') ) { m.el.classList.add('was'); setTimeout(function () { m.el.classList.add('collapsed'); m.toggle.textContent = T.det; }, pulse ? 700 : 0); }
      if (!dn) { m.el.classList.remove('was', 'collapsed'); }
      var hide = (filter === 'todo' && dn) || (filter === 'done' && !dn); m.el.classList.toggle('hidden', hide);
    });
    if (n === t && t > 0 && pulse) say(T.fin);
  }
  model.forEach(function (m) {
    m.cb.addEventListener('change', function () {
      if (m.subs.length) { var v = m.cb.checked; m.subs.forEach(function (s) { s.checked = v; s.dispatchEvent(new Event('change')); }); }
      else { saved[m.id] = m.cb.checked; persist(); }
      m.el.classList.add('pulse'); setTimeout(function () { m.el.classList.remove('pulse'); }, 700); update(true);
    });
    m.subs.forEach(function (s) { s.addEventListener('change', function () { update(true); }); });
    m.toggle.addEventListener('click', function () { var c = m.el.classList.toggle('collapsed'); m.toggle.textContent = c ? T.det : T.hide; });
  });
  $$('.fl-filters button', tool).forEach(function (b) { b.addEventListener('click', function () { filter = b.getAttribute('data-f'); $$('.fl-filters button', tool).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); update(false); }); });

  function listText() {
    var out = [T.ttl + ' — A. Murith SA', ''];
    model.forEach(function (m) {
      out.push('☐ ' + m.title);
      m.subs.forEach(function (s) { var sp = s.parentNode.querySelector('span'); out.push('    ☐ ' + (sp ? sp.textContent.trim() : '')); });
    });
    out.push('', T.call, location.href.split('#')[0]);
    return out.join('\n');
  }
  var rst = null;
  tool.addEventListener('click', function (e) {
    var b = e.target.closest('[data-a]'); if (!b) return; var a = b.getAttribute('data-a');
    if (a === 'share') {
      var txt = listText();
      if (navigator.share) navigator.share({ title: T.ttl, text: txt, url: location.href.split('#')[0] }).then(function () { say(T.shared); }, function () { });
      else if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(function () { say(T.copied); }, function () { window.location.href = 'mailto:?subject=' + encodeURIComponent(T.ttl) + '&body=' + encodeURIComponent(txt); });
      else window.location.href = 'mailto:?subject=' + encodeURIComponent(T.ttl) + '&body=' + encodeURIComponent(txt);
    }
    if (a === 'reset') {
      var sp = $('span', b);
      if (!rst) { sp.textContent = T.sure; rst = setTimeout(function () { sp.textContent = T.reset; rst = null; }, 3000); return; }
      clearTimeout(rst); rst = null; sp.textContent = T.reset;
      model.forEach(function (m) { m.subs.forEach(function (s) { s.checked = false; s.dispatchEvent(new Event('change')); }); if (!m.subs.length) { m.cb.checked = false; saved[m.id] = false; } });
      persist(); update(false); say(T.cleared);
    }
  });
  update(false);
})();

/* ===== V52 — Panorama : sommaire et partage des articles ===== */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  if (root.getAttribute('data-theme') !== 'panorama') return;
  var toc = d.querySelector('[data-toc]'), art = d.querySelector('.post-body'); if (!toc || !art) return;
  var lang = (root.lang || 'fr').slice(0, 2);
  var L = { fr: ['Dans cet article', 'Copier le lien', 'Partager', 'Lien copié'], en: ['In this article', 'Copy link', 'Share', 'Link copied'], de: ['In diesem Artikel', 'Link kopieren', 'Teilen', 'Link kopiert'], es: ['En este artículo', 'Copiar enlace', 'Compartir', 'Enlace copiado'], pt: ['Neste artigo', 'Copiar ligação', 'Partilhar', 'Ligação copiada'] }[lang] || null;
  L = L || ['Dans cet article', 'Copier le lien', 'Partager', 'Lien copié'];
  var hs = Array.prototype.slice.call(art.querySelectorAll('h3')); if (hs.length < 3) hs = Array.prototype.slice.call(art.querySelectorAll('h2, h3'));
  hs = hs.filter(function (h) { return h.textContent.trim().length > 2 && !/^(table|inhalts|índice|sumário|tabla|table of)/i.test(h.textContent.trim()); });
  if (hs.length < 2) { toc.style.display = 'none'; return; }
  var html = '<p class="toc-t">' + L[0] + '</p><ol>';
  hs.forEach(function (h, i) { if (!h.id) h.id = 'sec-' + (i + 1); html += '<li><a href="#' + h.id + '">' + h.textContent.trim().replace(/</g, '&lt;') + '</a></li>'; });
  html += '</ol><div class="toc-share"><button type="button" data-s="copy">' + L[1] + '</button>' + (navigator.share ? '<button type="button" data-s="share">' + L[2] + '</button>' : '') + '</div>';
  toc.innerHTML = html;
  var links = Array.prototype.slice.call(toc.querySelectorAll('ol a'));
  function spy() { var y = window.innerHeight * 0.3, cur = 0; hs.forEach(function (h, i) { if (h.getBoundingClientRect().top < y) cur = i; }); links.forEach(function (a, i) { a.classList.toggle('on', i === cur); }); }
  var tk = false; window.addEventListener('scroll', function () { if (!tk) { tk = true; requestAnimationFrame(function () { tk = false; spy(); }); } }, { passive: true }); spy();
  toc.addEventListener('click', function (e) {
    var b = e.target.closest('[data-s]'); if (!b) return; var u = location.href.split('#')[0];
    if (b.getAttribute('data-s') === 'share') { navigator.share({ title: d.title, url: u }).catch(function () { }); return; }
    if (navigator.clipboard) navigator.clipboard.writeText(u).then(function () { b.textContent = L[3]; setTimeout(function () { b.textContent = L[1]; }, 2000); });
  });
})();

/* ===== V53 — Panorama : carrousel 3D + vitrine produits ===== */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  if (root.getAttribute('data-theme') !== 'panorama') return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(s, r) { return (r || d).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }

  /* ---------- carrousel 3D ---------- */
  $$('[data-c3d]').forEach(function (box) {
    var stage = $('.c3d-stage', box), cards = $$('.c3d-card', box), dots = $$('.c3d-dot', box), n = cards.length, cur = 0, T = 6500, timer = null, paused = false;
    box.style.setProperty('--c3d-t', T + 'ms');
    function layout() {
      var w = cards[0].offsetWidth, narrow = window.innerWidth < 700;
      cards.forEach(function (c, i) {
        var o = i - cur; if (o > n / 2) o -= n; if (o < -n / 2) o += n;
        var x = o * w * 0.9, ry = o * -12, z = -Math.abs(o) * 160, s = 1 - Math.abs(o) * 0.12, op = Math.abs(o) > 1 ? 0 : (o === 0 ? 1 : .5);
        c.style.transform = 'translate3d(' + x.toFixed(0) + 'px,0,' + z + 'px) rotateY(' + ry + 'deg) scale(' + s.toFixed(2) + ')';
        c.style.opacity = op; c.style.zIndex = 10 - Math.abs(o); c.style.filter = o === 0 ? 'none' : 'brightness(.8) saturate(.85)';
        c.classList.toggle('is-c', o === 0); c.setAttribute('aria-hidden', o === 0 ? 'false' : 'true');
        $$('a', c).forEach(function (a) { a.tabIndex = o === 0 ? 0 : -1; });
      });
      dots.forEach(function (x, i) { x.classList.remove('on'); x.classList.toggle('done', i < cur); });
      if (dots[cur]) { void dots[cur].offsetWidth; dots[cur].classList.add('on'); }
    }
    function go(i) { cur = (i + n) % n; layout(); play(); }
    function play() { clearTimeout(timer); if (reduce || paused) return; timer = setTimeout(function () { go(cur + 1); }, T); }
    $('.c3d-n', box).addEventListener('click', function () { go(cur + 1); });
    $('.c3d-p', box).addEventListener('click', function () { go(cur - 1); });
    dots.forEach(function (x, i) { x.addEventListener('click', function () { go(i); }); });
    cards.forEach(function (c, i) { c.addEventListener('click', function (e) { if (i !== cur && !moved) { e.preventDefault(); go(i); } }); });
    box.addEventListener('mouseenter', function () { paused = true; clearTimeout(timer); dots.forEach(function (x) { x.style.animationPlayState = 'paused'; }); var on = $('.c3d-dot.on', box); if (on) on.style.setProperty('animation-play-state', 'paused'); });
    box.addEventListener('mouseleave', function () { paused = false; var on = $('.c3d-dot.on', box); if (on) on.style.removeProperty('animation-play-state'); go(cur); });
    box.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') go(cur + 1); if (e.key === 'ArrowLeft') go(cur - 1); });
    /* glisser */
    var x0 = null, moved = false;
    stage.addEventListener('pointerdown', function (e) { x0 = e.clientX; moved = false; });
    stage.addEventListener('pointermove', function (e) { if (x0 === null) return; var dx = e.clientX - x0; if (Math.abs(dx) > 8) { moved = true; stage.classList.add('drag'); } });
    function up(e) { if (x0 === null) return; var dx = e.clientX - x0; x0 = null; stage.classList.remove('drag'); if (Math.abs(dx) > 50) go(cur + (dx < 0 ? 1 : -1)); setTimeout(function () { moved = false; }, 50); }
    stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', function () { x0 = null; stage.classList.remove('drag'); });
    /* inclinaison selon la souris */
    if (!reduce && window.matchMedia('(pointer:fine)').matches) {
      stage.addEventListener('pointermove', function (e) { if (x0 !== null) return; var r = stage.getBoundingClientRect(); var px = (e.clientX - r.left) / r.width - .5; stage.style.perspectiveOrigin = (50 + px * 14) + '% 50%'; });
      stage.addEventListener('pointerleave', function () { stage.style.perspectiveOrigin = '50% 50%'; });
    }
    window.addEventListener('resize', layout);
    new IntersectionObserver(function (es) { es.forEach(function (e) { paused = !e.isIntersecting; if (paused) clearTimeout(timer); else play(); }); }, { threshold: 0.2 }).observe(box);
    layout(); play();
  });

  /* ---------- vitrine produits ---------- */
  $$('[data-pshow]').forEach(function (box) {
    var items = $$('.ps-item', box), imgs = $$('.ps-img', box), num = $('.ps-num', box), cur = 0, timer = null, hov = false;
    function set(i) {
      cur = i; items.forEach(function (x, k) { x.classList.toggle('on', k === i); }); imgs.forEach(function (x, k) { x.classList.toggle('on', k === i); });
      if (num) num.textContent = '0' + (i + 1);
    }
    function play() { clearTimeout(timer); if (reduce) return; timer = setTimeout(function () { if (!hov) set((cur + 1) % items.length); play(); }, 5200); }
    items.forEach(function (it, i) {
      it.addEventListener('mouseenter', function () { hov = true; set(i); });
      it.addEventListener('focus', function () { hov = true; set(i); });
      it.addEventListener('mouseleave', function () { hov = false; });
      it.addEventListener('blur', function () { hov = false; });
    });
    box.addEventListener('pointerdown', function () { clearTimeout(timer); }, { once: true });
    play();
  });
})();


/* ===== V54 — Panorama : vidéo (durée, vignette cliquable) ===== */
(function () {
  'use strict';
  Array.prototype.forEach.call(document.querySelectorAll('.vcard'), function (c) {
    var v = c.querySelector('video'), dur = c.querySelector('[data-dur]');
    function fmt(s) { var m = Math.floor(s / 60), r = Math.round(s % 60); return m + ':' + (r < 10 ? '0' : '') + r; }
    if (v && dur) { var set = function () { if (isFinite(v.duration) && v.duration > 0) dur.textContent = fmt(v.duration); }; v.addEventListener('loadedmetadata', set); set(); }
    c.addEventListener('click', function (e) {
      var b = c.querySelector('.vplay');
      if (!b || c.classList.contains('playing') || e.target.closest('.vplay') || c.querySelector('video[controls]')) return;
      b.click();
    });
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

/* ===== V60 — Panorama : le titre de l'accueil suit la photo du diaporama ===== */
(function () {
  'use strict';
  var d = document, hero = d.querySelector('.hero-pan'); if (!hero) return;
  var h1 = hero.querySelector('h1'), ims = [].slice.call(hero.querySelectorAll('img.as')), btn = hero.querySelector('.btns .btn-primary'), eb = h1 && h1.querySelector('.eyebrow');
  if (!h1 || !eb || !btn || ims.length < 4) return;
  var lang = (d.documentElement.lang || 'fr').slice(0, 2);
  var D = {
    fr: [['Des cérémonies dans le respect des traditions', 'La famille est au centre de toutes les décisions', 'Découvrir nos obsèques'], ['Des salons ouverts de jour comme de nuit', 'Un lieu paisible et respectueux de votre culture, religieuse ou laïque', 'Visiter nos salons'], ['Des fleurs pour un dernier hommage', 'Choisissez ou créez les arrangements de fleurs selon votre convenance', 'Composer mes arrangements']],
    en: [['Ceremonies that respect your traditions', 'The family is at the heart of every decision', 'Discover our funeral services'], ['Funeral rooms open day and night', 'A peaceful place that respects your culture, religious or secular', 'Visit our funeral rooms'], ['Flowers for a last tribute', 'Choose or create the flower arrangements as you wish', 'Compose my arrangements']],
    de: [['Feiern im Respekt Ihrer Traditionen', 'Die Familie steht im Mittelpunkt aller Entscheidungen', 'Unsere Bestattungen entdecken'], ['Abschiedsräume bei Tag und Nacht geöffnet', 'Ein ruhiger Ort, der Ihre Kultur respektiert, religiös oder weltlich', 'Unsere Abschiedsräume besuchen'], ['Blumen für eine letzte Würdigung', 'Wählen oder gestalten Sie die Blumenarrangements nach Ihren Wünschen', 'Meine Gestecke zusammenstellen']],
    es: [['Ceremonias que respetan sus tradiciones', 'La familia está en el centro de todas las decisiones', 'Descubrir nuestros funerales'], ['Salones abiertos de día y de noche', 'Un lugar sereno que respeta su cultura, religiosa o laica', 'Visitar nuestros salones'], ['Flores para un último homenaje', 'Elija o cree los arreglos florales a su gusto', 'Componer mis arreglos']],
    pt: [['Cerimónias no respeito das suas tradições', 'A família está no centro de todas as decisões', 'Descobrir os nossos funerais'], ['Salas abertas de dia e de noite', 'Um lugar sereno que respeita a sua cultura, religiosa ou laica', 'Visitar as nossas salas'], ['Flores para uma última homenagem', 'Escolha ou crie os arranjos de flores à sua medida', 'Compor os meus arranjos']]
  };
  var T = D[lang] || D.fr, HREF = ['obseques.html', 'salons.html', 'fleurs.html'];
  var main = d.createElement('span'); main.className = 'h1-main'; main.setAttribute('aria-live', 'polite');
  while (eb.nextSibling) main.appendChild(eb.nextSibling); h1.appendChild(main);
  var first = main.innerHTML, firstHref = btn.getAttribute('href'), txt = btn.firstChild, firstLabel = txt.textContent, cur = 0, tm = null;
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function apply(i) {
    main.classList.add('out'); btn.classList.add('out');
    clearTimeout(tm); tm = setTimeout(function () {
      if (i === 0) { main.innerHTML = first; btn.setAttribute('href', firstHref); txt.textContent = firstLabel; }
      else { var t = T[i - 1]; main.innerHTML = esc(t[0]) + ' <em>' + esc(t[1]) + '</em>'; btn.setAttribute('href', HREF[i - 1]); txt.textContent = t[2]; }
      main.classList.remove('out'); btn.classList.remove('out');
    }, 380);
  }
  function idx() { for (var i = 0; i < ims.length; i++) if (ims[i].classList.contains('on')) return i; return 0; }
  var mo = new MutationObserver(function () { var i = idx(); if (i !== cur) { cur = i; apply(i); } });
  ims.forEach(function (im) { mo.observe(im, { attributes: true, attributeFilter: ['class'] }); });
})();
