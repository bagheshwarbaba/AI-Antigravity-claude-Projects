import { useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import PaymentCard from "../components/PaymentCard";

const CRITERIA = [
  { key: "balanced", label: "⚖️ Balanced Score", desc: "Overall best across all metrics" },
  { key: "security", label: "🔐 Highest Security", desc: "Most secure option" },
  { key: "speed", label: "⚡ Highest Speed", desc: "Fastest transaction" },
  { key: "fee", label: "💸 Lowest Fee", desc: "Cheapest to use" },
];

export default function Comparison() {
  const [payments, setPayments] = useState([]);
  const [selected, setSelected] = useState([]);
  const [criteria, setCriteria] = useState("balanced");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [savingHistory, setSavingHistory] = useState(false);
  const [toast, setToast] = useState(null);
  const [filters, setFilters] = useState({ maxFee: 10, minSpeed: 0, minSecurity: 0 });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAll = useCallback(async () => {
    try {
      const [paymentsRes, historyRes] = await Promise.all([api.get("/payments"), api.get("/history")]);
      setPayments(paymentsRes.data);
      setHistory(historyRes.data);
    } catch {
      showToast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : prev.length < 6 ? [...prev, id] : prev
    );
    setResult(null);
  };

  const handleCompare = async () => {
    if (selected.length < 2) return showToast("Select at least 2 methods to compare", "error");
    setComparing(true);
    try {
      const { data } = await api.post("/payments/compare", { ids: selected, criteria });
      setResult(data);
    } catch {
      showToast("Comparison failed", "error");
    } finally {
      setComparing(false);
    }
  };

  const saveToHistory = async () => {
    if (!result) return;
    setSavingHistory(true);
    try {
      await api.post("/history", { methods: result.methods, best: result.best, criteria });
      const { data } = await api.get("/history");
      setHistory(data);
      showToast("Comparison saved to history!");
    } catch {
      showToast("Failed to save", "error");
    } finally {
      setSavingHistory(false);
    }
  };

  const deleteHistory = async (id) => {
    await api.delete(`/history/${id}`);
    setHistory((h) => h.filter((x) => x.id !== id));
  };

  // Apply filters
  const filteredPayments = payments.filter(
    (p) => p.fee <= filters.maxFee && p.speed >= filters.minSpeed && p.security >= filters.minSecurity
  );

  const METRICS = ["security", "speed", "availability", "rewards", "reliability"];

  return (
    <div className="page">
      <div className="container">
        {toast && (
          <div style={{ position: "fixed", top: "80px", right: "1.5rem", zIndex: 9999 }}>
            <div className={`alert alert-${toast.type} slide-up`}>{toast.type === "success" ? "✅" : "⚠️"} {toast.msg}</div>
          </div>
        )}

        <div className="page-header">
          <h1 className="page-title">⚖️ Smart Comparison Engine</h1>
          <p className="page-subtitle">Select up to 6 payment methods and compare them intelligently</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "1.5rem" }}>
          {/* Left Panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Criteria */}
            <div className="card">
              <h3 style={{ marginBottom: "1rem" }}>🎯 Comparison Criteria</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {CRITERIA.map((c) => (
                  <button
                    key={c.key}
                    className={`btn btn-secondary ${criteria === c.key ? "criteria-btn active" : "criteria-btn"}`}
                    style={{ justifyContent: "flex-start", padding: "0.65rem 1rem", borderRadius: "var(--radius-sm)", textAlign: "left" }}
                    onClick={() => { setCriteria(c.key); setResult(null); }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{c.label}</div>
                      <div style={{ fontSize: "0.72rem", opacity: 0.7, marginTop: "0.1rem" }}>{c.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div className="card">
              <h3 style={{ marginBottom: "1rem" }}>🔧 Smart Filters</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div className="form-group">
                  <div className="form-label" style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Max Fee</span><span style={{ color: "var(--accent)" }}>{filters.maxFee}%</span>
                  </div>
                  <input type="range" min={0} max={10} step={0.5} value={filters.maxFee}
                    onChange={(e) => setFilters((f) => ({ ...f, maxFee: parseFloat(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <div className="form-label" style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Min Speed</span><span style={{ color: "var(--accent)" }}>{filters.minSpeed}/10</span>
                  </div>
                  <input type="range" min={0} max={10} step={0.5} value={filters.minSpeed}
                    onChange={(e) => setFilters((f) => ({ ...f, minSpeed: parseFloat(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <div className="form-label" style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Min Security</span><span style={{ color: "var(--accent)" }}>{filters.minSecurity}/10</span>
                  </div>
                  <input type="range" min={0} max={10} step={0.5} value={filters.minSecurity}
                    onChange={(e) => setFilters((f) => ({ ...f, minSecurity: parseFloat(e.target.value) }))} />
                </div>
              </div>
            </div>

            {/* Selected */}
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <h3>Selected ({selected.length}/6)</h3>
                {selected.length > 0 && (
                  <button className="btn btn-ghost btn-sm" onClick={() => { setSelected([]); setResult(null); }}>Clear</button>
                )}
              </div>
              {selected.length === 0 ? (
                <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>Click cards on the right to select</p>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {selected.map((id) => {
                    const p = payments.find((x) => x.id === id);
                    return p ? (
                      <span key={id} className="badge" style={{ cursor: "pointer" }} onClick={() => toggleSelect(id)}>
                        {p.name} ✕
                      </span>
                    ) : null;
                  })}
                </div>
              )}
              <button
                className="btn btn-primary w-full mt-2"
                onClick={handleCompare}
                disabled={selected.length < 2 || comparing}
              >
                {comparing ? <><span className="spinner" /> Analyzing...</> : "⚡ Compare Now"}
              </button>
            </div>
          </div>

          {/* Right Panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Payment Selection Grid */}
            {loading ? (
              <div className="loading-page"><div className="spinner" style={{ width: 36, height: 36 }} /></div>
            ) : (
              <div>
                <h3 style={{ marginBottom: "1rem" }}>
                  Select Methods
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 400, marginLeft: "0.5rem" }}>
                    ({filteredPayments.length} available after filters)
                  </span>
                </h3>
                <div className="grid grid-auto">
                  {filteredPayments.map((p) => (
                    <PaymentCard key={p.id} payment={p}
                      selectable selected={selected.includes(p.id)} onSelect={toggleSelect} />
                  ))}
                </div>
              </div>
            )}

            {/* Comparison Result */}
            {result && (
              <div className="card fade-in" style={{ border: "1px solid var(--border-accent)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                  <h3>📊 Comparison Results</h3>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button className="btn btn-secondary btn-sm" onClick={saveToHistory} disabled={savingHistory}>
                      {savingHistory ? <span className="spinner" /> : "💾 Save"}
                    </button>
                  </div>
                </div>

                {/* Best Pick Banner */}
                <div style={{
                  padding: "1rem 1.25rem",
                  background: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(29,78,216,0.05))",
                  border: "1px solid var(--border-accent)",
                  borderRadius: "var(--radius-md)",
                  marginBottom: "1.25rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem"
                }}>
                  <span style={{ fontSize: "2rem" }}>🏆</span>
                  <div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Best Pick for {criteria}</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 800, fontFamily: "'Outfit', sans-serif", color: "var(--accent)" }}>
                      {result.best.name}
                    </div>
                  </div>
                </div>

                {/* LLM Report Banner */}
                {result.report && (
                  <div style={{ marginBottom: "1.25rem", padding: "1rem", background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "var(--radius-md)", fontSize: "0.9rem", lineHeight: "1.5" }}>
                     <h4 style={{ color: "var(--accent-dark)", marginBottom: "0.5rem" }}>🤖 AI Analyst Verdict</h4>
                     <p style={{ whiteSpace: "pre-wrap", color: "var(--text-secondary)" }}>{result.report}</p>
                  </div>
                )}

                {/* Comparison Table */}
                <div style={{ overflowX: "auto" }}>
                  <table className="compare-table">
                    <thead>
                      <tr>
                        <th>Method</th>
                        <th>Score</th>
                        {METRICS.map((m) => (
                          <th key={m} style={{ textTransform: "capitalize" }}>{m}</th>
                        ))}
                        <th>Fee</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.methods
                        .sort((a, b) => b.score - a.score)
                        .map((m) => (
                          <tr key={m.id} className={m.id === result.best.id ? "best-row" : ""}>
                            <td>
                              <strong style={{ color: m.id === result.best.id ? "var(--accent)" : "var(--text-primary)" }}>
                                {m.id === result.best.id && "🏆 "}{m.name}
                              </strong>
                            </td>
                            <td>
                              <span className={`score-badge ${m.score >= 7 ? "score-high" : m.score >= 5 ? "score-mid" : "score-low"}`}>
                                {m.score}
                              </span>
                            </td>
                            {METRICS.map((metric) => (
                              <td key={metric}>{m[metric]}/10</td>
                            ))}
                            <td style={{ color: m.fee === 0 ? "var(--success)" : "var(--text-primary)" }}>
                              {m.fee === 0 ? "Free" : `${m.fee}%`}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* History */}
            {history.length > 0 && (
              <div className="card">
                <h3 style={{ marginBottom: "1rem" }}>📜 Comparison History</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {history.slice(0, 8).map((h) => (
                    <div key={h.id} className="history-item">
                      <div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                          {h.methods.map((m) => m.name).join(" vs ")}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                          Best: <span style={{ color: "var(--accent)" }}>{h.best.name}</span>
                          {" · "}{h.criteria}{" · "}
                          {new Date(h.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => deleteHistory(h.id)}>🗑️</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
