// Custom cursor — ported from the Framer component "custom cursor mouse".
// A yellow arrow with a 1px black outline and a hard black drop shadow,
// rotated 13deg, replacing the system pointer. 33px glyph in a 55px box.
// Skipped on touch/coarse pointers and when reduced motion is requested.
(function () {
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!fine || still) return;

  var SVG =
    '<svg viewBox="0 0 32.386 32.764" width="33" height="33" aria-hidden="true" focusable="false">' +
      '<path d="M 11.087 32.764 L 0 0 L 32.386 11.122 L 16.339 16.532 Z"' +
      ' fill="#ffe74a" stroke="#000" stroke-width="1"' +
      ' stroke-linecap="round" stroke-linejoin="round" />' +
    '</svg>';

  var html = document.documentElement;
  var el = document.createElement('div');
  el.className = 'framer-cursor';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = SVG;

  document.addEventListener('DOMContentLoaded', function () {
    document.body.appendChild(el);
    html.classList.add('has-cursor');
  });

  var x = 0, y = 0, seen = false, raf = null;
  window.addEventListener('mousemove', function (e) {
    x = e.clientX; y = e.clientY;
    if (!seen) { seen = true; html.classList.add('cursor-ready'); }
    if (raf) return;
    raf = requestAnimationFrame(function () {
      raf = null;
      el.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
    });
  }, { passive: true });

  // slight lift over anything clickable
  var HOT = 'a, button, [role="button"], input, textarea, select, label, summary, .guide-card, .cat-chip';
  document.addEventListener('mouseover', function (e) {
    if (e.target.closest && e.target.closest(HOT)) html.classList.add('cursor-hot');
  }, { passive: true });
  document.addEventListener('mouseout', function (e) {
    if (e.target.closest && e.target.closest(HOT)) html.classList.remove('cursor-hot');
  }, { passive: true });

  document.addEventListener('mouseleave', function () { html.classList.remove('cursor-ready'); }, { passive: true });
  document.addEventListener('mouseenter', function () { html.classList.add('cursor-ready'); }, { passive: true });
})();
