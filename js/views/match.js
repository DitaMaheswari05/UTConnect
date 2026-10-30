const sel = (l, key, arr) =>
  `<div class=f><label>${l}</label><select onchange="S.f.${key}=this.value;R()"><option value="">Semua</option>${arr.map(x => `<option ${S.f[key] == x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>`;
V.match = () => {
  const f = S.f,
    n = Object.values(f).filter(Boolean).length;
  const rs = S.people.map(u => {
    let h = 0;
    if (f.mk && u.mk.includes(f.mk)) h++;
    if (f.tp && u.tp.includes(f.tp)) h++;
    if (f.mn && u.mn.includes(f.mn)) h++;
    if (f.wk && u.wk.includes(f.wk)) h++;
    return { u, p: n ? Math.round((h / n) * 100) : 0, d: u.km };
  })
    .filter(x => !n || x.p > 0)
    .sort((a, b) => b.p - a.p || a.d - b.d);
  return `<h2>Academic Matching</h2><div class=card><div class=row>${sel('Mata kuliah', 'mk', MK)}${sel('Topik sulit', 'tp', TP)}</div><div class=row>${sel('Minat', 'mn', MN)}${sel('Waktu', 'wk', WK)}</div></div><p class=m>${n ? `${rs.length} teman belajar cocok, diurutkan otomatis` : 'Pilih kriteria di atas untuk mencocokkan otomatis'}</p><div class=g2 style="display:block">${rs.map(({ u, p }) => `<div class=card onclick="ov('u${u.id}')" style="cursor:pointer"><div class=row>${av(u)}<div class=f><h3>${u.n} <span class=m>· ${u.p}</span></h3><div class=m>📍 ${near(u)}</div>${u.st == 'ok' ? '<span class=tag>✓ Terhubung</span>' : u.st ? '<span class=tag>Menunggu</span>' : ''}</div>${n ? `<b style="color:var(--a)">${p}%</b>` : ''}</div>${n ? `<div class=bar style="margin:8px 0"><i style="width:${p}%"></i></div>` : ''}${u.mk.map(x => `<span class=tag>${x}</span>`).join('')}${u.wk.map(x => `<span class="tag b">${x}</span>`).join('')}${act(u)}</div>`).join('')}</div>`;
};
