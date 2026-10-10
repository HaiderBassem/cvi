"""Add slide transitions + entrance animations to a pptxgenjs deck.

Shapes named "A<n>-..." animate in group order n (same n = together).
Groups listed in CLICK[slide] start on a click (later groups follow automatically).
Names containing "-path" use a left wipe; everything else fades.
"""
import re, sys, zipfile
from lxml import etree

NS = {"p": "http://schemas.openxmlformats.org/presentationml/2006/main",
      "a": "http://schemas.openxmlformats.org/drawingml/2006/main"}
P = "{%s}" % NS["p"]
CLICK = {9: {3}}          # slide 9: bug markers + findings reveal on click
STEP, DUR = 320, 480      # ms between groups, effect duration

def effect(ids, spid, delay, wipe, node):
    i = next(ids)
    if wipe:
        preset, sub, filt = 22, 8, "wipe(left)"
    else:
        preset, sub, filt = 10, 0, "fade"
    return (f'<p:par><p:cTn id="{i}" presetID="{preset}" presetClass="entr" presetSubtype="{sub}" fill="hold" grpId="0" nodeType="{node}">'
            f'<p:stCondLst><p:cond delay="{delay}"/></p:stCondLst><p:childTnLst>'
            f'<p:set><p:cBhvr><p:cTn id="{next(ids)}" dur="1" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst></p:cTn>'
            f'<p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl><p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst></p:cBhvr>'
            f'<p:to><p:strVal val="visible"/></p:to></p:set>'
            f'<p:animEffect transition="in" filter="{filt}"><p:cBhvr><p:cTn id="{next(ids)}" dur="{DUR}"/>'
            f'<p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl></p:cBhvr></p:animEffect>'
            f'</p:childTnLst></p:cTn></p:par>')

def timing_xml(groups, clicks):
    ids = iter(range(3, 100000))
    order = sorted(groups)
    seqs, cur, t = [], [], 0
    for n in order:
        if n in clicks and cur:
            seqs.append(cur); cur, t = [], 0
        for (spid, wipe) in groups[n]:
            cur.append((spid, wipe, t, n in clicks and t == 0))
        t += STEP
    if cur: seqs.append(cur)
    pars = []
    for k, seq in enumerate(seqs):
        auto = k == 0 and not any(c for *_, c in seq)
        outer_id = next(ids)
        cond = ('<p:cond delay="indefinite"/><p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond>' if auto
                else '<p:cond delay="indefinite"/>')
        inner_id = next(ids)
        effs = []
        for j, (spid, wipe, d, isclick) in enumerate(seq):
            node = ("afterEffect" if auto else "clickEffect") if j == 0 else "withEffect"
            effs.append(effect(ids, spid, d, wipe, node))
        pars.append(f'<p:par><p:cTn id="{outer_id}" fill="hold"><p:stCondLst>{cond}</p:stCondLst><p:childTnLst>'
                    f'<p:par><p:cTn id="{inner_id}" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>'
                    + "".join(effs) + '</p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn></p:par>')
    return ('<p:timing xmlns:p="%s"><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst>'
            '<p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst>' % NS["p"]
            + "".join(pars) +
            '</p:childTnLst></p:cTn><p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst>'
            '<p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq>'
            '</p:childTnLst></p:cTn></p:par></p:tnLst></p:timing>')

def process(xml, slide_no):
    root = etree.fromstring(xml)
    groups = {}
    sp_ids = set()
    for el in root.iter(P + "sp", P + "pic", P + "cxnSp"):
        c = el.find(".//p:cNvPr", NS)
        if c is None: continue
        m = re.match(r"A(\d+)-", c.get("name", ""))
        if not m: continue
        groups.setdefault(int(m.group(1)), []).append((c.get("id"), "-path" in c.get("name")))
        if el.tag == P + "sp": sp_ids.add(c.get("id"))
    for old in root.findall("p:transition", NS) + root.findall("p:timing", NS):
        root.remove(old)
    anchor = root.find("p:clrMapOvr", NS)
    idx = list(root).index(anchor) + 1 if anchor is not None else len(root)
    trans = etree.fromstring('<p:transition xmlns:p="%s" spd="med"><p:fade/></p:transition>' % NS["p"])
    root.insert(idx, trans)
    if groups:
        tm = etree.fromstring(timing_xml(groups, CLICK.get(slide_no, set())))
        bld = etree.SubElement(tm, P + "bldLst")
        for spid in sorted(sp_ids, key=int):
            etree.SubElement(bld, P + "bldP", spid=spid, grpId="0", animBg="1")
        root.insert(idx + 1, tm)
    return etree.tostring(root, xml_declaration=True, encoding="UTF-8", standalone=True), sum(len(v) for v in groups.values())

src, dst = sys.argv[1], sys.argv[2]
zin = zipfile.ZipFile(src)
zout = zipfile.ZipFile(dst, "w", zipfile.ZIP_DEFLATED)
for item in zin.infolist():
    data = zin.read(item.filename)
    m = re.match(r"ppt/slides/slide(\d+)\.xml$", item.filename)
    if m:
        data, n = process(data, int(m.group(1)))
        print(f"slide {m.group(1)}: {n} animated objects")
    zout.writestr(item, data)
zout.close()
