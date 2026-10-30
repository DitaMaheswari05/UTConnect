-- Skema private tidak diekspos ke API Supabase: data di sini tidak bisa dibaca klien.
create schema if not exists private;

-- ---------- data master ----------
create table public.fakultas (
  kode text primary key
);
create table public.prodi (
  nama text primary key,
  fakultas text not null references public.fakultas (kode) on update cascade,
  url text
);
create table public.mata_kuliah (
  nama text primary key
);
create table public.mk_prodi (
  prodi text references public.prodi (nama) on update cascade on delete cascade,
  mk text references public.mata_kuliah (nama) on update cascade on delete cascade,
  primary key (prodi, mk)
);
create table public.mk_fakultas (
  fakultas text references public.fakultas (kode) on update cascade on delete cascade,
  mk text references public.mata_kuliah (nama) on update cascade on delete cascade,
  primary key (fakultas, mk)
);

-- ---------- data sensitif ----------
-- Daftar mahasiswa resmi dari UT, sumber verifikasi saat daftar.
create table private.nim_registry (
  nim char(9) primary key check (nim ~ '^[0-9]{9}$'),
  nama text not null,
  email text not null unique check (email = lower(email)),
  fakultas text not null references public.fakultas (kode) on update cascade,
  prodi text not null references public.prodi (nama) on update cascade,
  aktif boolean not null default true
);
-- Koordinat asli. acak_* tetap per akun, supaya rata-rata banyak pengukuran tidak membuka posisi asli.
create table private.lokasi (
  user_id uuid primary key references auth.users (id) on delete cascade,
  lat double precision not null check (lat between -11.5 and 6.5),
  lng double precision not null check (lng between 94.5 and 141.5),
  acak_lat double precision not null default (random() - 0.5) * 0.0054,
  acak_lng double precision not null default (random() - 0.5) * 0.0054,
  diubah timestamptz not null default now()
);

-- Penghitung percobaan. Kunci di-hash supaya IP dan NIM tebakan tidak tersimpan apa adanya.
create table private.batas_coba (
  kunci text primary key,
  jumlah int not null default 1,
  mulai timestamptz not null default now()
);

-- ---------- pengguna ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nim char(9) not null unique,
  nama text not null,
  inisial text not null,
  fakultas text not null references public.fakultas (kode) on update cascade,
  prodi text not null references public.prodi (nama) on update cascade,
  semester smallint not null default 1 check (semester between 1 and 14),
  topik text[] not null default '{}',
  minat text[] not null default '{}',
  waktu text[] not null default '{}',
  tampil_peta boolean not null default true,
  dibuat timestamptz not null default now()
);
create table public.profil_mk (
  user_id uuid references public.profiles (id) on delete cascade,
  mk text references public.mata_kuliah (nama) on update cascade on delete cascade,
  primary key (user_id, mk)
);
create table public.koneksi (
  id uuid primary key default gen_random_uuid(),
  pemohon uuid not null references public.profiles (id) on delete cascade,
  penerima uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'ok')),
  dibuat timestamptz not null default now(),
  check (pemohon <> penerima)
);
create unique index koneksi_pasangan on public.koneksi (
  least(pemohon, penerima),
  greatest(pemohon, penerima)
);
create index koneksi_penerima on public.koneksi (penerima);

-- ---------- chat pribadi ----------
create table public.pesan_pribadi (
  id uuid primary key default gen_random_uuid(),
  dari uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  ke uuid not null references public.profiles (id) on delete cascade,
  isi text not null check (length(isi) between 1 and 4000),
  dibuat timestamptz not null default now()
);
create index pesan_pribadi_ke on public.pesan_pribadi (ke, dibuat);
create index pesan_pribadi_dari on public.pesan_pribadi (dari, dibuat);

-- ---------- forum & info hub ----------
create table public.forum_post (
  id uuid primary key default gen_random_uuid(),
  penulis uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  mk text not null references public.mata_kuliah (nama) on update cascade,
  tipe text not null check (tipe in ('Butuh bantuan', 'Bisa bantu')),
  isi text not null check (length(isi) between 1 and 4000),
  dibuat timestamptz not null default now()
);
create index forum_post_dibuat on public.forum_post (dibuat desc);
create table public.forum_penawaran (
  post_id uuid references public.forum_post (id) on delete cascade,
  user_id uuid default auth.uid() references public.profiles (id) on delete cascade,
  primary key (post_id, user_id)
);
create table public.info_post (
  id uuid primary key default gen_random_uuid(),
  lingkup text not null check (lingkup in ('ut', 'um')),
  kategori text not null check (kategori in ('Lomba', 'Loker', 'Seminar', 'Tips', 'UKM', 'HIMA')),
  judul text not null check (length(judul) between 1 and 200),
  isi text not null default '',
  penulis uuid default auth.uid() references public.profiles (id) on delete set null,
  nama_penulis text not null,
  peran text not null default 'Mahasiswa' check (peran in ('Mahasiswa', 'Dosen', 'Staff UT')),
  dibuat timestamptz not null default now()
);
create index info_post_dibuat on public.info_post (dibuat desc);

-- ---------- kelompok belajar ----------
create table public.grup (
  id uuid primary key default gen_random_uuid(),
  nama text not null check (length(nama) between 1 and 120),
  kode_mk text not null,
  tipe text not null check (tipe in ('online', 'offline')),
  kapasitas smallint not null check (kapasitas between 2 and 100),
  hari text not null check (hari in ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')),
  mulai time not null,
  selesai time not null,
  platform text not null default '',
  lokasi text not null default '',
  alamat text not null default '',
  gabung text not null default 'open' check (gabung in ('open', 'approval', 'private')),
  deskripsi text not null default '',
  tujuan text not null default '',
  aturan text not null default '',
  dibuat_oleh uuid default auth.uid() references public.profiles (id) on delete set null,
  dibuat timestamptz not null default now(),
  check (selesai > mulai)
);
-- Link meeting hanya untuk anggota, jadi dipisah dari tabel grup yang bisa dibaca semua.
create table public.grup_link (
  grup_id uuid primary key references public.grup (id) on delete cascade,
  link text not null check (link ~* '^https?://')
);
create table public.grup_anggota (
  grup_id uuid references public.grup (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete cascade,
  peran text not null default 'member' check (peran in ('admin', 'co', 'member')),
  gabung_pada timestamptz not null default now(),
  primary key (grup_id, user_id)
);
create index grup_anggota_user on public.grup_anggota (user_id);
create table public.grup_permintaan (
  grup_id uuid references public.grup (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete cascade,
  dibuat timestamptz not null default now(),
  primary key (grup_id, user_id)
);
create table public.grup_undangan (
  grup_id uuid references public.grup (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete cascade,
  dibuat timestamptz not null default now(),
  primary key (grup_id, user_id)
);
create table public.grup_pesan (
  id uuid primary key default gen_random_uuid(),
  grup_id uuid not null references public.grup (id) on delete cascade,
  pengirim uuid default auth.uid() references public.profiles (id) on delete set null,
  isi text not null check (length(isi) between 1 and 4000),
  balas_ke uuid references public.grup_pesan (id) on delete set null,
  pin boolean not null default false,
  dibuat timestamptz not null default now()
);
create index grup_pesan_grup on public.grup_pesan (grup_id, dibuat);
create table public.grup_pertemuan (
  id uuid primary key default gen_random_uuid(),
  grup_id uuid not null references public.grup (id) on delete cascade,
  judul text not null,
  tanggal date not null,
  mulai time not null,
  selesai time not null,
  materi text not null default '',
  link text not null default '',
  catatan text not null default '',
  check (selesai > mulai)
);
create index grup_pertemuan_grup on public.grup_pertemuan (grup_id, tanggal);
create table public.grup_target (
  id uuid primary key default gen_random_uuid(),
  grup_id uuid not null references public.grup (id) on delete cascade,
  judul text not null,
  selesai boolean not null default false
);
create index grup_target_grup on public.grup_target (grup_id);
create table public.grup_tugas (
  id uuid primary key default gen_random_uuid(),
  grup_id uuid not null references public.grup (id) on delete cascade,
  judul text not null,
  deskripsi text not null default '',
  tenggat date not null,
  prioritas text not null default 'Sedang' check (prioritas in ('Rendah', 'Sedang', 'Tinggi')),
  penanggung_jawab uuid references public.profiles (id) on delete set null,
  status text not null default 'Belum dimulai'
    check (status in ('Belum dimulai', 'Sedang dikerjakan', 'Selesai'))
);
create index grup_tugas_grup on public.grup_tugas (grup_id);
create table public.grup_polling (
  id uuid primary key default gen_random_uuid(),
  grup_id uuid not null references public.grup (id) on delete cascade,
  pertanyaan text not null,
  ditutup boolean not null default false,
  dibuat timestamptz not null default now()
);
create index grup_polling_grup on public.grup_polling (grup_id);
create table public.polling_opsi (
  id uuid primary key default gen_random_uuid(),
  polling_id uuid not null references public.grup_polling (id) on delete cascade,
  teks text not null
);
create index polling_opsi_polling on public.polling_opsi (polling_id);
-- Primary key (polling_id, user_id) menjamin satu orang satu suara.
create table public.polling_suara (
  polling_id uuid references public.grup_polling (id) on delete cascade,
  user_id uuid default auth.uid() references public.profiles (id) on delete cascade,
  opsi_id uuid not null references public.polling_opsi (id) on delete cascade,
  primary key (polling_id, user_id)
);
create table public.grup_catatan (
  id uuid primary key default gen_random_uuid(),
  grup_id uuid not null references public.grup (id) on delete cascade,
  judul text not null,
  materi text not null,
  pembahasan text not null,
  kesimpulan text not null,
  tugas_berikut text not null default '',
  materi_berikut text not null default '',
  dibuat timestamptz not null default now()
);
create index grup_catatan_grup on public.grup_catatan (grup_id);
create table public.grup_materi (
  id uuid primary key default gen_random_uuid(),
  grup_id uuid not null references public.grup (id) on delete cascade,
  nama text not null,
  tipe text not null check (tipe in ('PDF', 'Dokumen', 'Gambar', 'Link', 'Rangkuman')),
  url text not null default '',
  isi text not null default '',
  path_file text not null default '',
  ukuran bigint not null default 0,
  oleh uuid default auth.uid() references public.profiles (id) on delete set null,
  dibuat timestamptz not null default now()
);
create index grup_materi_grup on public.grup_materi (grup_id);

-- ---------- notifikasi ----------
create table public.notifikasi (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  isi text not null,
  dibaca boolean not null default false,
  dibuat timestamptz not null default now()
);
create index notifikasi_user on public.notifikasi (user_id, dibuat desc);
