import React from "react";
import { ClipboardList, BookOpen, Activity, FlaskConical } from "lucide-react";
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
  return (
    <div className="layout">
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
          >
            <ClipboardList size={18} />
            <span>Обращения</span>
          </button>
          <button
            className={`nav-item ${currentPage === "knowledge" ? "active" : ""}`}
            onClick={() => onNavigate("knowledge")}
          >
            <BookOpen size={18} />
            <span>База знаний</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="status-indicator">
            <Activity size={14} className="status-icon-pulse" />
            <span>Система активна</span>
          </div>
          <div className="mock-badge">
            <FlaskConical size={12} />
            MOCK MODE
          </div>
        </div>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
};
