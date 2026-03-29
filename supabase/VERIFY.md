# Verifikasi SQL (manual)

Jalankan setelah migrasi `migrations-v4-29032026.sql` diterapkan.

## 1. Role ter-seed

```sql
SELECT * FROM public.roles ORDER BY id;
```

Harus ada baris id `0..3`.

## 2. Registrasi user → profil otomatis

- Daftar user baru lewat Supabase Auth (signup di app atau dashboard).
- Cek:

```sql
SELECT id, tenant_id, role_id, full_name FROM public.profiles ORDER BY full_name;
```

Baris baru untuk `id = auth.users.id`, default `role_id = 3`, `tenant_id` null sampai di-assign.

## 3. Tenant & assign staff

1. Buat tenant (hanya super admin / service role jika RLS membatasi — atau sementara matikan RLS hanya untuk bootstrap di environment dev):

```sql
INSERT INTO public.tenants (name, slug) VALUES ('Outlet Demo', 'outlet-demo') RETURNING id;
```

2. Promosikan satu user menjadi owner outlet:

```sql
UPDATE public.profiles
SET tenant_id = '<tenant_uuid>', role_id = 1
WHERE id = '<user_uuid>';
```

## 4. Isolasi tenant (RLS)

- Login sebagai user tenant A di aplikasi.
- Pastikan `SELECT * FROM categories` hanya mengembalikan baris `tenant_id` milik A.
- Ulangi dengan user tenant B — tidak melihat data A.

## 5. Stok turun saat `order_items`

Dengan user yang punya akses insert order + line item:

1. Buat kategori + produk di tenant tersebut (stock awal mis. 100).
2. Buat order `pending` + satu `order_items` dengan `quantity` kecil.
3. Cek `products.stock_units` berkurang sesuai `quantity`.
4. Coba `quantity` melebihi stok — insert harus gagal dengan error stok.

## 6. Agregat global (super admin)

Login sebagai profil super admin (`role_id = 0`, `tenant_id` null), lalu panggil dari klien atau SQL:

```sql
SELECT public.rpc_admin_global_stats();
```

User non–super admin harus mendapat error `forbidden`.

## 7. Contoh total revenue global (SQL editor, super admin session)

```sql
SELECT coalesce(sum(amount_paid), 0) AS revenue
FROM public.transactions
WHERE status = 'paid';
```

Tanpa hak super admin, RLS akan membatasi baris transaksi ke tenant masing-masing.
