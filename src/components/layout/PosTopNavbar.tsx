import { NavLink } from "react-router-dom";
import {
  CircleAlert,
  ClipboardList,
  Coffee,
  LayoutDashboard,
  Package,
  Receipt,
  Tags,
  User,
} from "lucide-react";
import UserMenuDropdown from "./UserMenuDropdown";
import { useTenant } from "../../lib/supabase/TenantContext";

const links = [
  { to: "/pos", label: "Dashboard", end: true, Icon: LayoutDashboard },
  { to: "/pos/categories", label: "Categories", end: false, Icon: Tags },
  { to: "/pos/products", label: "Products", end: false, Icon: Package },
  { to: "/pos/orders", label: "Orders", end: false, Icon: ClipboardList },
  { to: "/pos/transactions", label: "Transactions", end: false, Icon: Receipt },
  { to: "/pos/outstanding", label: "Outstanding", end: false, Icon: CircleAlert },
  {
    to: "/pos/account",
    label: "Account",
    end: false,
    Icon: User,
  },
] as const;

function linkClass(isActive: boolean): string {
  return [
    "inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition",
    isActive
      ? "bg-red-600 text-white shadow-sm"
      : "text-neutral-700 hover:bg-white border border-transparent",
  ].join(" ");
}

export default function PosTopNavbar() {
  const { isSupabase, session } = useTenant();

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
            <span className="text-xs font-bold text-neutral-500">Admin</span>
          </div>
        </div>

        <nav
          className="no-scrollbar flex gap-2 overflow-x-auto pb-1 sm:pb-0 -mx-1 px-1"
          aria-label="POS navigation"
        >
          {links.map(({ to, label, end, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => linkClass(isActive)}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2 text-sm shrink-0 sm:pl-2">
          <span className="text-neutral-500 font-medium hidden sm:inline text-xs pr-1">
            {isSupabase && session ? "Supabase" : "Demo"}
          </span>
          <UserMenuDropdown />
        </div>
      </div>
    </header>
  );
}
