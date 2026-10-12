(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var bn = function (n) { return String(n).replace(/\d/g, function (d) { return '০১২৩৪৫৬৭৮৯'[d]; }); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var taka = function (n) { return '৳' + bn(Number(n).toLocaleString('en-IN')); };

  /* drawer */
  var dr = $('#drawer');
  $$('[data-drawer]').forEach(function (b) { b.addEventListener('click', function () { dr.hidden = !dr.hidden; document.body.style.overflow = dr.hidden ? '' : 'hidden'; }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && dr && !dr.hidden) { dr.hidden = true; document.body.style.overflow = ''; } });

  /* notice */
  var nt = $('#notice');
  if (nt) {
    try { if (sessionStorage.getItem('nt-x')) nt.remove(); } catch (e) {}
    var nx = $('.notice-x'); if (nx) nx.addEventListener('click', function () { nt.remove(); try { sessionStorage.setItem('nt-x', '1'); } catch (e) {} });
  }

  /* carousel */
  var cr = $('#cr');
  if (cr) {
    var sl = $$('.sl', cr), dots = $$('.cr-d button', cr), i = 0, t;
    var go = function (n) { i = (n + sl.length) % sl.length; sl.forEach(function (s, k) { s.classList.toggle('on', k === i); }); dots.forEach(function (d, k) { d.setAttribute('aria-current', k === i); }); };
    var run = function () { clearInterval(t); if (sl.length > 1 && !matchMedia('(prefers-reduced-motion:reduce)').matches) t = setInterval(function () { go(i + 1); }, 5000); };
    dots.forEach(function (d, k) { d.addEventListener('click', function () { go(k); run(); }); });
    cr.addEventListener('mouseenter', function () { clearInterval(t); }); cr.addEventListener('mouseleave', run);
    var x0 = null;
    cr.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    cr.addEventListener('touchend', function (e) { if (x0 == null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) { go(i + (dx < 0 ? 1 : -1)); run(); } x0 = null; });
    run();
  }

  /* countdown */
  var cd = $('.cd[data-end]');
  if (cd) {
    var end = new Date(cd.getAttribute('data-end')).getTime();
    var tick = function () {
      var d = Math.max(0, end - Date.now()), s = Math.floor(d / 1000);
      var v = { d: Math.floor(s / 86400), h: Math.floor(s % 86400 / 3600), m: Math.floor(s % 3600 / 60), s: s % 60 };
      Object.keys(v).forEach(function (k) { var el = $('[data-u=' + k + ']', cd); if (el) el.textContent = bn(String(v[k]).padStart(2, '0')); });
      if (d <= 0) { var f = $('#flash'); if (f) f.hidden = true; clearInterval(tm); }
    };
    var tm = setInterval(tick, 1000); tick();
  }

  /* load more */
  var lm = $('[data-loadmore]');
  if (lm) lm.addEventListener('click', function () {
    var hid = $$('.pc.hid', lm.closest('section')).slice(0, 12);
    hid.forEach(function (c) { c.classList.remove('hid'); });
    if (!$('.pc.hid', lm.closest('section'))) lm.parentNode.remove();
  });

  /* gallery */
  var gm = $('#gm');
  $$('.gal-t button').forEach(function (b) { b.addEventListener('click', function () { gm.src = b.dataset.src; $$('.gal-t button').forEach(function (x) { x.removeAttribute('aria-current'); }); b.setAttribute('aria-current', 'true'); }); });

  /* listing filter/sort */
  var list = $('#plist[data-filter]');
  if (list) {
    var cards = $$('.pc', list), orig = cards.slice();
    var pmin = $('#pmin'), pmax = $('#pmax'), rmin = $('#rmin'), onl = $('#onlyoff'), srt = $('#sort');
    var apply = function () {
      var a = parseFloat(pmin.value) || 0, b = parseFloat(pmax.value) || Infinity, r = parseFloat(rmin.value) || 0, o = onl.checked, n = 0;
      cards.forEach(function (c) {
        var p = +c.dataset.price, ok = p >= a && p <= b && +c.dataset.rating >= r && (!o || +c.dataset.off > 0);
        c.hidden = !ok; c.style.display = ok ? '' : 'none'; if (ok) n++;
      });
      var cnt = $('#cnt'); if (cnt) cnt.textContent = bn(n);
      $('#nores').hidden = n > 0 || !cards.length;
    };
    var sortit = function () {
      var v = srt.value, arr = orig.slice();
      if (v === 'pa') arr.sort(function (x, y) { return x.dataset.price - y.dataset.price; });
      if (v === 'pd') arr.sort(function (x, y) { return y.dataset.price - x.dataset.price; });
      if (v === 'off') arr.sort(function (x, y) { return y.dataset.off - x.dataset.off; });
      if (v === 'rt') arr.sort(function (x, y) { return y.dataset.rating - x.dataset.rating; });
      arr.forEach(function (c) { list.appendChild(c); }); cards = arr;
    };
    [pmin, pmax].forEach(function (e) { e.addEventListener('input', apply); });
    [rmin, onl].forEach(function (e) { e.addEventListener('change', apply); });
    srt.addEventListener('change', sortit);
    $('#freset').addEventListener('click', function () { pmin.value = pmax.value = ''; rmin.value = '0'; onl.checked = false; srt.value = 'rel'; sortit(); apply(); });
  }

  /* course tabs */
  var ct = $('#ctabs');
  if (ct) ct.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    $$('button', ct).forEach(function (x) { x.classList.toggle('on', x === b); });
    $$('#clist .cw').forEach(function (c) { c.hidden = !!b.dataset.t && c.dataset.topic !== b.dataset.t; });
  });

  /* search */
  var idx = null, loading = null;
  var load = function () { if (idx) return Promise.resolve(idx); if (!loading) loading = fetch('/search-index.json').then(function (r) { return r.json(); }).then(function (d) { idx = d; return d; }).catch(function () { idx = []; return idx; }); return loading; };
  var norm = function (s) { return String(s).toLowerCase(); };
  var find = function (q, kind) { var w = norm(q).split(/\s+/).filter(Boolean); return idx.filter(function (x) { if (kind && x.k !== kind) return false; var h = norm(x.t + ' ' + (x.c || '')); return w.every(function (t) { return h.indexOf(t) > -1; }); }); };
  var kindName = { p: 'প্রোডাক্ট', c: 'কোর্স', b: 'ব্লগ' };

  var hq = $('#hq'), sug = $('#sug'), act = -1;
  if (hq) {
    hq.addEventListener('focus', load);
    hq.addEventListener('input', function () {
      var q = hq.value.trim(); act = -1;
      if (!q) { sug.hidden = true; return; }
      load().then(function () {
        var r = find(q).slice(0, 7);
        sug.innerHTML = r.length ? r.map(function (x) { return '<a href="' + esc(x.u) + '"><img src="' + esc(x.i) + '" alt="" width="36" height="36"><span>' + esc(x.t) + '</span><small>' + (x.p ? taka(x.p) : kindName[x.k]) + '</small></a>'; }).join('') : '<a href="#" onclick="return false"><span>কিছু পাওয়া যায়নি</span></a>';
        sug.hidden = false;
      });
    });
    hq.addEventListener('keydown', function (e) {
      var items = $$('a', sug); if (sug.hidden || !items.length) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); act = (act + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length; items.forEach(function (a, k) { a.classList.toggle('act', k === act); }); }
      if (e.key === 'Enter' && act > -1) { e.preventDefault(); location.href = items[act].href; }
      if (e.key === 'Escape') sug.hidden = true;
    });
    document.addEventListener('click', function (e) { if (!e.target.closest('.hs')) sug.hidden = true; });
  }

  var sres = $('#sres');
  if (sres) {
    var q = new URLSearchParams(location.search).get('q') || '', kind = '';
    if (hq) hq.value = q;
    var show = function () {
      load().then(function () {
        var r = q ? find(q, kind) : [];
        $('#sh1').textContent = q ? '"' + q + '" এর ফলাফল' : 'সার্চ করুন';
        $('#scnt').textContent = q ? bn(r.length) + 'টি ফলাফল' : 'উপরের বক্সে লিখে খুঁজুন';
        sres.innerHTML = r.map(function (x) {
          return '<a class="pc" href="' + esc(x.u) + '"><div class="pc-i"><img src="' + esc(x.i) + '" alt="' + esc(x.t) + '" width="300" height="300" loading="lazy"></div><div class="pc-b"><span class="chip">' + kindName[x.k] + '</span><h3 class="pc-t">' + esc(x.t) + '</h3>' + (x.p ? '<div class="pc-p">' + taka(x.p) + '</div>' : '') + '</div></a>';
        }).join('');
        $('#snone').hidden = !(q && !r.length);
      });
    };
    $('#stabs').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; kind = b.dataset.k; $$('#stabs button').forEach(function (x) { x.classList.toggle('on', x === b); }); show(); });
    show();
  }

  /* forms (Netlify) */
  $$('form[data-netlify]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var m = $('.nl-m', f); if (m) m.textContent = 'পাঠানো হচ্ছে...';
      fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(new FormData(f)).toString() })
        .then(function (r) { if (!r.ok) throw 0; if (m) m.textContent = 'ধন্যবাদ! আপনার বার্তা পাওয়া গেছে।'; f.reset(); })
        .catch(function () { if (m) m.textContent = 'পাঠানো যায়নি। কিছুক্ষণ পরে আবার চেষ্টা করুন।'; });
    });
  });

  /* back to top */
  var tt = $('.totop');
  if (tt) {
    window.addEventListener('scroll', function () { tt.hidden = window.scrollY < 600; }, { passive: true });
    tt.addEventListener('click', function () { window.scrollTo({ top: 0 }); });
  }
})();
