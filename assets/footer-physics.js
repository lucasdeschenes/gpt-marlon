// Footer physics pills — reimplementation of the Framer code-component
// (plugin id 84d4c1). Configuration read from the published site's JS chunk:
//
//   gravity 0.4 · bounce 0.3 · friction 0.88 · maxShapes 6
//   shapeSize 2 (1.6–1.8 on smaller breakpoints) · Poppins 600 14px
//   shapes: VIRAL / CREATIVE / ORGANIC / :) / SHORTS / LIFESTYLE
//
// All six drop together when the band scrolls into view, bounce off the walls
// and floor, collide as boxes and settle into a row. Box collision matters here:
// the pills are long, so a circle approximation lets wide ones overlap badly.
// Under prefers-reduced-motion they're laid out statically instead.
(function () {
  var SHAPES = [
    { text: "VIRAL",     color: "rgb(255, 231, 74)"  },
    { text: "CREATIVE",  color: "rgb(193, 145, 255)" },
    { text: "ORGANIC",   color: "rgb(182, 232, 176)" },
    { text: ":)",        color: "rgb(255, 219, 181)" },
    { text: "SHORTS",    color: "rgb(222, 16, 170)"  },
    { text: "LIFESTYLE", color: "rgb(181, 149, 233)" }
  ];
  var TEXT_COLOR = "rgb(10, 10, 10)";
  var GRAVITY = 0.4, BOUNCE = 0.3, FRICTION = 0.88;
  var ITERATIONS = 6;   // collision relaxation passes per frame

  function sizeFor(w) { return w < 700 ? 1.6 : w < 1000 ? 1.8 : 2; }

  function init(root) {
    if (root.dataset.physicsReady) return;
    root.dataset.physicsReady = "1";

    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var scale = sizeFor(root.clientWidth || window.innerWidth);

    var pills = SHAPES.map(function (s) {
      var el = document.createElement("div");
      el.className = "gm-pill";
      el.textContent = s.text;
      el.style.background = s.color;
      el.style.color = TEXT_COLOR;
      el.style.fontSize = (14 * scale) + "px";
      el.style.padding = (7 * scale) + "px " + (14 * scale) + "px";
      root.appendChild(el);
      return { el: el };
    });

    function measure() {
      pills.forEach(function (p) {
        var r = p.el.getBoundingClientRect();
        p.w = r.width; p.h = r.height;
        p.hw = p.w / 2; p.hh = p.h / 2;
      });
    }
    measure();

    if (reduced) {
      root.classList.add("gm-static");
      pills.forEach(function (p) { p.el.style.position = "static"; p.el.style.opacity = "1"; });
      return;
    }

    var W = root.clientWidth, H = root.clientHeight;

    // Drop them all at once, spread across the width and staggered in height so
    // they don't start life inside one another.
    function drop() {
      measure();
      W = root.clientWidth; H = root.clientHeight;
      var order = pills.map(function (_p, i) { return i; });
      for (var k = order.length - 1; k > 0; k--) {          // shuffle the columns
        var j = Math.floor(Math.random() * (k + 1));
        var t = order[k]; order[k] = order[j]; order[j] = t;
      }
      var totalW = pills.reduce(function (a, p) { return a + p.w; }, 0);
      var gap = Math.max(8, (W - totalW) / (pills.length + 1));
      var x = gap;
      order.forEach(function (idx, col) {
        var p = pills[idx];
        p.x = Math.min(W - p.hw, Math.max(p.hw, x + p.hw));
        x += p.w + gap;
        p.y = -p.hh - col * (p.h + 30) - 40;   // stacked above the top edge
        p.vx = (Math.random() - 0.5) * 2;
        p.vy = 0;
        p.a = (Math.random() - 0.5) * 0.5;
        p.va = (Math.random() - 0.5) * 0.03;
        p.el.style.opacity = "1";
      });
    }

    function resize() {
      var ns = sizeFor(root.clientWidth);
      if (ns !== scale) {
        scale = ns;
        pills.forEach(function (p) {
          p.el.style.fontSize = (14 * scale) + "px";
          p.el.style.padding = (7 * scale) + "px " + (14 * scale) + "px";
        });
      }
      W = root.clientWidth; H = root.clientHeight;
      measure();
    }
    window.addEventListener("resize", resize, { passive: true });

    // axis-aligned box separation — pills settle flat, so this is accurate
    // enough and, unlike circles, it never lets a long pill sink into another.
    function collide() {
      for (var a = 0; a < pills.length; a++) {
        for (var b = a + 1; b < pills.length; b++) {
          var p = pills[a], q = pills[b];
          var dx = q.x - p.x, dy = q.y - p.y;
          var ox = (p.hw + q.hw) - Math.abs(dx);
          var oy = (p.hh + q.hh) - Math.abs(dy);
          if (ox <= 0 || oy <= 0) continue;

          if (ox < oy) {                       // separate horizontally
            var sx = (dx < 0 ? -1 : 1) * ox / 2;
            p.x -= sx; q.x += sx;
            var rvx = q.vx - p.vx;
            if (rvx * (dx < 0 ? -1 : 1) < 0) {
              var ix = -(1 + BOUNCE) * rvx / 2;
              p.vx -= ix; q.vx += ix;
            }
          } else {                             // separate vertically
            var sy = (dy < 0 ? -1 : 1) * oy / 2;
            p.y -= sy; q.y += sy;
            var rvy = q.vy - p.vy;
            if (rvy * (dy < 0 ? -1 : 1) < 0) {
              var iy = -(1 + BOUNCE) * rvy / 2;
              p.vy -= iy; q.vy += iy;
            }
            // resting contact: damp horizontal slide and rotation
            p.vx *= 0.96; q.vx *= 0.96;
            p.va *= 0.85; q.va *= 0.85;
          }
        }
      }
    }

    function step() {
      for (var i = 0; i < pills.length; i++) {
        var p = pills[i];
        if (p.x === undefined) continue;
        p.vy += GRAVITY;
        p.x += p.vx;
        p.y += p.vy;
        p.a += p.va;
      }

      for (var it = 0; it < ITERATIONS; it++) {
        collide();
        for (var j = 0; j < pills.length; j++) {
          var q = pills[j];
          if (q.x === undefined) continue;
          if (q.x - q.hw < 0)  { q.x = q.hw;     if (q.vx < 0) q.vx = -q.vx * BOUNCE; }
          if (q.x + q.hw > W)  { q.x = W - q.hw; if (q.vx > 0) q.vx = -q.vx * BOUNCE; }
          if (q.y + q.hh > H) {
            q.y = H - q.hh;
            if (q.vy > 0.6) { q.vy = -q.vy * BOUNCE; }
            else { q.vy = 0; }
            q.vx *= FRICTION;
            q.va *= FRICTION;
            q.a *= 0.88;                       // settle flat
          }
        }
      }

      for (var k = 0; k < pills.length; k++) {
        var r = pills[k];
        if (r.x === undefined) continue;
        r.el.style.transform =
          "translate(" + (r.x - r.hw) + "px," + (r.y - r.hh) + "px) rotate(" + r.a + "rad)";
      }
      requestAnimationFrame(step);
    }

    if (document.fonts && document.fonts.ready) document.fonts.ready.then(drop);
    else drop();
    requestAnimationFrame(step);
  }

  function boot() {
    document.querySelectorAll("[data-footer-physics]").forEach(function (el) {
      if (!("IntersectionObserver" in window)) return init(el);
      new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (e) {
          // fire once the band is properly on screen, so the pills drop
          // as you arrive at the bottom rather than before
          if (e.isIntersecting) { init(e.target); obs.unobserve(e.target); }
        });
      }, { threshold: 0.45 }).observe(el);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
