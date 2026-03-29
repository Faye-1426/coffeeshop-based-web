import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Building2,
  ChevronDown,
  Coffee,
  CreditCard,
  LayoutDashboard,
  Settings,
} from "lucide-react";
import UserMenuDropdown from "./UserMenuDropdown";
import { useTenant } from "../../features/tenants/context/TenantContext";
import { useSuperTenantsQuery } from "../../hooks/useSuperAdminQueries";

const links = [
  { to: "/pos/super/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { to: "/pos/super/tenants", label: "Tenants", Icon: Building2 },
  { to: "/pos/super/subscriptions", label: "Subscriptions", Icon: CreditCard },
  { to: "/pos/super/settings", label: "Settings", Icon: Settings },
] as const;

function linkClass(isActive: boolean): string {
  return [
    "inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition",
    isActive
      ? "bg-red-600 text-white shadow-sm"
      : "text-neutral-700 hover:bg-white border border-transparent",
  ].join(" ");
}

export default function SuperAdminTopNavbar() {
  const { tenantName } = useTenant();
  const navigate = useNavigate();
  const tenantsQuery = useSuperTenantsQuery();
  const tenants = (tenantsQuery.data ?? []).filter((t) => !t.is_owner);
  const [tenantMenuOpen, setTenantMenuOpen] = useState(false);
  const tenantWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tenantMenuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!tenantWrapRef.current?.contains(e.target as Node)) {
        setTenantMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [tenantMenuOpen]);

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/80">
      <div className="flex flex-col gap-3 px-10 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white shadow-sm"
            aria-hidden
          >
            <Coffee className="h-5 w-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-extrabold text-neutral-900 leading-tight">
              Warcoop
            </span>
            <span className="text-xs font-bold text-amber-800">Super Admin</span>
          </div>
        </div>

        <nav
          className="no-scrollbar flex gap-2 overflow-x-auto pb-1 sm:pb-0 -mx-1 px-1"
          aria-label="Super admin navigation"
        >
          {links.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => linkClass(isActive)}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2 shrink-0 sm:pl-2">
          <div className="relative" ref={tenantWrapRef}>
            <button
              type="button"
              onClick={() => setTenantMenuOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-2 text-sm font-bold text-neutral-800 hover:bg-neutral-50"
            >
              <Building2 className="h-4 w-4 text-neutral-500" aria-hidden />
              <span className="max-w-[140px] truncate">Outlet: {tenantName ?? "—"}</span>
              <ChevronDown
                className={`h-4 w-4 text-neutral-500 transition ${tenantMenuOpen ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>
            {tenantMenuOpen ? (
              <div className="absolute right-0 top-[calc(100%+8px)] z-50 max-h-72 w-64 overflow-y-auto rounded-2xl border border-neutral-200 bg-white py-2 shadow-xl">
                <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-neutral-500">
                  Buka ringkasan outlet
                </div>
                {tenantsQuery.isPending ? (
                  <p className="px-3 py-2 text-sm text-neutral-500">Memuat…</p>
                ) : tenants.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-neutral-500">Tidak ada outlet.</p>
                ) : (
                  tenants.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className="flex w-full px-3 py-2.5 text-left text-sm font-semibold text-neutral-800 hover:bg-neutral-100"
                      onClick={() => {
                        setTenantMenuOpen(false);
                        navigate(`/pos/super/tenants/${t.id}/account`);
                      }}
                    >
                      {t.name}
                    </button>
                  ))
                )}
              </div>
            ) : null}
          </div>
          <UserMenuDropdown />
        </div>
      </div>
    </header>
  );
}
