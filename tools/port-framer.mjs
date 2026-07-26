// Ports the published Framer homepage into this repo as static HTML + CSS.
//
//   node tools/port-framer.mjs [framer-url]
//
// Framer has no code export, but its published pages are fully server-rendered,
// so the markup and stylesheet can be lifted verbatim. This script:
//   1. fetches the published page
//   2. extracts every <style> block            -> assets/framer.css
//   3. extracts the #main markup                -> assets/framer-home.html (partial)
//   4. downloads images + webfonts locally      -> assets/framer/
//   5. rewrites framerusercontent URLs to the local copies
//   6. strips the Framer runtime (badge, analytics, hydration, events)
//
// index.html is then assembled from the partial by tools/build-home.mjs, which
// is where the live Supabase data and the DE/EN spans get wired in. Re-running
// this script picks up a new Framer publish without touching that wiring.

import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import path from "node:path";

const URL_DEFAULT = "https://specific-simplicity-759606--adapt-hero-section-igz4ppbom.framer.app/";
const SRC = process.argv[2] || URL_DEFAULT;
const OUT_DIR = "assets/framer";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";

mkdirSync(OUT_DIR, { recursive: true });

console.log(`fetching ${SRC}`);
const res = await fetch(SRC, { headers: { "User-Agent": UA } });
if (!res.ok) throw new Error(`fetch failed: HTTP ${res.status}`);
let html = await res.text();
console.log(`  ${(html.length / 1024).toFixed(0)} KB`);

// ── 1. stylesheet ─────────────────────────────────────────────────────────────
const styles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
let css = styles.join("\n\n");
console.log(`  ${styles.length} <style> blocks, ${(css.length / 1024).toFixed(0)} KB CSS`);

// ── 2. markup ─────────────────────────────────────────────────────────────────
const bodyStart = html.indexOf("<body");
const body = html.slice(bodyStart);
const mainMatch = body.match(/<div id="main"[\s\S]*?(?=<script)/);
if (!mainMatch) throw new Error("could not find #main markup");
let markup = mainMatch[0];
console.log(`  ${(markup.length / 1024).toFixed(0)} KB markup`);

// ── 3. assets ─────────────────────────────────────────────────────────────────
const assetRe = /https:\/\/framerusercontent\.com\/(?:images|assets|third-party-assets)\/[^"')\s\\]+/g;
const urls = [...new Set([...css.matchAll(assetRe), ...markup.matchAll(assetRe)].map((m) => m[0]))]
  .map((u) => u.replace(/&amp;/g, "&"));

const localName = (u) => {
  const clean = u.split("?")[0];
  const base = clean.split("/").pop();
  const q = u.includes("?") ? "-" + Buffer.from(u.split("?")[1]).toString("hex").slice(0, 8) : "";
  const ext = path.extname(base) || ".bin";
  return path.basename(base, ext) + q + ext;
};

console.log(`  ${urls.length} assets to mirror`);
let fetched = 0, cached = 0;
await Promise.all(urls.map(async (u) => {
  const name = localName(u);
  const dest = path.join(OUT_DIR, name);
  if (existsSync(dest)) { cached++; return; }
  try {
    const r = await fetch(u, { headers: { "User-Agent": UA } });
    if (!r.ok) { console.log(`    MISS ${r.status} ${u.slice(0, 80)}`); return; }
    writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
    fetched++;
  } catch (e) {
    console.log(`    FAIL ${u.slice(0, 80)} — ${e.message}`);
  }
}));
console.log(`  downloaded ${fetched}, already cached ${cached}`);

// rewrite both the &amp; and raw forms to the local path
for (const u of urls) {
  const rel = `framer/${localName(u)}`;
  for (const variant of [u, u.replace(/&/g, "&amp;")]) {
    css = css.split(variant).join(rel.replace("framer/", "./framer/"));
    markup = markup.split(variant).join(`assets/${rel}`);
  }
}

// ── 4. strip the Framer runtime ───────────────────────────────────────────────
markup = markup
  .replace(/<div id="__framer-badge-container"[\s\S]*?<\/div>/g, "")
  .replace(/<!--\$-->|<!--\/\$-->|<!--\?-->/g, "")   // React streaming markers
  .replace(/\s*data-framer-appear-id="[^"]*"/g, "")
  .replace(/\s*data-nested-link(?:="[^"]*")?/g, "");

// ── 4b. settle the reveal animations ──────────────────────────────────────────
// Framer ships scroll/appear animations at their STARTING state and animates
// them in with its runtime. Since the runtime is stripped, anything left at
// opacity:0 / blur(10px) / translateY(10px) would simply never appear — the
// hero headline is 78 individually-animated words. Snap them to their end state.
let settled = 0;
markup = markup.replace(/style="([^"]*)"/g, (full, decl) => {
  if (!/opacity:\s*0(?:\.\d+)?[;"]|filter:\s*blur\(/.test(decl)) return full;
  let d = decl
    .replace(/opacity:\s*0(?:\.0*\d+)?\s*(?=;|$)/g, "opacity:1")
    .replace(/filter:\s*blur\([^)]*\)\s*;?/g, "")
    .replace(/translateY\(-?[\d.]+px\)/g, "translateY(0px)")
    .replace(/translateX\(-?[\d.]+px\)/g, "translateX(0px)")
    .replace(/;;+/g, ";");
  if (d !== decl) settled++;
  return `style="${d}"`;
});
console.log(`  settled ${settled} at-rest reveal animations`);

// ── 4c. webfonts as a standalone sheet ────────────────────────────────────────
// so the hand-written pages can use the same self-hosted faces as the homepage
// instead of pulling Poppins/Inter from Google.
const faces = css.match(/@font-face\s*{[^}]*}/g) || [];
writeFileSync("assets/fonts.css", `/* Self-hosted webfaces extracted from the Framer design.
   Generated by tools/port-framer.mjs — do not hand-edit. */\n\n${faces.join("\n")}\n`);
console.log(`  wrote assets/fonts.css (${faces.length} @font-face rules)`);

css = css.replace(/#__framer-badge-container\s*{[^}]*}/g, "");

writeFileSync("assets/framer.css", `/* Ported verbatim from the published Framer design.
   Generated by tools/port-framer.mjs — do not hand-edit; re-run the script.
   Source: ${SRC} */\n\n${css}\n`);
writeFileSync("assets/framer-home.html", markup);

console.log(`\nwrote assets/framer.css (${(css.length / 1024).toFixed(0)} KB)`);
console.log(`wrote assets/framer-home.html (${(markup.length / 1024).toFixed(0)} KB)`);
console.log(`mirrored assets into ${OUT_DIR}/`);
console.log(`\nnext: node tools/build-home.mjs   (wires live data into index.html)`);
