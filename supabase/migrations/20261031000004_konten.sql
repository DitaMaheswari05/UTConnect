-- Urutan pilihan polling mengikuti yang ditulis pembuatnya.
alter table public.polling_opsi add column urutan smallint not null default 0;

-- Nama penulis diambil dari profil, supaya mahasiswa tidak bisa memakai nama orang atau instansi lain.
create function private.isi_penulis() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.penulis is not null then
    new.nama_penulis := (select nama from public.profiles where id = new.penulis);
  end if;
  return new;
end;
$$;
create trigger info_penulis before insert on public.info_post
  for each row execute function private.isi_penulis();
