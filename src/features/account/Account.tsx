import { usePosRole } from "../../components/layout/usePosRole";
import { useTenant } from "../../lib/supabase/TenantContext";
import CafeAdminAccountNotice from "./components/CafeAdminAccountNotice";
import SuperAdminAccountView from "./components/SuperAdminAccountView";

export default function Account() {
  const { role } = usePosRole();
  const { isSupabase, profile } = useTenant();

  if (isSupabase && profile) {
    if (profile.role_id === 0 && profile.tenant_id === null) {
      return <SuperAdminAccountView />;
    }
    return <CafeAdminAccountNotice liveMode />;
  }

  if (role === "cafe") {
    return <CafeAdminAccountNotice />;
  }

  return <SuperAdminAccountView />;
}
