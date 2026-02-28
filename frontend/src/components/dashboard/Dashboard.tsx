import React, { useEffect, useState } from "react";
import type { DashboardStats } from "../../types";
import { api } from "../../services/api";
import { StatsCards } from "./stats-cards/StatsCards";

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

  return <StatsCards stats={stats} />;
};
