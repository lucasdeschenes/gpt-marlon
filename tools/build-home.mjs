// Assembles index.html from the ported Framer markup + this site's live data.
//
//   node tools/build-home.mjs
//
// Reads assets/framer-home.html (produced by tools/port-framer.mjs), rewrites the
// Framer placeholders into real wiring, and writes index.html. Keeping this
// separate from the port means re-porting a new Framer publish never clobbers
// the Supabase/i18n wiring — just re-run both scripts in order.

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { T, PH, SAME, DE } from "./i18n-home.mjs";

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmt = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
  return m ? `${MONTHS_EN[+m[2] - 1]} ${+m[3]}, ${m[1]}` : "";
};

// The design animates copy word by word, so anything we inject has to keep that
// shape — a flat string would drop the entrance animation. `plain` is the inverse:
// element text with the markup stripped, used to match a block by its wording.
const words = (t) => String(t).trim().split(/\s+/)
  .map((w) => `<span class="gm-word" style="display:inline-block">${esc(w)}</span>`)
  .join(" ");
const plain = (h) => h.replace(/<[^>]+>/g, "")
  .replace(/&amp;/g, "&").replace(/&nbsp;/g, " ")
  .replace(/&#39;/g, "'").replace(/&quot;/g, '"')
  .replace(/\s+/g, " ").trim();

let s = readFileSync("assets/framer-home.html", "utf8");

// ── real guides in place of the Framer CMS demo entries ───────────────────────
const SRC = "guides/data";
const fixes = existsSync(`${SRC}/fixes.json`) ? JSON.parse(readFileSync(`${SRC}/fixes.json`, "utf8")) : {};
let guides = readdirSync(SRC)
  .filter((f) => f.endsWith(".json") && f !== "fixes.json")
  .map((f) => JSON.parse(readFileSync(path.join(SRC, f), "utf8")))
  .filter((g) => !(fixes[g.file] && fixes[g.file].drop));
for (const g of guides) {
  const fx = fixes[g.file];
  if (fx) for (const k of ["title", "category", "tool", "summary", "slug"]) if (fx[k]) g[k] = fx[k];
}
const newest = guides
  .filter((g) => g.date)
  .sort((a, b) => String(b.date).localeCompare(String(a.date)))
  .slice(0, 4);

// the four demo slugs Framer shipped, in DOM order
const DEMO = [
  "humanize-dein-ki-text",
  "content-ideen-in-10-minuten",
  "interview-vorbereitung",
  "lange-dokumente-mit-claude",
];

let swapped = 0;
DEMO.forEach((slug, i) => {
  const g = newest[i];
  if (!g) return;
  const at = s.indexOf(`href="./guides/${slug}"`);
  if (at === -1) { console.log(`  ! demo card not found: ${slug}`); return; }
  const start = s.lastIndexOf("<a ", at);
  // card ends at the closing </a> that follows the <time> element
  const timeEnd = s.indexOf("</time>", at);
  const end = s.indexOf("</a>", timeEnd) + 4;
  let card = s.slice(start, end);

  // two <mark> chips: first is the category (yellow), second the tool (lavender)
  let markN = 0;
  card = card.replace(/(<mark[^>]*class="framer-text">)([^<]*)(<\/mark>)/g, (m, a, _t, c) =>
    a + esc(markN++ === 0 ? g.category : g.tool) + c);
  // title + description are the next two RichText paragraphs
  let pN = 0;
  card = card.replace(/(<p class="framer-text framer-styles-preset-1r7j6uw"[^>]*>)([^<]*)(<\/p>)/g,
    (m, a, _t, c) => a + esc(g.title) + c);
  card = card.replace(/(<p class="framer-text framer-styles-preset-1rvape2"[^>]*>)([^<]*)(<\/p>)/g,
    (m, a, _t, c) => a + esc(g.summary) + c);
  card = card.replace(/<time datetime="[^"]*">[^<]*<\/time>/,
    `<time datetime="${g.date}">${fmt(g.date)}</time>`);
  card = card.replace(`href="./guides/${slug}"`, `href="guides/${g.slug}.html"`);

  s = s.slice(0, start) + card + s.slice(end);
  swapped++;
});
console.log(`  swapped ${swapped}/4 guide cards for the newest real guides`);

// ── helper: find the end of a balanced element starting at `from` ─────────────
function balancedEnd(str, from) {
  const tag = /^<(\w+)/.exec(str.slice(from))[1];
  const re = new RegExp(`<${tag}\\b|</${tag}>`, "g");
  re.lastIndex = from;
  let depth = 0, m;
  while ((m = re.exec(str))) {
    depth += m[0][1] === "/" ? -1 : 1;
    if (depth === 0) return m.index + m[0].length;
  }
  return -1;
}

// ── marquees ──────────────────────────────────────────────────────────────────
// Both tickers are JS-driven in Framer. The logo strip is server-rendered but
// never scrolls without the runtime; the footer strip is a code-component
// plugin whose visible content is generated entirely in JS, leaving an empty
// band. Rebuild both as CSS animations.

// 1. logo strip — duplicate the items so the loop is seamless, then animate
let logoFixed = 0;
s = s.replace(/<ul style="display:flex;[^"]*">([\s\S]*?)<\/ul>/g, (full, items) => {
  logoFixed++;
  const open = full.slice(0, full.indexOf(">") + 1)
    .replace('<ul style="', '<ul class="gm-marquee-track" style="width:max-content;');
  return `${open}${items}${items}</ul>`;
});
console.log(`  logo marquee: ${logoFixed} track(s) duplicated + animated`);

// 2. footer strip — the code-component plugin (id 84d4c1) renders falling,
// bouncing pills entirely in JS. assets/footer-physics.js reimplements it from
// the plugin's own configuration; here we just drop in the container.
let footerFixed = 0;
{
  const marker = 'data-code-component-plugin-id';
  let idx;
  while ((idx = s.indexOf(marker, 0)) !== -1) {
    const start = s.lastIndexOf("<div", idx);
    const end = balancedEnd(s, start);
    if (end === -1) break;
    s = s.slice(0, start) +
        `<div class="gm-physics" data-footer-physics aria-hidden="true"></div>` +
        s.slice(end);
    footerFixed++;
  }
}
console.log(`  footer physics: ${footerFixed} container(s) placed`);


// ── tool logos ────────────────────────────────────────────────────────────────
// Two of the six marquee logos need fixing:
//   Perplexity — never uploaded in Framer, so the design shows a "Logo
//                Placeholder" with the letter P.
//   Claude     — the uploaded mark is Anthropic's "A\\" wordmark, which reads as
//                a letter next to the real logos; swap in the Claude sunburst.
// Both replacements are global: the marquee track is duplicated for a seamless
// loop, so every logo appears twice.
{
  const ph = /<div class="framer-zzcj0a" data-framer-name="Logo Placeholder"[\s\S]*?<\/div>/g;
  const img = (src, alt) =>
    '<div style="position:absolute;border-radius:inherit;top:0;right:0;bottom:0;left:0" data-framer-background-image-wrapper="true">' +
    `<img decoding="async" width="256" height="256" src="${src}" alt="${alt}" ` +
    'style="display:block;width:100%;height:100%;border-radius:inherit;object-position:center;object-fit:contain;padding:5px"></div>';

  const nPh = (s.match(ph) || []).length;
  s = s.replace(ph, img("assets/framer/perplexity.svg", "Perplexity logo"));

  const CLAUDE_PNG = /assets\/framer\/qvBJQCLNxQFdJkIHh4OurV9Kxeo-[0-9a-f]+\.png/g;
  const nCl = (s.match(CLAUDE_PNG) || []).length;
  s = s.replace(CLAUDE_PNG, "assets/framer/claude.svg");

  // Runway is out, Higgsfield is in. Swap the whole <img> rather than just the
  // src: the design's tag uses object-fit:cover, which crops a vector mark.
  const RUNWAY_IMG = /<img decoding="async" width="256" height="256" src="assets\/framer\/1Udzh6oTRw7Uo7nr9WsNAszt83g-[0-9a-f]+\.png"[^>]*>/g;
  const nRw = (s.match(RUNWAY_IMG) || []).length;
  s = s.replace(RUNWAY_IMG, img("assets/framer/higgsfield.svg", "Higgsfield logo"))
       .replace(/(<p[^>]*data-styles-preset="v_zCX1Lx4"[^>]*>)Runway(<\/p>)/g, "$1Higgsfield$2")
       .replace(/data-framer-name="Logo Item \/ Runway"/g, 'data-framer-name="Logo Item / Higgsfield"');

  console.log(`  tool logos: ${nPh} Perplexity placeholder(s) + ${nCl} Claude mark(s) + ${nRw} Runway->Higgsfield replaced`);
}

// ── navigation ────────────────────────────────────────────────────────────────
// The Framer template shipped Home / Ressourcen / "Book me". This site's nav is
// Ressourcen / Newsletter / Partnerships / Kontakt + the community CTA, so clone
// the "Resources Link" element for the missing entries and relabel the button.
// The nav is rendered three times (Desktop / Tablet / Phone variants).
// The Framer template's nav (Home / Ressourcen / "Book me") is a fixed-width
// component that can't take extra entries, and it differs from every other page.
// Replace it wholesale with the canonical nav so the bar is identical sitewide;
// assets/nav.css reproduces the design's styling for it.
const NAV = `  <nav class="site-nav">
    <a href="index.html" class="nav-logo"><span class="nav-logo-icon"><img src="assets/marlon.jpg" alt="Marlon" /></span><span class="nav-logo-text">GPT<span>★</span>Marlon</span></a>
    <ul class="nav-links">
      <li><a href="index.html" class="active">Home</a></li>
      <li><a href="guides.html"><span data-en="Resources">Ressourcen</span></a></li>
      <li><a href="newsletter.html">Newsletter</a></li>
      <li><a href="partnerships.html">Partnerships</a></li>
      <li><a href="contact.html"><span data-en="Contact">Kontakt</span></a></li>
    </ul>
    <div class="nav-actions">
      <a href="#" class="nav-cta" data-community><span data-en="Join Community">Community beitreten</span></a>
      <button class="lang-toggle" data-langtoggle aria-label="Sprache/Language">EN</button>
      <button class="nav-burger" data-burger aria-label="Menu" aria-expanded="false">☰</button>
    </div>
  </nav>
`;
{
  const at = s.indexOf('data-framer-name="Nav"');
  if (at === -1) {
    console.log("  ! Framer nav not found");
  } else {
    const start = s.lastIndexOf("<div", at);
    const end = balancedEnd(s, start);
    s = s.slice(0, start) + NAV + s.slice(end);
    console.log("  replaced the Framer nav with the shared site nav");
  }
}

// ── footer ────────────────────────────────────────────────────────────────────
// The design renders three breakpoint copies of the footer, each containing the
// physics band. Replace all three with the single canonical footer used across
// the site (assets/footer.css reproduces the design's styling for it) and keep
// one physics band inside it.
const IG = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.34 4.14.63c-.79.3-1.46.72-2.13 1.38A5.9 5.9 0 0 0 .63 4.14C.34 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.27 2.15.56 2.91.3.79.72 1.46 1.38 2.13.67.66 1.34 1.08 2.13 1.38.76.29 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.27 2.91-.56a5.9 5.9 0 0 0 2.13-1.38 5.9 5.9 0 0 0 1.38-2.13c.29-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.27-2.15-.56-2.91a5.9 5.9 0 0 0-1.38-2.13A5.9 5.9 0 0 0 19.86.63c-.76-.29-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0z"/><path d="M12 5.84A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84m0 10.16A4 4 0 1 1 16 12a4 4 0 0 1-4 4z"/><circle cx="18.41" cy="5.59" r="1.44"/></svg>`;
const TT = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.6 5.82a4.28 4.28 0 0 1-1.04-2.82h-3.31v13.35a2.4 2.4 0 1 1-2.4-2.4c.26 0 .5.04.74.12v-3.4a5.87 5.87 0 0 0-.74-.05 5.82 5.82 0 1 0 5.82 5.82V8.66a7.5 7.5 0 0 0 4.38 1.4V6.75a4.28 4.28 0 0 1-3.45-.93z"/></svg>`;
const MAIL = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2.5" y="4.5" width="19" height="15" rx="2.5"/><path d="M3 6l9 6.5L21 6"/></svg>`;
const SITE_FOOTER = `  <footer class="site-footer">
    <div class="footer-inner">
      <p class="footer-copy">&copy; 2026 GPT<span>&#9733;</span>Marlon</p>
      <ul class="footer-links">
        <li><a href="index.html">Home</a></li>
        <li><a href="guides.html"><span data-en="Resources">Ressourcen</span></a></li>
        <li><a href="newsletter.html">Newsletter</a></li>
        <li><a href="partnerships.html">Partnerships</a></li>
        <li><a href="contact.html"><span data-en="Contact">Kontakt</span></a></li>
        <li><a href="impressum.html">Impressum</a></li>
        <li><a href="datenschutz.html">Datenschutz</a></li>
      </ul>
      <div class="footer-socials">
        <a href="https://www.instagram.com/gptmarlon/" target="_blank" rel="noopener" class="footer-social" title="Instagram">${IG}</a>
        <a href="https://www.tiktok.com/@gptmarlon" target="_blank" rel="noopener" class="footer-social" title="TikTok">${TT}</a>
        <a href="mailto:business@gptmarlon.com" class="footer-social" title="Email">${MAIL}</a>
      </div>
    </div>
    <div class="gm-physics" data-footer-physics aria-hidden="true"></div>
  </footer>
`;
{
  // Collect the page footers first, then splice — replacing as we scan would
  // re-match the canonical footer we just inserted (it contains a physics band
  // too) and delete it again. The hero social card also uses <footer>, so match
  // only the ones carrying the band.
  const ranges = [];
  const re = /<footer[\s>]/g; let m;
  while ((m = re.exec(s))) {
    if (ranges.length && m.index < ranges[ranges.length - 1][1]) continue;
    const end = balancedEnd(s, m.index);
    if (end !== -1 && s.slice(m.index, end).includes("gm-physics")) ranges.push([m.index, end]);
  }
  for (let i = ranges.length - 1; i >= 0; i--) {
    const [a, b] = ranges[i];
    s = s.slice(0, a) + (i === 0 ? SITE_FOOTER : "") + s.slice(b);
  }
  console.log(`  footer: ${ranges.length} breakpoint copies collapsed into one shared footer`);
}


// ── homepage redesign ─────────────────────────────────────────────────────────
// The Framer design still carries the old "KI-TOOLS TRAINING" positioning, the
// story in the wrong place and the sections in the wrong order. Rewrite all of
// it here. This runs BEFORE the i18n pass so the English table keys on the new
// German copy rather than the copy the design shipped with.

const HERO_LABEL = "AI Creator & Educator";
const HERO_BOLD  = "Hey, ich bin Marlon.";
const HERO_BODY  = "Ich mache KI so einfach, dass sie jeder nutzen kann. Egal ob du ein Business aufbaust, Content machst oder einfach nicht den Anschluss verlieren willst: Alles, was ich weiß, findest du hier. Kostenlos. Ich habe mir das komplett selbst beigebracht. Also schaffst du das auch.";

const STORY_TITLE = "Meine Story";
// One supplied block, broken at its natural pivot so it doesn't read as a wall
// of text in an 860px column. Wording is untouched.
const STORY_BODY = [
  "Mehrere Jahre war ich im Venture Capital und habe von außen zugeschaut, wie KI alles verändert. Irgendwann wollte ich nicht mehr nur zuschauen. Ich habe mir alles selbst beigebracht, ohne Studium in dem Bereich und ohne teure Kurse. Einfach durchs Machen.",
  "Heute läuft mein Business zu 90 Prozent über KI-Agenten. Und genau das, was ich dabei lerne, teile ich jeden Tag auf Instagram und hier auf der Seite.",
];

// 1. hero label — the small bordered pill above the title
{
  const before = s;
  s = s.replace(/(>)KI-TOOLS TRAINING(<)/g, (m, a, b) => a + esc(HERO_LABEL) + b);
  console.log(`  hero label -> "${HERO_LABEL}": ${before === s ? "NOT FOUND" : "ok"}`);
}

// 2. hero title + body. The design renders three breakpoint copies of the block,
// each a single <p>: bold headline, <br>, then the bio.
{
  let n = 0;
  s = s.replace(/(<p class="framer-text framer-styles-preset-[^"]*"[^>]*>)([\s\S]*?)<\/p>/g, (full, open, inner) => {
    if (!plain(inner).startsWith("Lerne mit mir")) return full;
    n++;
    return `${open}<strong class="framer-text">${words(HERO_BOLD)}</strong>` +
           `<br class="framer-text">${words(HERO_BODY)}</p>`;
  });
  console.log(`  hero copy: ${n} breakpoint cop${n === 1 ? "y" : "ies"} rewritten`);
}

// 3. a second hero action next to the community CTA, scrolling to the story.
// The CTA sits alone in a column with 32px gaps, so wrap both in a flex row.
{
  const at = s.indexOf('<div class="framer-3i23y5-container">');
  if (at === -1) {
    console.log("  ! hero CTA container not found — 'Meine Story' link not added");
  } else {
    const end = balancedEnd(s, at);
    const cta = s.slice(at, end);
    const story = `<a class="gm-btn-ghost" href="#story"><span>Meine Story</span></a>`;
    s = s.slice(0, at) + `<div class="gm-hero-actions">${cta}${story}</div>` + s.slice(end);
    console.log("  hero: added the 'Meine Story' link beside the community CTA");
  }
}

// 4. the story section: new heading, the supplied copy, and two stats. The views
// figure is live (stats.js fills [data-stat] from Supabase); the hardcoded value
// is the fallback when Supabase is unreachable.
{
  const at = s.indexOf('data-framer-name="Section-About Me"');
  if (at === -1) {
    console.log("  ! Section-About Me not found — story not rewritten");
  } else {
    const start = s.lastIndexOf("<", at);
    const end = balancedEnd(s, start);
    let sec = s.slice(start, end);

    sec = sec.replace(/(<h2[^>]*>)[\s\S]*?(<\/h2>)/, (m, a, b) => a + esc(STORY_TITLE) + b);

    // replace every paragraph in the Copy block with the new copy + the stats
    const pOpen = /<p class="framer-text framer-styles-preset-30wjel"[^>]*>/.exec(sec);
    if (pOpen) {
      const first = sec.indexOf(pOpen[0]);
      const last = sec.lastIndexOf("</p>") + 4;
      const paras = STORY_BODY.map((t) => `${pOpen[0]}${esc(t)}</p>`).join("");
      const stats =
        `<dl class="gm-stats">` +
        `<div class="gm-stat"><dt>Erster Post</dt><dd>27. Mai 2026</dd></div>` +
        `<div class="gm-stat"><dt>Views · letzte 30 Tage</dt><dd data-stat="views_30d">4M+</dd></div>` +
        `</dl>`;
      sec = sec.slice(0, first) + paras + sec.slice(last);
      // drop the stats in before the Container closes, so they inherit its
      // 860px width and column gap instead of floating loose in the section
      sec = sec.replace(/<\/div>\s*<\/section>\s*$/, `${stats}</div></section>`);
    }
    s = s.slice(0, start) + sec + s.slice(end);
    console.log(`  story: retitled "${STORY_TITLE}" + new copy + 2 stats`);
  }
}

// 5. German house style: no em/en dashes, no emojis. Runs on the German source
// so both languages inherit the fix (the English is keyed on the result).
{
  let n = 0;
  for (const [from, to] of Object.entries(DE)) {
    if (!s.includes(from)) { console.log(`  ! copy fix no longer matches: ${from.slice(0, 60)}…`); continue; }
    s = s.split(from).join(to);
    n++;
  }
  // catch any dash the table missed, inside text nodes only
  const strays = (s.match(/>[^<]*[—–][^<]*</g) || []).length;
  console.log(`  copy: ${n} German string(s) fixed${strays ? `; ${strays} text node(s) still contain a dash` : ""}`);
}

// 6. the social card's action row shipped as text glyphs (♡ 💬 ➤). The speech
// balloon renders as a full-colour emoji and the other two pick up whatever the
// system font has, so none of them match the design. Swap in real icons.
{
  const icon = (d, filled) =>
    `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" ` +
    `fill="${filled ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" ` +
    `stroke-linecap="round" stroke-linejoin="round" style="display:block">${d}</svg>`;

  const GLYPHS = {
    "♡": icon('<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8z"/>'),
    "\u{1F4AC}": icon('<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.9 8.9 0 0 1-3.8-.9L3 20.5l1.5-4.4A8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4z"/>'),
    "➤": icon('<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/>'),
    "↻": icon('<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>'),
  };

  let n = 0;
  for (const [glyph, svg] of Object.entries(GLYPHS)) {
    const hits = s.split(glyph).length - 1;
    n += hits;
    s = s.split(">" + glyph + "<").join(">" + svg + "<");
  }
  console.log(`  social card: ${n} text glyph(s) replaced with icons`);
}

// 7. section order + the hairline dividers between them.
// The six <section>s tile the wrapper back to back, so reordering is a straight
// slice and reassemble. Requested order: hero, guides, reels, then the rest as
// they were. Every section gets .gm-sec, which draws the divider (see
// home-overrides.css) and gives the story section its scroll target.
{
  // The logo strip stays glued to the hero as a social-proof band, the way the
  // design had it; guides and reels are promoted above the story.
  const ORDER = [
    "Section-Hero",
    "Section-Logo Marquee",
    "Section-Neueste Guides",
    "Section-UGC Videos",
    "Section-About Me",
    "Section-Contact",
  ];
  const IDS = { "Section-About Me": "story", "Section-Neueste Guides": "guides", "Section-UGC Videos": "reels" };

  const found = [];
  const re = /data-framer-name="(Section-[^"]*)"/g;
  let m;
  while ((m = re.exec(s))) {
    const start = s.lastIndexOf("<", m.index);
    const end = balancedEnd(s, start);
    if (end !== -1) found.push({ name: m[1], start, end });
  }

  const contiguous = found.every((x, i) => i === 0 || x.start === found[i - 1].end);
  const complete = ORDER.every((n) => found.some((f) => f.name === n)) && found.length === ORDER.length;

  if (!contiguous || !complete) {
    // Bail loudly rather than silently shipping the design's original order.
    console.log(`  ! sections not reorderable (contiguous=${contiguous}, complete=${complete}) — order left as-is`);
  } else {
    // Merge into the design's own class list — a second class attribute would be
    // ignored by the browser and the section would lose its Framer styling.
    const tag = (html, name) => {
      const id = IDS[name] ? ` id="${IDS[name]}"` : "";
      return html.replace(/^<section\b([^>]*)>/, (m, attrs) => {
        const merged = /\bclass="/.test(attrs)
          ? attrs.replace(/\bclass="/, 'class="gm-sec ')
          : `${attrs} class="gm-sec"`;
        return `<section${id}${merged}>`;
      });
    };
    const body = found.map((f) => ({ ...f, html: s.slice(f.start, f.end) }));
    const head = s.slice(0, found[0].start);
    const tail = s.slice(found[found.length - 1].end);
    const reordered = ORDER.map((n) => {
      const f = body.find((b) => b.name === n);
      return tag(f.html, n);
    }).join("");
    s = head + reordered + tail;
    console.log(`  sections reordered: ${ORDER.map((n) => n.replace("Section-", "")).join(" > ")}`);
  }
}

// ── i18n ──────────────────────────────────────────────────────────────────────
// The Framer markup has no data-en attributes, so the DE/EN toggle had nothing
// to swap on the homepage. Inject them from tools/i18n-home.mjs, keyed on the
// German text. Anything unmatched is reported so untranslated copy is visible
// rather than silently German.
{
  const attr = (v) => v.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

  // the guide cards carry German titles/summaries straight from
  // guides/data/*.json — those are German content, not UI copy, so they stay
  const contentDE = new Set();
  for (const g of newest) {
    [g.title, g.summary, g.category, g.tool].forEach((v) => v && contentDE.add(String(v).replace(/\s+/g, " ").trim()));
  }

  // The German copy is animated word by word, and the hero's first sentence is
  // bold. A flat English string would drop both, so mirror the German markup
  // with the shared `words` helper, keeping <strong>/<br>.
  const buildEN = (inner, en) => {
    const animated = inner.includes("gm-word");
    if (typeof en === "object") {
      // bold headline + <br> + body, as in the German
      return `<strong class="framer-text">${animated ? words(en.bold) : esc(en.bold)}</strong>` +
             `<br class="framer-text">${animated ? words(en.rest) : esc(en.rest)}`;
    }
    return animated ? words(en) : esc(en);
  };

  let done = 0;
  const missing = new Set();
  s = s.replace(/<p([^>]*class="framer-text[^"]*"[^>]*)>([\s\S]*?)<\/p>/g, (full, at, inner) => {
    if (/data-en=/.test(at)) return full;
    const de = plain(inner);
    if (!de) return full;
    const en = T[de];
    if (!en) { if (!SAME.has(de) && !contentDE.has(de) && !/^\w{3} \d{1,2}, \d{4}$/.test(de)) missing.add(de); return full; }
    if (en === de) return full;
    done++;
    return `<p${at} data-en="${attr(buildEN(inner, en))}">${inner}</p>`;
  });

  // input placeholders
  let ph = 0;
  s = s.replace(/placeholder="([^"]*)"/g, (full, val) => {
    const en = PH[val];
    if (!en || en === val) return full;
    ph++;
    return `${full} data-en-ph="${attr(en)}"`;
  });

  // leaf elements outside Framer's RichText wrappers (e.g. the social card)
  let leaf = 0;
  for (const [de, en] of Object.entries(T)) {
    if (de === en) continue;
    const lit = de.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rx = new RegExp("<(\\w+)([^>]*)>(\\s*)" + lit + "(\\s*)</\\1>", "g");
    s = s.replace(rx, (full, tag, at, l, r) => {
      if (/data-en=/.test(at)) return full;
      leaf++;
      return `<${tag}${at} data-en="${attr(en)}">${l}${de}${r}</${tag}>`;
    });
  }

  console.log(`  i18n: ${done} rich-text + ${leaf} leaf blocks + ${ph} placeholders given data-en`);
  if (missing.size) {
    console.log(`  i18n: ${missing.size} block(s) NOT translated —`);
    [...missing].forEach((m) => console.log(`        · ${m.slice(0, 110)}`));
  }
}

// ── links ─────────────────────────────────────────────────────────────────────
const before = s;
s = s
  .replace(/href="\.\/ressourcen"/g, 'href="guides.html"')
  .replace(/href="\.\/#hero"/g, 'href="#hero"')
  .replace(/href="\.\/#contact"/g, 'href="#contact"')
  .replace(/href="\.\/"/g, 'href="index.html"')
  // Framer template placeholders -> the real accounts
  .replace(/href="https:\/\/Instagram\.com"/gi, 'href="https://www.instagram.com/gptmarlon/" target="_blank" rel="noopener"')
  .replace(/href="https:\/\/Tiktok\.com"/gi, 'href="https://www.tiktok.com/@gptmarlon" target="_blank" rel="noopener"')
  .replace(/href="https:\/\/Youtube\.com"/gi, 'href="https://www.youtube.com/@gptmarlon" target="_blank" rel="noopener"')
  .replace(/href="https:\/\/x\.com"/gi, 'href="mailto:business@gptmarlon.com"');
console.log(`  rewrote links (${before === s ? "none changed!" : "ok"})`);

// ── Instagram reels ───────────────────────────────────────────────────────────
// The template repeats one embed three times; point them at the real reels.
const REELS = ["DaX1BwVKYgm", "DZNMQbnolsB", "DZshGPUo_Wf"];
let reelIdx = 0, reelsFixed = 0;
s = s.replace(/src="https:\/\/www\.instagram\.com\/reel\/[A-Za-z0-9_-]+\/embed"/g, () => {
  const id = REELS[reelIdx % REELS.length]; reelIdx++; reelsFixed++;
  return `src="https://www.instagram.com/reel/${id}/embed"`;
});
console.log(`  reels: ${reelsFixed} embeds pointed at the real posts`);

// ── live follower count on the social card ────────────────────────────────────
const statBefore = s;
s = s.replace(/(<span style="font-size:16px;font-weight:800;line-height:1;color:#111111")>37K</g,
  '$1 data-stat="followers">37K<');
console.log(`  wired follower count: ${statBefore === s ? "NOT FOUND" : "ok"}`);

// ── the hero CTA opens the community modal ────────────────────────────────────
// "Community beitreten" is the Framer button that points at #contact; keep the
// anchor as a fallback and let community.js intercept it.
const ctaBefore = s;
s = s.replace(/(<a [^>]*href="#contact"[^>]*)(>)/g, (m, a, b) =>
  /data-community/.test(a) ? m : `${a} data-community${b}`);
console.log(`  wired community CTA: ${ctaBefore === s ? "NOT FOUND" : "ok"}`);

// ── contact form -> Supabase ──────────────────────────────────────────────────
s = s.replace('<form class="framer-1hbf0g2"', '<form id="framerContact" class="framer-1hbf0g2"');

// ── assemble index.html ───────────────────────────────────────────────────────
const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>GPT Marlon: KI einfach erklärt</title>
  <meta name="description" content="Ich mache KI so einfach, dass sie jeder nutzen kann. Tägliche Reels, Schritt-für-Schritt-Guides und kopierbare Prompts für ChatGPT, Claude und Co. Auf Deutsch, kostenlos." />
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 rx=%2222%22 fill=%22%23FFE74A%22/><path d=%22M50 17l9.5 23.5L84 42.5 65.5 59l5.5 25L50 71 29 84l5.5-25L16 42.5l24.5-2z%22 fill=%22%23111111%22/></svg>" />
  <meta property="og:title" content="GPT Marlon: KI einfach erklärt" />
  <meta property="og:description" content="Tägliche KI-Videos auf Deutsch und kostenlose Guides. ChatGPT, Claude und echte Workflows für den DACH-Markt." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://gptmarlon.com/" />
  <meta property="og:image" content="https://gptmarlon.com/assets/marlon.jpg" />
  <meta name="twitter:card" content="summary_large_image" />
  <!-- the ported Framer design; regenerate with tools/port-framer.mjs -->
  <link rel="stylesheet" href="assets/framer.css" />
  <link rel="stylesheet" href="assets/nav.css" />
  <link rel="stylesheet" href="assets/footer.css" />
  <link rel="stylesheet" href="assets/home-overrides.css" />
</head>
<body>
${s}

  <script>
    // contact form -> Supabase site_messages (publishable key; RLS allows INSERT only)
    const SB_URL = 'https://topypyboyyvykdfbxqmj.supabase.co';
    const SB_KEY = 'sb_publishable_igrAFNS4S_dvOAqnxZY7pg_EE0oipId';
    document.addEventListener('DOMContentLoaded', function () {
      var f = document.getElementById('framerContact');
      if (!f) return;
      f.addEventListener('submit', async function (e) {
        e.preventDefault();
        var btn = f.querySelector('button[type="submit"]');
        var label = btn ? btn.textContent : '';
        if (btn) btn.textContent = '…';
        var d = new FormData(f);
        try {
          const res = await fetch(SB_URL + '/rest/v1/site_messages', {
            method: 'POST',
            headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
            body: JSON.stringify({
              name: d.get('Name') || null,
              email: d.get('Email'),
              topic: d.get('Betreff') || null,
              message: d.get('Frage') || '',
            }),
          });
          if (!res.ok) throw new Error('save failed');
          if (btn) btn.textContent = 'Gesendet!';
          f.reset();
        } catch (err) {
          if (btn) btn.textContent = 'Nochmal versuchen';
        }
        setTimeout(function () { if (btn) btn.textContent = label; }, 3200);
      });
    });
  </script>
  <script src="assets/site.js"></script>
  <script src="assets/cursor.js"></script>
  <script src="assets/footer-physics.js"></script>
  <script src="assets/reveal.js"></script>
  <script src="assets/lenis.min.js"></script>
  <script src="assets/smoothscroll.js"></script>
  <script src="assets/stats.js"></script>
  <script src="assets/community.js"></script>
  <script src="assets/lang.js"></script>
  <script defer src="/_vercel/insights/script.js"></script>
</body>
</html>
`;

writeFileSync("index.html", html);
console.log(`\nwrote index.html (${(html.length / 1024).toFixed(0)} KB)`);
