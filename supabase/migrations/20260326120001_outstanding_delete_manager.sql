-- Allow manager + owner to remove settled outstanding rows (e.g. after marking BON paid).

DROP POLICY IF EXISTS outstanding_delete_owner ON public.outstanding;

CREATE POLICY outstanding_delete_owner ON public.outstanding
  FOR DELETE TO authenticated
  USING (
    public.is_super_admin()
    OR (
      tenant_id = public.current_tenant_id()
      AND public.current_role_id() IN (1, 2)
    )
  );
