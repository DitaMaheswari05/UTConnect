function ovH() {
  const k = S.ov;
  if (k == 'guide') {
    const st = [
      [
        '📝',
        'Daftar & pin lokasi',
        'Daftar dengan NIM UT 9 digit, pilih fakultas, prodi, dan semester, lalu ketuk peta untuk menaruh pin. Alamat lengkap tidak pernah ditampilkan.',
      ],
      [
        '🗺️',
        'Cari teman di Peta',
        'Buka Beranda untuk melihat mahasiswa di sekitarmu. Ketik NIM lengkap (9 digit) di kolom pencarian untuk menemukan mahasiswa tertentu.',
      ],
      [
        '🤝',
        'Matching akademik',
        'Di menu Matching, pilih mata kuliah, topik sulit, minat, dan waktu belajar. Hasil diurutkan otomatis dari yang paling cocok.',
      ],
      [
        '🔗',
        'Connect',
        'Ketuk "Kirim Permintaan Connect". Setelah statusnya Terhubung, nama dan foto mahasiswa terbuka.',
      ],
      [
        '💬',
        'Mulai chat',
        'Jika sudah Terhubung, ketuk "Mulai Chat" di kartu mahasiswa (Beranda atau Matching) atau di profilnya.',
      ],
      [
        '🙋',
        'Forum & Grup',
        'Minta atau tawarkan bantuan di Forum, dan gabung atau buat kelompok belajar di menu Grup.',
      ],
      [
        '📢',
        'Info Hub',
        'Lihat info lomba, seminar, loker, UKM, dan HIMA. Pengguna Guest hanya bisa membuka Info Hub.',
      ],
      [
        '🔒',
        'Privasi',
        'Mahasiswa lain hanya melihat inisial, jarak estimasi, dan foto blur. Kamu bisa menyembunyikan diri dari peta lewat menu Profil.',
      ],
    ];
    return `<div class=ov onclick="if(event.target==this)ov(null)"><div class=sh><h2 style="margin:0 0 4px">❓ Panduan Penggunaan</h2><p class=m style="margin:0 0 14px">Langkah singkat memakai UTConnect.</p>${st.map((s, i) => `<div class=gst><div class=n>${s[0]}</div><div><b>${i + 1}. ${s[1]}</b><span class=m>${s[2]}</span></div></div>`).join('')}<button class="btn w" onclick="ov(null)">Mengerti, tutup</button></div></div>`;
  }
  if (k[0] == 'u') {
    const u = pu(k),
      s = u.st;
    return `<div class=ov onclick="if(event.target==this)ov(null)"><div class=sh><div class=row>${av(u, 1)}<div class=f><h2 style="margin:0">${u.n}</h2><div class=m>${u.p} · ${u.f}</div><div class=m>Semester ${u.s} · 📍 ${near(u)}</div></div></div>${s == 'ok' ? '<p class=m>✓ Terhubung. Detail terbuka, foto jelas.</p>' : '<div class="card lock" style="margin-top:12px">🔒 Nama lengkap, foto, dan chat terbuka setelah mutual connect.</div>'}<b>Mata kuliah</b><div>${u.mk.map(x => `<span class=tag>${x}</span>`).join('')}</div><b>Minat</b><div>${u.mn.map(x => `<span class="tag b">${x}</span>`).join('')}</div><b>Waktu</b><div>${u.wk.map(x => `<span class=tag>${x}</span>`).join('')}</div>${s == 'ok' ? `<button class="btn y w" onclick="chat('c${u.id}')">💬 Kirim Pesan</button>` : s ? '<button class="btn w" disabled>⏳ Menunggu persetujuan…</button>' : `<button class="btn w" onclick="conn(${u.id})">🤝 Kirim Permintaan Connect</button>`}<button class="btn ghost w" onclick="ov(null)">Tutup</button></div></div>`;
  }
  const u = pu(k),
    ms = S.ch[k] || [{ a: pn(k), t: 'Hai! Makasih sudah connect 👋' }];
  return `<div class=ov onclick="if(event.target==this)ov(null)"><div class="sh chat"><div class=hd><div><b>${u.n}</b><div style="font-size:11px;opacity:.8">✓ Terhubung · ${u.p} · Sem ${u.s}</div></div><a onclick="ov(null)" style="cursor:pointer">✕</a></div><div class=msgs>${ms.map(m => `<div class="bb ${m.me ? 'me' : ''}">${m.me || !m.a ? '' : `<small>${esc(m.a)}</small>`}${esc(m.t)}</div>`).join('')}</div><div class=in><input id=ci placeholder="Tulis pesan…" onkeydown="if(event.key=='Enter')send('${k}')"><button class=btn onclick="send('${k}')">Kirim</button></div></div></div>`;
}
