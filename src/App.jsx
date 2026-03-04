import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import Pacientes from "./pages/Pacientes";
import Internar from "./pages/Internar";
import Internados from "./pages/Internados";
import Relatorios from "./pages/Relatorios";
import "./styles.css";

const PAGES = {
  dashboard: { label: "Dashboard", icon: "⬛", component: Dashboard },
  pacientes: { label: "Pacientes", icon: "👤", component: Pacientes },
  internar: { label: "Internar", icon: "🏥", component: Internar },
  internados: { label: "Internados", icon: "🛏", component: Internados },
  relatorios: { label: "Relatórios", icon: "📋", component: Relatorios },
};

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const Page = PAGES[page].component;

  return (
    <div className="app-layout">
      <aside className={`sidebar ${sidebarOpen ? "open" : "collapsed"}`}>
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">＋</span>
            {sidebarOpen && <span className="logo-text">PEP<span>Hospital</span></span>}
          </div>
          <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? "◀" : "▶"}
          </button>
        </div>
        <nav className="sidebar-nav">
          {Object.entries(PAGES).map(([key, { label, icon }]) => (
            <button
              key={key}
              className={`nav-item ${page === key ? "active" : ""}`}
              onClick={() => setPage(key)}
            >
              <span className="nav-icon">{icon}</span>
              {sidebarOpen && <span className="nav-label">{label}</span>}
            </button>
          ))}
        </nav>
        {sidebarOpen && (
          <div className="sidebar-footer">
            <span>Sistema PEP v1.0</span>
          </div>
        )}
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-title">
            <h1>{PAGES[page].label}</h1>
          </div>
          <div className="topbar-info">
            <span className="date-badge">
              {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
            </span>
          </div>
        </header>
        <div className="page-body">
          <Page onNavigate={setPage} />
        </div>
      </main>
    </div>
  );
}
