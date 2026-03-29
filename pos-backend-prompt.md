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

- `id` (PK)
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
- `order_id`
- `payment_method` (cash, qris, bon)
- `amount_paid`
- `change_amount` (0 jika cashless / bon)
- `customer_name` (nullable)
- `status` (paid, unpaid)
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

### ⚡ Trigger Otomatis (Auto Profile)

- Saat ada user baru di `auth.users`
- Otomatis insert ke tabel `profiles`

---

### 📊 Global Revenue View

Buat **View khusus untuk Super Admin** yang berisi:

- Total Tenant
- Total Transaksi Global
- Total Revenue Global

---

### 📦 Stock Logic (Penting)

- Buat **function + trigger**
- Setiap ada `INSERT` di `order_items`:
  - Otomatis mengurangi `products.stock_units` untuk tenant yang sama (`order_items.tenant_id = products.tenant_id`)
  - Pastikan pengurangan memakai `order_items.quantity` (bukan total harga)
- **Low stock** hanya indikator UI/bisnis: jangan simpan threshold di `products` kecuali nanti ada kebutuhan eksplisit; cukup kurangi `stock_units` secara akurat, lalu aplikasi yang menentukan kapan tampil peringatan.

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

---

### 3. Trigger & Function

- Auto-create profile saat user baru
- Auto-reduce stock saat order_items insert

---

### 4. Query Contoh

- Query untuk Super Admin melihat:
  - Total revenue semua warkop

---

## 🚀 Expected Result

Output harus:

- Production-ready
- Aman (secure multi-tenant)
- Mudah diintegrasikan dengan Supabase
- Scalable untuk SaaS POS system

---
