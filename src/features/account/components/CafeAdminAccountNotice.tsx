import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import { usePosRole } from "../../../components/layout/usePosRole";

export default function CafeAdminAccountNotice() {
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
            /pos/account yang lengkap.
          </p>
          <Button className="mt-3" onClick={() => setRole("super")}>
            Buka mode Super Admin
          </Button>
        </div>
      </Card>
    </div>
  );
}
