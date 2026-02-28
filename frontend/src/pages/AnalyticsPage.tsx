import React, { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import { AnalyticsCharts } from "../components/analytics-charts/AnalyticsCharts";
import { StatsCards } from "../components/dashboard/stats-cards/StatsCards";
import { api } from "../services/api";
import type { DashboardStats } from "../types";

export const AnalyticsPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    api.getStats().then(setStats).catch(console.error);
  }, []);

  return (
    <>
      <div className="page-header">
        <BarChart3 size={22} />
        <div>
          <h1>Полная аналитика</h1>
          <p className="page-subtitle">
            Статистика обращений, эффективность AI и метрики техподдержки
          </p>
        </div>
      </div>

      {stats ? (
        <>
          <StatsCards stats={stats} />
          <AnalyticsCharts stats={stats} />
        </>
      ) : (
        <div style={{ color: "var(--text-muted)", padding: 20 }}>
          Загрузка данных...
        </div>
      )}
    </>
  );
};
