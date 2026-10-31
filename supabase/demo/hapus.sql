-- Menghapus semua data demo. Profil, lokasi, koneksi, dan forumnya ikut terhapus lewat on delete cascade.
delete from public.grup where id::text like 'de000000-%';
delete from public.info_post where id::text like 'de000000-%';
delete from auth.users where email like '%@demo.utconnect.test';
delete from private.nim_registry where email like '%@demo.utconnect.test';
