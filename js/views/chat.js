async function conn(id) {
  try {
    await API.connect(id);
    await muat();
    toast('Permintaan connect terkirim');
  } catch (e) {
    toast(e.message);
  }
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
async function bacaChat(k) {
  S.ch[k] = (await API.pesan(k.slice(1))).map(m => ({ ...m, a: pn(k) }));
}
async function chat(k) {
  if (pu(k).st != 'ok') return toast('Connect dulu untuk mulai chat');
  try {
    await bacaChat(k);
    S.foc = 1;
    ov(k);
  } catch (e) {
    toast(e.message);
  }
}
async function send(k) {
  const i = $('#ci'),
    v = i.value.trim();
  if (!v) return;
  i.value = '';
  try {
    await API.kirimPesan(k.slice(1), v);
    await bacaChat(k);
    S.foc = 1;
    R();
  } catch (e) {
    i.value = v;
    toast(e.message);
  }
}
/* Pesan masuk lewat realtime. */
async function pesanBaru({ new: m }) {
  if (!m || m.dari == S.me.id) return;
  const k = 'c' + m.dari;
  if (S.ov != k) return toast('Pesan baru dari ' + (pn(k) || 'teman'));
  await bacaChat(k);
  S.foc = 1;
  R();
}
