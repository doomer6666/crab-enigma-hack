import React, { useState } from "react";
import {
  ClipboardList,
  Activity,
  PanelLeftClose,
  PanelLeftOpen,
  BarChart3, // Новая иконка
} from "lucide-react";
import "./Layout.css";

interface Props {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Layout: React.FC<Props> = ({
  children,
  currentPage,
  onNavigate,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`layout ${collapsed ? "sidebar-collapsed" : ""}`}>
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">J</div>
          <div className="logo-text">
            <span className="logo-name">JARVIS</span>
            <span className="logo-subtitle">AI Support</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${currentPage === "tickets" ? "active" : ""}`}
            onClick={() => onNavigate("tickets")}
            title="Обращения"
          >
            <ClipboardList size={18} />
            <span className="nav-label">Обращения</span>
          </button>

          {/* НОВЫЙ ПУНКТ МЕНЮ */}
          <button
            className={`nav-item ${currentPage === "analytics" ? "active" : ""}`}
            onClick={() => onNavigate("analytics")}
            title="Аналитика"
          >
            <BarChart3 size={18} />
            <span className="nav-label">Аналитика</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="status-indicator">
            <Activity size={14} className="status-icon-pulse" />
            <span className="nav-label">Система активна</span>
          </div>
          <button
            className="collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Развернуть меню" : "Свернуть меню"}
          >
            {collapsed ? (
              <PanelLeftOpen size={16} />
            ) : (
              <PanelLeftClose size={16} />
            )}
          </button>
        </div>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
};
