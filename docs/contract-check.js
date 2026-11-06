/* Hearth & Harvest — contract-check.js
   Run on any page served over http (python -m http.server 8852 --directory hearth-harvest-template):
     await fetch('docs/contract-check.js').then(r => r.text()).then(t => (0, eval)(t));
     await hhCheck(['index.html'])       // or hhCheck() for every page in ALL
     await hhContrast(['index.html'])    // WCAG contrast sweep, light + dark, 1280 + 375
   Each loads pages in hidden same-origin iframes and returns { summary, fails, warns }.
   An empty `fails` array means clean. Everything is asserted in a real browser — nothing is eyeballed. */
(function () {
  var ALL = ['index.html', 'home-2.html', 'about.html', 'menu.html', 'family-packages.html', 'blog.html', 'blog-details.html', 'contact.html', '404.html'];
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var KEYS = ['hh-dir', 'hh-theme'];

  function saveKeys() { var o = {}; KEYS.forEach(function (k) { try { o[k] = localStorage.getItem(k); } catch (e) {} }); return o; }
  function restoreKeys(o) { KEYS.forEach(function (k) { try { if (o[k] === null || o[k] === undefined) localStorage.removeItem(k); else localStorage.setItem(k, o[k]); } catch (e) {} }); }

  async function load(page, width, lang, theme) {
    var f = document.createElement('iframe');
    f.setAttribute('aria-hidden', 'true');
    f.style.cssText = 'position:fixed;left:0;top:0;border:0;visibility:hidden;pointer-events:none;height:900px;width:' + width + 'px';
    try { localStorage.setItem('hh-dir', lang); localStorage.setItem('hh-theme', theme || 'light'); } catch (e) {}
    document.body.appendChild(f);
    f.src = page + (page.indexOf('?') > -1 ? '&' : '?') + 'cc=' + Date.now();
    await new Promise(function (r) { f.onload = r; });
    try { await f.contentDocument.fonts.ready; } catch (e) {}
    await wait(500);
    /* reveal everything so opacity transitions never hide content from the checks */
    f.contentDocument.querySelectorAll('[data-reveal]').forEach(function (el) { el.classList.add('is-visible'); });
    f.contentDocument.documentElement.classList.remove('js-reveal');
    await wait(80);
    return f;
  }
  function visible(el, w) {
    if (!el.getClientRects().length) return false;
    var cs = w.getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') return false;
    var r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1;
  }
  function accName(el, d) {
    var n = (el.getAttribute('aria-label') || '').trim();
    if (n) return n;
    var lb = el.getAttribute('aria-labelledby');
    if (lb) return lb.split(/\s+/).map(function (id) { var x = d.getElementById(id); return x ? x.textContent : ''; }).join(' ').trim();
    var txt = el.textContent.replace(/\s+/g, ' ').trim();
    if (txt) return txt;
    var img = el.querySelector('img[alt]'); if (img && img.alt.trim()) return img.alt.trim();
    return (el.getAttribute('title') || '').trim();
  }

  /* ---- source-level checks (once per page, on the raw HTML) ------------ */
  async function sourceChecks(page, bad, warn, cache) {
    var res = await fetch(page + '?src=' + Date.now());
    if (!res.ok) { bad('cannot fetch source (' + res.status + ')'); return; }
    var src = await res.text();
    var d = new DOMParser().parseFromString(src, 'text/html');
    cache[page] = d;
    if (/href\s*=\s*["']#["']/.test(src)) bad('href="#" present');
    d.querySelectorAll('[style]').forEach(function (el) {
      if (!el.closest('[data-style-ok]')) bad('inline style= on <' + el.tagName.toLowerCase() + ' class="' + (el.className || '') + '">');
    });
    if (/<style[\s>]/i.test(src)) bad('inline <style> block');
    var inline = [].filter.call(d.querySelectorAll('script:not([src])'), function (s) { return (s.getAttribute('type') || '') !== 'application/ld+json'; });
    if (inline.length !== 1) bad('inline scripts (excluding JSON-LD) = ' + inline.length + ' (only the pre-paint script is allowed)');
    d.querySelectorAll('script[type="application/ld+json"]').forEach(function (s) { try { JSON.parse(s.textContent); } catch (e) { bad('invalid JSON-LD: ' + e.message); } });
    var ids = {}; d.querySelectorAll('[id]').forEach(function (e) { ids[e.id] = (ids[e.id] || 0) + 1; });
    Object.keys(ids).filter(function (k) { return ids[k] > 1; }).forEach(function (k) { bad('duplicate id #' + k); });
    if (!/<!-- @head[ {]/.test(src) || !/<!-- @header[ {]/.test(src) || src.indexOf('<!-- @footer -->') < 0 || src.indexOf('<!-- @scripts -->') < 0) warn('missing one of the @head/@header/@footer/@scripts markers');
    var title = (d.querySelector('title') || {}).textContent || '';
    if (!title || title.length > 60) bad('title length ' + title.length + ' (max 60)');
    var desc = (d.querySelector('meta[name="description"]') || { content: '' }).content;
    if (desc.length < 120 || desc.length > 160) bad('meta description length ' + desc.length + ' (120–160)');
    var robots = d.querySelector('meta[name="robots"]');
    if (!robots) {
      if (!d.querySelector('link[rel="canonical"]')) bad('no canonical');
      ['og:title', 'og:description', 'og:url', 'og:image'].forEach(function (p) { if (!d.querySelector('meta[property="' + p + '"]')) bad('missing ' + p); });
      if (!d.querySelector('meta[name="twitter:card"]')) bad('missing twitter:card');
    }
    if (page === '404.html' && !(robots && /noindex/.test(robots.content))) bad('404 must be noindex');
  }

  async function fragmentExists(href, cache) {
    var parts = href.split('#'), file = parts[0], id = parts[1];
    if (!id) return true;
    if (!cache[file]) {
      try { var r = await fetch(file + '?frag=' + Date.now()); if (!r.ok) return null; cache[file] = new DOMParser().parseFromString(await r.text(), 'text/html'); } catch (e) { return null; }
    }
    return !!cache[file].getElementById(id);
  }

  window.hhCheck = async function (pages) {
    pages = pages || ALL;
    var fails = [], warns = [], cache = {}, saved = saveKeys(), linkSet = {};
    for (var pi = 0; pi < pages.length; pi++) {
      var page = pages[pi];
      await sourceChecks(page, function (m) { fails.push(page + ' [source]: ' + m); }, function (m) { warns.push(page + ' [source]: ' + m); }, cache);
      var combos = [[375, 'en'], [1280, 'en'], [375, 'ar'], [1280, 'he'], [1024, 'en']];
      for (var ci = 0; ci < combos.length; ci++) {
        var width = combos[ci][0], lang = combos[ci][1];
        var tag = page + ' @' + width + '/' + lang;
        var f = await load(page, width, lang, 'light');
        var d = f.contentDocument, w = f.contentWindow, root = d.documentElement;
        var bad = function (m) { fails.push(tag + ': ' + m); };
        /* layout */
        if (root.scrollWidth > w.innerWidth + 1) {
          var off = [].filter.call(d.querySelectorAll('body *'), function (e) {
            var r = e.getBoundingClientRect();
            return r.width && (r.right > w.innerWidth + 1 || r.left < -1) && w.getComputedStyle(e).position !== 'fixed' && !e.closest('.table-wrap,.table-responsive,.menu-tabs,.visually-hidden,.pane-title-sr');
          }).slice(0, 4).map(function (e) { return e.tagName + '.' + String(e.className).slice(0, 40); });
          bad('horizontal overflow ' + root.scrollWidth + 'px > ' + w.innerWidth + 'px ' + off.join(' | '));
        }
        /* language / direction / bootstrap build */
        if (root.getAttribute('lang') !== lang) bad('lang=' + root.getAttribute('lang'));
        if (root.dir !== (lang === 'en' ? 'ltr' : 'rtl')) bad('dir=' + root.dir);
        var bs = (d.getElementById('bs-css') || {}).href || '';
        if (!bs) bad('no #bs-css link');
        else if ((lang !== 'en') !== bs.indexOf('bootstrap.rtl.min.css') > -1) bad('bootstrap build mismatch: ' + bs.split('/').pop());
        /* structure */
        if (d.querySelectorAll('h1').length !== 1) bad('h1 count ' + d.querySelectorAll('h1').length);
        var mains = d.querySelectorAll('main');
        if (mains.length !== 1 || !d.querySelector('main#main')) bad('needs exactly one <main id="main">');
        if (!d.querySelector('.skip-link[href="#main"]')) bad('no skip link');
        var last = 0;
        d.querySelectorAll('main h1, main h2, main h3, main h4, main h5, main h6').forEach(function (h) {
          var lv = +h.tagName[1]; if (last && lv > last + 1) bad('heading level skips h' + last + ' -> h' + lv + ' ("' + h.textContent.trim().slice(0, 40) + '")'); last = lv;
        });
        d.querySelectorAll('main section').forEach(function (s) {
          var lb = s.getAttribute('aria-labelledby');
          if (!lb && !s.getAttribute('aria-label')) bad('section without aria-labelledby/aria-label (' + (s.className || s.id) + ')');
          if (lb && !d.getElementById(lb)) bad('aria-labelledby target missing #' + lb);
        });
        /* media & names */
        d.querySelectorAll('.ph').forEach(function (p) { if (!(p.getAttribute('aria-label') || '').trim() || p.getAttribute('role') !== 'img') bad('.ph needs role="img" + aria-label'); });
        d.querySelectorAll('img:not([alt])').forEach(function () { bad('img without alt'); });
        /* every Bootstrap Icon must resolve to a glyph (catches names that do not exist in 1.11.3) */
        if (lang === 'en' && width === 1280) {
          var missingIcons = {};
          d.querySelectorAll('i.bi').forEach(function (ic) {
            var c = w.getComputedStyle(ic, '::before').content;
            if (!c || c === 'none' || c === 'normal' || c === '""') missingIcons[[].filter.call(ic.classList, function (k) { return k.indexOf('bi-') === 0; }).join(' ')] = 1;
          });
          Object.keys(missingIcons).forEach(function (k) { bad('icon has no glyph (not in Bootstrap Icons 1.11.3): ' + k); });
        }
        d.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=button]), select, textarea').forEach(function (el) {
          var ok = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || (el.id && d.querySelector('label[for="' + el.id + '"]')) || el.closest('label');
          if (!ok) bad('unlabelled field ' + (el.name || el.id || el.type));
          if (el.required && el.closest('form[data-demo-form]')) {
            var wrap = el.closest('.hh-field') || el.parentElement;
            if (!wrap.querySelector('.invalid-feedback')) bad('required field without .invalid-feedback: ' + (el.name || el.id));
          }
        });
        d.querySelectorAll('form').forEach(function (fm) {
          if (!fm.hasAttribute('data-demo-form')) bad('form without data-demo-form');
          if (!fm.querySelector('.demo-note') && !(fm.parentElement && fm.parentElement.querySelector('.demo-note'))) bad('form without a .demo-note');
        });
        d.querySelectorAll('button').forEach(function (b) { if (!accName(b, d)) bad('button with no accessible name'); });
        d.querySelectorAll('a[href]').forEach(function (a) { if (!accName(a, d)) bad('link with no accessible name ' + a.getAttribute('href')); });
        d.querySelectorAll('[aria-labelledby]').forEach(function (el) { el.getAttribute('aria-labelledby').split(/\s+/).forEach(function (id) { if (!d.getElementById(id)) bad('aria-labelledby -> missing #' + id); }); });
        d.querySelectorAll('[aria-controls]').forEach(function (el) { if (!d.getElementById(el.getAttribute('aria-controls'))) bad('aria-controls -> missing #' + el.getAttribute('aria-controls')); });
        /* header contract: exactly one visible reservation button */
        var reserveVisible = function () { return [].filter.call(d.querySelectorAll('.site-header .btn-reserve'), function (b) { return visible(b, w); }).length; };
        if (d.querySelectorAll('.site-header .btn-reserve').length !== 2) bad('header must contain the two .btn-reserve placements (bar + collapse), found ' + d.querySelectorAll('.site-header .btn-reserve').length);
        d.querySelectorAll('.site-header .btn-reserve').forEach(function (b) { if (b.getAttribute('href') !== 'contact.html#reservation') bad('.btn-reserve href ' + b.getAttribute('href')); });
        var toggler = d.querySelector('.site-header [data-bs-toggle="collapse"]');
        var togglerShown = toggler && visible(toggler, w);
        if (!togglerShown) {
          if (reserveVisible() !== 1) bad('visible .btn-reserve in header = ' + reserveVisible() + ' (want 1)');
          var bar = d.querySelector('.site-header .navbar > .container-xxl');
          if (bar && bar.getBoundingClientRect().height > 80) bad('desktop navbar wraps (height ' + Math.round(bar.getBoundingClientRect().height) + 'px)');
        } else {
          if (reserveVisible() > 1) bad('menu closed: ' + reserveVisible() + ' .btn-reserve visible');
          var closedCount = reserveVisible();
          toggler.click(); await wait(500);
          var nav = d.getElementById('mainNav');
          if (!nav.classList.contains('show')) bad('mobile menu did not open');
          if (toggler.getAttribute('aria-expanded') !== 'true') bad('toggler aria-expanded not true after opening');
          if (reserveVisible() !== 1) bad('menu open: visible .btn-reserve = ' + reserveVisible() + ' (want exactly 1; closed state had ' + closedCount + ')');
          d.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await wait(500);
          if (nav.classList.contains('show')) bad('Escape did not close the mobile menu');
        }
        var hdr = d.querySelector('.site-header');
        if (hdr) ['[data-theme-toggle]', '[data-dir-toggle]'].forEach(function (s) { var b = hdr.querySelector(s); if (!b || !visible(b, w)) bad(s + ' not visible in header'); });
        var homeBtn = d.querySelector('.site-header .dropdown-toggle');
        if (!homeBtn || homeBtn.tagName !== 'BUTTON') bad('Home dropdown trigger must be a <button>');
        /* one aria-current="page" per navigation landmark is correct (header nav + breadcrumb); more than one inside the same nav is not */
        d.querySelectorAll('nav').forEach(function (n) { if (n.querySelectorAll('[aria-current="page"]').length > 1) bad('more than one aria-current="page" inside one <nav>'); });
        /* filter groups */
        d.querySelectorAll('[data-filter-group]').forEach(function (g) {
          var n = g.getAttribute('data-filter-group'), items = d.querySelectorAll('[data-filter-item="' + n + '"]');
          if (!items.length) bad('filter group ' + n + ' has no items');
          var all = g.querySelector('[data-filter="all"]');
          if (!all) bad('filter group ' + n + ' has no data-filter="all" chip');
          var chip = g.querySelector('[data-filter]:not([data-filter="all"])');
          if (chip) {
            chip.click();
            var vis = [].filter.call(items, function (i) { return !i.hidden; }).length;
            if (!vis || vis === items.length) bad('filter "' + chip.getAttribute('data-filter') + '" shows ' + vis + '/' + items.length);
            if (chip.getAttribute('aria-pressed') !== 'true') bad('active chip not aria-pressed');
            if (all) all.click();
          }
          var cnt = d.querySelector('[data-filter-count="' + n + '"]');
          if (cnt && cnt.getAttribute('aria-live') !== 'polite') bad('filter count not aria-live');
          var s = d.querySelector('[data-filter-search="' + n + '"]'), empty = d.querySelector('[data-filter-empty="' + n + '"]');
          if (s) {
            s.value = 'zzqxjnomatch'; s.dispatchEvent(new w.Event('input', { bubbles: true }));
            if ([].some.call(items, function (i) { return !i.hidden; })) bad('search for nonsense still shows items');
            if (empty && empty.hidden) bad('empty state not shown for no matches');
            s.value = ''; s.dispatchEvent(new w.Event('input', { bubbles: true }));
          }
          if (!empty) bad('filter group ' + n + ' has no [data-filter-empty]');
        });
        /* tabs */
        d.querySelectorAll('[role="tablist"]').forEach(function (tl) {
          var tabs = tl.querySelectorAll('[data-bs-toggle="tab"], [data-bs-toggle="pill"]');
          tabs.forEach(function (tb) {
            if (tb.getAttribute('role') !== 'tab') bad('tab without role="tab"');
            var id = (tb.getAttribute('data-bs-target') || '').slice(1), p = id && d.getElementById(id);
            if (!p || p.getAttribute('role') !== 'tabpanel' || p.getAttribute('aria-labelledby') !== tb.id) bad('tab/panel ARIA wiring broken for ' + (tb.id || id));
          });
          if (tabs[1]) { tabs[1].click(); if (tabs[1].getAttribute('aria-selected') !== 'true') bad('tab click did not select'); tabs[0].click(); }
        });
        /* theme + links (once per page) */
        if (lang === 'en' && width === 1280) {
          var tt = d.querySelector('[data-theme-toggle]');
          if (tt) { tt.click(); if (root.getAttribute('data-bs-theme') !== 'dark' || tt.getAttribute('aria-pressed') !== 'true') bad('theme toggle failed'); tt.click(); if (root.getAttribute('data-bs-theme') !== 'light') bad('theme toggle did not return to light'); }
          var links = [].map.call(d.querySelectorAll('a[href]'), function (a) { return a.getAttribute('href'); });
          for (var li = 0; li < links.length; li++) {
            var h = links[li];
            if (/^(https?:|mailto:|tel:)/.test(h)) continue;
            if (h.charAt(0) === '#') { if (h.length > 1 && !d.getElementById(h.slice(1))) bad('in-page link to missing #' + h.slice(1)); continue; }
            var file = h.split('#')[0].split('?')[0];
            if (ALL.indexOf(file) < 0) { bad('link to page not in the page list: ' + h); continue; }
            if (h.indexOf('#') > -1 && !linkSet[h]) {
              linkSet[h] = 1;
              var ex = await fragmentExists(h, cache);
              if (ex === false) bad('link target id missing: ' + h);
              if (ex === null) warns.push(page + ': could not verify ' + h + ' (page not built yet)');
            }
          }
        }
        /* RTL: the direction toggle cycles and swaps the stylesheet */
        if (lang === 'he' && width === 1280) {
          var dt = d.querySelector('[data-dir-toggle]');
          if (dt) { dt.click(); await wait(50); if (root.dir !== 'ltr' || (d.getElementById('bs-css').href || '').indexOf('.rtl.') > -1) bad('dir toggle HE -> EN did not switch back to LTR build'); }
        }
        f.remove();
      }
    }
    restoreKeys(saved);
    return { summary: fails.length ? fails.length + ' FAIL(S)' : 'CLEAN (' + pages.length + ' page(s) × 5 viewport/lang combos)', fails: fails, warns: warns };
  };

  /* ---- WCAG contrast sweep --------------------------------------------- */
  function parseColor(s) {
    var m = s && s.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    var p = m[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  }
  function over(top, bottom) {
    var a = top.a + bottom.a * (1 - top.a);
    if (!a) return { r: 0, g: 0, b: 0, a: 0 };
    return { r: (top.r * top.a + bottom.r * bottom.a * (1 - top.a)) / a, g: (top.g * top.a + bottom.g * bottom.a * (1 - top.a)) / a, b: (top.b * top.a + bottom.b * bottom.a * (1 - top.a)) / a, a: a };
  }
  function lum(c) {
    function ch(v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
    return 0.2126 * ch(c.r) + 0.7152 * ch(c.g) + 0.0722 * ch(c.b);
  }
  function ratio(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  /* Effective background: composite translucent layers up the tree. A gradient/image layer with no
     solid background-color makes the result unknowable -> skipped. A gradient over a solid colour uses
     that colour (components with gradients declare a representative background-color on purpose). */
  function backgroundOf(el, w) {
    var layers = [];
    for (var n = el; n && n.nodeType === 1; n = n.parentElement) {
      var cs = w.getComputedStyle(n);
      var bg = parseColor(cs.backgroundColor);
      var img = cs.backgroundImage && cs.backgroundImage !== 'none';
      /* inline text highlights (e.g. the hero <em> underline swash) are decoration: keep walking up */
      if (img && (!bg || bg.a === 0) && cs.display === 'inline') continue;
      if (img && (!bg || bg.a === 0)) return { skip: 'gradient/image without solid fallback on ' + n.tagName.toLowerCase() + '.' + String(n.className).split(' ')[0] };
      if (bg && bg.a > 0) { layers.push(bg); if (bg.a >= 1) break; }
    }
    var base = { r: 255, g: 255, b: 255, a: 1 };
    for (var i = layers.length - 1; i >= 0; i--) base = over(layers[i], base);
    return { color: base };
  }
  function ownText(el) {
    for (var c = el.firstChild; c; c = c.nextSibling) if (c.nodeType === 3 && c.textContent.trim()) return c.textContent.trim();
    return '';
  }
  function srOnly(el, w) {
    for (var n = el; n && n.nodeType === 1; n = n.parentElement) {
      var cs = w.getComputedStyle(n);
      if (cs.clip === 'rect(0px, 0px, 0px, 0px)' || cs.clipPath === 'inset(50%)') return true;
      if (cs.opacity === '0') return true;
    }
    return false;
  }
  async function sweep(f, tag, fails, stats) {
    var d = f.contentDocument, w = f.contentWindow;
    d.querySelectorAll('body *').forEach(function (el) {
      var text = ownText(el);
      if (!text || ['SCRIPT', 'STYLE', 'NOSCRIPT', 'OPTION', 'OPTGROUP'].indexOf(el.tagName) > -1) return;
      if (!visible(el, w) || srOnly(el, w)) return;
      if (el.closest('[aria-hidden="true"]') || el.disabled) return;
      var cs = w.getComputedStyle(el);
      var fg = parseColor(cs.color);
      if (!fg || fg.a === 0) { stats.skipped++; return; }
      var bg = backgroundOf(el, w);
      if (bg.skip) { stats.skipped++; stats.skipReasons[bg.skip] = (stats.skipReasons[bg.skip] || 0) + 1; return; }
      var col = fg.a < 1 ? over(fg, bg.color) : fg;
      var r = ratio(col, bg.color);
      var size = parseFloat(cs.fontSize), weight = parseInt(cs.fontWeight, 10) || 400;
      var large = size >= 24 || (size >= 18.66 && weight >= 700);
      var need = large ? 3 : 4.5;
      stats.checked++;
      if (r < need) {
        var key = tag + '|' + el.tagName + '.' + String(el.className).slice(0, 40) + '|' + text.slice(0, 30);
        if (stats.seen[key]) return; stats.seen[key] = 1;
        fails.push(tag + ': ' + r.toFixed(2) + ':1 (need ' + need + ') <' + el.tagName.toLowerCase() + ' class="' + String(el.className).slice(0, 50) + '"> "' + text.slice(0, 40) + '" fg ' + cs.color + ' bg rgb(' + [bg.color.r, bg.color.g, bg.color.b].map(Math.round).join(',') + ')');
      }
    });
  }
  window.hhContrast = async function (pages) {
    pages = pages || ALL;
    var fails = [], saved = saveKeys(), stats = { checked: 0, skipped: 0, skipReasons: {}, seen: {} };
    for (var pi = 0; pi < pages.length; pi++) {
      var page = pages[pi];
      var combos = [[1280, 'light'], [1280, 'dark'], [375, 'light'], [375, 'dark']];
      for (var ci = 0; ci < combos.length; ci++) {
        var width = combos[ci][0], theme = combos[ci][1], tag = page + ' @' + width + '/' + theme;
        var f = await load(page, width, 'en', theme);
        /* at 1280, submit every demo form empty so error summaries + invalid messages are swept too */
        if (width === 1280) { f.contentDocument.querySelectorAll('form[data-demo-form]').forEach(function (fm) { try { fm.requestSubmit(); } catch (e) {} }); await wait(150); }
        if (width === 375) { var tg =f.contentDocument.querySelector('.site-header [data-bs-toggle="collapse"]'); if (tg) { tg.click(); await wait(450); } }
        await sweep(f, tag, fails, stats);
        f.remove();
      }
    }
    restoreKeys(saved);
    return { summary: (fails.length ? fails.length + ' CONTRAST FAIL(S)' : 'CLEAN') + ' — ' + stats.checked + ' text nodes checked, ' + stats.skipped + ' skipped', fails: fails, skipped: stats.skipReasons };
  };
})();
