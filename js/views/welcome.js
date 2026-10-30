function welcome() {
  const r = S.reg;
  if (S.step == 0)
    return `<div class=wel><div class=logo>UT<b style="color:var(--y)">Connect</b></div><h1>Kamu tidak belajar sendirian.</h1><p class=m>Platform peer learning & academic support untuk mahasiswa Universitas Terbuka. Temukan teman belajar di sekitarmu, tanpa membuka alamat rumahmu.</p><button class=btn onclick="S.step=1;R()">🎓 Daftar sebagai Mahasiswa UT</button><button class="btn ghost" onclick="S.step=3;R()">Sudah punya akun? Masuk</button><button class="btn ghost" onclick="S.role='guest';S.tab='info';R()">Lanjut sebagai Guest (Info Hub saja)</button><p class=m><a href=# onclick="S.priv=1;R();return false" style="color:var(--a)">Bagaimana privasimu dijaga?</a> · <a href=# onclick="ov('guide');return false" style="color:var(--a)">❓ Panduan penggunaan</a></p><p class=m>Alur: Daftar → Pin lokasi → Peta → Connect → Chat</p></div>`;
  if (S.step == 3)
    return `<div class="wel tl"><h2>Masuk</h2><p class=m>Gunakan NIM dan kata sandi yang kamu buat saat daftar.</p><label>NIM UT</label><input inputmode=numeric maxlength=9 value="${esc(S.login.nim || '')}" oninput="S.login.nim=this.value" placeholder="049123456"><label>Kata sandi</label><input type=password value="${esc(S.login.pw || '')}" oninput="S.login.pw=this.value" onkeydown="if(event.key=='Enter')masuk()"><button class=btn style="width:100%" onclick="masuk()">Masuk</button><button class="btn ghost w" onclick="S.step=0;R()">← Kembali</button></div>`;
  if (S.step == 1)
    return `<div class="wel tl"><h2>① Registrasi</h2><p class=m>Langkah 1 dari 2 · Verifikasi mahasiswa UT</p><label>Nama lengkap</label><input value="${esc(r.nm || '')}" oninput="S.reg.nm=this.value" placeholder="mis. Andi Wijaya"><label>NIM UT (9 digit, untuk verifikasi)</label><input inputmode=numeric maxlength=9 value="${esc(r.nim || '')}" oninput="S.reg.nim=this.value" placeholder="049123456"><label>Kata sandi (min. 8 karakter)</label><input type=password value="${esc(r.pw || '')}" oninput="S.reg.pw=this.value"><label>Fakultas</label><select onchange="S.reg.fk=this.value;S.reg.pr='';R()"><option value="">Pilih fakultas</option>${Object.keys(
      FP,
    )
      .map(f => `<option ${r.fk == f ? 'selected' : ''}>${f}</option>`)
      .join(
        '',
      )}</select><label>Program studi</label><select onchange="S.reg.pr=this.value;R()"><option value="">Pilih prodi</option>${(FP[r.fk] || []).map(f => `<option ${r.pr == f ? 'selected' : ''}>${f}</option>`).join('')}</select><label>Semester</label><select onchange="S.reg.sm=this.value">${[1, 2, 3, 4, 5, 6, 7, 8].map(s => `<option ${r.sm == s ? 'selected' : ''}>${s}</option>`).join('')}</select><button class=btn style="width:100%" onclick="next1()">Lanjut: Tandai Lokasi →</button><button class="btn ghost w" onclick="S.reg={nm:'Andi Wijaya',nim:'049123456',pw:'demo1234',fk:'FEB',pr:'Manajemen',sm:'4'};R()">Isi data demo</button><button class="btn ghost w" onclick="S.step=0;R()">← Kembali</button></div>`;
  return `<div class="wel tl"><h2>② Tagging Alamat</h2><p class=m>Ketuk peta untuk menaruh pin di dekat rumahmu. Koordinat disimpan, <b>alamat lengkap tidak pernah ditampilkan</b>.</p>${mapH(meMk(), 1)}<button class="btn ghost s" onclick="S.pin={lat:-6.9175,lng:107.6191};R()">📍 Gunakan lokasi saat ini (simulasi GPS)</button><p class=m>${S.pin ? `Lat ${S.pin.lat.toFixed(4)}, Lng ${S.pin.lng.toFixed(4)}` : 'Belum ada pin'}</p><div class="card lock"><b>🔒 Disclaimer privasi</b><p class=m style="margin:4px 0">Mahasiswa lain hanya melihat jarak estimasi (mis. "~1.2km dari kamu"), inisial, prodi, dan foto blur. Detail & chat baru terbuka setelah kalian saling connect.</p><label><input type=checkbox style="width:auto;margin-right:6px" ${r.ok ? 'checked' : ''} onchange="S.reg.ok=this.checked">Saya mengerti dan setuju</label></div><button class=btn style="width:100%" onclick="fin()">${S.me ? 'Simpan Pin ✓' : 'Verifikasi & Lihat Peta ✓'}</button><button class="btn ghost w" onclick="balik()">← Kembali</button></div>`;
}
async function mulai(m) {
  S.me = m;
  S.pin = m.pin;
  S.show = m.show;
  S.role = 'mhs';
  S.tab = 'home';
  S.reg = {};
  S.login = {};
  await muat();
}
async function next1() {
  const r = S.reg;
  if (!r.nm || !/^\d{9}$/.test(r.nim || '') || !r.fk || !r.pr)
    return toast('Lengkapi data, NIM harus 9 digit');
  if ((r.pw || '').length < 8) return toast('Kata sandi minimal 8 karakter');
  const e = await API.verifikasi(r);
  if (e) return toast(e);
  r.sm = r.sm || '1';
  S.step = 2;
  R();
}
async function fin() {
  if (!S.pin) return toast('Taruh pin lokasi dulu');
  if (!S.reg.ok) return toast('Centang persetujuan privasi');
  try {
    if (S.me) {
      await API.setPin(S.pin);
      S.me.pin = S.pin;
      S.role = 'mhs';
      S.reg = {};
      await muat();
      return toast('Pin tersimpan ✓');
    }
    await mulai(await API.daftar({ ...S.reg, pin: S.pin }));
    toast('NIM terverifikasi ✓ Selamat datang!');
  } catch (e) {
    toast(e.message);
  }
}
function balik() {
  if (!S.me) {
    S.step = 1;
    return R();
  }
  S.pin = S.me.pin;
  S.role = 'mhs';
  S.reg = {};
  R();
}
async function masuk() {
  try {
    await mulai(await API.masuk(S.login.nim, S.login.pw));
    toast('Selamat datang kembali!');
  } catch (e) {
    toast(e.message);
  }
}
