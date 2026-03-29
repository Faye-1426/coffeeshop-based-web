import { Navigate, Outlet, useLocation } from "react-router-dom";
import PosTopNavbar from "./PosTopNavbar";
import { PosRoleProvider } from "./PosRoleProvider";
import { useTenant } from "../../lib/supabase/TenantContext";

function PosAccessGate({ children }: { children: React.ReactNode }) {
  const { isSupabase, loading, session, profile } = useTenant();
  const location = useLocation();

  if (!isSupabase) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-neutral-50 text-neutral-600 text-sm font-semibold">
        Memuat sesi…
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!profile) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-neutral-50 px-6 text-center">
        <p className="text-sm text-neutral-700 max-w-md">
          Profil tidak ditemukan. Pastikan migrasi dan trigger{" "}
          <code className="text-xs">handle_new_user</code> aktif di Supabase.
        </p>
      </div>
    );
  }

  if (profile.role_id === 0 && profile.tenant_id === null) {
    if (location.pathname === "/pos/account") {
      return <>{children}</>;
    }
    return <Navigate to="/pos/account" replace />;
  }

  if (profile.tenant_id === null) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-neutral-50 px-6 text-center">
        <p className="text-sm text-neutral-700 max-w-md">
          Akun Anda belum ditetapkan ke outlet. Hubungi super admin untuk
          mengisi <strong>tenant_id</strong> dan peran di tabel{" "}
          <code className="text-xs">profiles</code> (lihat{" "}
          <code className="text-xs">supabase/VERIFY.md</code>).
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

export default function PosLayout() {
  return (
    <PosAccessGate>
      <PosRoleProvider>
        <div className="min-h-dvh bg-neutral-50 text-neutral-900 flex flex-col">
          <PosTopNavbar />
          <main className="flex-1 px-10 py-6">
            <Outlet />
          </main>
        </div>
      </PosRoleProvider>
    </PosAccessGate>
  );
}
