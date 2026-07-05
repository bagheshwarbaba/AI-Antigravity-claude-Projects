import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-logo">
          <span style={{ fontSize: "1.4rem" }}>💳</span>
          Pay<span>Smart</span>
        </div>

        <div className="nav-links">
          <NavLink className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} to="/dashboard">
            📊 Dashboard
          </NavLink>
          <NavLink className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} to="/comparison">
            ⚖️ Compare
          </NavLink>
          <NavLink className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} to="/analytics">
            📈 Analytics
          </NavLink>
        </div>

        <div className="nav-user">
          <div style={{ textAlign: "right", display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>{user?.name}</span>
            <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>{user?.email}</span>
          </div>
          <div className="avatar" title={user?.name}>{initials}</div>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout} title="Logout">
            🚪
          </button>
        </div>
      </div>
    </nav>
  );
}
