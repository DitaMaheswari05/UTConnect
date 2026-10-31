// Mengisi data demo: node --env-file=.env supabase/demo/muat.mjs
// Hanya untuk project pengembangan. Bisa dijalankan ulang. Hapus dengan hapus.sql sebelum production.
// Tanpa koneksi database: --sql menulis file untuk SQL Editor, --akun hanya membuat akun demo.
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const { SUPABASE_URL, SUPABASE_SECRET_KEY, SUPABASE_DB_URL, DEMO_PASSWORD } = process.env;
const mode = process.argv[2];
if (!mode && !SUPABASE_DB_URL) throw new Error('SUPABASE_DB_URL harus ada di .env');
if (mode !== '--sql' && (!SUPABASE_URL || !SUPABASE_SECRET_KEY || !DEMO_PASSWORD)) {
  throw new Error('SUPABASE_URL, SUPABASE_SECRET_KEY, dan DEMO_PASSWORD harus ada di .env');
}
const { mahasiswa, registry_saja, forum, info, grup } = JSON.parse(
  readFileSync(new URL('data.json', import.meta.url)),
);

const email = u => `${u.nim}@demo.utconnect.test`;
const teks = s => `'${String(s).replaceAll("'", "''")}'`;
const larik = a => `array[${a.map(teks).join(',')}]::text[]`;
const akun = nim => `(select id from public.profiles where nim = ${teks(nim)})`;
// id tetap dengan awalan de000000 supaya bisa dijalankan ulang dan dihapus oleh hapus.sql
const idDemo = (jenis, i) => `'de000000-0000-4000-800${jenis}-${String(i).padStart(12, '0')}'`;

function psql(sql) {
  const r = spawnSync('psql', [SUPABASE_DB_URL, '-v', 'ON_ERROR_STOP=1', '-q', '-1'], {
    input: sql,
    encoding: 'utf8',
  });
  if (r.status !== 0) throw new Error(r.stderr || 'psql gagal');
}

const sqlRegistry =
  `insert into private.nim_registry (nim, nama, email, fakultas, prodi) values\n` +
  [...mahasiswa, ...registry_saja]
    .map(u => `(${[u.nim, u.nama, email(u), u.fakultas, u.prodi].map(teks).join(',')})`)
    .join(',\n') +
  `\non conflict (nim) do nothing;\n`;

const sqlProfil = mahasiswa
  .map(
    u => `
update public.profiles set topik = ${larik(u.topik)}, minat = ${larik(u.minat)}, waktu = ${larik(u.waktu)}
  where nim = ${teks(u.nim)};
insert into public.profil_mk (user_id, mk)
  select p.id, m from public.profiles p, unnest(${larik(u.mk)}) m where p.nim = ${teks(u.nim)}
  on conflict do nothing;
insert into private.lokasi (user_id, lat, lng)
  select id, ${u.lat}, ${u.lng} from public.profiles where nim = ${teks(u.nim)}
  on conflict (user_id) do nothing;`,
  )
  .join('\n');

const sqlForum = forum
  .map((p, i) => {
    const id = idDemo(1, i);
    const penawar = mahasiswa.filter(u => u.nim !== p.oleh).slice(0, p.tawaran);
    return `
insert into public.forum_post (id, penulis, mk, tipe, isi, dibuat)
  values (${id}, ${akun(p.oleh)}, ${teks(p.mk)}, ${teks(p.tipe)}, ${teks(p.isi)}, now() - interval ${teks(p.lalu)})
  on conflict (id) do nothing;
${penawar.map(u => `insert into public.forum_penawaran (post_id, user_id) values (${id}, ${akun(u.nim)}) on conflict do nothing;`).join('\n')}`;
  })
  .join('\n');

const sqlInfo = info
  .map(
    (p, i) => `
insert into public.info_post (id, lingkup, kategori, judul, isi, penulis, nama_penulis, peran, dibuat)
  values (${idDemo(2, i)}, ${teks(p.lingkup)}, ${teks(p.kategori)}, ${teks(p.judul)}, ${teks(p.isi)}, null,
    ${teks(p.nama_penulis)}, ${teks(p.peran)}, now() - interval ${teks(p.lalu)})
  on conflict (id) do nothing;`,
  )
  .join('\n');

const sqlGrup = grup
  .map((g, i) => {
    const id = idDemo(3, i);
    const kolom = [g.nama, g.kode_mk, g.tipe, g.kapasitas, g.hari, g.mulai, g.selesai, g.platform, g.lokasi]
      .concat([g.gabung, g.deskripsi, g.tujuan, g.aturan])
      .map(teks)
      .join(', ');
    return `
insert into public.grup (id, nama, kode_mk, tipe, kapasitas, hari, mulai, selesai, platform, lokasi, gabung,
    deskripsi, tujuan, aturan, dibuat_oleh)
  values (${id}, ${kolom}, ${akun(g.anggota[0])})
  on conflict (id) do nothing;
${g.anggota.slice(1).map(n => `insert into public.grup_anggota (grup_id, user_id) values (${id}, ${akun(n)}) on conflict do nothing;`).join('\n')}
${g.minta.map(n => `insert into public.grup_permintaan (grup_id, user_id) values (${id}, ${akun(n)}) on conflict do nothing;`).join('\n')}
${g.link ? `insert into public.grup_link (grup_id, link) values (${id}, ${teks(g.link)}) on conflict do nothing;` : ''}
${g.target.map((t, j) => `insert into public.grup_target (id, grup_id, judul, selesai) values (${idDemo(4, i * 100 + j)}, ${id}, ${teks(t.judul)}, ${t.selesai}) on conflict (id) do nothing;`).join('\n')}
${g.pertemuan.map((m, j) => `insert into public.grup_pertemuan (id, grup_id, judul, tanggal, mulai, selesai, materi) values (${idDemo(5, i * 100 + j)}, ${id}, ${teks(m.judul)}, ${teks(m.tanggal)}, ${teks(m.mulai)}, ${teks(m.selesai)}, ${teks(m.materi)}) on conflict (id) do nothing;`).join('\n')}
${g.tugas.map((t, j) => `insert into public.grup_tugas (id, grup_id, judul, tenggat, prioritas, penanggung_jawab, status) values (${idDemo(6, i * 100 + j)}, ${id}, ${teks(t.judul)}, ${teks(t.tenggat)}, ${teks(t.prioritas)}, ${akun(t.oleh)}, ${teks(t.status)}) on conflict (id) do nothing;`).join('\n')}
${g.pesan.map((m, j) => `insert into public.grup_pesan (id, grup_id, pengirim, isi, dibuat) values (${idDemo(7, i * 100 + j)}, ${id}, ${akun(m.oleh)}, ${teks(m.isi)}, now() + interval '${j} seconds') on conflict (id) do nothing;`).join('\n')}`;
  })
  .join('\n');

const sqlKonten = [sqlProfil, sqlForum, sqlInfo, sqlGrup].join('\n') + '\n';

if (mode === '--sql') {
  const dir = new URL('../data/', import.meta.url);
  mkdirSync(dir, { recursive: true });
  writeFileSync(new URL('demo_1_registry.sql', dir), sqlRegistry);
  writeFileSync(new URL('demo_2_profil.sql', dir), sqlKonten);
  console.log('Ditulis ke supabase/data/');
  process.exit(0);
}

if (!mode) psql(sqlRegistry);

// Lewat Admin API, bukan insert ke auth.users, supaya baris identities ikut dibuat.
for (const u of mahasiswa) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SECRET_KEY,
      Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email(u),
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: {
        nim: u.nim,
        nama: u.nama,
        fakultas: u.fakultas,
        prodi: u.prodi,
        semester: u.semester,
      },
    }),
  });
  if (!res.ok) {
    const e = await res.json();
    if (e.error_code !== 'email_exists') throw new Error(`${u.nim}: ${e.msg || res.status}`);
  }
}

if (!mode) psql(sqlKonten);
console.log(
  `${mahasiswa.length} akun, ${registry_saja.length} NIM uji, ${forum.length} forum, ${info.length} info, ${grup.length} grup`,
);
