import React, { useEffect, useState } from "react";
import type { DashboardStats } from "../../types";
import { api } from "../../services/api";
import { StatsCards, type FilterType } from "./stats-cards/StatsCards";

interface Props {
  onFilterChange?: (filter: FilterType) => void;
}

export const Dashboard: React.FC<Props> = ({ onFilterChange }) => {
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

  return <StatsCards stats={stats} onFilterSelect={onFilterChange} />;
};
