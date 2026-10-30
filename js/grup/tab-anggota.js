function anggota(g, A) {
  const RL = { admin: 'Admin', co: 'Co-admin', member: 'Anggota' };
  return (
    (A && g.reqs.length
      ? `<section class=sc><h3>Permintaan Bergabung (${g.reqs.length})</h3>${g.reqs.map(n => `<div class=it><b>${H(un(n))}</b><br><button class=sm data-a=acc data-u=${n}>Terima</button> <button class="sm d" data-a=rej data-u=${n}>Tolak</button></div>`).join('')}</section>`
      : '') +
    `<section class=sc><div class=ksh><h3>Anggota (${g.members.length}/${g.cap})</h3>${A ? '<button class=sm data-a=invite>+ Undang</button>' : ''}</div>` +
    g.members
      .map(
        x =>
          `<div class=it><div style="display:flex;gap:10px;align-items:center"><div class=kav>${H(un(x.id)[0])}</div><b style=flex:1>${H(un(x.id))}${x.id == me ? ' (Kamu)' : ''}</b><span class="bd ${x.r == 'member' ? '' : 'ad'}">${RL[x.r]}</span></div>${A && x.id != me && x.r != 'admin' ? `<button class=sm data-a=${x.r == 'co' ? 'demote' : 'promote'} data-u=${x.id}>${x.r == 'co' ? 'Hapus status admin' : 'Jadikan co-admin'}</button> <button class="sm d" data-a=kick data-u=${x.id}>Hapus anggota</button>` : ''}</div>`,
      )
      .join('') +
    `</section>`
  );
}
