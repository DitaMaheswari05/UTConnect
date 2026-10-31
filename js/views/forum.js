const mkFor = () => {
  const m = S.me || {};
  return PM[m.pr] || PF[m.fk] || MK;
};
V.forum = () =>
  `<h2>Peer Help & Forum</h2><div class=card><textarea id=px rows=2 placeholder='Mis. "Butuh bantuan untuk MATK4213 Bab 2" atau "Bisa bantu Statistika"'></textarea><div class=row><select id=pt style="margin:0"><option>Butuh bantuan</option><option>Bisa bantu</option></select><select id=pm style="margin:0">${mkFor()
    .map(x => `<option>${x}</option>`)
    .join(
      '',
    )}</select><button class=btn onclick="post()">Posting</button></div></div>${S.forum.map(p => `<div class=card><div class=row><div class=f><b>${esc(un(p.by))}</b> <span class=m>· ${lalu(p.ts)}</span></div><span class=tag>${esc(p.t)}</span></div><p style="margin:6px 0">${esc(p.x)}</p><span class="tag b">${esc(p.mk)}</span><div class=row style="margin-top:8px"><span class=m>🙋 ${p.h} orang menawarkan bantuan</span><button class="btn s ${p.off ? 'y' : ''}" onclick="tawar('${p.id}')">${p.off ? '✓ Ditawarkan' : '🙋 Tawarkan Bantuan'}</button></div></div>`).join('')}`;
async function post() {
  const i = $('#px'),
    x = i.value.trim();
  if (!x) return toast('Tulis isi postingan');
  try {
    await API.postForum($('#pm').value, $('#pt').value, x);
    S.forum = await API.forum();
    R();
    toast('Terposting ✓');
  } catch (e) {
    toast(e.message);
  }
}
async function tawar(id) {
  const p = S.forum.find(x => x.id == id);
  try {
    await API.tawarkan(id, !p.off);
    S.forum = await API.forum();
    R();
    toast(p.off ? 'Dibatalkan' : 'Penawaran bantuan dikirim');
  } catch (e) {
    toast(e.message);
  }
}
