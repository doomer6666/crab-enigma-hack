import React from "react";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import type { DashboardStats } from "../../types";
import "./AnalyticsCharts.css";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReactApexChart = (Chart as any).default || Chart;

interface Props {
  stats: DashboardStats;
}

const COLORS = [
  "#00d4ff", // Cyan
  "#a855f7", // Purple
  "#10b981", // Green
  "#f97316", // Orange
  "#ef4444", // Red
  "#3b82f6", // Blue
];

const SENTIMENT_COLORS = {
  positive: "#10b981",
  neutral: "#94a3b8",
  negative: "#ef4444",
};

const chartContainerStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  width: "100%",
  position: "relative",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
};

export const AnalyticsCharts: React.FC<Props> = ({ stats }) => {
  if (!stats || !stats.byCategory) {
    return <div>Загрузка данных...</div>;
  }

  // === 1. Категории ===
  const categoriesSorted = Object.entries(stats.byCategory).sort(
    ([, valA], [, valB]) => valB - valA,
  );

  const categoryOptions: ApexOptions = {
    chart: {
      type: "bar",
      toolbar: { show: false },
      background: "transparent",
      parentHeightOffset: 0,
    },
    theme: { mode: "dark" },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 3,
        barHeight: "70%",
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
      labels: {
        style: { colors: "#e2e8f0", fontSize: "11px" },
        maxWidth: 130,
      },
    },
    grid: {
      borderColor: "#2e3b52",
      xaxis: { lines: { show: true } },
      padding: { left: -10, right: 10, top: 0, bottom: 0 },
    },
    tooltip: { theme: "dark" },
    legend: { show: false },
  };
  const categorySeries = [
    { name: "Обращений", data: categoriesSorted.map(([, v]) => v) },
  ];

  // === 2. Статусы ===
  const statusLabels = ["Новые", "AI Обработано", "В работе", "Решено"];
  const statusSeries = [
    stats.byStatus["new"] || 0,
    stats.byStatus["ai_processed"] || 0,
    stats.byStatus["in_progress"] || 0,
    stats.byStatus["resolved"] || 0,
  ];
  const donutOptions: ApexOptions = {
    chart: { type: "donut", background: "transparent", parentHeightOffset: 0 },
    theme: { mode: "dark" },
    labels: statusLabels,
    colors: [COLORS[4], COLORS[1], COLORS[3], COLORS[2]],
    plotOptions: {
      pie: {
        customScale: 1,
        offsetY: 0,
        donut: {
          size: "65%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Всего",
              color: "#e2e8f0",
              fontSize: "14px",
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter: (w: any) =>
                w.globals.seriesTotals.reduce(
                  (a: number, b: number) => a + b,
                  0,
                ),
            },
          },
        },
      },
    },
    stroke: { show: true, colors: ["#1a2035"], width: 2 },
    dataLabels: { enabled: false },
    legend: {
      position: "bottom",
      labels: { colors: "#94a3b8" },
      itemMargin: { horizontal: 10, vertical: 0 },
    },
    grid: { padding: { top: 0, bottom: 0, left: 0, right: 0 } },
  };

  // === 3. Приоритеты ===
  const priorityOrder = ["critical", "high", "medium", "low"];
  const priorityLabels = ["Критич.", "Высокий", "Средний", "Низкий"];
  const priorityValues = priorityOrder.map((key) => stats.byPriority[key] || 0);

  const priorityOptions: ApexOptions = {
    chart: {
      type: "bar",
      toolbar: { show: false },
      background: "transparent",
      parentHeightOffset: 0,
    },
    theme: { mode: "dark" },
    plotOptions: {
      bar: { borderRadius: 4, columnWidth: "55%", distributed: true },
    },
    colors: [COLORS[4], COLORS[3], COLORS[0], COLORS[2]],
    dataLabels: { enabled: false },
    xaxis: {
      categories: priorityLabels,
      labels: { style: { colors: "#94a3b8", fontSize: "11px" } },
    },
    yaxis: { show: false },
    grid: {
      show: false,
      padding: { left: 0, right: 0, top: 0, bottom: 0 },
    },
    tooltip: { theme: "dark" },
    legend: { show: false },
  };
  const prioritySeries = [{ name: "Активные", data: priorityValues }];

  // === 4. Тональность ===
  const sentimentSeries = [
    stats.bySentiment["positive"] || 0,
    stats.bySentiment["neutral"] || 0,
    stats.bySentiment["negative"] || 0,
  ];
  const sentimentLabels = ["Позитив", "Нейтрально", "Негатив"];

  const sentimentOptions: ApexOptions = {
    chart: { type: "pie", background: "transparent", parentHeightOffset: 0 },
    theme: { mode: "dark" },
    labels: sentimentLabels,
    colors: [
      SENTIMENT_COLORS.positive,
      SENTIMENT_COLORS.neutral,
      SENTIMENT_COLORS.negative,
    ],
    plotOptions: {
      pie: {
        customScale: 1,
        offsetY: 0,
        dataLabels: {
          offset: -20,
          minAngleToShowLabel: 10,
        },
      },
    },
    stroke: { show: true, colors: ["#1a2035"], width: 2 },
    dataLabels: {
      enabled: true,
      dropShadow: { enabled: false },
      style: { fontSize: "12px", fontWeight: 700, colors: ["#fff"] },
    },
    legend: {
      position: "bottom",
      labels: { colors: "#94a3b8" },
      itemMargin: { horizontal: 10, vertical: 0 },
    },
    tooltip: { theme: "dark" },
    grid: { padding: { top: 0, bottom: 0, left: 0, right: 0 } },
  };

  return (
    <div className="charts-grid">
      {/* 1. Категории */}
      <div className="chart-card">
        <h3 className="chart-title">Тематика обращений</h3>
        <div style={chartContainerStyle}>
          <ReactApexChart
            options={categoryOptions}
            series={categorySeries}
            type="bar"
            height="100%"
            width="100%"
          />
        </div>
      </div>

      {/* 2. Приоритеты */}
      <div className="chart-card">
        <h3 className="chart-title">Приоритет (активные)</h3>
        <div style={chartContainerStyle}>
          <ReactApexChart
            options={priorityOptions}
            series={prioritySeries}
            type="bar"
            height="100%"
            width="100%"
          />
        </div>
      </div>

      {/* 3. Статусы */}
      <div className="chart-card">
        <h3 className="chart-title">Статус обработки</h3>
        <div style={chartContainerStyle}>
          <ReactApexChart
            options={donutOptions}
            series={statusSeries}
            type="donut"
            height="100%"
            width="100%"
          />
        </div>
      </div>

      {/* 4. Тональность */}
      <div className="chart-card">
        <h3 className="chart-title">Эмоциональный окрас</h3>
        <div style={chartContainerStyle}>
          <ReactApexChart
            options={sentimentOptions}
            series={sentimentSeries}
            type="pie"
            height="100%"
            width="100%"
          />
        </div>
      </div>
    </div>
  );
};
