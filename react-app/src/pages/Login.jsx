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
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand-mark">
          <Icon name="lock" />
        </div>
        <h1>Staff Login</h1>
        <p className="sub">Sign in to access the management dashboards.</p>

        {error && (
          <div className="form-error">
            <Icon name="alert" />
            <span>{error}</span>
          </div>
        )}

        <form className="stack-form" style={{ flexDirection: "column" }} onSubmit={handleSubmit} noValidate>
          <label style={{ width: "100%", display: "block" }}>
            <span className="field-label">Username</span>
            <input
              className="input"
              placeholder="e.g. admin"
              autoComplete="username"
              required
              style={{ width: "100%" }}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>
          <label style={{ width: "100%", display: "block" }}>
            <span className="field-label">Password</span>
            <div style={{ position: "relative" }}>
              <input
                className="input"
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                style={{ width: "100%", paddingRight: 44 }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-ghost"
                aria-label="Show password"
                onClick={() => setShowPass((s) => !s)}
                style={{
                  position: "absolute",
                  right: 6,
                  top: "50%",
                  transform: "translateY(-50%)",
                  padding: 6,
                  borderRadius: 8,
                }}
              >
                <Icon name={showPass ? "eyeOff" : "eye"} />
              </button>
            </div>
          </label>
          <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
            <Icon name="external" />
            Sign in
          </button>
        </form>

        <div className="auth-hint">
          <strong>Demo credentials</strong>
          <br />
          Admin — <code>admin</code> / <code>admin123</code>
          <br />
          Kitchen — <code>kitchen</code> / <code>kitchen123</code>
        </div>

        <p className="muted" style={{ textAlign: "center", marginTop: 16 }}>
          <Link to="/">← Back to customer menu</Link>
        </p>
      </div>
    </div>
  );
}
