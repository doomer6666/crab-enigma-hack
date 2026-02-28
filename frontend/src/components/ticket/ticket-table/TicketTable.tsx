import React, { useState, useEffect } from "react";
import {
  Search,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Smile,
  Meh,
  Frown,
  ArrowUp,
  ArrowDown,
  Loader2,
  AlertCircle,
} from "lucide-react";
import type { Ticket, TicketFilters } from "../../../types";
import { api } from "../../../services/api";
import { useTickets } from "../../../services/queries";
import { StatusBadge } from "../../badges/StatusBadge";
import "./TicketTable.css";
import { CustomSelect } from "../../ui/custom-select/CustomSelect";

const STATUS_OPTIONS = [
  { value: "", label: "Все статусы" },
  { value: "active", label: "Активные" },
  { value: "new", label: "Новые" },
  { value: "in_progress", label: "В работе" },
  { value: "resolved", label: "Решенные" },
  { value: "sentiment:negative", label: "Негативные" },
];

const SENTIMENT_ICONS: Record<string, React.ReactNode> = {
  positive: <Smile size={18} className="sentiment-positive" />,
  neutral: <Meh size={18} className="sentiment-neutral" />,
  negative: <Frown size={18} className="sentiment-negative" />,
};

interface Props {
  onSelectTicket: (ticket: Ticket) => void;
  selectedId?: number;
  filters: TicketFilters;
  onFiltersChange: React.Dispatch<React.SetStateAction<TicketFilters>>;
}

export const TicketTable: React.FC<Props> = ({
  onSelectTicket,
  selectedId,
  filters,
  onFiltersChange,
}) => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(handler);
  }, [search]);

  const { data, isLoading, isError, refetch, isFetching } = useTickets({
    ...filters,
    search: debouncedSearch,
  });

  const getSelectValue = () => {
    if (filters.sentiment === "negative") return "sentiment:negative";
    if (filters.status) return filters.status;
    return "";
  };

  const handleSelectChange = (value: string) => {
    onFiltersChange((prev) => {
      const newFilters = { ...prev, page: 1 };
      if (value === "sentiment:negative") {
        newFilters.status = "";
        newFilters.sentiment = "negative";
      } else {
        newFilters.status = value;
        newFilters.sentiment = "";
      }
      return newFilters;
    });
  };

  const handleSort = (field: string) => {
    onFiltersChange((prev) => ({
      ...prev,
      sortBy: field,
      sortDir:
        prev.sortBy === field && prev.sortDir === "desc" ? "asc" : "desc",
    }));
  };

  const renderSortIcon = (field: string) => {
    if (filters.sortBy !== field) return null;
    return filters.sortDir === "asc" ? (
      <ArrowUp size={12} />
    ) : (
      <ArrowDown size={12} />
    );
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateStr));
  };

  return (
    <div className="ticket-table-wrapper">
      <div className="table-toolbar">
        <div className="toolbar-filters">
          <div className="search-wrapper">
            <Search size={14} className="search-icon" />
            <input
              className="search-input"
              type="text"
              placeholder="Поиск по ФИО, объекту, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <CustomSelect
            options={STATUS_OPTIONS}
            value={getSelectValue()}
            onChange={handleSelectChange}
            placeholder="Все статусы"
          />
        </div>
        <div className="toolbar-actions">
          <button
            className="btn btn-ghost"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? (
              <Loader2 size={14} className="spin" />
            ) : (
              <RefreshCw size={14} />
            )}
            Обновить
          </button>
          <button className="btn btn-secondary" onClick={() => api.exportCsv()}>
            <FileText size={14} /> CSV
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => api.exportXlsx()}
          >
            <FileSpreadsheet size={14} /> XLSX
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="tickets-table">
          <thead>
            <tr>
              <th className="sortable" onClick={() => handleSort("created_at")}>
                <div className="th-content">
                  Дата {renderSortIcon("created_at")}
                </div>
              </th>
              <th>ФИО</th>
              <th>Объект</th>
              <th>Тип прибора</th>
              <th>Категория</th>
              <th className="sortable" onClick={() => handleSort("sentiment")}>
                <div className="th-content">
                  Окрас {renderSortIcon("sentiment")}
                </div>
              </th>
              <th className="sortable" onClick={() => handleSort("status")}>
                <div className="th-content">
                  Статус {renderSortIcon("status")}
                </div>
              </th>
              <th className="th-subject">Суть вопроса</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={8} className="table-empty">
                  <div className="loading-spinner" /> Загрузка данных...
                </td>
              </tr>
            )}
            {isError && (
              <tr>
                <td
                  colSpan={8}
                  className="table-empty"
                  style={{ color: "var(--danger)" }}
                >
                  <AlertCircle
                    size={16}
                    style={{ verticalAlign: "middle", marginRight: 8 }}
                  />
                  Ошибка загрузки данных
                </td>
              </tr>
            )}
            {!isLoading && !isError && data?.items.length === 0 && (
              <tr>
                <td colSpan={8} className="table-empty">
                  Обращения не найдены
                </td>
              </tr>
            )}
            {!isLoading &&
              data?.items.map((ticket) => (
                <tr
                  key={ticket.id}
                  className={`ticket-row ${selectedId === ticket.id ? "selected" : ""} ${ticket.status === "new" ? "row-new" : ""}`}
                  onClick={() => onSelectTicket(ticket)}
                >
                  <td className="td-date">
                    {formatDate(ticket.received_at || ticket.created_at)}
                  </td>
                  <td>
                    <div className="sender-name">{ticket.sender_name}</div>
                    <div className="sender-email">{ticket.sender_email}</div>
                  </td>
                  <td>
                    <span className="object-name">
                      {ticket.object_name || "-"}
                    </span>
                  </td>
                  <td>
                    <span className="device-type">
                      {ticket.device_type || "-"}
                    </span>
                  </td>
                  <td>
                    <span className="category-tag">
                      {ticket.category || "-"}
                    </span>
                  </td>
                  <td className="td-sentiment">
                    <span title={ticket.sentiment}>
                      {SENTIMENT_ICONS[ticket.sentiment] || <Meh size={18} />}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="td-description">
                    <div className="description-text">{ticket.subject}</div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <div className="table-footer">
        <span className="results-count">
          {data ? `Показано ${data.items.length} из ${data.total}` : "..."}
        </span>
      </div>
    </div>
  );
};
