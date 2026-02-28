export interface Ticket {
  id: number;
  subject: string;
  sender_name: string;
  sender_email: string;
  phone: string | null;
  object_name: string | null;
  serial_numbers: string | null;
  device_type: string | null;
  category?: string | null;
  priority: "low" | "medium" | "high" | "critical";
  sentiment: "positive" | "neutral" | "negative";
  confidence?: number | null;
  description: string | null;
  status: TicketStatus;
  ai_draft?: string | null;
  assigned_to?: number | null;
  received_at?: string | null;
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
  byCategory: Record<string, number>;
}
