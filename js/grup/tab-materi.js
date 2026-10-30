function materi(g, A) {
  return (
    `<section class=sc><div class=ksh><h3>📚 Materi</h3><button class=sm data-a=addmat>+ Upload</button></div>` +
    (g.mats.length
      ? g.mats
          .map(
            m =>
              `<div class=it><b>${H(m.n)}</b> <span class="bd">${m.ty}</span><br>${fS(m.sz)} · oleh ${H(un(m.by))} · ${new Date(m.ts).toLocaleDateString('id-ID')}<br>${m.url ? `<a href="${H(m.url)}" target=_blank rel=noopener>Buka</a> ` : ''}${m.tx ? `<button class=sm data-a=viewmat data-i=${m.id}>Lihat</button> ` : ''}${m.by == me || A ? `<button class="sm d" data-a=delmat data-i=${m.id}>Hapus</button>` : ''}</div>`,
          )
          .join('')
      : em('Belum ada materi.', 'Upload materi pertama untuk membantu kelompok belajar.')) +
    `</section>`
  );
}
