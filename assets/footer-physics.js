// Footer physics pills — a reimplementation of the Framer code-component
// (plugin id 84d4c1) that the runtime renders in the footer. Its configuration
// was read straight out of the published site's JS chunk:
//
//   gravity 0.4 · bounce 0.3 · friction 0.88 · maxShapes 6 · spawnRate 2000ms
//   shapeSize 2 (1.6–1.8 on smaller breakpoints) · Poppins 600 14px
//   shapes: VIRAL / CREATIVE / ORGANIC / :) / SHORTS / LIFESTYLE
//
// Coloured pills drop in one at a time, bounce, tumble and settle in a pile.
// Disabled for prefers-reduced-motion, where the pills are simply laid out.
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
  var SPAWN_RATE = 2000, MAX = 6;

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
      return { el: el, spawned: false };
    });

    // measure once the font has settled so the boxes are the right size
    function measure() {
      pills.forEach(function (p) {
        var r = p.el.getBoundingClientRect();
        p.w = r.width; p.h = r.height;
        p.hw = p.w / 2; p.hh = p.h / 2;
        p.r = Math.sqrt(p.hw * p.hw + p.hh * p.hh) * 0.62; // collision radius
      });
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    measure();

    if (reduced) {
      root.classList.add("gm-static");
      pills.forEach(function (p) { p.el.style.position = "static"; });
      return;
    }

    var W = root.clientWidth, H = root.clientHeight;
    function resize() {
      W = root.clientWidth; H = root.clientHeight;
      var ns = sizeFor(W);
      if (ns !== scale) {
        scale = ns;
        pills.forEach(function (p) {
          p.el.style.fontSize = (14 * scale) + "px";
          p.el.style.padding = (7 * scale) + "px " + (14 * scale) + "px";
        });
        measure();
      }
    }
    window.addEventListener("resize", resize, { passive: true });

    function spawn(p) {
      p.spawned = true;
      p.x = p.hw + Math.random() * Math.max(1, W - p.w);
      p.y = -p.hh - 20;
      p.vx = (Math.random() - 0.5) * 3;
      p.vy = 0;
      p.a = (Math.random() - 0.5) * 0.4;   // angle
      p.va = (Math.random() - 0.5) * 0.05; // angular velocity
      p.el.style.opacity = "1";
    }

    var next = 0, live = 0, i = 0;
    function step(t) {
      if (!next) next = t;
      if (t >= next && live < MAX) {
        spawn(pills[i % pills.length]); i++; live++;
        next = t + SPAWN_RATE;
      }

      for (var a = 0; a < pills.length; a++) {
        var p = pills[a];
        if (!p.spawned) continue;

        p.vy += GRAVITY;
        p.x += p.vx;
        p.y += p.vy;
        p.a += p.va;

        // walls
        if (p.x - p.hw < 0)  { p.x = p.hw;      p.vx = -p.vx * BOUNCE; p.va *= -0.5; }
        if (p.x + p.hw > W)  { p.x = W - p.hw;  p.vx = -p.vx * BOUNCE; p.va *= -0.5; }

        // floor
        if (p.y + p.hh > H) {
          p.y = H - p.hh;
          if (Math.abs(p.vy) > 0.6) { p.vy = -p.vy * BOUNCE; p.va += p.vx * 0.01; }
          else { p.vy = 0; }
          p.vx *= FRICTION;
          p.va *= FRICTION;
          p.a *= 0.9;                        // settle flat
        }

        // pill-to-pill, circle approximation
        for (var b = a + 1; b < pills.length; b++) {
          var q = pills[b];
          if (!q.spawned) continue;
          var dx = q.x - p.x, dy = q.y - p.y;
          var d = Math.hypot(dx, dy), min = p.r + q.r;
          if (d > 0 && d < min) {
            var nx = dx / d, ny = dy / d, push = (min - d) / 2;
            p.x -= nx * push; p.y -= ny * push;
            q.x += nx * push; q.y += ny * push;
            var rel = (q.vx - p.vx) * nx + (q.vy - p.vy) * ny;
            if (rel < 0) {
              var imp = -(1 + BOUNCE) * rel / 2;
              p.vx -= imp * nx; p.vy -= imp * ny;
              q.vx += imp * nx; q.vy += imp * ny;
              p.va += imp * 0.01; q.va -= imp * 0.01;
            }
          }
        }

        p.el.style.transform =
          "translate(" + (p.x - p.hw) + "px," + (p.y - p.hh) + "px) rotate(" + p.a + "rad)";
      }
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function boot() {
    document.querySelectorAll("[data-footer-physics]").forEach(function (el) {
      // only animate once it's actually on screen
      if (!("IntersectionObserver" in window)) return init(el);
      new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { init(e.target); obs.unobserve(e.target); }
        });
      }, { rootMargin: "120px" }).observe(el);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
