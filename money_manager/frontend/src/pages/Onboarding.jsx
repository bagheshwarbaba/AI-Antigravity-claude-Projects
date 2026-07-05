import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const PAYMENT_TYPES = [
  { value: "upi", label: "UPI", icon: "📱" },
  { value: "creditcard", label: "Credit Card", icon: "💳" },
  { value: "debitcard", label: "Debit Card", icon: "🏦" },
  { value: "wallet", label: "E-Wallet", icon: "👛" },
  { value: "netbanking", label: "Net Banking", icon: "🌐" },
  { value: "custom", label: "Custom", icon: "⚙️" },
];

const DEFAULT_METHOD = {
  name: "",
  type: "upi",
  fee: "",
  speed: "7",
  security: "7",
  availability: "8",
  rewards: "5",
  reliability: "7",
  description: "",
};

/* ── Sub-components ──────────────────────────────── */

function ProgressBar({ step, total }) {
  return (
    <div style={{ marginBottom: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
        <span style={{ fontWeight: 600 }}>Step {step} of {total}</span>
        <span style={{ color: "var(--accent)", fontWeight: 600 }}>{Math.round((step / total) * 100)}%</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${(step / total) * 100}%` }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.6rem" }}>
        {["Register", "Add Methods", "Processing", "Results"].map((label, i) => (
          <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem" }}>
            <div style={{
              width: 28, height: 28,
              borderRadius: "50%",
              background: i < step ? "linear-gradient(135deg, var(--accent-dark), var(--accent-light))" : i === step - 1 ? "linear-gradient(135deg, var(--accent-dark), var(--accent-light))" : "var(--bg-secondary)",
              border: i + 1 === step ? "2px solid var(--accent)" : i + 1 < step ? "2px solid var(--accent-light)" : "2px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.75rem", fontWeight: 700,
              color: i + 1 <= step ? "white" : "var(--text-muted)",
              transition: "all 0.3s",
            }}>
              {i + 1 < step ? "✓" : i + 1}
            </div>
            <span style={{ fontSize: "0.65rem", color: i + 1 === step ? "var(--accent)" : "var(--text-muted)", fontWeight: i + 1 === step ? 700 : 400, whiteSpace: "nowrap" }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SliderField({ label, name, value, onChange }) {
  return (
    <div className="form-group">
      <div className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>{label}</span>
        <span style={{
          color: "white", fontWeight: 700, fontSize: "0.82rem",
          background: "linear-gradient(135deg, var(--accent-dark), var(--accent))",
          padding: "0.1rem 0.6rem", borderRadius: "50px", minWidth: "36px", textAlign: "center",
        }}>
          {value}
        </span>
      </div>
      <input type="range" min={0} max={10} step={0.5} name={name} value={value} onChange={onChange} />
    </div>
  );
}
function ScoreMeter({ score }) {
  const pct = (score / 10) * 100;
  const color = score >= 7 ? "var(--success)" : score >= 5 ? "var(--warning)" : "var(--danger)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
      <div style={{ flex: 1, height: 8, background: "var(--bg-secondary)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99, transition: "width 1s ease" }} />
      </div>
      <span style={{ fontWeight: 700, fontSize: "0.88rem", color, minWidth: 32 }}>{score}</span>
    </div>
  );
}

/* ── Main Component ──────────────────────────────── */

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=Welcome, 2=AddMethods, 3=Processing, 4=Results
  const [methods, setMethods] = useState([{ ...DEFAULT_METHOD }]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [error, setError] = useState("");
  const [savedResults, setSavedResults] = useState([]); // scored results from backend
  const [processingMsg, setProcessingMsg] = useState("Saving your payment methods...");

  const current = methods[currentIdx];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMethods((m) => m.map((item, idx) => (idx === currentIdx ? { ...item, [name]: value } : item)));
    setError("");
  };

  const addMethod = () => {
    if (methods.length >= 6) return;
    setMethods((m) => [...m, { ...DEFAULT_METHOD }]);
    setCurrentIdx(methods.length);
  };

  const removeMethod = (idx) => {
    if (methods.length <= 1) return;
    const next = methods.filter((_, i) => i !== idx);
    setMethods(next);
    setCurrentIdx(Math.min(currentIdx, next.length - 1));
  };

  const validateAll = () => {
    for (let i = 0; i < methods.length; i++) {
      if (!methods[i].name.trim()) {
        setError(`Method ${i + 1}: Name is required.`);
        setCurrentIdx(i);
        return false;
      }
      if (methods[i].fee === "" || isNaN(methods[i].fee)) {
        setError(`Method ${i + 1}: Fee is required (use 0 for free).`);
        setCurrentIdx(i);
        return false;
      }
    }
    return true;
  };

  /* Step 2 → Step 3: save methods then get scores */
  const handleProcess = async () => {
    if (!validateAll()) return;

    setStep(3);
    setProcessingMsg("Saving your payment methods...");

    try {
      const saved = [];
      for (const m of methods) {
        setProcessingMsg(`Processing "${m.name}"...`);
        await new Promise((r) => setTimeout(r, 400)); // visual delay per item
        const { data } = await api.post("/payments", {
          ...m,
          fee: parseFloat(m.fee),
          speed: parseFloat(m.speed),
          security: parseFloat(m.security),
          availability: parseFloat(m.availability),
          rewards: parseFloat(m.rewards),
          reliability: parseFloat(m.reliability),
        });
        saved.push(data);
      }

      setProcessingMsg("Calculating scores and rankings...");
      await new Promise((r) => setTimeout(r, 600));

      // Sort by score descending
      const ranked = [...saved].sort((a, b) => b.score - a.score);
      setSavedResults(ranked);

      setProcessingMsg("Building your comparison...");
      await new Promise((r) => setTimeout(r, 500));

      setStep(4);
    } catch (err) {
      setStep(2);
      setError(err.response?.data?.message || "Failed to save. Make sure the server is running.");
    }
  };

  /* ── Render ──────────────────────────────────── */
  return (
    <div className="onboarding-wrapper">
      <div className="hero-blob hero-blob-1" style={{ opacity: 0.35 }} />
      <div className="hero-blob hero-blob-2" style={{ opacity: 0.25 }} />

      <div className="onboarding-card" style={{ maxWidth: step === 4 ? 720 : 580 }}>

        {/* ── STEP 1: Welcome ───────────────────────── */}
        {step === 1 && (
          <div className="fade-in">
            <ProgressBar step={1} total={4} />

            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              <div style={{
                width: 64, height: 64,
                background: "linear-gradient(135deg, var(--accent-dark), var(--accent-light))",
                borderRadius: "var(--radius-md)", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "1.6rem", margin: "0 auto 1rem",
                boxShadow: "0 6px 24px rgba(29,78,216,0.3)",
              }}>👋</div>
              <h1 style={{ fontSize: "1.7rem", marginBottom: "0.4rem" }}>Welcome to <span style={{ color: "var(--accent)" }}>PaySmart</span>!</h1>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem" }}>
                You're registered! Now let's set up your payment profile to start comparing.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", marginBottom: "2rem" }}>
              {[
                { step: "Step 1 — Done ✓", desc: "Account created successfully", icon: "✅", done: true },
                { step: "Step 2 — Add Methods", desc: "Enter your payment methods (UPI, cards, wallets)", icon: "💳", done: false },
                { step: "Step 3 — Process", desc: "Our engine scores each method automatically", icon: "⚙️", done: false },
                { step: "Step 4 — Results", desc: "See ranked comparisons and insights", icon: "📊", done: false },
              ].map((item) => (
                <div key={item.step} style={{
                  display: "flex", alignItems: "center", gap: "1rem", padding: "0.9rem 1.1rem",
                  background: item.done ? "rgba(22,163,74,0.06)" : "var(--accent-subtle)",
                  border: `1px solid ${item.done ? "rgba(22,163,74,0.2)" : "var(--border-accent)"}`,
                  borderRadius: "var(--radius-md)",
                }}>
                  <span style={{ fontSize: "1.4rem" }}>{item.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.88rem", color: item.done ? "var(--success)" : "var(--accent-dark)" }}>{item.step}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <button className="btn btn-primary w-full btn-lg" onClick={() => setStep(2)}>
              Add My Payment Methods →
            </button>
            <button className="btn btn-ghost w-full mt-1" style={{ fontSize: "0.82rem" }} onClick={() => navigate("/dashboard")}>
              Skip — I'll add them from Dashboard later
            </button>
          </div>
        )}

        {/* ── STEP 2: Add Payment Methods ───────────── */}
        {step === 2 && (
          <div className="fade-in">
            <ProgressBar step={2} total={4} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div>
                <h2 style={{ fontSize: "1.35rem", marginBottom: "0.2rem" }}>Add Payment Methods</h2>
                <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                  Add up to 6 methods. You can add more from the Dashboard later.
                </p>
              </div>
              <span className="badge">{methods.length}/6</span>
            </div>

            {/* Method tabs */}
            {methods.length > 1 && (
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                {methods.map((m, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center" }}>
                    <button
                      className={`btn btn-sm ${currentIdx === i ? "btn-primary" : "btn-secondary"}`}
                      onClick={() => { setCurrentIdx(i); setError(""); }}
                    >
                      {m.name || `Method ${i + 1}`}
                    </button>
                    {methods.length > 1 && (
                      <button className="btn btn-ghost btn-sm" style={{ padding: "0.3rem 0.4rem", marginLeft: "-2px" }}
                        onClick={() => removeMethod(i)} title="Remove">✕</button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {error && <div className="alert alert-error mb-2">⚠️ {error}</div>}

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Name */}
              <div className="form-group">
                <label className="form-label">Payment Method Name *</label>
                <input className="form-control" name="name" value={current.name} onChange={handleChange}
                  placeholder="e.g. PhonePe UPI, HDFC Credit Card, Paytm Wallet" autoFocus />
              </div>

              {/* Type grid */}
              <div className="form-group">
                <label className="form-label">Type</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
                  {PAYMENT_TYPES.map((t) => (
                    <button key={t.value} type="button"
                      className={`btn btn-sm ${current.type === t.value ? "btn-primary" : "btn-secondary"}`}
                      style={{ flexDirection: "column", gap: "0.15rem", padding: "0.55rem 0.4rem", height: "auto" }}
                      onClick={() => handleChange({ target: { name: "type", value: t.value } })}>
                      <span style={{ fontSize: "1rem" }}>{t.icon}</span>
                      <span style={{ fontSize: "0.7rem" }}>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Fee */}
              <div className="form-group">
                <label className="form-label">Transaction Fee (%) *</label>
                <input className="form-control" type="number" name="fee" value={current.fee}
                  onChange={handleChange} placeholder="0 for free transactions, e.g. 1.5"
                  min="0" max="10" step="0.1" />
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Enter 0 if this method charges no fee</span>
              </div>

              {/* Sliders */}
              <hr className="divider" />
              <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Rate each attribute (0 = lowest, 10 = highest):
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <SliderField label="🔐 Security" name="security" value={current.security} onChange={handleChange} />
                <SliderField label="⚡ Speed" name="speed" value={current.speed} onChange={handleChange} />
                <SliderField label="📡 Availability" name="availability" value={current.availability} onChange={handleChange} />
                <SliderField label="🎁 Rewards" name="rewards" value={current.rewards} onChange={handleChange} />
                <SliderField label="✅ Reliability" name="reliability" value={current.reliability} onChange={handleChange} />
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label">Notes (optional)</label>
                <textarea className="form-control" name="description" value={current.description}
                  onChange={handleChange} placeholder="Any notes about this payment method..."
                  rows={2} style={{ resize: "none" }} />
              </div>
            </div>

            <hr className="divider" style={{ margin: "1.25rem 0" }} />

            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <button className="btn btn-secondary btn-sm" onClick={addMethod} disabled={methods.length >= 6}>
                ➕ Add Another Method
              </button>
              <div style={{ flex: 1 }} />
              <button className="btn btn-primary" onClick={handleProcess} style={{ minWidth: 180 }}>
                ⚡ Process & Compare →
              </button>
            </div>
            <button className="btn btn-ghost w-full mt-1" style={{ fontSize: "0.78rem" }}
              onClick={() => navigate("/dashboard")}>
              Skip for now
            </button>
          </div>
        )}

        {/* ── STEP 3: Processing ────────────────────── */}
        {step === 3 && (
          <div className="fade-in" style={{ textAlign: "center", padding: "2rem 0" }}>
            <ProgressBar step={3} total={4} />

            <div style={{
              width: 80, height: 80,
              background: "linear-gradient(135deg, var(--accent-dark), var(--accent-light))",
              borderRadius: "50%", display: "flex", alignItems: "center",
              justifyContent: "center", margin: "0 auto 1.5rem",
              animation: "spin 1.5s linear infinite",
              boxShadow: "0 0 32px rgba(59,130,246,0.35)",
            }}>
              <span style={{ fontSize: "2rem" }}>⚙️</span>
            </div>

            <h2 style={{ marginBottom: "0.5rem" }}>Processing Your Data</h2>
            <p style={{ color: "var(--accent)", fontWeight: 600, fontSize: "0.95rem", marginBottom: "2rem" }}>
              {processingMsg}
            </p>

            <div style={{ maxWidth: 340, margin: "0 auto", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[
                "Scoring method attributes...",
                "Calculating transaction fees...",
                "Ranking by balanced score...",
                "Generating comparison table...",
              ].map((msg, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.65rem 1rem",
                  background: "var(--accent-subtle)", borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-accent)",
                  animation: `fadeIn 0.4s ease ${i * 0.25}s both`,
                }}>
                  <div className="spinner" style={{ width: 16, height: 16, borderTopColor: "var(--accent)" }} />
                  <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{msg}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 4: Results ───────────────────────── */}
        {step === 4 && savedResults.length > 0 && (
          <div className="fade-in">
            <ProgressBar step={4} total={4} />

            {/* Winner banner */}
            <div style={{
              padding: "1.25rem 1.5rem",
              background: "linear-gradient(135deg, rgba(29,78,216,0.1), rgba(59,130,246,0.05))",
              border: "1.5px solid var(--border-accent)",
              borderRadius: "var(--radius-lg)",
              marginBottom: "1.5rem",
              display: "flex", alignItems: "center", gap: "1rem",
            }}>
              <div style={{
                width: 56, height: 56, background: "linear-gradient(135deg, var(--accent-dark), var(--accent-light))",
                borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.6rem", flexShrink: 0, boxShadow: "0 4px 16px rgba(29,78,216,0.3)",
              }}>🏆</div>
              <div>
                <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-secondary)", marginBottom: "0.2rem" }}>
                  Best Payment Method for You
                </div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, fontFamily: "'Outfit', sans-serif", color: "var(--accent-dark)" }}>
                  {savedResults[0].name}
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                  Score: <strong style={{ color: "var(--success)" }}>{savedResults[0].score}</strong> / 10
                  {" · "}{savedResults[0].fee === 0 ? "Zero fees" : `${savedResults[0].fee}% fee`}
                  {" · "}{savedResults[0].security}/10 security
                </div>
              </div>
            </div>

            {/* Ranked list */}
            <h3 style={{ marginBottom: "1rem", fontSize: "1rem" }}>📊 Your Payment Methods — Ranked</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
              {savedResults.map((m, i) => (
                <div key={m.id} style={{
                  padding: "1rem 1.25rem",
                  background: i === 0 ? "rgba(29,78,216,0.05)" : "var(--bg-card)",
                  border: `1px solid ${i === 0 ? "var(--border-accent)" : "var(--border)"}`,
                  borderRadius: "var(--radius-md)",
                  boxShadow: "var(--shadow-card)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%",
                      background: i === 0 ? "linear-gradient(135deg, var(--accent-dark), var(--accent-light))" : "var(--bg-secondary)",
                      border: "1.5px solid var(--border)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 800, fontSize: "0.82rem",
                      color: i === 0 ? "white" : "var(--text-secondary)",
                    }}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: "0.95rem", color: i === 0 ? "var(--accent-dark)" : "var(--text-primary)" }}>
                        {m.name}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                        {m.type.toUpperCase()} · Fee: {m.fee === 0 ? "Free" : `${m.fee}%`}
                      </div>
                    </div>
                    <span className={`score-badge ${m.score >= 7 ? "score-high" : m.score >= 5 ? "score-mid" : "score-low"}`}>
                      ⭐ {m.score}
                    </span>
                  </div>

                  {/* Mini metric bars */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem 1.5rem" }}>
                    {[
                      { label: "🔐 Security", val: m.security },
                      { label: "⚡ Speed", val: m.speed },
                      { label: "📡 Availability", val: m.availability },
                      { label: "🎁 Rewards", val: m.rewards },
                    ].map(({ label, val }) => (
                      <div key={label}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--text-secondary)", marginBottom: "0.2rem" }}>
                          <span>{label}</span><span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{val}/10</span>
                        </div>
                        <div className="progress-bar" style={{ height: 4 }}>
                          <div className="progress-fill" style={{ width: `${val * 10}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* CTA buttons */}
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => navigate("/comparison")}>
                ⚖️ Run Full Comparison →
              </button>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => navigate("/analytics")}>
                📈 View Analytics
              </button>
            </div>
            <button className="btn btn-ghost w-full mt-1" style={{ fontSize: "0.82rem" }}
              onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
