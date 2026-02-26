export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface Ticket {
  id: number;
  subject: string;
  sender_email: string;
  sender_name?: string;
  category?: Category;
  priority: "low" | "medium" | "high" | "critical";
  sentiment: "positive" | "neutral" | "negative";
  confidence?: number;
  status: TicketStatus;
  ai_draft?: string;
  assigned_to?: number;
  received_at?: string;
  created_at: string;
  updated_at: string;
}

export type TicketStatus =
  | "new"
  | "ai_processed"
  | "in_progress"
  | "awaiting_reply"
  | "resolved"
  | "closed";

export interface TicketListResponse {
  items: Ticket[];
  total: number;
}

export interface Message {
  id: number;
  ticket_id: number;
  direction: "inbound" | "outbound";
  sender: string;
  recipient: string;
  subject?: string;
  body_text?: string;
  sent_at?: string;
  created_at: string;
}

export interface KnowledgeArticle {
  id: number;
  title: string;
  content: string;
  category_id?: number;
  tags?: string[];
}

export interface TicketFilters {
  status?: string;
  priority?: string;
  search?: string;
  page: number;
  size: number;
}

export interface DashboardStats {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  bySentiment: Record<string, number>;
}
