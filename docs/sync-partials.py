#!/usr/bin/env python3
"""
Hearth & Harvest - sync-partials.py

Refreshes the shared chrome of every page from docs/partials/. Pages stay plain
static HTML (no runtime include system); this script rewrites ONLY the text
between marker comments, so you edit a partial once and re-sync.

Markers (the JSON after the name is that page's own settings):

  <!-- @head {"title": "...", "description": "...", "file": "about.html"} -->
  <!-- @head:end -->
      optional keys:
        "robots": "noindex"     canonical/OG/Twitter block becomes <meta name="robots" content="noindex,nofollow">
        "schema": ...           JSON-LD, one <script type="application/ld+json"> per entry:
                                  "restaurant"                  -> canonical Restaurant object (brand facts)
                                  "breadcrumb"                  -> Home > <crumb or title> (this page)
                                     with "crumb": "About"   or  "crumbs": [["Blog", "blog.html"], ["Post", "blog-details.html"]]
                                  {...}                         -> any raw JSON-LD object, inserted as-is
                                  [ ... ]                       -> a list mixing the above
  <!-- @header {"nav": "home1"} -->   nav = home1 home2 about menu packages blog contact none
  <!-- @header:end -->
  <!-- @footer -->  <!-- @footer:end -->
  <!-- @scripts --> <!-- @scripts:end -->

Everything outside the markers is left alone. Pages with no markers are not
rewritten, and a page is only written when its content actually changed.

Usage (from anywhere):   python docs/sync-partials.py [page.html ...]
                         python docs/sync-partials.py --check     (exit 1 if any page is out of date)

Speed: plain str.find() scanning (no regex backtracking over whole pages), partials read once,
unchanged pages skipped.
"""
import html
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
PARTIALS = ROOT / "docs" / "partials"
SITE = "https://www.example.com/hearth-harvest/"

NAV_HREF = {
    "home1": "index.html", "home2": "home-2.html", "about": "about.html", "menu": "menu.html",
    "packages": "family-packages.html", "blog": "blog.html", "contact": "contact.html",
}
HOME_KEYS = ("home1", "home2")

RESTAURANT = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "name": "Hearth & Harvest",
    "alternateName": "Hearth & Harvest Buffet & Family Restaurant",
    "slogan": "Gather. Share. Come hungry.",
    "url": SITE,
    "image": SITE + "assets/img/social-card.jpg",
    "telephone": "+1-555-013-7788",
    "email": "hello@hearthandharvest.example",
    "foundingDate": "2009",
    "priceRange": "$$",
    "servesCuisine": ["Buffet", "International", "Indian", "Italian", "Asian", "Desserts"],
    "acceptsReservations": True,
    "hasMenu": SITE + "menu.html",
    "address": {
        "@type": "PostalAddress",
        "streetAddress": "21 Orchard Lane",
        "addressLocality": "Maplewood",
        "addressCountry": "US",
    },
    "openingHoursSpecification": [
        {"@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday"], "opens": "11:30", "closes": "21:30"},
        {"@type": "OpeningHoursSpecification", "dayOfWeek": ["Friday", "Saturday"], "opens": "11:30", "closes": "22:30"},
        {"@type": "OpeningHoursSpecification", "dayOfWeek": "Sunday", "opens": "11:00", "closes": "21:00"},
    ],
    "amenityFeature": [
        {"@type": "LocationFeatureSpecification", "name": "Free parking", "value": True},
        {"@type": "LocationFeatureSpecification", "name": "Step-free access", "value": True},
        {"@type": "LocationFeatureSpecification", "name": "High chairs and kids' corner", "value": True},
    ],
    "maximumAttendeeCapacity": 180,
    "aggregateRating": {"@type": "AggregateRating", "ratingValue": "4.8", "bestRating": "5", "reviewCount": "2900"},
}

_cache = {}


class SyncError(Exception):
    pass


def load(name):
    """Partial text without its leading documentation comment (read once per run)."""
    if name not in _cache:
        text = (PARTIALS / name).read_text(encoding="utf-8")
        stripped = text.lstrip()
        if stripped.startswith("<!--"):
            end = stripped.find("-->")
            if end < 0:
                raise SyncError("%s: unterminated documentation comment" % name)
            body = stripped[end + 3:].lstrip("\r\n")
            # A stray terminator inside the doc comment leaves comment prose behind: refuse.
            if body and not body.lstrip().startswith("<"):
                raise SyncError("%s: documentation comment contains a nested comment terminator" % name)
            stripped = body
        _cache[name] = stripped.rstrip() + "\n"
    return _cache[name]


def page_url(file):
    return SITE if file == "index.html" else SITE + file


def schema_blocks(cfg):
    spec = cfg.get("schema")
    if not spec:
        return []
    items = spec if isinstance(spec, list) else [spec]
    out = []
    for item in items:
        if item == "restaurant":
            obj = RESTAURANT
        elif item == "breadcrumb":
            crumbs = cfg.get("crumbs") or [[cfg.get("crumb") or cfg["title"].split("|")[0].strip(), cfg["file"]]]
            elems = [{"@type": "ListItem", "position": 1, "name": "Home", "item": SITE}]
            for i, (name, href) in enumerate(crumbs, start=2):
                elems.append({"@type": "ListItem", "position": i, "name": name, "item": page_url(href)})
            obj = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": elems}
        elif isinstance(item, dict):
            obj = item
        else:
            raise SyncError("unknown schema %r" % (item,))
        js = json.dumps(obj, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
        out.append('<script type="application/ld+json">\n%s\n</script>\n' % js)
    return out


def build_head(cfg, page):
    for key in ("title", "description", "file"):
        if key not in cfg:
            raise SyncError("@head is missing %r" % key)
    out = load("head.html")
    a, b = out.find("<!-- @SEO -->\n"), out.find("<!-- @SEO:end -->\n")
    if cfg.get("robots") == "noindex":
        out = out[:a] + '<meta name="robots" content="noindex,nofollow">\n' + out[b + len("<!-- @SEO:end -->\n"):]
    else:
        out = out[:a] + out[a + len("<!-- @SEO -->\n"):b] + out[b + len("<!-- @SEO:end -->\n"):]
    out = out.replace("<!-- @SCHEMA -->\n", "".join(schema_blocks(cfg)))
    out = (out.replace("{{PAGE_TITLE}}", html.escape(cfg["title"], quote=True))
              .replace("{{PAGE_DESCRIPTION}}", html.escape(cfg["description"], quote=True))
              .replace("{{PAGE_URL}}", page_url(cfg["file"])))
    return out


def add_to_tag(text, needle, current):
    """Find the opening tag that starts with `needle`; add nav-active (+ aria-current)."""
    i = text.find(needle)
    if i < 0:
        raise SyncError("header partial has no %r" % needle)
    j = text.find(">", i)
    tag = text[i:j]
    k = tag.find('class="')
    if k >= 0:
        tag = tag[:k + 7] + tag[k + 7:].replace('"', ' nav-active"', 1)
    if current:
        tag += ' aria-current="page"'
    return text[:i] + tag + text[j:]


def build_header(cfg, page):
    out = load("header.html")
    nav = cfg.get("nav", "none")
    if nav == "none":
        return out
    if nav not in NAV_HREF:
        raise SyncError("unknown nav key %r" % nav)
    href = NAV_HREF[nav]
    if nav in HOME_KEYS:
        out = add_to_tag(out, '<button type="button" class="nav-link dropdown-toggle"', False)
        out = add_to_tag(out, '<a class="dropdown-item" href="%s"' % href, href == page)
    else:
        out = add_to_tag(out, '<a class="nav-link" href="%s"' % href, href == page)
    return out


BUILDERS = {
    "head": build_head,
    "header": build_header,
    "footer": lambda cfg, page: load("footer.html"),
    "scripts": lambda cfg, page: load("scripts.html"),
}


def sync_text(text, page):
    """Return (new_text, counts). Linear scan with str.find only."""
    counts = dict.fromkeys(BUILDERS, 0)
    out, pos = [], 0
    while True:
        start = text.find("<!-- @", pos)
        if start < 0:
            break
        close = text.find("-->", start)
        if close < 0:
            raise SyncError("unterminated marker at offset %d" % start)
        inner = text[start + 6:close].strip()           # e.g. 'head {"title": ...}'
        name, _, raw = inner.partition(" ")
        if name not in BUILDERS:                          # some other comment, e.g. @head:end of a broken page
            out.append(text[pos:close + 3]); pos = close + 3
            continue
        try:
            cfg = json.loads(raw) if raw.strip() else {}
        except ValueError as exc:
            raise SyncError("bad JSON in @%s marker: %s" % (name, exc))
        line_end = text.find("\n", close)
        body_start = (line_end + 1) if line_end >= 0 and text[close + 3:line_end].strip() == "" else close + 3
        end_marker = "<!-- @%s:end -->" % name
        end = text.find(end_marker, body_start)
        if end < 0:
            raise SyncError("@%s has no matching %s" % (name, end_marker))
        out.append(text[pos:body_start])
        out.append(BUILDERS[name](cfg, page))
        out.append(end_marker)
        pos = end + len(end_marker)
        counts[name] += 1
    out.append(text[pos:])
    return "".join(out), counts


def main(argv):
    check_only = "--check" in argv
    names = [a for a in argv if not a.startswith("--")]
    pages = [ROOT / n for n in names] if names else sorted(ROOT.glob("*.html"))
    stale = failed = 0
    for page in pages:
        if not page.exists():
            print("missing  %s" % page.name); failed += 1; continue
        text = page.read_text(encoding="utf-8")
        if "<!-- @" not in text:
            print("skipped  %-24s (no markers)" % page.name)
            continue
        try:
            new, counts = sync_text(text, page.name)
        except SyncError as exc:
            print("ERROR    %-24s %s" % (page.name, exc)); failed += 1; continue
        summary = " ".join("%s:%d" % kv for kv in counts.items())
        if new == text:
            print("ok       %-24s %s (unchanged)" % (page.name, summary))
        elif check_only:
            print("STALE    %-24s %s" % (page.name, summary)); stale += 1
        else:
            page.write_text(new, encoding="utf-8", newline="\n")
            print("synced   %-24s %s" % (page.name, summary))
    return 1 if (failed or (check_only and stale)) else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
