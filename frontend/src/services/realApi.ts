/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  Ticket,
  TicketListResponse,
  Message,
  KnowledgeArticle,
  TicketFilters,
  DashboardStats,
} from "../types";
import * as XLSX from "xlsx";

const BASE = "/api";

function ticketsToRows(tickets: Ticket[]) {
  return tickets.map((t) => ({
    Дата: t.received_at ? new Date(t.received_at).toLocaleString("ru-RU") : "",
    ФИО: t.sender_name || "",
    Объект: t.object_name || "",
    Телефон: t.phone || "",
    Email: t.sender_email,
    "Заводские номера": t.serial_numbers || "",
    "Тип прибора": t.device_type || "",
    "Эмоциональный окрас": t.sentiment || "",
    Категория: t.category || "",
    Приоритет: t.priority || "",
    Статус: t.status || "",
    "AI уверенность": t.confidence ? `${Math.round(t.confidence * 100)}%` : "",
    "Суть вопроса": t.subject || "",
  }));
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function transformTags(tags: unknown): string[] {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  if (typeof tags === "string")
    return tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  return [];
}

function extractArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.results)) return obj.results as T[];
    if (Array.isArray(obj.items)) return obj.items as T[];
    if (Array.isArray(obj.messages)) return obj.messages as T[];
  }
  return [];
}

function extractTotal(data: unknown): number {
  if (Array.isArray(data)) return data.length;
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (typeof obj.count === "number") return obj.count;
    if (typeof obj.total === "number") return obj.total;
    if (Array.isArray(obj.results)) return obj.results.length;
  }
  return 0;
}

let cachedTickets: Ticket[] = [];

export const realApi = {
  async getTickets(filters: TicketFilters): Promise<TicketListResponse> {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.priority) params.set("priority", filters.priority);
    if (filters.search) params.set("search", filters.search);
    params.set("page", String(filters.page));
    params.set("size", String(filters.size));

    try {
      const res = await fetch(`${BASE}/tickets/?${params}`, {
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) return { items: [], total: 0 };

      const data = await res.json();
      const items = extractArray<Ticket>(data);
      const total = extractTotal(data);

      if (
        !filters.status &&
        !filters.priority &&
        !filters.search &&
        filters.page === 1
      ) {
        cachedTickets = items;
      }

      return { items, total };
    } catch (e) {
      console.error("getTickets error:", e);
      return { items: [], total: 0 };
    }
  },

  async getTicket(id: number): Promise<Ticket> {
    const res = await fetch(`${BASE}/tickets/${id}/`, {
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error(`Ticket ${id} not found`);
    return res.json();
  },

  async updateTicket(id: number, updates: Partial<Ticket>): Promise<Ticket> {
    const res = await fetch(`${BASE}/tickets/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error(`Update ticket ${id} failed`);
    return res.json();
  },

  async getMessages(ticketId: number): Promise<Message[]> {
    try {
      const res = await fetch(`${BASE}/tickets/${ticketId}/messages/`, {
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) return [];
      const data = await res.json();
      return extractArray<Message>(data);
    } catch {
      return [];
    }
  },

  async sendReply(
    ticketId: number,
    bodyText: string,
  ): Promise<{ success: boolean }> {
    try {
      const res = await fetch(`${BASE}/tickets/${ticketId}/reply/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body_text: bodyText }),
      });
      if (res.ok) return { success: true };
    } catch {
      /* ignore */
    }

    try {
      const res = await fetch(`${BASE}/tickets/${ticketId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved" }),
      });
      if (res.ok) return { success: true };
    } catch {
      /* ignore */
    }

    return { success: false };
  },

  async searchKnowledge(query: string): Promise<KnowledgeArticle[]> {
    try {
      const res = await fetch(
        `${BASE}/knowledge/?search=${encodeURIComponent(query)}`,
        { headers: { "Content-Type": "application/json" } },
      );
      if (!res.ok) return [];
      const data = await res.json();
      const raw = extractArray<any>(data);
      return raw.map((a: any) => ({
        id: a.id,
        title: a.title,
        content: a.content,
        category_id: a.category_id ?? null,
        tags: transformTags(a.tags),
      }));
    } catch {
      return [];
    }
  },

  async getStats(): Promise<DashboardStats> {
    try {
      const res = await fetch(`${BASE}/stats/`, {
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.total !== undefined) return data;
      }
    } catch {
      /* ignore */
    }

    try {
      const res = await fetch(`${BASE}/tickets/?size=1000&page=1`, {
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        return {
          total: 0,
          byStatus: {},
          byPriority: {},
          bySentiment: {},
          byCategory: {},
        };
      }

      const data = await res.json();
      const tickets = extractArray<Ticket>(data);
      const total = extractTotal(data);
      cachedTickets = tickets;

      const byStatus: Record<string, number> = {};
      const byPriority: Record<string, number> = {};
      const bySentiment: Record<string, number> = {};
      const byCategory: Record<string, number> = {};

      tickets.forEach((t) => {
        if (t.status) byStatus[t.status] = (byStatus[t.status] || 0) + 1;
        if (t.sentiment)
          bySentiment[t.sentiment] = (bySentiment[t.sentiment] || 0) + 1;
        const catName = t.category || "Другое";
        byCategory[catName] = (byCategory[catName] || 0) + 1;

        if (t.status !== "resolved" && t.priority) {
          byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
        }
      });

      return { total, byStatus, byPriority, bySentiment, byCategory };
    } catch {
      return {
        total: 0,
        byStatus: {},
        byPriority: {},
        bySentiment: {},
        byCategory: {},
      };
    }
  },

  exportCsv(): void {
    if (cachedTickets.length === 0) {
      alert("Нет данных для экспорта. Откройте таблицу и попробуйте снова.");
      return;
    }
    const rows = ticketsToRows(cachedTickets);
    const headers = Object.keys(rows[0]);
    const csvLines = [
      headers.join(";"),
      ...rows.map((row) =>
        headers
          .map((h) => {
            const val = String(row[h as keyof typeof row] ?? "");
            return `"${val.replace(/"/g, '""')}"`;
          })
          .join(";"),
      ),
    ];
    const bom = "\uFEFF";
    const blob = new Blob([bom + csvLines.join("\r\n")], {
      type: "text/csv;charset=utf-8;",
    });
    downloadBlob(blob, `tickets_${new Date().toISOString().slice(0, 10)}.csv`);
  },

  exportXlsx(): void {
    if (cachedTickets.length === 0) {
      alert("Нет данных для экспорта. Откройте таблицу и попробуйте снова.");
      return;
    }
    const rows = ticketsToRows(cachedTickets);
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const colWidths = Object.keys(rows[0] || {}).map((key) => {
      const maxLen = Math.max(
        key.length,
        ...rows.map((r) => String(r[key as keyof typeof r] ?? "").length),
      );
      return { wch: Math.min(maxLen + 2, 50) };
    });
    worksheet["!cols"] = colWidths;
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Обращения");
    XLSX.writeFile(
      workbook,
      `tickets_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  },
};
