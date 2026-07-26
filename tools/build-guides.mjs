// Builds the Guides section: reads guide JSONs (extracted from the original PDFs),
// applies the content-fixes overlay (guides/data/fixes.json), and emits
// guides/<slug>.html, guides.html and sitemap.xml. Run: node tools/build-guides.mjs <json-dir>
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from "node:fs";
import path from "node:path";

const SRC = process.argv[2] || "guides/data";
const SITE = "https://gptmarlon.com";
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = (s) => esc(s).replace(/"/g, "&quot;");
const MONTHS_DE = ["Jan.", "Feb.", "März", "Apr.", "Mai", "Juni", "Juli", "Aug.", "Sep.", "Okt.", "Nov.", "Dez."];
const fmtDate = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
  return m ? `${+m[3]}. ${MONTHS_DE[+m[2] - 1]} ${m[1]}` : "";
};

// brand glyphs (inline so they inherit currentColor, no external requests)
const IG_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.34 4.14.63c-.79.3-1.46.72-2.13 1.38A5.9 5.9 0 0 0 .63 4.14C.34 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.27 2.15.56 2.91.3.79.72 1.46 1.38 2.13.67.66 1.34 1.08 2.13 1.38.76.29 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.27 2.91-.56a5.9 5.9 0 0 0 2.13-1.38 5.9 5.9 0 0 0 1.38-2.13c.29-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.27-2.15-.56-2.91a5.9 5.9 0 0 0-1.38-2.13A5.9 5.9 0 0 0 19.86.63c-.76-.29-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0z"/><path d="M12 5.84A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84m0 10.16A4 4 0 1 1 16 12a4 4 0 0 1-4 4z"/><circle cx="18.41" cy="5.59" r="1.44"/></svg>`;
const TT_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.6 5.82a4.28 4.28 0 0 1-1.04-2.82h-3.31v13.35a2.4 2.4 0 1 1-2.4-2.4c.26 0 .5.04.74.12v-3.4a5.87 5.87 0 0 0-.74-.05 5.82 5.82 0 1 0 5.82 5.82V8.66a7.5 7.5 0 0 0 4.38 1.4V6.75a4.28 4.28 0 0 1-3.45-.93z"/></svg>`;
const MAIL_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2.5" y="4.5" width="19" height="15" rx="2.5"/><path d="M3 6l9 6.5L21 6"/></svg>`;
const logoIcon = (p) => `<div class="nav-logo-icon"><img src="${p}assets/marlon.jpg" alt="Marlon" /></div>`;
const socials = () => `        <a href="https://www.instagram.com/gptmarlon/" target="_blank" rel="noopener" class="footer-social" title="Instagram">${IG_SVG}</a>
        <a href="https://www.tiktok.com/@gptmarlon" target="_blank" rel="noopener" class="footer-social" title="TikTok">${TT_SVG}</a>
        <a href="mailto:business@gptmarlon.com" class="footer-social" title="Email">${MAIL_SVG}</a>`;

// ── tiny markdown renderer (paragraphs, bold/italic/code, lists, tables) ─────
function md(s) {
  const lines = String(s ?? "").replace(/\r/g, "").split("\n");
  const out = [];
  let list = null, table = null, para = [];
  const inline = (t) => esc(t)
    .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
    .replace(/\*([^*]+)\*/g, "<i>$1</i>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
  const flushPara = () => { if (para.length) { out.push("<p>" + inline(para.join(" ")) + "</p>"); para = []; } };
  const flushList = () => { if (list) { out.push("<" + list.tag + ">" + list.items.map((i) => "<li>" + inline(i) + "</li>").join("") + "</" + list.tag + ">"); list = null; } };
  const flushTable = () => {
    if (!table) return;
    const rows = table.filter((r) => !/^\s*\|?[\s:-]+\|[\s|:-]*$/.test(r));
    const cells = rows.map((r) => r.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split("|").map((c) => inline(c.trim())));
    if (cells.length) {
      let h = "<table><thead><tr>" + cells[0].map((c) => "<th>" + c + "</th>").join("") + "</tr></thead><tbody>";
      for (const r of cells.slice(1)) h += "<tr>" + r.map((c) => "<td>" + c + "</td>").join("") + "</tr>";
      out.push(h + "</tbody></table>");
    }
    table = null;
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^\s*\|.*\|\s*$/.test(line)) { flushPara(); flushList(); (table ||= []).push(line); continue; }
    flushTable();
    const ul = line.match(/^\s*[-•]\s+(.*)/), ol = line.match(/^\s*\d+[.)]\s+(.*)/);
    if (ul || ol) {
      flushPara();
      const tag = ul ? "ul" : "ol";
      if (!list || list.tag !== tag) { flushList(); list = { tag, items: [] }; }
      list.items.push((ul || ol)[1]);
      continue;
    }
    if (!line.trim()) { flushPara(); flushList(); continue; }
    flushList();
    para.push(line.trim());
  }
  flushPara(); flushList(); flushTable();
  return out.join("\n");
}

// ── shared page chrome ────────────────────────────────────────────────────────
const nav = (active) => {
  const p = active === "guide" ? "../" : "";
  return `  <nav>
    <a href="${p}index.html" class="nav-logo">
      ${logoIcon(p)}
      <span class="nav-logo-text">GPT<span>★</span>Marlon</span>
    </a>
    <ul class="nav-links">
      <li><a href="${p}guides.html"${active === "guides" || active === "guide" ? ' class="active"' : ""}><span data-en="Resources">Ressourcen</span></a></li>
      <li><a href="${p}newsletter.html">Newsletter</a></li>
      <li><a href="${p}partnerships.html">Partnerships</a></li>
      <li><a href="${p}contact.html"><span data-en="Contact">Kontakt</span></a></li>
      <li><a href="#" class="nav-cta" data-community><span data-en="Join Community →">Community beitreten →</span></a></li>
    </ul>
    <div class="nav-actions">
      <button class="lang-toggle" data-langtoggle aria-label="Sprache/Language">EN</button>
      <button class="nav-burger" data-burger aria-label="Menu" aria-expanded="false">☰</button>
    </div>
  </nav>`;
};

const footer = (p) => `  <footer>
    <div class="footer-inner">
      <a href="${p}index.html" class="nav-logo">
        ${logoIcon(p)}
        <span class="nav-logo-text">GPT<span>★</span>Marlon</span>
      </a>
      <ul class="footer-links">
        <li><a href="${p}guides.html"><span data-en="Resources">Ressourcen</span></a></li>
        <li><a href="${p}about.html"><span data-en="About">Über mich</span></a></li>
        <li><a href="${p}partnerships.html">Partnerships</a></li>
        <li><a href="${p}contact.html"><span data-en="Contact">Kontakt</span></a></li>
        <li><a href="${p}newsletter.html">Newsletter</a></li>
        <li><a href="${p}impressum.html">Impressum</a></li>
        <li><a href="${p}datenschutz.html">Datenschutz</a></li>
      </ul>
      <div class="footer-socials">
${socials()}
      </div>
    </div>
    <div style="text-align:center; margin-top:2rem;"><p class="footer-copy">© 2026 GPT Marlon. All rights reserved.</p></div>
  </footer>`;

const head = (title, desc, p) => `<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)}</title>
  <meta name="description" content="${escAttr(desc)}" />
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🤖</text></svg>" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="${p}assets/site.css" />
  <link rel="stylesheet" href="${p}assets/guides.css" />
</head>`;

// ── load + overlay ────────────────────────────────────────────────────────────
const fixes = existsSync("guides/data/fixes.json") ? JSON.parse(readFileSync("guides/data/fixes.json", "utf8")) : {};
const files = readdirSync(SRC).filter((f) => f.endsWith(".json") && f !== "fixes.json");
let guides = files.map((f) => JSON.parse(readFileSync(path.join(SRC, f), "utf8")));
guides = guides.filter((g) => !(fixes[g.file] && fixes[g.file].drop));
for (const g of guides) {
  const fx = fixes[g.file];
  if (!fx) continue;
  for (const k of ["title", "category", "tool", "summary", "slug"]) if (fx[k]) g[k] = fx[k];
  for (const r of fx.replace || []) {
    const apply = (s) => String(s).split(r.find).join(r.replace);
    g.sections = g.sections.map((s) => ({ heading: apply(s.heading), body: apply(s.body) }));
    g.prompts = (g.prompts || []).map((p) => ({ label: apply(p.label), text: apply(p.text) }));
    g.summary = apply(g.summary);
  }
  if (fx.note) g.note = fx.note;
  if (fx.dropSections) g.sections = g.sections.filter((s) => !fx.dropSections.some((d) => s.heading.includes(d)));
}
guides.sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title));

// ── per-guide pages ───────────────────────────────────────────────────────────
mkdirSync("guides", { recursive: true });
const toolBadge = (tool) => `<span class="chip chip-tool">${esc(tool)}</span>`;
const openBtns = (tool) => {
  const b = [];
  if (/claude/i.test(tool)) b.push(`<button class="pbtn pbtn-claude" onclick="openIn(this,'claude')">✦ In Claude öffnen</button>`);
  if (/chatgpt/i.test(tool)) b.push(`<button class="pbtn" onclick="openIn(this,'chatgpt')">◍ In ChatGPT öffnen</button>`);
  return b.join("");
};

for (const g of guides) {
  const promptsHtml = (g.prompts || []).map((p, i) => `
      <div class="prompt-card" id="prompt-${i + 1}">
        <div class="prompt-head">
          <span class="prompt-label">${esc(p.label)}</span>
          <div class="prompt-actions">
            <button class="pbtn" onclick="copyPrompt(this)">📋 Kopieren</button>
            ${openBtns(g.tool)}
          </div>
        </div>
        <pre class="prompt-text">${esc(p.text)}</pre>
      </div>`).join("\n");

  // Numbered, anchored sections + a table of contents — the guides are long, and
  // a reader needs to see the shape of the workflow before starting it.
  const sectionsHtml = g.sections.map((s, i) => `
      <section class="guide-section" id="s${i + 1}">
        <div class="gs-num">${String(i + 1).padStart(2, "0")}</div>
        <h2>${esc(s.heading)}</h2>
        ${md(s.body)}
      </section>`).join("\n");

  const tocHtml = g.sections.length > 2 ? `
    <div class="guide-toc" role="navigation" aria-label="Inhalt">
      <div class="guide-toc-label"><span data-en="In this guide">In diesem Guide</span></div>
      <ol>
${g.sections.map((s, i) => `        <li><a href="#s${i + 1}"><span class="toc-n">${String(i + 1).padStart(2, "0")}</span>${esc(s.heading)}</a></li>`).join("\n")}
${(g.prompts || []).length ? `        <li><a href="#alle-prompts"><span class="toc-n">★</span><span data-en="All prompts to copy">Alle Prompts zum Kopieren</span></a></li>` : ""}
      </ol>
    </div>` : "";

  const html = `<!DOCTYPE html>
<html lang="de">
${head(g.title + " — GPT Marlon Guides", g.summary, "../")}
<body>
${nav("guide")}
  <main class="page guide-page">
    <div class="crumbs"><a href="../guides.html"><span data-en="← All resources">← Alle Ressourcen</span></a> · <span>${esc(g.category)}</span></div>
    <div class="page-hero">
      <h1 class="page-title">${esc(g.title)}</h1>
      <p class="page-sub">${esc(g.summary)}</p>
      <div class="chip-row">
        ${toolBadge(g.tool)}
        <span class="chip">${esc(g.category)}</span>
        <span class="chip">${(g.prompts || []).length} Prompt${(g.prompts || []).length === 1 ? "" : "s"} zum Kopieren</span>
        <span class="chip">Aktualisiert Juli 2026</span>
      </div>
      <div class="guide-actions">
        <a class="btn-primary" href="../guides/pdf/${g.slug}.pdf" download><span data-en="⬇ Download PDF">⬇ Als PDF herunterladen</span></a>
        <a class="btn-secondary" href="#" data-community><span data-en="🚀 Join community">🚀 Community beitreten</span></a>
      </div>
    </div>
    ${g.note ? `<div class="guide-note">ℹ️ ${g.note}</div>` : ""}
${tocHtml}
${sectionsHtml}
    ${(g.prompts || []).length ? `<section class="guide-section" id="alle-prompts">
      <div class="gs-num">★</div>
      <h2><span data-en="All prompts to copy">Alle Prompts zum Kopieren</span></h2>${promptsHtml}
    </section>` : ""}
    <div class="guide-download">
      <div class="guide-download-icon">📖</div>
      <div class="guide-download-title"><span data-en="Take the whole guide with you">Nimm den kompletten Guide mit</span></div>
      <div class="guide-download-sub"><span data-en="All steps and prompts as a PDF — to save, print and follow along offline.">Alle Schritte und Prompts als PDF — zum Speichern, Ausdrucken und offline Nachmachen.</span></div>
      <a class="btn-primary" href="../guides/pdf/${g.slug}.pdf" download><span data-en="⬇ Download full PDF (free)">⬇ Vollständiges PDF herunterladen (kostenlos)</span></a>
    </div>
    <div class="guide-cta">
      <div>
        <div class="guide-cta-title"><span data-en="More of this — every week.">Mehr davon — jede Woche.</span></div>
        <div class="guide-cta-sub"><span data-en="New resources, prompts and workflows straight to your inbox. Free.">Neue Ressourcen, Prompts und Workflows direkt ins Postfach. Kostenlos.</span></div>
      </div>
      <a class="btn-primary" href="#" data-community><span data-en="Join the community →">Community beitreten →</span></a>
    </div>
  </main>
${footer("../")}
  <script src="../assets/site.js"></script>
  <script src="../assets/cursor.js"></script>
  <script src="../assets/lenis.min.js"></script>
  <script src="../assets/smoothscroll.js"></script>
  <script src="../assets/guides.js"></script>
  <script src="../assets/stats.js"></script>
  <script src="../assets/community.js"></script>
  <script src="../assets/lang.js"></script>
  <script defer src="/_vercel/insights/script.js"></script>
</body>
</html>
`;
  writeFileSync(path.join("guides", g.slug + ".html"), html);
}

// ── index page ────────────────────────────────────────────────────────────────
const cats = [...new Set(guides.map((g) => g.category))];
const cards = guides.map((g, i) => {
  const searchable = [g.title, g.summary, g.category, g.tool].join(" ").toLowerCase();
  return `
      <a class="guide-card fade-up" data-cat="${escAttr(g.category)}" data-order="${i}" data-date="${escAttr(g.date || "")}" data-title="${escAttr(g.title.toLowerCase())}" data-search="${escAttr(searchable)}" href="guides/${g.slug}.html">
        <div class="chip-row">${toolBadge(g.tool)}<span class="chip">${esc(g.category)}</span></div>
        <h3>${esc(g.title)}</h3>
        <p>${esc(g.summary)}</p>
        <div class="guide-card-meta">
          <span>${(g.prompts || []).length} Prompts</span>
          ${g.date ? `<span class="gc-date">${esc(fmtDate(g.date))}</span>` : ""}
        </div>
      </a>`;
}).join("\n");

const indexHtml = `<!DOCTYPE html>
<html lang="de">
${head("Ressourcen — GPT Marlon", "Alle GPT Marlon Ressourcen: Schritt-für-Schritt-Anleitungen für Claude & ChatGPT — Bewerbung, Finanzen, Produktivität, Content. Mit kopierbaren Prompts.", "")}
<body>
${nav("guides")}
  <main class="page">
    <div class="page-hero fade-up">
      <div class="section-label"><span data-en="Resources">Ressourcen</span></div>
      <h1 class="page-title"><span data-en="All resources.">Alle Ressourcen.</span> <span class="gradient-text" data-en="All prompts. Free.">Alle Prompts. Kostenlos.</span></h1>
      <p class="page-sub"><span data-en="The complete step-by-step guides from the reels — each with copy-ready prompts you can open straight in Claude or ChatGPT.">Die kompletten Schritt-für-Schritt-Anleitungen aus den Reels — jeder Guide mit kopierbaren Prompts, die du direkt in Claude oder ChatGPT öffnen kannst.</span></p>
    </div>
    <div class="res-controls fade-up">
      <div class="res-search">
        <svg class="res-search-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
        <input type="search" id="guideSearch" placeholder="Ressourcen durchsuchen…" data-en-ph="Search resources…" autocomplete="off" aria-label="Suche" />
      </div>
      <div class="res-sort">
        <label for="guideSort" data-en="Sort by">Sortieren</label>
        <select id="guideSort" aria-label="Sortieren">
          <option value="featured" data-en="Featured">Empfohlen</option>
          <option value="new" data-en="Newest first">Neueste zuerst</option>
          <option value="old" data-en="Oldest first">Älteste zuerst</option>
          <option value="az" data-en="A to Z">A–Z</option>
        </select>
      </div>
    </div>
    <div class="cat-filter" id="catFilter">
      <button class="cat-chip active" data-cat="all"><span data-en="All">Alle</span> (${guides.length})</button>
      ${cats.map((c) => `<button class="cat-chip" data-cat="${escAttr(c)}">${esc(c)} (${guides.filter((g) => g.category === c).length})</button>`).join("\n      ")}
    </div>
    <div class="guides-grid" id="guidesGrid">
${cards}
    </div>
    <div class="res-empty" id="resEmpty" hidden><span data-en="No resources match your search.">Keine Ressourcen zu deiner Suche gefunden.</span></div>
  </main>
${footer("")}
  <script src="assets/site.js"></script>
  <script src="assets/cursor.js"></script>
  <script src="assets/lenis.min.js"></script>
  <script src="assets/smoothscroll.js"></script>
  <script>
    (function () {
      var grid = document.getElementById('guidesGrid');
      var cards = Array.prototype.slice.call(grid.querySelectorAll('.guide-card'));
      var search = document.getElementById('guideSearch');
      var sortSel = document.getElementById('guideSort');
      var empty = document.getElementById('resEmpty');
      var cat = 'all';

      function apply() {
        var q = (search.value || '').trim().toLowerCase();
        var visible = cards.filter(function (c) {
          var okCat = (cat === 'all' || c.dataset.cat === cat);
          var okQ = !q || c.dataset.search.indexOf(q) !== -1;
          return okCat && okQ;
        });
        var mode = sortSel.value;
        visible.sort(function (a, b) {
          if (mode === 'az') return a.dataset.title.localeCompare(b.dataset.title);
          if (mode === 'new') return (b.dataset.date || '').localeCompare(a.dataset.date || '');
          if (mode === 'old') return (a.dataset.date || '').localeCompare(b.dataset.date || '');
          return (+a.dataset.order) - (+b.dataset.order);
        });
        cards.forEach(function (c) { c.style.display = 'none'; });
        visible.forEach(function (c) { c.style.display = ''; c.classList.add('visible'); grid.appendChild(c); });
        empty.hidden = visible.length > 0;
      }

      document.querySelectorAll('.cat-chip').forEach(function (b) {
        b.addEventListener('click', function () {
          document.querySelectorAll('.cat-chip').forEach(function (x) { x.classList.remove('active'); });
          b.classList.add('active');
          cat = b.dataset.cat;
          apply();
        });
      });
      search.addEventListener('input', apply);
      sortSel.addEventListener('change', apply);
      apply();
    })();
  </script>
  <script src="assets/stats.js"></script>
  <script src="assets/community.js"></script>
  <script src="assets/lang.js"></script>
  <script defer src="/_vercel/insights/script.js"></script>
</body>
</html>
`;
writeFileSync("guides.html", indexHtml);

// ── homepage "newest guides" strip ────────────────────────────────────────────
// Kept in sync here so index.html never drifts from guides/data/*.json.
if (existsSync("index.html")) {
  const newest = [...guides]
    .filter((g) => g.date)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 4);
  const homeCards = newest.map((g) => `        <a class="guide-card fade-up" data-cat="${escAttr(g.category)}" href="guides/${g.slug}.html">
          <div class="chip-row">${toolBadge(g.tool)}<span class="chip">${esc(g.category)}</span></div>
          <h3>${esc(g.title)}</h3>
          <p>${esc(g.summary)}</p>
          <div class="guide-card-meta">
            <span>${(g.prompts || []).length} Prompts</span>
            <span class="gc-date">${esc(fmtDate(g.date))}</span>
          </div>
        </a>`).join("\n");
  const home = readFileSync("index.html", "utf8");
  const patched = home.replace(
    /<!-- LATEST-GUIDES:START -->[\s\S]*?<!-- LATEST-GUIDES:END -->/,
    `<!-- LATEST-GUIDES:START -->\n${homeCards}\n        <!-- LATEST-GUIDES:END -->`
  );
  if (patched !== home) {
    writeFileSync("index.html", patched);
    console.log(`  homepage: ${newest.length} newest guides injected`);
  }
}

// ── sitemap ───────────────────────────────────────────────────────────────────
const urls = [
  ["", "weekly", "1.0"], ["guides.html", "weekly", "0.9"], ["about.html", "monthly", "0.8"],
  ["partnerships.html", "monthly", "0.8"], ["media-kit.html", "monthly", "0.7"],
  ["newsletter.html", "monthly", "0.8"], ["contact.html", "yearly", "0.6"],
  ...guides.map((g) => ["guides/" + g.slug + ".html", "monthly", "0.7"]),
];
writeFileSync("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map(([u, f, pr]) => `  <url><loc>${SITE}/${u}</loc><changefreq>${f}</changefreq><priority>${pr}</priority></url>`).join("\n") + "\n</urlset>\n");

// copy each guide's original PDF into the site for download (guides/pdf/<slug>.pdf)
mkdirSync("guides/pdf", { recursive: true });
const PDF_SRC = process.env.GUIDES_PDF_DIR || "";
let copiedPdf = 0;
if (PDF_SRC) for (const g of guides) {
  const src = path.join(PDF_SRC, g.file);
  if (existsSync(src)) { copyFileSync(src, path.join("guides/pdf", g.slug + ".pdf")); copiedPdf++; }
}

// keep the (fixed) source JSON in the repo for future edits
mkdirSync("guides/data", { recursive: true });
if (path.resolve(SRC) !== path.resolve("guides/data")) for (const f of files) copyFileSync(path.join(SRC, f), path.join("guides/data", f));

console.log("built", guides.length, "guides ·", cats.length, "categories");
console.log(guides.map((g) => "  " + g.category.padEnd(14) + " " + g.slug).join("\n"));
