import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import PaymentCard from "../components/PaymentCard";
import PaymentModal from "../components/PaymentModal";

export default function Dashboard() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("score");
  const [filterType, setFilterType] = useState("all");
  const [modal, setModal] = useState({ open: false, editing: null });
  const [toast, setToast] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchPayments = useCallback(async () => {
    try {
      const { data } = await api.get("/payments");
      setPayments(data);
      if (data.length > 0) {
        setLoadingSummary(true);
        const sumReq = await api.get("/payments/summary");
        setSummary(sumReq.data.summary);
        setLoadingSummary(false);
      }
    } catch {
      showToast("Failed to load payments", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const handleSave = async (formData) => {
    if (modal.editing) {
      const { data } = await api.put(`/payments/${modal.editing.id}`, formData);
      setPayments((prev) => prev.map((p) => (p.id === data.id ? data : p)));
      showToast("Payment method updated!");
    } else {
      const { data } = await api.post("/payments", formData);
      setPayments((prev) => [data, ...prev]);
      showToast("Payment method added!");
    }
    
    // Refresh summary quietly
    try {
      const sumReq = await api.get("/payments/summary");
      setSummary(sumReq.data.summary);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this payment method?")) return;
    setDeleting(id);
    try {
      await api.delete(`/payments/${id}`);
      setPayments((prev) => prev.filter((p) => p.id !== id));
      showToast("Deleted successfully");
    } catch {
      showToast("Failed to delete", "error");
    } finally {
      setDeleting(null);
      
      // Refresh summary quietly
      try {
        const sumReq = await api.get("/payments/summary");
        setSummary(sumReq.data.summary);
      } catch (e) {}
    }
  };

  const handleExportPDF = async () => {
    if (payments.length === 0) return showToast("No payments to export", "error");
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF();
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, 220, 300, "F");

      doc.setTextColor(29, 78, 216);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("PaySmart — Dashboard Report", 14, 22);

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(13);
      doc.text(`Account Holder: ${user?.name || "User"}`, 14, 45);
      doc.text("All Saved Payment Methods", 14, 55);

      autoTable(doc, {
        startY: 60,
        head: [["Method", "Type", "Score", "Security", "Speed", "Availability", "Rewards", "Fee %"]],
        body: payments.map((p) => [p.name, p.type, p.score, p.security, p.speed, p.availability, p.rewards, `${p.fee}%`]),
        styles: { fillColor: [248, 250, 255], textColor: [15, 23, 42], lineColor: [219, 234, 254] },
        headStyles: { fillColor: [29, 78, 216], textColor: [255, 255, 255], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [239, 246, 255] },
      });

      doc.save("paysmart-full-report.pdf");
      showToast("Report downloaded successfully!");
    } catch (e) {
      showToast("Failed to generate PDF", "error");
    }
  };

  // Filter & sort
  const filtered = payments
    .filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchType = filterType === "all" || p.type === filterType;
      return matchSearch && matchType;
    })
    .sort((a, b) => {
      if (sortBy === "score") return b.score - a.score;
      if (sortBy === "fee") return a.fee - b.fee;
      if (sortBy === "speed") return b.speed - a.speed;
      if (sortBy === "security") return b.security - a.security;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });

  const bestId = payments.length > 0 ? payments.reduce((a, b) => (a.score > b.score ? a : b)).id : null;



  return (
    <div className="page">
      <div className="container">
        {/* Toast */}
        {toast && (
          <div style={{ position: "fixed", top: "80px", right: "1.5rem", zIndex: 9999 }}>
            <div className={`alert alert-${toast.type} slide-up`}>{toast.type === "success" ? "✅" : "⚠️"} {toast.msg}</div>
          </div>
        )}

        {/* Header */}
        <div className="page-header flex justify-between items-center" style={{ flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 className="page-title">
              👋 Welcome, <span className="text-accent">{user?.name?.split(" ")[0]}</span>
            </h1>
            <p className="page-subtitle">Manage and compare your payment methods</p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn btn-secondary" onClick={handleExportPDF}>
              📄 Download PDF
            </button>
            <button className="btn btn-primary" onClick={() => setModal({ open: true, editing: null })}>
              ➕ Add Payment Method
            </button>
          </div>
        </div>



        {/* AI Overview panel */}
        {payments.length > 0 && (
          <div className="card mb-3 fade-in" style={{
            background: "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(29,78,216,0.04))",
            border: "1px solid var(--border-accent)",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
              <div style={{ fontSize: "2.5rem", animation: loadingSummary ? "spin 2s linear infinite" : "none" }}>🤖</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <div style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-secondary)" }}>
                    AI Financial Dashboard Overview
                  </div>
                  {loadingSummary && <span className="spinner" style={{ width: 14, height: 14 }} />}
                </div>
                <div style={{ fontSize: "0.95rem", color: "var(--text-primary)", lineHeight: "1.6" }}>
                  {loadingSummary ? "Analyzing your payments..." : summary || "No summary available."}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div className="filter-bar">
          <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input className="form-control search-input" placeholder="Search payment methods..."
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <select className="form-control" style={{ width: "auto" }} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">All Types</option>
            <option value="upi">UPI</option>
            <option value="netbanking">Net Banking</option>
            <option value="creditcard">Credit Card</option>
            <option value="debitcard">Debit Card</option>
            <option value="wallet">E-Wallet</option>
            <option value="custom">Custom</option>
          </select>

          <select className="form-control" style={{ width: "auto" }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="score">Sort: Best Score</option>
            <option value="fee">Sort: Lowest Fee</option>
            <option value="speed">Sort: Fastest</option>
            <option value="security">Sort: Most Secure</option>
            <option value="name">Sort: Name A–Z</option>
          </select>
        </div>

        {/* Cards Grid */}
        {loading ? (
          <div className="loading-page"><div className="spinner" style={{ width: 40, height: 40 }} /><span>Loading payments...</span></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💳</div>
            <h3>{search || filterType !== "all" ? "No results found" : "No payment methods yet"}</h3>
            <p>{search || filterType !== "all" ? "Try adjusting your search or filters" : "Add your first payment method to get started"}</p>
            {!search && filterType === "all" && (
              <button className="btn btn-primary mt-2" onClick={() => setModal({ open: true, editing: null })}>
                ➕ Add First Method
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-auto">
            {filtered.map((p) => (
              <PaymentCard
                key={p.id}
                payment={p}
                isBest={p.id === bestId && !search && filterType === "all"}
                onEdit={(pm) => setModal({ open: true, editing: pm })}
                onDelete={deleting === p.id ? null : handleDelete}
              />
            ))}
          </div>
        )}

        {/* Modal */}
        <PaymentModal
          isOpen={modal.open}
          onClose={() => setModal({ open: false, editing: null })}
          onSave={handleSave}
          initial={modal.editing}
        />
      </div>
    </div>
  );
}
