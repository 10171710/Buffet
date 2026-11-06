# Hearth & Harvest — Content & Build Brief (canonical facts used on every page)

Polished, responsive, commercial-grade HTML template (ThemeForest / TemplateMonster / client work) for a
**buffet and family restaurant**. Warm, welcoming, spacious. Front-end only, **no admin dashboard**.
Folder: `C:\Claude\hearth-harvest-template\` (+ `C:\Claude\hearth-harvest-template.zip` at the end).
Preview: add `hearth-static` (python http.server, **port 8852**, `--directory hearth-harvest-template`) to `C:\Claude\.claude\launch.json`.

## Stack (decided, approved by the user)
Bootstrap 5.3.3 via jsDelivr CDN (CSS + **RTL CSS build swapped at runtime** + JS bundle) + Bootstrap Icons 1.11.3 + Google Fonts
(display serif + clean sans + Noto Sans Arabic + Noto Sans Hebrew) + one hand-written `assets/css/style.css` + one vanilla
`assets/js/main.js`. No build step, no jQuery, no npm, **zero image files** (CSS gradient "photo" placeholders `.ph`, with
role="img" + descriptive aria-label so they double as alt text). Every external dependency is listed in the README.

## Pages (file names fixed)
| File | Nav key | Content |
|---|---|---|
| `index.html` | home1 | Home 1 — modern landing: hero with buffet promise, buffet highlights (live stations), the dining experience, popular dishes, pricing teaser, family offer, testimonials, gallery strip, reservation path, CTA |
| `home-2.html` | home2 | Home 2 — **visually distinct layout & emphasis** (dark/editorial hero, seasonal menu story, chef's table / private dining, event & family-hall emphasis, timeline of a day at the restaurant, opening hours block, FAQ) |
| `about.html` | about | story, mission & values, history timeline, team (5), awards/press strip, community, testimonials |
| `menu.html` | menu | **Menu & Pricing** — category tabs (accessible ARIA tablist) + search/dietary filter; buffet pricing table (adult/child/senior by session) + à-la-carte dishes with prices and dietary tags |
| `family-packages.html` | packages | Family & group packages: cards with included items & prices, comparison table, add-ons, group/birthday/corporate, FAQ, enquiry CTA |
| `blog.html` | blog | searchable + category-filterable listing, featured post, pagination, newsletter |
| `blog-details.html` | blog | one full article with sidebar (extra page so blog cards never dead-end) |
| `contact.html` | contact | contact cards, hours table, labelled **map placeholder**, **reservation form (`id="reservation"`)** with clear validation states (valid/invalid, inline messages, summary), FAQ |
| `404.html` | none | branded, helpful (search-like links, popular pages, reserve link) |

## Navigation — EXACT
`[Brand]  Home ▾ (Home 1 · Home 2)   About   Menu & Pricing   Family Packages   Blog   Contact   [theme icon] [RTL icon] [Reserve a Table]`
- Home dropdown holds Home 1 + Home 2. The other five are plain links, **no dropdowns**.
- Theme toggle icon and RTL/language toggle icon always visible (also on mobile, outside the collapse).
- **Exactly one prominent reservation button in the header** ("Reserve a Table" → `contact.html#reservation`), also shown inside the mobile menu as the same single CTA (only one is ever visible at a time). Do not add a second primary reservation button to the nav/header. In-page reservation prompts elsewhere use the normal `btn` classes but the *header* has exactly one.
- Collapse breakpoint: `navbar-expand-lg` or xl — pick whichever fits 7 items + 3 controls without wrapping at 1024/1280; must be verified.
- Home dropdown trigger is a real `<button class="nav-link dropdown-toggle">` (no `href="#"` anywhere).

## Brand facts (canonical — reuse exactly)
- **Hearth & Harvest — Buffet & Family Restaurant**, family-run since **2009**. Tagline: *Gather. Share. Come hungry.*
- 21 Orchard Lane, Maplewood · **+1 (555) 013-7788** · **hello@hearthandharvest.example** · events: **events@hearthandharvest.example**
- Hours: Mon–Thu 11:30 am–9:30 pm · Fri–Sat 11:30 am–10:30 pm · Sun 11:00 am–9:00 pm (Sunday brunch buffet 11–3). Kitchen closes 30 min before close.
- 180 seats, family hall (60 seats, high chairs, kids' corner), garden patio (40 seats), 2 private rooms (12 & 24 guests). Free parking, step-free access.
- Buffet: 6 live stations — Carvery, Grill & Tandoor, Pasta & Risotto, Garden Salads, Wok & Noodles, Dessert Studio. 80+ dishes, rotating weekly.
- Buffet prices (adult / child 4–10 / under 4 / senior 65+): **Weekday Lunch** (Mon–Fri 11:30–3) $18.95 / $9.50 / free / 10% off ·
  **Dinner** (Mon–Thu from 5, Fri–Sat from 5) $27.95 / $13.95 / free / 10% off · **Weekend & Sunday Brunch** (Sat–Sun 11–3) $29.95 / $14.95 / free.
- Dietary tags used on dishes: `V` vegetarian, `VG` vegan, `GF` gluten-free, `S` spicy, `H` halal option, `N` contains nuts.
- Team: **Marco Bellini** (Executive Chef), **Priya Raman** (Pastry Chef), **Samir Haddad** (General Manager), **Noa Levi** (Head of Hospitality), **Elena Torres** (Sous Chef).
- History: 2009 opened with 40 seats · 2013 first weekend buffet · 2016 family hall added · 2020 community kitchen feeds 300 neighbours a week · 2024 renovation to 180 seats & garden patio · 2026 17th year, 4.8★ from 2,900+ reviews.
- Guests: Anita & Rohan Sharma (birthday), Layla Haddad (weekly regular), Daniel Okafor (corporate lunch), Mei Tanaka (family hall).
- Currency **$**. Today is **Wed 4 Nov 2026** — use real 2026 weekdays only (Thu 5, Fri 6, Sat 7, Sun 8, Fri 13, Sat 14, Sun 15, Sat 21 Nov, Thu 26 Nov = Thanksgiving…).

### Menu à la carte (name — price — tags) — categories `starters soups-salads mains vegetarian pasta-rice desserts drinks kids`
Starters: Crispy Calamari $11.50; Burrata & Heirloom Tomato $12.50 V GF; Tandoori Paneer Tikka $10.95 V GF S H; Wild Mushroom Arancini $9.95 V; Sticky Ginger Wings $10.50 H.
Soups & Salads: Roasted Tomato Basil Soup $7.50 VG GF; Harvest Grain Bowl $11.95 VG; Caesar with Herb Croutons $10.50; Spiced Lentil Soup $7.95 VG GF S H.
Mains: Slow-Roast Lamb Shoulder $24.95 GF H; Herb-Butter Roast Chicken $19.95 GF H; Grilled Salmon, Lemon Caper $23.50 GF; Smoked Brisket Plate $21.95; Butter Chicken & Saffron Rice $18.95 GF H S.
Vegetarian: Eggplant Parmigiana $16.50 V; Chickpea & Spinach Curry $15.95 VG GF S H; Stuffed Peppers, Quinoa & Feta $15.50 V GF.
Pasta & Rice: Wild Mushroom Risotto $17.50 V GF; Spaghetti Pomodoro $14.95 VG; Lamb Biryani $19.50 GF H S; Truffle Mac & Cheese $15.95 V.
Desserts: Sticky Toffee Pudding $8.95 V; Pistachio Kunafa Cheesecake $9.50 V N; Dark Chocolate Pot $8.50 V GF; Seasonal Fruit Pavlova $8.95 V GF.
Drinks: Fresh Lime Soda $4.50 VG; Mango Lassi $5.50 V; House Lemonade (refill) $4.25 VG; Cardamom Chai $4.25 V; Sparkling Pomegranate $5.25 VG.
Kids ($8.95 each, includes a drink): Mini Margherita Pizza V; Chicken Tenders & Fries; Mac & Cheese V; Pasta Butter & Cheese V; Fruit & Yoghurt Cup V GF.

### Family & group packages
| Package | Price | Serves | Includes |
|---|---|---|---|
| **Little Family** | $64 | 2 adults + 2 kids | buffet for all four (any session), kids' drinks, dessert platter, high-chair & colouring kit |
| **Family Feast** (featured) | $129 | 4 adults + 3 kids | buffet for seven, 2 jugs of lemonade/lassi, shared dessert tower, family-hall seating guaranteed |
| **Celebration Table** | $249 | 8–12 guests, private room | buffet, welcome mocktails, custom cake slot, decoration, 2.5 hr room |
| **Group Buffet** | $22.50 pp | 13–30 guests | lunch buffet pricing for groups, set-menu option, dedicated host |
| **Birthday Party Add-on** | +$35 | any package | cake candle moment, balloon arch, birthday song, photo card |
Corporate lunch: from $19.95 pp (min 10). Deposit 20% for groups over 12; free cancellation up to 48 h.

### Blog (categories `recipes`, `kitchen`, `family`, `seasonal`, `news`) — 9 posts + featured + 1 full article ("How we plan a buffet that never runs out — or goes to waste", by Marco Bellini)

## Visual direction
Warm terracotta (primary, **AA-safe**), saffron/gold accent, olive/sage green (fresh), cream & warm charcoal surfaces; dark theme = deep espresso with the same hues lifted for contrast.
Serif display (e.g. Fraunces or Playfair Display — choose; must support weight range) + Inter/DM Sans body. Generous whitespace, large
rounded cards, soft shadows, subtle hover lift, scroll-reveal that never hides content without JS.
Food "photos": layered CSS gradient placeholders with texture + an icon + optional tag (different colourways: grill, salad, pasta, dessert, drinks, tandoor, brunch, family-hall, patio, chef, team, night).

## Quality bar / definition of done (per page and global)
- No console errors; **no horizontal scroll at 375 px**; fine at 1280 px; correct in LTR and RTL (Arabic + Hebrew, `lang`/`dir` switched, RTL Bootstrap build swapped); light & dark; AA contrast (≥ 4.5:1 text, 3:1 large/UI) **measured by a script, not eyeballed**.
- Semantic landmarks (`header nav main footer aside section article`), one `h1`, logical heading order, `aria-labelledby` on sections, skip link, visible `:focus-visible`, keyboard-operable menus/tabs/accordions/modals, `aria-current="page"` on active nav, status/validation never colour-only, `prefers-reduced-motion` honoured, `prefers-color-scheme` respected on first visit.
- SEO: unique `<title>` (≤ 60) and meta description (120–160), canonical, Open Graph + Twitter tags, JSON-LD (`Restaurant` on home/contact, `BreadcrumbList` on subpages, `Article` on blog-details, `Menu`-ish `ItemList` optional), `noindex` on 404.
- Forms are front-end demos: every form `data-demo-form`, labelled, `required` marked in text, inline validation messages (`.invalid-feedback`/`.valid-feedback`), error summary for the reservation form, success state/toast, and a visible "Front-end demo — nothing is sent" note. Date input min = today, guests 1–30, time options per opening hours.
- Realistic restaurant content (no lorem ipsum). Descriptive link text. No dead links (`href="#"` forbidden except none; footer social links use `href="#"`-free placeholders like `contact.html` or `data-demo-toast`).
- README (short): setup, folder tree, customising (colours/fonts/logo/placeholders→images/copy, nav, map embed, forms backend), dependencies list, browser support, demo disclaimer.
- Shared chrome via partials + `docs/sync-partials.py` marker regions; `docs/contract-check.js` asserts every page at 375/1280 × LTR/RTL, plus a contrast sweep helper in the same file.
