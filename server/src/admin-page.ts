// The admin panel: one self-contained page. It holds no data itself; it asks for the ADMIN_TOKEN and then calls
// /admin/api/* with it. Every value from the database is put on the page with textContent, never as HTML.

export function adminPage(nonce: string, grantable: readonly string[], labels: Record<string, string> = {}): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Heirloom admin</title>
<style nonce="${nonce}">
  :root { --bg:#FBFAF8; --fg:#1C1622; --muted:#5E5468; --line:#E4DFE7; --accent:#8A5A12; --bad:#B3261E; --card:#fff; color-scheme: light; }
  @media (prefers-color-scheme: dark) { :root { --bg:#1C1622; --fg:#F5EEE6; --muted:#B9AEC2; --line:#3E3349; --accent:#E7B55E; --bad:#F2B8B5; --card:#251D2C; color-scheme: dark; } }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--fg); font:14px/1.5 system-ui, -apple-system, 'Segoe UI', sans-serif; }
  main { max-width:1440px; margin:0 auto; padding:24px 16px 64px; }
  h1 { font-size:22px; margin:0 0 4px; } h2 { font-size:17px; margin:28px 0 8px; }
  .muted { color:var(--muted); }
  .card { background:var(--card); border:1px solid var(--line); border-radius:10px; padding:12px; }
  .row { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
  input, button { font:inherit; padding:6px 10px; border-radius:8px; border:1px solid var(--line); background:var(--bg); color:var(--fg); }
  button { cursor:pointer; } button.primary { background:var(--accent); color:var(--bg); border-color:var(--accent); }
  button.bad { color:var(--bad); }
  .wrap { overflow-x:auto; }
  table { border-collapse:collapse; width:100%; }
  th, td { text-align:left; padding:6px 8px; border-bottom:1px solid var(--line); vertical-align:top; white-space:nowrap; }
  td.grants { white-space:normal; min-width:250px; max-width:330px; }
  td.grants label, #g-grants label { display:inline-flex; gap:3px; margin-right:10px; font-size:12px; white-space:nowrap; }
  td.actions { white-space:normal; min-width:130px; } td.actions button { display:block; width:100%; margin:0 0 4px; }
  code { font-size:12px; }
  .hidden { display:none; }
  #msg { min-height:20px; }
</style>
</head>
<body>
<main>
  <h1>Heirloom admin</h1>
  <div class="muted" id="stats"></div>
  <div id="msg" class="muted"></div>

  <section id="login" class="card">
    <div class="row">
      <input id="token" type="password" placeholder="Admin token" autocomplete="current-password" size="40">
      <button class="primary" id="enter">Enter</button>
    </div>
    <p class="muted">The token is the ADMIN_TOKEN secret of the Worker. It stays in this tab only.</p>
  </section>

  <div id="app" class="hidden">
    <h2>Players</h2>
    <div class="row">
      <input id="q" placeholder="Search id, family code or nickname" size="34">
      <button id="search">Search</button>
      <button id="prev">‹ Prev</button><button id="next">Next ›</button>
      <button id="logout">Log out</button>
    </div>
    <div class="wrap"><table>
      <thead><tr><th>Install id</th><th>Family code</th><th>Nickname</th><th>Last seen</th><th>Gen</th><th>Save</th><th>Owned (app)</th><th>Granted</th><th></th></tr></thead>
      <tbody id="players"></tbody>
    </table></div>

    <h2>Gift codes</h2>
    <div class="card">
      <div class="row">
        <input id="g-code" placeholder="Code (empty = random)" size="22">
        <input id="g-uses" type="number" min="1" value="1" size="6" title="Max uses">
        <input id="g-days" type="number" min="1" placeholder="Days valid (empty = forever)" size="12">
        <input id="g-note" placeholder="Note (who it is for)" size="24">
      </div>
      <div class="row" id="g-grants"></div>
      <div class="row"><button class="primary" id="g-create">Create gift code</button></div>
    </div>
    <div class="wrap"><table>
      <thead><tr><th>Code</th><th>Grants</th><th>Used</th><th>Expires</th><th>Note</th><th></th></tr></thead>
      <tbody id="gifts"></tbody>
    </table></div>
  </div>
</main>
<script nonce="${nonce}">
(() => {
  const GRANTABLE = ${JSON.stringify(grantable)};
  const LABELS = ${JSON.stringify(labels)};
  const $ = (id) => document.getElementById(id);
  let token = sessionStorage.getItem('hlm-admin') || '';
  let offset = 0;

  const el = (tag, text, cls) => { const e = document.createElement(tag); if (text !== undefined && text !== null) e.textContent = String(text); if (cls) e.className = cls; return e; };
  const when = (ms) => ms ? new Date(ms).toISOString().slice(0, 16).replace('T', ' ') : '–';
  const say = (t) => { $('msg').textContent = t || ''; };

  async function api(path, opts = {}) {
    const res = await fetch('/admin/api' + path, { ...opts, headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' } });
    const body = await res.json().catch(() => ({}));
    if (res.status === 401) { logout(); throw new Error('Wrong token'); }
    if (!res.ok) throw new Error(body.error || ('HTTP ' + res.status));
    return body;
  }

  function grantBoxes(container, checked, prefix) {
    container.textContent = '';
    for (const g of GRANTABLE) {
      const lab = el('label');
      const box = el('input'); box.type = 'checkbox'; box.value = g; box.checked = checked.includes(g); box.name = prefix;
      lab.append(box, el('span', LABELS[g] || g)); lab.title = g;
      container.append(lab);
    }
  }
  const picked = (container) => [...container.querySelectorAll('input[type=checkbox]')].filter((b) => b.checked).map((b) => b.value);

  async function loadStats() {
    const s = await api('/stats');
    $('stats').textContent = s.players + ' players · ' + s.dailyToday + ' Daily entries today (' + s.today + ')';
  }

  async function loadPlayers() {
    const q = encodeURIComponent($('q').value.trim());
    const { players } = await api('/players?q=' + q + '&offset=' + offset);
    const tb = $('players'); tb.textContent = '';
    if (!players.length) { const tr = el('tr'); const td = el('td', 'No players here.', 'muted'); td.colSpan = 9; tr.append(td); tb.append(tr); }
    for (const p of players) {
      const tr = el('tr');
      const idCell = el('td'); idCell.append(el('code', p.id.slice(0, 10) + '…')); idCell.title = p.id;
      const grantsCell = el('td', undefined, 'grants'); grantBoxes(grantsCell, p.grants, 'p');
      const actions = el('td', undefined, 'actions');
      const save = el('button', 'Save grants', 'primary');
      save.onclick = () => run(async () => { await api('/players/' + p.id, { method: 'POST', body: JSON.stringify({ grants: picked(grantsCell) }) }); say('Grants saved for ' + p.code + '. The app picks them up on its next sync.'); });
      const nick = el('button', 'Clear nickname');
      nick.onclick = () => run(async () => { await api('/players/' + p.id, { method: 'POST', body: JSON.stringify({ clearNickname: true }) }); await loadPlayers(); });
      const del = el('button', 'Delete', 'bad');
      del.onclick = () => { if (confirm('Delete ' + p.code + ' and its save for good?')) run(async () => { await api('/players/' + p.id, { method: 'DELETE' }); await refresh(); }); };
      actions.append(save, nick, del);
      tr.append(idCell, el('td', p.code), el('td', p.nickname || '–'), el('td', when(p.lastSeen)), el('td', p.generation),
        el('td', p.saveSize ? Math.round(p.saveSize / 1024) + ' KB · ' + when(p.savedAt) : '–'), el('td', (p.packs || []).map((x) => LABELS[x] || x).join(', ') || '–'), grantsCell, actions);
      tb.append(tr);
    }
    $('prev').disabled = offset === 0; $('next').disabled = players.length < 50;
  }

  async function loadGifts() {
    const { gifts } = await api('/gifts');
    const tb = $('gifts'); tb.textContent = '';
    for (const g of gifts) {
      const tr = el('tr');
      const del = el('button', 'Delete', 'bad');
      del.onclick = () => { if (confirm('Delete gift code ' + g.code + '? Grants already given stay.')) run(async () => { await api('/gifts/' + encodeURIComponent(g.code), { method: 'DELETE' }); await loadGifts(); }); };
      const td = el('td'); td.append(del);
      tr.append(el('td', g.code), el('td', g.grants.map((x) => LABELS[x] || x).join(', ')), el('td', g.uses + ' / ' + g.maxUses), el('td', g.expiresAt ? when(g.expiresAt) : 'never'), el('td', g.note || ''), td);
      tb.append(tr);
    }
  }

  async function run(fn) { try { say(''); await fn(); } catch (e) { say(e.message); } }
  async function refresh() { await loadStats(); await loadPlayers(); await loadGifts(); }

  function logout() { token = ''; sessionStorage.removeItem('hlm-admin'); $('app').classList.add('hidden'); $('login').classList.remove('hidden'); }
  async function enter() {
    token = $('token').value.trim() || token;
    if (!token) return;
    try { await refresh(); sessionStorage.setItem('hlm-admin', token); $('login').classList.add('hidden'); $('app').classList.remove('hidden'); say(''); }
    catch (e) { say(e.message); }
  }

  grantBoxes($('g-grants'), [], 'g');
  $('enter').onclick = enter;
  $('token').onkeydown = (e) => { if (e.key === 'Enter') enter(); };
  $('logout').onclick = logout;
  $('search').onclick = () => run(async () => { offset = 0; await loadPlayers(); });
  $('q').onkeydown = (e) => { if (e.key === 'Enter') $('search').click(); };
  $('prev').onclick = () => run(async () => { offset = Math.max(0, offset - 50); await loadPlayers(); });
  $('next').onclick = () => run(async () => { offset += 50; await loadPlayers(); });
  $('g-create').onclick = () => run(async () => {
    const body = { code: $('g-code').value.trim(), grants: picked($('g-grants')), maxUses: Number($('g-uses').value || 1), days: $('g-days').value ? Number($('g-days').value) : null, note: $('g-note').value.trim() };
    const r = await api('/gifts', { method: 'POST', body: JSON.stringify(body) });
    say('Created ' + r.code); $('g-code').value = ''; await loadGifts();
  });
  if (token) enter();
})();
</script>
</body>
</html>`;
}
