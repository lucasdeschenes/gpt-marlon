// Smooth scrolling — the "mouse effect" from the Framer design.
// Same library (Lenis 1.1.18) and same configuration Framer ships, vendored
// locally instead of loaded from unpkg. Runs on every page.
(function () {
  if (typeof Lenis === 'undefined') return;
  // respect the OS setting — smooth scroll hijacking is a motion trigger
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var lenis = new Lenis({
    duration: 1.2,
    easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    mouseMultiplier: 1,
    smoothTouch: false,
    touchMultiplier: 2,
    infinite: false,
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // let in-page anchors (guide table of contents, homepage sections) ease too
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href || href === '#') return;
    var target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { offset: -80 });
  });

  window.lenis = lenis;
})();
