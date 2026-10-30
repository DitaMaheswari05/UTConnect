function kChat(g, A) {
  const pins = g.msgs.filter(x => x.pin);
  let h = pins.length
    ? `<div class=pin>📌 ${pins.map(p => `<div>${H(un(p.by))}: ${H(p.t)}</div>`).join('')}</div>`
    : '';
  h += g.msgs.length
    ? `<div class=kmsgs>${g.msgs
        .map(x => {
          const r = x.rp && g.msgs.find(y => y.id == x.rp);
          return `<div class=ms><div class=kav>${H(un(x.by)[0])}</div><div class=bub><b>${H(un(x.by))}</b> <small>${fT(x.ts)}</small>${r ? `<div class=q>${H(un(r.by))}: ${H(r.t.slice(0, 60))}</div>` : ''}<div>${H(x.t).replace(/@(\w+)/g, '<span class=mn>@$1</span>')}</div><button class=lnk data-a=reply data-i=${x.id}>Balas</button>${A ? `<button class=lnk data-a=pin data-i=${x.id}>${x.pin ? 'Lepas pin' : 'Pin'}</button>` : ''}${x.by == me || A ? `<button class=lnk data-a=delmsg data-i=${x.id}>Hapus</button>` : ''}</div></div>`;
        })
        .join('')}</div>`
    : em('Belum ada percakapan.', 'Mulai diskusi dengan anggota kelompok.');
  const rp = KV.reply && g.msgs.find(x => x.id == KV.reply);
  return (
    h +
    (rp
      ? `<div class=q>Membalas ${H(un(rp.by))}: ${H(rp.t.slice(0, 60))} <button class=lnk data-a=reply data-i="">✕</button></div>`
      : '') +
    `<div class=ci><input id=kci placeholder="Tulis pesan… (@nama untuk mention)"><button class=kbtn data-a=send>Kirim</button></div>`
  );
}
