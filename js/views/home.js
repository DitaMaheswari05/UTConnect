const DEMO_NIM = ['049100101', '049100102', '049100103'];
const mnim = u => 'NIM ' + u.nim;
async function nimSearch() {
  const q = (S.nq || '').replace(/\D/g, '');
  S.nq = q;
  if (!q) S.nr = null;
  else if (q.length < 9) S.nr = { t: 'short' };
  else S.nr = await API.cariNim(q);
  R();
}
function nimClear() {
  S.nq = '';
  S.nr = null;
  R();
}
const act = u => {
  const s = u.st;
  return s == 'ok'
    ? `<button class="btn y w" onclick="event.stopPropagation();chat('c${u.id}')">💬 Mulai Chat</button>`
    : s
      ? `<button class="btn w" disabled>⏳ Menunggu persetujuan…</button>`
      : `<button class="btn w" onclick="event.stopPropagation();conn(${u.id})">🤝 Kirim Permintaan Connect</button>`;
};
V.home = () => {
  const r = S.nr,
    hit = r && r.t == 'ok' ? r.id : 0,
    L = S.people.filter(u => !hit || u.id == hit);
  const msg = !r
    ? ''
    : r.t == 'ok'
      ? '<div class="card lock">✓ Mahasiswa ditemukan. Marker-nya disorot di peta.</div>'
      : r.t == 'short'
        ? `<p class=m>Masukkan 9 digit NIM lengkap (${(S.nq || '').length}/9).</p>`
        : r.t == 'self'
          ? '<div class="card lock">Itu NIM kamu sendiri 🙂</div>'
          : '<div class="card lock"><b>NIM tidak ditemukan</b><div class=m>Periksa kembali 9 digit NIM yang kamu ketik.</div></div>';
  const box = `<div class=card><label for=nq>🔎 Cari mahasiswa berdasarkan NIM</label><div class=sr><input id=nq inputmode=numeric maxlength=9 placeholder="9 digit NIM, mis. 049100101" value="${S.nq || ''}" oninput="S.nq=this.value.replace(/\\D/g,'')" onkeydown="if(event.key=='Enter')nimSearch()"><button class=btn onclick="nimSearch()">Cari</button>${S.nq || r ? '<button class="btn ghost" onclick="nimClear()" aria-label="Hapus pencarian">✕</button>' : ''}</div><div class=m style="margin-top:8px">Contoh NIM demo: ${DEMO_NIM.map(
    n => `<span class=chip onclick="S.nq='${n}';nimSearch()">${n}</span>`,
  ).join(
      '',
    )}</div><div class=m>🔒 NIM harus diketik lengkap; hasil hanya menampilkan NIM yang disamarkan.</div></div>${msg}`;
  return `<h2>Mahasiswa di Sekitarmu</h2>${box}<div class=g2><div>${mapH(
    meMk() +
      S.people.map(u => {
        const [x, y] = xy(u.pos);
        return `<button class="mk ${u.st == 'ok' ? 'ok' : ''} ${hit ? (u.id == hit ? 'hit' : 'dim') : ''}" style="left:${x}%;top:${y}%" onclick="ov('u${u.id}')">${u.i}</button>`;
      }).join(''),
  )}<p class=m>🔒 Posisi marker diacak ±300m. Alamat tidak pernah ditampilkan.</p></div><div>${L.map(
    u => {
      const s = u.st;
      return `<div class="card" onclick="ov('u${u.id}')" style="cursor:pointer"><div class=row>${av(u)}<div class=f><h3>${u.n}</h3><div class=m>${u.p} · ${u.f} · Sem ${u.s}</div>${hit ? `<div class=m>${mnim(u)}</div>` : ''}<div class=m>📍 ${near(u)}</div></div>${s == 'ok' ? '<span class=tag>✓ Terhubung</span>' : s ? '<span class=tag>Menunggu</span>' : ''}</div>${hit || s == 'ok' ? act(u) : ''}</div>`;
    },
  ).join('')}</div></div>`;
};
