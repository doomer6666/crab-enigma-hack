/* eslint-disable prefer-const */
import type {
  Ticket,
  TicketListResponse,
  Message,
  KnowledgeArticle,
  TicketFilters,
  DashboardStats,
} from "../types";
import { mockTickets, mockMessages, mockKnowledge } from "../mocks/data";
import * as XLSX from "xlsx";

const delay = (ms: number = 300) => new Promise((r) => setTimeout(r, ms));

// Копии данных для мутации в рантайме
let tickets = [...mockTickets];
let messageStore = { ...mockMessages };
let nextMsgId = 100;

function ticketsToRows(data: Ticket[]) {
  return data.map((t) => ({
    Дата: t.received_at ? new Date(t.received_at).toLocaleString("ru-RU") : "",
    ФИО: t.sender_name,
    Объект: t.object_name || "",
    Телефон: t.phone || "",
    Email: t.sender_email,
    "Заводские номера": t.serial_numbers || "",
    "Тип прибора": t.device_type || "",
    "Эмоциональный окрас": t.sentiment,
    Категория: t.category || "",
    Приоритет: t.priority,
    Статус: t.status,
    "AI уверенность": t.confidence ? `${Math.round(t.confidence * 100)}%` : "",
    "Суть вопроса": t.description || t.subject,
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

export const mockApi = {
  async getTickets(filters: TicketFilters): Promise<TicketListResponse> {
    await delay();
    let result = [...tickets];

    if (filters.status) {
      result = result.filter((t) => t.status === filters.status);
    }
    if (filters.priority) {
      result = result.filter((t) => t.priority === filters.priority);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (t) =>
          t.subject.toLowerCase().includes(q) ||
          t.sender_email.toLowerCase().includes(q) ||
          t.sender_name.toLowerCase().includes(q) ||
          (t.object_name || "").toLowerCase().includes(q) ||
          (t.serial_numbers || "").toLowerCase().includes(q) ||
          (t.device_type || "").toLowerCase().includes(q) ||
          (t.phone || "").includes(q) ||
          (t.description || "").toLowerCase().includes(q),
      );
    }

    const total = result.length;
    const start = (filters.page - 1) * filters.size;
    const items = result.slice(start, start + filters.size);

    return { items, total };
  },

  async getTicket(id: number): Promise<Ticket> {
    await delay(150);
    const ticket = tickets.find((t) => t.id === id);
    if (!ticket) throw new Error("Тикет не найден");
    return { ...ticket };
  },

  async updateTicket(id: number, updates: Partial<Ticket>): Promise<Ticket> {
    await delay(200);
    const idx = tickets.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error("Тикет не найден");
    tickets[idx] = {
      ...tickets[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    return { ...tickets[idx] };
  },

  async getMessages(ticketId: number): Promise<Message[]> {
    await delay(200);
    return messageStore[ticketId] || [];
  },

  async sendReply(
    ticketId: number,
    bodyText: string,
  ): Promise<{ success: boolean }> {
    await delay(500);
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) throw new Error("Тикет не найден");

    const msg: Message = {
      id: nextMsgId++,
      ticket_id: ticketId,
      direction: "outbound",
      sender: "support@company.com",
      recipient: ticket.sender_email,
      subject: `Re: ${ticket.subject}`,
      body_text: bodyText,
      sent_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    if (!messageStore[ticketId]) messageStore[ticketId] = [];
    messageStore[ticketId].push(msg);

    const idx = tickets.findIndex((t) => t.id === ticketId);
    if (idx !== -1) {
      tickets[idx].status = "resolved";
      tickets[idx].updated_at = new Date().toISOString();
    }

    return { success: true };
  },

  async searchKnowledge(query: string): Promise<KnowledgeArticle[]> {
    await delay(200);
    const q = query.toLowerCase();
    return mockKnowledge.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q) ||
        (a.tags || []).some((tag) => tag.includes(q)),
    );
  },

  async getStats(): Promise<DashboardStats> {
    await delay(100);
    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    const bySentiment: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    tickets.forEach((t) => {
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
      byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
      bySentiment[t.sentiment] = (bySentiment[t.sentiment] || 0) + 1;
      const catName = t.category || "Другое";
      byCategory[catName] = (byCategory[catName] || 0) + 1;
    });

    return {
      total: tickets.length,
      byStatus,
      byPriority,
      bySentiment,
      byCategory,
    };
  },

  exportCsv(): void {
    const rows = ticketsToRows(tickets);
    if (rows.length === 0) return;

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
    const rows = ticketsToRows(tickets);

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
