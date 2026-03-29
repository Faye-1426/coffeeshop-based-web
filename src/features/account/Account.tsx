import { usePosRole } from "../../components/layout/usePosRole";
import CafeAdminAccountNotice from "./components/CafeAdminAccountNotice";
import SuperAdminAccountView from "./components/SuperAdminAccountView";

export default function Account() {
  const { role } = usePosRole();

  if (role === "cafe") {
    return <CafeAdminAccountNotice />;
  }

  return <SuperAdminAccountView />;
}
