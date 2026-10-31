/* Semua akses data mahasiswa lewat API. Aturan pemakaian ada di supabase/README.md. */
const API = (() => {
  const sb = supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  /* Pin ditahan di browser sampai email dikonfirmasi, karena set_lokasi() butuh sesi login. */
  const KEY_PIN = 'ut_pin_tunda';
  const tundaPin = pin => {
    try {
      localStorage.setItem(KEY_PIN, JSON.stringify(pin));
    } catch (e) {}
  };
  const ambilPin = () => {
    try {
      return JSON.parse(localStorage.getItem(KEY_PIN));
    } catch (e) {
      return null;
    }
  };
  const buangPin = () => {
    try {
      localStorage.removeItem(KEY_PIN);
    } catch (e) {}
  };
  const hasil = ({ data, error }) => {
    if (error) throw new Error(error.message);
    return data;
  };
  let uid = null;
  async function wajibSesi() {
    if (!uid) throw new Error('Silakan masuk dulu');
  }
  const dto = u => ({
    id: u.id,
    i: u.inisial,
    n: u.nama,
    nim: u.nim,
    p: u.prodi,
    f: u.fakultas,
    s: u.semester,
    mk: u.mk,
    tp: u.topik,
    mn: u.minat,
    wk: u.waktu,
    st: u.status || undefined,
    masuk: u.permintaan_masuk,
    pos: { lat: u.pos_lat, lng: u.pos_lng },
    km: +u.km,
  });
  async function profil() {
    const p = hasil(
      await sb
        .from('profiles')
        .select('id,nim,nama,fakultas,prodi,semester,tampil_peta')
        .eq('id', uid)
        .single(),
    );
    const [pin] = hasil(await sb.rpc('lokasi_saya'));
    return {
      id: p.id,
      nm: p.nama,
      nim: p.nim,
      fk: p.fakultas,
      pr: p.prodi,
      sm: p.semester,
      pin: pin ? { lat: pin.lat, lng: pin.lng } : null,
      show: p.tampil_peta,
    };
  }
  async function masukSesi(id) {
    uid = id;
    const pin = ambilPin();
    if (pin) {
      hasil(await sb.rpc('set_lokasi', { p_lat: pin.lat, p_lng: pin.lng }));
      buangPin();
    }
    return profil();
  }
  return {
    /* Memulihkan sesi saat halaman dibuka, termasuk dari link konfirmasi email. */
    async sesi() {
      const { session } = hasil(await sb.auth.getSession());
      return session ? masukSesi(session.user.id) : null;
    },
    async verifikasi(r) {
      return hasil(
        await sb.rpc('cek_nim', {
          p_nim: r.nim,
          p_nama: r.nm,
          p_fakultas: r.fk,
          p_prodi: r.pr,
        }),
      );
    },
    /* Mengembalikan null: akun dibuat tapi email harus dikonfirmasi dulu sebelum bisa masuk. */
    async daftar(r) {
      if (!r.pin) throw new Error('Taruh pin lokasi dulu');
      if ((r.pw || '').length < 8) throw new Error('Kata sandi minimal 8 karakter');
      const { data, error } = await sb.auth.signUp({
        email: r.em.trim().toLowerCase(),
        password: r.pw,
        options: {
          data: { nim: r.nim, nama: r.nm, fakultas: r.fk, prodi: r.pr, semester: +r.sm },
          emailRedirectTo: location.origin + location.pathname,
        },
      });
      /* Penolakan trigger buat_profil dilaporkan Auth sebagai error umum. */
      if (error)
        throw new Error(
          /database/i.test(error.message) ? 'NIM sudah terdaftar atau data tidak valid' : error.message,
        );
      tundaPin(r.pin);
      return data.session ? masukSesi(data.user.id) : null;
    },
    async masuk(email, pw) {
      const { data, error } = await sb.auth.signInWithPassword({
        email: String(email || '').trim().toLowerCase(),
        password: pw || '',
      });
      if (error)
        throw new Error(
          error.code == 'email_not_confirmed'
            ? 'Konfirmasi email dulu, cek kotak masukmu'
            : 'Email atau kata sandi salah',
        );
      return masukSesi(data.user.id);
    },
    async keluar() {
      uid = null;
      await sb.removeAllChannels();
      await sb.auth.signOut();
    },
    async setPin(pin) {
      await wajibSesi();
      hasil(await sb.rpc('set_lokasi', { p_lat: pin.lat, p_lng: pin.lng }));
    },
    async setShow(show) {
      await wajibSesi();
      hasil(await sb.from('profiles').update({ tampil_peta: show }).eq('id', uid));
    },
    async orang() {
      await wajibSesi();
      return hasil(await sb.rpc('orang_sekitar')).map(dto);
    },
    async direktori() {
      await wajibSesi();
      return hasil(await sb.rpc('direktori')).map(u => ({ id: u.id, n: u.nama, p: u.prodi }));
    },
    async cariNim(q) {
      await wajibSesi();
      const [r] = hasil(await sb.rpc('cari_nim', { q }));
      return r.id ? { t: r.hasil, id: r.id } : { t: r.hasil };
    },
    async connect(id) {
      await wajibSesi();
      hasil(await sb.from('koneksi').insert({ pemohon: uid, penerima: id }));
    },
    async jawabKoneksi(id, terima) {
      await wajibSesi();
      const q = sb.from('koneksi');
      const baris = hasil(
        await (terima ? q.update({ status: 'ok' }) : q.delete())
          .eq('pemohon', id)
          .eq('penerima', uid)
          .eq('status', 'pending')
          .select('id'),
      );
      if (!baris.length) throw new Error('Permintaan tidak ditemukan');
    },
    /* peta: { tabel: cb }. RLS memastikan hanya baris milik pengguna yang sampai. */
    pantau(peta) {
      const ch = sb.channel('utconnect');
      Object.entries(peta).forEach(([table, cb]) =>
        ch.on('postgres_changes', { event: '*', schema: 'public', table }, cb),
      );
      ch.subscribe();
    },
    /* ---------- chat pribadi ---------- */
    async pesan(id) {
      await wajibSesi();
      const r = hasil(
        await sb
          .from('pesan_pribadi')
          .select('dari,isi')
          .or(`and(dari.eq.${uid},ke.eq.${id}),and(dari.eq.${id},ke.eq.${uid})`)
          .order('dibuat'),
      );
      return r.map(m => ({ me: m.dari == uid, t: m.isi }));
    },
    async kirimPesan(id, isi) {
      await wajibSesi();
      hasil(await sb.from('pesan_pribadi').insert({ ke: id, isi }));
    },
    /* ---------- forum & info hub ---------- */
    async forum() {
      await wajibSesi();
      const r = hasil(
        await sb
          .from('forum_post')
          .select('id,penulis,mk,tipe,isi,dibuat,forum_penawaran(user_id)')
          .order('dibuat', { ascending: false }),
      );
      return r.map(p => ({
        id: p.id,
        by: p.penulis,
        mk: p.mk,
        t: p.tipe,
        x: p.isi,
        ts: p.dibuat,
        h: p.forum_penawaran.length,
        off: p.forum_penawaran.some(o => o.user_id == uid),
      }));
    },
    async postForum(mk, tipe, isi) {
      await wajibSesi();
      hasil(await sb.from('forum_post').insert({ mk, tipe, isi }));
    },
    async tawarkan(id, jadi) {
      await wajibSesi();
      const q = sb.from('forum_penawaran');
      hasil(await (jadi ? q.insert({ post_id: id }) : q.delete().eq('post_id', id).eq('user_id', uid)));
    },
    /* Terbuka untuk guest. */
    async info() {
      const r = hasil(
        await sb
          .from('info_post')
          .select('lingkup,kategori,judul,isi,nama_penulis,peran,dibuat')
          .order('dibuat', { ascending: false }),
      );
      return r.map(i => ({
        s: i.lingkup,
        c: i.kategori,
        t: i.judul,
        x: i.isi,
        by: i.nama_penulis,
        r: i.peran,
        ts: i.dibuat,
      }));
    },
    async postInfo(lingkup, kategori, judul, isi) {
      await wajibSesi();
      /* nama_penulis diisi ulang oleh trigger dari profil */
      hasil(
        await sb
          .from('info_post')
          .insert({ lingkup, kategori, judul, isi, nama_penulis: '-', peran: 'Mahasiswa' }),
      );
    },
    /* ---------- kelompok belajar ---------- */
    async grupSemua() {
      await wajibSesi();
      const [gs, ang, min, und, nf] = await Promise.all([
        sb.from('grup').select('*').order('dibuat'),
        sb.from('grup_anggota').select('grup_id,user_id,peran').order('gabung_pada'),
        sb.from('grup_permintaan').select('grup_id,user_id'),
        sb.from('grup_undangan').select('grup_id,user_id'),
        sb.from('notifikasi').select('*').order('dibuat', { ascending: false }).limit(30),
      ]);
      const milik = (r, g) => hasil(r).filter(x => x.grup_id == g);
      return {
        nf: hasil(nf).map(n => ({ id: n.id, t: n.isi, ts: n.dibuat, r: n.dibaca })),
        groups: hasil(gs).map(g => ({
          id: g.id,
          name: g.nama,
          course: g.kode_mk,
          type: g.tipe,
          cap: g.kapasitas,
          day: g.hari,
          start: g.mulai.slice(0, 5),
          end: g.selesai.slice(0, 5),
          platform: g.platform,
          loc: g.lokasi,
          addr: g.alamat,
          join: g.gabung,
          desc: g.deskripsi,
          goal: g.tujuan,
          rules: g.aturan,
          link: '',
          members: milik(ang, g.id).map(a => ({ id: a.user_id, r: a.peran })),
          reqs: milik(min, g.id).map(x => x.user_id),
          invited: milik(und, g.id).map(x => x.user_id),
          msgs: [],
          meets: [],
          targets: [],
          tasks: [],
          polls: [],
          notes: [],
          mats: [],
        })),
      };
    },
    /* Isi grup hanya terbaca oleh anggota. */
    async grupIsi(g) {
      await wajibSesi();
      const baca = (t, k = '*') => sb.from(t).select(k).eq('grup_id', g);
      const [link, msgs, meets, targets, tasks, polls, notes, mats] = await Promise.all([
        baca('grup_link', 'link').maybeSingle(),
        baca('grup_pesan').order('dibuat'),
        baca('grup_pertemuan').order('tanggal'),
        baca('grup_target'),
        baca('grup_tugas').order('tenggat'),
        baca('grup_polling', '*,polling_opsi(id,teks,urutan,polling_suara(user_id))').order('dibuat', {
          ascending: false,
        }),
        baca('grup_catatan').order('dibuat', { ascending: false }),
        baca('grup_materi').order('dibuat', { ascending: false }),
      ]);
      return {
        link: (hasil(link) || {}).link || '',
        msgs: hasil(msgs).map(m => ({
          id: m.id,
          by: m.pengirim,
          t: m.isi,
          ts: m.dibuat,
          rp: m.balas_ke || '',
          pin: m.pin,
        })),
        meets: hasil(meets).map(m => ({
          id: m.id,
          title: m.judul,
          date: m.tanggal,
          start: m.mulai.slice(0, 5),
          end: m.selesai.slice(0, 5),
          mat: m.materi,
          link: m.link,
          note: m.catatan,
        })),
        targets: hasil(targets).map(t => ({ id: t.id, t: t.judul, done: t.selesai })),
        tasks: hasil(tasks).map(t => ({
          id: t.id,
          t: t.judul,
          d: t.deskripsi,
          dl: t.tenggat,
          pri: t.prioritas,
          who: t.penanggung_jawab,
          st: t.status,
        })),
        polls: hasil(polls).map(p => ({
          id: p.id,
          q: p.pertanyaan,
          closed: p.ditutup,
          o: p.polling_opsi
            .sort((a, b) => a.urutan - b.urutan)
            .map(o => ({ id: o.id, t: o.teks, v: o.polling_suara.map(s => s.user_id) })),
        })),
        notes: hasil(notes).map(n => ({
          id: n.id,
          title: n.judul,
          mat: n.materi,
          disc: n.pembahasan,
          concl: n.kesimpulan,
          nt: n.tugas_berikut,
          nm: n.materi_berikut,
        })),
        mats: hasil(mats).map(m => ({
          id: m.id,
          n: m.nama,
          ty: m.tipe,
          url: m.url,
          tx: m.isi,
          sz: m.ukuran,
          by: m.oleh,
          ts: m.dibuat,
          path: m.path_file,
        })),
      };
    },
    async buatGrup(baris, link, target) {
      await wajibSesi();
      const { id } = hasil(await sb.from('grup').insert(baris).select('id').single());
      if (link) hasil(await sb.from('grup_link').insert({ grup_id: id, link }));
      if (target) hasil(await sb.from('grup_target').insert({ grup_id: id, judul: target }));
      return id;
    },
    async ubahGrup(id, baris, link) {
      await API.ubah('grup', id, baris);
      const q = sb.from('grup_link');
      hasil(
        await (link ? q.upsert({ grup_id: id, link }) : q.delete().eq('grup_id', id)),
      );
    },
    async buatPolling(grup_id, pertanyaan, opsi) {
      await wajibSesi();
      const p = hasil(await sb.from('grup_polling').insert({ grup_id, pertanyaan }).select('id').single());
      hasil(
        await sb
          .from('polling_opsi')
          .insert(opsi.map((teks, urutan) => ({ polling_id: p.id, teks, urutan }))),
      );
    },
    async setPeran(g, u, peran) {
      await wajibSesi();
      hasil(await sb.from('grup_anggota').update({ peran }).eq('grup_id', g).eq('user_id', u).select('peran'));
    },
    async keluarkan(g, u) {
      await wajibSesi();
      hasil(await sb.from('grup_anggota').delete().eq('grup_id', g).eq('user_id', u));
    },
    async notifDibaca() {
      await wajibSesi();
      hasil(await sb.from('notifikasi').update({ dibaca: true }).eq('user_id', uid).eq('dibaca', false));
    },
    async unggah(g, file) {
      await wajibSesi();
      const ext = (file.name.split('.').pop() || 'bin').replace(/\W/g, '');
      const path = `${g}/${crypto.randomUUID()}.${ext}`;
      hasil(await sb.storage.from('materi').upload(path, file, { contentType: file.type }));
      return path;
    },
    async materiUrl(path) {
      return hasil(await sb.storage.from('materi').createSignedUrl(path, 3600)).signedUrl;
    },
    async hapusFile(path) {
      hasil(await sb.storage.from('materi').remove([path]));
    },
    /* Penulisan umum. RLS menolak update/delete tanpa error, jadi hasil kosong dianggap ditolak. */
    async tambah(tabel, baris) {
      await wajibSesi();
      hasil(await sb.from(tabel).insert(baris));
    },
    async ubah(tabel, id, kolom) {
      await wajibSesi();
      const r = hasil(await sb.from(tabel).update(kolom).eq('id', id).select('id'));
      if (!r.length) throw new Error('Kamu tidak punya izin untuk ini');
    },
    async hapus(tabel, id) {
      await wajibSesi();
      const r = hasil(await sb.from(tabel).delete().eq('id', id).select('id'));
      if (!r.length) throw new Error('Kamu tidak punya izin untuk ini');
    },
    async fungsi(nama, args) {
      await wajibSesi();
      return hasil(await sb.rpc(nama, args));
    },
  };
})();
