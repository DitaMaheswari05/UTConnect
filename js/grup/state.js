let me = '',
  DAY = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const JM = ['Terbuka', 'Memerlukan persetujuan', 'Privat / invite only'],
  JK = ['open', 'approval', 'private'],
  PL = ['Google Meet', 'Zoom', 'Microsoft Teams', 'Lainnya'];
let KS = null,
  KV = {
    v: 'list',
    id: null,
    tab: 'chat',
    q: '',
    ty: 'all',
    co: '',
    mm: 'all',
    so: 'new',
    reply: null,
  },
  FM = null,
  CB = null;
const KG = id => KS.groups.find(g => g.id == id),
  mem = g => g.members.find(x => x.id == me),
  adm = g => {
    const m = mem(g);
    return !!m && m.r != 'member';
  };
/* Notifikasi tidak boleh menggagalkan aksi utamanya. */
function nt(g, t) {
  API.fungsi('notif_grup', { g: g.id, p_isi: t }).catch(() => {});
}
/* Satu-satunya jalan data grup sampai ke layar: baca ulang dari database. */
async function segar() {
  const d = await API.grupSemua(),
    g = d.groups.find(x => x.id == KV.id);
  if (KV.v == 'd' && g && g.members.some(x => x.id == me)) Object.assign(g, await API.grupIsi(g.id));
  KS = d;
  render();
}
async function grupPesanBaru({ new: m }) {
  if (KS && m && KV.v == 'd' && m.grup_id == KV.id) {
    await segar();
    sc0(1);
  }
}
async function notifBaru() {
  if (KS) await segar();
}
