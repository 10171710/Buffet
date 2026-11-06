# Hearth & Harvest — Buffet & Family Restaurant · HTML Template

A warm, spacious, responsive restaurant template built on **Bootstrap 5.3**: 9 pages, light/dark themes, and an
English → Arabic → Hebrew switch that mirrors the whole layout (RTL). No admin dashboard and no build step — the
template ships with real, unique Pexels food photography and a photo hero on every page (see `docs/IMAGE-CREDITS.md`).

> **Front-end demo.** The reservation form, newsletter, search and comment forms validate and show a confirmation,
> but **nothing is sent or stored**. Connect your own booking system or form backend before launch (see "Forms").

## Quick start

```bash
cd hearth-harvest-template
python -m http.server 8852
# open http://localhost:8852
```
Any static server works. You need an internet connection for the CDN files listed under *Dependencies*
(or self-host them — see below).

## Pages

| File | Page |
|---|---|
| `index.html` | **Home 1** — buffet highlights, live stations, dining experience, popular dishes, pricing teaser, family offer, reviews, reservation path |
| `home-2.html` | **Home 2** — editorial dark layout: seasonal story, chef's table & private dining, family hall, a day at the restaurant |
| `about.html` | Story, mission, history timeline, team, community, reviews |
| `menu.html` | **Menu & Pricing** — buffet price table, live stations, category tabs, search + dietary filters |
| `family-packages.html` | Family & group packages, comparison table, add-ons, FAQ |
| `blog.html` | Searchable, filterable article listing |
| `blog-details.html` | Full article with sidebar |
| `contact.html` | Contact details, hours, map placeholder, **table-reservation form** (`#reservation`) |
| `404.html` | Branded not-found page |

Navigation: **Home ▾ (Home 1 · Home 2)**, About, Menu & Pricing, Family Packages, Blog, Contact, theme icon, RTL icon and one
**Reserve a Table** button.

## Folder structure

```
hearth-harvest-template/
├── index.html · home-2.html · about.html · menu.html · family-packages.html
├── blog.html · blog-details.html · contact.html · 404.html
├── blog-*.html            9 individual article pages (matching blog cards)
├── assets/
│   ├── css/style.css     tokens (light + dark), components, utilities — numbered, commented sections
│   ├── img/              real photos: 59 content images + 18 page hero backgrounds (all unique)
│   └── js/main.js        all behaviour, switched on by data-* attributes (contract in the file header)
└── docs/
    ├── DESIGN_SYSTEM.md  class inventory, markup patterns, rules for adding pages
    ├── IMAGE-CREDITS.md  subject and Pexels source link for every image in assets/img/
    ├── sync-partials.py  re-applies shared head / header / footer / scripts to every page
    ├── contract-check.js browser test: layout, accessibility, RTL, contrast (hhCheck / hhContrast)
    └── partials/         head · header · footer · scripts
```

## Customising

| I want to… | Do this |
|---|---|
| Change colours, fonts, radius | Edit the `--hh-*` variables at the top of `assets/css/style.css` (light block and dark block). Fonts are loaded in `docs/partials/head.html`. |
| Rename the restaurant, address, hours, phone | Edit `docs/partials/header.html`, `footer.html`, `head.html`, then run `python docs/sync-partials.py`. Page copy is plain HTML — search and replace. |
| Swap a photo | Every photo is a `.ph` block with `role="img"` and an `aria-label`, plus an `<img class="ph-img">` inside. Replace the `src` with your own file in `assets/img/`; keep `alt=""` and update the wrapper's `aria-label` so the accessible name still describes the photo. |
| Change a hero background | Each page's hero has its own class (`hero-index`, `hero-home2`, `hero-about`, `hero-menu`, `hero-packages`, `hero-blog`, `hero-blog-details`, `hero-contact`, `hero-404`, plus `hero-blog-<slug>` for each article). Point its `--hero-img: url("../img/hero-*.jpg")` in `assets/css/style.css` at a new 1920 px photo. |
| Change the logo | The mark is an inline SVG in `header.html` and `footer.html`; replace it with an `<img>` or your own SVG. |
| Edit navigation | `docs/partials/header.html`; add new page keys in `docs/sync-partials.py` (`NAV_HREF`). Then re-sync. |
| Set canonical URL / social card | `docs/partials/head.html` (`https://www.example.com/…`) and add `assets/img/social-card.jpg` (1200×630). |
| Add a map | In `contact.html` replace the map placeholder with your embed (a commented iframe shows where). |
| Change opening hours / booking slots | Hours table markup in `contact.html` and `home-2.html`; time-slot hours are read from `data-*` attributes on the reservation form — see `main.js` header. |
| Add Arabic / Hebrew copy | Header, footer and UI strings live in the `I18N` table in `assets/js/main.js`; add keys and `data-i18n="key"` to any element. The layout already mirrors. |
| Hook up forms | Every form is `<form data-demo-form>`. Remove that attribute, set `action`/`method` (or your fetch handler) and keep the validation markup. |

Shared page chrome is copied into each page between `<!-- @head -->`, `@header`, `@footer` and `@scripts` markers.
Edit a partial, then `python docs/sync-partials.py` (Python 3, no packages) refreshes every page.

## Features

- **Themes & direction:** light/dark (respects the OS setting on first visit) and EN → AR → HE; choices persist in `localStorage` (`hh-theme`, `hh-dir`) and apply before first paint. RTL swaps in Bootstrap's RTL stylesheet.
- **Accessibility:** skip link, semantic landmarks, one `h1` per page, visible focus rings, keyboard-operable menu, tabs, accordions and forms, labelled fields with inline and summary error messages, status never shown by colour alone, reduced-motion respected, WCAG AA contrast measured in both themes.
- **SEO:** unique titles and descriptions, canonical, Open Graph and Twitter tags, JSON-LD (`Restaurant`, `BreadcrumbList`, `Article`, `Menu`), `noindex` on 404.
- **Reservation form:** date limited to the next 90 days, time slots follow each weekday's opening hours, guest stepper (1–30), clear valid/invalid states, error summary and success panel.
- **Mobile-first:** collapsing navigation with the theme/RTL icons always visible and a single reservation button.

## Dependencies (CDN, no npm)

| Library | Version | Purpose |
|---|---|---|
| [Bootstrap](https://getbootstrap.com) CSS, RTL CSS and JS bundle | 5.3.3 | grid, components, tabs, collapse, accordion, modals |
| [Bootstrap Icons](https://icons.getbootstrap.com) | 1.11.3 | icon font |
| [Google Fonts](https://fonts.google.com) | — | Fraunces, DM Sans, Noto Sans Arabic, Noto Sans Hebrew |

To self-host, download these into `assets/vendor/` and update `docs/partials/head.html`, `docs/partials/scripts.html`
and the `BS_CSS` constant near the top of `assets/js/main.js`.

## Testing

Serve the folder, open any page and paste `docs/contract-check.js` into the console. Run `await hhCheck()` (layout,
accessibility, RTL, links, header contract) and `await hhContrast()` (WCAG contrast in light and dark). Both take about
a minute for all pages; if your console times out, start them without `await` and read the returned value afterwards.

## Browser support
Current Chrome, Edge, Firefox and Safari.

## Licence & credits
Template code © Hearth & Harvest demo brand. Bootstrap and Bootstrap Icons are MIT-licensed; Google Fonts are OFL.
Photos come from [Pexels](https://www.pexels.com) under the [Pexels licence](https://www.pexels.com/licence/) — see
`docs/IMAGE-CREDITS.md` for every source link. All names, addresses, prices, reviews and articles are fictional sample content.
