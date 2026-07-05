import { useState, useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, RadialLinearScale,
  PointElement, LineElement, ArcElement, Filler,
  Tooltip, Legend,
} from "chart.js";
import { Bar, Radar, Line } from "react-chartjs-2";
import api from "../api/axios";

ChartJS.register(
  CategoryScale, LinearScale, BarElement, RadialLinearScale,
  PointElement, LineElement, ArcElement, Filler, Tooltip, Legend
);

const COLORS = [
  "rgba(29,78,216,0.85)", "rgba(59,130,246,0.85)", "rgba(96,165,250,0.85)",
  "rgba(147,197,253,0.85)", "rgba(16,185,129,0.85)", "rgba(245,158,11,0.85)",
];
const BORDER_COLORS = COLORS.map((c) => c.replace("0.85", "1"));

const CHART_OPTIONS = {
  responsive: true,
  plugins: {
    legend: { labels: { color: "#475569", font: { family: "Inter", size: 12 }, boxWidth: 14 } },
    tooltip: {
      backgroundColor: "rgba(255,255,255,0.97)",
      borderColor: "rgba(59,130,246,0.25)",
      borderWidth: 1,
      titleColor: "#0f172a",
      bodyColor: "#475569",
    },
  },
  scales: {
    x: { ticks: { color: "#64748b", font: { family: "Inter" } }, grid: { color: "rgba(59,130,246,0.06)" } },
    y: { ticks: { color: "#64748b", font: { family: "Inter" } }, grid: { color: "rgba(59,130,246,0.06)" }, beginAtZero: true },
  },
};

const RADAR_OPTIONS = {
  responsive: true,
  scales: {
    r: {
      min: 0, max: 10,
      ticks: { color: "#94a3b8", backdropColor: "transparent", font: { size: 10 } },
      grid: { color: "rgba(59,130,246,0.1)" },
      pointLabels: { color: "#475569", font: { family: "Inter", size: 11 } },
      angleLines: { color: "rgba(59,130,246,0.12)" },
    },
  },
  plugins: {
    legend: { labels: { color: "#475569", font: { family: "Inter", size: 12 }, boxWidth: 14 } },
    tooltip: {
      backgroundColor: "rgba(255,255,255,0.97)",
      borderColor: "rgba(59,130,246,0.25)",
      borderWidth: 1,
      titleColor: "#0f172a",
      bodyColor: "#475569",
    },
  },
};

export default function Analytics() {
  const [payments, setPayments] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [activeTab, setActiveTab] = useState("bar");
  const [aiRecData, setAiRecData] = useState(null);

  useEffect(() => {
    Promise.all([api.get("/payments"), api.get("/history")])
      .then(([p, h]) => {
        setPayments(p.data);
        setHistory(h.data);
        setSelected(p.data.slice(0, 5).map((x) => x.id));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selected.length < 2) {
      setAiRecData(null);
      return;
    }
    // Fetch LLM Report based on selected items
    const debounce = setTimeout(() => {
      api.post("/payments/compare", { ids: selected, criteria: "balanced" })
        .then(({ data }) => setAiRecData(data))
        .catch(console.error);
    }, 500);
    return () => clearTimeout(debounce);
  }, [selected]);

  const toggleMethod = (id) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length < 6 ? [...s, id] : s));
  };

  const visible = payments.filter((p) => selected.includes(p.id));
  const labels = visible.map((p) => p.name);

  // Bar chart data
  const barData = (metric, label) => ({
    labels,
    datasets: [{
      label,
      data: visible.map((p) => p[metric]),
      backgroundColor: COLORS.slice(0, visible.length),
      borderColor: BORDER_COLORS.slice(0, visible.length),
      borderWidth: 2,
      borderRadius: 6,
    }],
  });

  // Radar chart
  const radarData = {
    labels: ["Security", "Speed", "Availability", "Rewards", "Reliability"],
    datasets: visible.map((p, i) => ({
      label: p.name,
      data: [p.security, p.speed, p.availability, p.rewards, p.reliability],
      backgroundColor: COLORS[i % COLORS.length].replace("0.9", "0.15"),
      borderColor: BORDER_COLORS[i % BORDER_COLORS.length],
      borderWidth: 2,
      pointBackgroundColor: BORDER_COLORS[i % BORDER_COLORS.length],
      pointRadius: 4,
    })),
  };

  // Score trend from history
  const trendLabels = history.slice(0, 10).reverse().map((h, i) => `Session ${i + 1}`);
  const trendData = {
    labels: trendLabels,
    datasets: [{
      label: "Best Score",
      data: history.slice(0, 10).reverse().map((h) => {
        const best = h.methods.find((m) => m.id === h.best.id);
        return best?.score || 0;
      }),
      borderColor: "rgba(29,78,216,1)",
      backgroundColor: "rgba(59,130,246,0.12)",
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: "rgba(29,78,216,1)",
      pointRadius: 5,
    }],
  };

  const handleExport = async () => {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF();
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 220, 300, "F");

    doc.setTextColor(29, 78, 216);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("PaySmart — Analytics Report", 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(13);
    doc.text("Payment Method Comparison", 14, 45);

    autoTable(doc, {
      startY: 50,
      head: [["Method", "Score", "Security", "Speed", "Availability", "Rewards", "Fee %"]],
      body: visible.map((p) => [p.name, p.score, p.security, p.speed, p.availability, p.rewards, `${p.fee}%`]),
      styles: { fillColor: [248, 250, 255], textColor: [15, 23, 42], lineColor: [219, 234, 254] },
      headStyles: { fillColor: [29, 78, 216], textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [239, 246, 255] },
    });

    doc.save("paysmart-analytics.pdf");
  };

  const TABS = [
    { key: "bar", label: "📊 Bar Charts" },
    { key: "radar", label: "🕸️ Radar Chart" },
    { key: "trend", label: "📉 Trend Graph" },
  ];



  if (loading) return <div className="loading-page"><div className="spinner" style={{ width: 40, height: 40 }} /></div>;

  return (
    <div className="page">
      <div className="container">
        <div className="page-header flex justify-between items-center" style={{ flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 className="page-title">📈 Analytics Dashboard</h1>
            <p className="page-subtitle">Visualize and export payment method insights</p>
          </div>
          <button className="btn btn-primary" onClick={handleExport}>📄 Export PDF</button>
        </div>

        {/* AI Recommendation */}
        {aiRecData && (
          <div className="card fade-in mb-3" style={{
            background: "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(29,78,216,0.04))",
            border: "1px solid var(--border-accent)",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
              <div style={{ fontSize: "2.5rem" }}>🤖</div>
              <div>
                <div style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
                  AI Analyst Review — Best for You
                </div>
                <div style={{ fontSize: "1.2rem", fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: "var(--accent)", marginBottom: "0.35rem" }}>
                  🏆 {aiRecData.best.name} (Score: {aiRecData.best.score})
                </div>
                {aiRecData.report && (
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>
                    {aiRecData.report}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: "1.5rem" }}>
          {/* Method Selector */}
          <div className="card" style={{ alignSelf: "start" }}>
            <h3 style={{ marginBottom: "1rem" }}>📋 Methods ({selected.length}/6)</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {payments.map((p) => (
                <label key={p.id} className="checkbox-row" style={{
                  padding: "0.5rem 0.6rem",
                  borderRadius: "var(--radius-sm)",
                  background: selected.includes(p.id) ? "var(--accent-subtle)" : "transparent",
                  border: `1px solid ${selected.includes(p.id) ? "var(--border-accent)" : "transparent"}`,
                  transition: "all 0.15s",
                }}>
                  <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleMethod(p.id)} />
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>Score: {p.score}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Charts */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Tab Navigation */}
            <div style={{ display: "flex", gap: "0.5rem", background: "var(--bg-card)", padding: "0.4rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", width: "fit-content" }}>
              {TABS.map((t) => (
                <button key={t.key}
                  className={`btn ${activeTab === t.key ? "btn-primary" : "btn-ghost"}`}
                  style={{ borderRadius: "var(--radius-sm)", fontSize: "0.82rem" }}
                  onClick={() => setActiveTab(t.key)}>
                  {t.label}
                </button>
              ))}
            </div>

            {activeTab === "bar" && (
              <div className="grid grid-2 fade-in" style={{ gap: "1.25rem" }}>
                {[
                  { metric: "security", label: "🔐 Security Score" },
                  { metric: "speed", label: "⚡ Speed Score" },
                  { metric: "availability", label: "📡 Availability" },
                  { metric: "rewards", label: "🎁 Rewards" },
                  { metric: "fee", label: "💸 Transaction Fee (%)" },
                  { metric: "score", label: "⭐ Overall Score" },
                ].map(({ metric, label }) => (
                  <div key={metric} className="card">
                    <h3 style={{ fontSize: "0.88rem", marginBottom: "1rem" }}>{label}</h3>
                    <div className="chart-wrap">
                      <Bar data={barData(metric, label)} options={CHART_OPTIONS} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "radar" && (
              <div className="card fade-in">
                <h3 style={{ marginBottom: "1rem" }}>🕸️ Multi-Parameter Radar</h3>
                <div className="chart-wrap" style={{ maxWidth: 600, margin: "0 auto" }}>
                  <Radar data={radarData} options={RADAR_OPTIONS} />
                </div>
              </div>
            )}

            {activeTab === "trend" && (
              <div className="card fade-in">
                <h3 style={{ marginBottom: "1rem" }}>📉 Best Score Trend (History)</h3>
                {history.length < 2 ? (
                  <div className="empty-state" style={{ padding: "2rem" }}>
                    <div className="empty-icon">📉</div>
                    <p>Run at least 2 comparisons to see your trend graph.<br />Go to the <strong>Compare</strong> page and save results.</p>
                  </div>
                ) : (
                  <div className="chart-wrap">
                    <Line data={trendData} options={{ ...CHART_OPTIONS, scales: { ...CHART_OPTIONS.scales, y: { ...CHART_OPTIONS.scales.y, max: 10 } } }} />
                  </div>
                )}
              </div>
            )}

            {/* Summary Table */}
            <div className="card">
              <h3 style={{ marginBottom: "1rem" }}>📋 Data Summary</h3>
              <div style={{ overflowX: "auto" }}>
                <table className="compare-table">
                  <thead>
                    <tr>
                      <th>Method</th>
                      <th>Score</th>
                      <th>Security</th>
                      <th>Speed</th>
                      <th>Availability</th>
                      <th>Rewards</th>
                      <th>Reliability</th>
                      <th>Fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.sort((a, b) => b.score - a.score).map((p, i) => (
                      <tr key={p.id}>
                        <td><strong>{i === 0 && "🏆 "}{p.name}</strong></td>
                        <td><span className={`score-badge ${p.score >= 7 ? "score-high" : p.score >= 5 ? "score-mid" : "score-low"}`}>{p.score}</span></td>
                        <td>{p.security}</td>
                        <td>{p.speed}</td>
                        <td>{p.availability}</td>
                        <td>{p.rewards}</td>
                        <td>{p.reliability}</td>
                        <td style={{ color: p.fee === 0 ? "var(--success)" : "inherit" }}>{p.fee === 0 ? "Free" : `${p.fee}%`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
