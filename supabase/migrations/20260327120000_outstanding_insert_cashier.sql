-- Izinkan kasir mencatat BON (outstanding) saat pembayaran order di POS.

DROP POLICY IF EXISTS outstanding_write_manager ON public.outstanding;

CREATE POLICY outstanding_write_manager ON public.outstanding
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_super_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.current_role_id() IN (1, 2, 3)
    )
  );
