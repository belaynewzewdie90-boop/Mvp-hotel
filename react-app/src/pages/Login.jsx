import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDb } from "../context/DbContext";
import { useUi } from "../context/UiContext";
import Icon from "../components/Icon";

export default function Login() {
  const { data } = useDb();
  const { toast } = useUi();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    const user = (data.users || []).find(
      (entry) => entry.username === username.trim() && entry.password === password,
    );
    if (user) {
      toast(`Welcome back, ${user.username}`, "success");
      setTimeout(() => {
        if (user.role === "admin") navigate("/admin");
        else if (user.role === "store") navigate("/store");
        else navigate("/kitchen");
      }, 400);
    } else {
      setError("Invalid username or password. Try the demo credentials below.");
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-[radial-gradient(1200px_600px_at_10%_-10%,rgba(251,153,28,0.16),transparent_60%),radial-gradient(1000px_500px_at_110%_110%,rgba(28,118,144,0.12),transparent_55%),#f8f8f8] px-6 py-6">
      <div className="w-full max-w-[420px] rounded-2xl border border-gray-200 bg-white p-8 shadow-[0_6px_16px_-6px_rgba(17,17,17,0.12)]">
        <div className="mb-4 grid h-[52px] w-[52px] place-items-center rounded-[14px] bg-gradient-to-br from-brand to-brand-strong text-white shadow-[0_6px_16px_-6px_rgba(17,17,17,0.12)]">
          <Icon name="lock" className="h-6 w-6" />
        </div>
        <h1 className="mb-1 text-[1.4rem] font-bold tracking-tight text-ink">
          Staff Login
        </h1>
        <p className="mb-5 text-[0.92rem] text-muted">
          Sign in to access the management dashboards.
        </p>

        {error && (
          <div className="mb-3 flex items-center gap-2 rounded-[10px] bg-red-100 px-3 py-2.5 text-[0.88rem] font-semibold text-red-700">
            <Icon name="alert" className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="flex flex-col gap-2.5" onSubmit={handleSubmit} noValidate>
          <label className="block w-full">
            <span className="mb-1.5 block text-[0.8rem] font-semibold uppercase tracking-[0.05em] text-muted">
              Username
            </span>
            <input
              className="w-full rounded-[10px] border border-gray-300 bg-surface-2 px-3 py-2.5 text-ink transition focus:border-brand focus:bg-white focus:shadow-[0_0_0_3px_rgba(251,153,28,0.18)] focus:outline-none"
              placeholder="e.g. admin"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>
          <label className="block w-full">
            <span className="mb-1.5 block text-[0.8rem] font-semibold uppercase tracking-[0.05em] text-muted">
              Password
            </span>
            <div className="relative">
              <input
                className="w-full rounded-[10px] border border-gray-300 bg-surface-2 px-3 py-2.5 pr-11 text-ink transition focus:border-brand focus:bg-white focus:shadow-[0_0_0_3px_rgba(251,153,28,0.18)] focus:outline-none"
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted transition hover:bg-surface-2 hover:text-ink"
                aria-label="Show password"
                onClick={() => setShowPass((s) => !s)}
              >
                <Icon name={showPass ? "eyeOff" : "eye"} className="h-4 w-4" />
              </button>
            </div>
          </label>
          <button
            type="submit"
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-[10px] bg-gradient-to-b from-amber-400 to-brand px-4 py-2.5 font-semibold text-white shadow-sm transition hover:brightness-105"
          >
            <Icon name="external" className="h-4 w-4" />
            Sign in
          </button>
        </form>

        <div className="mt-4 rounded-[10px] bg-brand-soft px-3.5 py-3 text-[0.85rem] leading-relaxed text-brand-ink">
          <strong>Demo credentials</strong>
          <br />
          Admin — <code>admin</code> / <code>admin123</code>
          <br />
          Kitchen — <code>kitchen</code> / <code>kitchen123</code>
        </div>

        <p className="mt-4 text-center text-[0.9rem] text-muted">
          <Link className="hover:text-brand" to="/">
            ← Back to customer menu
          </Link>
        </p>
      </div>
    </div>
  );
}
