import React from "react";
import { Inbox, Zap, CheckCircle, ThumbsDown } from "lucide-react";
import type { DashboardStats } from "../../../types";
import "./StatsCards.css";

// Экспортируем тип для использования в других файлах
export type FilterType = {
  type: "status" | "sentiment" | "all";
  value: string;
};

interface Props {
  stats: DashboardStats;
  onFilterSelect?: (filter: FilterType) => void;
}

export const StatsCards: React.FC<Props> = ({ stats, onFilterSelect }) => {
  // Активные = Все минус Решенные
  const resolvedCount = stats.byStatus["resolved"] || 0;
  const activeCount = stats.total - resolvedCount;

  const isInteractive = !!onFilterSelect;
  const cardClass = `stat-card ${isInteractive ? "interactive" : ""}`;

  const handleClick = (type: "status" | "sentiment" | "all", value: string) => {
    if (onFilterSelect) onFilterSelect({ type, value });
  };

  return (
    <div className="stats-grid">
      <div className={cardClass} onClick={() => handleClick("all", "")}>
        <Inbox size={20} className="stat-icon stat-icon-default" />
        <div className="stat-value">{stats.total}</div>
        <div className="stat-label">Всего</div>
      </div>

      <div
        className={`${cardClass} stat-active`}
        onClick={() => handleClick("all", "active")} // active обрабатывается в TicketTable как "не решенные"
      >
        <Zap size={20} className="stat-icon stat-icon-active" />
        <div className="stat-value">{activeCount}</div>
        <div className="stat-label">Активно</div>
      </div>

      <div
        className={`${cardClass} stat-resolved`}
        onClick={() => handleClick("status", "resolved")}
      >
        <CheckCircle size={20} className="stat-icon stat-icon-resolved" />
        <div className="stat-value">{resolvedCount}</div>
        <div className="stat-label">Решено</div>
      </div>

      <div
        className={`${cardClass} stat-negative`}
        onClick={() => handleClick("sentiment", "negative")}
      >
        <ThumbsDown size={20} className="stat-icon stat-icon-negative" />
        <div className="stat-value">{stats.bySentiment["negative"] || 0}</div>
        <div className="stat-label">Негатив</div>
      </div>
    </div>
  );
};
