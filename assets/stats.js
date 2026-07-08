// Live account stats: reads the numbers refresh-stats.mjs stored in Supabase and fills
// any [data-stat="..."] element. The website NEVER touches the Instagram token — it only
// reads these cached values, so a stale/expired token can't break the site (numbers just
// stop updating until the scheduled refresh runs again). Hardcoded HTML values are the
// fallback if Supabase is unreachable.
(function () {
  var SB_URL = 'https://topypyboyyvykdfbxqmj.supabase.co';
  var SB_KEY = 'sb_publishable_igrAFNS4S_dvOAqnxZY7pg_EE0oipId';
  fetch(SB_URL + '/rest/v1/site_stats?select=key,value', { headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY } })
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (rows) {
      var m = {}; rows.forEach(function (x) { m[x.key] = x.value; });
      document.querySelectorAll('[data-stat]').forEach(function (el) {
        var v = m[el.getAttribute('data-stat')];
        if (v) el.textContent = v;
      });
    })
    .catch(function () {});
})();
