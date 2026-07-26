// GPT Marlon site — shared runtime: Supabase capture, reveal animations, mobile nav.
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

// The redesign is dark-only. Drop any theme left over from the previous design
// so a returning visitor who had picked "light" isn't stuck on a dead attribute.
document.documentElement.removeAttribute('data-theme');
try { localStorage.removeItem('gptmarlon-theme'); } catch (e) {}

document.addEventListener('DOMContentLoaded', () => {
  // mobile nav
  const burger = document.querySelector('[data-burger]');
  const links = document.querySelector('.nav-links');
  if (burger && links) {
    burger.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.textContent = open ? '✕' : '☰';
    });
    links.addEventListener('click', (e) => {
      if (e.target.closest('a')) {
        links.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        burger.textContent = '☰';
      }
    });
  }

  // scroll reveal
  const observer = new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
  document.querySelectorAll('.fade-up').forEach((el, i) => {
    el.style.transitionDelay = ((i % 4) * 0.08) + 's';
    observer.observe(el);
  });
});
