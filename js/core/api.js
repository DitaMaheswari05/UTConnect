/* Server tiruan. Semua akses data mahasiswa lewat API; ganti isi file ini saat backend siap. */
const API = (() => {
  const KEY_AKUN = 'ut_akun_v1';
  const load = () => {
    try {
      return JSON.parse(localStorage.getItem(KEY_AKUN)) || [];
    } catch (e) {
      return [];
    }
  };
  const simpan = () => {
    try {
      localStorage.setItem(KEY_AKUN, JSON.stringify(akun));
    } catch (e) {}
  };
  let akun = load(),
    sesi = null;
  const semua = () => [...DB_MHS, ...akun],
    lain = () => semua().filter(u => u.id != sesi.id && u.show !== false),
    low = s => String(s || '').trim().toLowerCase(),
    hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
  async function hash(pw, salt) {
    return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + pw)));
  }
  function wajibSesi() {
    if (!sesi) throw new Error('Silakan masuk dulu');
  }
  function jarak(a, b) {
    const r = x => (x * Math.PI) / 180,
      dl = r(b.lat - a.lat),
      dn = r(b.lng - a.lng),
      q = Math.sin(dl / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dn / 2) ** 2;
    return 12742 * Math.asin(Math.sqrt(q));
  }
  const acak = u => ({
    lat: u.lat + (((u.id * 37) % 11) - 5) * 0.0005,
    lng: u.lng + (((u.id * 53) % 11) - 5) * 0.0005,
  });
  const dto = u => {
    const st = sesi.st[u.id],
      pos = acak(u);
    return {
      id: u.id,
      i: u.i,
      n: st == 'ok' ? u.n : u.i.split('').join('.') + '.',
      nim: u.nim.slice(0, 3) + '••••••',
      p: u.p,
      f: u.f,
      s: u.s,
      mk: u.mk,
      tp: u.tp,
      mn: u.mn,
      wk: u.wk,
      st,
      pos,
      km: Math.max(0.1, Math.round(jarak(sesi, pos) * 10) / 10),
    };
  };
  const profil = () => ({
    id: sesi.id,
    nm: sesi.n,
    nim: sesi.nim,
    fk: sesi.f,
    pr: sesi.p,
    sm: sesi.s,
    pin: { lat: sesi.lat, lng: sesi.lng },
    show: sesi.show,
  });
  function cek(r) {
    if (semua().some(u => u.nim == r.nim)) return 'NIM sudah terdaftar, silakan masuk';
    const d = DB_NIM[r.nim];
    if (!d || low(d.nm) != low(r.nm) || d.fk != r.fk || d.pr != r.pr)
      return 'Data tidak cocok dengan data mahasiswa UT';
    return '';
  }
  return {
    async verifikasi(r) {
      return cek(r);
    },
    async daftar(r) {
      const e = cek(r);
      if (e) throw new Error(e);
      if (!r.pin) throw new Error('Taruh pin lokasi dulu');
      if ((r.pw || '').length < 8) throw new Error('Kata sandi minimal 8 karakter');
      const salt = hex(crypto.getRandomValues(new Uint8Array(16))),
        d = DB_NIM[r.nim];
      sesi = {
        id: Math.max(...semua().map(u => u.id)) + 1,
        nim: r.nim,
        n: d.nm,
        i: d.nm
          .split(' ')
          .map(x => x[0])
          .join('')
          .slice(0, 2)
          .toUpperCase(),
        p: d.pr,
        f: d.fk,
        s: +r.sm,
        lat: r.pin.lat,
        lng: r.pin.lng,
        mk: [],
        tp: [],
        mn: [],
        wk: [],
        show: true,
        st: {},
        salt,
        pw: await hash(r.pw, salt),
      };
      akun.push(sesi);
      simpan();
      return profil();
    },
    async masuk(nim, pw) {
      const u = akun.find(x => x.nim == nim);
      if (!u || (await hash(pw || '', u.salt)) != u.pw) throw new Error('NIM atau kata sandi salah');
      sesi = u;
      return profil();
    },
    async keluar() {
      sesi = null;
    },
    async setPin(pin) {
      wajibSesi();
      sesi.lat = pin.lat;
      sesi.lng = pin.lng;
      simpan();
    },
    async setShow(show) {
      wajibSesi();
      sesi.show = show;
      simpan();
    },
    async orang() {
      wajibSesi();
      return lain()
        .map(dto)
        .sort((a, b) => a.km - b.km);
    },
    async direktori() {
      wajibSesi();
      return semua()
        .filter(u => u.id != sesi.id)
        .map(u => {
          const w = u.n.split(' ');
          return { id: u.id, n: w[0] + (w[1] ? ' ' + w[1][0] + '.' : ''), p: u.p };
        });
    },
    async cariNim(q) {
      wajibSesi();
      if (!/^\d{9}$/.test(q)) return { t: 'none' };
      if (q == sesi.nim) return { t: 'self' };
      const u = lain().find(x => x.nim == q);
      return u ? { t: 'ok', id: u.id } : { t: 'none' };
    },
    async connect(id) {
      wajibSesi();
      sesi.st[id] = 'pending';
      simpan();
    },
    /* simulasi pihak lain menyetujui; hilang saat connect sungguhan tersedia */
    async simulasiTerima(id) {
      if (!sesi) return false;
      sesi.st[id] = 'ok';
      simpan();
      return true;
    },
  };
})();
