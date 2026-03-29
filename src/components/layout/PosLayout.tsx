import { Navigate, Outlet, useLocation } from "react-router-dom";
import PosTopNavbar from "./PosTopNavbar";
import SuperAdminTopNavbar from "./SuperAdminTopNavbar";
import OutletSubscriptionGate from "./OutletSubscriptionGate";
import { PosRoleProvider } from "../../store/PosRoleProvider";
import { useTenant } from "../../lib/supabase/TenantContext";

function PosAccessGate({ children }: { children: React.ReactNode }) {
  const { isSupabase, loading, session, profile, isSuperAdmin } = useTenant();

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

  if (!isSuperAdmin && profile.tenant_id === null) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-neutral-50 px-6 text-center">
        <p className="text-sm text-neutral-700 max-w-md">
          Akun Anda belum ditetapkan ke outlet. Hubungi super admin untuk
          mengisi <strong>tenant_id</strong> dan peran di tabel{" "}
          <code className="text-xs">profiles</code>.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

function PosLayoutShell() {
  const { isSupabase, isSuperAdmin } = useTenant();
  const location = useLocation();

  if (isSupabase && isSuperAdmin) {
    if (!location.pathname.startsWith("/pos/super")) {
      return <Navigate to="/pos/super/dashboard" replace />;
    }
    return (
      <div className="min-h-dvh bg-neutral-50 text-neutral-900 flex flex-col">
        <SuperAdminTopNavbar />
        <main className="flex-1 px-10 py-6">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-neutral-50 text-neutral-900 flex flex-col">
      <PosTopNavbar />
      <main className="flex-1 px-10 py-6">
        <OutletSubscriptionGate />
      </main>
    </div>
  );
}

export default function PosLayout() {
  return (
    <PosAccessGate>
      <PosRoleProvider>
        <PosLayoutShell />
      </PosRoleProvider>
    </PosAccessGate>
  );
}
