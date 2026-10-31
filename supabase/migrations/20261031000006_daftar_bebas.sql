-- Pendaftaran bebas: NIM tidak lagi dicocokkan dengan nim_registry. Syaratnya hanya 9 digit dan belum dipakai.
-- Parameter lain dipertahankan supaya frontend yang sudah ter-deploy tetap bisa memanggil fungsi ini.
create or replace function public.cek_nim(p_nim text, p_nama text, p_fakultas text, p_prodi text)
returns text language plpgsql security definer set search_path = '' as $$
begin
  if not private.boleh_coba('cek-ip:' || private.ip_klien(), 30, interval '1 hour') then
    return 'Terlalu banyak percobaan, coba lagi nanti';
  end if;
  if coalesce(p_nim, '') !~ '^[0-9]{9}$' then
    return 'NIM harus 9 digit';
  end if;
  if exists (select 1 from public.profiles where nim = p_nim) then
    return 'NIM sudah terdaftar, silakan masuk';
  end if;
  return '';
end;
$$;

-- Fakultas dan prodi tetap divalidasi oleh foreign key di profiles.
create or replace function private.buat_profil() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  n text := trim(coalesce(m ->> 'nama', ''));
begin
  if coalesce(m ->> 'nim', '') !~ '^[0-9]{9}$' or n = '' then
    raise exception 'Data pendaftaran tidak lengkap';
  end if;
  insert into public.profiles (id, nim, nama, inisial, fakultas, prodi, semester)
  values (
    new.id, m ->> 'nim', n,
    coalesce(nullif(upper(left(regexp_replace(initcap(n), '[^[:upper:]]', '', 'g'), 2)), ''), '?'),
    m ->> 'fakultas', m ->> 'prodi',
    case when (m ->> 'semester') ~ '^[0-9]{1,2}$' then least(greatest((m ->> 'semester')::int, 1), 14) else 1 end
  );
  return new;
end;
$$;
