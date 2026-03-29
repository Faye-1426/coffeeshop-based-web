import { Navigate } from "react-router-dom";
import { useTenant } from "../lib/supabase/TenantContext";
import Dashboard from "../features/dashboard/Dashboard";

export default function PosIndexRedirect() {
  const { isSupabase, isSuperAdmin } = useTenant();
  if (isSupabase && isSuperAdmin) {
    return <Navigate to="/pos/super/dashboard" replace />;
  }
  return <Dashboard />;
}
