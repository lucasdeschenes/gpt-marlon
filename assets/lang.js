// German-first i18n. The HTML text is German (the base, SEO-correct, works without JS).
// Any element that also has a data-en="..." attribute swaps to English when the visitor
// toggles language. Preference is remembered in localStorage. Toggle button: [data-langtoggle].
(function () {
  var KEY = 'gptmarlon-lang';
  var lang = localStorage.getItem(KEY) || 'de';

  function apply(l) {
    document.documentElement.setAttribute('lang', l);
    document.querySelectorAll('[data-en]').forEach(function (el) {
      if (el.__de == null) el.__de = el.innerHTML;           // remember the German base once
      el.innerHTML = (l === 'en') ? el.getAttribute('data-en') : el.__de;
    });
    document.querySelectorAll('[data-en-ph]').forEach(function (el) {
      if (el.__deph == null) el.__deph = el.getAttribute('placeholder') || '';
      el.setAttribute('placeholder', (l === 'en') ? el.getAttribute('data-en-ph') : el.__deph);
    });
    document.querySelectorAll('[data-langtoggle]').forEach(function (b) {
      b.textContent = (l === 'en') ? 'DE' : 'EN';
      b.setAttribute('title', (l === 'en') ? 'Auf Deutsch anzeigen' : 'Show in English');
    });
  }

  function toggle() {
    lang = (lang === 'en') ? 'de' : 'en';
    localStorage.setItem(KEY, lang);
    apply(lang);
  }

  document.addEventListener('DOMContentLoaded', function () {
    apply(lang);
    document.querySelectorAll('[data-langtoggle]').forEach(function (b) {
      b.addEventListener('click', function (e) { e.preventDefault(); toggle(); });
    });
  });
})();
