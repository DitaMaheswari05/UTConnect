let me = '',
  DAY = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const JM = ['Terbuka', 'Memerlukan persetujuan', 'Privat / invite only'],
  JK = ['open', 'approval', 'private'],
  PL = ['Google Meet', 'Zoom', 'Microsoft Teams', 'Lainnya'];
const KEY = 'sg_v1';
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
const save = () => {};
const KG = id => KS.groups.find(g => g.id == id),
  mem = g => g.members.find(x => x.id == me),
  adm = g => {
    const m = mem(g);
    return !!m && m.r != 'member';
  };
function nt(g, t) {
  KS.nf.unshift({ id: uid(), t: g.name + ': ' + t, ts: Date.now(), r: 0 });
}
