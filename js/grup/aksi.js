function leave(g) {
  const a = g.members.filter(x => x.r == 'admin');
  if (adm(g) && mem(g).r == 'admin' && a.length == 1 && g.members.length > 1)
    return toast('Tunjuk admin pengganti sebelum keluar');
  conf(
    g.members.length == 1
      ? 'Kamu anggota terakhir. Keluar akan menghapus kelompok ini.'
      : 'Keluar dari grup “' + H(g.name) + '”?',
    () => {
      if (g.members.length == 1) KS.groups = KS.groups.filter(x => x != g);
      else g.members = g.members.filter(x => x.id != me);
      KV.v = 'list';
      save();
      render();
    },
    'Keluar',
  );
}
function addMem(g, id) {
  if (g.members.length >= g.cap) {
    toast('Kapasitas penuh');
    return false;
  }
  g.members.push({ id, r: 'member' });
  nt(g, 'Anggota baru: ' + un(id));
  return true;
}
const ACT = {
  close: kClose,
  cok() {
    kClose();
    const f = CB;
    CB = null;
    f && f();
  },
  back() {
    KV.v = 'list';
    KV.reply = null;
    render();
    sc0();
  },
  open(g) {
    if (g.join == 'private' && !mem(g)) return toast('Grup privat: hanya lewat undangan');
    KV.v = 'd';
    KV.id = g.id;
    KV.tab = 'chat';
    render();
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
  join(g) {
    if (addMem(g, me)) {
      toast('Berhasil bergabung');
      save();
      render();
    }
  },
  req(g) {
    g.reqs.push(me);
    nt(g, 'Permintaan bergabung dari ' + un(me));
    save();
    render();
    toast('Permintaan terkirim');
  },
  accinv(g) {
    g.invited = g.invited.filter(n => n != me);
    if (addMem(g, me)) {
      save();
      render();
    }
  },
  leave,
  bell() {
    KS.nf.forEach(n => (n.r = 1));
    save();
    modal(
      '<h3>Notifikasi</h3>' +
        (KS.nf.length
          ? KS.nf
              .slice(0, 30)
              .map(n => `<div class=it>${H(n.t)}<br><small>${fT(n.ts)}</small></div>`)
              .join('')
          : em('Belum ada notifikasi.', 'Aktivitas kelompok akan muncul di sini.')) +
        '<div class=krow><button class="kbtn ghost" data-a=close>Tutup</button></div>',
    );
    render();
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
      v => {
        const e = gcheck(v, 1);
        if (e) return e;
        const g = mk({ id: uid(), members: [{ id: me, r: 'admin' }] });
        apply(g, v);
        if (v.t1) g.targets.push({ id: uid(), t: v.t1, done: 0 });
        KS.groups.push(g);
        KV.v = 'd';
        KV.id = g.id;
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
      v => {
        const e = gcheck(v, g.members.length);
        if (e) return e;
        apply(g, v);
      },
    );
  },
  delgrp(g) {
    kClose();
    conf(
      'Hapus kelompok ini beserta seluruh isinya?',
      () => {
        KS.groups = KS.groups.filter(x => x != g);
        KV.v = 'list';
        save();
        render();
      },
      'Hapus',
    );
  },
  send(g) {
    const i = $('#kci'),
      t = i.value.trim();
    if (!t) return;
    g.msgs.push({ id: uid(), by: me, t, ts: Date.now(), rp: KV.reply || '', pin: 0 });
    KV.reply = null;
    nt(g, 'Pesan baru dari ' + un(me));
    save();
    render();
    sc0(1);
  },
  reply(g, d) {
    KV.reply = d.i;
    render();
    const c = $('#kci');
    c && c.focus();
  },
  pin(g, d) {
    const m = g.msgs.find(x => x.id == d.i);
    m.pin = m.pin ? 0 : 1;
    save();
    render();
  },
  delmsg(g, d) {
    conf(
      'Hapus pesan ini?',
      () => {
        g.msgs = g.msgs.filter(x => x.id != d.i);
        save();
        render();
      },
      'Hapus',
    );
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
      v => {
        if (v.end <= v.start) return 'Jam selesai harus setelah jam mulai';
        if (v.link && !ok(v.link)) return 'Link harus diawali http(s)://';
        g.meets.push({ id: uid(), ...v });
        nt(g, 'Jadwal belajar baru: ' + v.title);
      },
    );
  },
  delmeet(g, d) {
    conf(
      'Hapus jadwal ini?',
      () => {
        g.meets = g.meets.filter(x => x.id != d.i);
        save();
        render();
      },
      'Hapus',
    );
  },
  addtg(g) {
    form('Tambah Target Belajar', [{ k: 't', l: 'Target', req: 1 }], {}, v => {
      g.targets.push({ id: uid(), t: v.t, done: 0 });
    });
  },
  deltg(g, d) {
    g.targets = g.targets.filter(x => x.id != d.i);
    save();
    render();
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
      v => {
        g.tasks.push({ id: uid(), ...v, who: +v.who, st: 'Belum dimulai' });
        nt(g, 'Tugas baru: ' + v.t + ' (deadline ' + v.dl + ')');
      },
    );
  },
  deltask(g, d) {
    conf(
      'Hapus tugas ini?',
      () => {
        g.tasks = g.tasks.filter(x => x.id != d.i);
        save();
        render();
      },
      'Hapus',
    );
  },
  addpoll(g) {
    form(
      'Buat Polling',
      [
        { k: 'q', l: 'Pertanyaan', req: 1 },
        { k: 'o', l: 'Pilihan (satu per baris, min. 2)', t: 'textarea', req: 1 },
      ],
      {},
      v => {
        const o = v.o
          .split('\n')
          .map(s => s.trim())
          .filter(Boolean);
        if (o.length < 2) return 'Minimal 2 pilihan';
        g.polls.unshift({ id: uid(), q: v.q, closed: 0, o: o.map(t => ({ id: uid(), t, v: [] })) });
        nt(g, 'Polling baru: ' + v.q);
      },
    );
  },
  vote(g, d) {
    const p = g.polls.find(x => x.id == d.p);
    if (p.closed) return;
    p.o.forEach(o => (o.v = o.v.filter(n => n != me)));
    p.o.find(o => o.id == d.i).v.push(me);
    save();
    render();
  },
  closepoll(g, d) {
    g.polls.find(x => x.id == d.i).closed = 1;
    save();
    render();
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
      v => {
        (g.notes = g.notes || []).unshift({ id: uid(), ...v });
      },
    );
  },
  delnote(g, d) {
    conf(
      'Hapus catatan ini?',
      () => {
        g.notes = g.notes.filter(x => x.id != d.i);
        save();
        render();
      },
      'Hapus',
    );
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
      v => {
        if (v.ty == 'Link' && !ok(v.url)) return 'URL harus diawali http(s)://';
        g.mats.unshift({
          id: uid(),
          n: v.n,
          ty: v.ty,
          url: v.ty == 'Link' ? v.url : '',
          tx: v.ty == 'Rangkuman' ? v.tx : '',
          sz: v.fS || 0,
          by: me,
          ts: Date.now(),
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
  delmat(g, d) {
    conf(
      'Hapus materi ini?',
      () => {
        g.mats = g.mats.filter(x => x.id != d.i);
        save();
        render();
      },
      'Hapus',
    );
  },
  acc(g, d) {
    if (addMem(g, +d.u)) {
      g.reqs = g.reqs.filter(n => n != d.u);
      nt(g, 'Permintaan ' + un(d.u) + ' diterima');
      save();
      render();
    }
  },
  rej(g, d) {
    g.reqs = g.reqs.filter(n => n != d.u);
    save();
    render();
  },
  promote(g, d) {
    g.members.find(x => x.id == d.u).r = 'co';
    save();
    render();
  },
  demote(g, d) {
    g.members.find(x => x.id == d.u).r = 'member';
    save();
    render();
  },
  kick(g, d) {
    conf(
      'Hapus ' + H(un(d.u)) + ' dari kelompok?',
      () => {
        g.members = g.members.filter(x => x.id != d.u);
        save();
        render();
      },
      'Hapus',
    );
  },
  invite(g) {
    const o = S.dir
      .filter(x => !g.members.some(m => m.id == x.id) && !g.invited.includes(x.id))
      .map(x => [x.id, x.n + ' · ' + x.p]);
    if (!o.length) return toast('Tidak ada mahasiswa yang bisa diundang');
    form('Undang Anggota', [{ k: 'n', l: 'Mahasiswa', t: 'select', o, req: 1 }], {}, v => {
      g.invited.push(+v.n);
      toast('Undangan dikirim ke ' + un(v.n));
    });
  },
  fsave,
};
