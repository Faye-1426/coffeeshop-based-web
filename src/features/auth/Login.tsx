import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { writePosRole } from "../../lib/posDemoSession";
import { isSupabaseConfigured, getSupabase } from "../../lib/supabaseClient";
import { useTenant } from "../../lib/supabase/TenantContext";
import AuthPageShell from "./components/AuthPageShell";

export default function Login() {
  const navigate = useNavigate();
  const { refreshProfile } = useTenant();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isSupabaseConfigured()) {
      const sb = getSupabase();
      if (!sb) {
        setError("Supabase tidak tersedia.");
        return;
      }
      setBusy(true);
      try {
        const { error: signErr } = await sb.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signErr) {
          setError(signErr.message);
          return;
        }
        const {
          data: { session },
        } = await sb.auth.getSession();
        const uid = session?.user?.id;
        if (uid) {
          const { data: pr } = await sb
            .from("profiles")
            .select("role_id, tenant_id")
            .eq("id", uid)
            .maybeSingle();
          if (pr?.role_id === 0 && pr.tenant_id === null) {
            writePosRole("super");
          } else {
            writePosRole("cafe");
          }
        }
        await refreshProfile();
        navigate("/pos", { replace: true });
      } finally {
        setBusy(false);
      }
      return;
    }

    writePosRole("cafe");
    navigate("/pos", { replace: true });
  };

  return (
    <AuthPageShell
      title="Warcoop"
      subtitle={
        isSupabaseConfigured()
          ? "Sign in with Supabase Auth"
          : "Sign in to the POS (demo only)"
      }
      footer={
        <Link
          to="/"
          className="text-sm font-semibold text-neutral-600 hover:text-neutral-900"
        >
          Back to menu
        </Link>
      }
    >
      <form
        onSubmit={(e) => void onSubmit(e)}
        className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-xl"
      >
        <label className="block">
          <span className="text-xs font-bold text-neutral-600">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-600/25"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </label>
        <label className="mt-4 block">
          <span className="text-xs font-bold text-neutral-600">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-600/25"
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </label>

        {error ? (
          <p className="mt-3 text-sm text-red-700 font-semibold">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded-full bg-red-600 py-3 text-sm font-extrabold text-white shadow hover:bg-red-700 transition disabled:opacity-60"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>

        <p className="mt-4 text-center text-sm text-neutral-600">
          No account?{" "}
          <Link
            to="/signup"
            className="font-bold text-red-700 hover:text-red-800 underline-offset-2 hover:underline"
          >
            Create one
          </Link>
        </p>
        {!isSupabaseConfigured() ? (
          <p className="mt-3 text-center text-[11px] text-neutral-500">
            Any email/password continues to the POS for this prototype.
          </p>
        ) : (
          <p className="mt-3 text-center text-[11px] text-neutral-500">
            Isi <code className="text-[10px]">VITE_SUPABASE_*</code> di{" "}
            <code className="text-[10px]">.env</code> — buat user di Supabase
            Auth.
          </p>
        )}
      </form>
    </AuthPageShell>
  );
}
