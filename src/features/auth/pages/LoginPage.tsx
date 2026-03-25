import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Coffee } from "lucide-react";
import { writePosRole } from "../../../lib/posDemoSession";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    writePosRole("cafe");
    navigate("/pos", { replace: true });
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-12 bg-linear-to-b from-neutral-100 to-neutral-50">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center gap-2 mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600 text-white shadow-lg shadow-red-600/25">
            <Coffee className="h-8 w-8" aria-hidden />
          </div>
          <h1 className="text-2xl font-extrabold text-neutral-900">Warcoop</h1>
          <p className="text-sm text-neutral-600">
            Sign in to the POS (demo only)
          </p>
        </div>

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

        <p className="mt-6 text-center">
          <Link
            to="/"
            className="text-sm font-semibold text-neutral-600 hover:text-neutral-900"
          >
            Back to menu
          </Link>
        </p>
      </div>
    </div>
  );
}
