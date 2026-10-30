const mkFor = () => {
  const m = S.me || {};
  return PM[m.pr] || PF[m.fk] || MK;
};
V.forum = () =>
  `<h2>Peer Help & Forum</h2><div class=card><textarea id=px rows=2 placeholder='Mis. "Butuh bantuan untuk MATK4213 Bab 2" atau "Bisa bantu Statistika"'></textarea><div class=row><select id=pt style="margin:0"><option>Butuh bantuan</option><option>Bisa bantu</option></select><select id=pm style="margin:0">${mkFor()
    .map(x => `<option>${x}</option>`)
    .join(
      '',
    )}</select><button class=btn onclick="post()">Posting</button></div></div>${P.map(p => `<div class=card><div class=row><div class=f><b>${esc(un(p.by))}</b> <span class=m>· ${p.w}</span></div><span class=tag>${p.t}</span></div><p style="margin:6px 0">${esc(p.x)}</p><span class="tag b">${p.mk}</span><div class=row style="margin-top:8px"><span class=m>🙋 ${p.h + (S.off[p.id] ? 1 : 0)} orang menawarkan bantuan</span><button class="btn s ${S.off[p.id] ? 'y' : ''}" onclick="S.off['${p.id}']=!S.off['${p.id}'];R();toast('${S.off[p.id] ? 'Dibatalkan' : 'Penawaran bantuan dikirim'}')">${S.off[p.id] ? '✓ Ditawarkan' : '🙋 Tawarkan Bantuan'}</button></div></div>`).join('')}`;
function post() {
  const x = $('#px').value.trim();
  if (!x) return toast('Tulis isi postingan');
  P.unshift({
    id: uid(),
    by: S.me.id,
    mk: $('#pm').value,
    t: $('#pt').value,
    x,
    h: 0,
    w: 'baru saja',
  });
  R();
  toast('Terposting ✓');
}
