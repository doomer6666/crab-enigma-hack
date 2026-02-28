import React from "react";
import { Inbox, Zap, CheckCircle, ThumbsDown } from "lucide-react";
import type { DashboardStats } from "../../../types";
import "./StatsCards.css";

interface Props {
  stats: DashboardStats;
}

export const StatsCards: React.FC<Props> = ({ stats }) => {
  const activeCount =
    (stats.byStatus["new"] || 0) + (stats.byStatus["in_progress"] || 0);

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <Inbox size={20} className="stat-icon stat-icon-default" />
        <div className="stat-value">{stats.total}</div>
        <div className="stat-label">Всего</div>
      </div>
      <div className="stat-card stat-active">
        <Zap size={20} className="stat-icon stat-icon-active" />
        <div className="stat-value">{activeCount}</div>
        <div className="stat-label">Активных</div>
      </div>
      <div className="stat-card stat-resolved">
        <CheckCircle size={20} className="stat-icon stat-icon-resolved" />
        <div className="stat-value">{stats.byStatus["resolved"] || 0}</div>
        <div className="stat-label">Решено</div>
      </div>
      <div className="stat-card stat-negative">
        <ThumbsDown size={20} className="stat-icon stat-icon-negative" />
        <div className="stat-value">{stats.bySentiment["negative"] || 0}</div>
        <div className="stat-label">Негатив</div>
      </div>
    </div>
  );
};
