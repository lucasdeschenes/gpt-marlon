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

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmt = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
  return m ? `${MONTHS_EN[+m[2] - 1]} ${+m[3]}, ${m[1]}` : "";
};

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
    <a href="index.html" class="nav-logo"><span class="nav-logo-text">GPT<span>★</span>Marlon</span></a>
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

// ── footer links ──────────────────────────────────────────────────────────────
// The design's footer ships Home + Ressourcen only; this site also needs the
// legal pages and the rest of the sections. Clone the Resources wrapper.
const FOOTER_EXTRA = [
  { href: "newsletter.html",  label: "Newsletter" },
  { href: "partnerships.html", label: "Partnerships" },
  { href: "contact.html",      label: "Kontakt" },
  { href: "impressum.html",    label: "Impressum" },
  { href: "datenschutz.html",  label: "Datenschutz" },
];
// balancedEnd, not a lazy regex — the wrapper contains nested divs, so
// matching to the first </div></div> would slice it in half.
let footerCloned = 0;
{
  const MARK = '<div class="framer-9w4eop-container" data-framer-name="Resources Link Wrapper"';
  let from = 0, at;
  while ((at = s.indexOf(MARK, from)) !== -1) {
    const end = balancedEnd(s, at);
    if (end === -1) break;
    const block = s.slice(at, end);
    const extras = FOOTER_EXTRA.map(({ href, label }) =>
      block.replace('href="./ressourcen"', `href="${href}"`).replace(">Ressourcen<", `>${label}<`)
    ).join("");
    s = s.slice(0, end) + extras + s.slice(end);
    from = end + extras.length;
    footerCloned++;
  }
}
console.log(`  footer links: cloned into ${footerCloned} footer variant(s)`);

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

writeFileSync("assets/framer-home.built.html", s);

// ── assemble index.html ───────────────────────────────────────────────────────
const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>GPT Marlon — KI-Tools Training</title>
  <meta name="description" content="Lerne mit mir, KI effektiv zu nutzen. Tägliche Reels, Schritt-für-Schritt-Guides und kopierbare Prompts für ChatGPT, Claude & Co. — auf Deutsch." />
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🤖</text></svg>" />
  <meta property="og:title" content="GPT Marlon — KI-Tools Training" />
  <meta property="og:description" content="Tägliche KI-Videos auf Deutsch + kostenlose Guides. ChatGPT, Claude und echte Workflows für den DACH-Markt." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://gptmarlon.com/" />
  <meta property="og:image" content="https://gptmarlon.com/assets/marlon.jpg" />
  <meta name="twitter:card" content="summary_large_image" />
  <!-- the ported Framer design; regenerate with tools/port-framer.mjs -->
  <link rel="stylesheet" href="assets/framer.css" />
  <link rel="stylesheet" href="assets/nav.css" />
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
          if (btn) btn.textContent = '✓ Gesendet!';
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
