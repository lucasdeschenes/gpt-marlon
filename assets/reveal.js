// Word-by-word text reveal — replays the Framer entrance animation that the
// stripped runtime would otherwise never run. The design's at-rest state was
// opacity 0.001 / blur(10px) / translateY(10px), so the words fade up and
// sharpen into place, staggered across each block.
//
// Runs again after a language switch: lang.js swaps innerHTML, which replaces
// the word spans with fresh ones that have no stagger index yet.
// Skipped under prefers-reduced-motion (the words are simply visible).
(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var io = ("IntersectionObserver" in window)
    ? new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add("gm-in"); obs.unobserve(e.target); }
        });
      }, { threshold: 0.2 })
    : null;

  function apply() {
    var words = document.querySelectorAll(".gm-word");
    if (!words.length) return;

    // group by nearest block so each heading/paragraph staggers on its own
    var groups = new Map();
    Array.prototype.forEach.call(words, function (w) {
      var block = w.closest("p, h1, h2, h3, div");
      if (!block) return;
      if (!groups.has(block)) groups.set(block, []);
      groups.get(block).push(w);
    });

    groups.forEach(function (list, block) {
      list.forEach(function (w, i) { w.style.setProperty("--i", i); });
      block.classList.add("gm-reveal");
      if (!io) { block.classList.add("gm-in"); return; }
      // a block already on screen (e.g. the hero after a language switch)
      // should play immediately rather than wait for a scroll
      var r = block.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) block.classList.add("gm-in");
      else { block.classList.remove("gm-in"); io.observe(block); }
    });
  }

  function boot() {
    apply();
    // re-apply once lang.js has swapped the markup
    document.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest("[data-langtoggle]")) setTimeout(apply, 0);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
