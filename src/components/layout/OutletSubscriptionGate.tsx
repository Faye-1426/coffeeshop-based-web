import { Link, Outlet, useLocation } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { useTenant } from "../../features/tenants/context/TenantContext";

/**
 * Blocks outlet POS routes until subscription key is active (or owner tenant).
 * Account stays available for entering the key.
 */
export default function OutletSubscriptionGate() {
  const location = useLocation();
  const { isSupabase, outletPosUnlocked } = useTenant();

  if (!isSupabase) {
    return <Outlet />;
  }

  const onAccount =
    location.pathname === "/pos/account" ||
    location.pathname.startsWith("/pos/account/");

  if (outletPosUnlocked || onAccount) {
    return <Outlet />;
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
        <KeyRound className="h-7 w-7" aria-hidden />
      </div>
      <h2 className="mt-6 text-lg font-extrabold text-neutral-900">
        Langganan belum diaktifkan
      </h2>
      <p className="mt-2 max-w-md text-sm text-neutral-600 leading-relaxed">
        Untuk menggunakan fitur POS, outlet Anda perlu memasukkan{" "}
        <strong>Subscription Key</strong> yang valid. Buka menu{" "}
        <strong>ikon pengguna</strong> di kanan atas, lalu pilih{" "}
        <strong>Akun outlet</strong>.
      </p>
      <Link
        to="/pos/account"
        className="mt-8 inline-flex items-center justify-center rounded-full bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600/25"
      >
        Buka Akun outlet
      </Link>
    </div>
  );
}
