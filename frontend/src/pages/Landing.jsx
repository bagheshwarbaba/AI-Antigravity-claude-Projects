import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const FEATURES = [
  {
    icon: "💳",
    title: "All Payment Methods",
    desc: "Add UPI, credit cards, wallets, net banking — we track every method you use daily.",
  },
  {
    icon: "⚖️",
    title: "Smart Comparison",
    desc: "Our scoring engine compares fee, speed, security, and rewards to find your best option.",
  },
  {
    icon: "📊",
    title: "Visual Analytics",
    desc: "Beautiful charts and radar graphs give you crystal-clear payment insights.",
  },
  {
    icon: "🏆",
    title: "AI Recommendations",
    desc: "Get intelligent suggestions on which payment method fits your transaction best.",
  },
  {
    icon: "📄",
    title: "Export Reports",
    desc: "Download full PDF analytics reports for your records or sharing.",
  },
  {
    icon: "🔐",
    title: "Secure & Private",
    desc: "Your data stays yours. JWT-secured accounts with encrypted storage.",
  },
];

const FLOW_STEPS = [
  {
    num: "1",
    title: "Create Your Account",
    desc: "Sign up in seconds — just your name, email, and password.",
  },
  {
    num: "2",
    title: "Add Your Payment Methods",
    desc: "Enter your UPI, credit cards, wallets, or any custom payment method with their properties.",
  },
  {
    num: "3",
    title: "Compare & Analyze",
    desc: "Select methods, run smart comparisons, and see which one wins across every metric.",
  },
  {
    num: "4",
    title: "Get Insights & Decide",
    desc: "View charts, radar graphs, trend analysis, and AI-powered recommendations.",
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="landing-hero" style={{ minHeight: "auto" }}>
      {/* Hero Blobs */}
      <div className="hero-blob hero-blob-1" />
      <div className="hero-blob hero-blob-2" />
      <div className="hero-blob hero-blob-3" />

      {/* Landing Navbar */}
      <nav className="landing-nav">
        <div className="navbar-logo" style={{ fontSize: "1.5rem" }}>
          <span style={{ fontSize: "1.6rem" }}>💳</span>
          Pay<span>Smart</span>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {user ? (
            <button className="btn btn-primary" onClick={() => navigate("/dashboard")}>
              Go to Dashboard →
            </button>
          ) : (
            <>
              <Link to="/login">
                <button className="btn btn-secondary">Sign In</button>
              </Link>
              <Link to="/register">
                <button className="btn btn-primary">Get Started Free →</button>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-content">
        <div className="hero-badge">
          <span>✨</span> Intelligent E-Payment Analytics Platform
        </div>

        <h1 className="hero-title">
          Make Smarter<br />
          <span className="gradient-text">Payment Decisions</span>
        </h1>

        <p className="hero-subtitle">
          Compare every payment method you use — UPI, credit cards, wallets and more.
          Get insights, analytics, and AI-powered recommendations to save money on every transaction.
        </p>

        <div className="hero-cta">
          <button
            className="btn btn-primary btn-lg"
            style={{ fontSize: "1.05rem", padding: "0.9rem 2.2rem", minWidth: "200px" }}
            onClick={() => navigate(user ? "/dashboard" : "/register")}
          >
            {user ? "Go to Dashboard →" : "Start for Free →"}
          </button>
          <button
            className="btn btn-outline btn-lg"
            style={{ fontSize: "1.05rem", padding: "0.9rem 2.2rem" }}
            onClick={() => document.getElementById("how-it-works").scrollIntoView({ behavior: "smooth" })}
          >
            See How It Works
          </button>
        </div>

        <div className="hero-stats">
          {[
            { num: "10+", label: "Payment Methods" },
            { num: "6", label: "Comparison Metrics" },
            { num: "100%", label: "Free to Use" },
            { num: "∞", label: "Smart Insights" },
          ].map((s) => (
            <div key={s.label} className="hero-stat">
              <div className="hero-stat-num">{s.num}</div>
              <div className="hero-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <span className="badge" style={{ marginBottom: "1rem", fontSize: "0.82rem", padding: "0.4rem 1rem" }}>
            ✦ Features
          </span>
          <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.5rem)", marginBottom: "0.75rem" }}>
            Everything You Need to<br />
            <span style={{ color: "var(--accent)" }}>Compare Smarter</span>
          </h2>
          <p style={{ color: "var(--text-secondary)", maxWidth: 520, margin: "0 auto", lineHeight: 1.7 }}>
            From raw data entry to beautiful visual analytics — PaySmart guides you every step.
          </p>
        </div>

        <div className="features-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="flow-section">
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <span className="badge" style={{ marginBottom: "1rem", fontSize: "0.82rem", padding: "0.4rem 1rem" }}>
              🔄 The Flow
            </span>
            <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.5rem)", marginBottom: "0.75rem" }}>
              From Sign-Up to<br />
              <span style={{ color: "var(--accent)" }}>Full Insights</span>
            </h2>
            <p style={{ color: "var(--text-secondary)", maxWidth: 480, margin: "0 auto" }}>
              Get up and running in minutes with a guided onboarding flow.
            </p>
          </div>

          <div className="flow-steps">
            {FLOW_STEPS.map((step, idx) => (
              <div key={step.num} className="flow-step">
                <div className="flow-step-line" />
                <div className="flow-step-num">{step.num}</div>
                <div className="flow-step-content">
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: "3rem" }}>
            <button
              className="btn btn-primary btn-lg"
              style={{ fontSize: "1.05rem", padding: "0.9rem 2.5rem" }}
              onClick={() => navigate(user ? "/dashboard" : "/register")}
            >
              {user ? "Go to Dashboard →" : "Get Started — It's Free →"}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: "white",
        borderTop: "1px solid var(--border)",
        padding: "2rem",
        textAlign: "center",
        color: "var(--text-secondary)",
        fontSize: "0.85rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <span style={{ fontSize: "1.1rem" }}>💳</span>
          <strong style={{ color: "var(--accent-dark)", fontFamily: "'Outfit', sans-serif" }}>PaySmart</strong>
        </div>
        <p>© {new Date().getFullYear()} PaySmart · E-Payment Comparison & Analytics Platform</p>
      </footer>
    </div>
  );
}
