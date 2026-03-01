import { z } from "zod";
import * as XLSX from "xlsx";
import type {
  Ticket,
  TicketListResponse,
  Message,
  KnowledgeArticle,
  TicketFilters,
  DashboardStats,
} from "../types";

const BASE = "/api";

const stringOrNull = z
  .string()
  .nullable()
  .optional()
  .transform((val) => val ?? null);
const numberOrNull = z
  .number()
  .nullable()
  .optional()
  .transform((val) => val ?? null);

const TicketStatusSchema = z.enum([
  "new",
  "in_progress",
  "awaiting_reply",
  "resolved",
]);

const TicketSchema = z.object({
  id: z.number(),
  subject: z.string(),
  sender_name: z
    .string()
    .nullable()
    .optional()
    .transform((v) => v || "Неизвестный"),
  sender_email: z
    .string()
    .nullable()
    .optional()
    .transform((v) => v || ""),
  phone: stringOrNull,
  object_name: stringOrNull,
  serial_numbers: stringOrNull,
  device_type: stringOrNull,
  category: stringOrNull,
  priority: z.enum(["low", "medium", "high", "critical"]).catch("medium"),
  sentiment: z.enum(["positive", "neutral", "negative"]).catch("neutral"),
  confidence: numberOrNull,
  status: TicketStatusSchema.or(z.string())
    .transform((val) => (val === "closed" ? "resolved" : val))
    .pipe(TicketStatusSchema.catch("new")),
  ai_draft: stringOrNull,
  assigned_to: numberOrNull,
  received_at: stringOrNull,
  created_at: z.string(),
  updated_at: z.string(),
  used_knowledge_ids: z.array(z.number()).optional(),
});

const MessageSchema = z.object({
  id: z.number(),
  ticket_id: z.number(),
  direction: z.enum(["inbound", "outbound"]),
  sender: z.string(),
  recipient: z.string(),
  subject: z.string().optional(),
  body_text: z.string().optional(),
  sent_at: z.string().optional(),
  created_at: z.string(),
});

const KnowledgeArticleSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string(),
  category_id: z
    .number()
    .nullable()
    .optional()
    .transform((v) => v ?? undefined),
  tags: z
    .array(z.string())
    .or(z.string())
    .transform((val) => {
      if (Array.isArray(val)) return val;
      if (typeof val === "string")
        return val
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      return [];
    })
    .optional(),
});

const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z
    .object({
      count: z.number().optional(),
      total: z.number().optional(),
      results: z.array(itemSchema).optional(),
      items: z.array(itemSchema).optional(),
    })
    .transform((data) => ({
      items: data.results || data.items || [],
      total:
        data.count || data.total || (data.results || data.items || []).length,
    }));

const ArrayResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.array(itemSchema).transform((items) => ({
    items,
    total: items.length,
  }));

const STATUS_MAP: Record<string, string> = {
  new: "Новый",
  in_progress: "В работе",
  awaiting_reply: "Ожидает ответа",
  resolved: "Решен",
};

const SENTIMENT_MAP: Record<string, string> = {
  positive: "Позитивный",
  neutral: "Нейтральный",
  negative: "Негативный",
};

function ticketsToRows(tickets: Ticket[]) {
  return tickets.map((t) => ({
    Дата: t.received_at ? new Date(t.received_at).toLocaleString("ru-RU") : "",
    ФИО: t.sender_name || "",
    Объект: t.object_name || "",
    Телефон: t.phone || "",
    Email: t.sender_email,
    "Заводские номера": t.serial_numbers || "",
    "Тип прибора": t.device_type || "",
    "Эмоциональный окрас": SENTIMENT_MAP[t.sentiment] || t.sentiment || "",
    Категория: t.category || "",
    Статус: STATUS_MAP[t.status] || t.status || "",
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

let cachedTickets: Ticket[] = [];

export const realApi = {
  async getTickets(filters: TicketFilters): Promise<TicketListResponse> {
    const params = new URLSearchParams();

    if (filters.status && filters.status !== "active") {
      params.set("status", filters.status);
    }
    if (filters.priority) params.set("priority", filters.priority);
    if (filters.sentiment) params.set("sentiment", filters.sentiment);
    if (filters.search) params.set("search", filters.search);

    const isClientFilter = filters.status === "active" || filters.sentiment;
    params.set("page", isClientFilter ? "1" : String(filters.page));
    params.set("size", isClientFilter ? "1000" : String(filters.size));

    if (filters.sortBy) params.set("sort_by", filters.sortBy);
    if (filters.sortDir) params.set("sort_dir", filters.sortDir);

    try {
      const res = await fetch(`${BASE}/tickets/?${params}`, {
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) return { items: [], total: 0 };

      const rawData = await res.json();

      const Schema = z.union([
        PaginatedResponseSchema(TicketSchema),
        ArrayResponseSchema(TicketSchema),
      ]);

      const parsedData = Schema.safeParse(rawData);

      if (!parsedData.success) {
        console.error("Zod Validation Error:", parsedData.error);
        return { items: [], total: 0 };
      }

      const { items, total } = parsedData.data;

      const typedItems = items as unknown as Ticket[];

      if (filters.status === "active") {
        const filtered = typedItems.filter((t) => t.status !== "resolved");
        return { items: filtered, total: filtered.length };
      }

      if (!filters.status && !filters.search && filters.page === 1) {
        cachedTickets = typedItems;
      }

      return { items: typedItems, total };
    } catch (e) {
      console.error("getTickets fetch error:", e);
      return { items: [], total: 0 };
    }
  },

  async getTicket(id: number): Promise<Ticket> {
    const res = await fetch(`${BASE}/tickets/${id}/`);
    if (!res.ok) throw new Error(`Ticket ${id} not found`);
    const data = await res.json();
    const parsed = TicketSchema.parse(data);
    return parsed as unknown as Ticket;
  },

  async updateTicket(id: number, updates: Partial<Ticket>): Promise<Ticket> {
    const res = await fetch(`${BASE}/tickets/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error(`Update failed`);
    const data = await res.json();
    return TicketSchema.parse(data) as unknown as Ticket;
  },

  async resolveTicket(id: number): Promise<Ticket> {
    return this.updateTicket(id, { status: "resolved" });
  },

  async getMessages(ticketId: number): Promise<Message[]> {
    try {
      const res = await fetch(`${BASE}/tickets/${ticketId}/messages/`);
      if (!res.ok) return [];
      const data = await res.json();

      const Schema = z.union([
        PaginatedResponseSchema(MessageSchema).transform((d) => d.items),
        z.array(MessageSchema),
      ]);

      const parsed = Schema.safeParse(data);
      return parsed.success ? (parsed.data as unknown as Message[]) : [];
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

      if (res.ok) {
        await this.updateTicket(ticketId, { status: "in_progress" });
        return { success: true };
      }
    } catch (e) {
      console.error(e);
    }
    return { success: false };
  },

  async searchKnowledge(query: string): Promise<KnowledgeArticle[]> {
    try {
      const res = await fetch(
        `${BASE}/knowledge/?search=${encodeURIComponent(query)}`,
      );
      if (!res.ok) return [];
      const data = await res.json();

      const Schema = z.union([
        PaginatedResponseSchema(KnowledgeArticleSchema).transform(
          (d) => d.items,
        ),
        z.array(KnowledgeArticleSchema),
      ]);

      const parsed = Schema.safeParse(data);
      return parsed.success
        ? (parsed.data as unknown as KnowledgeArticle[])
        : [];
    } catch {
      return [];
    }
  },

  async getStats(): Promise<DashboardStats> {
    try {
      const res = await fetch(`${BASE}/stats/`);
      if (res.ok) {
        const data = await res.json();
        const StatsSchema = z.object({
          total: z.number(),
          byStatus: z.record(z.string(), z.number()),
          byPriority: z.record(z.string(), z.number()),
          bySentiment: z.record(z.string(), z.number()),
          byCategory: z.record(z.string(), z.number()),
          byDate: z.record(z.string(), z.number()),
        });
        const parsed = StatsSchema.safeParse(data);
        if (parsed.success) return parsed.data;
      }
    } catch {
      /* fallback */
    }

    try {
      const { items } = await this.getTickets({ page: 1, size: 1000 });

      const stats: DashboardStats = {
        total: items.length,
        byStatus: {},
        byPriority: {},
        bySentiment: {},
        byCategory: {},
        byDate: {},
      };

      items.forEach((t) => {
        stats.byStatus[t.status] = (stats.byStatus[t.status] || 0) + 1;
        stats.bySentiment[t.sentiment] =
          (stats.bySentiment[t.sentiment] || 0) + 1;

        const cat = t.category || "Другое";
        stats.byCategory[cat] = (stats.byCategory[cat] || 0) + 1;

        if (t.status !== "resolved") {
          stats.byPriority[t.priority] =
            (stats.byPriority[t.priority] || 0) + 1;
        }

        const dateKey = (t.received_at || t.created_at || "").split("T")[0];
        if (dateKey) stats.byDate[dateKey] = (stats.byDate[dateKey] || 0) + 1;
      });

      return stats;
    } catch {
      return {
        total: 0,
        byStatus: {},
        byPriority: {},
        bySentiment: {},
        byCategory: {},
        byDate: {},
      };
    }
  },

  exportCsv(): void {
    if (cachedTickets.length === 0) {
      alert("Нет данных для экспорта или они еще не загружены.");
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
      alert("Нет данных для экспорта или они еще не загружены.");
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
