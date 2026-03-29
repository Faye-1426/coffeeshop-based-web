-- Optional: jalankan manual setelah migrasi untuk data lokal/staging saja.
-- Jangan commit secret atau data production ke repo.

-- Contoh tenant demo (dapatkan UUID setelah insert untuk mengaitkan profil staff):
-- INSERT INTO public.tenants (name, slug) VALUES ('Warcoop Demo', 'warcoop-demo') RETURNING id;
--
-- Contoh jadikan user staff sebagai owner outlet (ganti :user_id dan :tenant_id):
-- UPDATE public.profiles SET tenant_id = :tenant_id, role_id = 1 WHERE id = :user_id;
