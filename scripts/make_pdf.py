import os
import re
import html

class SimplePDF:
    def __init__(self, width=612, height=792): # Letter size (612 x 792 points)
        self.width = width
        self.height = height
        self.pages = []
        self.current_page_stream = []

    def add_page(self):
        if self.current_page_stream:
            self.pages.append("".join(self.current_page_stream))
        self.current_page_stream = []

    def set_fill_color(self, r, g, b):
        self.current_page_stream.append(f"{r:.3f} {g:.3f} {b:.3f} rg\n")

    def set_stroke_color(self, r, g, b):
        self.current_page_stream.append(f"{r:.3f} {g:.3f} {b:.3f} RG\n")

    def set_line_width(self, w):
        self.current_page_stream.append(f"{w:.2f} w\n")

    def rect(self, x, y, w, h, fill=True, stroke=False):
        op = "B" if fill and stroke else ("f" if fill else "S")
        self.current_page_stream.append(f"{x:.2f} {y:.2f} {w:.2f} {h:.2f} re {op}\n")

    def line(self, x1, y1, x2, y2):
        self.current_page_stream.append(f"{x1:.2f} {y1:.2f} m {x2:.2f} {y2:.2f} l S\n")

    def text(self, x, y, text_str, font="F1", size=10):
        # Escape parenthesis and backslashes
        safe_text = (text_str.replace("\\", "\\\\")
                             .replace("(", "\\(")
                             .replace(")", "\\)"))
        # Replace common unicode chars with ASCII equivalents for standard Helvetica font
        safe_text = (safe_text.replace("’", "'")
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
                              .replace("â", "a"))
        # Strip any other non-latin1 characters
        safe_text = safe_text.encode('latin-1', 'replace').decode('latin-1')
        self.current_page_stream.append(
            f"BT /{font} {size} Tf {x:.2f} {y:.2f} Td ({safe_text}) Tj ET\n"
        )

    def finish(self):
        if self.current_page_stream:
            self.pages.append("".join(self.current_page_stream))
            self.current_page_stream = []

    def build(self, output_path):
        self.finish()
        num_pages = len(self.pages)
        objects = []

        # Object 1: Catalog
        # Object 2: Outlines
        # Object 3: Pages tree
        # For each page:
        #   Object 4 + 2*i : Page
        #   Object 4 + 2*i + 1 : Contents stream
        # Object Font F1 (Helvetica)
        # Object Font F2 (Helvetica-Bold)
        # Object Font F3 (Helvetica-Oblique)
        # Object Font F4 (Times-Roman)
        # Object Font F5 (Times-Bold)

        catalog_id = 1
        outlines_id = 2
        pages_tree_id = 3

        font_f1_id = 4 + 2 * num_pages
        font_f2_id = font_f1_id + 1
        font_f3_id = font_f1_id + 2
        font_f4_id = font_f1_id + 3
        font_f5_id = font_f1_id + 4

        # Catalog
        objects.append(f"{catalog_id} 0 obj\n<< /Type /Catalog /Pages {pages_tree_id} 0 R >>\nendobj\n")
        # Outlines
        objects.append(f"{outlines_id} 0 obj\n<< /Type /Outlines /Count 0 >>\nendobj\n")

        # Pages Kids
        page_ids = [4 + 2 * i for i in range(num_pages)]
        kids_str = " ".join(f"{pid} 0 R" for pid in page_ids)
        objects.append(f"{pages_tree_id} 0 obj\n<< /Type /Pages /Kids [{kids_str}] /Count {num_pages} >>\nendobj\n")

        # For each page
        for i, page_content in enumerate(self.pages):
            page_obj_id = 4 + 2 * i
            content_obj_id = page_obj_id + 1
            stream_bytes = page_content.encode('latin-1')

            page_dict = (
                f"{page_obj_id} 0 obj\n"
                f"<< /Type /Page /Parent {pages_tree_id} 0 R\n"
                f"   /MediaBox [0 0 {self.width:.2f} {self.height:.2f}]\n"
                f"   /Contents {content_obj_id} 0 R\n"
                f"   /Resources << /Font <<\n"
                f"      /F1 {font_f1_id} 0 R\n"
                f"      /F2 {font_f2_id} 0 R\n"
                f"      /F3 {font_f3_id} 0 R\n"
                f"      /F4 {font_f4_id} 0 R\n"
                f"      /F5 {font_f5_id} 0 R\n"
                f"   >> >>\n"
                f">>\nendobj\n"
            )
            objects.append(page_dict)

            content_dict = (
                f"{content_obj_id} 0 obj\n"
                f"<< /Length {len(stream_bytes)} >>\n"
                f"stream\n"
                f"{page_content}"
                f"endstream\nendobj\n"
            )
            objects.append(content_dict)

        # Standard Fonts
        fonts = [
            (font_f1_id, "Helvetica"),
            (font_f2_id, "Helvetica-Bold"),
            (font_f3_id, "Helvetica-Oblique"),
            (font_f4_id, "Times-Roman"),
            (font_f5_id, "Times-Bold")
        ]
        for fid, base_font in fonts:
            objects.append(
                f"{fid} 0 obj\n"
                f"<< /Type /Font /Subtype /Type1 /BaseFont /{base_font} /Encoding /WinAnsiEncoding >>\n"
                f"endobj\n"
            )

        # Build final PDF binary
        header = "%PDF-1.4\n%\xe2\xe3\xcf\xd3\n"
        body = ""
        xref = []
        offset = len(header.encode('latin-1'))

        # Object 0 dummy
        xref.append("0000000000 65535 f \r\n")

        for obj in objects:
            xref.append(f"{offset:010d} 00000 n \r\n")
            body += obj
            offset += len(obj.encode('latin-1'))

        xref_offset = offset
        num_objects = len(objects) + 1
        xref_str = f"xref\n0 {num_objects}\n" + "".join(xref)
        trailer = (
            f"trailer\n"
            f"<< /Size {num_objects} /Root {catalog_id} 0 R >>\n"
            f"startxref\n{xref_offset}\n%%EOF\n"
        )

        with open(output_path, "wb") as f:
            f.write(header.encode('latin-1'))
            f.write(body.encode('latin-1'))
            f.write(xref_str.encode('latin-1'))
            f.write(trailer.encode('latin-1'))

        print(f"PDF successfully written to {output_path} ({os.path.getsize(output_path)} bytes)")

# Test SimplePDF
pdf = SimplePDF()
pdf.add_page()
pdf.set_fill_color(0.54, 0.20, 0.11) # #8a321b
pdf.rect(0, 750, 612, 42, fill=True)
pdf.set_fill_color(1, 1, 1)
pdf.text(36, 765, "HEARTH & HARVEST", font="F2", size=18)
pdf.build("test.pdf")

