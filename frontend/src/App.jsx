import React, { useEffect, useState } from "react";
import { HashRouter, Routes, Route, NavLink, Navigate } from "react-router-dom";
import { ToastProvider } from "./components/Toast";
import WorkspaceStatus from "./components/WorkspaceStatus";
import useAutoguardado from "./hooks/useAutoguardado";
import InicioPage from "./pages/InicioPage";
import TareasPage from "./pages/TareasPage";
import ClasificacionPage from "./pages/ClasificacionPage";
import AyudaPage from "./pages/AyudaPage";

const NAV_ITEMS = [
  {
    to: "/inicio",
    label: "INICIO",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="nav-icon">
        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
      </svg>
    ),
  },
  {
    to: "/tareas",
    label: "TAREAS",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="nav-icon">
        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    to: "/clasificacion",
    label: "CLASIFICACIÓN",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="nav-icon">
        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
      </svg>
    ),
  },
  {
    to: "/ayuda",
    label: "AYUDA",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="nav-icon">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
  },
];

function ThemeToggle() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("searchSimplifyTheme") ?? "dark"
  );
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
  function toggle() {
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      localStorage.setItem("searchSimplifyTheme", next);
      return next;
    });
  }
  const isDark = theme === "dark";
  return (
    <button
      onClick={toggle}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        width: "100%", padding: "10px 16px",
        background: "none", border: "none", borderTop: "1px solid var(--border)",
        color: "var(--text-muted)", fontSize: 11, cursor: "pointer",
        fontFamily: "var(--font-ui)", letterSpacing: "0.04em",
      }}
    >
      {isDark
        ? <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 14, height: 14 }}><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
        : <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 14, height: 14 }}><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" /></svg>
      }
      {isDark ? "Modo oscuro" : "Modo claro"}
    </button>
  );
}

function AppInner() {
  useAutoguardado();
  return (
    <div className="app-layout" style={{ gridTemplateColumns: "220px 1fr" }}>
      <nav className="nav-sidebar">
        <div className="nav-logo">
          <div className="nav-logo-text">SEARCH &amp; SIMPLIFY</div>
          <div className="nav-logo-sub">Priorización de tareas v0.2</div>
        </div>
        <div className="nav-links">
          <span className="nav-section-label">Navegación</span>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </div>
        <WorkspaceStatus />
        <ThemeToggle />
      </nav>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/inicio" replace />} />
          <Route path="/inicio" element={<InicioPage />} />
          <Route path="/tareas" element={<TareasPage />} />
          <Route path="/clasificacion" element={<ClasificacionPage />} />
          <Route path="/ayuda" element={<AyudaPage />} />
          {/* Compatibilidad con rutas anteriores */}
          <Route path="/consumo-tiempo" element={<Navigate to="/clasificacion" replace />} />
          <Route path="/criticidad" element={<Navigate to="/clasificacion" replace />} />
          <Route path="/facilidad" element={<Navigate to="/clasificacion" replace />} />
          <Route path="/resultado" element={<Navigate to="/clasificacion" replace />} />
          <Route path="*" element={<Navigate to="/inicio" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <ToastProvider>
        <AppInner />
      </ToastProvider>
    </HashRouter>
  );
}
