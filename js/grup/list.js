const place = g => (g.type == 'online' ? g.platform : g.loc);
function btn(g) {
  if (mem(g))
    return `<div class=r2><button class=kbtn data-a=open data-id=${g.id}>Buka Grup</button><button class="kbtn red" data-a=leave data-id=${g.id}>Keluar Grup</button></div>`;
  const i = `data-id=${g.id}`;
  if (g.members.length >= g.cap) return `<button class=kbtn disabled>Penuh</button>`;
  if (g.join == 'private')
    return g.invited.includes(me)
      ? `<button class=kbtn data-a=accinv ${i}>Terima Undangan</button>`
      : `<button class=kbtn disabled>Grup Privat</button>`;
  if (g.join == 'approval')
    return g.reqs.includes(me)
      ? `<button class=kbtn disabled>Permintaan Terkirim</button>`
      : `<button class=kbtn data-a=req ${i}>Minta Bergabung</button>`;
  return `<button class=kbtn data-a=join ${i}>Gabung Grup</button>`;
}
function card(g) {
  const on = g.type == 'online',
    pc = Math.round((g.members.length / g.cap) * 100);
  return `<div class=kcard style="--kc:${on ? 'var(--grn)' : 'var(--red)'}"><div class=khd data-a=open data-id=${g.id}><div class=ic>${on ? '📶' : '☕'}</div><div><div class=nm>${H(g.name)}${mem(g) ? '<span class="bd j">✓ Joined</span>' : ''}${g.join == 'private' ? '<span class="bd ad">🔒 Privat</span>' : ''}</div><div class=mu>🎓 ${H(g.course)} <span class="bd ${on ? '' : 'off'}">${g.type}</span></div></div></div>
<div class=tiles><div class=tile>👥<br>Anggota<b>${g.members.length}/${g.cap}</b></div><div class=tile>${on ? '🎥<br>Platform' : '📍<br>Lokasi'}<b>${H(place(g))}</b></div><div class=tile>🕐<br>Jadwal<b>${g.day}, ${tm(g.start)} WIB</b></div></div><div class=kbar><i style="width:${pc}%"></i></div>${btn(g)}</div>`;
}
function filt() {
  const q = KV.q.toLowerCase();
  let a = KS.groups.filter(
    g =>
      (KV.ty == 'all' || g.type == KV.ty) &&
      (!KV.co || g.course == KV.co) &&
      (KV.mm == 'all' || (KV.mm == 'in') == !!mem(g)) &&
      (!q || (g.name + g.course).toLowerCase().includes(q)),
  );
  if (KV.so == 'az') a.sort((x, y) => x.name.localeCompare(y.name));
  if (KV.so == 'mem') a.sort((x, y) => y.members.length - x.members.length);
  if (KV.so == 'left') a.sort((x, y) => y.cap - y.members.length - (x.cap - x.members.length));
  if (KV.so == 'new') a.reverse();
  return a;
}
const cards = () => {
  const a = filt();
  return a.length
    ? a.map(card).join('')
    : em('Tidak ada kelompok ditemukan.', 'Ubah filter atau buat kelompok baru dengan tombol +.');
};
function list() {
  const un = KS.nf.filter(n => !n.r).length,
    cs = [...new Set(KS.groups.map(g => g.course))],
    sel = (v, o) =>
      o.map(([k, l]) => `<option value="${k}" ${v == k ? 'selected' : ''}>${l}</option>`).join('');
  return `<div class=top><div><h1>Kelompok Belajar</h1><div class=sub>Gabung atau buat grup belajar online/offline</div></div><div><button class="ib bl" data-a=bell>🔔${un ? `<b>${un}</b>` : ''}</button><button class=ib data-a=plus>+</button></div></div>
<div class=chips>${[
    ['all', 'Semua'],
    ['online', 'Online'],
    ['offline', 'Offline'],
  ]
    .map(
      ([k, l]) =>
        `<button class="kchip ${KV.ty == k ? 'on' : ''}" data-a=ty data-k=${k}>${l}</button>`,
    )
    .join('')}</div>
<input id=kq placeholder="🔍 Cari kelompok atau mata kuliah" value="${H(KV.q)}" style="margin-bottom:8px"><div class=fl>
<select data-c=co>${sel(KV.co, [['', 'Semua mata kuliah'], ...cs.map(c => [c, c])])}</select><select data-c=mm>${sel(
    KV.mm,
    [
      ['all', 'Semua status'],
      ['in', 'Bergabung'],
      ['out', 'Belum bergabung'],
    ],
  )}</select><select data-c=so>${sel(KV.so, [
    ['new', 'Terbaru'],
    ['az', 'Nama A–Z'],
    ['mem', 'Anggota terbanyak'],
    ['left', 'Slot tersisa'],
  ])}</select></div><div id=kcards>${cards()}</div>`;
}
