import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { writePosRole } from "../../lib/posDemoSession";
import AuthPageShell from "./components/AuthPageShell";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    writePosRole("cafe");
    navigate("/pos", { replace: true });
  };

  return (
    <AuthPageShell
      title="Warcoop"
      subtitle="Sign in to the POS (demo only)"
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
        onSubmit={onSubmit}
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

        <button
          type="submit"
          className="mt-6 w-full rounded-full bg-red-600 py-3 text-sm font-extrabold text-white shadow hover:bg-red-700 transition"
        >
          Sign in
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
        <p className="mt-3 text-center text-[11px] text-neutral-500">
          Any email/password continues to the POS for this prototype.
        </p>
      </form>
    </AuthPageShell>
  );
}
