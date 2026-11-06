# Hearth & Harvest — Design System & Page Build Brief

You are writing ONE OR MORE PAGES of a commercial HTML template for a buffet & family restaurant.
**File writes inside `C:\Claude\hearth-harvest-template\` are pre-authorised for your assigned pages only.**
Do not edit `assets/`, `docs/partials/`, `docs/*.py|js` or other workers' pages — if a class is missing, report it; do not invent CSS.

- **Canonical facts** (address, hours, prices, menu, packages, team, history, guests, dates): `docs/BRIEF.md`. Copy them exactly.
- **Reference page:** `index.html`. Open it, copy its patterns and markup density.
- **Stack:** Bootstrap 5.3.3 (CDN, LTR + RTL build swapped at runtime) + Bootstrap Icons 1.11.3 + `assets/css/style.css` + `assets/js/main.js`. No build step, no jQuery, **zero image files**.
- Everything is a FRONT-END DEMO. Never imply real bookings, payments or emails.

---

## 1. Page skeleton (every page)

```html
<!doctype html>
<html lang="en" dir="ltr">
<head>
<!-- @head {"title": "About Us | Hearth & Harvest", "description": "120–160 characters…", "file": "about.html", "schema": ["breadcrumb"], "crumb": "About"} -->
<!-- @head:end -->
</head>
<body>
<!-- @header {"nav": "about"} -->
<!-- @header:end -->

<main id="main">
  … sections …
</main>

<!-- @footer -->
<!-- @footer:end -->
<!-- @scripts -->
<!-- @scripts:end -->
</body>
</html>
```
Then run **only on your files**: `python docs/sync-partials.py about.html` — it fills the four regions.

| File | `nav` | `schema` | extra head keys |
|---|---|---|---|
| index.html (done) | home1 | `["restaurant"]` | — |
| home-2.html | home2 | `["restaurant"]` | — |
| about.html | about | `["breadcrumb"]` | `"crumb": "About"` |
| menu.html | menu | `["breadcrumb"]` (+ optional raw `ItemList` object) | `"crumb": "Menu & Pricing"` |
| family-packages.html | packages | `["breadcrumb"]` | `"crumb": "Family Packages"` |
| blog.html | blog | `["breadcrumb"]` | `"crumb": "Blog"` |
| blog-details.html | blog | `["breadcrumb", {raw Article object}]` | `"crumbs": [["Blog","blog.html"],["How we plan a buffet…","blog-details.html"]]` |
| contact.html | contact | `["restaurant", "breadcrumb"]` | `"crumb": "Contact"` |
| 404.html | none | — | `"robots": "noindex"` |

- **Title ≤ 60 chars** ending `| Hearth & Harvest`. **Description 120–160 chars.** Count them.
- Raw JSON-LD object example (Article): `{"@context":"https://schema.org","@type":"Article","headline":"…","author":{"@type":"Person","name":"Marco Bellini"},"datePublished":"2026-10-28","publisher":{"@type":"Organization","name":"Hearth & Harvest"}}`
- Never write inside the marker regions by hand; never add `<script>` or `<style>` blocks.

## 2. Hard rules (the checker fails on every one of these)

1. **Zero `style="…"` attributes.** Use utilities (§6). Avatars use colour classes, not inline vars.
2. **No `href="#"`.** Links go to real pages from the page list, real in-page ids, `tel:`/`mailto:`, or are `<button>`s. Placeholder actions: `<a href="contact.html" data-demo-toast="…">` or `<button type="button" data-demo-toast="…">`.
3. **Exactly one `<h1>`**, headings never skip a level (h2 → h3 → h4) inside `<main>`.
4. **Every `<section>` in main has `aria-labelledby="<its heading id>"`** (or `aria-label` if it has no heading).
5. **Every `.ph` has `role="img"` + a descriptive `aria-label`** and an `<img class="ph-img" src="assets/img/…" alt="" loading="lazy" decoding="async">` (empty `alt` because the wrapper supplies the accessible name). The old decorative `<i class="bi …">` icon is removed when a photo is present; keep any `.ph-tag` badge.
6. **Only Bootstrap Icons that exist in 1.11.3.** (`bi-leaf` does NOT exist — use `bi-flower1`.) The checker verifies every icon has a glyph.
7. **Every form is `data-demo-form`**, every field has `<label for>`, every required field sits in a `.hh-field` with an `.invalid-feedback`, and a `.demo-note` is inside or right next to the form.
8. **No duplicate ids** (FAQ accordions especially: prefix ids per page, e.g. `faq-pk-1`).
9. **Internal links only to:** `index.html home-2.html about.html menu.html family-packages.html blog.html blog-details.html contact.html 404.html`. Fragment links must hit a real id. **Contract ids other pages link to:** `contact.html#reservation` (the reservation form section) and `menu.html#buffet-prices` (the buffet price table section). Create them.
10. **Logical utilities only** (`ms-/me-/ps-/pe-/text-start/text-end`) — never `ml-/mr-/left/right`.
11. Never add another `.btn-reserve`. In-page booking prompts use `btn btn-primary` / `btn-outline-primary` → `contact.html#reservation`.
12. Prices, phone numbers, times: wrap in `<span class="ltr-num">` so they stay LTR in Arabic/Hebrew.
13. Realistic restaurant content from BRIEF.md. No lorem ipsum, no invented prices, no dates that are not real 2026 weekdays.

## 3. Layout & section patterns

```html
<section class="section" aria-labelledby="x-title">          <!-- .section-alt = tinted, .section-sm = tighter -->
  <div class="container-xxl">
    <div class="section-head">                               <!-- centred intro; .text-start to left-align -->
      <p class="eyebrow">Small label</p>
      <h2 id="x-title" class="h-section">Main words <em>accent words</em></h2>
      <div class="ornament" aria-hidden="true"><span></span></div>   <!-- optional -->
      <p class="lead-lg">One or two sentences.</p>
    </div>
    <div class="row g-4"> <div class="col-md-6 col-xl-4" data-reveal>…</div> </div>
  </div>
</section>
```
- `.section-head-split` = title block left + `link-arrow` right (see index "The buffet").
- **Current-item rule:** the active breadcrumb item and the current pagination page both carry `aria-current="page"` (one per `<nav>` landmark; the header nav has its own).
- **Subpage hero** (every page except home/404). Add `hero-photo` plus the page's own class (`hero-about`, `hero-menu`, `hero-packages`, `hero-blog`, `hero-blog-details`, `hero-contact`, or `hero-blog-<slug>` for each article) so the CSS loads the matching `assets/img/hero-*.jpg`:
```html
<section class="page-hero hero-photo hero-about text-center" aria-labelledby="page-title">
  <div class="container-xxl">
    <nav aria-label="Breadcrumb"><ol class="breadcrumb"><li class="breadcrumb-item"><a href="index.html">Home</a></li><li class="breadcrumb-item active" aria-current="page">About</li></ol></nav>
    <p class="eyebrow">Since 2009</p>
    <h1 id="page-title" class="h-section">Our <em>story</em></h1>
    <p class="lead-lg mw-prose mb-0">…</p>
  </div>
</section>
```
  Home 1 uses `hero-home hero-photo hero-index`; Home 2 uses `hero-dark hero-photo hero-home2`; 404 uses `error-hero hero-photo hero-404`. Each `.hero-*` class only sets `--hero-img`; the shared `.hero-photo` rules add `cover`, the dark scrim and cream type (Home 1 keeps a theme-aware scrim so the dramatic light/dark look is preserved).
- **Dark band** (any full-width dark section): `<section class="section band-dark" data-bs-theme="dark" aria-labelledby="…">`. Everything inside automatically switches to the dark token set (cards, chips, forms, links stay readable in BOTH site themes). Home 2's hero: `<section class="hero-dark" data-bs-theme="dark" …>`.
- Grids: `row g-4` (or `g-5` for split content+media rows; it is capped on phones). `data-reveal` on grid columns / blocks below the fold, never on the hero. Stagger with `data-reveal="2"`, `"3"`.

## 4. Component inventory (all in style.css — markup snippets)

**Type:** `h-hero` (home only) · `h-section` · `h-card` · `lead-lg` · `eyebrow` (+`eyebrow-pill`) · `display-font` · `text-muted` · `meta`.

**Buttons:** `btn btn-primary | btn-outline-primary | btn-soft | btn-ghost` · on dark/colour: `btn-cream | btn-outline-cream` · sizes `btn-lg | btn-sm` · `link-arrow` (text link with `<i class="bi bi-arrow-right">`, mirrored in RTL automatically).

**Cards:** `hh-card` (padded, h-100) · `hh-card hh-card-flush` (media on top, then `.hh-card-body`) · `hh-card-hover` (lift) · `hh-card-tint`.
`icon-tile` (+ `sage | saffron | blue`, `round`, `lg`) · `badge-soft` (+ `sage | saffron | blue | neutral`) · status pill: `<span class="status status-ok">Open now</span>` (`ok | warn | bad | info | muted`; dot + text, never colour alone).

**Photo placeholders:**
```html
<div class="ph ph-grill ph-wide" role="img" aria-label="Lamb skewers on the charcoal grill">
  <i class="bi bi-fire" aria-hidden="true"></i><span class="ph-tag">Live station</span><span class="ph-caption">Optional caption</span>
</div>
```
Colourways: `ph-grill ph-carvery ph-tandoor ph-salad ph-pasta ph-wok ph-dessert ph-chocolate ph-drinks ph-lassi ph-brunch ph-bread ph-soup ph-curry ph-seafood ph-kids ph-cake ph-family-hall ph-patio ph-private ph-chef ph-team ph-night ph-market ph-spice`.
Shapes: `ph-wide` 16/9 · `ph-square` · `ph-tall` 4/5 · `ph-portrait` 3/4 · `ph-banner` 21/9 (16/9 on phones) · `ph-arch` (3/4 arched top) · `ph-fill` (fills parent height, min 16rem) · `ph-thumb` (4.5rem list thumbnail) · `ph-avatar` (3.5rem round person) · `ph-round`. Inside a flush card/station card the `.ph` corners are squared automatically.

**People:** `<span class="avatar avatar-sage" aria-hidden="true">PR</span>` — colours `avatar` (terracotta default) `avatar-sage avatar-saffron avatar-plum avatar-teal avatar-cocoa`, size `avatar-lg`. Wrap with `.person`:
```html
<figcaption class="person"><span class="avatar avatar-teal" aria-hidden="true">LH</span><span><strong>Layla Haddad</strong><span>Weekly regular</span></span></figcaption>
```

**Menu item row (dotted leader + price + dietary chips):**
```html
<ul class="menu-list cols-2">            <!-- cols-2 = two columns from lg -->
  <li class="menu-item" data-filter-item="menu" data-category="v gf">
    <div class="menu-item-head"><h3 class="menu-item-name">Burrata &amp; Heirloom Tomato</h3><span class="menu-item-leader" aria-hidden="true"></span><span class="menu-item-price ltr-num">$12.50</span></div>
    <p class="menu-item-desc">Creamy burrata, heirloom tomatoes, basil oil.</p>
    <ul class="diet-list" aria-label="Dietary information">
      <li class="diet diet-v"><span aria-hidden="true">V</span><span class="diet-label">Vegetarian</span></li>
      <li class="diet diet-gf"><span aria-hidden="true">GF</span><span class="diet-label">Gluten-free</span></li>
    </ul>
  </li>
</ul>
```
Chips: `diet-v` Vegetarian · `diet-vg` Vegan · `diet-gf` Gluten-free · `diet-s` Spicy (flame icon added) · `diet-h` Halal option · `diet-n` Contains nuts. Labels are screen-reader-only by default; `.diet-list.full` shows them. Wrap a board in `.menu-board`. Optional thumbnail row: `li.menu-item.with-thumb` > `.ph.ph-thumb` + a div with the head/desc/chips. Badge next to a name: `<span class="badge-soft saffron">Chef’s pick</span>` inside the h3.
**Dietary key:** `<ul class="diet-legend" aria-label="Dietary key"><li><span class="diet diet-v" aria-hidden="true">V</span>Vegetarian</li>…</ul>`.

**Buffet station card:** see index (`article.station-card` > `.ph.ph-wide` + `.station-body` > `.station-num` (aria-hidden) + h3 + p + `ul.station-meta`).

**Buffet price table (stacks into labelled rows on phones — every `td` needs `data-label`):**
```html
<section class="section" id="buffet-prices" aria-labelledby="buffet-title"> …
<div class="price-table-wrap">
  <table class="price-table">
    <caption>Buffet prices per person. Under 4s eat free.</caption>
    <thead><tr><th scope="col">Session</th><th scope="col">Adult</th><th scope="col">Child <small>4–10</small></th><th scope="col">Under 4</th><th scope="col">Senior <small>65+</small></th></tr></thead>
    <tbody>
      <tr><th scope="row"><strong>Weekday Lunch</strong><span>Mon–Fri · <span class="ltr-num">11:30 am – 3 pm</span></span></th>
          <td data-label="Adult"><span class="amount ltr-num">$18.95</span></td><td data-label="Child 4–10"><span class="ltr-num">$9.50</span></td>
          <td data-label="Under 4"><span class="free">Free</span></td><td data-label="Senior 65+">10% off</td></tr>
      <tr class="is-featured">…Dinner…</tr>
    </tbody>
  </table>
</div>
```
**Session cards** (pricing teaser): `article.session-card` (+ `featured` with `<span class="flag">`) — see index.
**Package card:**
```html
<article class="package-card featured">
  <span class="flag"><i class="bi bi-star-fill" aria-hidden="true"></i>Most booked</span>
  <h3 class="h-card">Family Feast</h3>
  <p class="serves"><i class="bi bi-people" aria-hidden="true"></i>4 adults + 3 kids</p>
  <p class="price-amount"><span class="ltr-num">$129</span><small>per table</small></p>
  <ul class="check-list"><li>Buffet for seven, any session</li>…</ul>      <!-- .check-list.no for exclusions -->
  <a class="btn btn-primary" href="contact.html#reservation">Book the Family Feast</a>
</article>
```
Comparison table: `<div class="table-wrap"><table class="table compare-table"><caption class="visually-hidden">…</caption>…` with `<i class="bi bi-check-lg" aria-hidden="true"></i><span class="visually-hidden">Included</span>` / `bi-dash-lg` + "Not included". Add-ons: `.addon` > `icon-tile` + text + `.addon-price`. Home offer panel: `.offer-panel`, `.offer-mini`.

**Tabs (menu categories) — ARIA-correct, Bootstrap-driven:**
```html
<ul class="nav menu-tabs" role="tablist" aria-label="Menu categories">
  <li class="nav-item" role="presentation"><button class="nav-link active" id="tab-starters" data-bs-toggle="tab" data-bs-target="#pane-starters" type="button" role="tab" aria-controls="pane-starters" aria-selected="true">Starters <span class="count">5</span></button></li>
  <li class="nav-item" role="presentation"><button class="nav-link" id="tab-mains" data-bs-toggle="tab" data-bs-target="#pane-mains" type="button" role="tab" aria-controls="pane-mains" aria-selected="false" tabindex="-1">Mains <span class="count">5</span></button></li>
</ul>
<div class="tab-content" data-filter-panes="menu">
  <div class="tab-pane fade show active" id="pane-starters" role="tabpanel" aria-labelledby="tab-starters" tabindex="0">
    <h3 class="pane-title pane-title-sr">Starters</h3>          <!-- visible only while filtering -->
    <ul class="menu-list cols-2"> …menu-item rows with data-filter-item="menu"… </ul>
  </div>
</div>
```
Use the 8 category slugs from BRIEF (`starters soups-salads mains vegetarian pasta-rice desserts drinks kids`) for ids: `tab-<slug>` / `pane-<slug>`. `menu.html#pane-desserts` opens that tab.

**Filter + search (menu dietary filter, blog categories):**
```html
<div class="filter-panel">
  <div class="filter-bar" data-filter-group="menu" role="group" aria-label="Filter by dietary need">
    <button type="button" class="filter-chip" data-filter="all">All dishes</button>
    <button type="button" class="filter-chip" data-filter="vg">Vegan</button> …
  </div>
  <div class="search-field"><i class="bi bi-search" aria-hidden="true"></i>
    <label for="menu-search" class="visually-hidden">Search the menu</label>
    <input type="search" id="menu-search" class="form-control" placeholder="Search dishes" data-filter-search="menu"></div>
</div>
<p class="result-count" data-filter-count="menu">33 results</p>
… items with data-filter-item="menu" data-category="v gf" …
<div class="empty-state" data-filter-empty="menu" hidden><i class="bi bi-search" aria-hidden="true"></i><strong>No dishes match</strong><p>Try another word or filter.</p><button type="button" class="btn btn-soft btn-sm" data-filter-reset="menu">Clear filters</button></div>
```
Blog: same with `data-filter-group="blog"`, items are the post columns, categories `recipes kitchen family seasonal news`.

**Forms — reservation pattern with every state** (contact.html uses this; give the section `id="reservation"`):
```html
<div class="reserve-card">
  <form id="reservation-form" data-demo-form data-success="#reservation-done" data-hide-on-success data-demo-message="Reservation request received (demo only — nothing was sent)." aria-labelledby="res-form-title">
    <h3 id="res-form-title" class="h-card">Reserve a table</h3>
    <p class="text-muted fs-sm">Fields marked <span class="req" aria-hidden="true">*</span> are required.</p>
    <div class="error-summary" data-error-summary hidden aria-labelledby="res-errors">
      <h4 id="res-errors" class="h6"><i class="bi bi-exclamation-triangle-fill" aria-hidden="true"></i>Please fix <span data-error-count>0</span> field(s) to continue</h4>
      <ul></ul>
    </div>
    <div class="row g-3">
      <div class="col-sm-6 hh-field">                                   <!-- .hh-field wraps label+control+feedback -->
        <label class="form-label" for="res-date">Date <span class="req" aria-hidden="true">*</span><span class="visually-hidden">(required)</span></label>
        <div class="input-icon"><i class="bi bi-calendar3" aria-hidden="true"></i>
          <input class="form-control" type="date" id="res-date" name="date" required data-min-today data-max-days="90" data-msg-missing="Choose the date of your visit."></div>
        <div class="invalid-feedback">Choose the date of your visit.</div>
      </div>
      <div class="col-sm-6 hh-field">
        <label class="form-label" for="res-time">Time …</label>
        <div class="input-icon"><i class="bi bi-clock" aria-hidden="true"></i>
          <select class="form-select" id="res-time" name="time" required data-time-slots data-date-input="#res-date" data-hours="mon-thu 11:30-21:30; fri-sat 11:30-22:30; sun 11:00-21:00" data-last-seating="30"><option value="">Choose a date first</option></select></div>
        <div class="invalid-feedback">Choose an available time.</div>
      </div>
      <div class="col-sm-6 hh-field">
        <label class="form-label" for="res-guests">Guests …</label>
        <div class="stepper" data-stepper>
          <button type="button" data-step="-1" aria-label="One guest fewer"><i class="bi bi-dash-lg" aria-hidden="true"></i></button>
          <input class="form-control" type="number" id="res-guests" name="guests" min="1" max="30" value="2" required inputmode="numeric" data-msg-range="Online bookings are for 1 to 30 guests — call us for larger groups.">
          <button type="button" data-step="1" aria-label="One guest more"><i class="bi bi-plus-lg" aria-hidden="true"></i></button>
        </div>
        <div class="invalid-feedback">Online bookings are for 1 to 30 guests.</div>
      </div>
      <!-- text/email/tel: same pattern; optional .valid-feedback ("Looks good") after .invalid-feedback -->
      <!-- radio group: .hh-field > fieldset > legend + .choice tiles (required on the FIRST radio) ; .invalid-feedback after the fieldset -->
      <!-- checkbox consent: .hh-field > .form-check > input.form-check-input + label.form-check-label ; .invalid-feedback inside .hh-field -->
    </div>
    <button type="submit" class="btn btn-primary btn-lg mt-4">Request reservation</button>
    <p class="demo-note"><i class="bi bi-info-circle" aria-hidden="true"></i><span>Front-end demo — nothing is sent or saved.</span></p>
  </form>
  <div class="form-success" id="reservation-done" hidden>
    <span class="icon-tile lg round"><i class="bi bi-check-lg" aria-hidden="true"></i></span>
    <h3 class="h-card">Request received</h3>
    <dl><dt>Date</dt><dd data-echo="date">—</dd><dt>Time</dt><dd data-echo="time">—</dd><dt>Guests</dt><dd data-echo="guests">—</dd></dl>
    <button type="button" class="btn btn-ghost" data-form-again>Make another reservation</button>
  </div>
</div>
```
States produced by main.js (never hand-write them): `.is-invalid`/`.is-valid` on controls, `.has-error`/`.has-success` on `.hh-field`, `aria-invalid`, `aria-describedby` → feedback, error summary with links, success panel focus + toast, modal auto-close. Per-error messages: `data-msg-missing | data-msg-type | data-msg-range | data-msg-pattern`. Small forms (newsletter, enquiry) use the same `.hh-field` pattern without the summary; `.newsletter-inline` lays out input + button.
Choice tile: `<label class="choice"><input type="radio" name="seating" id="…" value="…"><span class="choice-body"><i class="bi bi-tree" aria-hidden="true"></i><span><strong>Garden patio</strong><small>Weather permitting</small></span></span></label>`.

**Accordion / FAQ:** Bootstrap accordion, ids prefixed per page:
```html
<div class="accordion" id="faq-contact">
  <div class="accordion-item"><h3 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq-c1" aria-expanded="false" aria-controls="faq-c1">Do you take walk-ins?</button></h3>
    <div id="faq-c1" class="accordion-collapse collapse" data-bs-parent="#faq-contact"><div class="accordion-body"><p>…</p></div></div></div>
</div>
```
(Heading level must follow the section's h2 → use h3.)

**Testimonial:** `figure.hh-card.quote-card` (+ `.large` for a featured quote) > `p.stars[role=img][aria-label="Rated 5 out of 5"]` (aria-hidden `bi-star-fill` icons) + `blockquote > p` + `figcaption.person`. Rating summary: `.rating-summary .big`, `.rating-bars` with `.bar-track > .bar-fill.w-pct-80`.
**Team card:** `article.hh-card.hh-card-flush.team-card` > `.ph.ph-team.ph-portrait` + `.hh-card-body` > h3 + `p.role` + p + `.social-mini` (buttons/links with aria-labels, `data-demo-toast`).
**Blog card:** `article.hh-card.hh-card-flush.hh-card-hover.blog-card` > `.ph.ph-wide` + `.hh-card-body` > `p.meta` (date `<time datetime="2026-10-28">28 Oct 2026</time>`, category, read time) + `h3 > a[href="blog-details.html"]` + p + `a.link-arrow` ("Read: <title>" — descriptive). Featured: add `.featured` (side-by-side from lg). Pagination: Bootstrap `.pagination` (current page `aria-current="page"`, other pages are `<button type="button" class="page-link" data-demo-toast="…">`).
**Article:** `.article` (+ `blockquote`, `figure > .ph + figcaption`), followed by a `section.mw-prose.mx-auto.mt-5` comment block (`.hh-card` > `form#comment-form[data-demo-form]` with name, email and comment fields), sidebar `.sidebar-widget`, `.tag` links, `.list-clean` (with `.ph-thumb`).
**Timeline:** `<ol class="timeline"><li><span class="year">2009</span><h3>Opened with 40 seats</h3><p>…</p></li>…</ol>`.
**Steps:** `<ol class="steps"><li class="step"><h3>…</h3><p>…</p></li></ol>` (auto-numbered 01, 02…). In a narrow column (e.g. beside a form) use `ol.steps.steps-stack` — one card per row with the number at the start edge.
**Stats:** `<ul class="stat-strip"><li class="stat"><span class="num"><span data-count-up="2900" data-suffix="+">2,900+</span></span><span class="lbl">reviews</span></li></ul>` — put the FINAL value in markup.
**Features:** `.feature-row` > `.icon-tile` + div > h3 + p.
**Hours table:**
```html
<table class="hours-table"><caption>Opening hours (kitchen closes 30 minutes earlier)</caption><tbody>
  <tr data-hours-row="1 2 3 4"><th scope="row">Monday – Thursday</th><td class="ltr-num">11:30 am – 9:30 pm</td></tr>
  <tr data-hours-row="5 6"><th scope="row">Friday – Saturday</th><td class="ltr-num">11:30 am – 10:30 pm</td></tr>
  <tr data-hours-row="0"><th scope="row">Sunday <small class="d-block text-muted">Brunch buffet 11–3</small></th><td class="ltr-num">11:00 am – 9:00 pm</td></tr>
</tbody></table><p class="hours-note"><i class="bi bi-info-circle" aria-hidden="true"></i>Kitchen closes 30 minutes before closing.</p>
```
(today's row is highlighted + "Today" badge by JS.)
**Map placeholder:** `<div class="map-ph" role="img" aria-label="Map showing Hearth & Harvest at 21 Orchard Lane, Maplewood, with free parking behind the building"><i class="bi bi-geo-alt-fill map-pin" aria-hidden="true"></i><div class="map-card"><strong>Hearth &amp; Harvest</strong><span class="ltr-num">21 Orchard Lane, Maplewood</span></div></div>`.
**Contact card:** `.hh-card.contact-card` > `.icon-tile` + div > h3 + p + link.
**Gallery strip:** `ul.gallery-strip > li(.g-wide|.g-tall) > .ph` (8 items fill 2 rows at 4 or 6 columns).
**CTA band:** `<section class="section-sm" aria-labelledby="cta-x"><div class="container-xxl"><div class="cta-band" data-bs-theme="dark">… h2 + p + .cta-actions with btn-cream / btn-outline-cream …</div></div></section>`. Forms may sit inside a `.cta-band`: it lifts the red/sage/primary tokens so labels, `.invalid-feedback`, `.valid-feedback` and links stay ≥ 4.5:1 on the terracotta.
**404:** `.error-hero` > `.error-code` (`4<span class="plate"><i class="bi bi-egg-fried" aria-hidden="true"></i></span>4` with `aria-label` on the wrapper or a visually-hidden "404") + h1 + `ul.error-links` (popular pages incl. `contact.html#reservation`).
**Empty state:** `.empty-state`. **Lists:** `check-list` (`.no`), `list-clean`.

## 5. JS hook contract (full documentation at the top of `assets/js/main.js`)
`data-theme-toggle` / `data-dir-toggle` (header — don't re-add) · `data-i18n` / `data-i18n-attr` · `data-reveal` · `data-count-up` (+`data-prefix data-suffix data-decimals`) · `data-year` · `data-filter-group | -item | -search | -count | -empty | -reset | -panes` · Bootstrap tabs (`data-bs-toggle="tab"`) · `form[data-demo-form]` (+ `data-demo-message data-success data-hide-on-success data-redirect`), `[data-error-summary]`, `[data-error-count]`, `[data-echo]`, `[data-form-again]`, `data-msg-*` · `input[type=date][data-min-today][data-max-days]` · `select[data-time-slots]` (+ `data-date-input data-hours data-last-seating data-slot-step`) · `[data-stepper]` + `[data-step]` · `[data-hours-row]` · `[data-demo-toast]` · `[data-back-to-top]` (footer). Escape closes the mobile menu.

## 6. Utilities (use instead of any inline style)
Max-widths `mw-xs 22rem · mw-sm 30rem · mw-form 36rem · mw-prose 42rem · mw-md 52rem · mw-lg 64rem` · widths `w-pct-0 … w-pct-100` in steps of 5 (progress/rating bars) · colour `text-primary-ink text-sage text-saffron-ink text-ink` · `bg-surface bg-surface-2` · `rounded-hh rounded-hh-lg shadow-hh` · `fs-xs fs-sm fs-lg fw-650 lh-tight text-balance nowrap min-w-0 flex-1 z-above gap-section sticky-aside` · `ltr-num` · plus all Bootstrap utilities. Exceptions that may need a style attribute: none — if you think you need one, report it instead.

## 7. Definition of done (per page)
No console errors · no horizontal scroll at 375 · 1280 fine · LTR + Arabic + Hebrew · light + dark · AA contrast measured · landmarks + one h1 + ordered headings + `aria-labelledby` on sections · keyboard-operable tabs/accordions/menus · status never colour-only · descriptive link text · real content from BRIEF.md.

## 8. Self-check — run these and paste the RAW output in your hand-back (no summaries)
1. `python docs/sync-partials.py <your pages>` — paste output.
2. `grep -c 'style=' <page>` (expect 0) and `grep -n 'href="#"' <page>` (expect nothing).
3. Preview server `hearth-static` (port 8852). In the page, run via the browser JS tool:
```js
await fetch('docs/contract-check.js?'+Date.now()).then(r=>r.text()).then(t=>(0,eval)(t));
JSON.stringify({check: await hhCheck(['your-page.html']), contrast: await hhContrast(['your-page.html'])}, null, 1)
```
   Paste the raw JSON. `fails` must be `[]`. `warns` about pages not built yet are acceptable; list them.
4. One screenshot at 375 (dark) and one at 1280 (light) — look at them; fix anything cramped or misaligned.
A worker reporting "all checks pass" without the raw output is not done.
