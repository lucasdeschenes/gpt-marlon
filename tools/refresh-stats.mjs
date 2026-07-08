// Pulls the latest account numbers from the Instagram Graph API and upserts them into
// Supabase (site_stats), which the public website reads live. Run manually, or on a
// schedule (cron / GitHub Action) so the site never needs a manual edit.
//   node --env-file=.env tools/refresh-stats.mjs
const T = process.env.IG_ACCESS_TOKEN, U = process.env.IG_USER_ID, H = process.env.GRAPH_HOST || "graph.instagram.com";
const SB_URL = process.env.SUPABASE_URL, SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
if (!T || !U) { console.error("missing IG_ACCESS_TOKEN / IG_USER_ID"); process.exit(1); }

const fmtK = (n) => n >= 1e6 ? (Math.round(n / 1e5) / 10) + "M+" : n >= 1e3 ? (Math.round(n / 1e2) / 10 >= 10 ? Math.round(n / 1e3) + "K+" : (Math.round(n / 1e2) / 10) + "K+") : String(n);

// Keep the IG token alive: Instagram long-lived tokens (60 days) can be refreshed for
// another 60 days once they're >24h old. Running this on any schedule < 60 days means the
// token effectively never expires — and the WEBSITE never touches the token at all (it
// reads cached numbers from Supabase), so even a dead token can't break the site.
import { readFileSync, writeFileSync } from "node:fs";
let token = T;
try {
  const rf = await fetch(`https://${H}/refresh_access_token?grant_type=ig_refresh_token&access_token=${T}`).then((r) => r.json());
  if (rf.access_token && rf.access_token !== T) {
    token = rf.access_token;
    const env = readFileSync(".env", "utf8");
    writeFileSync(".env", env.replace(/^IG_ACCESS_TOKEN=.*$/m, "IG_ACCESS_TOKEN=" + token));
    console.log("↻ IG token refreshed — new 60-day lifetime, written to .env (expires_in " + Math.round((rf.expires_in || 0) / 86400) + "d)");
  } else if (rf.error) {
    console.log("token refresh skipped: " + rf.error.message);
  }
} catch (e) { console.log("token refresh skipped: " + e.message); }

const me = await fetch(`https://${H}/v21.0/me?fields=followers_count&access_token=${token}`).then((r) => r.json());
if (me.error) { console.error("IG error:", me.error.message); process.exit(1); }
const since = Math.floor((Date.now() - 30 * 86400000) / 1000), until = Math.floor(Date.now() / 1000);
const metrics = "views,reach,total_interactions,accounts_engaged";
const ins = await fetch(`https://${H}/v21.0/${U}/insights?metric=${metrics}&period=day&metric_type=total_value&since=${since}&until=${until}&access_token=${T}`).then((r) => r.json());
if (ins.error) { console.error("insights error:", ins.error.message); process.exit(1); }
const m = {}; for (const x of ins.data || []) m[x.name] = (x.total_value && x.total_value.value) || 0;

const followers = me.followers_count;
const views = m.views || 0, reach = m.reach || 0, interactions = m.total_interactions || 0, engaged = m.accounts_engaged || 0;
const erReach = reach ? +(interactions / reach * 100).toFixed(1) : 0;

const stats = {
  followers: fmtK(followers),
  followers_raw: String(followers),
  views_30d: fmtK(views),
  reach_30d: fmtK(reach),
  interactions_30d: fmtK(interactions),
  engagement_rate: erReach + "%",
  updated: new Date(until * 1000).toISOString().slice(0, 10),
};
console.log("fetched:", stats);

if (!SB_URL || !SB_KEY) { console.log("\n(no SUPABASE_SERVICE_KEY in env — printed only, not stored)"); process.exit(0); }
const rows = Object.entries(stats).map(([key, value]) => ({ key, value, updated_at: new Date().toISOString() }));
const res = await fetch(`${SB_URL}/rest/v1/site_stats`, {
  method: "POST",
  headers: { apikey: SB_KEY, Authorization: "Bearer " + SB_KEY, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
  body: JSON.stringify(rows),
});
console.log(res.ok ? "\n✓ stored in Supabase site_stats" : "\n✗ store failed " + res.status + " " + (await res.text()));
