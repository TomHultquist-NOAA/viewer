#!/usr/bin/env python3
"""Publish both in-app and PDF guides from USER_GUIDE.md.

This is an authoring tool, not part of the deployed browser runtime.
Authoring dependencies: markdown-it-py and reportlab.
Run: python3 tools/build_user_guide.py
"""
from __future__ import annotations
from pathlib import Path
import re
import html
import hashlib

ROOT=Path(__file__).resolve().parent.parent
DOC=ROOT/'USER_GUIDE.md'
PAGE=ROOT/'index.html'
PDF=ROOT/'USER_GUIDE.pdf'

SECTIONS={
 'Getting started': ('guide-start','Getting started'),
 'Map controls and shortcuts': ('guide-map','Map controls'),
 'Right-click: time series and sounding': ('guide-inspect','Point charts'),
 'Fields, precipitation type, and snowfall': ('guide-fields','Fields and snowfall'),
 'Adjust the numerical colorbar': ('guide-colors','Color scales'),
 'Overlays and transparency': ('guide-overlays','Overlays'),
 'Weather observations and storm reports': ('guide-obs','Observations'),
 'Compare two panels': ('guide-diff','Differences'),
 'Save PNGs and animated GIFs': ('guide-export','Exports'),
 'Data availability and troubleshooting': ('guide-data','Data and limitations'),
}

def publish_html(text: str):
 from markdown_it import MarkdownIt
 md=MarkdownIt('default',{'html':False,'linkify':False}).enable('table')
 # Main page title is already present in the dialog chrome. The version,
 # intro, and all the full sections come from the canonical Markdown below.
 body=re.sub(r'^# .+?\n+', '', text, count=1)
 chunks=re.split(r'(?m)^## (.+?)\n',body)
 assert len(chunks)==1+2*len(SECTIONS),'Unexpected guide sections: update section IDs and index'
 intro=md.render(chunks[0])
 nav='\n'.join(f'    <a href="#{sid}">{html.escape(short)}</a>' for _,(sid,short) in SECTIONS.items())
 sections=[]
 for heading,content in zip(chunks[1::2],chunks[2::2]):
  if heading not in SECTIONS:raise ValueError(f'Unmapped guide heading: {heading}')
  sid,_=SECTIONS[heading]
  sections.append(f'  <section id="{sid}">\n    <h3>{html.escape(heading)}</h3>\n{md.render(content)}  </section>')
 fingerprint=hashlib.sha256(text.encode('utf-8')).hexdigest()
 rendered=(f'  <!-- user-guide-source-sha256: {fingerprint} -->\n'
           f'  <div class="user-guide-scroll">\n'
           f'   <nav class="guide-index" aria-label="Guide contents">\n{nav}\n   </nav>\n'
           f'   <div class="guide-intro">\n{intro}   </div>\n'
           + '\n'.join(sections)+'\n'
           + '  </div>\n')
 source=PAGE.read_text()
 start=source.index('  <div class="user-guide-scroll">')
 end=source.index('  <div class="user-guide-footer">',start)
 PAGE.write_text(source[:start]+rendered+source[end:])

# PDF generator follows the same paragraphs/headings/table rows as Markdown.
def publish_pdf(text: str):
 from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,Table,TableStyle,HRFlowable
 from reportlab.lib import colors
 from reportlab.lib.styles import getSampleStyleSheet,ParagraphStyle
 from reportlab.lib.pagesizes import letter
 from reportlab.lib.units import inch
 navy=colors.HexColor('#15304c');muted=colors.HexColor('#46576b');steel=colors.HexColor('#dfe8f2')
 styles=getSampleStyleSheet()
 styles.add(ParagraphStyle(name='GuideTitleEVU',parent=styles['Title'],fontName='Helvetica-Bold',fontSize=21,leading=27,textColor=navy,spaceAfter=12))
 styles.add(ParagraphStyle(name='GuideSectionEVU',parent=styles['Heading2'],fontName='Helvetica-Bold',fontSize=12.0,leading=15,textColor=navy,spaceBefore=10,spaceAfter=5,keepWithNext=True))
 styles.add(ParagraphStyle(name='GuideBodyEVU',parent=styles['BodyText'],fontName='Helvetica',fontSize=8.8,leading=12.0,textColor=navy,spaceAfter=5))
 styles.add(ParagraphStyle(name='GuideBulletEVU',parent=styles['GuideBodyEVU'],leftIndent=13,firstLineIndent=-8,spaceAfter=3))
 styles.add(ParagraphStyle(name='GuideSmallEVU',parent=styles['GuideBodyEVU'],fontSize=8.1,leading=11.4,spaceAfter=3))
 styles.add(ParagraphStyle(name='GuideTableEVU',parent=styles['GuideBodyEVU'],fontSize=8,leading=10,spaceAfter=0))
 def enrich(value):
  value=html.escape(value)
  value=re.sub(r'\*\*(.+?)\*\*',r'<b>\1</b>',value)
  value=re.sub(r'`([^`]+)`',r'<font face="Courier">\1</font>',value)
  value=re.sub(r'\[(.*?)\]\((.*?)\)',lambda m:f'<link href="{m.group(2)}" color="#225b95">{m.group(1)}</link>' if m.group(2).startswith('https') else m.group(1),value)
  for a,b in [('—',' - '),('–','-'),('·',' / '),('±','+/-'),('≥','&gt;='),('°',' deg'),('←','left'),('→','right'),('↑','up'),('↓','down'),('²','^2')]:value=value.replace(a,b)
  return value
 story=[];lines=text.splitlines();i=0
 while i<len(lines):
  s=lines[i].strip()
  if not s:i+=1;continue
  if s.startswith('# '):
   story.append(Paragraph(enrich(s[2:]),styles['GuideTitleEVU']));story.append(HRFlowable(width='100%',thickness=1,color=steel,spaceAfter=12));i+=1;continue
  if s.startswith('## '):story.append(Paragraph(enrich(s[3:]),styles['GuideSectionEVU']));i+=1;continue
  if s.startswith('|'):
   rows=[]
   while i<len(lines) and lines[i].strip().startswith('|'):
    parts=[x.strip() for x in lines[i].strip().strip('|').split('|')];i+=1
    if all(re.fullmatch(r':?-{2,}:?',x) for x in parts):continue
    rows.append(parts)
   if rows:
    n=max(map(len,rows));rows=[r+['']*(n-len(r)) for r in rows]
    usable=letter[0]-2*.68*inch
    items=[[Paragraph(enrich(c),styles['GuideTableEVU']) for c in row] for row in rows]
    table=Table(items,colWidths=[usable/n]*n,repeatRows=1,hAlign='LEFT')
    table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),steel),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#f5f9fc')]),('LINEBELOW',(0,0),(-1,0),.6,colors.HexColor('#7890a8')),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7),('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),4)]))
    story.extend([table,Spacer(1,10)])
   continue
  if re.match(r'^[-*] ',s):story.append(Paragraph('&#8226; '+enrich(s[2:]),styles['GuideBulletEVU']));i+=1;continue
  if re.match(r'^\d+\. ',s):story.append(Paragraph(enrich(s),styles['GuideBulletEVU']));i+=1;continue
  if s.startswith('**Viewer version'):story.append(Paragraph(enrich(s),styles['GuideSmallEVU']));i+=1;continue
  para=[s];i+=1
  while i<len(lines):
   nxt=lines[i].strip()
   if not nxt or nxt.startswith(('#','|','- ','* ')) or re.match(r'^\d+\. ',nxt):break
   para.append(nxt);i+=1
  story.append(Paragraph(enrich(' '.join(para)),styles['GuideBodyEVU']))
 version=re.search(r'\*\*Viewer version (.*?)\*\*',text)
 label=version.group(1).split(' · ')[0] if version else 'latest'
 def footer(canvas,doc):
  canvas.saveState();w,h=letter
  canvas.setStrokeColor(steel);canvas.line(.68*inch,.55*inch,w-.68*inch,.55*inch)
  canvas.setFont('Helvetica',8);canvas.setFillColor(muted)
  canvas.drawString(.68*inch,.38*inch,f'OMD EVU Model Viewer / User Guide / {label}')
  canvas.drawRightString(w-.68*inch,.38*inch,str(doc.page))
  canvas.restoreState()
 doc=SimpleDocTemplate(str(PDF),pagesize=letter,rightMargin=.68*inch,leftMargin=.68*inch,topMargin=.68*inch,bottomMargin=.72*inch,title='OMD EVU Model Viewer User Guide',subject='Guide source SHA256: '+hashlib.sha256(text.encode('utf-8')).hexdigest(),author='OMD EVU Model Viewer')
 doc.build(story,onFirstPage=footer,onLaterPages=footer)

if __name__=='__main__':
 content=DOC.read_text()
 publish_html(content)
 publish_pdf(content)
 print(f'Updated on-screen guide in {PAGE.name} and {PDF.name} from {DOC.name}')
