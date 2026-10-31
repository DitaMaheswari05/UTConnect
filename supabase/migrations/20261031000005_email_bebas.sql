-- Email pendaftaran bebas. Yang dicocokkan dengan registry: NIM, nama, fakultas, dan prodi.
alter table private.nim_registry alter column email drop not null;

drop function public.cek_nim(text, text, text, text, text);
create function public.cek_nim(p_nim text, p_nama text, p_fakultas text, p_prodi text)
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
      and lower(trim(r.nama)) = lower(trim(p_nama))
  ) then
    return 'Data tidak cocok dengan data mahasiswa UT';
  end if;
  return '';
end;
$$;
revoke execute on function public.cek_nim(text, text, text, text) from public, anon, authenticated;
grant execute on function public.cek_nim(text, text, text, text) to anon, authenticated;

-- Gerbang utama: pemanggilan auth.signUp langsung tidak melewati cek_nim(), jadi datanya diperiksa lagi di sini.
create or replace function private.buat_profil() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  r private.nim_registry;
begin
  select * into r from private.nim_registry x
  where x.nim = m ->> 'nim' and x.aktif and x.fakultas = m ->> 'fakultas' and x.prodi = m ->> 'prodi'
    and lower(trim(x.nama)) = lower(trim(m ->> 'nama'));
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
