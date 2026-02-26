import React from "react";
import { AlertTriangle, ArrowUp, Minus, ArrowDown } from "lucide-react";
import "./Badges.css";

const PRIORITY_CONFIG: Record<
  string,
  { label: string; className: string; icon: React.ReactNode }
> = {
  critical: {
    label: "Критический",
    className: "priority-critical",
    icon: <AlertTriangle size={12} />,
  },
  high: {
    label: "Высокий",
    className: "priority-high",
    icon: <ArrowUp size={12} />,
  },
  medium: {
    label: "Средний",
    className: "priority-medium",
    icon: <Minus size={12} />,
  },
  low: {
    label: "Низкий",
    className: "priority-low",
    icon: <ArrowDown size={12} />,
  },
};

export const PriorityBadge: React.FC<{ priority: string }> = ({ priority }) => {
  const config = PRIORITY_CONFIG[priority] || {
    label: priority,
    className: "",
    icon: null,
  };
  return (
    <span className={`badge badge-with-icon ${config.className}`}>
      {config.icon}
      {config.label}
    </span>
  );
};
