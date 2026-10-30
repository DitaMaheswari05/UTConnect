-- ---------- helper ----------
create function private.jarak_km(lat1 double precision, lng1 double precision, lat2 double precision, lng2 double precision)
returns double precision language sql immutable as $$
  select 12742 * asin(sqrt(
    sin(radians(lat2 - lat1) / 2) ^ 2
    + cos(radians(lat1)) * cos(radians(lat2)) * sin(radians(lng2 - lng1) / 2) ^ 2
  ));
$$;
create function private.is_anggota(g uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.grup_anggota a where a.grup_id = g and a.user_id = (select auth.uid())
  );
$$;
create function private.is_admin(g uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.grup_anggota a
    where a.grup_id = g and a.user_id = (select auth.uid()) and a.peran <> 'member'
  );
$$;
create function private.terhubung(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.koneksi k
    where k.status = 'ok' and least(k.pemohon, k.penerima) = least(a, b)
      and greatest(k.pemohon, k.penerima) = greatest(a, b)
  );
$$;

-- Mengembalikan false setelah melewati batas. Pemanggil tidak boleh raise exception,
-- karena rollback akan ikut membatalkan penghitungnya.
create function private.boleh_coba(p_kunci text, p_maks int, p_jendela interval) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  k text := encode(sha256(convert_to(p_kunci, 'UTF8')), 'hex');
  n int;
begin
  if random() < 0.01 then
    delete from private.batas_coba where mulai < now() - interval '1 day';
  end if;
  insert into private.batas_coba as b (kunci) values (k)
  on conflict (kunci) do update set
    jumlah = case when b.mulai < now() - p_jendela then 1 else b.jumlah + 1 end,
    mulai = case when b.mulai < now() - p_jendela then now() else b.mulai end
  returning jumlah into n;
  return n <= p_maks;
end;
$$;
create function private.ip_klien() returns text language sql stable as $$
  select coalesce(
    h ->> 'cf-connecting-ip',
    nullif(trim(split_part(h ->> 'x-forwarded-for', ',', 1)), ''),
    'tanpa-ip'
  )
  from (select nullif(current_setting('request.headers', true), '')::json as h) x;
$$;

-- ---------- pendaftaran ----------
-- Dipanggil di langkah 1 daftar. Hanya menjawab cocok/tidak, tidak pernah mengembalikan isi registry.
create function public.cek_nim(p_nim text, p_nama text, p_email text, p_fakultas text, p_prodi text)
returns text language plpgsql security definer set search_path = '' as $$
begin
  -- dua-duanya dihitung: per NIM menahan tebakan terarah, per IP menahan sapuan banyak NIM
  if not private.boleh_coba('cek-ip:' || private.ip_klien(), 30, interval '1 hour')
    or not private.boleh_coba('cek-nim:' || coalesce(p_nim, ''), 10, interval '15 minutes') then
    return 'Terlalu banyak percobaan, coba lagi nanti';
  end if;
  if exists (select 1 from public.profiles where nim = p_nim) then
    return 'NIM sudah terdaftar, silakan masuk';
  end if;
  if not exists (
    select 1 from private.nim_registry r
    where r.nim = p_nim and r.aktif and r.fakultas = p_fakultas and r.prodi = p_prodi
      and lower(trim(r.nama)) = lower(trim(p_nama)) and r.email = lower(trim(p_email))
  ) then
    return 'Data tidak cocok dengan data mahasiswa UT';
  end if;
  return '';
end;
$$;

-- Gerbang utama: akun yang datanya tidak cocok dengan registry gagal dibuat.
-- Email harus milik registry dan "Confirm email" harus aktif, itulah bukti kepemilikan NIM.
create function private.buat_profil() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  r private.nim_registry;
begin
  select * into r from private.nim_registry x
  where x.email = lower(new.email) and x.nim = m ->> 'nim' and x.aktif;
  if not found then
    raise exception 'Data tidak cocok dengan data mahasiswa UT';
  end if;
  insert into public.profiles (id, nim, nama, inisial, fakultas, prodi, semester)
  values (
    new.id, r.nim, r.nama,
    upper(left(regexp_replace(initcap(r.nama), '[^[:upper:]]', '', 'g'), 2)),
    r.fakultas, r.prodi,
    case when (m ->> 'semester') ~ '^[0-9]{1,2}$' then least(greatest((m ->> 'semester')::int, 1), 14) else 1 end
  );
  return new;
end;
$$;
create trigger pengguna_baru after insert on auth.users
  for each row execute function private.buat_profil();

-- ---------- lokasi & mahasiswa sekitar ----------
create function public.set_lokasi(p_lat double precision, p_lng double precision) returns void
language sql security definer set search_path = '' as $$
  insert into private.lokasi (user_id, lat, lng) values ((select auth.uid()), p_lat, p_lng)
  on conflict (user_id) do update set lat = excluded.lat, lng = excluded.lng, diubah = now();
$$;
create function public.lokasi_saya() returns table (lat double precision, lng double precision)
language sql stable security definer set search_path = '' as $$
  select l.lat, l.lng from private.lokasi l where l.user_id = (select auth.uid());
$$;
-- Pengganti API.orang(): tidak mengembalikan koordinat asli, NIM penuh, atau nama sebelum terhubung.
create function public.orang_sekitar()
returns table (
  id uuid, inisial text, nama text, nim text, prodi text, fakultas text, semester smallint,
  mk text[], topik text[], minat text[], waktu text[],
  status text, permintaan_masuk boolean, pos_lat double precision, pos_lng double precision, km numeric
)
language sql stable security definer set search_path = '' as $$
  select
    p.id, p.inisial,
    case when k.status = 'ok' then p.nama else regexp_replace(p.inisial, '(.)', '\1.', 'g') end,
    left(p.nim, 3) || '••••••', p.prodi, p.fakultas, p.semester,
    array(select m.mk from public.profil_mk m where m.user_id = p.id),
    p.topik, p.minat, p.waktu,
    k.status, coalesce(k.status = 'pending' and k.penerima = s.user_id, false),
    l.lat + l.acak_lat, l.lng + l.acak_lng,
    greatest(0.1, round(private.jarak_km(s.lat, s.lng, l.lat + l.acak_lat, l.lng + l.acak_lng)::numeric, 1)) as km
  from private.lokasi s
  join public.profiles p on p.id <> s.user_id
  join private.lokasi l on l.user_id = p.id
  left join public.koneksi k
    on least(k.pemohon, k.penerima) = least(p.id, s.user_id)
    and greatest(k.pemohon, k.penerima) = greatest(p.id, s.user_id)
  -- yang punya koneksi tetap muncul walau disembunyikan, agar permintaan dan chat tidak hilang
  where s.user_id = (select auth.uid()) and (p.tampil_peta or k.id is not null)
  order by km;
$$;
-- Nama pendek untuk grup dan forum, misalnya "Siti N.".
create function public.direktori() returns table (id uuid, nama text, prodi text)
language sql stable security definer set search_path = '' as $$
  select p.id,
    split_part(p.nama, ' ', 1)
      || case when split_part(p.nama, ' ', 2) <> '' then ' ' || left(split_part(p.nama, ' ', 2), 1) || '.' else '' end,
    p.prodi
  from public.profiles p
  where (select auth.uid()) is not null and p.id <> (select auth.uid());
$$;
-- NIM harus lengkap dan hasilnya hanya id. Akun yang disembunyikan tidak ditemukan.
create function public.cari_nim(q text) returns table (hasil text, id uuid)
language plpgsql security definer set search_path = '' as $$
declare
  saya uuid := (select auth.uid());
  ketemu public.profiles;
begin
  if saya is null then
    raise exception 'Silakan masuk dulu';
  end if;
  if q !~ '^[0-9]{9}$' then
    return query select 'none'::text, null::uuid;
    return;
  end if;
  if not private.boleh_coba('cari:' || saya, 20, interval '1 hour') then
    return query select 'limit'::text, null::uuid;
    return;
  end if;
  select * into ketemu from public.profiles p where p.nim = q;
  if not found or (not ketemu.tampil_peta and ketemu.id <> saya) then
    return query select 'none'::text, null::uuid;
  elsif ketemu.id = saya then
    return query select 'self'::text, saya;
  else
    return query select 'ok'::text, ketemu.id;
  end if;
end;
$$;

-- ---------- kelompok belajar ----------
create function private.grup_baru() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.grup_anggota (grup_id, user_id, peran) values (new.id, new.dibuat_oleh, 'admin');
  return new;
end;
$$;
create trigger grup_dibuat after insert on public.grup
  for each row execute function private.grup_baru();

-- Kunci baris grup supaya dua orang tidak bisa melewati kapasitas bersamaan.
create function private.tambah_anggota(g uuid, u uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  kap smallint;
begin
  select kapasitas into kap from public.grup where id = g for update;
  if not found then
    raise exception 'Grup tidak ditemukan';
  end if;
  if (select count(*) from public.grup_anggota where grup_id = g) >= kap then
    raise exception 'Kapasitas penuh';
  end if;
  insert into public.grup_anggota (grup_id, user_id) values (g, u) on conflict do nothing;
end;
$$;
create function public.gabung_grup(g uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if (select gabung from public.grup where id = g) is distinct from 'open' then
    raise exception 'Grup ini tidak terbuka';
  end if;
  perform private.tambah_anggota(g, (select auth.uid()));
end;
$$;
create function public.minta_gabung(g uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if (select gabung from public.grup where id = g) is distinct from 'approval' then
    raise exception 'Grup ini tidak menerima permintaan';
  end if;
  insert into public.grup_permintaan (grup_id, user_id) values (g, (select auth.uid()))
  on conflict do nothing;
end;
$$;
create function public.jawab_permintaan(g uuid, u uuid, terima boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin(g) then
    raise exception 'Hanya admin grup';
  end if;
  delete from public.grup_permintaan where grup_id = g and user_id = u;
  if not found then
    raise exception 'Permintaan tidak ditemukan';
  end if;
  if terima then
    perform private.tambah_anggota(g, u);
  end if;
end;
$$;
create function public.terima_undangan(g uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.grup_undangan where grup_id = g and user_id = (select auth.uid());
  if not found then
    raise exception 'Undangan tidak ditemukan';
  end if;
  perform private.tambah_anggota(g, (select auth.uid()));
end;
$$;
create function public.keluar_grup(g uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  saya uuid := (select auth.uid());
  peran_saya text;
  jumlah int;
begin
  select peran into peran_saya from public.grup_anggota where grup_id = g and user_id = saya;
  if not found then
    raise exception 'Bukan anggota grup';
  end if;
  perform 1 from public.grup where id = g for update;
  select count(*) into jumlah from public.grup_anggota where grup_id = g;
  if jumlah = 1 then
    delete from public.grup where id = g;
    return;
  end if;
  if peran_saya = 'admin'
    and (select count(*) from public.grup_anggota where grup_id = g and peran = 'admin') = 1 then
    raise exception 'Tunjuk admin pengganti sebelum keluar';
  end if;
  delete from public.grup_anggota where grup_id = g and user_id = saya;
end;
$$;
create function public.notif_grup(g uuid, p_isi text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_anggota(g) then
    raise exception 'Bukan anggota grup';
  end if;
  insert into public.notifikasi (user_id, isi)
  select a.user_id, (select nama from public.grup where id = g) || ': ' || left(p_isi, 200)
  from public.grup_anggota a
  where a.grup_id = g and a.user_id <> (select auth.uid());
end;
$$;
-- Polling yang sudah ditutup tidak bisa menerima suara, dan opsi harus milik polling yang sama.
create function public.pilih_opsi(p uuid, o uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  g uuid;
begin
  select grup_id into g from public.grup_polling where id = p and not ditutup;
  if not found or not private.is_anggota(g) then
    raise exception 'Polling tidak tersedia';
  end if;
  if not exists (select 1 from public.polling_opsi where id = o and polling_id = p) then
    raise exception 'Pilihan tidak valid';
  end if;
  insert into public.polling_suara (polling_id, user_id, opsi_id) values (p, (select auth.uid()), o)
  on conflict (polling_id, user_id) do update set opsi_id = excluded.opsi_id;
end;
$$;
