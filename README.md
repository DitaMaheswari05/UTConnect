# UTConnect

Platform peer learning untuk mahasiswa Universitas Terbuka. Mahasiswa bisa menemukan teman belajar di
sekitarnya tanpa membuka alamat rumah, lalu terhubung, berdiskusi, dan belajar bersama dalam kelompok.

## Fitur

- **Peta mahasiswa sekitar:** posisi diacak sekitar 300 m, yang terlihat hanya inisial, prodi, dan jarak estimasi.
- **Connect:** nama lengkap dan chat terbuka setelah kedua pihak saling terhubung.
- **Matching akademik:** cari teman berdasarkan mata kuliah, topik, minat, dan waktu belajar.
- **Chat pribadi:** realtime, hanya untuk yang sudah terhubung.
- **Forum:** minta atau tawarkan bantuan per mata kuliah.
- **Kelompok belajar:** chat, jadwal, target, tugas, polling, catatan, materi, dan pengelolaan anggota.
- **Info Hub:** lomba, loker, seminar, dan info kampus, bisa dibaca tanpa akun.

## Teknologi

| Bagian | Yang dipakai |
|---|---|
| Frontend | HTML, CSS, dan JavaScript murni, tanpa framework |
| Backend | Supabase: Postgres, Auth, Realtime, Storage |
| Keamanan data | Row Level Security dan fungsi database |
| Hosting | Vercel |

## Struktur folder

```
html/               Halaman utama
css/                Gaya tampilan
js/core/            API, state, router, dan utilitas
js/data/            Data akademik statis
js/views/           Layar peta, matching, forum, info, chat, profil
js/grup/            Modul kelompok belajar
scripts/            Pembuat js/core/config.js dari .env
supabase/           Migrasi, seed, dan data demo
vercel.json         Pengaturan build dan deploy
```

Seluruh akses data lewat [js/core/api.js](js/core/api.js).

## Menjalankan di lokal

Yang dibutuhkan: Node.js 20.6 atau lebih baru, dan project Supabase.
[Supabase CLI](https://supabase.com/docs/guides/cli) dan `psql` dibutuhkan untuk migrasi dan data demo.

1. Salin `.env.example` menjadi `.env`, lalu isi nilainya dari dashboard Supabase.
2. Jalankan migrasi dan data master:

   ```
   supabase db push --db-url "<SUPABASE_DB_URL>" --include-seed
   ```

3. Buat konfigurasi frontend:

   ```
   node --env-file=.env scripts/buat-config.mjs
   ```

4. Jalankan server lokal, lalu buka `http://localhost:3000/html/index.html`:

   ```
   npx serve -l 3000 .
   ```

Perintah di langkah 3 perlu dijalankan ulang setiap `SUPABASE_URL` atau `SUPABASE_PUBLISHABLE_KEY` berubah.

Data contoh bisa diisi dengan perintah berikut. Hapus lewat `supabase/demo/hapus.sql` sebelum production.

```
node --env-file=.env supabase/demo/muat.mjs
```

## Deploy ke Vercel

1. Import repo ini di Vercel. Pengaturan build sudah ada di [vercel.json](vercel.json).
2. Isi environment variable `SUPABASE_URL` dan `SUPABASE_PUBLISHABLE_KEY`.
3. Di Supabase, isi **Site URL** dan **Redirect URLs** pada **Authentication > URL Configuration** dengan alamat
   Vercel.

Setiap push ke `main` otomatis di-deploy.

## Konfigurasi dan keamanan

- Semua rahasia hanya ada di `.env`, yang tidak masuk repo. Jangan menaruh kunci secret, password database, atau
  `SUPABASE_DB_URL` di frontend maupun di environment Vercel.
- `js/core/config.js` dibuat otomatis dan hanya berisi URL project dan publishable key. Keduanya memang publik;
  data dilindungi oleh Row Level Security.
- Koordinat asli disimpan di skema `private` yang tidak bisa dibaca klien.

## Batasan saat ini

Pendaftaran masih bebas: NIM hanya harus 9 digit dan belum dipakai, tanpa dicocokkan dengan data resmi UT, jadi
aplikasi belum bisa menjamin penggunanya mahasiswa UT. Tabel `private.nim_registry` sudah tersedia kalau
verifikasi ingin diaktifkan lagi.

Penjelasan backend dan aturan untuk kode klien ada di [supabase/README.md](supabase/README.md).
