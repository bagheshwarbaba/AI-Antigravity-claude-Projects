import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name || !form.email || !form.password) return setError("All fields are required");
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) return setError("Invalid email format");
    if (form.password.length < 8) return setError("Password must be at least 8 characters");
    if (!/\d/.test(form.password)) return setError("Password must contain at least one number");
    if (form.password !== form.confirm) return setError("Passwords do not match");

    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", {
        name: form.name, email: form.email, password: form.password,
      });
      login(data.token, data.user);
      navigate("/onboarding");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const strength = () => {
    const p = form.password;
    if (!p) return null;
    let score = 0;
    if (p.length >= 8) score += 1;
    if (p.length >= 12) score += 1;
    if (/[A-Z]/.test(p)) score += 1;
    if (/[0-9]/.test(p)) score += 1;
    if (/[^A-Za-z0-9]/.test(p)) score += 1;

    if (score < 3) return { label: "Weak", color: "var(--danger)", width: "33%" };
    if (score < 4) return { label: "Fair", color: "var(--warning)", width: "66%" };
    return { label: "Strong", color: "var(--success)", width: "100%" };
  };
  const str = strength();

  return (
    <div className="auth-wrapper">
      <div className="auth-bg-glow top" />
      <div className="auth-bg-glow bottom" />

      <div className="auth-card slide-up">
        <div className="auth-logo">
          <div className="auth-logo-icon">📊</div>
          <h1 style={{ fontSize: "1.6rem" }}>
            Join Pay<span className="text-accent">Smart</span>
          </h1>
          <p className="text-muted" style={{ fontSize: "0.88rem", marginTop: "0.25rem" }}>
            Compare, analyze & choose the best payments
          </p>
        </div>

        <hr className="divider" />
        <h2 style={{ fontSize: "1.15rem", marginBottom: "1.25rem", fontWeight: 600 }}>Create Account</h2>

        {error && <div className="alert alert-error mb-2">⚠️ {error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-control" type="text" name="name" value={form.name}
              onChange={handleChange} placeholder="Meghana Rao" autoComplete="name" />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-control" type="email" name="email" value={form.email}
              onChange={handleChange} placeholder="you@example.com" autoComplete="email" />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-control" type="password" name="password" value={form.password}
              onChange={handleChange} placeholder="Min. 8 chars, 1 number" autoComplete="new-password" />
            {str && (
              <div style={{ marginTop: "0.4rem" }}>
                <div className="progress-bar">
                  <div style={{ height: "100%", width: str.width, background: str.color, borderRadius: 99, transition: "all 0.3s" }} />
                </div>
                <span style={{ fontSize: "0.72rem", color: str.color, marginTop: "0.2rem", display: "block" }}>
                  Password strength: {str.label}
                </span>
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input className="form-control" type="password" name="confirm" value={form.confirm}
              onChange={handleChange} placeholder="Repeat password" autoComplete="new-password" />
          </div>

          <button className="btn btn-primary w-full btn-lg" type="submit" disabled={loading}>
            {loading ? <><span className="spinner" /> Creating account...</> : "Create Account →"}
          </button>
        </form>

        <div className="auth-switch">
          Already have an account?{" "}
          <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
