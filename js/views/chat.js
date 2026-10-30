async function conn(id) {
  await API.connect(id);
  await muat();
  setTimeout(async () => {
    if (!(await API.simulasiTerima(id))) return;
    await muat();
    toast('Terhubung 🎉 Kamu bisa langsung mulai chat');
  }, 1500);
}
async function jawab(id, terima) {
  try {
    await API.jawabKoneksi(id, terima);
    await muat();
    toast(terima ? 'Terhubung 🎉 Kamu bisa langsung mulai chat' : 'Permintaan ditolak');
  } catch (e) {
    toast(e.message);
  }
}
const pu = k => S.people.find(x => x.id == k.slice(1));
const pn = k => {
  const u = pu(k);
  return u ? u.n.split(' ')[0] : '';
};
function chat(k) {
  if (pu(k).st != 'ok') return toast('Connect dulu untuk mulai chat');
  if (!S.ch[k]) S.ch[k] = [{ a: pn(k), t: 'Hai! Makasih sudah connect 👋' }];
  S.foc = 1;
  ov(k);
}
function send(k) {
  const i = $('#ci'),
    v = i.value.trim();
  if (!v) return;
  if (!S.ch[k]) chat(k);
  S.ch[k].push({ me: 1, t: v });
  S.foc = 1;
  R();
  setTimeout(() => {
    S.ch[k].push({
      a: pn(k),
      t: 'Siap, boleh banget! Kapan kita belajar bareng?',
    });
    S.foc = S.ov == k;
    R();
  }, 1200);
}
