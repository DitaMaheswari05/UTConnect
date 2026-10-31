const hue = id => {
  const h = parseInt(String(id).slice(0, 6), 16) * 47;
  return `linear-gradient(135deg,hsl(${h % 360} 60% 50%),hsl(${(h + 60) % 360} 70% 40%))`;
};
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
const lalu = ts => {
  const m = Math.floor((Date.now() - new Date(ts)) / 6e4),
    j = Math.floor(m / 60),
    h = Math.floor(j / 24);
  if (m < 1) return 'baru saja';
  if (m < 60) return m + ' menit lalu';
  if (j < 24) return j + ' jam lalu';
  return h == 1 ? 'kemarin' : h + ' hari lalu';
};
async function muat() {
  [S.people, S.dir, S.forum] = await Promise.all([API.orang(), API.direktori(), API.forum()]);
  R();
}
