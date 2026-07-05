const ICONS = {
  upi: "🏦", netbanking: "🖥️", creditcard: "💳",
  debitcard: "💰", wallet: "👜", custom: "⚡",
};

const TYPE_LABELS = {
  upi: "UPI", netbanking: "Net Banking", creditcard: "Credit Card",
  debitcard: "Debit Card", wallet: "E-Wallet", custom: "Custom",
};

function ScoreBadge({ score }) {
  const cls = score >= 7 ? "score-high" : score >= 5 ? "score-mid" : "score-low";
  return <span className={`score-badge ${cls}`}>⭐ {score}</span>;
}

function MetricBar({ label, value, max = 10, format }) {
  const pct = Math.min((value / max) * 100, 100);
  const display = format ? format(value) : `${value}`;
  return (
    <div className="metric-row">
      <div className="metric-label">
        <span>{label}</span>
        <span>{display}</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function PaymentCard({ payment, isBest, onEdit, onDelete, selectable, selected, onSelect }) {
  const icon = ICONS[payment.type] || "⚡";

  return (
    <div className={`payment-card fade-in ${isBest ? "best" : ""}`}>
      {isBest && (
        <div style={{ position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)" }}>
          <span className="badge" style={{ background: "var(--accent)", color: "#fff", borderColor: "var(--accent)", whiteSpace: "nowrap" }}>
            🏆 Best Pick
          </span>
        </div>
      )}

      <div className="payment-card-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {selectable && (
            <input
              type="checkbox"
              checked={!!selected}
              onChange={() => onSelect && onSelect(payment.id)}
              style={{ width: 17, height: 17, accentColor: "var(--accent)", cursor: "pointer" }}
            />
          )}
          <div className="payment-icon">{icon}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{payment.name}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{TYPE_LABELS[payment.type] || "Custom"}</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.35rem" }}>
          <ScoreBadge score={payment.score} />
          {(onEdit || onDelete) && (
            <div className="payment-card-actions">
              {onEdit && <button className="btn btn-ghost btn-sm btn-icon" onClick={() => onEdit(payment)} title="Edit">✏️</button>}
              {onDelete && <button className="btn btn-ghost btn-sm btn-icon" onClick={() => onDelete(payment.id)} title="Delete">🗑️</button>}
            </div>
          )}
        </div>
      </div>

      {payment.description && (
        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.75rem", lineHeight: 1.5 }}>
          {payment.description}
        </p>
      )}

      <div className="payment-metrics">
        <MetricBar label="Security" value={payment.security} />
        <MetricBar label="Speed" value={payment.speed} />
        <MetricBar label="Availability" value={payment.availability} />
        <MetricBar label="Rewards" value={payment.rewards} />
        <MetricBar label="Reliability" value={payment.reliability} />
        <MetricBar label="Fee" value={payment.fee} max={5} format={(v) => `${v}%`} />
      </div>
    </div>
  );
}
