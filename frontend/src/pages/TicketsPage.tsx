import React, { useState, useCallback } from "react";
import { ClipboardList } from "lucide-react";
import { Dashboard } from "../components/dashboard/Dashboard";
import { TicketTable } from "../components/ticket/ticket-table/TicketTable";
import { TicketDetail } from "../components/ticket/ticket-detail/TicketDetail";
import type { Ticket, TicketFilters } from "../types";
import type { FilterType } from "../components/dashboard/stats-cards/StatsCards";

export const TicketsPage: React.FC = () => {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const [filters, setFilters] = useState<TicketFilters>({
    page: 1,
    size: 20,
    sortBy: "created_at",
    sortDir: "desc",
    status: "",
    sentiment: "",
  });

  const handleTicketSelect = (ticket: Ticket) => {
    setSelectedTicket(ticket);
  };

  const handleCloseDetail = () => {
    setSelectedTicket(null);
  };

  const handleTicketUpdated = useCallback(() => {}, []);

  const handleDashboardFilter = (filter: FilterType) => {
    setFilters((prev) => {
      const newFilters = { ...prev, page: 1 };
      if (filter.type === "status") {
        newFilters.status = filter.value;
        newFilters.sentiment = "";
      } else if (filter.type === "sentiment") {
        newFilters.sentiment = filter.value;
        newFilters.status = "";
      } else if (filter.type === "all") {
        newFilters.status = filter.value;
        newFilters.sentiment = "";
      }
      return newFilters;
    });
  };

  return (
    <>
      <div className="page-header">
        <ClipboardList size={22} />
        <div>
          <h1>Обращения</h1>
          <p className="page-subtitle">
            Единый реестр заявок с AI-классификацией и приоритетами
          </p>
        </div>
      </div>

      <Dashboard onFilterChange={handleDashboardFilter} />

      <TicketTable
        filters={filters}
        onFiltersChange={setFilters}
        onSelectTicket={handleTicketSelect}
        selectedId={selectedTicket?.id}
      />

      {selectedTicket && (
        <TicketDetail
          ticket={selectedTicket}
          onClose={handleCloseDetail}
          onTicketUpdated={handleTicketUpdated}
        />
      )}
    </>
  );
};
