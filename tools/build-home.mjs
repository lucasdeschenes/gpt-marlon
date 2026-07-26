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
  <link rel="stylesheet" href="assets/home-overrides.css" />
</head>
<body>
${s}
  <!-- DE/EN toggle, injected into the ported nav by home-overrides.js -->
  <button class="lang-toggle floating-lang" data-langtoggle aria-label="Sprache/Language">EN</button>

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
