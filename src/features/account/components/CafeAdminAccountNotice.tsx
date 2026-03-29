import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import { usePosRole } from "../../../hooks/usePosRole";
import OutletSubscriptionKeySection from "./OutletSubscriptionKeySection";
import TenantOutletAccountSections from "./TenantOutletAccountSections";

export default function CafeAdminAccountNotice({
  liveMode = false,
}: {
  liveMode?: boolean;
}) {
  const { setRole } = usePosRole();
  const navigate = useNavigate();

  return (
    <div className="space-y-0 max-w-3xl">
      <div className="pb-6">
        <h1 className="text-xl font-extrabold text-neutral-900">Akun outlet</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Ringkasan untuk admin outlet
          {liveMode ? " (terhubung Supabase)" : ""}.
        </p>
      </div>

      {liveMode ? (
        <>
          <TenantOutletAccountSections />
          <OutletSubscriptionKeySection />
          <section className="border-b border-neutral-200 py-8">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-700">
                <User className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 text-sm text-neutral-700 leading-relaxed">
                <p>
                  Sebagai <strong>admin outlet</strong>, ringkasan tenant dan
                  pengguna Anda tampil di halaman ini. Buka menu{" "}
                  <strong>ikon pengguna</strong> di kanan atas header untuk{" "}
                  <strong>Akun outlet</strong> (halaman ini) dan{" "}
                  <strong>Logout</strong>.
                </p>
                <p className="mt-3">
                  Peran dan <code className="text-xs">tenant_id</code> Anda
                  dikelola di database (lihat{" "}
                  <code className="text-xs">supabase/README.md</code>).
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
          </section>
        </>
      ) : null}

      {!liveMode ? (
        <Card className="p-6 sm:p-8 max-w-xl">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-700">
              <User className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 text-sm text-neutral-700 leading-relaxed">
              <p>
                Sebagai <strong>admin outlet</strong>, data tenant dan user
                Anda tampil di menu <strong>ikon pengguna</strong> di kanan atas
                header. Dari situ Anda dapat membuka{" "}
                <strong>Akun outlet</strong> dan <strong>Logout</strong>.
              </p>
              <p className="mt-3">
                Isi halaman <strong>Super Administrator</strong> disembunyikan
                untuk peran ini. Akses akun outlet lewat dropdown (ikon
                pengguna), bukan dari bar navigasi utama.
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
              Aktifkan tampilan Super Administrator untuk mengedit konten
              halaman /pos/account yang lengkap.
            </p>
            <Button className="mt-3" onClick={() => setRole("super")}>
              Buka mode Super Admin
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
