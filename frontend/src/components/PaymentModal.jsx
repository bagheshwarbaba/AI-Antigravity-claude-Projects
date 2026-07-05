import { useState, useEffect } from "react";

const DEFAULT_FORM = {
  name: "", type: "upi", fee: "", speed: "7", security: "7",
  availability: "8", rewards: "5", reliability: "7", description: "",
};

function SliderField({ label, name, value, onChange, min = 0, max = 10, step = 0.5 }) {
  return (
    <div className="form-group">
      <div className="form-label" style={{ display: "flex", justifyContent: "space-between" }}>
        <span>{label}</span>
        <span style={{ color: "var(--accent)", fontWeight: 700 }}>{value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} name={name} value={value}
        onChange={onChange} />
    </div>
  );
}

export default function PaymentModal({ isOpen, onClose, onSave, initial }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name || "",
        type: initial.type || "upi",
        fee: String(initial.fee ?? ""),
        speed: String(initial.speed ?? 7),
        security: String(initial.security ?? 7),
        availability: String(initial.availability ?? 8),
        rewards: String(initial.rewards ?? 5),
        reliability: String(initial.reliability ?? 7),
        description: initial.description || "",
      });
    } else {
      setForm(DEFAULT_FORM);
    }
    setError("");
  }, [initial, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("Payment method name is required");
    if (form.fee === "" || isNaN(form.fee)) return setError("Please enter a valid fee");

    setLoading(true);
    try {
      await onSave({
        ...form,
        fee: parseFloat(form.fee),
        speed: parseFloat(form.speed),
        security: parseFloat(form.security),
        availability: parseFloat(form.availability),
        rewards: parseFloat(form.rewards),
        reliability: parseFloat(form.reliability),
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{initial ? "✏️ Edit Payment Method" : "➕ Add Payment Method"}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>

        {error && <div className="alert alert-error mb-2">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="modal-grid">
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label className="form-label">Method Name *</label>
              <input className="form-control" name="name" value={form.name}
                onChange={handleChange} placeholder="e.g. PhonePe, HDFC Card" autoFocus />
            </div>

            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-control" name="type" value={form.type} onChange={handleChange}>
                <option value="upi">UPI</option>
                <option value="netbanking">Net Banking</option>
                <option value="creditcard">Credit Card</option>
                <option value="debitcard">Debit Card</option>
                <option value="wallet">E-Wallet</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Transaction Fee (%)</label>
              <input className="form-control" type="number" name="fee" value={form.fee}
                onChange={handleChange} placeholder="0.00" min="0" max="10" step="0.1" />
            </div>
          </div>

          <hr className="divider" />
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <SliderField label="🔐 Security" name="security" value={form.security} onChange={handleChange} />
            <SliderField label="⚡ Speed" name="speed" value={form.speed} onChange={handleChange} />
            <SliderField label="📡 Availability" name="availability" value={form.availability} onChange={handleChange} />
            <SliderField label="🎁 Rewards" name="rewards" value={form.rewards} onChange={handleChange} />
            <SliderField label="✅ Reliability" name="reliability" value={form.reliability} onChange={handleChange} />
          </div>

          <div className="form-group mt-2">
            <label className="form-label">Description (optional)</label>
            <textarea className="form-control" name="description" value={form.description}
              onChange={handleChange} placeholder="Brief description of this payment method..."
              rows={2} style={{ resize: "vertical" }} />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner" /> Saving...</> : initial ? "Save Changes" : "Add Method"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
