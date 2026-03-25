import { Outlet } from "react-router-dom";
import PosTopNavbar from "./PosTopNavbar";
import { PosRoleProvider } from "./PosRoleProvider";

export default function PosLayout() {
  return (
    <PosRoleProvider>
      <div className="min-h-dvh bg-neutral-50 text-neutral-900 flex flex-col">
        <PosTopNavbar />
        <main className="flex-1 px-10 py-6">
          <Outlet />
        </main>
      </div>
    </PosRoleProvider>
  );
}
