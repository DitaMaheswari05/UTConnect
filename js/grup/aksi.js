function leave(g) {
  const a = g.members.filter(x => x.r == 'admin');
  if (adm(g) && mem(g).r == 'admin' && a.length == 1 && g.members.length > 1)
    return toast('Tunjuk admin pengganti sebelum keluar');
  conf(
    g.members.length == 1
      ? 'Kamu anggota terakhir. Keluar akan menghapus kelompok ini.'
      : 'Keluar dari grup “' + H(g.name) + '”?',
    async () => {
      await API.fungsi('keluar_grup', { g: g.id });
      KV.v = 'list';
      await segar();
    },
    'Keluar',
  );
}
/* Hapus satu baris setelah dikonfirmasi. */
const hapusItem = (tabel, id, tanya) =>
  conf(
    tanya,
    async () => {
      await API.hapus(tabel, id);
      await segar();
    },
    'Hapus',
  );
const ACT = {
  close: kClose,
  cok() {
    kClose();
    const f = CB;
    CB = null;
    return f && f();
  },
  back() {
    KV.v = 'list';
    KV.reply = null;
    render();
    sc0();
  },
  async open(g) {
    if (g.join == 'private' && !mem(g)) return toast('Grup privat: hanya lewat undangan');
    KV.v = 'd';
    KV.id = g.id;
    KV.tab = 'chat';
    await segar();
    sc0();
  },
  ty(g, d) {
    KV.ty = d.k;
    render();
  },
  tab(g, d) {
    KV.tab = d.t;
    KV.reply = null;
    render();
  },
  async join(g) {
    await API.fungsi('gabung_grup', { g: g.id });
    nt(g, 'Anggota baru: ' + un(me));
    toast('Berhasil bergabung');
    await segar();
  },
  async req(g) {
    await API.fungsi('minta_gabung', { g: g.id });
    nt(g, 'Permintaan bergabung dari ' + un(me));
    toast('Permintaan terkirim');
    await segar();
  },
  async accinv(g) {
    await API.fungsi('terima_undangan', { g: g.id });
    nt(g, 'Anggota baru: ' + un(me));
    await segar();
  },
  leave,
  async bell() {
    await API.notifDibaca();
    modal(
      '<h3>Notifikasi</h3>' +
        (KS.nf.length
          ? KS.nf
              .map(n => `<div class=it>${H(n.t)}<br><small>${fT(n.ts)}</small></div>`)
              .join('')
          : em('Belum ada notifikasi.', 'Aktivitas kelompok akan muncul di sini.')) +
        '<div class=krow><button class="kbtn ghost" data-a=close>Tutup</button></div>',
    );
    await segar();
  },
  plus() {
    form(
      'Buat Kelompok Belajar',
      [...gfields(), { k: 't1', l: 'Target belajar awal' }],
      {
        type: 'Online',
        cap: 10,
        day: 'Sabtu',
        start: '19:00',
        end: '21:00',
        platform: PL[0],
        join: JM[0],
      },
      async v => {
        const e = gcheck(v, 1);
        if (e) return e;
        KV.id = await API.buatGrup(gBaris(v), gLink(v), v.t1);
        KV.v = 'd';
        KV.tab = 'agenda';
      },
    );
  },
  menu(g) {
    const A = adm(g);
    modal(
      `<h3>${H(g.name)}</h3>${A ? '<button class="kbtn ghost" data-a=edit style="margin-top:10px">Ubah info kelompok</button><button class="kbtn red" data-a=delgrp style="margin-top:10px">Hapus kelompok</button>' : ''}<button class="kbtn red" data-a=leave data-id=${g.id} style="margin-top:10px">Keluar grup</button><button class="kbtn ghost" data-a=close style="margin-top:10px">Tutup</button>`,
    );
  },
  edit(g) {
    form(
      'Ubah Info Kelompok',
      gfields(),
      {
        ...g,
        type: g.type == 'online' ? 'Online' : 'Offline',
        join: JM[JK.indexOf(g.join)],
        cap: g.cap,
      },
      async v => {
        const e = gcheck(v, g.members.length);
        if (e) return e;
        await API.ubahGrup(g.id, gBaris(v), gLink(v));
      },
    );
  },
  delgrp(g) {
    kClose();
    conf(
      'Hapus kelompok ini beserta seluruh isinya?',
      async () => {
        await API.hapus('grup', g.id);
        KV.v = 'list';
        await segar();
      },
      'Hapus',
    );
  },
  async send(g) {
    const i = $('#kci'),
      t = i.value.trim();
    if (!t) return;
    const balas = KV.reply || null;
    i.value = '';
    try {
      await API.tambah('grup_pesan', { grup_id: g.id, isi: t, balas_ke: balas });
    } catch (e) {
      i.value = t;
      throw e;
    }
    KV.reply = null;
    nt(g, 'Pesan baru dari ' + un(me));
    await segar();
    sc0(1);
  },
  reply(g, d) {
    KV.reply = d.i;
    render();
    const c = $('#kci');
    c && c.focus();
  },
  async pin(g, d) {
    const m = g.msgs.find(x => x.id == d.i);
    await API.ubah('grup_pesan', m.id, { pin: !m.pin });
    await segar();
  },
  delmsg(g, d) {
    hapusItem('grup_pesan', d.i, 'Hapus pesan ini?');
  },
  addmeet(g) {
    form(
      'Tambah Jadwal Pertemuan',
      [
        { k: 'title', l: 'Judul', req: 1 },
        { k: 'date', l: 'Tanggal', t: 'date', req: 1 },
        { k: 'start', l: 'Jam mulai', t: 'time', req: 1 },
        { k: 'end', l: 'Jam selesai', t: 'time', req: 1 },
        { k: 'mat', l: 'Materi' },
        { k: 'link', l: 'Link meeting (opsional)', w: () => g.type == 'online' },
        { k: 'note', l: 'Catatan', t: 'textarea' },
      ],
      { title: 'Pertemuan #' + (g.meets.length + 1), start: g.start, end: g.end },
      async v => {
        if (v.end <= v.start) return 'Jam selesai harus setelah jam mulai';
        if (v.link && !ok(v.link)) return 'Link harus diawali http(s)://';
        await API.tambah('grup_pertemuan', {
          grup_id: g.id,
          judul: v.title,
          tanggal: v.date,
          mulai: v.start,
          selesai: v.end,
          materi: v.mat || '',
          link: v.link || '',
          catatan: v.note || '',
        });
        nt(g, 'Jadwal belajar baru: ' + v.title);
      },
    );
  },
  delmeet(g, d) {
    hapusItem('grup_pertemuan', d.i, 'Hapus jadwal ini?');
  },
  addtg(g) {
    form('Tambah Target Belajar', [{ k: 't', l: 'Target', req: 1 }], {}, async v => {
      await API.tambah('grup_target', { grup_id: g.id, judul: v.t });
    });
  },
  async deltg(g, d) {
    await API.hapus('grup_target', d.i);
    await segar();
  },
  addtask(g) {
    form(
      'Tambah Tugas',
      [
        { k: 't', l: 'Judul', req: 1 },
        { k: 'd', l: 'Deskripsi', t: 'textarea' },
        { k: 'dl', l: 'Deadline', t: 'date', req: 1 },
        { k: 'pri', l: 'Prioritas', t: 'select', o: ['Rendah', 'Sedang', 'Tinggi'] },
        { k: 'who', l: 'Penanggung jawab', t: 'select', o: g.members.map(x => [x.id, un(x.id)]) },
      ],
      { pri: 'Sedang', who: me },
      async v => {
        await API.tambah('grup_tugas', {
          grup_id: g.id,
          judul: v.t,
          deskripsi: v.d || '',
          tenggat: v.dl,
          prioritas: v.pri,
          penanggung_jawab: v.who,
        });
        nt(g, 'Tugas baru: ' + v.t + ' (deadline ' + v.dl + ')');
      },
    );
  },
  deltask(g, d) {
    hapusItem('grup_tugas', d.i, 'Hapus tugas ini?');
  },
  addpoll(g) {
    form(
      'Buat Polling',
      [
        { k: 'q', l: 'Pertanyaan', req: 1 },
        { k: 'o', l: 'Pilihan (satu per baris, min. 2)', t: 'textarea', req: 1 },
      ],
      {},
      async v => {
        const o = v.o
          .split('\n')
          .map(s => s.trim())
          .filter(Boolean);
        if (o.length < 2) return 'Minimal 2 pilihan';
        await API.buatPolling(g.id, v.q, o);
        nt(g, 'Polling baru: ' + v.q);
      },
    );
  },
  async vote(g, d) {
    await API.fungsi('pilih_opsi', { p: d.p, o: d.i });
    await segar();
  },
  async closepoll(g, d) {
    await API.ubah('grup_polling', d.i, { ditutup: true });
    await segar();
  },
  addnote(g) {
    form(
      'Catatan Pertemuan',
      [
        { k: 'title', l: 'Judul', req: 1 },
        { k: 'mat', l: 'Materi', req: 1 },
        { k: 'disc', l: 'Pembahasan', t: 'textarea', req: 1 },
        { k: 'concl', l: 'Kesimpulan', t: 'textarea', req: 1 },
        { k: 'nt', l: 'Tugas berikutnya' },
        { k: 'nm', l: 'Materi berikutnya' },
      ],
      {},
      async v => {
        await API.tambah('grup_catatan', {
          grup_id: g.id,
          judul: v.title,
          materi: v.mat,
          pembahasan: v.disc,
          kesimpulan: v.concl,
          tugas_berikut: v.nt || '',
          materi_berikut: v.nm || '',
        });
      },
    );
  },
  delnote(g, d) {
    hapusItem('grup_catatan', d.i, 'Hapus catatan ini?');
  },
  addmat(g) {
    form(
      'Upload Materi',
      [
        { k: 'n', l: 'Nama materi', req: 1 },
        { k: 'ty', l: 'Tipe', t: 'select', o: ['PDF', 'Dokumen', 'Gambar', 'Link', 'Rangkuman'] },
        { k: 'url', l: 'URL', w: v => v.ty == 'Link', req: 1 },
        { k: 'tx', l: 'Isi rangkuman', t: 'textarea', w: v => v.ty == 'Rangkuman', req: 1 },
        { k: 'f', l: 'File', t: 'file', w: v => ['PDF', 'Dokumen', 'Gambar'].includes(v.ty) },
      ],
      { ty: 'PDF' },
      async v => {
        if (v.ty == 'Link' && !ok(v.url)) return 'URL harus diawali http(s)://';
        const berkas = ['PDF', 'Dokumen', 'Gambar'].includes(v.ty) ? v.fF : null;
        if (['PDF', 'Dokumen', 'Gambar'].includes(v.ty) && !berkas) return 'Pilih file dulu';
        if (berkas && berkas.size > 20971520) return 'Ukuran file maksimal 20 MB';
        const path = berkas ? await API.unggah(g.id, berkas) : '';
        await API.tambah('grup_materi', {
          grup_id: g.id,
          nama: v.n,
          tipe: v.ty,
          url: v.ty == 'Link' ? v.url : '',
          isi: v.ty == 'Rangkuman' ? v.tx : '',
          path_file: path,
          ukuran: berkas ? berkas.size : 0,
        });
        nt(g, 'Materi baru: ' + v.n);
      },
    );
  },
  viewmat(g, d) {
    const m = g.mats.find(x => x.id == d.i);
    modal(
      `<h3>${H(m.n)}</h3><p style="white-space:pre-wrap">${H(m.tx)}</p><div class=krow><button class="kbtn ghost" data-a=close>Tutup</button></div>`,
    );
  },
  async openmat(g, d) {
    /* Dibuka dulu sebelum await, supaya tidak diblokir sebagai popup. */
    const w = window.open('');
    try {
      w.location = await API.materiUrl(g.mats.find(x => x.id == d.i).path);
    } catch (e) {
      w.close();
      throw e;
    }
  },
  delmat(g, d) {
    const m = g.mats.find(x => x.id == d.i);
    conf(
      'Hapus materi ini?',
      async () => {
        await API.hapus('grup_materi', m.id);
        if (m.path) await API.hapusFile(m.path);
        await segar();
      },
      'Hapus',
    );
  },
  async acc(g, d) {
    await API.fungsi('jawab_permintaan', { g: g.id, u: d.u, terima: true });
    nt(g, 'Permintaan ' + un(d.u) + ' diterima');
    await segar();
  },
  async rej(g, d) {
    await API.fungsi('jawab_permintaan', { g: g.id, u: d.u, terima: false });
    await segar();
  },
  async promote(g, d) {
    await API.setPeran(g.id, d.u, 'co');
    await segar();
  },
  async demote(g, d) {
    await API.setPeran(g.id, d.u, 'member');
    await segar();
  },
  kick(g, d) {
    conf(
      'Hapus ' + H(un(d.u)) + ' dari kelompok?',
      async () => {
        await API.keluarkan(g.id, d.u);
        await segar();
      },
      'Hapus',
    );
  },
  invite(g) {
    const o = S.dir
      .filter(x => !g.members.some(m => m.id == x.id) && !g.invited.includes(x.id))
      .map(x => [x.id, x.n + ' · ' + x.p]);
    if (!o.length) return toast('Tidak ada mahasiswa yang bisa diundang');
    form('Undang Anggota', [{ k: 'n', l: 'Mahasiswa', t: 'select', o, req: 1 }], {}, async v => {
      await API.tambah('grup_undangan', { grup_id: g.id, user_id: v.n });
      toast('Undangan dikirim ke ' + un(v.n));
    });
  },
  fsave,
};
