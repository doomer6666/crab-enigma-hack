import React, { useEffect, useState, useRef, useCallback } from "react";
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
} from "lucide-react";
import type { Ticket, TicketListResponse, TicketFilters } from "../../../types";
import { api } from "../../../services/api";
import { StatusBadge } from "../../badges/StatusBadge";
import "./TicketTable.css";
import { CustomSelect } from "../../ui/custom-select/CustomSelect";
import type { FilterType } from "../../dashboard/stats-cards/StatsCards";

// Расширяем опции селекта, чтобы в нем можно было выбрать Активные и Негатив
const STATUS_OPTIONS = [
  { value: "", label: "Все статусы" },
  { value: "active", label: "Активные" },
  { value: "new", label: "Новые" },
  { value: "in_progress", label: "В работе" },
  { value: "resolved", label: "Решенные" },
  { value: "sentiment:negative", label: "Негативные" }, // Хак для селекта
];

interface Props {
  onSelectTicket: (ticket: Ticket) => void;
  selectedId?: number;
  externalFilter?: FilterType | null;
}

const SENTIMENT_ICONS: Record<string, React.ReactNode> = {
  positive: <Smile size={18} className="sentiment-positive" />,
  neutral: <Meh size={18} className="sentiment-neutral" />,
  negative: <Frown size={18} className="sentiment-negative" />,
};

export const TicketTable: React.FC<Props> = ({
  onSelectTicket,
  selectedId,
  externalFilter,
}) => {
  const [data, setData] = useState<TicketListResponse>({ items: [], total: 0 });
  const [filters, setFilters] = useState<TicketFilters>({
    page: 1,
    size: 20,
    sortBy: "created_at",
    sortDir: "desc",
    status: "",
    sentiment: "",
  });

  // Состояние для селекта (визуальное отображение)
  const [selectValue, setSelectValue] = useState("");

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const filtersRef = useRef(filters);
  const searchRef = useRef(search);

  // Реакция на изменение внешнего фильтра (клик по дашборду)
  useEffect(() => {
    if (externalFilter) {
      // Обновляем селект
      if (externalFilter.type === "status") {
        setSelectValue(externalFilter.value);
      } else if (
        externalFilter.type === "sentiment" &&
        externalFilter.value === "negative"
      ) {
        setSelectValue("sentiment:negative");
      } else if (
        externalFilter.type === "all" &&
        externalFilter.value === "active"
      ) {
        setSelectValue("active");
      } else {
        setSelectValue("");
      }

      setFilters((prev) => {
        const newFilters = { ...prev, page: 1 };

        if (externalFilter.type === "status") {
          newFilters.status = externalFilter.value;
          newFilters.sentiment = "";
        } else if (externalFilter.type === "sentiment") {
          newFilters.sentiment = externalFilter.value;
          newFilters.status = "";
        } else if (externalFilter.type === "all") {
          // Если "active", то передаем статус "active" (API должен его обработать как != resolved)
          // Если просто сброс (""), то пусто
          newFilters.status = externalFilter.value;
          newFilters.sentiment = "";
        }

        return newFilters;
      });
    }
  }, [externalFilter]);

  // Обработка выбора в селекте вручную
  const handleSelectChange = (value: string) => {
    setSelectValue(value);

    setFilters((prev) => {
      const newFilters = { ...prev, page: 1 };

      if (value === "sentiment:negative") {
        newFilters.status = "";
        newFilters.sentiment = "negative";
      } else {
        newFilters.status = value; // "active", "new", "resolved", ""
        newFilters.sentiment = "";
      }
      return newFilters;
    });
  };

  useEffect(() => {
    filtersRef.current = filters;
    searchRef.current = search;
  }, [filters, search]);

  const loadData = useCallback(
    async (isRefreshBtn = false) => {
      if (isRefreshBtn) setRefreshing(true);
      else setLoading(true);

      try {
        const result = await api.getTickets({
          ...filters,
          search: search || undefined,
        });
        setData(result);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filters, search],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const handleRefreshClick = () => {
    loadData(true);
  };

  const handleSort = (field: string) => {
    setFilters((prev) => {
      const isSameField = prev.sortBy === field;
      const newDir = isSameField && prev.sortDir === "desc" ? "asc" : "desc";
      return { ...prev, sortBy: field, sortDir: newDir };
    });
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
    return new Date(dateStr).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
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
              placeholder="Поиск по ФИО, объекту, email, номерам..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <CustomSelect
            options={STATUS_OPTIONS}
            value={selectValue}
            onChange={handleSelectChange}
            placeholder="Все статусы"
          />
        </div>
        <div className="toolbar-actions">
          <button
            className="btn btn-ghost"
            onClick={handleRefreshClick}
            disabled={refreshing}
          >
            {refreshing ? (
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
            {loading && (
              <tr>
                <td colSpan={8} className="table-empty">
                  <div className="loading-spinner" /> Загрузка...
                </td>
              </tr>
            )}
            {!loading && data.items.length === 0 && (
              <tr>
                <td colSpan={8} className="table-empty">
                  Обращения не найдены
                </td>
              </tr>
            )}
            {!loading &&
              data.items.map((ticket) => (
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
          Показано {data.items.length} из {data.total}
        </span>
      </div>
    </div>
  );
};
