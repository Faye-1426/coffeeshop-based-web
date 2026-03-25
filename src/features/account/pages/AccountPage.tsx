import { Link, useNavigate } from "react-router-dom";
import { Coffee, Mail, Store, User } from "lucide-react";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import { usePosRole } from "../../../components/layout/usePosRole";
import {
  POS_DEMO_TENANT_NAME,
  POS_DEMO_USER_NAME,
} from "../../../lib/posDemoSession";

function CafeAdminAccountNotice() {
  const { setRole } = usePosRole();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-neutral-900">Account</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Ringkasan untuk admin outlet (bukan halaman Super Administrator).
        </p>
      </div>

      <Card className="p-6 sm:p-8 max-w-xl">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-700">
            <User className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 text-sm text-neutral-700 leading-relaxed">
            <p>
              Sebagai <strong>admin outlet</strong>, data tenant dan user Anda
              tampil di menu <strong>ikon pengguna</strong> di kanan atas
              header. Dari situ Anda dapat <strong>Logout</strong> atau membuka
              halaman <strong>Log in</strong> untuk demo.
            </p>
            <p className="mt-3">
              Isi halaman <strong>Super Administrator</strong> (multi-tenant,
              hak akses tinggi) disembunyikan untuk peran ini. Item menu
              <span className="font-bold text-neutral-900"> Account </span>
              di navigasi tetap ada untuk pengembangan selanjutnya.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => navigate("/pos")}>
            Kembali ke dashboard
          </Button>
          <Button
            variant="ghost"
            className="border! border-neutral-200"
            onClick={() => navigate("/")}
          >
            Lihat storefront
          </Button>
        </div>

        <div className="mt-8 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/90 p-4">
          <div className="text-xs font-extrabold uppercase tracking-wide text-neutral-500">
            Pengembangan
          </div>
          <p className="mt-2 text-sm text-neutral-600">
            Aktifkan tampilan Super Administrator untuk mengedit konten halaman
            `/pos/account` yang lengkap.
          </p>
          <Button className="mt-3" onClick={() => setRole("super")}>
            Buka mode Super Admin
          </Button>
        </div>
      </Card>
    </div>
  );
}

/** Full Super Administrator account screen (dev / platform operator). */
function SuperAdminAccountPage() {
  const { setRole } = usePosRole();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-neutral-900">Account</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Super Administrator — konfigurasi profil platform (dummy, tanpa
          backend).
        </p>
      </div>

      <Card className="p-6 sm:p-8 max-w-xl">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white">
            <User className="h-7 w-7" aria-hidden />
          </div>
          <div className="min-w-0">
            <div className="font-extrabold text-neutral-900">
              {POS_DEMO_USER_NAME}
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm text-neutral-600">
              <Mail className="h-4 w-4 shrink-0" aria-hidden />
              owner@warcoop.demo
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-neutral-600">
              <Store className="h-4 w-4 shrink-0" aria-hidden />
              {POS_DEMO_TENANT_NAME}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4 text-sm text-neutral-600">
          <div className="flex items-center gap-2 font-bold text-neutral-800">
            <Coffee className="h-4 w-4 text-red-700" aria-hidden />
            Catatan
          </div>
          <p className="mt-2">
            Peran, izin, dan pergantian sandi akan terhubung ke API. Untuk admin
            outlet sehari-hari gunakan menu ikon pengguna di kanan atas.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-bold text-neutral-900 transition hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-red-600/25"
          >
            View storefront
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-bold text-neutral-900 transition hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-red-600/25"
          >
            Go to login (demo)
          </Link>
        </div>

        <div className="mt-8 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/90 p-4">
          <div className="text-xs font-extrabold uppercase tracking-wide text-neutral-500">
            Pengembangan
          </div>
          <p className="mt-2 text-sm text-neutral-600">
            Kembali ke pengalaman admin outlet (tanpa detail Super Admin di
            halaman ini).
          </p>
          <Button
            variant="secondary"
            className="mt-3"
            onClick={() => setRole("cafe")}
          >
            Simulasi admin outlet
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default function AccountPage() {
  const { role } = usePosRole();

  if (role === "cafe") {
    return <CafeAdminAccountNotice />;
  }

  return <SuperAdminAccountPage />;
}
