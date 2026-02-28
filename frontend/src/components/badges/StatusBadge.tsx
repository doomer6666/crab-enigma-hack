import React from "react";
import { CircleDot, Wrench, Clock, CheckCircle } from "lucide-react";
import type { TicketStatus } from "../../types";
import "./Badges.css";

const STATUS_CONFIG: Record<
  TicketStatus,
  { label: string; className: string; icon: React.ReactNode }
> = {
  new: {
    label: "Новый",
    className: "badge-new",
    icon: <CircleDot size={12} />,
  },
  in_progress: {
    label: "В работе",
    className: "badge-progress",
    icon: <Wrench size={12} />,
  },
  awaiting_reply: {
    label: "Ожидает",
    className: "badge-waiting",
    icon: <Clock size={12} />,
  },
  resolved: {
    label: "Решён",
    className: "badge-resolved",
    icon: <CheckCircle size={12} />,
  },
};

export const StatusBadge: React.FC<{ status: TicketStatus }> = ({ status }) => {
  const config = STATUS_CONFIG[status] || {
    label: status,
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
