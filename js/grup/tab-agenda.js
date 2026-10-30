function agenda(g, A) {
  const sec = (t, add, b) =>
      `<section class=sc><div class=ksh><h3>${t}</h3>${A ? `<button class=sm data-a=${add}>+ Tambah</button>` : ''}</div>${b}</section>`,
    x = (a, i) => (A ? `<button class="sm d" data-a=${a} data-i=${i}>Hapus</button>` : '');
  const ms = [...g.meets].sort((a, b) => (a.date > b.date ? 1 : -1)),
    done = g.targets.filter(t => t.done).length;
  return (
    sec(
      '📅 Jadwal Pertemuan',
      'addmeet',
      ms.length
        ? ms
            .map(
              m =>
                `<div class=it><b>${H(m.title)}</b><br>${fD(m.date)}<br>${tm(m.start)} - ${tm(m.end)} WIB<br>Materi: ${H(m.mat || '—')}<br>${H(place(g))}${ok(m.link || g.link) && g.type == 'online' ? ` · <a href="${H(m.link || g.link)}" target=_blank rel=noopener>Buka link</a>` : ''}${m.note ? `<br><small>${H(m.note)}</small>` : ''}<br>${x('delmeet', m.id)}</div>`,
            )
            .join('')
        : em('Belum ada jadwal.', 'Admin dapat menambahkan pertemuan.'),
    ) +
    sec(
      '🎯 Target Belajar',
      'addtg',
      g.targets.length
        ? `<b>${done} dari ${g.targets.length} target selesai</b><div class=kbar><i style="width:${Math.round((done / g.targets.length) * 100)}%"></i></div>` +
            g.targets
              .map(
                t =>
                  `<div class=ck><input type=checkbox data-c=tg data-i=${t.id} ${t.done ? 'checked' : ''}><span>${H(t.t)}</span>${x('deltg', t.id)}</div>`,
              )
              .join('')
        : em('Belum ada target.', 'Tambahkan target belajar kelompok.'),
    ) +
    sec(
      '📝 Tugas',
      'addtask',
      g.tasks.length
        ? g.tasks
            .map(
              t =>
                `<div class=it><b>${H(t.t)}</b> <span class="bd ad">${t.pri}</span><br>${t.d ? H(t.d) + '<br>' : ''}Deadline: ${fD(t.dl) || '—'}<br>Penanggung jawab: ${H(un(t.who))}<br><select data-c=tst data-i=${t.id} ${A || t.who == me ? '' : 'disabled'}>${['Belum dimulai', 'Sedang dikerjakan', 'Selesai'].map(s => `<option ${s == t.st ? 'selected' : ''}>${s}</option>`).join('')}</select>${x('deltask', t.id)}</div>`,
            )
            .join('')
        : em('Belum ada tugas.', 'Tugas kelompok akan muncul di sini.'),
    ) +
    sec(
      '📊 Polling',
      'addpoll',
      g.polls.length
        ? g.polls
            .map(p => {
              const tot = p.o.reduce((s, o) => s + o.v.length, 0);
              return `<div class=it><b>${H(p.q)}</b> ${p.closed ? '<span class="bd j">Ditutup</span>' : ''}${p.o.map(o => `<button class="po ${o.v.includes(me) ? 'me' : ''}" ${p.closed ? 'disabled' : ''} data-a=vote data-p=${p.id} data-i=${o.id}><i style="width:${tot ? (o.v.length / tot) * 100 : 0}%"></i><span>${H(o.t)}<b>${o.v.length} suara</b></span></button>`).join('')}<small>${tot} suara</small><br>${A && !p.closed ? `<button class=sm data-a=closepoll data-i=${p.id}>Tutup polling</button>` : ''}</div>`;
            })
            .join('')
        : em('Belum ada polling.', 'Buat polling untuk memutuskan jadwal bersama.'),
    ) +
    sec(
      '🗒️ Catatan Pertemuan',
      'addnote',
      (g.notes || []).length
        ? g.notes
            .map(
              n =>
                `<div class=it><b>${H(n.title)}</b><br>Materi: ${H(n.mat)}<br><b>Pembahasan:</b> ${H(n.disc)}<br><b>Kesimpulan:</b> ${H(n.concl)}<br>${n.nt ? `Tugas berikutnya: ${H(n.nt)}<br>` : ''}${n.nm ? `Materi berikutnya: ${H(n.nm)}<br>` : ''}${x('delnote', n.id)}</div>`,
            )
            .join('')
        : em('Belum ada catatan.', 'Catatan dibuat setelah sesi belajar selesai.'),
    )
  );
}
