import React from "react";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import type { DashboardStats } from "../../types";

// --- ФИКС БЕЛОГО ЭКРАНА ---
// Проверка корректности импорта для Vite/React 19
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReactApexChart = (Chart as any).default || Chart;

interface Props {
  stats: DashboardStats;
}

const COLORS = [
  "#00d4ff",
  "#a855f7",
  "#10b981",
  "#f97316",
  "#ef4444",
  "#3b82f6",
];

export const AnalyticsCharts: React.FC<Props> = ({ stats }) => {
  // Защита от пустых данных
  if (!stats || !stats.byCategory || !stats.byStatus || !stats.byPriority) {
    return <div>Загрузка данных для графиков...</div>;
  }

  // 1. Категории
  const categoriesSorted = Object.entries(stats.byCategory || {}).sort(
    ([, valA], [, valB]) => valB - valA,
  );

  const categoryOptions: ApexOptions = {
    chart: { type: "bar", toolbar: { show: false }, background: "transparent" },
    theme: { mode: "dark" },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        barHeight: "60%",
        distributed: true,
      },
    },
    colors: [COLORS[0]],
    dataLabels: { enabled: true, textAnchor: "start", offsetX: 0 },
    xaxis: {
      categories: categoriesSorted.map(([k]) => k),
      labels: { style: { colors: "#94a3b8" } },
    },
    yaxis: {
      labels: { style: { colors: "#e2e8f0", fontSize: "11px" } },
    },
    grid: { borderColor: "#2e3b52", xaxis: { lines: { show: true } } },
    tooltip: { theme: "dark" },
    legend: { show: false },
  };

  const categorySeries = [
    { name: "Обращений", data: categoriesSorted.map(([, v]) => v) },
  ];

  // 2. Статусы
  const statusLabels = ["Новые", "AI Обработано", "В работе", "Решено"];
  const statusSeries = [
    stats.byStatus["new"] || 0,
    stats.byStatus["ai_processed"] || 0,
    stats.byStatus["in_progress"] || 0,
    stats.byStatus["resolved"] || 0,
  ];

  const donutOptions: ApexOptions = {
    chart: { type: "donut", background: "transparent" },
    theme: { mode: "dark" },
    labels: statusLabels,
    colors: [COLORS[4], COLORS[1], COLORS[3], COLORS[2]],
    plotOptions: {
      pie: {
        donut: {
          size: "65%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Всего",
              color: "#e2e8f0",
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter: function (w: any) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return w.globals.seriesTotals.reduce(
                  (a: number, b: number) => a + b,
                  0,
                );
              },
            },
          },
        },
      },
    },
    stroke: { show: true, colors: ["#1a2035"], width: 2 },
    dataLabels: { enabled: false },
    legend: { position: "bottom", labels: { colors: "#94a3b8" } },
  };

  // 3. Приоритеты
  const priorityOrder = ["critical", "high", "medium", "low"];
  const priorityLabels = ["Критический", "Высокий", "Средний", "Низкий"];
  const priorityValues = priorityOrder.map((key) => stats.byPriority[key] || 0);

  const priorityOptions: ApexOptions = {
    chart: { type: "bar", toolbar: { show: false }, background: "transparent" },
    theme: { mode: "dark" },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: "50%",
        distributed: true,
      },
    },
    colors: [COLORS[4], COLORS[3], COLORS[0], COLORS[2]],
    dataLabels: { enabled: false },
    xaxis: {
      categories: priorityLabels,
      labels: { style: { colors: "#94a3b8", fontSize: "11px" } },
    },
    yaxis: { show: false },
    grid: { show: false },
    tooltip: { theme: "dark" },
    legend: { show: false },
  };

  const prioritySeries = [{ name: "Количество", data: priorityValues }];

  return (
    <div className="charts-grid">
      <div className="chart-card large-chart">
        <h3 className="chart-title">Тематика обращений</h3>
        <div style={{ flex: 1, minHeight: 0 }}>
          <ReactApexChart
            options={categoryOptions}
            series={categorySeries}
            type="bar"
            height="100%"
          />
        </div>
      </div>

      <div className="chart-card">
        <h3 className="chart-title">Статус обработки</h3>
        <div style={{ flex: 1, minHeight: 0 }}>
          <ReactApexChart
            options={donutOptions}
            series={statusSeries}
            type="donut"
            height="100%"
          />
        </div>
      </div>

      <div className="chart-card">
        <h3 className="chart-title">Приоритет задач</h3>
        <div style={{ flex: 1, minHeight: 0 }}>
          <ReactApexChart
            options={priorityOptions}
            series={prioritySeries}
            type="bar"
            height="100%"
          />
        </div>
      </div>
    </div>
  );
};
