V.info = () => {
  const g = S.role == 'guest',
    cs = ['Semua', 'Lomba', 'Loker', 'Seminar', 'Tips', 'UKM', 'HIMA'],
    L = S.info.filter(i => i.s == S.it && (S.ic == 'Semua' || i.c == S.ic));
  return `<h2>${S.it == 'ut' ? 'Wara-Wara UT' : 'Berita Umum'}</h2>${g ? `<div class="card lock row"><div class=f><b>🔒 Fitur khusus mahasiswa UT</b><div class=m>Di Sekitarmu, Matching, Forum & Grup butuh verifikasi NIM.</div></div><button class="btn s" onclick="S.role=null;S.step=1;R()">Daftar</button></div>` : ''}<div class=row style="margin-bottom:10px"><button class="btn ${S.it == 'ut' ? '' : 'ghost'} f" onclick="S.it='ut';S.ic='Semua';R()">Info Hub UT</button><button class="btn ${S.it == 'um' ? '' : 'ghost'} f" onclick="S.it='um';S.ic='Semua';R()">Berita Umum</button></div>${S.it == 'ut' ? `<div>${cs.map(c => `<span class="chip ${S.ic == c ? 'on' : ''}" onclick="S.ic='${c}';R()">${c}</span>`).join('')}</div>` : ''}${g ? '' : `<div class=card><input id=it placeholder="Judul info / berita…"><button class="btn s" onclick="postI()">+ Bagikan</button></div>`}${L.map(i => `<div class=card><span class=tag>${esc(i.c)}</span><span class="tag b">${esc(i.r)}</span><h3 style="margin-top:6px">${esc(i.t)}</h3><div class=m>${esc(i.x)}</div><div class=m style="margin-top:4px">oleh ${esc(i.by)} · ${lalu(i.ts)}</div></div>`).join('') || '<p class=m>Belum ada info.</p>'}`;
};
async function postI() {
  const t = $('#it').value.trim();
  if (!t) return toast('Isi judul');
  try {
    await API.postInfo(S.it, S.ic == 'Semua' ? 'Tips' : S.ic, t, 'Dibagikan oleh mahasiswa.');
    S.info = await API.info();
    R();
    toast('Dibagikan ✓');
  } catch (e) {
    toast(e.message);
  }
}
