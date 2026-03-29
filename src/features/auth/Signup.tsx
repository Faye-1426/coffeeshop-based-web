import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getSupabase, isSupabaseConfigured } from "../../lib/supabaseClient";
import AuthPageShell from "./components/AuthPageShell";

export default function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (isSupabaseConfigured()) {
      const sb = getSupabase();
      if (!sb) {
        setError("Supabase tidak tersedia.");
        return;
      }
      setBusy(true);
      try {
        const { error: signErr } = await sb.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: name.trim() || undefined },
          },
        });
        if (signErr) {
          setError(signErr.message);
          return;
        }
        setInfo(
          "Periksa email untuk konfirmasi (jika diaktifkan di Supabase), lalu masuk.",
        );
        navigate("/login", { replace: true });
      } finally {
        setBusy(false);
      }
      return;
    }

    navigate("/login", { replace: true });
  };

  return (
    <AuthPageShell
      title="Join Warcoop"
      subtitle={
        isSupabaseConfigured()
          ? "Create a Supabase Auth account"
          : "Create a demo staff account"
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
          <span className="text-xs font-bold text-neutral-600">Full name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-600/25"
            placeholder="Ahmad Wijaya"
            autoComplete="name"
          />
        </label>
        <label className="mt-4 block">
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
            autoComplete="new-password"
          />
        </label>

        {error ? (
          <p className="mt-3 text-sm text-red-700 font-semibold">{error}</p>
        ) : null}
        {info ? (
          <p className="mt-3 text-sm text-neutral-700 font-semibold">{info}</p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded-full bg-red-600 py-3 text-sm font-extrabold text-white shadow hover:bg-red-700 transition disabled:opacity-60"
        >
          {busy ? "Creating…" : "Create account"}
        </button>

        <p className="mt-4 text-center text-sm text-neutral-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-bold text-red-700 hover:text-red-800 underline-offset-2 hover:underline"
          >
            Sign in
          </Link>
        </p>
        {!isSupabaseConfigured() ? (
          <p className="mt-3 text-center text-[11px] text-neutral-500">
            Nothing is stored; you will be sent back to sign in.
          </p>
        ) : null}
      </form>
    </AuthPageShell>
  );
}
