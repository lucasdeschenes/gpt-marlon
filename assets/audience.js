// Real follower demographics → horizontal bar charts.
// Reads the audience_stats table (age / gender / country / city) that the refresh-stats
// Edge Function fills from Instagram's follower_demographics metric. The website only reads
// these cached numbers — it never touches the IG token. Renders into:
//   <div data-audience="age|country|city|gender" data-platform="instagram"></div>
// and fills inline facts:  <span data-aud-fact="dach|age_core|top_country"></span>
// Bars are normalised to each chart's own max so the leader fills the track; exact % is labelled.
(function () {
  var SB_URL = 'https://topypyboyyvykdfbxqmj.supabase.co';
  var SB_KEY = 'sb_publishable_igrAFNS4S_dvOAqnxZY7pg_EE0oipId';

  var COUNTRY = {
    DE: ['🇩🇪', 'Deutschland', 'Germany'], AT: ['🇦🇹', 'Österreich', 'Austria'],
    CH: ['🇨🇭', 'Schweiz', 'Switzerland'], ES: ['🇪🇸', 'Spanien', 'Spain'],
    IT: ['🇮🇹', 'Italien', 'Italy'], NL: ['🇳🇱', 'Niederlande', 'Netherlands'],
    FR: ['🇫🇷', 'Frankreich', 'France'], GB: ['🇬🇧', 'UK', 'UK'],
    US: ['🇺🇸', 'USA', 'USA'], PL: ['🇵🇱', 'Polen', 'Poland'], TR: ['🇹🇷', 'Türkei', 'Turkey']
  };
  var CITY = { 'Munich': 'München', 'Vienna': 'Wien', 'Cologne': 'Köln', 'Zurich': 'Zürich' };

  var store = {};   // breakdown -> items (per platform key)
  var meta = {};    // platform -> updated_at

  function isEN() { return document.documentElement.getAttribute('lang') === 'en'; }
  function fmtPct(n) { var s = (Math.round(n * 10) / 10).toFixed(1); return isEN() ? s + '%' : s.replace('.', ',') + '%'; }
  function cleanCity(s) { var c = (s || '').split(',')[0].trim(); return CITY[c] || c; }

  function label(breakdown, raw) {
    // Country flag emojis fall back to bare letter-codes on Windows, so render the plain
    // localized name instead — clean and identical across every platform.
    if (breakdown === 'country') { var c = COUNTRY[raw]; return c ? (isEN() ? c[2] : c[1]) : raw; }
    if (breakdown === 'city') return cleanCity(raw);
    return raw; // age labels are language-neutral
  }

  function barRows(breakdown, items) {
    var max = items.reduce(function (m, x) { return Math.max(m, x.pct || 0); }, 0) || 1;
    return items.map(function (it) {
      var w = Math.max(3, (it.pct / max) * 100);
      return '<div class="aud-row">' +
        '<span class="aud-lbl">' + label(breakdown, it.label) + '</span>' +
        '<span class="aud-track"><span class="aud-fill" style="width:' + w.toFixed(1) + '%"></span></span>' +
        '<span class="aud-val">' + fmtPct(it.pct) + '</span></div>';
    }).join('');
  }

  function genderRows(items) {
    var by = {}; items.forEach(function (x) { by[x.label] = x.value; });
    var m = by.M || 0, f = by.F || 0, declared = m + f;
    if (!declared) return '';
    var mp = m / declared * 100, fp = f / declared * 100;
    var men = isEN() ? 'Men' : 'Männer', women = isEN() ? 'Women' : 'Frauen';
    var mk = function (lbl, p) {
      return '<div class="aud-row"><span class="aud-lbl">' + lbl + '</span>' +
        '<span class="aud-track"><span class="aud-fill" style="width:' + Math.max(3, p).toFixed(1) + '%"></span></span>' +
        '<span class="aud-val">' + fmtPct(p) + '</span></div>';
    };
    return mk(men, mp) + mk(women, fp);
  }

  function render() {
    document.querySelectorAll('[data-audience]').forEach(function (el) {
      var b = el.getAttribute('data-audience');
      var plat = el.getAttribute('data-platform') || 'instagram';
      var items = store[plat + ':' + b];
      if (!items || !items.length) return;
      var n = parseInt(el.getAttribute('data-aud-max') || '0', 10);
      var list = n > 0 ? items.slice(0, n) : items;
      el.innerHTML = b === 'gender' ? genderRows(list) : barRows(b, list);
      el.classList.add('aud-ready');
    });
    // inline facts
    var ig = 'instagram:';
    var country = store[ig + 'country'] || [];
    var age = store[ig + 'age'] || [];
    var dach = country.filter(function (c) { return ['DE', 'AT', 'CH'].indexOf(c.label) !== -1; })
      .reduce(function (s, c) { return s + (c.pct || 0); }, 0);
    var core = age.filter(function (a) { return ['25-34', '35-44', '45-54'].indexOf(a.label) !== -1; })
      .reduce(function (s, a) { return s + (a.pct || 0); }, 0);
    var top = country[0];
    document.querySelectorAll('[data-aud-fact]').forEach(function (el) {
      var k = el.getAttribute('data-aud-fact');
      if (k === 'dach' && dach) el.textContent = fmtPct(dach);
      if (k === 'age_core' && core) el.textContent = fmtPct(core);
      if (k === 'top_country' && top) el.textContent = label('country', top.label);
    });
    document.querySelectorAll('[data-aud-updated]').forEach(function (el) {
      var d = meta.instagram; if (d) el.textContent = d.slice(0, 10);
    });
  }

  fetch(SB_URL + '/rest/v1/audience_stats?select=platform,breakdown,data,updated_at', { headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY } })
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (rows) {
      rows.forEach(function (x) {
        store[x.platform + ':' + x.breakdown] = x.data || [];
        meta[x.platform] = x.updated_at;
      });
      render();
    })
    .catch(function () {});

  // re-render once the DOM is ready (lang.js may have applied a saved EN preference
  // after our first render) and on every language toggle, so country/city labels switch DE/EN
  document.addEventListener('DOMContentLoaded', function () {
    setTimeout(render, 60);
    document.querySelectorAll('[data-langtoggle]').forEach(function (b) {
      b.addEventListener('click', function () { setTimeout(render, 30); });
    });
  });
})();
