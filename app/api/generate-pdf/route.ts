// app/api/generate-pdf/route.ts
// Generates clean black/blue/white PDFs using Python + ReportLab
// Requires: pip install reportlab  (add to requirements.txt for Vercel)

import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { writeFile, readFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

// ── Python PDF generator (inlined) ───────────────────────
const PYTHON_SCRIPT = `
import sys, json, datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor
from reportlab.lib.units import mm
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak
)

BLACK    = HexColor("#0a0a0a")
BLUE     = HexColor("#1d4ed8")
BLUE_MID = HexColor("#3b82f6")
WHITE    = HexColor("#ffffff")
GRAY_50  = HexColor("#f8fafc")
GRAY_100 = HexColor("#f1f5f9")
GRAY_300 = HexColor("#cbd5e1")
GRAY_500 = HexColor("#64748b")
GRAY_700 = HexColor("#334155")

W, H = A4
M = 18 * mm

def S(name, **kw):
    base = dict(fontName="Helvetica", fontSize=10, leading=14,
                textColor=BLACK, spaceAfter=0, spaceBefore=0, leftIndent=0)
    base.update(kw)
    return ParagraphStyle(name, **base)

ST = {
    "co_name":     S("co_name", fontName="Helvetica-Bold", fontSize=26, leading=30, textColor=BLACK),
    "tagline":     S("tagline", fontSize=12, leading=17, textColor=GRAY_500),
    "cover_agent": S("cover_agent", fontName="Helvetica-Bold", fontSize=8, textColor=BLUE),
    "cover_date":  S("cover_date", fontSize=8, textColor=GRAY_500),
    "section_hd":  S("section_hd", fontName="Helvetica-Bold", fontSize=8, textColor=BLUE, leading=10),
    "body":        S("body", fontSize=10, leading=15, textColor=GRAY_700),
    "body_sm":     S("body_sm", fontSize=9, leading=13, textColor=GRAY_500),
    "kv_label":    S("kv_label", fontName="Helvetica-Bold", fontSize=7.5, textColor=GRAY_500, leading=9),
    "kv_value":    S("kv_value", fontName="Helvetica-Bold", fontSize=15, leading=18, textColor=BLACK),
    "bullet":      S("bullet", fontSize=9.5, leading=14, textColor=GRAY_700, leftIndent=10),
    "slide_num":   S("slide_num", fontName="Helvetica-Bold", fontSize=10, textColor=BLUE),
    "slide_title": S("slide_title", fontName="Helvetica-Bold", fontSize=10, textColor=BLACK),
    "slide_body":  S("slide_body", fontSize=9, leading=13, textColor=GRAY_500),
    "pack_phase":  S("pack_phase", fontName="Helvetica-Bold", fontSize=8, textColor=BLUE, leading=10),
    "pack_title":  S("pack_title", fontName="Helvetica-Bold", fontSize=9.5, textColor=BLACK, leading=12),
    "pack_prompt": S("pack_prompt", fontSize=9, leading=13, textColor=GRAY_700, fontName="Courier", leftIndent=8),
}

def rule(color=GRAY_300, t=0.4):
    return HRFlowable(width="100%", thickness=t, color=color, spaceAfter=0, spaceBefore=0)

def sec(title):
    return [Spacer(1, 12), Paragraph(title.upper(), ST["section_hd"]),
            rule(BLUE, 0.8), Spacer(1, 8)]

def bullets(items, sym="->"):
    out = []
    for item in (items or []):
        out.append(Paragraph(f"{sym}  {item}", ST["bullet"]))
        out.append(Spacer(1, 3))
    return out

def kv_row(pairs):
    cw = (W - 2*M) / len(pairs)
    top = [Paragraph(l, ST["kv_label"]) for l, v in pairs]
    bot = [Paragraph(str(v or "-"), ST["kv_value"]) for l, v in pairs]
    t = Table([top, bot], colWidths=[cw]*len(pairs))
    t.setStyle(TableStyle([
        ("ALIGN",(0,0),(-1,-1),"LEFT"), ("VALIGN",(0,0),(-1,-1),"TOP"),
        ("TOPPADDING",(0,0),(-1,-1),0), ("BOTTOMPADDING",(0,0),(-1,-1),0),
        ("LEFTPADDING",(0,0),(-1,-1),0), ("RIGHTPADDING",(0,0),(-1,-1),4),
    ]))
    return t

def comp_table(comps):
    cw = W - 2*M
    hdr = [Paragraph(h, ST["kv_label"]) for h in ["COMPETITOR","WEAKNESS","HOW WE WIN"]]
    rows = [hdr] + [
        [Paragraph(f"<b>{c.get('name','')}</b>", ST["body_sm"]),
         Paragraph(c.get("weakness",""), ST["body_sm"]),
         Paragraph(c.get("howWeWin",""), ST["body_sm"])]
        for c in comps
    ]
    t = Table(rows, colWidths=[cw*0.20, cw*0.40, cw*0.40])
    t.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,0), GRAY_100),
        ("ROWBACKGROUNDS",(0,1),(-1,-1),[WHITE, GRAY_50]),
        ("LINEBELOW",(0,0),(-1,-1),0.3, GRAY_300),
        ("ALIGN",(0,0),(-1,-1),"LEFT"), ("VALIGN",(0,0),(-1,-1),"TOP"),
        ("TOPPADDING",(0,0),(-1,-1),7), ("BOTTOMPADDING",(0,0),(-1,-1),7),
        ("LEFTPADDING",(0,0),(-1,-1),7), ("RIGHTPADDING",(0,0),(-1,-1),7),
    ]))
    return t

def phase_row(label, text, color):
    t = Table(
        [[Paragraph(label, ParagraphStyle("ph_lbl", fontName="Helvetica-Bold",
                    fontSize=7.5, textColor=color, leading=9, leftIndent=0)),
          Paragraph(text or "", ST["body"])]],
        colWidths=[22*mm, W-2*M-22*mm]
    )
    t.setStyle(TableStyle([
        ("VALIGN",(0,0),(-1,-1),"TOP"),
        ("TOPPADDING",(0,0),(-1,-1),8), ("BOTTOMPADDING",(0,0),(-1,-1),8),
        ("LEFTPADDING",(0,0),(-1,-1),0), ("RIGHTPADDING",(0,0),(-1,-1),0),
        ("LINEBELOW",(0,0),(-1,-1),0.3, GRAY_100),
    ]))
    return t

def cover_meta(agent_label):
    meta = Table(
        [[Paragraph("ARTENO", ST["cover_agent"]),
          Paragraph(datetime.date.today().strftime("%B %d, %Y"), ST["cover_date"])]],
        colWidths=[(W-2*M)*0.5, (W-2*M)*0.5]
    )
    meta.setStyle(TableStyle([
        ("LEFTPADDING",(0,0),(-1,-1),0), ("TOPPADDING",(0,0),(-1,-1),0),
        ("BOTTOMPADDING",(0,0),(-1,-1),0),
    ]))
    return meta

def on_cover(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(BLUE)
    canvas.rect(0, H-12*mm, W, 12*mm, fill=1, stroke=0)
    canvas.setStrokeColor(GRAY_300); canvas.setLineWidth(0.4)
    canvas.line(M, 13*mm, W-M, 13*mm)
    canvas.setFont("Helvetica", 7.5); canvas.setFillColor(GRAY_300)
    canvas.drawString(M, 9*mm, "arteno.ai")
    canvas.restoreState()

def on_page(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(GRAY_300); canvas.setLineWidth(0.4)
    canvas.line(M, 13*mm, W-M, 13*mm)
    canvas.setFont("Helvetica", 7.5); canvas.setFillColor(GRAY_300)
    canvas.drawString(M, 9*mm, "arteno.ai")
    canvas.drawRightString(W-M, 9*mm, f"Page {doc.page}")
    canvas.restoreState()

def make_cover(s, agent_label, title, subtitle):
    s.append(Spacer(1, 30*mm))
    s.append(Paragraph(agent_label, ST["cover_agent"]))
    s.append(Spacer(1, 8))
    s.append(Paragraph(title, ST["co_name"]))
    s.append(Spacer(1, 6))
    s.append(Paragraph(subtitle, ST["tagline"]))
    s.append(Spacer(1, 14))
    s.append(rule(GRAY_300))
    s.append(Spacer(1, 8))
    s.append(cover_meta(agent_label))
    s.append(PageBreak())

def new_doc(path):
    return SimpleDocTemplate(path, pagesize=A4,
        leftMargin=M, rightMargin=M, topMargin=M, bottomMargin=20*mm)

# ─── FOUNDER ─────────────────────────────────────────────
def founder_pdf(data, idea, path):
    doc = new_doc(path); s = []
    make_cover(s, "FOUNDER AGENT",
               data.get("companyName", idea[:60]),
               data.get("tagline", "Startup Blueprint Report"))
    # Executive Summary
    s += sec("Business Plan")
    s.append(Paragraph("<b>Executive Summary</b>", ST["section_hd"]))
    s.append(Spacer(1, 4))
    s.append(Paragraph(data.get("executiveSummary",""), ST["body"]))
    # Market
    ma = data.get("marketAnalysis",{})
    s += sec("Market Analysis")
    s.append(kv_row([("TAM", ma.get("tam","-")),
                     ("SAM", ma.get("sam","-")),
                     ("GROWTH RATE", ma.get("growthRate","-"))]))
    s.append(Spacer(1, 10))
    if ma.get("keyTrends"):
        s.append(Paragraph("Key Trends", ST["kv_label"])); s.append(Spacer(1,4))
        s += bullets(ma["keyTrends"])
    # Funding
    fs = data.get("fundingStrategy",{})
    s += sec("Funding Strategy")
    s.append(kv_row([("STAGE", fs.get("stage","-")),
                     ("ASK AMOUNT", fs.get("askAmount","-"))]))
    s.append(Spacer(1, 10))
    if fs.get("useOfFunds"):
        s.append(Paragraph("Use of Funds", ST["kv_label"])); s.append(Spacer(1,4))
        s += bullets(fs["useOfFunds"])
    if fs.get("keyMilestones"):
        s.append(Spacer(1,8))
        s.append(Paragraph("Key Milestones", ST["kv_label"])); s.append(Spacer(1,4))
        s += bullets(fs["keyMilestones"], "✓")
    # GTM
    gtm = data.get("goToMarket",{})
    s += sec("Go-to-Market")
    PHASE_COLORS = [BLUE, BLUE_MID, HexColor("#059669")]
    for i,(label,key) in enumerate([("PHASE 1","phase1"),("PHASE 2","phase2"),("PHASE 3","phase3")]):
        if gtm.get(key):
            s.append(phase_row(label, gtm[key], PHASE_COLORS[i]))
    # Pitch Deck
    s += sec("Pitch Deck Outline")
    for slide in data.get("pitchDeckOutline",[]):
        row = Table(
            [[Paragraph(f"{slide['slide']:02d}", ST["slide_num"]),
              [Paragraph(slide["title"], ST["slide_title"]),
               Spacer(1,2), Paragraph(slide["content"], ST["slide_body"])]]],
            colWidths=[10*mm, W-2*M-10*mm]
        )
        row.setStyle(TableStyle([
            ("VALIGN",(0,0),(-1,-1),"TOP"),
            ("TOPPADDING",(0,0),(-1,-1),7), ("BOTTOMPADDING",(0,0),(-1,-1),7),
            ("LEFTPADDING",(0,0),(-1,-1),0), ("RIGHTPADDING",(0,0),(-1,-1),0),
            ("LINEBELOW",(0,0),(-1,-1),0.3, GRAY_100),
        ]))
        s.append(row)
    # Competitors
    comps = data.get("competitorAnalysis",[])
    if comps:
        s += sec("Competitor Analysis")
        s.append(comp_table(comps))
    # Next Steps
    ns = data.get("nextSteps",[])
    if ns:
        s += sec("Next Steps")
        for i, step in enumerate(ns, 1):
            num_st = ParagraphStyle("ns", fontName="Helvetica-Bold", fontSize=8,
                textColor=WHITE, backColor=BLUE, alignment=TA_CENTER, leading=10)
            row = Table([[Paragraph(str(i), num_st), Paragraph(step, ST["body"])]],
                        colWidths=[7*mm, W-2*M-7*mm])
            row.setStyle(TableStyle([
                ("VALIGN",(0,0),(-1,-1),"MIDDLE"),
                ("TOPPADDING",(0,0),(-1,-1),6), ("BOTTOMPADDING",(0,0),(-1,-1),6),
                ("LEFTPADDING",(0,0),(-1,-1),0), ("RIGHTPADDING",(0,0),(-1,-1),0),
                ("LINEBELOW",(0,0),(-1,-1),0.3, GRAY_100),
            ]))
            s.append(row)
    doc.build(s, onFirstPage=on_cover, onLaterPages=on_page)

# ─── SALES ───────────────────────────────────────────────
def sales_pdf(data, idea, path):
    doc = new_doc(path); s = []
    make_cover(s, "SALES AGENT",
               data.get("companyName", idea[:60]),
               "Sales Strategy & CRM Pipeline Report")
    ss = data.get("salesStrategy",{})
    s += sec("Sales Strategy")
    s.append(kv_row([("APPROACH", ss.get("approach","-")),
                     ("AVG DEAL SIZE", ss.get("averageDealSize","-")),
                     ("SALES CYCLE", ss.get("salesCycleLength","-"))]))
    rp = data.get("revenueProjections",{})
    s += sec("Revenue Projections")
    s.append(kv_row([("MONTH 3", rp.get("month3","-")),
                     ("MONTH 6", rp.get("month6","-")),
                     ("MONTH 12", rp.get("month12","-"))]))
    crm = data.get("crmPipeline",[])
    if crm:
        s += sec("CRM Pipeline")
        for i, stage in enumerate(crm):
            num_st = ParagraphStyle("crm_n", fontName="Helvetica-Bold", fontSize=8,
                textColor=WHITE, backColor=BLUE, alignment=TA_CENTER, leading=10)
            row = Table(
                [[Paragraph(str(i+1), num_st),
                  Paragraph(f"<b>{stage.get('stage','')}</b>", ST["body"]),
                  Paragraph(f"~{stage.get('averageDaysInStage','')} days", ST["body_sm"])]],
                colWidths=[7*mm, (W-2*M-7*mm)*0.65, (W-2*M-7*mm)*0.35]
            )
            row.setStyle(TableStyle([
                ("VALIGN",(0,0),(-1,-1),"MIDDLE"),
                ("TOPPADDING",(0,0),(-1,-1),6), ("BOTTOMPADDING",(0,0),(-1,-1),6),
                ("LEFTPADDING",(0,0),(-1,-1),0), ("RIGHTPADDING",(0,0),(-1,-1),0),
                ("LINEBELOW",(0,0),(-1,-1),0.3, GRAY_100),
            ]))
            s.append(row)
    emails = data.get("emailTemplates",[])
    if emails:
        s += sec("Email Templates")
        for email in emails:
            s.append(Paragraph(f"[{email.get('type','')}]  Subject: {email.get('subject','')}", ST["slide_title"]))
            s.append(Spacer(1,4))
            body_text = (email.get("body","") or "").replace(chr(10),"<br/>")
            s.append(Paragraph(body_text, ST["body_sm"]))
            s.append(Spacer(1,10)); s.append(rule(GRAY_100))
    objections = (data.get("salesScript",{}) or {}).get("commonObjections",[])
    if objections:
        s += sec("Objection Handling")
        for obj in objections:
            s.append(Paragraph(f"Q:  {obj.get('objection','')}", ST["slide_title"]))
            s.append(Spacer(1,3))
            s.append(Paragraph(f"->  {obj.get('response','')}", ST["bullet"]))
            s.append(Spacer(1,8)); s.append(rule(GRAY_100))
    doc.build(s, onFirstPage=on_cover, onLaterPages=on_page)

# ─── MARKETING ───────────────────────────────────────────
def marketing_pdf(data, idea, path):
    doc = new_doc(path); s = []
    make_cover(s, "MARKETING AGENT",
               data.get("companyName", idea[:60]),
               "Launch Campaign & Growth Strategy Report")
    ms = data.get("marketingStrategy",{})
    s += sec("Marketing Strategy")
    if ms.get("positioning"):
        s.append(Paragraph("Positioning", ST["kv_label"])); s.append(Spacer(1,3))
        s.append(Paragraph(ms["positioning"], ST["body"])); s.append(Spacer(1,8))
    if ms.get("brandVoice"):
        s.append(Paragraph("Brand Voice", ST["kv_label"])); s.append(Spacer(1,3))
        s.append(Paragraph(ms["brandVoice"], ST["body"]))
    ls = data.get("launchStrategy",{})
    s += sec("Launch Strategy")
    PHASE_COLORS = [BLUE, BLUE_MID, HexColor("#059669")]
    for i,(label,key) in enumerate([("PRE-LAUNCH","preLaunchWeeks"),
                                     ("LAUNCH DAY","launchDay"),
                                     ("POST-LAUNCH","postLaunchMonth")]):
        if ls.get(key):
            s.append(phase_row(label, ls[key], PHASE_COLORS[i]))
    sc = data.get("socialMediaCampaign",{})
    posts = (sc.get("twitter",{}) or {}).get("posts",[]) or (sc.get("linkedin",{}) or {}).get("posts",[])
    if posts:
        s += sec("Social Media Posts")
        for post in posts[:6]:
            s.append(Paragraph(f'"{post}"', ST["body_sm"]))
            s.append(Spacer(1,6)); s.append(rule(GRAY_100)); s.append(Spacer(1,6))
    ph = (sc.get("productHunt",{}) or {})
    if ph.get("tagline"):
        s += sec("Product Hunt")
        s.append(Paragraph(ph["tagline"], ST["slide_title"])); s.append(Spacer(1,4))
        s.append(Paragraph(ph.get("description",""), ST["body"]))
    if data.get("growthHacks"):
        s += sec("Growth Hacks")
        s += bullets(data["growthHacks"], "!")
    kpis = data.get("kpis",[])
    if kpis:
        s += sec("KPIs")
        cw = W - 2*M
        hdr = [Paragraph(h, ST["kv_label"]) for h in ["METRIC","MONTH 1","MONTH 3"]]
        rows = [hdr] + [
            [Paragraph(k.get("metric",""), ST["body_sm"]),
             Paragraph(k.get("month1Target",""), ST["body_sm"]),
             Paragraph(k.get("month3Target",""), ST["body_sm"])]
            for k in kpis
        ]
        t = Table(rows, colWidths=[cw*0.55, cw*0.225, cw*0.225])
        t.setStyle(TableStyle([
            ("BACKGROUND",(0,0),(-1,0), GRAY_100),
            ("ROWBACKGROUNDS",(0,1),(-1,-1),[WHITE, GRAY_50]),
            ("LINEBELOW",(0,0),(-1,-1),0.3, GRAY_300),
            ("ALIGN",(0,0),(-1,-1),"LEFT"), ("VALIGN",(0,0),(-1,-1),"TOP"),
            ("TOPPADDING",(0,0),(-1,-1),6), ("BOTTOMPADDING",(0,0),(-1,-1),6),
            ("LEFTPADDING",(0,0),(-1,-1),7), ("RIGHTPADDING",(0,0),(-1,-1),7),
        ]))
        s.append(t)
    doc.build(s, onFirstPage=on_cover, onLaterPages=on_page)

# ─── THINK ───────────────────────────────────────────────
def think_pdf(results, idea, path):
    doc = new_doc(path); s = []
    bp = results.get("blueprint",{}) or {}
    rm = results.get("roadmap",{}) or {}
    fs = results.get("feasibility",{}) or {}
    pr = results.get("prompts",{}) or {}
    make_cover(s, "THINK MODE REPORT",
               bp.get("productName", idea[:60] if idea else "Product Report"),
               bp.get("tagline",""))
    # Blueprint
    s += sec("Product Blueprint")
    if bp.get("problemSolved"):
        s.append(Paragraph("Problem Solved", ST["kv_label"])); s.append(Spacer(1,3))
        s.append(Paragraph(bp["problemSolved"], ST["body"])); s.append(Spacer(1,8))
    if bp.get("coreValueProposition"):
        s.append(Paragraph("Core Value Proposition", ST["kv_label"])); s.append(Spacer(1,3))
        s.append(Paragraph(bp["coreValueProposition"], ST["body"])); s.append(Spacer(1,8))
    features = bp.get("coreFeatures",[])
    if features:
        s.append(Paragraph("Core Features", ST["kv_label"])); s.append(Spacer(1,4))
        for f in features:
            name = f if isinstance(f,str) else f.get("name","")
            desc = "" if isinstance(f,str) else f.get("description","")
            pri  = "" if isinstance(f,str) else f.get("priority","")
            label = f"[{pri}] {name}" if pri else name
            s.append(Paragraph(f"->  <b>{label}</b>", ST["bullet"]))
            if desc: s.append(Paragraph(f"    {desc}", ST["body_sm"]))
            s.append(Spacer(1,3))
    tech = bp.get("techStack",[])
    if tech:
        s.append(Spacer(1,6))
        s.append(Paragraph("Tech Stack", ST["kv_label"])); s.append(Spacer(1,4))
        s.append(Paragraph("  ·  ".join([t if isinstance(t,str) else t.get("name","") for t in tech]), ST["body"]))
    if bp.get("competitiveEdge"):
        s.append(Spacer(1,8))
        s.append(Paragraph("Competitive Edge", ST["kv_label"])); s.append(Spacer(1,3))
        s.append(Paragraph(bp["competitiveEdge"], ST["body"]))
    # Roadmap
    phases = rm.get("phases",[])
    if phases:
        s += sec("Execution Roadmap")
        PHASE_COLORS = [BLUE, BLUE_MID, HexColor("#7c3aed"), HexColor("#059669"), HexColor("#0891b2")]
        for i, phase in enumerate(phases):
            color = PHASE_COLORS[i % len(PHASE_COLORS)]
            num_st = ParagraphStyle("phn", fontName="Helvetica-Bold", fontSize=9,
                textColor=WHITE, backColor=color, alignment=TA_CENTER, leading=11)
            ph_title = Table(
                [[Paragraph(str(phase.get("phase",i+1)), num_st),
                  [Paragraph(f"<b>{phase.get('title','')}</b>", ST["slide_title"]),
                   Paragraph(phase.get("duration",""), ST["body_sm"])]]],
                colWidths=[9*mm, W-2*M-9*mm]
            )
            ph_title.setStyle(TableStyle([
                ("VALIGN",(0,0),(-1,-1),"MIDDLE"),
                ("TOPPADDING",(0,0),(-1,-1),8), ("BOTTOMPADDING",(0,0),(-1,-1),8),
                ("LEFTPADDING",(0,0),(-1,-1),0), ("RIGHTPADDING",(0,0),(-1,-1),0),
            ]))
            s.append(ph_title)
            if phase.get("goals"):
                s.append(Paragraph("Goals", ST["kv_label"])); s.append(Spacer(1,3))
                s += bullets(phase["goals"], "✓")
            if phase.get("milestones"):
                s.append(Spacer(1,4))
                s.append(Paragraph("Milestones", ST["kv_label"])); s.append(Spacer(1,3))
                s += bullets(phase["milestones"], "->")
            if phase.get("deliverables"):
                s.append(Spacer(1,4))
                s.append(Paragraph("Deliverables", ST["kv_label"])); s.append(Spacer(1,3))
                s += bullets(phase["deliverables"], "*")
            s.append(Spacer(1,6)); s.append(rule(GRAY_100)); s.append(Spacer(1,6))
    # Feasibility
    score = fs.get("score", 0)
    if score:
        s += sec("Feasibility Analysis")
        score_color = HexColor("#16a34a") if score >= 70 else (HexColor("#f59e0b") if score >= 50 else HexColor("#dc2626"))
        label = "Strong Idea" if score >= 75 else ("Viable Idea" if score >= 60 else ("Needs Work" if score >= 45 else "High Risk"))
        score_row = Table(
            [[Paragraph(str(score), ParagraphStyle("sc", fontName="Helvetica-Bold",
                        fontSize=36, leading=40, textColor=score_color)),
              [Paragraph(label, ParagraphStyle("sl", fontName="Helvetica-Bold",
                         fontSize=16, leading=20, textColor=BLACK)),
               Paragraph(f"{fs.get('confidence','')} confidence", ST["body_sm"]),
               Paragraph(fs.get("timeToMarket",""), ST["body_sm"])]]],
            colWidths=[30*mm, W-2*M-30*mm]
        )
        score_row.setStyle(TableStyle([
            ("VALIGN",(0,0),(-1,-1),"TOP"),
            ("TOPPADDING",(0,0),(-1,-1),0), ("BOTTOMPADDING",(0,0),(-1,-1),0),
            ("LEFTPADDING",(0,0),(-1,-1),0), ("RIGHTPADDING",(0,0),(-1,-1),0),
        ]))
        s.append(score_row); s.append(Spacer(1,10))
        if fs.get("recommendation"):
            s.append(Paragraph("Recommendation", ST["kv_label"])); s.append(Spacer(1,3))
            s.append(Paragraph(fs["recommendation"], ST["body"])); s.append(Spacer(1,10))
        str_risk = Table(
            [[Paragraph("STRENGTHS", ParagraphStyle("sh", fontName="Helvetica-Bold",
                        fontSize=7.5, textColor=HexColor("#16a34a"), leading=9)),
              Paragraph("RISKS", ParagraphStyle("rh", fontName="Helvetica-Bold",
                        fontSize=7.5, textColor=HexColor("#dc2626"), leading=9))],
             [[Paragraph(f"✓  {x}", ST["bullet"]) for x in (fs.get("strengths") or [])],
              [Paragraph(f"!  {x}", ST["bullet"]) for x in (fs.get("risks") or [])]]],
            colWidths=[(W-2*M)*0.5, (W-2*M)*0.5]
        )
        str_risk.setStyle(TableStyle([
            ("VALIGN",(0,0),(-1,-1),"TOP"),
            ("TOPPADDING",(0,0),(-1,-1),4), ("BOTTOMPADDING",(0,0),(-1,-1),4),
            ("LEFTPADDING",(0,0),(-1,-1),0), ("RIGHTPADDING",(0,0),(-1,-1),8),
        ]))
        s.append(str_risk)
    # Prompt Packs (condensed)
    packs = pr.get("packs",[])
    if packs:
        s += sec("AI Prompt Packs")
        for pack in packs:
            s.append(Paragraph(f"{pack.get('phase','')}  /  {pack.get('category','')}", ST["pack_phase"]))
            s.append(Spacer(1,4))
            for p in (pack.get("prompts",[]) or [])[:3]:
                s.append(Paragraph(f"<b>[{p.get('tool','')}]</b>  {p.get('title','')}", ST["pack_title"]))
                s.append(Spacer(1,3))
                s.append(Paragraph(p.get("prompt",""), ST["pack_prompt"]))
                s.append(Spacer(1,6)); s.append(rule(GRAY_100)); s.append(Spacer(1,6))
    doc.build(s, onFirstPage=on_cover, onLaterPages=on_page)

# ── Entry point ───────────────────────────────────────────
payload = json.loads(sys.stdin.read())
mode    = payload.get("mode","execute")
idea    = payload.get("idea","")
out     = payload.get("output_path")

if mode == "think":
    think_pdf(payload.get("results",{}), idea, out)
else:
    agent = payload.get("agentKey","founder")
    data  = payload.get("data",{})
    if agent == "sales":        sales_pdf(data, idea, out)
    elif agent == "marketing":  marketing_pdf(data, idea, out)
    else:                       founder_pdf(data, idea, out)

print("done", file=sys.stderr)
`;

// ── Helper: run Python script with stdin ──────────────────
// Windows uses "python", Linux/Mac use "python3"
const PYTHON_CMD = process.platform === "win32" ? "python" : "python3";

function runPython(script: string, stdin: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(PYTHON_CMD, [script], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stderr = "";
    proc.stderr.on("data", (d: Buffer) => (stderr += d.toString()));
    proc.stdout.on("data", () => {}); // drain stdout

    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Python exited ${code}: ${stderr}`));
    });

    proc.on("error", (err) => {
      reject(new Error(`Failed to start Python: ${err.message}. Make sure Python is installed.`));
    });

    // Write JSON payload to stdin then close
    proc.stdin.write(stdin, "utf8");
    proc.stdin.end();
  });
}

// ── Route handler ─────────────────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.json();

  const scriptPath = join(tmpdir(), `arteno_pdf_${Date.now()}.py`);
  const outputPath = join(tmpdir(), `arteno_out_${Date.now()}.pdf`);

  try {
    await writeFile(scriptPath, PYTHON_SCRIPT, "utf8");

    const stdin = JSON.stringify({ ...body, output_path: outputPath });
    await runPython(scriptPath, stdin);

    const pdfBuffer = await readFile(outputPath);

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="arteno-report.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("PDF generation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    await unlink(scriptPath).catch(() => {});
    await unlink(outputPath).catch(() => {});
  }
}