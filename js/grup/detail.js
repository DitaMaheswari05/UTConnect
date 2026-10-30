function detail(g) {
  const m = mem(g),
    on = g.type == 'online',
    A = adm(g);
  let h = `<div class=dh><button class=ib2 data-a=back>←</button><div style=flex:1><h2>${H(g.name)}</h2><div class=mu>${H(g.course)} · <span class="bd ${on ? '' : 'off'}">${g.type}</span> · 👥 ${g.members.length}/${g.cap}</div></div>${m ? '<button class=ib2 data-a=menu>⋯</button>' : ''}</div>
<div class=box><p>${H(g.desc || 'Belum ada deskripsi.')}</p><p><b>Tujuan:</b> ${H(g.goal || '—')}</p><p><b>Jadwal:</b> ${g.day}, ${tm(g.start)}–${tm(g.end)} WIB</p><p><b>${on ? 'Platform' : 'Lokasi'}:</b> ${H(on ? g.platform : g.loc + (g.addr ? ' — ' + g.addr : ''))}${on && m && ok(g.link) ? ` · <a href="${H(g.link)}" target=_blank rel=noopener>Buka link</a>` : ''}</p><p><b>Kapasitas:</b> ${g.members.length}/${g.cap}</p><p><b>Admin:</b> ${H(
    g.members
      .filter(x => x.r != 'member')
      .map(x => un(x.id))
      .join(', '),
  )}</p>${g.rules ? `<p><b>Aturan:</b> ${H(g.rules)}</p>` : ''}</div>`;
  if (!m)
    return (
      h +
      em('🔒 Konten khusus anggota', 'Gabung untuk melihat chat, agenda, materi, dan anggota.') +
      btn(g)
    );
  h += `<div class=tabs>${[
    ['chat', 'Chat'],
    ['agenda', 'Agenda'],
    ['materi', 'Materi'],
    ['anggota', 'Anggota'],
  ]
    .map(
      ([k, l]) => `<button class="${KV.tab == k ? 'on' : ''}" data-a=tab data-t=${k}>${l}</button>`,
    )
    .join('')}</div>`;
  return h + { chat: kChat, agenda, materi, anggota }[KV.tab](g, A);
}
function inner() {
  me = (S.me || {}).id;
  if (!KS) KS = seed();
  if (KV.v == 'd' && !KG(KV.id)) KV.v = 'list';
  return KV.v == 'list' ? list() : detail(KG(KV.id));
}
function render() {
  const e = document.getElementById('kb');
  if (e) e.innerHTML = inner();
}
