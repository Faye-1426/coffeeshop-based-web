---

# 🧠 Prompt Master: Warcoop Backend Engine (Supabase + PostgreSQL)

## 🎭 Role & Context

Kamu adalah **Senior Backend Architect**.

Saya sedang membangun **Warcoop**, sebuah SaaS POS (Point of Sale) terintegrasi untuk Warkop dengan sistem langganan **Rp100rb/bulan**.

### Tech Stack:

- Frontend: React
- Backend: Supabase (PostgreSQL)

---

## 🎯 Goal

Buatkan **skema database PostgreSQL lengkap** yang mendukung:

- **Multi-tenancy** (banyak toko dalam satu database)
- **RBAC (Role-Based Access Control)** dengan kontrol yang sangat ketat

---

## 👥 Role Definition

### 0️⃣ Super Admin (ID: 0)

- Akses total ke semua tenant
- Akses semua user
- Bisa melihat **total revenue global**

### 1️⃣ Owner (ID: 1)

- Akses penuh hanya ke data Warkop miliknya:
  - Produk
  - Laporan
  - Staff

### 2️⃣ Manager (ID: 2)

- Bisa:
  - Mengelola stok
  - Melihat laporan

- Tidak bisa:
  - Menghapus tenant
  - Mengakses billing

### 3️⃣ Kasir (ID: 3)

- Hanya bisa:
  - Melakukan transaksi
  - Melihat pesanan aktif
  - Membaca menu

---

## 🗂️ Struktur Tabel

### `tenants`

- `id` (PK, disarankan **UUID** untuk keamanan multi-tenant dan konsistensi dengan Supabase)
- `name`
- `slug`
- `sub_status` (active / expired)
- `created_at`

---

### `roles`

- `id` (PK)
- `role_name`

---

### `profiles`

- `id` (FK → auth.users)
- `tenant_id` (FK → tenants, nullable untuk Super Admin)
- `role_id` (FK → roles)
- `full_name`
- `is_active` (boolean)

---

### `products`

- `id`
- `tenant_id`
- `name`
- `category_id` (FK → `categories.id`)
- `price`
- `stock_units` (satuan terkecil / sachet)
- `image_url`
- `badge` (nullable)
- Catatan: **low stock** (badge/warning di UI) tidak wajib kolom DB — tetapkan ambang dan aturan di **logic aplikasi** (mis. konstanta default, rules per tenant via env/config/backend terpisah nanti), dengan membandingkan `stock_units` terhadap nilai itu.

---

### `categories`

- `id`
- `tenant_id`
- `name`
- `created_at`

---

### `orders`

- `id`
- `tenant_id`
- `table_number`
- `status` (pending, preparing, served, completed, cancelled)
- `total_price`
- `customer_name` (nullable)
- `created_at`

---

### `order_items`

- `id`
- `order_id`
- `tenant_id`
- `product_id`
- `line_item_name` (snapshot nama product saat transaksi)
- `quantity`
- `unit_price_at_sale` (harga per unit saat transaksi)

---

### `transactions`

- `id`
- `tenant_id`
- `order_id` (FK → `orders`, **nullable** untuk fleksibilitas transaksi tanpa order di masa depan; pada alur penutupan order dari POS, **wajib diisi** mengacu ke order yang diselesaikan)
- `payment_method` (cash, qris, bon)
- `amount_paid`
- `change_amount` (0 jika non-tunai atau tidak ada kembalian)
- `customer_name` (nullable)
- `status` (paid, unpaid) — **sumber kebenaran**; `is_paid` dapat diselaraskan lewat trigger/generated column agar tidak drift
- `is_paid` (derived dari `status` untuk backward compatibility; opsional)
- `created_at`

---

### `outstanding`

- `id`
- `tenant_id`
- `customer_name`
- `amount`
- `due_date`
- `transaction_id` (FK → `transactions.id`)

---

## 💳 Alur transaksi POS & pembayaran (MVP tanpa payment gateway)

Scope MVP **tidak** mencakup integrasi payment gateway (Midtrans, Xendit, dll.). Pencatatan pembayaran dilakukan **manual** sesuai metode di bawah.

### Alur status order

- `pending` → `preparing` → `served` → `completed`

### Penutupan order harus melalui bukti pembayaran

- **Jangan** men-set `orders.status = completed` hanya dengan tombol “selesai” tanpa jejak pembayaran.
- Alur yang disarankan (**alur kasir terpisah**): setelah order berstatus `served`, kasir membuka **UI pembayaran** (modal/screen), mengisi metode dan nominal, lalu sistem:
  1. **INSERT** ke `transactions` (dengan `order_id` terisi untuk order tersebut).
  2. Jika metode **BON / piutang**: transaksi dicatat `status = unpaid`, lalu **INSERT** ke `outstanding` (tautkan `transaction_id`, `due_date`, `amount`, `customer_name` sesuai kebutuhan).
  3. Setelah transaksi (dan outstanding jika ada) sukses, **UPDATE** `orders.status` ke `completed`.

Urutan konsisten: **transaksi dulu**, baru order `completed`.

### Pemetaan metode (referensi)

- **Tunai / QRIS**: umumnya `status = paid` pada `transactions`; `change_amount` relevan untuk tunai.
- **BON**: `status = unpaid` pada `transactions` + baris `outstanding` untuk piutang.

---

## ⚙️ Persyaratan Logika Teknis

### 🔐 Row Level Security (RLS)

- **Super Admin (Role 0)**:
  - Harus bisa **bypass semua policy**
  - Bisa akses semua data lintas tenant

- **Role lainnya (1, 2, 3)**:
  - Hanya bisa akses data dengan:

    ```sql
    tenant_id = profiles.tenant_id
    ```

---

### 🔑 RBAC — nuansa per tabel (pelengkap policy)

Tanpa menyalin seluruh SQL di sini, desain policy perlu membedakan **Owner / Manager / Kasir** secara granular (bukan hanya filter tenant):

- **`categories` / `products`**: create/update/delete mengikuti aturan bisnis (umumnya **Owner & Manager** mengelola master data; **Kasir** tidak mengubah kategori/produk — selaras kebijakan RLS aktual di migrasi).
- **`orders` / `order_items` / `transactions`**: **Kasir** dapat membuat/memperbarui sesuai alur POS (termasuk mencatat pembayaran).
- **`outstanding`**: insert/update/delete mengikuti peran (mis. pencatatan BON saat checkout dapat melibatkan **Kasir** — selaras migrasi tambahan jika ada, contoh: `supabase/migrations/*outstanding*`.)

---

### ⚡ Trigger Otomatis (Auto Profile)

- Saat ada user baru di `auth.users`
- Otomatis insert ke tabel `profiles`

---

### 📊 Global Revenue & agregat Super Admin

- Buat **View** atau **RPC `SECURITY DEFINER`** yang berisi metrik untuk Super Admin, mis.:
  - Total Tenant
  - Total Transaksi Global (paid)
  - Total Revenue Global

**Catatan keamanan:** RPC terpusat untuk agregat lintas tenant dapat lebih aman daripada hanya mengandalkan view publik; pastikan hanya **Super Admin** yang boleh mengeksekusi (cek `profiles` di dalam fungsi).

---

### 📦 Stock Logic (Penting)

- Buat **function + trigger**
- Setiap ada `INSERT` di `order_items`:
  - Otomatis mengurangi `products.stock_units` untuk tenant yang sama (`order_items.tenant_id = products.tenant_id`)
  - Pastikan pengurangan memakai `order_items.quantity` (bukan total harga)
- **Low stock** hanya indikator UI/bisnis: jangan simpan threshold di `products` kecuali nanti ada kebutuhan eksplisit; cukup kurangi `stock_units` secara akurat, lalu aplikasi yang menentukan kapan tampil peringatan.

---

### 🔄 Sinkron `is_paid` dengan `status` (transaksi)

- Pilih **satu sumber kebenaran** (`status`); selaraskan `is_paid` lewat trigger atau generated column agar tidak drift.

---

## 🌐 Integrasi klien & lingkungan Supabase

- **Supabase Auth** (`auth.users`) dipasangkan dengan **`profiles`** (trigger auto-profile setelah registrasi).
- **Variabel lingkungan klien (Vite)**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — hanya **anon key** di bundle browser.
- **Service role key** hanya untuk server/CI/skrip admin; **jangan** memasukkan ke prefix `VITE_*` atau ke repo publik.
- **Migrasi** disimpan berurutan di folder `supabase/migrations/` (disiplin semver/nama file untuk tim).

---

## 👤 Operasional & onboarding

- User baru: dapat memperoleh baris **`profiles`** otomatis dengan default (mis. peran kasir, `tenant_id` null) sampai **admin** menetapkan `tenant_id` dan `role_id` (SQL atau tooling internal).
- **Konfirmasi email (Supabase Auth)** bersifat **opsional per project**. Di dashboard Supabase (Authentication → Providers → Email), opsi **Confirm email** dapat **dimatikan**; jika dimatikan, pengguna boleh login tanpa klik link verifikasi dan error **"Email not confirmed"** tidak berlaku. **Validasi / wajib konfirmasi email tidak perlu dijadikan asumsi tetap** dalam dokumen ini — tim dapat memilih mode dev/staging tanpa konfirmasi; untuk production, pertimbangkan keamanan vs UX secara terpisah (bukan bagian DDL).

---

## 🏷️ Identitas & kode tampilan

- Gunakan **UUID** sebagai PK publik untuk entitas utama (`tenants`, `categories`, `products`, `orders`, `transactions`, …) agar aman di multi-tenant dan selaras Supabase.
- Kode ramah manusia (mis. `ORD-XXXXXXXX`) dapat **diderivasi di UI** dari UUID (prefix + potongan karakter), tanpa wajib menambah kolom `code` di MVP kecuali ada kebutuhan eksplisit nanti.

---

## 📤 Output yang Diminta

### 1. Database Schema (DDL)

- Semua tabel
- Relasi (FK)
- Constraints

---

### 2. RLS Policies

- Policy untuk:
  - Super Admin (bypass)
  - Tenant-based access
  - **Granular** per operasi (INSERT/UPDATE/DELETE) sesuai Owner / Manager / Kasir di tabel relevan

---

### 3. Trigger & Function

- Auto-create profile saat user baru
- Auto-reduce stock saat order_items insert
- (Opsional) sinkron `is_paid` ↔ `status` pada `transactions`

---

### 4. Query Contoh

- Query untuk Super Admin melihat:
  - Total revenue semua warkop
- (Opsional) Contoh pemanggilan RPC agregat global jika dipakai

---

## 🚀 Expected Result

Output harus:

- Production-ready
- Aman (secure multi-tenant)
- Mudah diintegrasikan dengan Supabase
- Scalable untuk SaaS POS system

---
