V.info = () => {
  const g = S.role == 'guest',
    cs = ['Semua', 'Lomba', 'Loker', 'Seminar', 'Tips', 'UKM', 'HIMA'],
    L = I.filter(i => i.s == S.it && (S.ic == 'Semua' || i.c == S.ic));
  return `<h2>${S.it == 'ut' ? 'Wara-Wara UT' : 'Berita Umum'}</h2>${g ? `<div class="card lock row"><div class=f><b>🔒 Fitur khusus mahasiswa UT</b><div class=m>Di Sekitarmu, Matching, Forum & Grup butuh verifikasi NIM.</div></div><button class="btn s" onclick="S.role=null;S.step=1;R()">Daftar</button></div>` : ''}<div class=row style="margin-bottom:10px"><button class="btn ${S.it == 'ut' ? '' : 'ghost'} f" onclick="S.it='ut';S.ic='Semua';R()">Info Hub UT</button><button class="btn ${S.it == 'um' ? '' : 'ghost'} f" onclick="S.it='um';S.ic='Semua';R()">Berita Umum</button></div>${S.it == 'ut' ? `<div>${cs.map(c => `<span class="chip ${S.ic == c ? 'on' : ''}" onclick="S.ic='${c}';R()">${c}</span>`).join('')}</div>` : ''}${g ? '' : `<div class=card><input id=it placeholder="Judul info / berita…"><button class="btn s" onclick="postI()">+ Bagikan</button></div>`}${L.map(i => `<div class=card><span class=tag>${i.c}</span><span class="tag b">${i.r}</span><h3 style="margin-top:6px">${i.t}</h3><div class=m>${i.x}</div><div class=m style="margin-top:4px">oleh ${i.by} · ${i.w}</div></div>`).join('') || '<p class=m>Belum ada info.</p>'}`;
};
function postI() {
  const t = $('#it').value.trim();
  if (!t) return toast('Isi judul');
  I.unshift({
    s: S.it,
    c: S.ic == 'Semua' ? 'Tips' : S.ic,
    t,
    by: S.me.nm,
    r: 'Mahasiswa',
    w: 'baru saja',
    x: 'Dibagikan oleh mahasiswa.',
  });
  R();
  toast('Dibagikan ✓');
}
