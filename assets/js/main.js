/* ==========================================================================
   Hearth & Harvest — main.js
   Vanilla JS, no dependencies besides Bootstrap's own bundle (dropdown,
   collapse, tabs, accordion, modal). Pages never need inline <script> blocks.
   NOTHING here talks to a server: every form is a FRONT-END DEMO.

   MARKUP CONTRACT (switch a behaviour on with a data-* attribute)
   -----------------------------------------------------------------------
   THEME & LANGUAGE (header partial — do not re-add)
   [data-theme-toggle]           button: light <-> dark; saved in localStorage "hh-theme".
                                 First visit follows prefers-color-scheme (and live changes).
   [data-dir-toggle]             button: cycles EN -> AR -> HE; saved in "hh-dir". Swaps the
                                 Bootstrap build on <link id="bs-css"> (LTR <-> RTL).
     [data-dir-code]             child that shows EN / AR / HE
   [data-i18n="key"]             text swapped from the I18N table below
   [data-i18n-attr="aria-label:key;placeholder:key2"]   attributes swapped the same way

   MOTION & NUMBERS
   [data-reveal]                 fade/slide in when scrolled into view (="2|3|4" = stagger).
                                 Content is visible without JS and with reduced motion.
   [data-count-up="2900"]        counts up once visible; put the FINAL value in the markup.
                                 optional data-prefix="$" data-suffix="+" data-decimals="1"
   [data-year]                   filled with the current year

   FILTER / SEARCH (menu, blog)
   [data-filter-group="NAME"]    wrapper of <button data-filter="all|vg|recipes">
   [data-filter-item="NAME"]     items; data-category="v gf" (space separated tokens);
                                 optional data-search="extra words"
   [data-filter-search="NAME"]   <input type="search"> live text search
   [data-filter-count="NAME"]    "N results" — made a polite live region automatically
   [data-filter-empty="NAME"]    empty state (start it with the hidden attribute)
   [data-filter-reset="NAME"]    button that clears search + chips
   [data-filter-panes="NAME"]    on a .tab-content: while filtering, every pane with
                                 matches is shown with its .pane-title-sr heading;
                                 clicking one of its tabs clears the filter + search

   TABS (menu categories) — Bootstrap tabs (role=tablist/tab/tabpanel, data-bs-toggle="tab").
                                 A URL hash naming a pane id (menu.html#pane-desserts)
                                 opens that tab on load.

   FORMS
   form[data-demo-form]          validated in the browser, never sent. Fields wrapped in
                                 .hh-field with .invalid-feedback get live validation on
                                 blur, aria-invalid + aria-describedby, and an icon+text
                                 message. Optional on the <input>: data-msg-missing,
                                 data-msg-type, data-msg-range, data-msg-pattern.
     data-demo-message="…"       toast text on success
     data-success="#panelId"     element shown (and focused) on success; children
                                 [data-echo="fieldName"] receive the submitted values
     data-hide-on-success        hide the form while the success panel shows
     [data-form-again]           button inside the success panel: show the form again
     data-redirect="page.html"   go there after success
     [data-error-summary]        (inside the form, hidden) list of errors with links,
                                 focused on a failed submit; [data-error-count] gets N
     Forms inside a .modal close the modal on success.
   input[type=date][data-min-today]   min = today (local); data-max-days="90" optional
   select[data-time-slots]       options generated from opening hours for the chosen day
     data-date-input="#id"       the date field that drives it
     data-hours="mon-thu 11:30-21:30; fri-sat 11:30-22:30; sun 11:00-21:00"
     data-last-seating="30"      minutes before closing (kitchen closes) — default 30
     data-slot-step="30"         minutes between slots — default 30
   [data-stepper]                wrapper: input[type=number min max] + button[data-step="-1|1"]
   [data-hours-row="1 2 3 4"]    hours-table row for those weekdays (0 = Sun); today's row
                                 gets .is-today, aria-current="date" and a "Today" badge

   MISC
   [data-demo-toast="message"]   button/link shows a toast instead of navigating
   [data-back-to-top]            floating button (footer partial)
   Escape closes the mobile menu; choosing an in-page link closes it too.
   ========================================================================== */
(function () {
  'use strict';

  var doc = document.documentElement;
  var BS_CSS = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap';
  var KEY_THEME = 'hh-theme', KEY_DIR = 'hh-dir';
  var reduceMotion = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  function store(key, val) {
    try {
      if (val === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, val);
    } catch (e) { /* private mode / blocked storage must not break the page */ }
    return null;
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  var uid = 0;
  function ensureId(el, prefix) { if (!el.id) el.id = (prefix || 'hh') + '-' + (++uid); return el.id; }

  /* ---- I18N: UI strings in English --------------------------------------- */
  var I18N = {
    en: {
      'ui.result': 'result', 'ui.results': 'results', 'ui.today': 'Today',
      'ui.demoSent': 'Demo only — nothing was sent.', 'ui.fixErrors': 'Please fix the highlighted fields.',
      'ui.chooseDate': 'Choose a date first', 'ui.chooseTime': 'Choose a time',
      'ui.noSlots': 'No tables left today — choose another date',
      'ui.lunch': 'Lunch & brunch', 'ui.afternoon': 'Afternoon', 'ui.dinner': 'Dinner',
      'ui.switchDark': 'Switch to dark theme', 'ui.switchLight': 'Switch to light theme',
      'ui.dirLabel': 'Text direction', 'ui.switchTo': 'Switch to'
    }
  };
  function lang() { return 'en'; }
  function t(key) { return (I18N.en && I18N.en[key]) || key; }

  /* ---- Toast (live region exists before the first message) ---------------- */
  var toastZone = document.createElement('div');
  toastZone.className = 'toast-zone';
  toastZone.setAttribute('role', 'status');
  toastZone.setAttribute('aria-live', 'polite');
  document.body.appendChild(toastZone);
  function toast(message, kind) {
    var el = document.createElement('div');
    var icon = kind === 'error' ? 'bi-exclamation-octagon-fill' : kind === 'info' ? 'bi-info-circle-fill' : 'bi-check-circle-fill';
    el.className = 'hh-toast' + (kind ? ' ' + kind : '');
    el.innerHTML = '<i class="bi ' + icon + '" aria-hidden="true"></i><span></span>';
    el.lastChild.textContent = message;
    toastZone.appendChild(el);
    setTimeout(function () { el.remove(); }, 4500);
  }
  window.hhToast = toast;

  /* ---- Theme ------------------------------------------------------------ */
  function applyTheme(theme) {
    doc.setAttribute('data-bs-theme', theme);
    var meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#17100c' : '#a63f24');
    $$('[data-theme-toggle]').forEach(function (b) {
      var label = theme === 'dark' ? t('ui.switchLight') : t('ui.switchDark');
      b.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
      b.setAttribute('aria-label', label);
      b.setAttribute('title', label);
    });
  }
  $$('[data-theme-toggle]').forEach(function (b) {
    b.addEventListener('click', function () {
      var next = doc.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
      store(KEY_THEME, next);
      applyTheme(next);
    });
  });
  if (window.matchMedia) {
    var mq = matchMedia('(prefers-color-scheme: dark)');
    var onScheme = function (e) { if (!store(KEY_THEME)) applyTheme(e.matches ? 'dark' : 'light'); };
    if (mq.addEventListener) mq.addEventListener('change', onScheme); else if (mq.addListener) mq.addListener(onScheme);
  }

  /* ---- Direction: LTR and RTL layout toggle ------------------------------- */
  function applyDir(dir) {
    var rtl = dir === 'rtl' || dir === 'ar' || dir === 'he';
    var current = rtl ? 'rtl' : 'ltr';
    var next = rtl ? 'ltr' : 'rtl';
    doc.setAttribute('lang', 'en');
    doc.setAttribute('dir', current);
    var link = document.getElementById('bs-css');
    var want = BS_CSS + (rtl ? '.rtl' : '') + '.min.css';
    if (link && link.getAttribute('href') !== want) link.setAttribute('href', want);
    $$('[data-dir-code]').forEach(function (c) { c.textContent = current.toUpperCase(); });
    var currentLabel = rtl ? 'Right-to-left (RTL)' : 'Left-to-right (LTR)';
    var nextLabel = rtl ? 'Left-to-right (LTR)' : 'Right-to-left (RTL)';
    $$('[data-dir-toggle]').forEach(function (b) {
      b.setAttribute('aria-label', 'Text direction: ' + currentLabel + '. Switch to ' + nextLabel);
      b.setAttribute('title', 'Switch to ' + nextLabel);
    });
    applyTheme(doc.getAttribute('data-bs-theme') || 'light');
    document.dispatchEvent(new CustomEvent('hh:lang', { detail: { lang: 'en', dir: current } }));
  }
  var startDir = store(KEY_DIR) || 'ltr';
  applyDir(startDir);
  $$('[data-dir-toggle]').forEach(function (b) {
    b.addEventListener('click', function () {
      var isRtl = doc.getAttribute('dir') === 'rtl';
      var next = isRtl ? 'ltr' : 'rtl';
      store(KEY_DIR, next);
      applyDir(next);
    });
  });

  /* ---- Header: shadow on scroll, Escape closes the mobile menu ----------- */
  var header = $('.site-header');
  var nav = document.getElementById('mainNav');
  function onScrollHeader() { if (header) header.classList.toggle('is-scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScrollHeader, { passive: true });
  onScrollHeader();
  function closeMenu(focusToggler) {
    if (!nav || !nav.classList.contains('show') || !window.bootstrap) return;
    bootstrap.Collapse.getOrCreateInstance(nav, { toggle: false }).hide();
    var tg = $('[data-bs-toggle="collapse"][aria-controls="mainNav"]');
    if (focusToggler && tg) tg.focus();
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav && nav.classList.contains('show')) {
      var openDrop = nav.querySelector('.dropdown-menu.show');
      if (!openDrop) closeMenu(true);
    }
  });
  if (nav) nav.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (a && a.getAttribute('href').indexOf('#') > -1 && a.pathname === location.pathname) closeMenu(false);
  });

  /* ---- Year, scroll reveal, count-up ------------------------------------- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  if ('IntersectionObserver' in window && !reduceMotion) {
    doc.classList.add('js-reveal');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    $$('[data-reveal]').forEach(function (el) { io.observe(el); });
    /* Safety net: never leave content hidden (print, anchor jumps, observer quirks) */
    setTimeout(function () { $$('[data-reveal]:not(.is-visible)').forEach(function (el) { el.classList.add('is-visible'); }); }, 3500);
    window.addEventListener('beforeprint', function () { $$('[data-reveal]').forEach(function (el) { el.classList.add('is-visible'); }); });
  }

  function runCount(el) {
    var end = parseFloat(el.getAttribute('data-count-up')) || 0;
    var pre = el.getAttribute('data-prefix') || '', suf = el.getAttribute('data-suffix') || '';
    var dec = parseInt(el.getAttribute('data-decimals') || (String(end).split('.')[1] || '').length, 10);
    function fmt(v) { return pre + v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf; }
    if (reduceMotion) { el.textContent = fmt(end); return; }
    var t0 = null;
    function tick(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min((ts - t0) / 1400, 1);
      el.textContent = fmt(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { runCount(e.target); cio.unobserve(e.target); } });
    }, { threshold: 0.5 });
    $$('[data-count-up]').forEach(function (el) { cio.observe(el); });
  }

  /* ---- Filter groups + search -------------------------------------------- */
  $$('[data-filter-group]').forEach(function (group) {
    var name = group.getAttribute('data-filter-group');
    var items = $$('[data-filter-item="' + name + '"]');
    var search = $('[data-filter-search="' + name + '"]');
    var count = $('[data-filter-count="' + name + '"]');
    var empty = $('[data-filter-empty="' + name + '"]');
    var panes = $('[data-filter-panes="' + name + '"]');
    var chips = $$('[data-filter]', group);
    var active = 'all';
    var params = new URLSearchParams(window.location.search);
    var initialQuery = params.get('q') || '';
    var initialCategory = params.get('category') || 'all';
    if (search) search.value = initialQuery;
    if (count) { count.setAttribute('role', 'status'); count.setAttribute('aria-live', 'polite'); count.setAttribute('aria-atomic', 'true'); }
    function run() {
      var q = search ? search.value.trim().toLowerCase() : '';
      var shown = 0;
      items.forEach(function (it) {
        var cats = (it.getAttribute('data-category') || '').split(/\s+/);
        var okCat = active === 'all' || cats.indexOf(active) > -1;
        var hay = ((it.getAttribute('data-search') || '') + ' ' + it.textContent).toLowerCase();
        var ok = okCat && (!q || hay.indexOf(q) > -1);
        it.hidden = !ok;
        if (ok) shown++;
      });
      if (panes) {
        var filtering = active !== 'all' || !!q;
        panes.classList.toggle('is-filtering', filtering);
        $$('.tab-pane', panes).forEach(function (p) {
          var any = $$('[data-filter-item="' + name + '"]', p).some(function (i) { return !i.hidden; });
          p.classList.toggle('pane-empty', !any);
        });
      }
      if (count) count.textContent = shown + ' ' + (shown === 1 ? t('ui.result') : t('ui.results'));
      if (empty) empty.hidden = shown !== 0;
    }
    function setChip(btn) {
      active = btn ? btn.getAttribute('data-filter') : 'all';
      chips.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-filter') === active ? 'true' : 'false'); });
      run();
    }
    chips.forEach(function (btn) {
      if (btn.tagName === 'BUTTON' && !btn.getAttribute('type')) btn.setAttribute('type', 'button');
      btn.addEventListener('click', function () { setChip(btn); });
    });
    if (search) {
      search.addEventListener('input', run);
      if (search.form) search.form.addEventListener('submit', function (e) { e.preventDefault(); run(); });
    }
    $$('[data-filter-reset="' + name + '"]').forEach(function (b) {
      b.addEventListener('click', function () { if (search) search.value = ''; setChip(null); if (search) search.focus(); });
    });
    /* picking a category tab while a filter/search is active returns to normal tab browsing */
    if (panes) {
      $$('[data-bs-toggle="tab"]').forEach(function (tab) {
        var target = tab.getAttribute('data-bs-target');
        var pane = target && target.charAt(0) === '#' ? document.getElementById(target.slice(1)) : null;
        if (!pane || !panes.contains(pane)) return;
        tab.addEventListener('click', function () {
          if (!panes.classList.contains('is-filtering')) return;
          if (search) search.value = '';
          setChip(null);
        });
      });
    }
    document.addEventListener('hh:lang', run);
    setChip(chips.filter(function (b) { return b.getAttribute('data-filter') === initialCategory; })[0] ||
      chips.filter(function (b) { return b.getAttribute('data-filter') === 'all'; })[0] || null);
  });

  /* ---- Tabs: open the tab named in the URL hash -------------------------- */
  if (location.hash && window.bootstrap) {
    try {
      var trg = $('[data-bs-toggle="tab"][data-bs-target="' + location.hash + '"], [data-bs-toggle="tab"][href="' + location.hash + '"]');
      if (trg) bootstrap.Tab.getOrCreateInstance(trg).show();
    } catch (e) { /* invalid selector in hash */ }
  }

  /* ---- Opening hours: highlight today ------------------------------------ */
  var today = new Date().getDay();
  $$('[data-hours-row]').forEach(function (row) {
    var days = row.getAttribute('data-hours-row').split(/[\s,]+/).map(Number);
    if (days.indexOf(today) < 0) return;
    row.classList.add('is-today');
    row.setAttribute('aria-current', 'date');
    var cell = row.firstElementChild;
    if (cell && !$('.today-flag', row)) {
      var b = document.createElement('span');
      b.className = 'badge-soft today-flag';
      b.setAttribute('data-i18n', 'ui.today');
      b.setAttribute('data-i18n-en', 'Today');
      b.textContent = t('ui.today');
      cell.appendChild(b);
    }
  });

  /* ---- Date fields: min = today ----------------------------------------- */
  function isoDate(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  $$('input[type="date"][data-min-today]').forEach(function (inp) {
    var now = new Date();
    inp.min = isoDate(now);
    var maxDays = parseInt(inp.getAttribute('data-max-days') || '0', 10);
    if (maxDays) { var m = new Date(now); m.setDate(m.getDate() + maxDays); inp.max = isoDate(m); }
  });

  /* ---- Time slots generated from opening hours --------------------------- */
  var DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  var DEFAULT_HOURS = 'mon-thu 11:30-21:30; fri-sat 11:30-22:30; sun 11:00-21:00';
  function parseHours(spec) {
    var map = {};
    spec.split(';').forEach(function (part) {
      var m = part.trim().match(/^([a-z]{3})(?:-([a-z]{3}))?\s+(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/i);
      if (!m) return;
      var a = DAY_KEYS.indexOf(m[1].toLowerCase()), b = m[2] ? DAY_KEYS.indexOf(m[2].toLowerCase()) : a;
      if (a < 0 || b < 0) return;
      for (var d = a; ; d = (d + 1) % 7) {
        map[d] = [(+m[3]) * 60 + (+m[4]), (+m[5]) * 60 + (+m[6])];
        if (d === b) break;
      }
    });
    return map;
  }
  function fmtTime(mins) {
    var h = Math.floor(mins / 60), mm = mins % 60, ap = h >= 12 ? 'pm' : 'am', h12 = h % 12 || 12;
    return h12 + ':' + String(mm).padStart(2, '0') + ' ' + ap;
  }
  function placeholderOption(sel, text) {
    sel.innerHTML = '';
    var o = document.createElement('option');
    o.value = ''; o.textContent = text;
    sel.appendChild(o);
  }
  $$('select[data-time-slots]').forEach(function (sel) {
    var dateInput = $(sel.getAttribute('data-date-input') || 'input[type="date"]', sel.form || document);
    var hours = parseHours(sel.getAttribute('data-hours') || DEFAULT_HOURS);
    var last = parseInt(sel.getAttribute('data-last-seating') || '30', 10);
    var step = parseInt(sel.getAttribute('data-slot-step') || '30', 10);
    function build() {
      var keep = sel.value;
      var v = dateInput && dateInput.value;
      if (!v) { placeholderOption(sel, t('ui.chooseDate')); return; }
      var parts = v.split('-'), day = new Date(+parts[0], +parts[1] - 1, +parts[2]);
      var span = hours[day.getDay()];
      placeholderOption(sel, t('ui.chooseTime'));
      if (!span) return;
      var now = new Date(), isToday = isoDate(now) === v;
      var earliest = isToday ? now.getHours() * 60 + now.getMinutes() + 30 : 0;
      var groups = {}, count = 0;
      for (var m = span[0]; m <= span[1] - last; m += step) {
        if (m < earliest) continue;
        var g = m < 15 * 60 ? 'ui.lunch' : m < 17 * 60 ? 'ui.afternoon' : 'ui.dinner';
        if (!groups[g]) { groups[g] = document.createElement('optgroup'); groups[g].label = t(g); sel.appendChild(groups[g]); }
        var o = document.createElement('option');
        o.value = String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
        o.textContent = fmtTime(m);
        groups[g].appendChild(o);
        count++;
      }
      if (!count) placeholderOption(sel, t('ui.noSlots'));
      if (keep && $('option[value="' + keep + '"]', sel)) sel.value = keep;
    }
    if (dateInput) { dateInput.addEventListener('change', build); dateInput.addEventListener('input', build); }
    sel._hhBuild = build;
    document.addEventListener('hh:lang', build);
    build();
  });

  /* ---- Steppers (guests 1–30) ------------------------------------------- */
  $$('[data-stepper]').forEach(function (wrap) {
    var input = $('input[type="number"]', wrap);
    if (!input) return;
    var min = parseInt(input.min || '1', 10), max = parseInt(input.max || '99', 10);
    var btns = $$('[data-step]', wrap);
    function sync() {
      var v = parseInt(input.value, 10);
      btns.forEach(function (b) {
        var s = parseInt(b.getAttribute('data-step'), 10);
        b.disabled = isNaN(v) ? false : (s < 0 ? v <= min : v >= max);
      });
    }
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        var v = parseInt(input.value, 10);
        if (isNaN(v)) v = min;
        else v =Math.min(max, Math.max(min, v + parseInt(b.getAttribute('data-step'), 10)));
        input.value = v;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
    input.addEventListener('input', sync);
    input._hhSync = sync;
    sync();
  });

  /* ---- Demo toasts on buttons/links -------------------------------------- */
  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('[data-demo-toast]') : null;
    if (!el) return;
    e.preventDefault();
    toast(el.getAttribute('data-demo-toast'), 'info');
  });

  /* ---- Demo forms: validation, error summary, success -------------------- */
  function controls(form) {
    return $$('input, select, textarea', form).filter(function (el) {
      return el.willValidate && ['hidden', 'submit', 'button', 'reset'].indexOf(el.type) < 0;
    });
  }
  function wrapOf(el) { return el.closest('.hh-field') || el.parentElement; }
  function feedbackOf(el) {
    var w = wrapOf(el), fb = w && $('.invalid-feedback', w);
    if (fb && !fb.hasAttribute('data-default')) fb.setAttribute('data-default', fb.textContent.trim());
    return fb;
  }
  function messageFor(el) {
    var v = el.validity, fb = feedbackOf(el);
    var msg = v.valueMissing ? el.getAttribute('data-msg-missing')
      : v.typeMismatch ? el.getAttribute('data-msg-type')
      : (v.rangeUnderflow || v.rangeOverflow || v.stepMismatch || v.tooShort || v.tooLong) ? (el.getAttribute('data-msg-range') || el.getAttribute('data-msg-pattern'))
      : v.patternMismatch ? el.getAttribute('data-msg-pattern') : null;
    return msg || (fb && fb.getAttribute('data-default')) || el.validationMessage;
  }
  function labelFor(el) {
    var w = wrapOf(el);
    var lab = (el.id && $('label[for="' + el.id + '"]')) || (w && $('legend', w)) || el.closest('label');
    var txt = lab ? lab.textContent : (el.getAttribute('aria-label') || el.name || '');
    return txt.replace(/\*|\(required\)|\(optional\)/gi, '').replace(/\s+/g, ' ').trim();
  }
  function describe(el, fbId, on) {
    var ids = (el.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean).filter(function (i) { return i !== fbId; });
    if (on) ids.push(fbId);
    if (ids.length) el.setAttribute('aria-describedby', ids.join(' ')); else el.removeAttribute('aria-describedby');
  }
  function check(el) {
    var group = el.type === 'radio' && el.name ? $$('input[type="radio"][name="' + el.name + '"]', el.form) : [el];
    var ok = el.checkValidity();
    var filled = el.type === 'checkbox' || el.type === 'radio' ? group.some(function (r) { return r.checked; }) : el.value.trim() !== '';
    var fb = feedbackOf(el);
    if (fb) { ensureId(fb, 'fb'); if (!ok) fb.textContent = messageFor(el); }
    group.forEach(function (g) {
      g.classList.toggle('is-invalid', !ok);
      g.classList.toggle('is-valid', ok && filled && g.type !== 'radio');
      g.setAttribute('aria-invalid', ok ? 'false' : 'true');
      if (fb) describe(g, fb.id, !ok);
    });
    var w = wrapOf(el);
    if (w) { w.classList.toggle('has-error', !ok); w.classList.toggle('has-success', ok && filled); }
    return ok;
  }
  function clearStates(form) {
    controls(form).forEach(function (el) {
      el.classList.remove('is-valid', 'is-invalid');
      el.removeAttribute('aria-invalid');
      var fb = feedbackOf(el); if (fb && fb.id) describe(el, fb.id, false);
      var w = wrapOf(el); if (w) w.classList.remove('has-error', 'has-success');
    });
    form.classList.remove('was-validated');
  }
  function fillSummary(form, bad) {
    var box = $('[data-error-summary]', form);
    if (!box) return null;
    var list = $('ul', box) || box.appendChild(document.createElement('ul'));
    list.innerHTML = '';
    var seen = {};
    bad.forEach(function (el) {
      var key = el.type === 'radio' ? 'r:' + el.name : el.id || el.name;
      if (seen[key]) return; seen[key] = 1;
      var li = document.createElement('li'), a = document.createElement('a');
      a.href = '#' + ensureId(el, 'field');
      a.textContent = labelFor(el) + ': ' + messageFor(el);
      a.addEventListener('click', function (e) { e.preventDefault(); el.focus(); el.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' }); });
      li.appendChild(a); list.appendChild(li);
    });
    $$('[data-error-count]', box).forEach(function (c) { c.textContent = list.children.length; });
    box.hidden = list.children.length === 0;
    if (!box.hasAttribute('tabindex')) box.setAttribute('tabindex', '-1');
    return box;
  }
  $$('form[data-demo-form]').forEach(function (form) {
    form.setAttribute('novalidate', '');
    var summary = $('[data-error-summary]', form);
    var success = form.getAttribute('data-success') ? $(form.getAttribute('data-success')) : null;
    /* Limit phone inputs with digit patterns to numeric characters and max length */
    $$('input[type="tel"][pattern*="0-9"]', form).forEach(function (input) {
      input.addEventListener('input', function () {
        var max = parseInt(input.getAttribute('maxlength'), 10) || 10;
        input.value = input.value.replace(/\D/g, '').slice(0, max);
      });
    });
    /* Live validation: on blur once touched, and while typing once a field is invalid */
    form.addEventListener('focusout', function (e) {
      var el = e.target;
      if (!el.willValidate || controls(form).indexOf(el) < 0) return;
      if (el.value !== '' || el.classList.contains('is-invalid') || form.classList.contains('was-validated')) check(el);
      if (summary && !summary.hidden) fillSummary(form, controls(form).filter(function (c) { return !c.checkValidity(); }));
    });
    form.addEventListener('input', function (e) { if (e.target.classList && e.target.classList.contains('is-invalid')) check(e.target); });
    form.addEventListener('change', function (e) { if (e.target.type === 'checkbox' || e.target.type === 'radio' || e.target.tagName === 'SELECT') { if (form.classList.contains('was-validated') || e.target.classList.contains('is-invalid')) check(e.target); } });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      form.classList.add('was-validated');
      var bad = controls(form).filter(function (el) { return !check(el); });
      if (bad.length) {
        var box = fillSummary(form, bad);
        if (box) box.focus(); else bad[0].focus();
        if (!box) toast(t('ui.fixErrors'), 'error');
        return;
      }
      if (summary) summary.hidden = true;
      /* Echo submitted values into the success panel */
      if (success) {
        $$('[data-echo]', success).forEach(function (out) {
          var f = form.elements[out.getAttribute('data-echo')];
          if (!f) return;
          var val = f.tagName === 'SELECT' ? (f.options[f.selectedIndex] || {}).text : f.value;
          if (f.type === 'date' && f.value) {
            var p = f.value.split('-');
            val = new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString(lang() === 'en' ? 'en-GB' : lang(), { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
          }
          out.textContent = val || '—';
        });
      }
      toast(form.getAttribute('data-demo-message') || t('ui.demoSent'));
      var modalEl = form.closest('.modal');
      if (modalEl && window.bootstrap) bootstrap.Modal.getOrCreateInstance(modalEl).hide();
      var go = form.getAttribute('data-redirect');
      if (go) { setTimeout(function () { location.href = go; }, 900); return; }
      form.reset();
      clearStates(form);
      $$('select[data-time-slots]', form).forEach(function (s) { if (s._hhBuild) s._hhBuild(); });
      $$('[data-stepper] input', form).forEach(function (i) { if (i._hhSync) i._hhSync(); });
      if (success) {
        success.hidden = false;
        if (form.hasAttribute('data-hide-on-success')) form.hidden = true;
        if (!success.hasAttribute('tabindex')) success.setAttribute('tabindex', '-1');
        success.focus();
      }
    });
    if (success) $$('[data-form-again]', success).forEach(function (b) {
      b.addEventListener('click', function () {
        success.hidden = true; form.hidden = false;
        var first = controls(form)[0]; if (first) first.focus();
      });
    });
  });

  /* ---- Back to top -------------------------------------------------------- */
  $$('[data-back-to-top]').forEach(function (btn) {
    function vis() { btn.classList.toggle('show', window.scrollY > 700); }
    window.addEventListener('scroll', vis, { passive: true }); vis();
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      var skip = document.getElementById('main'); if (skip) { skip.setAttribute('tabindex', '-1'); skip.focus({ preventScroll: true }); }
    });
  });
})();
