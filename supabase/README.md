# Backend Supabase UTConnect

Isi folder ini belum dijalankan ke project mana pun.

| File | Isi |
|---|---|
| `migrations/..._skema.sql` | Tabel |
| `migrations/..._fungsi.sql` | Fungsi backend: verifikasi NIM, jarak, grup, polling |
| `migrations/..._keamanan.sql` | Hak akses, RLS, realtime, storage |
| `seed.sql` | Data master: fakultas, prodi, mata kuliah |
| `nim_registry.contoh.csv` | Format data mahasiswa dari UT |

## Menjalankan

1. Buat project di Supabase, region Singapore.
2. Di root repo:

   ```
   supabase init
   supabase login
   supabase link --project-ref <project-ref>
   supabase db push --include-seed
   ```

   Kalau `supabase init` menanyakan folder yang sudah ada, pertahankan isi `migrations/`.

3. Di dashboard, buka **Authentication > Sign In / Providers > Email** dan pastikan **Confirm email** aktif.
   Verifikasi NIM bergantung pada ini: NIM dan nama bukan rahasia, jadi yang membuktikan
   pemiliknya adalah akses ke email kampus.
4. Di **Authentication > URL Configuration**, isi **Site URL** dengan alamat Vercel.
5. Isi SMTP sendiri di **Authentication > SMTP**. SMTP bawaan Supabase dibatasi dan tidak untuk production.

## Mengisi data mahasiswa

Data asli jangan masuk repo. Taruh di `supabase/data/`, folder itu sudah ada di `.gitignore`.

Kolom CSV mengikuti `nim_registry.contoh.csv`. Nama fakultas dan prodi harus persis sama dengan
`seed.sql`, dan email harus huruf kecil. Impor lewat koneksi database dari dashboard:

```
psql "$SUPABASE_DB_URL" -c "\copy private.nim_registry (nim, nama, email, fakultas, prodi) from 'supabase/data/nim_registry.csv' csv header"
```

Tabel `private` tidak muncul di API Supabase, jadi `\copy` ini cara mengisinya.

## Aturan untuk kode klien

- Hanya pakai anon key di browser. `service_role` key jangan pernah masuk ke frontend.
- Daftar: `cek_nim()`, lalu `auth.signUp({ email, password, options: { data: { nim, semester } } })`.
  Pin disimpan dengan `set_lokasi()` setelah email dikonfirmasi dan pengguna login.
- Login memakai email kampus dan kata sandi.
- Data mahasiswa lain hanya lewat `orang_sekitar()`, `direktori()`, dan `cari_nim()`.
- Terima connect: update `koneksi.status` menjadi `ok`. Tolak: delete baris `koneksi`.
- Batas percobaan: `cek_nim()` 10 kali per NIM per 15 menit dan 30 kali per IP per jam,
  `cari_nim()` 20 kali per akun per jam. Saat kena batas, `cek_nim()` mengembalikan pesan error
  dan `cari_nim()` mengembalikan `hasil = 'limit'`.
- Pemanggilan `auth.signUp` langsung tidak melewati `cek_nim()`, jadi atur juga batas signup
  di **Authentication > Rate Limits**.
- Masuk grup lewat `gabung_grup()`, `minta_gabung()`, `jawab_permintaan()`, dan `terima_undangan()`.
  Keluar lewat `keluar_grup()`, suara polling lewat `pilih_opsi()`.
- Link meeting ada di `grup_link`, hanya terbaca oleh anggota.
- Akun Dosen dan Staff UT mengisi `info_post` lewat dashboard atau `service_role`.
