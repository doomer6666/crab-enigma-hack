import type {
  TicketListResponse,
  Ticket,
  Message,
  KnowledgeArticle,
  TicketFilters,
  DashboardStats,
} from "../types";

const BASE = "/api";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(BASE + url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const realApi = {
  async getTickets(filters: TicketFilters): Promise<TicketListResponse> {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.priority) params.set("priority", filters.priority);
    params.set("page", String(filters.page));
    params.set("size", String(filters.size));
    return request(`/tickets?${params}`);
  },

  async getTicket(id: number): Promise<Ticket> {
    return request(`/tickets/${id}`);
  },

  async updateTicket(id: number, updates: Partial<Ticket>): Promise<Ticket> {
    return request(`/tickets/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  },

  async getMessages(ticketId: number): Promise<Message[]> {
    return request(`/tickets/${ticketId}/messages`);
  },

  async sendReply(
    ticketId: number,
    bodyText: string,
  ): Promise<{ success: boolean }> {
    return request("/tickets/reply", {
      method: "POST",
      body: JSON.stringify({ ticket_id: ticketId, body_text: bodyText }),
    });
  },

  async searchKnowledge(query: string): Promise<KnowledgeArticle[]> {
    return request(`/knowledge/search?q=${encodeURIComponent(query)}`);
  },

  async getStats(): Promise<DashboardStats> {
    return request("/stats");
  },

  exportCsv(): void {
    window.open(BASE + "/export/tickets/csv", "_blank");
  },

  exportXlsx(): void {
    window.open(BASE + "/export/tickets/xlsx", "_blank");
  },
};
