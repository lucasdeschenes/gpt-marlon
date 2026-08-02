// "Join Community" email popup — injected on every page. Any element with [data-community]
// opens it; the email is stored in Supabase (site_leads, kind='community').
(function () {
  var SB_URL = 'https://topypyboyyvykdfbxqmj.supabase.co';
  var SB_KEY = 'sb_publishable_igrAFNS4S_dvOAqnxZY7pg_EE0oipId';

  function build() {
    var b = document.createElement('div');
    b.className = 'modal-backdrop';
    b.innerHTML =
      '<div class="modal" role="dialog" aria-modal="true">' +
        '<button class="modal-close" aria-label="Schließen">×</button>' +
        '<h3>Join the community</h3>' +
        '<p>Wir bauen die Community gerade auf. Trag deine E-Mail ein und du stehst auf der Waitlist. Sobald es losgeht, erfährst du es als Erstes.</p>' +
        '<div class="modal-row">' +
          '<input type="email" placeholder="deine@email.com" id="__commEmail" />' +
          '<button class="btn-primary" id="__commBtn">Auf die Waitlist</button>' +
        '</div>' +
        '<div class="modal-status" id="__commStatus"></div>' +
        '<div class="modal-fine">Mit dem Beitreten stimmst du der Speicherung deiner E-Mail gemäß Datenschutzerklärung zu.</div>' +
      '</div>';
    document.body.appendChild(b);
    var input = b.querySelector('#__commEmail'), btn = b.querySelector('#__commBtn'), status = b.querySelector('#__commStatus');
    function close() { b.classList.remove('open'); status.textContent = ''; status.style.color = ''; }
    b.querySelector('.modal-close').addEventListener('click', close);
    b.addEventListener('click', function (e) { if (e.target === b) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    btn.addEventListener('click', async function () {
      var email = (input.value || '').trim();
      if (!email || email.indexOf('@') < 1) { status.style.color = '#f87171'; status.textContent = 'Bitte gültige E-Mail eingeben.'; return; }
      btn.disabled = true; btn.textContent = '…';
      try {
        var res = await fetch(SB_URL + '/rest/v1/site_leads', {
          method: 'POST',
          headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
          body: JSON.stringify({ kind: 'community', email: email }),
        });
        if (!res.ok) throw new Error('x');
        status.style.color = '#34d399'; status.textContent = 'Du stehst auf der Waitlist.';
        input.value = '';
        setTimeout(close, 1800);
      } catch (e) {
        status.style.color = '#f87171'; status.textContent = 'Etwas ist schiefgelaufen, versuch es später.';
      }
      btn.disabled = false; btn.textContent = 'Auf die Waitlist';
    });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') btn.click(); });
    return b;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var modal = null;
    document.querySelectorAll('[data-community]').forEach(function (t) {
      t.addEventListener('click', function (e) {
        e.preventDefault();
        if (!modal) modal = build();
        modal.classList.add('open');
        var i = modal.querySelector('#__commEmail'); if (i) setTimeout(function () { i.focus(); }, 60);
      });
    });
  });
})();
