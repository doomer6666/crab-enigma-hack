import React, { useEffect, useState } from "react";
import {
  Inbox,
  Zap,
  CheckCircle,
  ThumbsDown,
  Bot,
  FolderOpen,
} from "lucide-react";
import type { DashboardStats } from "../../types";
import { api } from "../../services/api";
import "./Dashboard.css";

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getStats()
      .then((s) => {
        if (!cancelled) setStats(s);
      })
      .catch(console.error);
    return () => {
      cancelled = true;
    };
  }, []);

  if (!stats) return null;

  const activeCount =
    (stats.byStatus["new"] || 0) +
    (stats.byStatus["ai_processed"] || 0) +
    (stats.byStatus["in_progress"] || 0);

  return (
    <div className="dashboard">
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
      <div className="stat-card stat-ai">
        <Bot size={20} className="stat-icon stat-icon-ai" />
        <div className="stat-value">{stats.byStatus["ai_processed"] || 0}</div>
        <div className="stat-label">AI готово</div>
      </div>
      <div className="stat-card stat-categories">
        <FolderOpen size={20} className="stat-icon stat-icon-categories" />
        <div className="stat-value">
          {Object.keys(stats.byCategory || {}).length}
        </div>
        <div className="stat-label">Категорий</div>
      </div>
    </div>
  );
};
