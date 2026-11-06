import re
import html

def parse_menu():
    with open('menu.html', 'r', encoding='utf-8') as f:
        content = f.read()

    # Find each tab-pane
    pane_pattern = re.compile(r'<div class="tab-pane[^"]*"\s+id="([^"]+)"[\s\S]*?<h3 class="pane-title[^"]*">([^<]+)</h3>\s*<p class="text-muted[^"]*">([^<]+)</p>([\s\S]*?)</ul>\s*</div>', re.MULTILINE)

    categories = []
    for match in pane_pattern.finditer(content):
        pane_id = match.group(1)
        pane_title = html.unescape(match.group(2).strip())
        pane_desc = html.unescape(match.group(3).strip())
        pane_body = match.group(4)

        item_pattern = re.compile(r'<li class="menu-item"[^>]*data-category="([^"]*)"[^>]*>[\s\S]*?<h3 class="menu-item-name">([^<]+)</h3>[\s\S]*?<span class="menu-item-price[^"]*">([^<]+)</span>[\s\S]*?<p class="menu-item-desc">([\s\S]*?)</p>', re.MULTILINE)

        dishes = []
        for item_m in item_pattern.finditer(pane_body):
            dietary = item_m.group(1).strip()
            name = html.unescape(item_m.group(2).strip())
            price = html.unescape(item_m.group(3).strip())
            desc = html.unescape(re.sub(r'\s+', ' ', item_m.group(4).strip()))
            dishes.append({
                'name': name,
                'price': price,
                'desc': desc,
                'dietary': dietary
            })

        categories.append({
            'id': pane_id,
            'title': pane_title,
            'desc': pane_desc,
            'dishes': dishes
        })

    return categories

cats = parse_menu()
print(f"Categories: {len(cats)}")
total_dishes = 0
for c in cats:
    print(f"Category: {c['title']} ({len(c['dishes'])} dishes)")
    total_dishes += len(c['dishes'])
    for d in c['dishes'][:2]:
        print(f"   {d['name']} - {d['price']} ({d['dietary']})")
print(f"Total dishes: {total_dishes}")
