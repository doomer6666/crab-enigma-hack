import React, { useState, useCallback } from "react";
import { ClipboardList } from "lucide-react";
import { Dashboard } from "../components/dashboard/Dashboard";
import { TicketTable } from "../components/ticket/ticket-table/TicketTable";
import { TicketDetail } from "../components/ticket/ticket-detail/TicketDetail";
import type { Ticket } from "../types";
import type { FilterType } from "../components/dashboard/stats-cards/StatsCards";

export const TicketsPage: React.FC = () => {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [externalFilter, setExternalFilter] = useState<FilterType | null>(null);

  const handleTicketUpdated = useCallback(() => {
    setRefreshKey((k) => k + 1);
    setSelectedTicket(null);
  }, []);

  return (
    <>
      <div className="page-header">
        <ClipboardList size={22} />
        <div>
          <h1>Обращения</h1>
          <p className="page-subtitle">
            Входящие письма технической поддержки ООО "ЭРИС"
          </p>
        </div>
      </div>

      <Dashboard
        key={refreshKey}
        onFilterChange={(filter) => setExternalFilter(filter)}
      />

      <TicketTable
        onSelectTicket={setSelectedTicket}
        selectedId={selectedTicket?.id}
        externalFilter={externalFilter}
      />

      {selectedTicket && (
        <TicketDetail
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onTicketUpdated={handleTicketUpdated}
        />
      )}
    </>
  );
};
