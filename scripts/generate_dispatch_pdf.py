#!/usr/bin/env python3
"""
generate_dispatch_pdf.py
Reads dispatch JSON from stdin, writes PDF bytes to stdout.
Usage: echo '<json>' | python3 generate_dispatch_pdf.py
"""
import sys
import json
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.utils import simpleSplit
import io

# ── Page / layout constants ───────────────────────────────────────────────────
PW, PH = 595.2, 841.8
L = 27.2        # left margin x
W = 540.2       # usable width

# ── Colors (extracted from source PDF) ───────────────────────────────────────
NAV   = HexColor("#001F60")
LGRAY = HexColor("#EFEFEF")
LGRAY2= HexColor("#F8F9FA")
WHITE = colors.white
BLACK = colors.black
GRID  = HexColor("#CCCCCC")

# ── Helpers ───────────────────────────────────────────────────────────────────
def cy(top):
    """Convert pdfplumber top-coord to canvas y-coord."""
    return PH - top

def fill_rect(c, x0, top, x1, bot, fill=WHITE, stroke=BLACK, lw=0.4):
    c.setStrokeColor(stroke)
    c.setFillColor(fill)
    c.setLineWidth(lw)
    c.rect(x0, cy(bot), x1 - x0, bot - top, fill=1, stroke=1)

def hline(c, x0, x1, top, lw=0.25, color=GRID):
    c.setStrokeColor(color)
    c.setLineWidth(lw)
    c.line(x0, cy(top), x1, cy(top))

def vline(c, x, top, bot, lw=0.25, color=GRID):
    c.setStrokeColor(color)
    c.setLineWidth(lw)
    c.line(x, cy(top), x, cy(bot))

def cell_text(c, txt, x, top, bot, size=7, bold=False, align="left",
              color=BLACK, italic=False, wrap_w=None):
    """Draw text vertically centred in a cell row."""
    if not txt:
        return
    fn = "Helvetica-Bold" if bold else ("Helvetica-Oblique" if italic else "Helvetica")
    c.setFont(fn, size)
    c.setFillColor(color)
    mid_y = cy(top) - (bot - top) / 2 + size * 0.35

    if wrap_w:
        lines = simpleSplit(str(txt), fn, size, wrap_w - 4)
        total_h = len(lines) * (size + 1.5)
        start_y = cy(top) - (bot - top) / 2 + total_h / 2 - (size + 1.5) + size * 0.35
        for i, line in enumerate(lines):
            if align == "center":
                c.drawCentredString(x + wrap_w / 2, start_y - i * (size + 1.5), line)
            elif align == "right":
                c.drawRightString(x + wrap_w - 2, start_y - i * (size + 1.5), line)
            else:
                c.drawString(x + 2, start_y - i * (size + 1.5), line)
    else:
        if align == "center":
            c.drawCentredString(x, mid_y, str(txt))
        elif align == "right":
            c.drawRightString(x, mid_y, str(txt))
        else:
            c.drawString(x, mid_y, str(txt))

def trunc(val, max_w, fn="Helvetica", size=7):
    """Truncate string to fit within max_w pts."""
    if not val:
        return ""
    val = str(val)
    from reportlab.pdfbase.pdfmetrics import stringWidth
    while len(val) > 1 and stringWidth(val, fn, size) > max_w - 4:
        val = val[:-1]
    return val

def fmt_date(val):
    if not val:
        return ""
    # val is YYYY-MM-DD, return as-is or reformat
    try:
        from datetime import datetime
        return datetime.strptime(val, "%Y-%m-%d").strftime("%b %d, %Y")
    except Exception:
        return str(val)

def val(d, *keys, default=""):
    """Safe nested dict access."""
    for k in keys:
        if isinstance(d, dict):
            d = d.get(k)
        else:
            return default
    return d if d is not None else default

TRANSPORT_LABELS = {
    "public_conveyance":     "Public Conveyance",
    "test_applicant_vehicle":"Test Applicant Vehicle",
    "college_vehicle":       "College Vehicle",
    "other":                 "Other",
}

CHECK = "☒"   # checked box
UNCHECK = "☐" # unchecked box

# ═════════════════════════════════════════════════════════════════════════════
# MAIN DRAW FUNCTION
# ═════════════════════════════════════════════════════════════════════════════
def generate(dispatch: dict) -> bytes:
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=(PW, PH))

    engineers   = dispatch.get("dispatch_engineers", [])
    technicians = dispatch.get("dispatch_technicians", [])
    instruments = dispatch.get("dispatch_instruments", [])
    itinerary   = dispatch.get("dispatch_itinerary", [])
    machines    = dispatch.get("dispatch_machines", [])

    eng_names  = ", ".join(e.get("profiles", {}).get("full_name", "") for e in engineers if e.get("profiles"))
    tech_names = ", ".join(t.get("profiles", {}).get("full_name", "") for t in technicians if t.get("profiles"))
    transport  = dispatch.get("transport_mode", "")
    transport_label = TRANSPORT_LABELS.get(transport, transport or "")

    dispatch_no = dispatch.get("dispatch_number") or ""
    date_from   = fmt_date(dispatch.get("date_from"))
    date_to     = fmt_date(dispatch.get("date_to"))
    location    = dispatch.get("testing_location") or dispatch.get("location") or ""
    company     = dispatch.get("company_name") or ""
    contact     = dispatch.get("contact_info") or ""
    notes       = dispatch.get("notes") or ""
    remarks     = dispatch.get("remarks_observation") or ""
    is_extended = dispatch.get("is_extended", False)
    ext_days    = dispatch.get("extended_days") or ""

    # ── TITLE ──────────────────────────────────────────────────────────────────
    fill_rect(c, 27.2, 17.7, 567.4, 29.2, fill=NAV, stroke=NAV)
    cell_text(c, "DISPATCH FORM", (27.2 + 567.4) / 2, 17.7, 29.2,
              size=7, bold=True, align="center", color=WHITE)

    # ── DISPATCH CONTROL NUMBER ROW ────────────────────────────────────────────
    fill_rect(c, 27.7, 29.2, 164.4, 51.1, fill=WHITE, stroke=BLACK, lw=0.4)
    cell_text(c, "Dispatch Control Number:", 30, 29.2, 40.2, size=7, bold=True)
    cell_text(c, "Date of Travel", 30, 40.2, 51.1, size=7, bold=True)

    fill_rect(c, 164.0, 28.7, 567.4, 40.2, fill=WHITE, stroke=BLACK, lw=0.4)
    cell_text(c, dispatch_no, 167, 28.7, 40.2, size=7)

    fill_rect(c, 164.0, 39.7, 207.9, 51.1, fill=LGRAY, stroke=BLACK, lw=0.4)
    cell_text(c, "DIS-", 167, 39.7, 51.1, size=7, bold=True)

    fill_rect(c, 207.9, 40.2, 567.4, 51.1, fill=WHITE, stroke=BLACK, lw=0.4)
    cell_text(c, date_from, 210, 40.2, 51.1, size=7)
    cell_text(c, "to", 285, 40.2, 51.1, size=7)
    cell_text(c, date_to, 300, 40.2, 51.1, size=7)

    # Extended checkbox
    ext_box = CHECK if is_extended else UNCHECK
    ext_txt = f"{ext_box} Extended until ____________"
    if is_extended and ext_days:
        ext_txt = f"{ext_box} Extended until ____________ ( {ext_days} days)"
    cell_text(c, ext_txt, 380, 40.2, 51.1, size=7)

    # ── LOCATION ROW ───────────────────────────────────────────────────────────
    fill_rect(c, 114.2, 50.7, 567.4, 62.1, fill=WHITE, stroke=BLACK, lw=0.4)
    cell_text(c, "Location of travel:", 117, 50.7, 62.1, size=7, bold=True)
    cell_text(c, location, 210, 50.7, 62.1, size=7, wrap_w=357)

    # ── ENGINEER / TECHNICIAN BLOCK ────────────────────────────────────────────
    fill_rect(c, 27.7, 51.1, 114.7, 121.4, fill=WHITE, stroke=BLACK, lw=0.4)
    cell_text(c, "Engineer/s:", 30, 62.1, 82.2, size=7, bold=True)
    cell_text(c, "Technician/s:", 30, 82.2, 121.4, size=7, bold=True)

    fill_rect(c, 114.7, 62.1, 331.8, 72.2, fill=WHITE, stroke=BLACK, lw=0.4)
    fill_rect(c, 331.3, 61.7, 567.4, 72.2, fill=LGRAY, stroke=BLACK, lw=0.4)
    fill_rect(c, 114.2, 71.7, 293.5, 82.2, fill=LGRAY, stroke=BLACK, lw=0.4)
    fill_rect(c, 293.5, 72.2, 331.8, 82.2, fill=WHITE, stroke=BLACK, lw=0.4)
    fill_rect(c, 331.3, 71.7, 567.4, 82.2, fill=LGRAY, stroke=BLACK, lw=0.4)
    fill_rect(c, 331.3, 81.7, 567.4, 93.2, fill=LGRAY, stroke=BLACK, lw=0.4)
    fill_rect(c, 114.7, 82.2, 331.8, 121.4, fill=WHITE, stroke=BLACK, lw=0.4)
    fill_rect(c, 331.8, 93.2, 567.4, 121.4, fill=WHITE, stroke=BLACK, lw=0.4)

    cell_text(c, eng_names, 117, 62.1, 82.2, size=7, wrap_w=452)
    cell_text(c, tech_names, 117, 82.2, 121.4, size=7, wrap_w=452)

    # ── INSTRUMENTS HEADER ─────────────────────────────────────────────────────
    inst_cols = [27.2, 114.7, 233.0, 290.0, 350.0, 415.0, 567.4]
    fill_rect(c, 27.2, 120.9, 114.7, 131.5, fill=WHITE, stroke=BLACK, lw=0.4)
    fill_rect(c, 114.7, 121.4, 567.4, 131.5, fill=WHITE, stroke=BLACK, lw=0.4)
    for x in inst_cols[1:-1]:
        vline(c, x, 120.9, 131.5, lw=0.4, color=BLACK)

    cell_text(c, "Instruments:", 30, 120.9, 131.5, size=7, bold=True)
    hdrs = [
        ("Instrument Code /\nBrand & Model", inst_cols[1], inst_cols[2]),
        ("Before Travel\n(Y/N)",             inst_cols[2], inst_cols[3]),
        ("Onsite/\nField\n(Y/N)",            inst_cols[3], inst_cols[4]),
        ("After Travel\n(Y/N)",              inst_cols[4], inst_cols[5]),
        ("Remarks",                          inst_cols[5], inst_cols[6]),
    ]
    for hdr, x0, x1 in hdrs:
        lines = hdr.split("\n")
        row_h = 131.5 - 120.9
        total_h = len(lines) * 8.5
        start_top = 120.9 + (row_h - total_h) / 2
        for li, line in enumerate(lines):
            cell_text(c, line, (x0 + x1) / 2, start_top + li * 8.5,
                      start_top + li * 8.5 + 8.5, size=7, bold=True, align="center")

    # ── INSTRUMENTS BODY (15 rows) ─────────────────────────────────────────────
    fill_rect(c, 27.7, 131.5, 567.4, 343.2, fill=WHITE, stroke=BLACK, lw=0.4)
    row_h = (343.2 - 131.5) / 15
    for i in range(14):
        hline(c, 27.7, 567.4, 131.5 + row_h * (i + 1), lw=0.25, color=GRID)
    for x in inst_cols[1:-1]:
        vline(c, x, 131.5, 343.2, lw=0.25, color=GRID)
    vline(c, inst_cols[1], 120.9, 343.2, lw=0.4, color=BLACK)

    for i, inst in enumerate(instruments[:15]):
        top = 131.5 + row_h * i
        bot = top + row_h
        col_ws = [(inst_cols[j+1] - inst_cols[j]) for j in range(len(inst_cols)-1)]

        name_val = inst.get("instrument_name") or ""
        code_val = inst.get("code_brand_model") or ""
        bef_val  = inst.get("before_travel") or ""
        rem_val  = inst.get("remarks") or ""

        cell_text(c, trunc(name_val, col_ws[0]), inst_cols[0] + 2, top, bot, size=6.5)
        cell_text(c, trunc(code_val, col_ws[1]), inst_cols[1] + 2, top, bot, size=6.5)
        cell_text(c, trunc(bef_val,  col_ws[2]), inst_cols[2] + 2, top, bot, size=6.5)
        # onsite/field and after travel — blank (not in DB currently)
        cell_text(c, trunc(rem_val,  col_ws[5]), inst_cols[5] + 2, top, bot, size=6.5)

    # ── PURPOSE ROW ────────────────────────────────────────────────────────────
    fill_rect(c, 27.2, 342.7, 567.4, 353.3, fill=WHITE, stroke=BLACK, lw=0.4)
    cell_text(c, "PURPOSE:", 30, 342.7, 353.3, size=7, bold=True)

    fill_rect(c, 27.2, 352.8, 567.4, 363.3, fill=LGRAY, stroke=BLACK, lw=0.4)

    # ── COMPANY ROW ────────────────────────────────────────────────────────────
    fill_rect(c, 27.7, 363.3, 567.4, 385.3, fill=WHITE, stroke=BLACK, lw=0.4)
    cell_text(c, "Company:", 30, 363.3, 385.3, size=7, bold=True)
    cell_text(c, company, 120, 363.3, 385.3, size=7, wrap_w=447)

    # ── TRANSPORT BLOCK ────────────────────────────────────────────────────────
    fill_rect(c, 27.7, 385.3, 114.7, 498.6, fill=WHITE, stroke=BLACK, lw=0.4)
    cell_text(c, "Contact Person/", 30, 385.3, 395.3, size=7, bold=True)
    cell_text(c, "Contact Information:", 30, 394.0, 404.0, size=7, bold=True)
    cell_text(c, "Mode of Transport:", 30, 407.0, 418.0, size=7, bold=True)
    cell_text(c, "Other Travel Details:", 30, 420.0, 498.6, size=7, bold=True)

    # Contact person cells
    fill_rect(c, 114.2, 384.8, 219.4, 396.3, fill=WHITE, stroke=BLACK, lw=0.4)
    fill_rect(c, 219.4, 385.3, 331.8, 396.3, fill=WHITE, stroke=BLACK, lw=0.4)
    fill_rect(c, 331.3, 384.8, 348.0, 396.3, fill=WHITE, stroke=BLACK, lw=0.4)
    fill_rect(c, 348.0, 385.3, 484.2, 396.3, fill=WHITE, stroke=BLACK, lw=0.4)
    fill_rect(c, 483.8, 384.8, 519.1, 396.3, fill=WHITE, stroke=BLACK, lw=0.4)
    fill_rect(c, 519.1, 385.3, 567.4, 396.3, fill=WHITE, stroke=BLACK, lw=0.4)
    cell_text(c, trunc(contact, 453), 117, 384.8, 396.3, size=7)

    # Main content area
    fill_rect(c, 114.7, 396.3, 567.4, 498.6, fill=WHITE, stroke=BLACK, lw=0.4)

    # Transport checkboxes
    transport_y1, transport_y2 = 406.5, 418.0
    modes = [
        ("public_conveyance",     "Public Conveyance",      120.0),
        ("test_applicant_vehicle","Test Applicant Vehicle",  225.0),
        ("college_vehicle",       "College Vehicle",         352.0),
        ("other",                 "Others: ______",          490.0),
    ]
    for mode_key, mode_label, xpos in modes:
        box = CHECK if transport == mode_key else UNCHECK
        cell_text(c, f"{box} {mode_label}", xpos, transport_y1, transport_y2, size=7)

    if transport == "other" and dispatch.get("transport_other_text"):
        cell_text(c, dispatch["transport_other_text"], 495, transport_y1, transport_y2, size=6.5)

    # Travel itinerary sub-table inside "Other Travel Details"
    itin_cols_x = [114.7, 152.0, 205.0, 230.0, 280.0, 330.0, 365.0, 435.0, 504.0, 537.0, 567.4]
    itin_top = 420.0
    itin_hdr1_bot = 430.0
    itin_hdr2_bot = 443.0
    itin_row_h = (498.6 - itin_hdr2_bot) / 5

    # Header row 1
    fill_rect(c, 114.7, itin_top, 567.4, itin_hdr2_bot, fill=LGRAY, stroke=BLACK, lw=0.4)
    for x in itin_cols_x[1:-1]:
        vline(c, x, itin_top, 498.6, lw=0.25, color=GRID)
    hline(c, 114.7, 567.4, itin_hdr1_bot, lw=0.25, color=GRID)
    hline(c, 114.7, 567.4, itin_hdr2_bot, lw=0.4, color=BLACK)

    c.setFont("Helvetica-Bold", 5.1)
    c.setFillColor(BLACK)
    c.drawCentredString((itin_cols_x[0]+itin_cols_x[1])/2, cy(426.0), "Date")
    c.drawCentredString((itin_cols_x[1]+itin_cols_x[5])/2, cy(424.0), "Per Diem")
    c.drawCentredString((itin_cols_x[5]+itin_cols_x[6])/2, cy(424.0), "Time of Travel")
    c.drawCentredString((itin_cols_x[6]+itin_cols_x[7])/2, cy(423.0), "Working/Productive")
    c.drawCentredString((itin_cols_x[6]+itin_cols_x[7])/2, cy(428.0), "Hours")
    c.drawCentredString((itin_cols_x[7]+itin_cols_x[9])/2, cy(424.0), "Overtime hours")

    c.drawCentredString((itin_cols_x[1]+itin_cols_x[2])/2, cy(437.0), "Accomodation")
    c.drawCentredString((itin_cols_x[2]+itin_cols_x[3])/2, cy(437.0), "B")
    c.drawCentredString((itin_cols_x[3]+itin_cols_x[4])/2, cy(437.0), "L")
    c.drawCentredString((itin_cols_x[4]+itin_cols_x[5])/2, cy(437.0), "D")
    c.drawCentredString((itin_cols_x[5]+itin_cols_x[6])/2, cy(436.0), "(00:00 to 00:00)")
    c.drawCentredString((itin_cols_x[6]+itin_cols_x[7])/2, cy(436.0), "(00:00 to 00:00)")
    c.drawCentredString((itin_cols_x[7]+itin_cols_x[8])/2, cy(437.0), "(For offset)")
    c.drawCentredString((itin_cols_x[8]+itin_cols_x[9])/2, cy(437.0), "(For billing)")

    c.setFont("Helvetica-Oblique", 4.2)
    c.drawString(itin_cols_x[1]+2, cy(431.5), "(Check (✓) if provided by the Test Applicant, otherwise cross mark (X), NA if not appplicable")

    # Itinerary data rows
    for i in range(5):
        row_top = itin_hdr2_bot + itin_row_h * i
        row_bot = row_top + itin_row_h
        hline(c, 114.7, 567.4, row_bot, lw=0.25, color=GRID)

        if i < len(itinerary):
            row = itinerary[i]
            vals = [
                row.get("travel_date") or "",
                row.get("per_diem_accommodation") or "",
                row.get("per_diem_b") or "",
                row.get("per_diem_l") or "",
                row.get("per_diem_d") or "",
                row.get("time_of_travel") or "",
                row.get("working_hours") or "",
                row.get("overtime_offset") or "",
                row.get("overtime_billing") or "",
            ]
            for ci, v in enumerate(vals):
                if v:
                    x0 = itin_cols_x[ci]
                    x1 = itin_cols_x[ci + 1]
                    cell_text(c, trunc(str(v), x1-x0), x0+2, row_top, row_bot, size=6)

    # ── TRAVEL ITINERARY LABEL ROW ─────────────────────────────────────────────
    fill_rect(c, 27.2, 498.1, 567.4, 526.8, fill=NAV, stroke=NAV)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 7)
    c.drawString(30, cy(512.0), "Travel Itinerary:")
    # (column header labels on navy background)
    itin_nav_cols = [114.7, 152.0, 205.0, 230.0, 280.0, 330.0, 365.0, 435.0, 504.0, 537.0, 567.4]
    c.setFont("Helvetica-Bold", 5.1)
    c.setFillColor(WHITE)
    c.drawCentredString((itin_nav_cols[0]+itin_nav_cols[1])/2, cy(505.0), "Date")
    c.drawCentredString((itin_nav_cols[1]+itin_nav_cols[5])/2, cy(503.0), "Per Diem")
    c.drawCentredString((itin_nav_cols[5]+itin_nav_cols[6])/2, cy(504.0), "Time of Travel")
    c.drawCentredString((itin_nav_cols[6]+itin_nav_cols[7])/2, cy(503.0), "Working/Productive")
    c.drawCentredString((itin_nav_cols[6]+itin_nav_cols[7])/2, cy(509.0), "Hours")
    c.drawCentredString((itin_nav_cols[7]+itin_nav_cols[9])/2, cy(504.0), "Overtime hours")
    c.drawCentredString((itin_nav_cols[1]+itin_nav_cols[2])/2, cy(515.0), "Accomodation")
    c.drawCentredString((itin_nav_cols[2]+itin_nav_cols[3])/2, cy(515.0), "B")
    c.drawCentredString((itin_nav_cols[3]+itin_nav_cols[4])/2, cy(515.0), "L")
    c.drawCentredString((itin_nav_cols[4]+itin_nav_cols[5])/2, cy(515.0), "D")
    c.drawCentredString((itin_nav_cols[5]+itin_nav_cols[6])/2, cy(515.0), "(00:00 to 00:00)")
    c.drawCentredString((itin_nav_cols[6]+itin_nav_cols[7])/2, cy(515.0), "(00:00 to 00:00)")
    c.drawCentredString((itin_nav_cols[7]+itin_nav_cols[8])/2, cy(515.0), "(For offset)")
    c.drawCentredString((itin_nav_cols[8]+itin_nav_cols[9])/2, cy(515.0), "(For billing)")

    c.setFont("Helvetica-Oblique", 4.2)
    c.setFillColor(WHITE)
    c.drawString(itin_nav_cols[1]+2, cy(510.5), "(Check (✓) if provided by Test Applicant, cross mark (X), NA if not applicable")

    c.setStrokeColor(WHITE)
    c.setLineWidth(0.25)
    for x in itin_nav_cols[1:-1]:
        c.line(x, cy(498.1), x, cy(526.8))
    c.line(27.2, cy(510.0), 567.4, cy(510.0))
    c.line(27.2, cy(521.0), 567.4, cy(521.0))

    # ── MACHINES ───────────────────────────────────────────────────────────────
    mach_cols = [27.7, 113.0, 219.4, 285.0, 330.0, 348.0, 422.1, 503.0, 567.4]

    fill_rect(c, 27.7, 526.8, 567.4, 537.8, fill=WHITE, stroke=BLACK, lw=0.4)
    cell_text(c, "Machines to be Tested:", 30, 526.8, 537.8, size=7, bold=True)

    # Machine body area (all overlapping rects from source)
    fill_rect(c, 27.7, 537.8, 219.4, 678.3, fill=WHITE, stroke=BLACK, lw=0.4)
    fill_rect(c, 218.9, 537.3, 348.0, 628.1, fill=WHITE, stroke=BLACK, lw=0.4)
    fill_rect(c, 348.0, 537.8, 567.4, 608.1, fill=WHITE, stroke=BLACK, lw=0.4)
    fill_rect(c, 347.5, 607.6, 422.1, 618.1, fill=WHITE, stroke=BLACK, lw=0.4)
    fill_rect(c, 422.1, 608.1, 567.4, 618.1, fill=WHITE, stroke=BLACK, lw=0.4)
    fill_rect(c, 348.0, 618.1, 567.4, 628.1, fill=WHITE, stroke=BLACK, lw=0.4)
    fill_rect(c, 219.4, 628.1, 567.4, 678.3, fill=WHITE, stroke=BLACK, lw=0.4)

    # Column headers
    mach_hdrs = ["TAM No.", "MACHINES", "BRAND", "MODEL", "Serial Number of Unit", "Date of Test", "Status (Y/N)"]
    for i, hdr in enumerate(mach_hdrs):
        cx_ = (mach_cols[i] + mach_cols[i+1]) / 2
        cell_text(c, hdr, cx_, 526.8, 537.8, size=7, bold=True, align="center")

    # Grid
    for x in mach_cols[1:-1]:
        vline(c, x, 526.8, 678.3, lw=0.25, color=GRID)
    mach_row_h = (678.3 - 537.8) / 8
    for i in range(7):
        hline(c, 27.7, 567.4, 537.8 + mach_row_h * (i + 1), lw=0.25, color=GRID)

    # Machine data
    for i, m in enumerate(machines[:8]):
        row_top = 537.8 + mach_row_h * i
        row_bot = row_top + mach_row_h
        col_data = [
            m.get("tam_no") or "",
            m.get("machine") or "",
            m.get("brand") or "",
            m.get("model") or "",
            m.get("serial_no") or "",
            fmt_date(m.get("date_of_test")) if m.get("date_of_test") else "",
            m.get("status") or "",
        ]
        for ci, v in enumerate(col_data):
            if v:
                x0 = mach_cols[ci]
                x1 = mach_cols[ci+1]
                cell_text(c, trunc(str(v), x1-x0), x0+2, row_top, row_bot, size=6.5)

    # ── REMARKS HEADER ─────────────────────────────────────────────────────────
    fill_rect(c, 27.2, 677.8, 567.4, 689.3, fill=NAV, stroke=NAV)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 7)
    c.drawString(30, cy(683.5), "Remarks/ Observations:")
    c.drawString(222, cy(683.5), "Notes:")

    # ── REMARKS BODY + SIGNATURES ──────────────────────────────────────────────
    fill_rect(c, 27.7, 689.3, 567.4, 812.6, fill=WHITE, stroke=BLACK, lw=0.4)
    vline(c, 219.4, 677.8, 812.6, lw=0.4, color=BLACK)

    # Remarks text
    if remarks:
        cell_text(c, remarks, 30, 689.3, 720.0, size=6.5, wrap_w=192)
    if notes:
        cell_text(c, notes, 222, 689.3, 720.0, size=6.5, wrap_w=348)

    # Signature labels
    sig_cols = [27.7, 164.0, 300.0, 430.0, 567.4]
    sig_labels = ["Approved by:", "Checked by:", "Equipment checked by:", "Encoded by:"]
    for i, lbl in enumerate(sig_labels):
        cell_text(c, lbl, sig_cols[i]+3, 721.6, 733.1, size=7, bold=True)

    # Signature lines
    sig_line_y = 780.4
    c.setStrokeColor(BLACK)
    c.setLineWidth(0.5)
    for i in range(4):
        c.line(sig_cols[i]+5, cy(sig_line_y), sig_cols[i+1]-5, cy(sig_line_y))

    # Names / roles
    names = [
        ("DR. ARTHUR L. FAJARDO", "AMTEC Director", True),
        ("Signature over Name", "Test Coordinator", False),
        ("Signature over Name", "Test Coordinator", False),
        ("Signature over Name", "Test Engineer", False),
    ]
    for i, (name1, role_lbl, is_bold) in enumerate(names):
        cx_ = (sig_cols[i] + sig_cols[i+1]) / 2
        c.setFont("Helvetica-Bold" if is_bold else "Helvetica", 7)
        c.setFillColor(BLACK)
        c.drawCentredString(cx_, cy(771.8), name1)
        c.setFont("Helvetica-Bold" if is_bold else "Helvetica", 7)
        c.drawCentredString(cx_, cy(782.8), role_lbl)

    # ── FOOTER ─────────────────────────────────────────────────────────────────
    fill_rect(c, 27.2, 812.2, 123.3, 823.6, fill=NAV, stroke=NAV)
    fill_rect(c, 122.9, 812.2, 567.4, 823.6, fill=LGRAY2, stroke=LGRAY2)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 6)
    c.drawString(29, cy(817.9), 'AMTEC-OP-F4, "Dispatch Form"')
    c.setFillColor(BLACK)
    c.setFont("Helvetica", 6)
    c.drawRightString(565, cy(817.9), "Date of Revision: 11/20/2024")

    c.save()
    return buf.getvalue()


if __name__ == "__main__":
    raw = sys.stdin.buffer.read()
    dispatch = json.loads(raw)
    pdf_bytes = generate(dispatch)
    sys.stdout.buffer.write(pdf_bytes)
