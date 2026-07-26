// Custom cursor — a small accent dot with a trailing ring that swells over
// anything clickable. The Framer design used this on the hero only; here it runs
// on every page so the site feels consistent.
// Skipped entirely on touch devices, coarse pointers and reduced-motion.
(function () {
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!fine || still) return;

  var html = document.documentElement;
  var dot = document.createElement('div');
  var ring = document.createElement('div');
  dot.className = 'cursor-dot';
  ring.className = 'cursor-ring';

  document.addEventListener('DOMContentLoaded', function () {
    document.body.appendChild(dot);
    document.body.appendChild(ring);
    html.classList.add('has-cursor');
  });

  var mx = 0, my = 0;   // pointer
  var rx = 0, ry = 0;   // ring position (eased behind the pointer)
  var seen = false;

  window.addEventListener('mousemove', function (e) {
    mx = e.clientX; my = e.clientY;
    if (!seen) { rx = mx; ry = my; seen = true; html.classList.add('cursor-ready'); }
    dot.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
  }, { passive: true });

  // ring trails the dot
  (function frame() {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)';
    requestAnimationFrame(frame);
  })();

  // swell over interactive targets
  var HOT = 'a, button, [role="button"], input, textarea, select, label, summary, .guide-card, .cat-chip';
  document.addEventListener('mouseover', function (e) {
    if (e.target.closest && e.target.closest(HOT)) html.classList.add('cursor-hot');
  }, { passive: true });
  document.addEventListener('mouseout', function (e) {
    if (e.target.closest && e.target.closest(HOT)) html.classList.remove('cursor-hot');
  }, { passive: true });

  // hide when the pointer leaves the window
  document.addEventListener('mouseleave', function () { html.classList.remove('cursor-ready'); }, { passive: true });
  document.addEventListener('mouseenter', function () { html.classList.add('cursor-ready'); }, { passive: true });
})();
