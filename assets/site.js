// GPT Marlon site — shared runtime: theme, reveal animations, Supabase form storage.
// The key below is the PUBLISHABLE key; row-level security only permits INSERTs.
const SB_URL = 'https://topypyboyyvykdfbxqmj.supabase.co';
const SB_KEY = 'sb_publishable_igrAFNS4S_dvOAqnxZY7pg_EE0oipId';

async function sbInsert(table, row) {
  const res = await fetch(SB_URL + '/rest/v1/' + table, {
    method: 'POST',
    headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(row),
  });
  if (!res.ok) throw new Error('save failed (' + res.status + ')');
}
window.saveLead = (kind, email, name, note) => sbInsert('site_leads', { kind, email, name: name || null, note: note || null });
window.saveMessage = (name, email, topic, message) => sbInsert('site_messages', { name: name || null, email, topic: topic || null, message });

// theme (shared with the landing page's localStorage key)
const htmlEl = document.documentElement;
const savedTheme = localStorage.getItem('gptmarlon-theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
htmlEl.dataset.theme = savedTheme || (prefersDark ? 'dark' : 'light');

document.addEventListener('DOMContentLoaded', () => {
  const t = document.getElementById('themeToggle');
  if (t) t.addEventListener('click', () => {
    htmlEl.dataset.theme = htmlEl.dataset.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('gptmarlon-theme', htmlEl.dataset.theme);
  });
  const observer = new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
  document.querySelectorAll('.fade-up').forEach((el, i) => {
    el.style.transitionDelay = ((i % 4) * 0.08) + 's';
    observer.observe(el);
  });
});
