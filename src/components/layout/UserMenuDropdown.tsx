import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, ChevronDown, LogIn, LogOut, UserRound } from "lucide-react";
import {
  POS_DEMO_TENANT_NAME,
  POS_DEMO_USER_NAME,
} from "../../lib/posDemoSession";
import { getSupabase, isSupabaseConfigured } from "../../lib/supabaseClient";
import { resetPosStoresAfterSignOut } from "../../store/posStoresReset";
import { useTenant } from "../../features/tenants/context/TenantContext";

export default function UserMenuDropdown() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { isSupabase, user, profile, tenantName, session, refreshProfile } =
    useTenant();

  const displayTenant =
    isSupabase && session ? (tenantName ?? "—") : POS_DEMO_TENANT_NAME;
  const displayUser =
    isSupabase && session
      ? profile?.full_name || user?.email || "User"
      : POS_DEMO_USER_NAME;

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const onLogout = async () => {
    setOpen(false);
    try {
      if (isSupabaseConfigured()) {
        const sb = getSupabase();
        try {
          await sb?.auth.signOut({ scope: "local" });
        } catch (e) {
          console.warn("[Warcoop] signOut:", e);
        }
        resetPosStoresAfterSignOut();
        try {
          await refreshProfile();
        } catch (e) {
          console.warn("[Warcoop] refreshProfile after signOut:", e);
        }
      }
    } finally {
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="relative shrink-0" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={[
          "inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-2.5 py-2 text-sm font-semibold text-neutral-900",
          "transition hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-red-600/25",
          open ? "ring-2 ring-red-600/20" : "",
        ].join(" ")}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white">
          <UserRound className="h-4 w-4" aria-hidden />
        </span>
        <ChevronDown
          className={[
            "h-4 w-4 text-neutral-500 transition-transform hidden sm:block",
            open ? "rotate-180" : "",
          ].join(" ")}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 rounded-2xl border border-neutral-200 bg-white py-2 shadow-xl"
          role="menu"
        >
          <div className="px-4 py-3 border-b border-neutral-100">
            <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">
              Tenant
            </div>
            <div className="mt-1 text-sm font-extrabold text-neutral-900 leading-snug wrap-break-word">
              {displayTenant}
            </div>
            <div className="mt-3 text-[11px] font-bold uppercase tracking-wide text-neutral-500">
              User
            </div>
            <div className="mt-1 text-sm font-bold text-neutral-800 wrap-break-word">
              {displayUser}
            </div>
          </div>

          <div className="p-2 space-y-1">
            {profile?.is_super_admin ? null : (
              <Link
                to="/pos/account"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-neutral-800 transition hover:bg-neutral-100"
              >
                <Building2
                  className="h-4 w-4 shrink-0 text-neutral-500"
                  aria-hidden
                />
                Akun outlet
              </Link>
            )}
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-neutral-800 transition hover:bg-neutral-100"
              onClick={() => void onLogout()}
            >
              <LogOut
                className="h-4 w-4 shrink-0 text-neutral-500"
                aria-hidden
              />
              Logout
            </button>
            {!isSupabase || !session ? (
              <>
                <Link
                  to="/login"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-50"
                >
                  <LogIn className="h-4 w-4 shrink-0" aria-hidden />
                  Log in
                </Link>
                <p className="px-2 pt-1 text-[10px] text-neutral-500 text-center">
                  Tombol login tetap ditampilkan untuk alur demo.
                </p>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
