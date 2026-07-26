// Word-by-word text reveal — replays the Framer entrance animation that the
// stripped runtime would otherwise never run. The design's at-rest state was
// opacity 0.001 / blur(10px) / translateY(10px), so the words fade up and
// sharpen into place, staggered across each block.
// Skipped under prefers-reduced-motion (the words are simply visible).
(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  function boot() {
    var words = document.querySelectorAll(".gm-word");
    if (!words.length) return;

    // group by nearest block so each heading/paragraph staggers on its own
    var groups = new Map();
    words.forEach(function (w) {
      var block = w.closest("p, h1, h2, h3, div");
      if (!groups.has(block)) groups.set(block, []);
      groups.get(block).push(w);
    });

    groups.forEach(function (list, block) {
      list.forEach(function (w, i) { w.style.setProperty("--i", i); });
      block.classList.add("gm-reveal");
    });

    if (!("IntersectionObserver" in window)) {
      groups.forEach(function (_l, b) { b.classList.add("gm-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("gm-in"); obs.unobserve(e.target); }
      });
    }, { threshold: 0.2 });
    groups.forEach(function (_l, b) { io.observe(b); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
