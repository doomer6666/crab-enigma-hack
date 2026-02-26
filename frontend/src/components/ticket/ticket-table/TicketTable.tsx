import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Search,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Smile,
  Meh,
  Frown,
} from "lucide-react";
import "./TicketTable.css";
import { api } from "../../../services/api";
import type { Ticket, TicketListResponse, TicketFilters } from "../../../types";
import { PriorityBadge } from "../../badges/PriorityBadge";
import { StatusBadge } from "../../badges/StatusBadge";

interface Props {
  onSelectTicket: (ticket: Ticket) => void;
  selectedId?: number;
}

const SENTIMENT_ICONS: Record<string, React.ReactNode> = {
  positive: <Smile size={18} className="sentiment-positive" />,
  neutral: <Meh size={18} className="sentiment-neutral" />,
  negative: <Frown size={18} className="sentiment-negative" />,
};

export const TicketTable: React.FC<Props> = ({
  onSelectTicket,
  selectedId,
}) => {
  const [data, setData] = useState<TicketListResponse>({ items: [], total: 0 });
  const [filters, setFilters] = useState<TicketFilters>({ page: 1, size: 20 });
  const [search, setSearch] = useState("");
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  const currentKey = JSON.stringify({ ...filters, search });
  const loading = loadedKey !== currentKey;

  const filtersRef = useRef(filters);
  const searchRef = useRef(search);

  useEffect(() => {
    filtersRef.current = filters;
    searchRef.current = search;
  }, [filters, search]);

  useEffect(() => {
    let cancelled = false;
    api
      .getTickets({ ...filters, search: search || undefined })
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setLoadedKey(JSON.stringify({ ...filters, search }));
        }
      })
      .catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [filters, search]);

  useEffect(() => {
    const interval = setInterval(() => {
      api
        .getTickets({
          ...filtersRef.current,
          search: searchRef.current || undefined,
        })
        .then(setData)
        .catch(console.error);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = useCallback(() => {
    api
      .getTickets({ ...filters, search: search || undefined })
      .then(setData)
      .catch(console.error);
  }, [filters, search]);

  const updateFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined, page: 1 }));
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="ticket-table-wrapper">
      {/* Toolbar */}
      <div className="table-toolbar">
        <div className="toolbar-filters">
          <div className="search-wrapper">
            <Search size={14} className="search-icon" />
            <input
              className="search-input"
              type="text"
              placeholder="Поиск по теме, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="filter-select"
            value={filters.status || ""}
            onChange={(e) => updateFilter("status", e.target.value)}
          >
            <option value="">Все статусы</option>
            <option value="new">Новые</option>
            <option value="ai_processed">AI обработан</option>
            <option value="in_progress">В работе</option>
            <option value="resolved">Решённые</option>
            <option value="closed">Закрытые</option>
          </select>
          <select
            className="filter-select"
            value={filters.priority || ""}
            onChange={(e) => updateFilter("priority", e.target.value)}
          >
            <option value="">Все приоритеты</option>
            <option value="critical">Критический</option>
            <option value="high">Высокий</option>
            <option value="medium">Средний</option>
            <option value="low">Низкий</option>
          </select>
        </div>
        <div className="toolbar-actions">
          <button className="btn btn-ghost" onClick={handleRefresh}>
            <RefreshCw size={14} />
            Обновить
          </button>
          <button className="btn btn-secondary" onClick={() => api.exportCsv()}>
            <FileText size={14} />
            CSV
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => api.exportXlsx()}
          >
            <FileSpreadsheet size={14} />
            XLSX
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="tickets-table">
          <thead>
            <tr>
              <th className="th-id">#</th>
              <th className="th-subject">Тема</th>
              <th>Отправитель</th>
              <th>Категория</th>
              <th>Приоритет</th>
              <th>Тональность</th>
              <th>AI %</th>
              <th>Статус</th>
              <th>Дата</th>
            </tr>
          </thead>
          <tbody>
            {loading && data.items.length === 0 && (
              <tr>
                <td colSpan={9} className="table-empty">
                  <div className="loading-spinner" />
                  Загрузка...
                </td>
              </tr>
            )}
            {!loading && data.items.length === 0 && (
              <tr>
                <td colSpan={9} className="table-empty">
                  Обращения не найдены
                </td>
              </tr>
            )}
            {data.items.map((ticket) => (
              <tr
                key={ticket.id}
                className={`ticket-row ${selectedId === ticket.id ? "selected" : ""} ${
                  ticket.status === "new" ? "row-new" : ""
                }`}
                onClick={() => onSelectTicket(ticket)}
              >
                <td className="td-id">
                  <span className="ticket-id">{ticket.id}</span>
                </td>
                <td className="td-subject">
                  <div className="subject-text">{ticket.subject}</div>
                </td>
                <td>
                  <div className="sender-name">{ticket.sender_name || "—"}</div>
                  <div className="sender-email">{ticket.sender_email}</div>
                </td>
                <td>
                  <span className="category-tag">
                    {ticket.category?.name || "—"}
                  </span>
                </td>
                <td>
                  <PriorityBadge priority={ticket.priority} />
                </td>
                <td className="td-sentiment">
                  <span title={ticket.sentiment}>
                    {SENTIMENT_ICONS[ticket.sentiment] || <Meh size={18} />}
                  </span>
                </td>
                <td className="td-confidence">
                  {ticket.confidence ? (
                    <span className="confidence-value">
                      {Math.round(ticket.confidence * 100)}%
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  <StatusBadge status={ticket.status} />
                </td>
                <td className="td-date">
                  {formatDate(ticket.received_at || ticket.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <span className="results-count">
          Показано {data.items.length} из {data.total}
        </span>
      </div>
    </div>
  );
};
