// YOUR DEGREE IS NOT ENOUGH — Skillture workshop deck (pptxgenjs)
const path = require("path");
const fs = require("fs");
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const lu = require("react-icons/lu");
const si = require("react-icons/si");
const NOTES = require("./notes.js");

const IMG = path.join(__dirname, "img");
const OUT = path.join(__dirname, "out");
fs.mkdirSync(OUT, { recursive: true });

// ---------- brand system ----------
const K = {
  black: "000000", ink: "030607", surface: "0D1617", surface2: "122021", line: "1F3537",
  turq: "0CCCCC", teal: "01A3A3", deep: "017A7A", coral: "FF4D4D", white: "FFFFFF",
  mute: "9FB0B0", mute2: "6E8282", lightCard: "F2F7F7", darkText: "0B1414", bodyDark: "3A4B4B",
};
const F = { H: "Poppins ExtraBold", B: "Poppins", SB: "Poppins SemiBold", MD: "Poppins Medium", MONO: "Courier New" };
const W = 13.333, MX = 0.75;

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
pres.author = "Skillture";
pres.company = "Skillture";
pres.title = "Your Degree Is Not Enough";
pres.theme = { headFontFace: F.H, bodyFontFace: F.B };

const THEME = {
  name: "Skillture",
  headFontFace: F.H,
  bodyFontFace: F.B,
  colors: {
    dk1: K.black, lt1: K.white, dk2: K.darkText, lt2: K.lightCard,
    accent1: K.turq, accent2: K.teal, accent3: K.coral, accent4: K.deep,
    accent5: "6E8282", accent6: "122021", hlink: K.turq, folHlink: K.teal,
  },
};

// ---------- helpers ----------
const iconCache = {};
async function icon(name, color, size = 256) {
  const key = `${name}-${color}-${size}`;
  if (iconCache[key]) return iconCache[key];
  const comp = lu[name] || si[name];
  if (!comp) throw new Error("missing icon " + name);
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(comp, { color: "#" + color, size: String(size) }));
  const buf = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
  return (iconCache[key] = "image/png;base64," + buf.toString("base64"));
}
const dims = {};
async function imgDims(file) {
  if (!dims[file]) { const m = await sharp(path.join(IMG, file)).metadata(); dims[file] = m.width / m.height; }
  return dims[file];
}
// place image by height (or width) keeping aspect
async function pic(slide, file, o) {
  const ar = await imgDims(file);
  let { x, y, w, h } = o;
  if (h && !w) w = h * ar; else if (w && !h) h = w / ar;
  if (o.cx !== undefined) x = o.cx - w / 2;
  if (o.cy !== undefined) y = o.cy - h / 2;
  slide.addImage({ path: path.join(IMG, file), x, y, w, h, transparency: o.transparency, objectName: o.name, altText: o.alt || "" });
  return { x, y, w, h };
}
function txt(slide, text, o) {
  const opts = Object.assign({ fontFace: F.B, fontSize: 14, color: K.white, margin: 0, valign: "top", isTextBox: true, fit: "none" }, o);
  if (o.name) { opts.objectName = o.name; delete opts.name; }
  slide.addText(text, opts);
}
function rect(slide, o) {
  const shape = o.r ? pres.shapes.ROUNDED_RECTANGLE : pres.shapes.RECTANGLE;
  const opts = { x: o.x, y: o.y, w: o.w, h: o.h, fill: o.fill ? { color: o.fill, transparency: o.ft || 0 } : { type: "none" },
    line: o.line ? { color: o.line, width: o.lw || 0.75, dashType: o.dash || "solid" } : { type: "none" } };
  if (o.r) opts.rectRadius = o.r;
  if (o.shadow) opts.shadow = { type: "outer", color: "000000", opacity: o.shadow, blur: 10, offset: 3, angle: 90 };
  if (o.name) opts.objectName = o.name;
  slide.addShape(shape, opts);
}
function oval(slide, o) {
  slide.addShape(pres.shapes.OVAL, { x: o.x, y: o.y, w: o.d, h: o.d,
    fill: o.fill ? { color: o.fill, transparency: o.ft || 0 } : { type: "none" },
    line: o.line ? { color: o.line, width: o.lw || 1 } : { type: "none" }, objectName: o.name });
}
function line(slide, x1, y1, x2, y2, o = {}) {
  slide.addShape(pres.shapes.LINE, {
    x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.max(Math.abs(x2 - x1), 0.001), h: Math.max(Math.abs(y2 - y1), 0.001),
    flipV: (x2 - x1) * (y2 - y1) < 0,
    line: { color: o.color || K.turq, width: o.width || 1.25, dashType: o.dash || "solid", transparency: o.t || 0,
      endArrowType: o.arrow ? "triangle" : undefined },
    objectName: o.name,
  });
}
async function iconCircle(slide, name, x, y, d, o = {}) {
  oval(slide, { x, y, d, fill: o.fill || K.surface2, line: o.line, lw: o.lw, name: o.nameBg || o.name });
  const s = d * (o.scale || 0.52);
  slide.addImage({ data: await icon(name, o.color || K.turq), x: x + (d - s) / 2, y: y + (d - s) / 2, w: s, h: s, objectName: o.name ? o.name + "-i" : undefined });
}
function eyebrow(slide, t, color = K.turq) {
  txt(slide, t, { x: MX, y: 0.5, w: 9, h: 0.3, fontFace: F.SB, fontSize: 12, color, charSpacing: 3, name: "A0-eyebrow" });
}
function title(slide, t) {
  slide.addText(t, { placeholder: "title" });
}

// ---------- layouts ----------
function footer(dark) {
  return [
    { image: { path: path.join(IMG, dark ? "logo_white.png" : "logo_black.png"), x: MX, y: 6.95, w: 0.27, h: 0.26 } },
    { text: { text: "YOUR DEGREE IS NOT ENOUGH  ·  SKILLTURE", options: { x: 1.12, y: 6.95, w: 5, h: 0.26, fontFace: F.SB, fontSize: 9,
      color: dark ? K.mute2 : "5E7070", charSpacing: 2, valign: "middle", margin: 0 } } },
  ];
}
function titlePh(color) {
  return { placeholder: { options: { name: "title", type: "title", x: MX, y: 0.82, w: W - 2 * MX, h: 0.75, fontFace: F.H, fontSize: 36,
    color, valign: "top", margin: 0, align: "left" }, text: "" } };
}
const slideNum = (color) => ({ x: W - MX - 0.6, y: 6.95, w: 0.6, h: 0.26, fontFace: F.SB, fontSize: 10, color, align: "right", valign: "middle", margin: 0 });
pres.defineSlideMaster({ title: "SK_DARK", background: { path: path.join(IMG, "bg_dark.png") },
  objects: [...footer(true), titlePh(K.white)], slideNumber: slideNum(K.mute2) });
pres.defineSlideMaster({ title: "SK_LIGHT", background: { path: path.join(IMG, "bg_light.png") },
  objects: [...footer(false), titlePh(K.darkText)], slideNumber: slideNum("5E7070") });
pres.defineSlideMaster({ title: "SK_TURQ", background: { path: path.join(IMG, "bg_turq.png") },
  objects: [...footer(false), titlePh(K.black)], slideNumber: slideNum(K.black) });
pres.defineSlideMaster({ title: "SK_HERO", background: { path: path.join(IMG, "bg_dark.png") }, objects: [] });

function newSlide(master, section, idx) {
  const s = pres.addSlide({ masterName: master, sectionTitle: section });
  s.addNotes(NOTES[idx]);
  return s;
}

// =====================================================================
async function build() {
  // ---------------- 1. OPENING ----------------
  pres.addSection({ title: "Wake-up call" });
  {
    const s = newSlide("SK_HERO", "Wake-up call", 0);
    s.addImage({ path: path.join(IMG, "pat_right.png"), x: 0, y: 0, w: W, h: 7.5 });
    s.addImage({ path: path.join(IMG, "glow_turq.png"), x: 6.6, y: 0.2, w: 6.6, h: 6.6, transparency: 45 });
    s.addImage({ path: path.join(IMG, "floor_glow.png"), x: 7.4, y: 4.75, w: 5.4, h: 0.95, transparency: 25, objectName: "A3-floor" });
    await pic(s, "r_cap.png", { w: 5.9, cx: 10.0, cy: 3.85, name: "A3-cap", alt: "3D graduation cap" });
    txt(s, "A SKILLTURE WORKSHOP   ·   2 HOURS   ·   HANDS-ON", { x: MX, y: 0.95, w: 7, h: 0.3, fontFace: F.SB, fontSize: 12, color: K.turq, charSpacing: 4, name: "A1-eyebrow" });
    txt(s, [
      { text: "YOUR", options: { breakLine: true } },
      { text: "DEGREE IS", options: { breakLine: true } },
      { text: "NOT ENOUGH.", options: { color: K.turq } },
    ], { x: MX - 0.04, y: 1.4, w: 7.4, h: 3.45, fontFace: F.H, fontSize: 66, lineSpacingMultiple: 0.86, name: "A2-headline" });
    txt(s, [
      { text: "So you graduated. ", options: { color: K.white } },
      { text: "Now what?", options: { color: K.turq } },
    ], { x: MX, y: 5.08, w: 7, h: 0.5, fontFace: F.SB, fontSize: 26, name: "A4-question" });
    txt(s, "From classroom to career: build skills, create value, get hired.", { x: MX, y: 5.64, w: 7.4, h: 0.4, fontSize: 16, color: K.mute, name: "A4-sub" });
    await pic(s, "logo_white.png", { x: MX, y: 6.42, h: 0.5, name: "A5-logo" });
    await pic(s, "wordmark_white.png", { x: MX + 0.62, y: 6.45, h: 0.44, name: "A5-word" });
    txt(s, "@skillture.iq", { x: W - MX - 3, y: 6.55, w: 3, h: 0.3, fontSize: 12, color: K.mute2, align: "right", name: "A5-handle" });
  }

  // ---------------- 2. REALITY CHECK ----------------
  {
    const s = newSlide("SK_LIGHT", "Wake-up call", 1);
    eyebrow(s, "01  ·  THE REALITY CHECK", K.deep);
    title(s, "The Reality Check");
    txt(s, "What university rewards vs. what the job market pays for.", { x: MX, y: 1.6, w: 9, h: 0.35, fontSize: 16, color: K.bodyDark, name: "A0-sub" });
    const L = { x: MX, w: 5.25 }, R = { x: 7.33, w: 5.25 }, mid = W / 2;
    s.addImage({ data: await icon("LuGraduationCap", K.mute2), x: L.x, y: 2.12, w: 0.32, h: 0.32 });
    txt(s, "UNIVERSITY REWARDS", { x: L.x + 0.45, y: 2.14, w: 4, h: 0.3, fontFace: F.SB, fontSize: 12, color: "5E7070", charSpacing: 3 });
    s.addImage({ data: await icon("LuBriefcase", K.deep), x: R.x, y: 2.12, w: 0.32, h: 0.32 });
    txt(s, "THE JOB EXPECTS", { x: R.x + 0.45, y: 2.14, w: 4, h: 0.3, fontFace: F.SB, fontSize: 12, color: K.deep, charSpacing: 3 });
    const rows = [
      ["One correct answer", "Problems with no answer key"],
      ["Memorizing for the exam", "Finding, learning and applying fast"],
      ["Individual grades", "Shipping with a team"],
      ["A graduation project in a drawer", "Projects on GitHub with a live demo"],
      ["Theory and formulas", "Working systems people actually use"],
    ];
    const ok = await icon("LuCheck", K.turq), no = await icon("LuMinus", "8A9A9A"), arr = await icon("LuArrowRight", K.white);
    for (let i = 0; i < rows.length; i++) {
      const y = 2.58 + i * 0.74, h = 0.6, g = `A${i + 1}`;
      rect(s, { x: L.x, y, w: L.w, h, fill: "E9F0F0", r: 0.12, name: `${g}-l` });
      s.addImage({ data: no, x: L.x + 0.22, y: y + 0.18, w: 0.24, h: 0.24, objectName: `${g}-li` });
      txt(s, rows[i][0], { x: L.x + 0.62, y, w: L.w - 0.8, h, fontSize: 16, color: "4A5C5C", valign: "middle", name: `${g}-lt` });
      oval(s, { x: mid - 0.21, y: y + 0.09, d: 0.42, fill: K.turq, name: `${g}-c` });
      s.addImage({ data: arr, x: mid - 0.12, y: y + 0.18, w: 0.24, h: 0.24, objectName: `${g}-ci` });
      rect(s, { x: R.x, y, w: R.w, h, fill: K.darkText, r: 0.12, shadow: 0.18, name: `${g}-r` });
      s.addImage({ data: ok, x: R.x + 0.22, y: y + 0.17, w: 0.26, h: 0.26, objectName: `${g}-ri` });
      txt(s, rows[i][1], { x: R.x + 0.62, y, w: R.w - 0.8, h, fontFace: F.SB, fontSize: 16, color: K.white, valign: "middle", name: `${g}-rt` });
    }
    rect(s, { x: MX, y: 6.33, w: W - 2 * MX, h: 0.46, fill: "DDF3F3", r: 0.23, name: "A6-ask" });
    s.addImage({ data: await icon("LuMessageCircleQuestion", K.deep), x: MX + 0.2, y: 6.41, w: 0.3, h: 0.3, objectName: "A6-askI" });
    txt(s, [
      { text: "ASK THE ROOM   ", options: { fontFace: F.SB, color: K.deep, charSpacing: 2 } },
      { text: "Hands up: who has built something that no course required?", options: { color: K.darkText } },
    ], { x: MX + 0.65, y: 6.33, w: 10.8, h: 0.46, fontSize: 14, valign: "middle", name: "A6-askT" });
  }

  // ---------------- 3. SKILLS ----------------
  pres.addSection({ title: "What makes you hireable" });
  {
    const s = newSlide("SK_DARK", "What makes you hireable", 2);
    s.addImage({ path: path.join(IMG, "pat_full.png"), x: 0, y: 0, w: W, h: 7.5 });
    eyebrow(s, "02  ·  WHAT EMPLOYERS LOOK FOR");
    title(s, "The Skills That Actually Get You Hired");
    const cx = W / 2, cy = 4.12;
    s.addImage({ path: path.join(IMG, "glow_turq.png"), x: cx - 2.3, y: cy - 2.3, w: 4.6, h: 4.6, transparency: 50 });
    await pic(s, "r_logo.png", { h: 2.35, cx, cy, name: "A1-brain", alt: "3D Skillture brain logo" });
    const skills = [
      ["LuPuzzle", "Problem-solving", "Break a messy problem into steps you can test."],
      ["LuMessagesSquare", "Communication", "Explain your work to a teammate, a client, a manager."],
      ["LuHammer", "Practical experience", "Projects, internships, freelance: anything real."],
      ["LuCode", "Technical skills", "One stack, deep enough to build end to end."],
      ["LuRefreshCw", "Adaptability", "Learn a new tool in a week, not a semester."],
      ["LuSparkles", "AI literacy", "Use AI to move faster and still verify every output."],
    ];
    const ys = [2.0, 3.6, 5.2];
    for (let i = 0; i < 6; i++) {
      const left = i < 3, y = ys[i % 3], g = `A${2 + (i % 3)}`;
      const ix = left ? 4.55 : 8.12, d = 0.66, yc = y + 0.33;
      await iconCircle(s, skills[i][0], ix, y, d, { fill: K.surface2, line: K.teal, lw: 1, name: `${g}-ic${i}` });
      const tx = left ? MX : 9.0, tw = 3.62, al = left ? "right" : "left";
      txt(s, skills[i][1], { x: tx, y: y - 0.02, w: tw, h: 0.4, fontFace: F.SB, fontSize: 19, align: al, name: `${g}-t${i}` });
      txt(s, skills[i][2], { x: tx, y: y + 0.4, w: tw, h: 0.62, fontSize: 14, color: K.mute, align: al, name: `${g}-d${i}` });
      const x1 = left ? ix + d + 0.06 : ix - 0.06, x2 = left ? cx - 1.0 : cx + 1.0;
      line(s, x1, yc, x2, cy + (yc - cy) * 0.45, { color: K.teal, width: 1, t: 30, dash: "dash", name: `${g}-ln${i}` });
    }
    txt(s, [
      { text: "MINI-CHALLENGE   ", options: { fontFace: F.SB, color: K.coral, charSpacing: 2 } },
      { text: "Rate yourself 1–5 on each skill. Your lowest score is your next project.", options: { color: K.white } },
    ], { x: MX, y: 6.48, w: W - 2 * MX, h: 0.35, fontSize: 14, align: "center", name: "A5-mini" });
  }

  // ---------------- 4. PROOF ----------------
  {
    const s = newSlide("SK_DARK", "What makes you hireable", 3);
    eyebrow(s, "03  ·  PROOF OVER PAPER");
    txt(s, [
      { text: "Stop Collecting Certificates. ", options: { color: K.white } },
      { text: "Start Building Proof.", options: { color: K.turq } },
    ], { x: MX, y: 0.82, w: W - 2 * MX, h: 0.75, fontFace: F.H, fontSize: 34, name: "A0-title" });
    // left: certificates
    s.addImage({ path: path.join(IMG, "glow_coral.png"), x: 0.9, y: 2.0, w: 3.4, h: 3.4, transparency: 82 });
    await pic(s, "r_certs.png", { w: 3.55, cx: 2.55, cy: 3.6, name: "A1-certs", alt: "3D stack of certificates" });
    // VS
    oval(s, { x: 4.62, y: 3.3, d: 0.62, fill: K.surface2, line: K.line, name: "A2-vs" });
    txt(s, "VS", { x: 4.62, y: 3.3, w: 0.62, h: 0.62, fontFace: F.H, fontSize: 14, color: K.mute, align: "center", valign: "middle", name: "A2-vsT" });
    // right: repo card
    const c = { x: 5.55, y: 1.95, w: 7.03, h: 3.5 };
    rect(s, { x: c.x, y: c.y, w: c.w, h: c.h, fill: K.surface, line: K.line, r: 0.16, name: "A3-card" });
    s.addImage({ data: await icon("SiGithub", K.white), x: c.x + 0.3, y: c.y + 0.3, w: 0.34, h: 0.34, objectName: "A3-gh" });
    txt(s, [
      { text: "ali-hassan / ", options: { color: K.mute } },
      { text: "generator-subscriptions", options: { color: K.white, fontFace: F.SB } },
    ], { x: c.x + 0.78, y: c.y + 0.3, w: 5.2, h: 0.36, fontSize: 16, valign: "middle", name: "A3-repo" });
    rect(s, { x: c.x + c.w - 1.1, y: c.y + 0.33, w: 0.8, h: 0.3, line: K.mute2, r: 0.15, name: "A3-pub" });
    txt(s, "Public", { x: c.x + c.w - 1.1, y: c.y + 0.33, w: 0.8, h: 0.3, fontSize: 10, color: K.mute, align: "center", valign: "middle", name: "A3-pubT" });
    txt(s, "Tracks monthly payments for a neighborhood generator. The owner sees who paid in one tap.",
      { x: c.x + 0.3, y: c.y + 0.82, w: c.w - 0.6, h: 0.6, fontSize: 14, color: K.mute, name: "A3-desc" });
    const tags = ["FastAPI", "PostgreSQL", "React", "Deployed"];
    let tx = c.x + 0.3;
    for (const t of tags) {
      const tw = 0.24 + t.length * 0.085;
      rect(s, { x: tx, y: c.y + 1.5, w: tw, h: 0.3, fill: "0E3436", r: 0.15, name: "A3-tag" + t });
      txt(s, t, { x: tx, y: c.y + 1.5, w: tw, h: 0.3, fontFace: F.MD, fontSize: 10, color: K.turq, align: "center", valign: "middle", name: "A3-tagT" + t });
      tx += tw + 0.12;
    }
    // contribution graph
    const shades = ["16292A", "0B4E50", "067A7A", "03A5A5", "0CCCCC"];
    let seed = 7;
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    const gx = c.x + 0.3, gy = c.y + 2.0, cs = 0.155, gap = 0.045;
    for (let col = 0; col < 18; col++) for (let row = 0; row < 5; row++) {
      const ramp = col / 18, v = rnd() * 0.6 + ramp * 0.55;
      const lvl = v < 0.35 ? 0 : v < 0.55 ? 1 : v < 0.75 ? 2 : v < 0.95 ? 3 : 4;
      rect(s, { x: gx + col * (cs + gap), y: gy + row * (cs + gap), w: cs, h: cs, fill: shades[lvl], r: 0.03, name: "A4-g" });
    }
    txt(s, "Commit activity, last 18 weeks", { x: gx, y: gy + 1.02, w: 4.4, h: 0.25, fontSize: 10, color: K.mute2, name: "A4-gl" });
    const checks = ["README with screenshots", "Live demo link", "Tests for core logic", "Decisions explained"];
    const ck = await icon("LuCircleCheck", K.turq);
    for (let i = 0; i < checks.length; i++) {
      s.addImage({ data: ck, x: c.x + 4.15, y: gy + i * 0.3 + 0.02, w: 0.2, h: 0.2, objectName: "A5-ck" + i });
      txt(s, checks[i], { x: c.x + 4.42, y: gy + i * 0.3, w: 2.45, h: 0.26, fontSize: 12, color: K.white, valign: "middle", name: "A5-ckT" + i });
    }
    // captions
    txt(s, "CERTIFICATE", { x: MX, y: 5.68, w: 3.6, h: 0.25, fontFace: F.SB, fontSize: 11, color: K.coral, charSpacing: 3, name: "A6-cl" });
    txt(s, "Says you attended.", { x: MX, y: 5.95, w: 3.8, h: 0.42, fontFace: F.SB, fontSize: 20, name: "A6-ct" });
    txt(s, "Easy to collect. Hard for an employer to judge.", { x: MX, y: 6.38, w: 4.2, h: 0.3, fontSize: 13, color: K.mute, name: "A6-cs" });
    txt(s, "PROJECT", { x: c.x, y: 5.68, w: 3, h: 0.25, fontFace: F.SB, fontSize: 11, color: K.turq, charSpacing: 3, name: "A7-pl" });
    txt(s, "Shows you can build.", { x: c.x, y: 5.95, w: 4, h: 0.42, fontFace: F.SB, fontSize: 20, name: "A7-pt" });
    txt(s, "More ideas: clinic queue system · campus used-book marketplace", { x: c.x, y: 6.38, w: 7.03, h: 0.3, fontSize: 13, color: K.turq, name: "A7-ps" });
  }

  // ---------------- 5. AI SUPERPOWER ----------------
  pres.addSection({ title: "Work with AI" });
  {
    const s = newSlide("SK_DARK", "Work with AI", 4);
    s.addImage({ path: path.join(IMG, "pat_right.png"), x: 0, y: 0, w: W, h: 7.5 });
    eyebrow(s, "04  ·  AI AS YOUR COLLABORATOR");
    title(s, "Your New Superpower: AI");
    txt(s, "Treat AI like a brilliant intern: fast, tireless, and sometimes confidently wrong.",
      { x: MX, y: 1.62, w: 6.3, h: 0.7, fontSize: 17, color: K.mute, name: "A1-sub" });
    const steps = [
      ["YOU", "Frame the problem", "Context, constraints, an example of what good looks like."],
      ["AI", "Draft", "Code, schema, test cases, explanations, options."],
      ["YOU", "Verify", "Run it, test it, read every line you will ship."],
      ["YOU", "Decide", "Accept, edit, or throw it away. You own the result."],
    ];
    for (let i = 0; i < 4; i++) {
      const y = 2.55 + i * 0.82, you = steps[i][0] === "YOU", g = `A${2 + i}`;
      rect(s, { x: MX, y, w: 6.3, h: 0.7, fill: you ? K.surface : "0B2E30", line: you ? K.line : K.teal, r: 0.14, name: `${g}-bg` });
      rect(s, { x: MX + 0.18, y: y + 0.18, w: 0.62, h: 0.34, fill: you ? K.white : K.turq, r: 0.17, name: `${g}-pill` });
      txt(s, steps[i][0], { x: MX + 0.18, y: y + 0.18, w: 0.62, h: 0.34, fontFace: F.H, fontSize: 11, color: K.black, align: "center", valign: "middle", name: `${g}-who` });
      txt(s, `${i + 1}  ${steps[i][1]}`, { x: MX + 1.0, y: y + 0.06, w: 5.1, h: 0.32, fontFace: F.SB, fontSize: 16, name: `${g}-t` });
      txt(s, steps[i][2], { x: MX + 1.0, y: y + 0.37, w: 5.2, h: 0.28, fontSize: 12, color: K.mute, name: `${g}-d` });
    }
    rect(s, { x: MX, y: 5.95, w: 6.3, h: 0.72, fill: "0B2E30", r: 0.14, name: "A6-demo" });
    s.addImage({ data: await icon("LuTerminal", K.turq), x: MX + 0.22, y: 6.13, w: 0.36, h: 0.36, objectName: "A6-demoI" });
    txt(s, [
      { text: "LIVE DEMO  ", options: { fontFace: F.SB, color: K.turq, charSpacing: 2 } },
      { text: "Paste a real bug. Ask AI to explain it, then make it prove the fix with a test.", options: { color: K.white } },
    ], { x: MX + 0.75, y: 5.95, w: 5.4, h: 0.72, fontSize: 13, valign: "middle", name: "A6-demoT" });
    // orb + floating role chips
    s.addImage({ path: path.join(IMG, "glow_turq.png"), x: 7.2, y: 0.9, w: 5.9, h: 5.9, transparency: 40 });
    await pic(s, "r_orb.png", { h: 4.5, cx: 10.15, cy: 3.95, name: "A1-orb", alt: "3D AI orb" });
    const chips = [["Explains code", 7.35, 1.85], ["Drafts boilerplate", 10.4, 1.55], ["Writes test cases", 10.45, 5.95], ["Reviews your work", 7.2, 5.75]];
    for (let i = 0; i < chips.length; i++) {
      const [t, x, y] = chips[i], w = 0.5 + t.length * 0.092;
      rect(s, { x, y, w, h: 0.4, fill: "0B1A1B", line: K.teal, r: 0.2, name: `A7-chip${i}` });
      oval(s, { x: x + 0.16, y: y + 0.15, d: 0.1, fill: K.turq, name: `A7-dot${i}` });
      txt(s, t, { x: x + 0.34, y, w: w - 0.4, h: 0.4, fontFace: F.MD, fontSize: 12, valign: "middle", name: `A7-chipT${i}` });
    }
  }

  // ---------------- 6. IDEA -> PRODUCT ----------------
  {
    const s = newSlide("SK_DARK", "Work with AI", 5);
    eyebrow(s, "05  ·  THE BUILD WORKFLOW");
    title(s, "From Idea to Real Product");
    const st = [
      ["LuLightbulb", "Idea", "Brainstorm ideas and questions", "Is this problem worth solving?"],
      ["LuSearch", "Research", "Summarize the competition", "Which sources are true?"],
      ["LuDatabase", "Database", "Draft schema and seed data", "Keys, relations, constraints"],
      ["LuServer", "Backend", "Boilerplate and unit tests", "Business rules and security"],
      ["LuPlug", "API", "API docs and example calls", "Contracts and error handling"],
      ["LuLayoutDashboard", "UI / UX", "Wireframes and UI copy", "What users truly need"],
      ["LuRocket", "Product", "Deploy scripts and checklists", "Correct? Ready to ship?"],
    ];
    const n = st.length, cw = 1.56, gap = (W - 2 * MX - n * cw) / (n - 1);
    txt(s, "WHERE AI ASSISTS", { x: MX, y: 1.72, w: 4, h: 0.25, fontFace: F.SB, fontSize: 11, color: K.turq, charSpacing: 3, name: "A1-l1" });
    txt(s, "WHERE YOU DECIDE", { x: MX, y: 4.55, w: 4, h: 0.25, fontFace: F.SB, fontSize: 11, color: K.coral, charSpacing: 3, name: "A9-l2" });
    const nodeY = 3.16, nd = 0.84;
    line(s, MX + cw / 2, nodeY + nd / 2, W - MX - cw / 2, nodeY + nd / 2, { color: K.teal, width: 2, name: "A1-path" });
    const spark = await icon("LuSparkles", K.turq), user = await icon("LuUser", K.coral);
    for (let i = 0; i < n; i++) {
      const x = MX + i * (cw + gap), last = i === n - 1, g = `A${2 + i}`;
      // AI chip
      rect(s, { x, y: 2.0, w: cw, h: 0.98, fill: "0B2224", line: "145456", r: 0.1, name: `${g}-ai` });
      s.addImage({ data: spark, x: x + 0.13, y: 2.12, w: 0.2, h: 0.2, objectName: `${g}-aiI` });
      txt(s, st[i][2], { x: x + 0.13, y: 2.38, w: cw - 0.24, h: 0.54, fontSize: 11, color: "CFE9E9", name: `${g}-aiT` });
      // node
      if (last) s.addImage({ path: path.join(IMG, "glow_turq.png"), x: x + cw / 2 - 1.1, y: nodeY + nd / 2 - 1.1, w: 2.2, h: 2.2, transparency: 35 });
      rect(s, { x: x + (cw - nd) / 2, y: nodeY, w: nd, h: nd, fill: last ? K.turq : K.surface2, line: last ? undefined : K.teal, lw: 1.25, r: 0.2, name: `${g}-n` });
      s.addImage({ data: await icon(st[i][0], last ? K.black : K.turq), x: x + (cw - 0.42) / 2, y: nodeY + 0.22, w: 0.42, h: 0.42, objectName: `${g}-nI` });
      txt(s, st[i][1], { x: x - 0.1, y: nodeY + nd + 0.08, w: cw + 0.2, h: 0.35, fontFace: F.SB, fontSize: 15, color: last ? K.turq : K.white, align: "center", name: `${g}-nT` });
      // human chip
      rect(s, { x, y: 4.83, w: cw, h: 0.98, fill: "2A1416", line: "6B2A2D", r: 0.1, name: `A9-h${i}` });
      s.addImage({ data: user, x: x + 0.13, y: 4.95, w: 0.2, h: 0.2, objectName: `A9-hI${i}` });
      txt(s, st[i][3], { x: x + 0.13, y: 5.21, w: cw - 0.24, h: 0.54, fontSize: 11, color: "F6D9D9", name: `A9-hT${i}` });
    }
    txt(s, [
      { text: "AI drafts. ", options: { color: K.turq } },
      { text: "Engineers decide.", options: { color: K.white } },
    ], { x: MX, y: 6.08, w: 6, h: 0.5, fontFace: F.H, fontSize: 24, name: "A10-take" });
    txt(s, "Ask: which step would you never fully hand to AI? Why?", { x: 6.9, y: 6.16, w: W - MX - 6.9, h: 0.4, fontSize: 14, color: K.mute, align: "right", italic: true, name: "A10-ask" });
  }

  // ---------------- 7. TOOLKIT ----------------
  pres.addSection({ title: "Build" });
  {
    const s = newSlide("SK_LIGHT", "Build", 6);
    eyebrow(s, "06  ·  TOOLS AND WHAT THEY ARE FOR", K.deep);
    title(s, "The Modern Engineer's Toolkit");
    const tools = [
      ["SiFigma", "F24E1E", "Figma", "DESIGN", "Design screens and prototypes before coding."],
      ["SiClaude", "D97757", "AI Assistants", "THINK", "Claude, ChatGPT: explain, plan, review, debug."],
      ["SiCursor", "000000", "Cursor", "CODE", "AI code editor that understands your repo."],
      ["SiGithub", "181717", "GitHub", "COLLABORATE", "Version control and your public portfolio."],
      ["SiFastapi", "009688", "FastAPI", "BACKEND", "Fast, typed Python APIs with automatic docs."],
      ["SiPostgresql", "4169E1", "PostgreSQL", "DATA", "The relational database behind real products."],
      ["SiSupabase", "3ECF8E", "Supabase", "DATA", "Postgres plus auth and storage in minutes."],
      ["SiPostman", "FF6C37", "Postman", "TEST", "Send requests, test and document your API."],
      ["SiDocker", "2496ED", "Docker", "SHIP", "Package your app to run the same everywhere."],
      ["SiVercel", "000000", "Vercel / Render", "DEPLOY", "Put your app online with a public URL."],
    ];
    const cols = 5, tw = (W - 2 * MX - (cols - 1) * 0.25) / cols, th = 2.1;
    for (let i = 0; i < tools.length; i++) {
      const [ic, col, name, tag, role] = tools[i];
      const x = MX + (i % cols) * (tw + 0.25), y = 1.72 + Math.floor(i / cols) * (th + 0.2), g = `A${1 + (i % cols)}`;
      rect(s, { x, y, w: tw, h: th, fill: K.white, line: "D5E3E3", r: 0.14, shadow: 0.1, name: `${g}-t${i}` });
      s.addImage({ data: await icon(ic, col), x: x + 0.22, y: y + 0.24, w: 0.46, h: 0.46, objectName: `${g}-i${i}` });
      const tagW = 0.2 + tag.length * 0.075;
      rect(s, { x: x + tw - tagW - 0.18, y: y + 0.3, w: tagW, h: 0.26, fill: "DDF3F3", r: 0.13, name: `${g}-g${i}` });
      txt(s, tag, { x: x + tw - tagW - 0.18, y: y + 0.3, w: tagW, h: 0.26, fontFace: F.SB, fontSize: 8, color: K.deep, align: "center", valign: "middle", charSpacing: 1, name: `${g}-gt${i}` });
      txt(s, name, { x: x + 0.22, y: y + 0.86, w: tw - 0.4, h: 0.36, fontFace: F.SB, fontSize: 15, color: K.darkText, name: `${g}-n${i}` });
      txt(s, role, { x: x + 0.22, y: y + 1.24, w: tw - 0.38, h: 0.75, fontSize: 12, color: K.bodyDark, name: `${g}-r${i}` });
    }
    txt(s, [
      { text: "RULE OF THUMB   ", options: { fontFace: F.SB, color: K.deep, charSpacing: 2 } },
      { text: "Learn one tool per layer deeply. Tools change every year; fundamentals don't.", options: { color: K.darkText } },
    ], { x: MX, y: 6.38, w: W - 2 * MX, h: 0.4, fontSize: 14, valign: "middle", name: "A6-rule" });
  }

  // ---------------- 8. LIVE CHALLENGE ----------------
  {
    const s = newSlide("SK_DARK", "Build", 7);
    s.addImage({ path: path.join(IMG, "pat_full.png"), x: 0, y: 0, w: W, h: 7.5 });
    eyebrow(s, "07  ·  LIVE CHALLENGE  ·  25 MINUTES");
    title(s, "Let's Build Something");
    rect(s, { x: W - MX - 2.2, y: 0.88, w: 2.2, h: 0.48, fill: K.coral, r: 0.24, name: "A0-live" });
    oval(s, { x: W - MX - 2.0, y: 1.05, d: 0.14, fill: K.white, name: "A0-liveDot" });
    txt(s, "BUILDING LIVE", { x: W - MX - 1.78, y: 0.88, w: 1.7, h: 0.48, fontFace: F.H, fontSize: 12, color: K.white, valign: "middle", charSpacing: 1, name: "A0-liveT" });
    // vote panel
    txt(s, "STEP 0  ·  THE ROOM VOTES", { x: MX, y: 1.78, w: 3.8, h: 0.28, fontFace: F.SB, fontSize: 11, color: K.turq, charSpacing: 2, name: "A1-vl" });
    const ideas = [["A", "Generator Subscription Tracker", "Who paid this month?"], ["B", "Clinic Queue System", "Book a slot, skip the wait."], ["C", "Campus Lost & Found", "Post it, find it, claim it."]];
    for (let i = 0; i < 3; i++) {
      const y = 2.12 + i * 0.98, sel = i === 0;
      rect(s, { x: MX, y, w: 3.75, h: 0.84, fill: sel ? "0B2E30" : K.surface, line: sel ? K.turq : K.line, lw: sel ? 1.5 : 0.75, r: 0.14, name: `A1-v${i}` });
      oval(s, { x: MX + 0.18, y: y + 0.19, d: 0.46, fill: sel ? K.turq : K.surface2, name: `A1-vb${i}` });
      txt(s, ideas[i][0], { x: MX + 0.18, y: y + 0.19, w: 0.46, h: 0.46, fontFace: F.H, fontSize: 15, color: sel ? K.black : K.white, align: "center", valign: "middle", name: `A1-vbt${i}` });
      txt(s, ideas[i][1], { x: MX + 0.8, y: y + 0.12, w: 2.85, h: 0.34, fontFace: F.SB, fontSize: 12.5, name: `A1-vt${i}` });
      txt(s, ideas[i][2], { x: MX + 0.8, y: y + 0.45, w: 2.9, h: 0.3, fontSize: 12, color: K.mute, name: `A1-vd${i}` });
    }
    rect(s, { x: MX, y: 5.12, w: 3.75, h: 1.55, fill: K.surface, line: K.line, r: 0.14, name: "A2-roles" });
    txt(s, "3 VOLUNTEERS", { x: MX + 0.22, y: 5.25, w: 3, h: 0.26, fontFace: F.SB, fontSize: 11, color: K.coral, charSpacing: 2, name: "A2-rl" });
    const roles = [["Driver", "types and runs the code"], ["Navigator", "writes the prompts"], ["Reviewer", "checks every output"]];
    for (let i = 0; i < 3; i++)
      txt(s, [{ text: roles[i][0] + "  ", options: { fontFace: F.SB, color: K.white } }, { text: roles[i][1], options: { color: K.mute } }],
        { x: MX + 0.22, y: 5.58 + i * 0.33, w: 3.4, h: 0.3, fontSize: 12, name: `A2-r${i}` });
    // steps grid
    const steps = [
      ["Define", "3 min", "One user, one problem, three must-have features."],
      ["Model", "4 min", "AI drafts the tables. We fix keys and relations."],
      ["Generate", "6 min", "FastAPI + Supabase endpoints, written with AI."],
      ["Verify", "5 min", "Test in Postman. Find and fix one real bug."],
      ["Interface", "4 min", "One page: list subscribers, add one, mark paid."],
      ["Demo", "3 min", "Run it live. What would you build next?"],
    ];
    const gx = 4.85, gw = W - MX - gx, cw = (gw - 2 * 0.22) / 3, ch = 1.52;
    for (let i = 0; i < 6; i++) {
      const x = gx + (i % 3) * (cw + 0.22), y = 1.8 + Math.floor(i / 3) * (ch + 0.2), g = `A${3 + i}`;
      rect(s, { x, y, w: cw, h: ch, fill: K.surface, line: K.line, r: 0.14, name: `${g}-c` });
      txt(s, String(i + 1).padStart(2, "0"), { x: x + 0.22, y: y + 0.18, w: 0.8, h: 0.5, fontFace: F.H, fontSize: 26, color: K.turq, name: `${g}-n` });
      rect(s, { x: x + cw - 1.0, y: y + 0.24, w: 0.8, h: 0.3, line: K.teal, r: 0.15, name: `${g}-tm` });
      txt(s, steps[i][1], { x: x + cw - 1.0, y: y + 0.24, w: 0.8, h: 0.3, fontFace: F.MD, fontSize: 10, color: K.turq, align: "center", valign: "middle", name: `${g}-tmT` });
      txt(s, steps[i][0], { x: x + 0.22, y: y + 0.68, w: cw - 0.4, h: 0.32, fontFace: F.SB, fontSize: 16, name: `${g}-t` });
      txt(s, steps[i][2], { x: x + 0.22, y: y + 0.99, w: cw - 0.4, h: 0.48, fontSize: 11, color: K.mute, name: `${g}-d` });
    }
    const oy = 5.12;
    rect(s, { x: gx, y: oy, w: gw, h: 1.55, fill: "0B2E30", line: K.turq, lw: 1.25, r: 0.14, name: "A9-out" });
    s.addImage({ data: await icon("LuTarget", K.turq), x: gx + 0.25, y: oy + 0.25, w: 0.42, h: 0.42, objectName: "A9-outI" });
    txt(s, "EXPECTED OUTPUT IN 25 MINUTES", { x: gx + 0.85, y: oy + 0.26, w: 5, h: 0.28, fontFace: F.SB, fontSize: 11, color: K.turq, charSpacing: 2, name: "A9-outL" });
    const outs = [["2", "database tables"], ["4", "API endpoints"], ["1", "working web page"], ["1", "README + demo"]];
    const ow = (gw - 1.1) / 4;
    for (let i = 0; i < 4; i++) {
      const x = gx + 0.85 + i * ow;
      txt(s, outs[i][0], { x, y: oy + 0.58, w: 0.6, h: 0.7, fontFace: F.H, fontSize: 36, color: K.white, name: `A9-o${i}` });
      txt(s, outs[i][1], { x: x + 0.55, y: oy + 0.72, w: ow - 0.6, h: 0.5, fontSize: 13, color: "CFE9E9", valign: "middle", name: `A9-ot${i}` });
    }
  }

  // ---------------- 9. ENGINEER VS PROMPT WRITER ----------------
  pres.addSection({ title: "Think like an engineer" });
  {
    const s = newSlide("SK_DARK", "Think like an engineer", 8);
    eyebrow(s, "08  ·  VERIFY EVERYTHING");
    title(s, "Think Like an Engineer, Not a Prompt Writer");
    const c = { x: MX, y: 1.85, w: 6.55, h: 4.1 };
    rect(s, { x: c.x, y: c.y, w: c.w, h: c.h, fill: "081112", line: K.line, r: 0.14, name: "A1-win" });
    [K.coral, "F2B544", "36C26E"].forEach((col, i) => oval(s, { x: c.x + 0.22 + i * 0.22, y: c.y + 0.2, d: 0.13, fill: col, name: "A1-dot" + i }));
    txt(s, "users.py  ·  generated by AI in 4 seconds", { x: c.x + 1.0, y: c.y + 0.14, w: 4.5, h: 0.26, fontSize: 11, color: K.mute2, name: "A1-file" });
    rect(s, { x: c.x + c.w - 1.95, y: c.y + 0.13, w: 1.75, h: 0.28, fill: K.coral, r: 0.14, name: "A1-spot" });
    txt(s, "SPOT 4 BUGS · 60s", { x: c.x + c.w - 1.95, y: c.y + 0.13, w: 1.75, h: 0.28, fontFace: F.SB, fontSize: 10, color: K.white, align: "center", valign: "middle", name: "A1-spotT" });
    const kw = { color: "0CCCCC" }, st = { color: "F2B57A" }, pl = { color: "D6E2E2" }, dc = { color: "8FE3E3" };
    const code = [
      [["@app", dc], [".get(", pl], ['"/users/{user_id}"', st], [")", pl]],
      [["def ", kw], ["get_user(user_id):", pl]],
      [["    query = ", pl], ['f"SELECT * FROM users WHERE id = {user_id}"', st]],
      [["    user = db.execute(query).fetchone()", pl]],
      [["    return ", kw], ["user", pl]],
    ];
    const ly = c.y + 0.62, lh = 0.3;
    code.forEach((ln, i) => {
      txt(s, String(i + 1), { x: c.x + 0.2, y: ly + i * lh, w: 0.25, h: lh, fontFace: F.MONO, fontSize: 12, color: "3E5455", align: "right", valign: "middle" });
      txt(s, ln.map(([t, o]) => ({ text: t, options: o })), { x: c.x + 0.6, y: ly + i * lh, w: c.w - 0.75, h: lh, fontFace: F.MONO, fontSize: 11, valign: "middle", name: "A1-code" + i });
    });
    // markers
    const marks = [[2, "1"], [0, "2"], [4, "3"], [4, "4"]];
    marks.forEach(([li, n], k) => {
      const x = c.x + c.w - 0.42 - (k === 3 ? 0.33 : 0);
      oval(s, { x, y: ly + li * lh + 0.03, d: 0.25, fill: K.coral, name: `A3-m${k}` });
      txt(s, n, { x, y: ly + li * lh + 0.03, w: 0.25, h: 0.25, fontFace: F.H, fontSize: 9, color: K.white, align: "center", valign: "middle", name: `A3-mt${k}` });
    });
    line(s, c.x + 0.2, c.y + 2.25, c.x + c.w - 0.2, c.y + 2.25, { color: K.line, width: 0.75 });
    txt(s, "REVIEW FINDINGS", { x: c.x + 0.25, y: c.y + 2.42, w: 3, h: 0.25, fontFace: F.SB, fontSize: 10, color: K.coral, charSpacing: 2, name: "A3-fl" });
    const finds = ["SQL injection: user input pasted straight into the query",
      "No authentication: anyone can read any user",
      "Leaks password_hash and private fields in the response",
      "No 404: a missing user returns null, not an error"];
    finds.forEach((f, i) => {
      const y = c.y + 2.75 + i * 0.32;
      oval(s, { x: c.x + 0.25, y: y + 0.03, d: 0.22, fill: K.coral, name: `A3-f${i}` });
      txt(s, String(i + 1), { x: c.x + 0.25, y: y + 0.03, w: 0.22, h: 0.22, fontFace: F.H, fontSize: 8, color: K.white, align: "center", valign: "middle", name: `A3-fn${i}` });
      txt(s, f, { x: c.x + 0.6, y, w: c.w - 0.8, h: 0.28, fontSize: 12, color: K.white, valign: "middle", name: `A3-ft${i}` });
    });
    txt(s, [{ text: "“It runs” ", options: { color: K.white } }, { text: "is not the same as ", options: { color: K.mute } }, { text: "“it’s right.”", options: { color: K.turq } }],
      { x: MX, y: 6.18, w: 6.6, h: 0.5, fontFace: F.H, fontSize: 21, name: "A4-verdict" });
    // checklist
    const rx = 7.6, rw = W - MX - rx;
    txt(s, "THE ENGINEER'S REVIEW", { x: rx, y: 1.85, w: rw, h: 0.28, fontFace: F.SB, fontSize: 11, color: K.turq, charSpacing: 2, name: "A2-cl" });
    const chk = [
      ["LuLayers", "Architecture", "Does it fit our structure, or is it a hack?"],
      ["LuGitBranch", "Logic", "What happens with empty or weird input?"],
      ["LuShieldCheck", "Security", "Can a user reach data that isn't theirs?"],
      ["LuUsers", "Usability", "Will a user understand what went wrong?"],
      ["LuTestTube", "Correctness", "Which test proves it works? Did I run it?"],
    ];
    for (let i = 0; i < chk.length; i++) {
      const y = 2.22 + i * 0.9;
      await iconCircle(s, chk[i][0], rx, y, 0.6, { fill: K.surface2, line: K.teal, name: `A2-ci${i}` });
      txt(s, chk[i][1], { x: rx + 0.8, y: y - 0.02, w: rw - 0.8, h: 0.32, fontFace: F.SB, fontSize: 16, name: `A2-ct${i}` });
      txt(s, chk[i][2], { x: rx + 0.8, y: y + 0.3, w: rw - 0.8, h: 0.5, fontSize: 13, color: K.mute, name: `A2-cd${i}` });
    }
  }

  // ---------------- 10. FIRST JOB ROADMAP ----------------
  pres.addSection({ title: "Get hired" });
  {
    const s = newSlide("SK_DARK", "Get hired", 9);
    s.addImage({ path: path.join(IMG, "pat_full.png"), x: 0, y: 0, w: W, h: 7.5 });
    eyebrow(s, "09  ·  FROM STUDENT TO HIRED");
    title(s, "How to Actually Get Your First Technical Job");
    const xs = [1.35, 4.42, 7.49, 10.56], y1 = 2.35, y2 = 4.72, nd = 0.74;
    // serpentine path
    const L = xs[0] + nd / 2, R = xs[3] + nd / 2, top = y1 + nd / 2, bot = y2 + nd / 2;
    s.addShape(pres.shapes.CUSTOM_GEOMETRY, {
      x: L, y: top, w: R - L + 1.25, h: bot - top, line: { color: K.teal, width: 2.5, dashType: "dash" }, fill: { type: "none" },
      points: [{ x: 0, y: 0 }, { x: R - L, y: 0 }, { x: R - L, y: bot - top, curve: { type: "cubic", x1: R - L + 1.6, y1: 0, x2: R - L + 1.6, y2: bot - top } }, { x: 0, y: bot - top }],
      objectName: "A1-path",
    });
    const ms = [
      ["LuGithub", "GitHub", "Clean profile. Pin 3 repos with real READMEs."],
      ["LuFolderGit2", "Portfolio", "2–3 projects that solve real problems."],
      ["LuFileText", "CV", "One page. Projects first. Links that work."],
      ["LuLinkedin", "LinkedIn", "Clear headline. Share what you build, weekly."],
      ["LuHandshake", "Networking", "Meetups, hackathons, communities. Help first."],
      ["LuBriefcase", "Internships", "Apply early. Small startups count."],
      ["LuMic", "Interviews", "Explain your own project's decisions out loud."],
      ["LuSend", "Applications", "Tailor each one. Track them. Follow up."],
    ];
    for (let i = 0; i < 8; i++) {
      const row2 = i >= 4, x = row2 ? xs[7 - i] : xs[i], y = row2 ? y2 : y1, goal = i === 7, g = `A${2 + i}`;
      if (goal) s.addImage({ path: path.join(IMG, "glow_coral.png"), x: x + nd / 2 - 0.9, y: y + nd / 2 - 0.9, w: 1.8, h: 1.8, transparency: 55 });
      await iconCircle(s, ms[i][0], x, y, nd, { fill: goal ? K.coral : (i < 4 ? K.turq : K.surface2), color: goal || i < 4 ? K.black : K.turq,
        line: i >= 4 && !goal ? K.teal : undefined, lw: 1.5, name: `${g}-c` });
      oval(s, { x: x - 0.08, y: y - 0.08, d: 0.3, fill: K.ink, line: K.teal, lw: 1, name: `${g}-b` });
      txt(s, String(i + 1), { x: x - 0.08, y: y - 0.08, w: 0.3, h: 0.3, fontFace: F.H, fontSize: 9, color: K.turq, align: "center", valign: "middle", name: `${g}-bn` });
      const edge = (i === 3 || i === 4), tw = 2.4, tx = x + nd / 2 - tw / 2 - (edge ? 0.25 : 0);
      txt(s, ms[i][1], { x: tx, y: y + nd + 0.12, w: tw, h: 0.34, fontFace: F.SB, fontSize: 16, align: "center", color: goal ? K.coral : K.white, name: `${g}-t` });
      txt(s, ms[i][2], { x: tx, y: y + nd + 0.46, w: tw, h: 0.55, fontSize: 13, color: K.mute, align: "center", name: `${g}-d` });
    }
    txt(s, "START", { x: 0.3, y: y1 + 0.24, w: 1.0, h: 0.26, fontFace: F.SB, fontSize: 10, color: K.turq, align: "right", charSpacing: 2, name: "A2-start" });
  }

  // ---------------- 11. NEXT 30 DAYS ----------------
  {
    const s = newSlide("SK_TURQ", "Get hired", 10);
    eyebrow(s, "10  ·  THE 30-DAY CHALLENGE", K.black);
    title(s, "Your Next 30 Days");
    rect(s, { x: W - MX - 4.1, y: 0.88, w: 4.1, h: 0.5, fill: K.black, r: 0.25, name: "A0-shot" });
    s.addImage({ data: await icon("LuSmartphone", K.turq), x: W - MX - 3.88, y: 0.98, w: 0.3, h: 0.3, objectName: "A0-shotI" });
    txt(s, "Screenshot this. Start tomorrow.", { x: W - MX - 3.48, y: 0.88, w: 3.35, h: 0.5, fontFace: F.SB, fontSize: 13, color: K.white, valign: "middle", name: "A0-shotT" });
    const weeks = [
      ["WEEK 1", "PICK", "Choose your problem and your stack.", ["Pick one real problem around you", "Choose one stack and stick to it", "Create the repo and a README plan"]],
      ["WEEK 2", "BUILD", "Make the core work.", ["Design the database", "Build 3–4 API endpoints", "Commit every day you code"]],
      ["WEEK 3", "SHIP", "Put it online.", ["Add a simple interface", "Test the core logic", "Deploy it with a public link"]],
      ["WEEK 4", "SHOW", "Let people see it.", ["Polish the README with screenshots", "Post a short demo video", "Apply to 5 roles with this project"]],
    ];
    const cw = (W - 2 * MX - 3 * 0.25) / 4, y0 = 1.8, ch = 4.55;
    const box = await icon("LuSquare", K.turq);
    for (let i = 0; i < 4; i++) {
      const x = MX + i * (cw + 0.25), g = `A${1 + i}`;
      rect(s, { x, y: y0, w: cw, h: ch, fill: K.black, r: 0.18, shadow: 0.25, name: `${g}-c` });
      txt(s, weeks[i][0], { x: x + 0.3, y: y0 + 0.3, w: 1.6, h: 0.26, fontFace: F.SB, fontSize: 11, color: K.turq, charSpacing: 3, name: `${g}-w` });
      txt(s, `Day ${i * 7 + 1}–${i === 3 ? 30 : i * 7 + 7}`, { x: x + cw - 1.55, y: y0 + 0.3, w: 1.25, h: 0.26, fontSize: 10, color: K.mute2, align: "right", name: `${g}-dy` });
      txt(s, weeks[i][1], { x: x + 0.3, y: y0 + 0.62, w: cw - 0.5, h: 0.65, fontFace: F.H, fontSize: 36, color: K.white, name: `${g}-t` });
      txt(s, weeks[i][2], { x: x + 0.3, y: y0 + 1.32, w: cw - 0.55, h: 0.55, fontSize: 13, color: K.mute, name: `${g}-s` });
      rect(s, { x: x + 0.3, y: y0 + 1.98, w: cw - 0.6, h: 0.012, fill: "26393A", name: `${g}-hr` });
      weeks[i][3].forEach((t, k) => {
        const ty = y0 + 2.18 + k * 0.74;
        s.addImage({ data: box, x: x + 0.3, y: ty + 0.03, w: 0.22, h: 0.22, objectName: `${g}-bx${k}` });
        txt(s, t, { x: x + 0.66, y: ty, w: cw - 0.9, h: 0.62, fontSize: 13, color: K.white, name: `${g}-k${k}` });
      });
    }
    txt(s, [
      { text: "DAILY MINIMUM: ", options: { fontFace: F.H } },
      { text: "1 focused hour.   Share your progress and tag @skillture.iq", options: { fontFace: F.SB } },
    ], { x: MX, y: 6.48, w: W - 2 * MX, h: 0.32, fontSize: 13, color: K.black, name: "A5-daily" });
  }

  // ---------------- 12. CLOSING ----------------
  pres.addSection({ title: "Close" });
  {
    const s = newSlide("SK_HERO", "Close", 11);
    s.addImage({ path: path.join(IMG, "pat_right.png"), x: 0, y: 0, w: W, h: 7.5 });
    s.addImage({ path: path.join(IMG, "glow_turq.png"), x: 7.4, y: 0.4, w: 5.9, h: 5.9, transparency: 40 });
    s.addImage({ path: path.join(IMG, "floor_glow.png"), x: 8.5, y: 5.6, w: 3.8, h: 0.8, transparency: 30, objectName: "A4-floor" });
    await pic(s, "r_blocks.png", { h: 5.2, cx: 10.4, cy: 3.4, name: "A4-blocks", alt: "3D building blocks" });
    txt(s, "Your degree is what you earned.", { x: MX, y: 1.2, w: 7.2, h: 0.55, fontFace: F.MD, fontSize: 26, color: K.mute2, name: "A1-l1" });
    txt(s, [{ text: "Your future is", options: { color: K.white, breakLine: true } }, { text: "what you build.", options: { color: K.turq } }],
      { x: MX - 0.03, y: 1.85, w: 7.6, h: 2.3, fontFace: F.H, fontSize: 60, lineSpacingMultiple: 0.95, name: "A2-l2" });
    const ctas = [["TONIGHT", "Create your GitHub repo"], ["THIS WEEK", "Pick your real problem"], ["IN 30 DAYS", "Ship it. Share it."]];
    const cw = 2.18;
    for (let i = 0; i < 3; i++) {
      const x = MX + i * (cw + 0.18);
      rect(s, { x, y: 4.55, w: cw, h: 1.05, fill: i === 2 ? "0B2E30" : K.surface, line: i === 2 ? K.turq : K.line, r: 0.14, name: `A3-c${i}` });
      txt(s, ctas[i][0], { x: x + 0.22, y: 4.7, w: cw - 0.3, h: 0.26, fontFace: F.SB, fontSize: 10, color: i === 2 ? K.turq : K.coral, charSpacing: 2, name: `A3-l${i}` });
      txt(s, ctas[i][1], { x: x + 0.22, y: 4.98, w: cw - 0.35, h: 0.5, fontFace: F.SB, fontSize: 14, color: K.white, name: `A3-t${i}` });
    }
    await pic(s, "logo_white.png", { x: MX, y: 6.3, h: 0.52, name: "A5-logo" });
    await pic(s, "wordmark_white.png", { x: MX + 0.64, y: 6.33, h: 0.46, name: "A5-word" });
    txt(s, [{ text: "Questions? ", options: { color: K.white, fontFace: F.SB } }, { text: "Let's talk.   @skillture.iq", options: { color: K.mute } }],
      { x: W - MX - 4.2, y: 6.42, w: 4.2, h: 0.35, fontSize: 14, align: "right", name: "A5-qa" });
  }

  // transitions/animations are added in post-processing (anim.py)
  const file = path.join(OUT, "Your_Degree_Is_Not_Enough.pptx");
  await pres.writeFile({ fileName: file });
  const { applyTheme } = require(process.env.PPTX_SKILL + "/scripts/apply_theme.js");
  await applyTheme(file, THEME);
  console.log("wrote", file);
}

build().catch((e) => { console.error(e); process.exit(1); });
