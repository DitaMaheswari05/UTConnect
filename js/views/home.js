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
const jwb = u =>
  `<div class=row style="margin-top:8px"><button class="btn f" onclick="event.stopPropagation();jawab('${u.id}',true)">✓ Terima</button><button class="btn ghost f" onclick="event.stopPropagation();jawab('${u.id}',false)">✕ Tolak</button></div>`;
const stTag = u =>
  u.masuk
    ? '<span class=tag>Ingin connect</span>'
    : u.st == 'ok'
      ? '<span class=tag>✓ Terhubung</span>'
      : u.st
        ? '<span class=tag>Menunggu</span>'
        : '';
const act = u => {
  const s = u.st;
  if (u.masuk) return jwb(u);
  return s == 'ok'
    ? `<button class="btn y w" onclick="event.stopPropagation();chat('c${u.id}')">💬 Mulai Chat</button>`
    : s
      ? `<button class="btn w" disabled>⏳ Menunggu persetujuan…</button>`
      : `<button class="btn w" onclick="event.stopPropagation();conn('${u.id}')">🤝 Kirim Permintaan Connect</button>`;
};
V.home = () => {
  const r = S.nr,
    hit = r && r.t == 'ok' ? r.id : 0,
    L = S.people.filter(u => !hit || u.id == hit),
    M = S.people.filter(u => u.masuk);
  const reqs = M.length
    ? `<div class="card lock"><b>🤝 Permintaan Connect (${M.length})</b><div class=m>Nama dan chat terbuka untuk kedua pihak setelah kamu menerima.</div>${M.map(u => `<div class=card onclick="ov('u${u.id}')" style="cursor:pointer;margin:8px 0 0"><div class=row>${av(u)}<div class=f><h3>${u.n}</h3><div class=m>${u.p} · ${u.f} · Sem ${u.s}</div><div class=m>📍 ${near(u)}</div></div></div>${jwb(u)}</div>`).join('')}</div>`
    : '';
  const msg = !r
    ? ''
    : r.t == 'ok'
      ? '<div class="card lock">✓ Mahasiswa ditemukan. Marker-nya disorot di peta.</div>'
      : r.t == 'short'
        ? `<p class=m>Masukkan 9 digit NIM lengkap (${(S.nq || '').length}/9).</p>`
        : r.t == 'limit'
          ? '<div class="card lock"><b>Terlalu banyak pencarian</b><div class=m>Coba lagi nanti.</div></div>'
          : r.t == 'self'
            ? '<div class="card lock">Itu NIM kamu sendiri 🙂</div>'
            : '<div class="card lock"><b>NIM tidak ditemukan</b><div class=m>Periksa kembali 9 digit NIM yang kamu ketik.</div></div>';
  const box = `<div class=card><label for=nq>🔎 Cari mahasiswa berdasarkan NIM</label><div class=sr><input id=nq inputmode=numeric maxlength=9 placeholder="9 digit NIM, mis. 049100101" value="${S.nq || ''}" oninput="S.nq=this.value.replace(/\\D/g,'')" onkeydown="if(event.key=='Enter')nimSearch()"><button class=btn onclick="nimSearch()">Cari</button>${S.nq || r ? '<button class="btn ghost" onclick="nimClear()" aria-label="Hapus pencarian">✕</button>' : ''}</div><div class=m style="margin-top:8px">Contoh NIM demo: ${DEMO_NIM.map(
    n => `<span class=chip onclick="S.nq='${n}';nimSearch()">${n}</span>`,
  ).join(
      '',
    )}</div><div class=m>🔒 NIM harus diketik lengkap; hasil hanya menampilkan NIM yang disamarkan.</div></div>${msg}`;
  return `<h2>Mahasiswa di Sekitarmu</h2>${reqs}${box}<div class=g2><div>${mapH(
    meMk() +
      S.people.map(u => {
        const [x, y] = xy(u.pos);
        return `<button class="mk ${u.st == 'ok' ? 'ok' : ''} ${hit ? (u.id == hit ? 'hit' : 'dim') : ''}" style="left:${x}%;top:${y}%" onclick="ov('u${u.id}')">${u.i}</button>`;
      }).join(''),
  )}<p class=m>🔒 Posisi marker diacak ±300m. Alamat tidak pernah ditampilkan.</p></div><div>${L.map(
    u => {
      const s = u.st;
      return `<div class="card" onclick="ov('u${u.id}')" style="cursor:pointer"><div class=row>${av(u)}<div class=f><h3>${u.n}</h3><div class=m>${u.p} · ${u.f} · Sem ${u.s}</div>${hit ? `<div class=m>${mnim(u)}</div>` : ''}<div class=m>📍 ${near(u)}</div></div>${stTag(u)}</div>${hit || s == 'ok' ? act(u) : ''}</div>`;
    },
  ).join('')}</div></div>`;
};
