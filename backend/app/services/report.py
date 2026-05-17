"""PDF report generation for NeuroScan AI analysis results."""
from __future__ import annotations

import io
from datetime import date, datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.utils import simpleSplit
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfgen import canvas as pdf_canvas

# ── Palette ───────────────────────────────────────────────────────────────────
_NAVY       = colors.HexColor('#1a237e')   # dark indigo title / accents
_NAVY_MID   = colors.HexColor('#283593')
_GRAY_800   = colors.HexColor('#212121')
_GRAY_700   = colors.HexColor('#424242')
_GRAY_500   = colors.HexColor('#9e9e9e')
_GRAY_300   = colors.HexColor('#e0e0e0')
_GRAY_100   = colors.HexColor('#f5f5f5')
_WHITE      = colors.white
_BLUE_50    = colors.HexColor('#e3f2fd')
_BLUE_200   = colors.HexColor('#90caf9')
_BLUE_700   = colors.HexColor('#1565c0')

# Result-specific colours (solid, light-bg, bar-fill)
_RC = {
    'CN':  colors.HexColor('#2e7d32'),
    'MCI': colors.HexColor('#e65100'),
    'AD':  colors.HexColor('#b71c1c'),
}
_RL = {
    'CN':  colors.HexColor('#f1f8e9'),
    'MCI': colors.HexColor('#fff8e1'),
    'AD':  colors.HexColor('#ffebee'),
}
_RB = {
    'CN':  colors.HexColor('#43a047'),
    'MCI': colors.HexColor('#fb8c00'),
    'AD':  colors.HexColor('#e53935'),
}
_RF = {
    'CN':  'Cognitively Normal',
    'MCI': 'Mild Cognitive Impairment',
    'AD':  "Alzheimer's Disease",
}
_CLINICAL = {
    'CN': (
        "No significant markers of Alzheimer's disease were detected in this analysis. "
        "The patient's cognitive biomarkers and imaging data fall within normal ranges "
        "for their age group. Regular monitoring and follow-up assessments are still "
        "recommended as part of routine clinical care."
    ),
    'MCI': (
        "Mild cognitive impairment was detected. This may represent an early transitional "
        "stage between normal aging and more significant cognitive decline. Patients with MCI "
        "carry an elevated risk of progressing to Alzheimer's disease. Close clinical "
        "monitoring, neuropsychological evaluation, and lifestyle interventions are strongly "
        "recommended."
    ),
    'AD': (
        "Significant markers consistent with Alzheimer's disease were detected in this "
        "analysis. The imaging and biomarker patterns indicate neurodegeneration consistent "
        "with Alzheimer's pathology. Immediate consultation with a neurologist or geriatric "
        "specialist is strongly advised. Early intervention strategies should be discussed "
        "with the patient and their caregivers."
    ),
}


def _calc_age(dob: date) -> int:
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


def generate_report_pdf(
    *,
    analysis_id: str,
    patient_name: str,
    patient_dob: date | None,
    patient_gender: str,
    analysis_date: datetime | None,
    result: str,
    confidence_score: float,
    feature_importance: dict | None,
    mri_used: bool,
    doctor_name: str = "",
) -> bytes:
    """Return a professional A4 PDF report as bytes."""

    buf = io.BytesIO()
    W, H = A4           # 595.27 × 841.89 pt
    MAR = 20 * mm       # 56.69 pt — left & right margin
    CW  = W - 2 * MAR   # 481.89 pt — usable content width

    cv = pdf_canvas.Canvas(buf, pagesize=A4)
    cv.setTitle(f"NeuroScan AI — {result} — {patient_name}")
    cv.setAuthor("NeuroScan AI")
    cv.setSubject("Alzheimer's Disease AI Analysis Report")

    rc = _RC.get(result, _GRAY_500)   # result solid colour
    rl = _RL.get(result, _GRAY_100)   # result light tint
    rb = _RB.get(result, _GRAY_300)   # result bar colour
    rf = _RF.get(result, result)      # result full name

    # ── Low-level drawing helpers ─────────────────────────────────────────────

    def filled_rect(x, y, w, h, fill_clr, radius=0):
        """Filled rectangle, no stroke."""
        if w <= 0 or h <= 0:
            return
        cv.saveState()
        cv.setFillColor(fill_clr)
        if radius > 0:
            cv.roundRect(x, y, w, h, min(radius, w / 2, h / 2), fill=1, stroke=0)
        else:
            cv.rect(x, y, w, h, fill=1, stroke=0)
        cv.restoreState()

    def stroked_rect(x, y, w, h, stroke_clr, stroke_w=0.5, radius=0):
        """Outlined rectangle, no fill."""
        if w <= 0 or h <= 0:
            return
        cv.saveState()
        cv.setStrokeColor(stroke_clr)
        cv.setLineWidth(stroke_w)
        if radius > 0:
            cv.roundRect(x, y, w, h, min(radius, w / 2, h / 2), fill=0, stroke=1)
        else:
            cv.rect(x, y, w, h, fill=0, stroke=1)
        cv.restoreState()

    def hline(y_pos, x1=None, x2=None, clr=_GRAY_300, sw=0.5):
        cv.saveState()
        cv.setStrokeColor(clr)
        cv.setLineWidth(sw)
        cv.line(x1 or MAR, y_pos, x2 or (W - MAR), y_pos)
        cv.restoreState()

    def vline(x_pos, y_top, y_bot, clr=_GRAY_300, sw=0.5):
        cv.saveState()
        cv.setStrokeColor(clr)
        cv.setLineWidth(sw)
        cv.line(x_pos, y_top, x_pos, y_bot)
        cv.restoreState()

    def t(s, x, y, font='Helvetica', sz=10, clr=_GRAY_800, align='left'):
        """Single-line text helper."""
        cv.saveState()
        cv.setFillColor(clr)
        cv.setFont(font, sz)
        if align == 'center':
            cv.drawCentredString(x, y, s)
        elif align == 'right':
            cv.drawRightString(x, y, s)
        else:
            cv.drawString(x, y, s)
        cv.restoreState()

    def wrapped(s, x, y, max_w, font='Helvetica', sz=10, clr=_GRAY_800, leading=14):
        """Wrapped paragraph; returns y after the last line."""
        cv.saveState()
        cv.setFillColor(clr)
        cv.setFont(font, sz)
        for line in simpleSplit(s, font, sz, max_w):
            cv.drawString(x, y, line)
            y -= leading
        cv.restoreState()
        return y

    def pbar(x, y, w, h, frac, track_clr=_GRAY_300, fill_clr=_GRAY_500):
        """Horizontal progress bar with rounded ends."""
        r = h / 2
        filled_rect(x, y, w, h, track_clr, radius=r)
        fw = w * max(0.0, min(1.0, frac))
        if fw > 0:
            filled_rect(x, y, fw, h, fill_clr, radius=min(r, fw / 2))

    def sec_title(label, y):
        """
        Draw a section heading and return the y coordinate where content begins.
        Label sits at baseline=y; a thin rule is drawn 1mm below the descender line.
        Content starts 4mm below the rule.
        """
        t(label, MAR, y, font='Helvetica-Bold', sz=9, clr=_NAVY)
        rule_y = y - 4 * mm
        hline(rule_y, clr=_GRAY_300, sw=0.5)
        return rule_y - 4 * mm    # content start

    # ─────────────────────────────────────────────────────────────────────────
    # 1.  TOP BORDER  (4 pt dark-navy strip across full page width)
    # ─────────────────────────────────────────────────────────────────────────
    filled_rect(0, H - 4, W, 4, _NAVY)

    # ─────────────────────────────────────────────────────────────────────────
    # 2.  HEADER  (white background, no fill needed — page is white by default)
    # ─────────────────────────────────────────────────────────────────────────
    y = H - 4   # just below the top border

    # "NeuroScan AI" as a SINGLE string — avoids any letter-overlap issue
    t("NeuroScan AI",
      MAR, y - 14 * mm,
      font='Helvetica-Bold', sz=24, clr=_NAVY)

    t("AI-Powered Neuroimaging Analysis Report",
      MAR, y - 21 * mm,
      font='Helvetica', sz=9.5, clr=_GRAY_500)

    # Right-side info block (stacked, right-aligned)
    now_str = datetime.now().strftime("%d %B %Y  %H:%M")
    t(f"Generated: {now_str}",
      W - MAR, y - 9 * mm,
      font='Helvetica', sz=8.5, clr=_GRAY_500, align='right')
    t(f"Report ID: {analysis_id[:8].upper()}",
      W - MAR, y - 15 * mm,
      font='Helvetica-Bold', sz=8.5, clr=_GRAY_700, align='right')
    if doctor_name:
        t(f"Physician: Dr. {doctor_name}",
          W - MAR, y - 21 * mm,
          font='Helvetica', sz=8.5, clr=_GRAY_500, align='right')

    y -= 25 * mm
    hline(y, clr=_GRAY_500, sw=0.7)   # solid divider below header
    y -= 5 * mm

    # ─────────────────────────────────────────────────────────────────────────
    # 3.  PATIENT INFORMATION  (light-gray box, 4 columns)
    # ─────────────────────────────────────────────────────────────────────────
    PI_H    = 20 * mm
    PI_PAD  = 4 * mm

    filled_rect(MAR, y - PI_H, CW, PI_H, _GRAY_100, radius=3)
    stroked_rect(MAR, y - PI_H, CW, PI_H, _GRAY_300, stroke_w=0.5, radius=3)

    dob_str    = patient_dob.strftime("%d %b %Y") if patient_dob else "N/A"
    age_str    = f"(age {_calc_age(patient_dob)})" if patient_dob else ""
    gender_str = patient_gender.title() if patient_gender else "N/A"
    adate_str  = analysis_date.strftime("%d %b %Y") if analysis_date else "N/A"

    col_w = CW / 4
    for i, (lbl, val) in enumerate([
        ("PATIENT NAME",  patient_name),
        ("DATE OF BIRTH", f"{dob_str} {age_str}".strip()),
        ("GENDER",        gender_str),
        ("ANALYSIS DATE", adate_str),
    ]):
        cx = MAR + PI_PAD + i * col_w
        t(lbl, cx, y - 6 * mm,  font='Helvetica', sz=6.5, clr=_GRAY_500)
        t(val, cx, y - 12 * mm, font='Helvetica-Bold', sz=9, clr=_GRAY_800)

    y -= PI_H + 6 * mm

    # ─────────────────────────────────────────────────────────────────────────
    # 4.  DIAGNOSIS RESULT
    # ─────────────────────────────────────────────────────────────────────────
    y = sec_title("DIAGNOSIS RESULT", y)

    DIAG_H   = 34 * mm
    BORDER_W = 5       # pt — left accent bar

    # Light tint background
    filled_rect(MAR + BORDER_W, y - DIAG_H, CW - BORDER_W, DIAG_H, rl)
    # Outer border (thin)
    stroked_rect(MAR + BORDER_W, y - DIAG_H, CW - BORDER_W, DIAG_H, _GRAY_300, 0.5)
    # Coloured left accent bar
    filled_rect(MAR, y - DIAG_H, BORDER_W, DIAG_H, rc)

    # ── Large abbreviation (left side of box)
    ABBREV_SZ = 48
    abbrev_x  = MAR + BORDER_W + 6 * mm
    t(result, abbrev_x, y - 24 * mm, font='Helvetica-Bold', sz=ABBREV_SZ, clr=rc)

    # ── Full name + subtitle (next to abbreviation)
    abbrev_w = pdfmetrics.stringWidth(result, 'Helvetica-Bold', ABBREV_SZ)
    label_x  = abbrev_x + abbrev_w + 6 * mm
    t(rf,                   label_x, y - 11 * mm, font='Helvetica-Bold', sz=13, clr=_GRAY_800)
    t("AI Model Classification", label_x, y - 17 * mm, font='Helvetica', sz=9, clr=_GRAY_500)

    # ── Confidence bar (right side)
    CBAR_W = 48 * mm
    cbar_x  = W - MAR - BORDER_W - CBAR_W - 5 * mm
    t("Model Confidence",
      cbar_x, y - 10 * mm,
      font='Helvetica', sz=8, clr=_GRAY_500)
    t(f"{confidence_score * 100:.1f}%",
      cbar_x + CBAR_W, y - 10 * mm,
      font='Helvetica-Bold', sz=10, clr=rc, align='right')
    pbar(cbar_x, y - 17 * mm, CBAR_W, 4 * mm, confidence_score, _GRAY_300, rb)
    # Tick labels 0 % / 100 %
    t("0%",   cbar_x,           y - 22 * mm, font='Helvetica', sz=6.5, clr=_GRAY_500)
    t("100%", cbar_x + CBAR_W,  y - 22 * mm, font='Helvetica', sz=6.5, clr=_GRAY_500, align='right')

    y -= DIAG_H + 7 * mm

    # ─────────────────────────────────────────────────────────────────────────
    # 5.  CLASS PROBABILITY DISTRIBUTION
    # ─────────────────────────────────────────────────────────────────────────
    y = sec_title("CLASS PROBABILITY DISTRIBUTION", y)

    if feature_importance and any(k in feature_importance for k in ('CN', 'MCI', 'AD')):
        rows = [(c, float(feature_importance.get(c, 0))) for c in ('CN', 'MCI', 'AD')]
    else:
        rest = (1.0 - confidence_score) / 2.0
        rows = [(c, confidence_score if c == result else rest) for c in ('CN', 'MCI', 'AD')]

    CLS_LBL_W = 10 * mm   # abbreviation column
    NAME_W    = 44 * mm   # full-name column
    PCT_W     = 12 * mm   # percentage column
    PROB_BAR_W = CW - CLS_LBL_W - NAME_W - PCT_W - 6 * mm

    for cls, prob in rows:
        cc = _RC[cls]
        cr = _RB[cls]
        # Abbreviation (bold, coloured)
        t(cls, MAR, y - 2 * mm, font='Helvetica-Bold', sz=10, clr=cc)
        # Full name (gray)
        t(_RF[cls], MAR + CLS_LBL_W, y - 2 * mm, font='Helvetica', sz=8.5, clr=_GRAY_500)
        # Bar
        bar_x = MAR + CLS_LBL_W + NAME_W
        pbar(bar_x, y - 5 * mm, PROB_BAR_W, 5 * mm, prob, _GRAY_300, cr)
        # Percentage
        t(f"{prob * 100:.1f}%",
          bar_x + PROB_BAR_W + 3 * mm, y - 2 * mm,
          font='Helvetica-Bold', sz=9, clr=cc)
        y -= 10 * mm

    y -= 4 * mm

    # ─────────────────────────────────────────────────────────────────────────
    # 6.  ANALYSIS DETAILS  (two-column with vertical divider)
    # ─────────────────────────────────────────────────────────────────────────
    y = sec_title("ANALYSIS DETAILS", y)

    HALF = (CW - 6 * mm) / 2   # each column width
    DIV_X = MAR + HALF + 3 * mm   # x position of vertical divider

    if mri_used:
        left_rows = [
            ("Model Name",    "Memory3DCNNTransformer"),
            ("Architecture",  "3D CNN + Transformer Encoder"),
            ("Input Format",  "NIfTI (.nii / .nii.gz)"),
            ("Resolution",    "64 x 64 x 64 voxels"),
            ("Parameters",    "~1.1M trainable"),
        ]
        right_steps = [
            "Load NIfTI volume (nibabel)",
            "Otsu skull stripping + binary closing",
            "Bounding-box crop",
            "Spatial resize to 64×64×64",
            "Intensity normalisation (z-score)",
        ]
    else:
        left_rows = [
            ("Model Name",   "XGBoost Gradient Boosting"),
            ("Framework",    "scikit-learn / XGBoost"),
            ("Input Format", "CSV biomarker table"),
            ("Features",     "Age, Sex, Field Strength, Slices"),
            ("Missing Data", "Median imputation"),
        ]
        right_steps = [
            "Column validation and mapping",
            "Sex / gender encoding (M=0, F=1)",
            "NaN imputation (column medians)",
            "Feature array construction",
            "XGBoost predict_proba inference",
        ]

    # Left column: labelled key-value pairs
    y_left = y
    for lbl, val in left_rows:
        t(lbl.upper(), MAR, y_left,          font='Helvetica',      sz=6.5, clr=_GRAY_500)
        t(val,         MAR, y_left - 4.5*mm, font='Helvetica-Bold', sz=8.5, clr=_GRAY_800)
        y_left -= 11 * mm

    # Right column: "Preprocessing Pipeline" heading + numbered steps
    right_x = DIV_X + 4 * mm
    y_right = y
    t("Preprocessing Pipeline", right_x, y_right,
      font='Helvetica-Bold', sz=8.5, clr=_GRAY_800)
    y_right -= 6 * mm
    for i, step in enumerate(right_steps, 1):
        t(f"{i}.",  right_x,           y_right, font='Helvetica-Bold', sz=8, clr=_NAVY)
        t(step,     right_x + 6*mm,    y_right, font='Helvetica',      sz=8, clr=_GRAY_700)
        y_right -= 5.5 * mm

    # Vertical divider spanning both columns
    y_bottom = min(y_left, y_right)
    vline(DIV_X, y, y_bottom, clr=_GRAY_300, sw=0.5)

    y = y_bottom - 5 * mm

    # ─────────────────────────────────────────────────────────────────────────
    # 7.  CLINICAL INTERPRETATION  (light-blue tinted box)
    # ─────────────────────────────────────────────────────────────────────────
    interp      = _CLINICAL.get(result, "")
    interp_lines = simpleSplit(interp, 'Helvetica', 9.5, CW - 10 * mm)
    CI_H = len(interp_lines) * 5.5 * mm + 14 * mm   # lines + title row + padding

    filled_rect(MAR, y - CI_H, CW, CI_H, _BLUE_50, radius=3)
    stroked_rect(MAR, y - CI_H, CW, CI_H, _BLUE_200, stroke_w=0.8, radius=3)

    # Small filled square acts as a visual "icon" bullet
    filled_rect(MAR + 4*mm, y - 7*mm, 3*mm, 3*mm, _BLUE_700)
    t("Clinical Interpretation",
      MAR + 9 * mm, y - 6.5 * mm,
      font='Helvetica-Bold', sz=10, clr=_BLUE_700)

    wrapped(interp,
            MAR + 5 * mm, y - 13 * mm,
            CW - 10 * mm,
            font='Helvetica', sz=9.5, clr=_GRAY_800, leading=5.5 * mm)

    y -= CI_H + 5 * mm

    # ─────────────────────────────────────────────────────────────────────────
    # 8.  DISCLAIMER  (outlined box, italic text)
    # ─────────────────────────────────────────────────────────────────────────
    DISC = (
        "This report is generated by an AI model for research and clinical decision-support "
        "purposes only. It does not constitute a medical diagnosis and must not replace "
        "professional clinical judgment. Results must be interpreted by a qualified "
        "neurologist or physician. NeuroScan AI is not a certified medical device."
    )
    disc_lines = simpleSplit(DISC, 'Helvetica-Oblique', 8, CW - 10 * mm)
    DISC_H = len(disc_lines) * 4.5 * mm + 12 * mm

    stroked_rect(MAR, y - DISC_H, CW, DISC_H, _GRAY_500, stroke_w=0.5)

    t("(!)  MEDICAL DISCLAIMER",
      MAR + 4 * mm, y - 6 * mm,
      font='Helvetica-Bold', sz=8.5, clr=colors.HexColor('#bf360c'))

    # Draw italic disclaimer lines manually (simpleSplit already done above)
    cv.saveState()
    cv.setFillColor(_GRAY_700)
    cv.setFont('Helvetica-Oblique', 8)
    ty = y - 12 * mm
    for line in disc_lines:
        cv.drawString(MAR + 4 * mm, ty, line)
        ty -= 4.5 * mm
    cv.restoreState()

    # ─────────────────────────────────────────────────────────────────────────
    # 9.  FOOTER  (fixed at bottom of page)
    # ─────────────────────────────────────────────────────────────────────────
    hline(14 * mm, clr=_GRAY_500, sw=0.5)
    t("NeuroScan AI  |  Confidential",
      MAR, 9 * mm,
      font='Helvetica', sz=7.5, clr=_GRAY_500)
    t("AI-Assisted Neuroimaging Analysis",
      W / 2, 9 * mm,
      font='Helvetica', sz=7.5, clr=_GRAY_500, align='center')
    t("Page 1 of 1",
      W - MAR, 9 * mm,
      font='Helvetica', sz=7.5, clr=_GRAY_500, align='right')

    cv.save()
    return buf.getvalue()
