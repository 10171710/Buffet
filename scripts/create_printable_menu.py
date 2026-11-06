"""
Generate Hearth & Harvest Printable Menu PDF (2-Page Double-Sided Ready)
"""
import os
import re
import html

class MenuPDFBuilder:
    def __init__(self, width=612, height=792):
        self.width = width
        self.height = height
        self.pages = []
        self.cur = []

    def new_page(self):
        if self.cur:
            self.pages.append("".join(self.cur))
        self.cur = []

    def set_fill(self, r, g, b):
        self.cur.append(f"{r:.3f} {g:.3f} {b:.3f} rg\n")

    def set_stroke(self, r, g, b):
        self.cur.append(f"{r:.3f} {g:.3f} {b:.3f} RG\n")

    def set_line_width(self, w):
        self.cur.append(f"{w:.2f} w\n")

    def rect(self, x, y, w, h, fill=True, stroke=False):
        op = "B" if fill and stroke else ("f" if fill else "S")
        self.cur.append(f"{x:.2f} {y:.2f} {w:.2f} {h:.2f} re {op}\n")

    def line(self, x1, y1, x2, y2):
        self.cur.append(f"{x1:.2f} {y1:.2f} m {x2:.2f} {y2:.2f} l S\n")

    def text(self, x, y, text_str, font="F1", size=10):
        safe = (text_str.replace("\\", "\\\\")
                        .replace("(", "\\(")
                        .replace(")", "\\)")
                        .replace("’", "'")
                        .replace("‘", "'")
                        .replace("“", "\"")
                        .replace("”", "\"")
                        .replace("–", "-")
                        .replace("—", "-")
                        .replace("·", "-")
                        .replace("•", "*")
                        .replace("é", "e")
                        .replace("è", "e")
                        .replace("à", "a")
                        .replace("â", "a")
                        .replace("&amp;", "&"))
        safe = safe.encode('latin-1', 'replace').decode('latin-1')
        self.cur.append(f"BT /{font} {size} Tf {x:.2f} {y:.2f} Td ({safe}) Tj ET\n")

    def text_right(self, x_right, y, text_str, font="F1", size=10, approx_char_w=5.5):
        w = len(text_str) * approx_char_w * (size / 10.0)
        self.text(x_right - w, y, text_str, font=font, size=size)

    def finish(self):
        if self.cur:
            self.pages.append("".join(self.cur))
            self.cur = []

    def save(self, filepath):
        self.finish()
        num_pages = len(self.pages)
        objects = []

        cat_id = 1
        out_id = 2
        pages_id = 3

        f1_id = 4 + 2 * num_pages
        f2_id = f1_id + 1
        f3_id = f1_id + 2
        f4_id = f1_id + 3
        f5_id = f1_id + 4

        objects.append(f"{cat_id} 0 obj\n<< /Type /Catalog /Pages {pages_id} 0 R >>\nendobj\n")
        objects.append(f"{out_id} 0 obj\n<< /Type /Outlines /Count 0 >>\nendobj\n")

        page_ids = [4 + 2 * i for i in range(num_pages)]
        kids_str = " ".join(f"{pid} 0 R" for pid in page_ids)
        objects.append(f"{pages_id} 0 obj\n<< /Type /Pages /Kids [{kids_str}] /Count {num_pages} >>\nendobj\n")

        for i, page_data in enumerate(self.pages):
            page_obj_id = 4 + 2 * i
            content_obj_id = page_obj_id + 1
            stream_bytes = page_data.encode('latin-1')

            objects.append(
                f"{page_obj_id} 0 obj\n"
                f"<< /Type /Page /Parent {pages_id} 0 R\n"
                f"   /MediaBox [0 0 {self.width:.2f} {self.height:.2f}]\n"
                f"   /Contents {content_obj_id} 0 R\n"
                f"   /Resources << /Font <<\n"
                f"      /F1 {f1_id} 0 R\n"
                f"      /F2 {f2_id} 0 R\n"
                f"      /F3 {f3_id} 0 R\n"
                f"      /F4 {f4_id} 0 R\n"
                f"      /F5 {f5_id} 0 R\n"
                f"   >> >>\n"
                f">>\nendobj\n"
            )

            objects.append(
                f"{content_obj_id} 0 obj\n"
                f"<< /Length {len(stream_bytes)} >>\n"
                f"stream\n"
                f"{page_data}"
                f"endstream\nendobj\n"
            )

        fonts = [
            (f1_id, "Helvetica"),
            (f2_id, "Helvetica-Bold"),
            (f3_id, "Helvetica-Oblique"),
            (f4_id, "Times-Roman"),
            (f5_id, "Times-Bold")
        ]
        for fid, base_font in fonts:
            objects.append(
                f"{fid} 0 obj\n"
                f"<< /Type /Font /Subtype /Type1 /BaseFont /{base_font} /Encoding /WinAnsiEncoding >>\n"
                f"endobj\n"
            )

        header = "%PDF-1.4\n%\xe2\xe3\xcf\xd3\n"
        body = ""
        xref = ["0000000000 65535 f \r\n"]
        offset = len(header.encode('latin-1'))

        for obj in objects:
            xref.append(f"{offset:010d} 00000 n \r\n")
            body += obj
            offset += len(obj.encode('latin-1'))

        xref_offset = offset
        num_objects = len(objects) + 1
        xref_str = f"xref\n0 {num_objects}\n" + "".join(xref)
        trailer = (
            f"trailer\n"
            f"<< /Size {num_objects} /Root {cat_id} 0 R >>\n"
            f"startxref\n{xref_offset}\n%%EOF\n"
        )

        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, "wb") as f:
            f.write(header.encode('latin-1'))
            f.write(body.encode('latin-1'))
            f.write(xref_str.encode('latin-1'))
            f.write(trailer.encode('latin-1'))

        print(f"Generated {filepath} successfully ({os.path.getsize(filepath)} bytes)")


def draw_dish_item(pdf, x, y, width, dish):
    # dish: {name, price, desc, dietary}
    # Name (Bold)
    pdf.set_fill(0.169, 0.114, 0.086) # ink
    pdf.text(x, y, dish['name'], font="F2", size=9.5)

    # Price (Bold terracotta)
    pdf.set_fill(0.541, 0.196, 0.106)
    pdf.text_right(x + width, y, dish['price'], font="F2", size=9.5, approx_char_w=5.8)

    # Dietary tags
    cur_y = y - 10
    if dish['dietary']:
        tag_str = " ".join([f"[{t.upper()}]" for t in dish['dietary'].split()])
        pdf.set_fill(0.60, 0.40, 0.20)
        pdf.text(x, cur_y, tag_str, font="F3", size=7.5)
        cur_y -= 9

    # Description (wrap to width if long)
    desc = dish['desc']
    pdf.set_fill(0.35, 0.28, 0.24)
    # Simple wrap
    words = desc.split()
    line = ""
    for w in words:
        test_line = line + (" " if line else "") + w
        if len(test_line) * 4.3 > width and line:
            pdf.text(x, cur_y, line, font="F1", size=8)
            cur_y -= 9.5
            line = w
        else:
            line = test_line
    if line:
        pdf.text(x, cur_y, line, font="F1", size=8)
        cur_y -= 9.5

    return cur_y - 4 # return new y position


def generate():
    # Read dishes from script
    from parse_menu import parse_menu
    categories = parse_menu()
    cat_map = {c['id']: c for c in categories}

    pdf = MenuPDFBuilder()

    # -------------------------------------------------------------
    # PAGE 1: BUFFET SELECTIONS & FIRST HALF OF A LA CARTE
    # -------------------------------------------------------------
    pdf.new_page()

    # Header Top Bar (Terracotta)
    pdf.set_fill(0.541, 0.196, 0.106) # #8a321b
    pdf.rect(30, 726, 552, 42, fill=True)

    # Header Title
    pdf.set_fill(1.0, 1.0, 1.0)
    pdf.text(42, 745, "HEARTH & HARVEST", font="F2", size=18)
    pdf.set_fill(0.95, 0.85, 0.70)
    pdf.text(42, 733, "BUFFET & FAMILY RESTAURANT  *  FRESH DAILY SELECTIONS", font="F1", size=8.5)

    pdf.set_fill(1.0, 1.0, 1.0)
    pdf.text_right(570, 745, "MAPLEWOOD", font="F2", size=11, approx_char_w=5.5)
    pdf.set_fill(0.95, 0.85, 0.70)
    pdf.text_right(570, 733, "21 Orchard Lane  *  (555) 013-7788", font="F1", size=8, approx_char_w=4.8)

    # Gold Accent Line below header
    pdf.set_fill(0.949, 0.722, 0.294) # Saffron
    pdf.rect(30, 722, 552, 3, fill=True)

    # 1. BUFFET PRICING SECTION
    pdf.set_fill(0.984, 0.945, 0.894) # cream surface
    pdf.rect(30, 615, 552, 100, fill=True)
    pdf.set_stroke(0.85, 0.75, 0.65)
    pdf.set_line_width(0.75)
    pdf.rect(30, 615, 552, 100, fill=False, stroke=True)

    # Buffet Section Title
    pdf.set_fill(0.541, 0.196, 0.106)
    pdf.text(42, 698, "ALL-YOU-CAN-EAT LIVE BUFFET PRICING", font="F2", size=11)
    pdf.set_fill(0.35, 0.28, 0.24)
    pdf.text(285, 699, "6 Live Cooking Stations - Rotating Chef Specialties Daily", font="F3", size=8)

    # Table Header Row
    pdf.set_fill(0.91, 0.84, 0.76)
    pdf.rect(40, 678, 532, 14, fill=True)
    pdf.set_fill(0.17, 0.11, 0.09)
    pdf.text(45, 682, "SESSION", font="F2", size=8)
    pdf.text(230, 682, "ADULT", font="F2", size=8)
    pdf.text(320, 682, "CHILD (4-10)", font="F2", size=8)
    pdf.text(420, 682, "UNDER 4", font="F2", size=8)
    pdf.text(500, 682, "SENIOR (65+)", font="F2", size=8)

    # Table rows
    sessions = [
        ("Weekday Lunch (Mon-Thu, 11:30 - 15:30)", "$21.95", "$11.95", "FREE", "$18.95"),
        ("Weekday Dinner (Mon-Thu, 17:00 - 21:30)", "$31.95", "$16.95", "FREE", "$27.95"),
        ("Weekend Lunch & Dinner (Fri-Sat)", "$35.95", "$18.95", "FREE", "$30.95"),
        ("Sunday Grand Brunch (Sun, 11:00 - 21:00)", "$28.95", "$14.95", "FREE", "$24.95"),
    ]
    cur_row_y = 665
    for s_name, adult, child, u4, sen in sessions:
        pdf.set_fill(0.17, 0.11, 0.09)
        pdf.text(45, cur_row_y, s_name, font="F1", size=7.8)
        pdf.set_fill(0.54, 0.20, 0.11)
        pdf.text(230, cur_row_y, adult, font="F2", size=8)
        pdf.set_fill(0.17, 0.11, 0.09)
        pdf.text(320, cur_row_y, child, font="F1", size=8)
        pdf.set_fill(0.20, 0.50, 0.20)
        pdf.text(420, cur_row_y, u4, font="F2", size=8)
        pdf.set_fill(0.17, 0.11, 0.09)
        pdf.text(500, cur_row_y, sen, font="F1", size=8)
        cur_row_y -= 12

    # Buffet Live Stations Note
    pdf.set_fill(0.54, 0.20, 0.11)
    pdf.text(40, 603, "LIVE STATIONS:", font="F2", size=8)
    pdf.set_fill(0.35, 0.28, 0.24)
    pdf.text(110, 603, "Carvery & Grill  *  Stone Pizza & Pasta  *  Tandoor & Curry  *  Wok & Dim Sum  *  Salad Bar  *  Dessert Pavilion", font="F1", size=7.5)

    # Horizontal divider
    pdf.set_stroke(0.85, 0.75, 0.65)
    pdf.line(30, 595, 582, 595)

    # SECTION BANNER: A LA CARTE SELECTIONS
    pdf.set_fill(0.541, 0.196, 0.106)
    pdf.rect(30, 574, 552, 16, fill=True)
    pdf.set_fill(1.0, 1.0, 1.0)
    pdf.text(42, 578, "A LA CARTE KITCHEN SELECTIONS", font="F2", size=9)
    pdf.text_right(570, 578, "COOKED TO ORDER  *  FRESH INGREDIENTS", font="F1", size=7.5, approx_char_w=4.5)

    # 2 COLUMNS FOR DISHES ON PAGE 1
    # Col 1: Starters (5) + Soups & Salads (4)
    # Col 2: Vegetarian (3) + Pasta & Rice (4)
    col_w = 265
    c1_x = 30
    c2_x = 317

    # Col 1: Starters
    y1 = 558
    pdf.set_fill(0.54, 0.20, 0.11)
    pdf.text(c1_x, y1, "STARTERS & SMALL PLATES", font="F2", size=10)
    pdf.set_stroke(0.54, 0.20, 0.11)
    pdf.set_line_width(0.75)
    pdf.line(c1_x, y1 - 2, c1_x + col_w, y1 - 2)
    y1 -= 14

    for d in cat_map['pane-starters']['dishes']:
        y1 = draw_dish_item(pdf, c1_x, y1, col_w, d)

    y1 -= 6
    # Col 1: Soups & Salads
    pdf.set_fill(0.54, 0.20, 0.11)
    pdf.text(c1_x, y1, "SOUPS & GARDEN SALADS", font="F2", size=10)
    pdf.line(c1_x, y1 - 2, c1_x + col_w, y1 - 2)
    y1 -= 14

    for d in cat_map['pane-soups-salads']['dishes']:
        y1 = draw_dish_item(pdf, c1_x, y1, col_w, d)

    # Col 2: Vegetarian & Vegan
    y2 = 558
    pdf.set_fill(0.54, 0.20, 0.11)
    pdf.text(c2_x, y2, "VEGETARIAN & PLANT-FORWARD", font="F2", size=10)
    pdf.line(c2_x, y2 - 2, c2_x + col_w, y2 - 2)
    y2 -= 14

    for d in cat_map['pane-vegetarian']['dishes']:
        y2 = draw_dish_item(pdf, c2_x, y2, col_w, d)

    y2 -= 6
    # Col 2: Pasta & Rice
    pdf.set_fill(0.54, 0.20, 0.11)
    pdf.text(c2_x, y2, "FRESH PASTA & RICE", font="F2", size=10)
    pdf.line(c2_x, y2 - 2, c2_x + col_w, y2 - 2)
    y2 -= 14

    for d in cat_map['pane-pasta-rice']['dishes']:
        y2 = draw_dish_item(pdf, c2_x, y2, col_w, d)

    # Page 1 Footer
    pdf.set_fill(0.984, 0.945, 0.894)
    pdf.rect(30, 24, 552, 22, fill=True)
    pdf.set_stroke(0.85, 0.75, 0.65)
    pdf.line(30, 46, 582, 46)
    pdf.set_fill(0.40, 0.30, 0.25)
    pdf.text(38, 32, "HEARTH & HARVEST  *  21 Orchard Lane, Maplewood  *  Call: +1 (555) 013-7788", font="F1", size=7.5)
    pdf.text_right(574, 32, "Page 1 of 2  (Continued on back)", font="F2", size=7.5, approx_char_w=4.8)


    # -------------------------------------------------------------
    # PAGE 2: MAINS, DESSERTS, DRINKS, KIDS, DIETARY INFO
    # -------------------------------------------------------------
    pdf.new_page()

    # Header Page 2
    pdf.set_fill(0.541, 0.196, 0.106)
    pdf.rect(30, 746, 552, 24, fill=True)
    pdf.set_fill(1.0, 1.0, 1.0)
    pdf.text(42, 754, "HEARTH & HARVEST", font="F2", size=12)
    pdf.text(180, 754, "*  MAINS, DESSERTS, DRINKS & KIDS MENU", font="F1", size=9)
    pdf.text_right(570, 754, "RESERVATIONS: (555) 013-7788", font="F2", size=8.5, approx_char_w=5.0)

    # Gold line
    pdf.set_fill(0.949, 0.722, 0.294)
    pdf.rect(30, 743, 552, 3, fill=True)

    # 2 COLUMNS ON PAGE 2
    # Col 1: Mains (5) + Desserts (4)
    # Col 2: Drinks (5) + Kids (5) + Packages/Allergies box
    y1 = 726
    pdf.set_fill(0.54, 0.20, 0.11)
    pdf.text(c1_x, y1, "MAINS & HEARTH CARVERY", font="F2", size=10)
    pdf.set_stroke(0.54, 0.20, 0.11)
    pdf.line(c1_x, y1 - 2, c1_x + col_w, y1 - 2)
    y1 -= 14

    for d in cat_map['pane-mains']['dishes']:
        y1 = draw_dish_item(pdf, c1_x, y1, col_w, d)

    y1 -= 8
    # Desserts
    pdf.set_fill(0.54, 0.20, 0.11)
    pdf.text(c1_x, y1, "ARTISAN DESSERTS & SWEETS", font="F2", size=10)
    pdf.line(c1_x, y1 - 2, c1_x + col_w, y1 - 2)
    y1 -= 14

    for d in cat_map['pane-desserts']['dishes']:
        y1 = draw_dish_item(pdf, c1_x, y1, col_w, d)

    # Col 2: Drinks
    y2 = 726
    pdf.set_fill(0.54, 0.20, 0.11)
    pdf.text(c2_x, y2, "HOUSE BEVERAGES & CHAI", font="F2", size=10)
    pdf.set_stroke(0.54, 0.20, 0.11)
    pdf.line(c2_x, y2 - 2, c2_x + col_w, y2 - 2)
    y2 -= 14

    for d in cat_map['pane-drinks']['dishes']:
        y2 = draw_dish_item(pdf, c2_x, y2, col_w, d)

    y2 -= 8
    # Kids Table
    pdf.set_fill(0.54, 0.20, 0.11)
    pdf.text(c2_x, y2, "KIDS TABLE (UNDER 10)", font="F2", size=10)
    pdf.line(c2_x, y2 - 2, c2_x + col_w, y2 - 2)
    y2 -= 14

    for d in cat_map['pane-kids']['dishes']:
        y2 = draw_dish_item(pdf, c2_x, y2, col_w, d)

    # Bottom Box: Special Events, Dietary Guide & Allergen Notice
    box_y = 52
    box_h = 100
    pdf.set_fill(0.984, 0.945, 0.894)
    pdf.rect(30, box_y, 552, box_h, fill=True)
    pdf.set_stroke(0.85, 0.75, 0.65)
    pdf.rect(30, box_y, 552, box_h, fill=False, stroke=True)

    # Box Title & Subtitle
    pdf.set_fill(0.54, 0.20, 0.11)
    pdf.text(42, box_y + box_h - 16, "FAMILY PACKAGES, PRIVATE DINING & CELEBRATIONS", font="F2", size=9.5)
    pdf.set_fill(0.35, 0.28, 0.24)
    pdf.text(42, box_y + box_h - 28, "Celebration Table (8-12 guests, $249)  *  Family Hall Feast (16-24 guests, $489)  *  Corporate Event (30+)", font="F1", size=8)
    pdf.text(42, box_y + box_h - 39, "Private dining rooms include custom decorations, personalized cake moment, and a dedicated host.", font="F3", size=8)

    # Dietary keys
    pdf.set_stroke(0.88, 0.80, 0.72)
    pdf.line(42, box_y + 46, 570, box_y + 46)

    pdf.set_fill(0.54, 0.20, 0.11)
    pdf.text(42, box_y + 32, "DIETARY KEYS:", font="F2", size=8)
    pdf.set_fill(0.35, 0.28, 0.24)
    pdf.text(112, box_y + 32, "[V] Vegetarian   [VG] Vegan   [GF] Gluten-Free   [H] Halal Option   [S] Spicy   [N] Contains Nuts", font="F1", size=7.8)

    pdf.set_fill(0.50, 0.35, 0.30)
    pdf.text(42, box_y + 18, "ALLERGEN NOTICE: Our kitchen prepares dishes containing nuts, dairy, seafood and gluten. Please inform our team of any severe allergies.", font="F3", size=7.2)
    pdf.text(42, box_y + 8, "HOURS: Mon-Thu 11:30-21:30  *  Fri-Sat 11:30-22:30  *  Sun 11:00-21:00  *  Website: www.hearthandharvest.example", font="F1", size=7.2)

    # Page 2 Footer
    pdf.set_fill(0.40, 0.30, 0.25)
    pdf.text(38, 32, "HEARTH & HARVEST  *  Gather. Share. Come hungry.  *  Reserve online or call +1 (555) 013-7788", font="F1", size=7.5)
    pdf.text_right(574, 32, "Page 2 of 2", font="F2", size=7.5, approx_char_w=4.8)

    out_file = os.path.join("assets", "downloads", "hearth-harvest-menu.pdf")
    pdf.save(out_file)

if __name__ == "__main__":
    generate()

