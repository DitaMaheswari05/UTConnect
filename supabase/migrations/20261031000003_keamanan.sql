-- Supabase memberi hak penuh ke anon/authenticated secara bawaan.
-- Semua hak dicabut dulu, lalu dibuka satu per satu.
revoke all on all tables in schema public from anon, authenticated;
revoke all on schema private from public, anon, authenticated;
revoke all on all tables in schema private from public, anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;
revoke execute on all functions in schema private from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.is_anggota(uuid), private.is_admin(uuid), private.terhubung(uuid, uuid)
  to authenticated;
grant execute on function public.cek_nim(text, text, text, text, text) to anon, authenticated;
grant execute on function
  public.set_lokasi(double precision, double precision), public.lokasi_saya(), public.orang_sekitar(),
  public.direktori(), public.cari_nim(text), public.gabung_grup(uuid), public.minta_gabung(uuid),
  public.jawab_permintaan(uuid, uuid, boolean), public.terima_undangan(uuid), public.keluar_grup(uuid),
  public.notif_grup(uuid, text), public.pilih_opsi(uuid, uuid)
  to authenticated;

do $$
declare
  t text;
begin
  foreach t in array array[
    'fakultas', 'prodi', 'mata_kuliah', 'mk_prodi', 'mk_fakultas', 'profiles', 'profil_mk', 'koneksi',
    'pesan_pribadi', 'forum_post', 'forum_penawaran', 'info_post', 'grup', 'grup_link', 'grup_anggota',
    'grup_permintaan', 'grup_undangan', 'grup_pesan', 'grup_pertemuan', 'grup_target', 'grup_tugas',
    'grup_polling', 'polling_opsi', 'polling_suara', 'grup_catatan', 'grup_materi', 'notifikasi'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
  -- data master: terbuka untuk dibaca, termasuk form daftar sebelum login
  foreach t in array array['fakultas', 'prodi', 'mata_kuliah', 'mk_prodi', 'mk_fakultas'] loop
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('create policy baca on public.%I for select to anon, authenticated using (true)', t);
  end loop;
  -- isi grup: baca hanya anggota
  foreach t in array array[
    'grup_pesan', 'grup_pertemuan', 'grup_target', 'grup_tugas', 'grup_polling', 'grup_catatan', 'grup_materi'
  ] loop
    execute format('grant select on public.%I to authenticated', t);
    execute format(
      'create policy baca on public.%I for select to authenticated using (private.is_anggota(grup_id))', t
    );
  end loop;
  -- agenda: tambah dan hapus hanya admin grup
  foreach t in array array['grup_pertemuan', 'grup_target', 'grup_tugas', 'grup_polling', 'grup_catatan'] loop
    execute format('grant insert, delete on public.%I to authenticated', t);
    execute format(
      'create policy tambah on public.%I for insert to authenticated with check (private.is_admin(grup_id))', t
    );
    execute format(
      'create policy hapus on public.%I for delete to authenticated using (private.is_admin(grup_id))', t
    );
  end loop;
end;
$$;

-- ---------- profil: pengguna lain membaca lewat orang_sekitar() dan direktori() ----------
grant select on public.profiles to authenticated;
grant update (semester, topik, minat, waktu, tampil_peta) on public.profiles to authenticated;
create policy milik_sendiri on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy ubah_sendiri on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

grant select, insert, delete on public.profil_mk to authenticated;
create policy milik_sendiri on public.profil_mk for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ---------- koneksi ----------
grant select, insert, delete on public.koneksi to authenticated;
grant update (status) on public.koneksi to authenticated;
create policy lihat on public.koneksi for select to authenticated
  using ((select auth.uid()) in (pemohon, penerima));
create policy minta on public.koneksi for insert to authenticated
  with check (pemohon = (select auth.uid()) and status = 'pending');
create policy setujui on public.koneksi for update to authenticated
  using (penerima = (select auth.uid())) with check (penerima = (select auth.uid()));
create policy putus on public.koneksi for delete to authenticated
  using ((select auth.uid()) in (pemohon, penerima));

-- ---------- chat pribadi: hanya pasangan yang sudah saling terhubung ----------
grant select, insert on public.pesan_pribadi to authenticated;
create policy baca on public.pesan_pribadi for select to authenticated
  using ((select auth.uid()) in (dari, ke));
create policy kirim on public.pesan_pribadi for insert to authenticated
  with check (dari = (select auth.uid()) and private.terhubung(dari, ke));

-- ---------- forum ----------
grant select, insert, delete on public.forum_post to authenticated;
create policy baca on public.forum_post for select to authenticated using (true);
create policy tulis on public.forum_post for insert to authenticated with check (penulis = (select auth.uid()));
create policy hapus on public.forum_post for delete to authenticated using (penulis = (select auth.uid()));
grant select, insert, delete on public.forum_penawaran to authenticated;
create policy baca on public.forum_penawaran for select to authenticated using (true);
create policy tawarkan on public.forum_penawaran for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy batal on public.forum_penawaran for delete to authenticated
  using (user_id = (select auth.uid()));

-- ---------- info hub: guest boleh baca, mahasiswa tidak bisa mengaku Dosen/Staff ----------
grant select on public.info_post to anon, authenticated;
grant insert, delete on public.info_post to authenticated;
create policy baca on public.info_post for select to anon, authenticated using (true);
create policy tulis on public.info_post for insert to authenticated
  with check (penulis = (select auth.uid()) and peran = 'Mahasiswa');
create policy hapus on public.info_post for delete to authenticated using (penulis = (select auth.uid()));

-- ---------- grup ----------
grant select, insert, delete on public.grup to authenticated;
grant update (nama, kode_mk, tipe, kapasitas, hari, mulai, selesai, platform, lokasi, alamat, gabung,
  deskripsi, tujuan, aturan) on public.grup to authenticated;
create policy baca on public.grup for select to authenticated using (true);
create policy buat on public.grup for insert to authenticated with check (dibuat_oleh = (select auth.uid()));
create policy ubah on public.grup for update to authenticated
  using (private.is_admin(id)) with check (private.is_admin(id));
create policy hapus on public.grup for delete to authenticated using (private.is_admin(id));

grant select, insert, update, delete on public.grup_link to authenticated;
create policy baca on public.grup_link for select to authenticated using (private.is_anggota(grup_id));
create policy kelola on public.grup_link for all to authenticated
  using (private.is_admin(grup_id)) with check (private.is_admin(grup_id));

-- Masuk grup hanya lewat fungsi gabung, jadi tidak ada izin insert langsung.
grant select, delete on public.grup_anggota to authenticated;
grant update (peran) on public.grup_anggota to authenticated;
create policy baca on public.grup_anggota for select to authenticated using (true);
create policy ubah_peran on public.grup_anggota for update to authenticated
  using (private.is_admin(grup_id) and peran <> 'admin')
  with check (private.is_admin(grup_id) and peran <> 'admin');
create policy keluarkan on public.grup_anggota for delete to authenticated
  using (private.is_admin(grup_id) and peran <> 'admin');

grant select on public.grup_permintaan to authenticated;
create policy lihat on public.grup_permintaan for select to authenticated
  using (user_id = (select auth.uid()) or private.is_admin(grup_id));

grant select, insert, delete on public.grup_undangan to authenticated;
create policy lihat on public.grup_undangan for select to authenticated
  using (user_id = (select auth.uid()) or private.is_admin(grup_id));
create policy undang on public.grup_undangan for insert to authenticated
  with check (private.is_admin(grup_id));
create policy batal on public.grup_undangan for delete to authenticated
  using (user_id = (select auth.uid()) or private.is_admin(grup_id));

-- ---------- isi grup: aturan yang berbeda dari pola umum ----------
grant insert, delete on public.grup_pesan to authenticated;
grant update (pin) on public.grup_pesan to authenticated;
create policy kirim on public.grup_pesan for insert to authenticated
  with check (pengirim = (select auth.uid()) and private.is_anggota(grup_id));
create policy sematkan on public.grup_pesan for update to authenticated
  using (private.is_admin(grup_id)) with check (private.is_admin(grup_id));
create policy hapus on public.grup_pesan for delete to authenticated
  using (pengirim = (select auth.uid()) or private.is_admin(grup_id));

grant update (selesai) on public.grup_target to authenticated;
create policy centang on public.grup_target for update to authenticated
  using (private.is_anggota(grup_id)) with check (private.is_anggota(grup_id));

grant update (status) on public.grup_tugas to authenticated;
create policy ubah_status on public.grup_tugas for update to authenticated
  using (penanggung_jawab = (select auth.uid()) or private.is_admin(grup_id))
  with check (penanggung_jawab = (select auth.uid()) or private.is_admin(grup_id));

grant update (ditutup) on public.grup_polling to authenticated;
create policy tutup on public.grup_polling for update to authenticated
  using (private.is_admin(grup_id)) with check (private.is_admin(grup_id));

grant select, insert on public.polling_opsi to authenticated;
create policy baca on public.polling_opsi for select to authenticated using (
  exists (select 1 from public.grup_polling p where p.id = polling_id and private.is_anggota(p.grup_id))
);
create policy tambah on public.polling_opsi for insert to authenticated with check (
  exists (select 1 from public.grup_polling p where p.id = polling_id and private.is_admin(p.grup_id))
);

-- Memberi suara hanya lewat pilih_opsi().
grant select on public.polling_suara to authenticated;
create policy baca on public.polling_suara for select to authenticated using (
  exists (select 1 from public.grup_polling p where p.id = polling_id and private.is_anggota(p.grup_id))
);

grant insert, delete on public.grup_materi to authenticated;
create policy tambah on public.grup_materi for insert to authenticated
  with check (oleh = (select auth.uid()) and private.is_anggota(grup_id));
create policy hapus on public.grup_materi for delete to authenticated
  using (oleh = (select auth.uid()) or private.is_admin(grup_id));

-- ---------- notifikasi ----------
grant select, delete on public.notifikasi to authenticated;
grant update (dibaca) on public.notifikasi to authenticated;
create policy milik_sendiri on public.notifikasi for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ---------- realtime: pesan hanya sampai ke pihak yang lolos RLS ----------
alter publication supabase_realtime add table
  public.pesan_pribadi, public.grup_pesan, public.koneksi, public.notifikasi;

-- ---------- file materi: path berbentuk <grup_id>/<nama file> ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'materi', 'materi', false, 20971520,
  array[
    'application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
);
create policy materi_baca on storage.objects for select to authenticated using (
  bucket_id = 'materi' and private.is_anggota(((storage.foldername(name))[1])::uuid)
);
create policy materi_unggah on storage.objects for insert to authenticated with check (
  bucket_id = 'materi' and private.is_anggota(((storage.foldername(name))[1])::uuid)
);
create policy materi_hapus on storage.objects for delete to authenticated using (
  bucket_id = 'materi' and (owner = (select auth.uid()) or private.is_admin(((storage.foldername(name))[1])::uuid))
);
