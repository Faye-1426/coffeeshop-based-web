# Supabase (Warcoop POS)

## Isi folder

- `migrations/` — skema PostgreSQL, RLS, trigger, fungsi agregat super admin, seed roles (file gabungan: `migrations-v4-29032026.sql`), plus **customer marketplace** RPC (`20260328120000_customer_marketplace_rpc.sql`): `rpc_customer_menu`, `rpc_customer_create_order` (eksekusi untuk role `anon` + `authenticated`).
- `seed.sql` — contoh SQL manual (tenant / assign profil); tidak dijalankan otomatis oleh migrasi.
- `config.toml` — placeholder `project_id` untuk Supabase CLI (`supabase link`).

## Langkah awal

1. Buat project di [Supabase](https://supabase.com).
2. Salin URL project dan **anon key** ke `.env` lokal (lihat root `.env.example`):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Di **SQL Editor**, jalankan isi file `migrations/migrations-v4-29032026.sql` sekali (atau pakai CLI `supabase db push` jika sudah `supabase link`).
4. Buat tenant pertama dan assign user ke tenant (lihat `seed.sql` / `VERIFY.md`).

## Catatan keamanan

- **Service role key** hanya untuk skrip server/CI — jangan masukkan ke variabel `VITE_*` atau bundle browser.
- Super admin (role `0`, `tenant_id` null) tidak memakai POS outlet dalam skenario MVP klien: modul POS mengasumsikan `tenant_id` terisi untuk staff outlet.
- **anon vs authenticated**: kebijakan RLS pada migrasi memakai role `authenticated`. Pengguna yang tidak login tidak memperoleh baris bisnis; tetap audit di Dashboard Supabase → Authentication → Policies jika menambah policy untuk `anon`.
- **Onboarding staff**: setelah user mendaftar (`auth.users` + baris `profiles` dari trigger), super admin menjalankan SQL seperti di `seed.sql` / `VERIFY.md` untuk `INSERT tenants` dan `UPDATE profiles SET tenant_id, role_id`.
- **Backup & migrasi**: gunakan urutan file `supabase/migrations/*.sql`; untuk production, terapkan lewat Supabase CLI atau SQL editor dengan review; simpan cadangan sebelum migrasi destruktif.
