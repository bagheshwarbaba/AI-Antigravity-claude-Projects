import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.email || !form.password) return setError("All fields are required");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", form);
      login(data.token, data.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-bg-glow top" />
      <div className="auth-bg-glow bottom" />

      <div className="auth-card slide-up">
        <div className="auth-logo">
          <div className="auth-logo-icon">💳</div>
          <h1 style={{ fontSize: "1.6rem" }}>
            Pay<span className="text-accent">Smart</span>
          </h1>
          <p className="text-muted" style={{ fontSize: "0.88rem", marginTop: "0.25rem" }}>
            Your intelligent payment comparison platform
          </p>
        </div>

        <hr className="divider" />
        <h2 style={{ fontSize: "1.15rem", marginBottom: "1.25rem", fontWeight: 600 }}>Sign In</h2>

        {error && <div className="alert alert-error mb-2">⚠️ {error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-control" type="email" name="email" value={form.email}
              onChange={handleChange} placeholder="you@example.com" autoComplete="email" />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-control" type="password" name="password" value={form.password}
              onChange={handleChange} placeholder="••••••••" autoComplete="current-password" />
          </div>

          <button className="btn btn-primary w-full btn-lg" type="submit" disabled={loading}>
            {loading ? <><span className="spinner" /> Signing in...</> : "Sign In →"}
          </button>
        </form>

        <div className="auth-switch">
          Don't have an account?{" "}
          <Link to="/register">Create one for free</Link>
        </div>

        <div style={{ marginTop: "1.5rem", padding: "1rem", borderRadius: "var(--radius-sm)", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
          <strong style={{ color: "var(--text-primary)" }}>🧪 Demo Account</strong><br />
          Register a new account to explore with pre-loaded sample payment data.
        </div>
      </div>
    </div>
  );
}
