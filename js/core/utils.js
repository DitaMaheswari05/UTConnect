const hue = id =>
  `linear-gradient(135deg,hsl(${(id * 47) % 360} 60% 50%),hsl(${(id * 47 + 60) % 360} 70% 40%))`;
const xy = p => [((p.lng - 107.58) / 0.07) * 100, ((-6.89 - p.lat) / 0.06) * 100];
const fmt = d =>
  d < 1
    ? Math.max(100, Math.round(d * 10) * 100) + 'm'
    : (Math.round(d * 10) / 10).toFixed(1) + 'km';
const near = u => '~' + fmt(u.km) + ' dari kamu';
const esc = s =>
  String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const toast = m => {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = m;
  document.body.append(t);
  setTimeout(() => t.remove(), 2200);
};
const av = (u, big) =>
  `<div class="av ${u.st == 'ok' ? 'u' : ''} ${big ? 'big' : ''}"><div class=ph style="background:${hue(u.id)}"></div><span>${u.i}</span></div>`;
const un = id =>
  id == (S.me || {}).id ? S.me.nm : (S.dir.find(x => x.id == id) || { n: 'Mahasiswa' }).n;
async function muat() {
  [S.people, S.dir] = await Promise.all([API.orang(), API.direktori()]);
  R();
}
