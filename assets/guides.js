// Guides — copy-to-clipboard + open-in-Claude/ChatGPT for prompt cards.
function _promptText(btn) {
  const card = btn.closest('.prompt-card');
  const pre = card && card.querySelector('.prompt-text');
  return pre ? pre.innerText : '';
}
function _toast(msg) {
  let t = document.querySelector('.copy-toast');
  if (!t) { t = document.createElement('div'); t.className = 'copy-toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove('show'), 1800);
}
async function copyPrompt(btn) {
  const text = _promptText(btn);
  try { await navigator.clipboard.writeText(text); }
  catch (e) {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); ta.remove();
  }
  _toast('✓ Prompt kopiert');
}
function openIn(btn, target) {
  const text = _promptText(btn);
  const url = target === 'claude'
    ? 'https://claude.ai/new?q=' + encodeURIComponent(text)
    : 'https://chatgpt.com/?q=' + encodeURIComponent(text);
  window.open(url, '_blank', 'noopener');
}
