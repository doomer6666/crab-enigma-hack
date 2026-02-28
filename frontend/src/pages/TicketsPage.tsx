import React, { useState, useCallback } from "react";
import { ClipboardList } from "lucide-react";
import { Dashboard } from "../components/dashboard/Dashboard";
import { TicketDetail } from "../components/ticket/ticket-detail/TicketDetail";
import { TicketTable } from "../components/ticket/ticket-table/TicketTable";
import type { Ticket } from "../types";

export const TicketsPage: React.FC = () => {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

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
            Входящие письма техподдержки, обработанные AI-агентом JARVIS
          </p>
        </div>
      </div>

      <Dashboard key={refreshKey} />

      <TicketTable
        onSelectTicket={setSelectedTicket}
        selectedId={selectedTicket?.id}
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
