/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useState } from "react";
import {
  X,
  Inbox,
  Send,
  MessageSquare,
  CheckCircle,
  Building2,
  Phone,
  Mail,
  Hash,
  Cpu,
  ChevronDown,
  ChevronUp,
  PenLine,
  Bot,
  Loader2,
  FileText,
} from "lucide-react";
import type { Ticket, Message } from "../../../types";
import { api } from "../../../services/api";
import { StatusBadge } from "../../badges/StatusBadge";
import "./TicketDetail.css";

interface Props {
  ticket: Ticket;
  onClose: () => void;
  onTicketUpdated: () => void;
}

export const TicketDetail: React.FC<Props> = ({
  ticket,
  onClose,
  onTicketUpdated,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadedTicketId, setLoadedTicketId] = useState<number | null>(null);
  const [editorOpen, setEditorOpen] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const loading = loadedTicketId !== ticket.id;
  const isFinished = ticket.status === "closed" || ticket.status === "resolved";

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setEditorOpen(true);
    setReplyText("");
    setSent(false);
    api
      .getMessages(ticket.id)
      .then((msgs) => {
        if (!cancelled) {
          setMessages(msgs);
          setLoadedTicketId(ticket.id);
        }
      })
      .catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [ticket.id]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const refreshMessages = () => {
    api.getMessages(ticket.id).then(setMessages).catch(console.error);
  };

  const handleUseAiDraft = () => {
    if (ticket.ai_draft) setReplyText(ticket.ai_draft);
  };

  const handleSend = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await api.sendReply(ticket.id, replyText);
      setSent(true);
      refreshMessages();
      onTicketUpdated();
    } catch {
      alert("Ошибка отправки");
    }
    setSending(false);
  };

  const formatDateTime = (s?: string | null) => {
    if (!s) return "";
    return new Date(s).toLocaleString("ru-RU");
  };

  // --- ЛОГИКА РАЗДЕЛЕНИЯ ---
  // Первое сообщение - это тело тикета.
  const firstMessage = messages.length > 0 ? messages[0] : null;
  // Остальные - история.
  const historyMessages = messages.length > 1 ? messages.slice(1) : [];

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
        <div className="detail-header">
          <div className="detail-title-row">
            <span className="detail-id">#{ticket.id}</span>
            <h2 className="detail-subject">{ticket.subject}</h2>
          </div>
          <button className="detail-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="detail-body">
          <div className="detail-meta">
            <div className="meta-section-title">Отправитель</div>
            <div className="meta-grid">
              <div className="meta-item">
                <span className="meta-label">ФИО</span>
                <span className="meta-value">{ticket.sender_name}</span>
              </div>
              <div className="meta-item">
                <Mail size={12} className="meta-icon" />
                <span className="meta-value">{ticket.sender_email}</span>
              </div>
              {ticket.phone && (
                <div className="meta-item">
                  <Phone size={12} className="meta-icon" />
                  <span className="meta-value">{ticket.phone}</span>
                </div>
              )}
              {ticket.object_name && (
                <div className="meta-item">
                  <Building2 size={12} className="meta-icon" />
                  <span className="meta-value">{ticket.object_name}</span>
                </div>
              )}
            </div>
          </div>

          {(ticket.device_type || ticket.serial_numbers) && (
            <div className="detail-meta">
              <div className="meta-section-title">Оборудование</div>
              <div className="meta-grid">
                {ticket.device_type && (
                  <div className="meta-item">
                    <Cpu size={12} className="meta-icon" />
                    <span className="meta-label">Тип</span>
                    <span className="meta-value device-type-value">
                      {ticket.device_type}
                    </span>
                  </div>
                )}
                {ticket.serial_numbers && (
                  <div className="meta-item meta-item-full">
                    <Hash size={12} className="meta-icon" />
                    <span className="meta-label">Заводские номера</span>
                    <span className="meta-value mono">
                      {ticket.serial_numbers}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="detail-meta">
            <div className="meta-section-title">Классификация AI</div>
            <div className="meta-row">
              <div className="meta-item">
                <span className="meta-label">Категория</span>
                <span className="meta-value">
                  {ticket.category || "Не определена"}
                </span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Статус</span>
                <StatusBadge status={ticket.status} />
              </div>
              <div className="meta-item">
                <span className="meta-label">Окрас</span>
                <span className="meta-value">
                  {ticket.sentiment === "positive"
                    ? "Позитивный"
                    : ticket.sentiment === "negative"
                      ? "Негативный"
                      : "Нейтральный"}
                </span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Уверенность</span>
                <span className="meta-value confidence-bar">
                  <span
                    className="confidence-fill"
                    style={{ width: `${(ticket.confidence || 0) * 100}%` }}
                  />
                  <span className="confidence-text">
                    {ticket.confidence
                      ? `${Math.round(ticket.confidence * 100)}%`
                      : "-"}
                  </span>
                </span>
              </div>
            </div>
            {/* ТУТ: Было AI-описание, но теперь лучше показывать полное тело письма (первое сообщение) */}
          </div>

          {/* НОВЫЙ БЛОК: ТЕЛО ОБРАЩЕНИЯ (Первое сообщение) */}
          {firstMessage && (
            <div
              className="detail-meta"
              style={{
                background: "var(--bg-input)",
                margin: "0 20px",
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                  color: "var(--accent)",
                }}
              >
                <FileText size={14} />
                <span style={{ fontSize: 12, fontWeight: 600 }}>
                  Тело обращения
                </span>
              </div>
              <div className="message-body" style={{ fontSize: 13 }}>
                {firstMessage.body_text}
              </div>
            </div>
          )}

          <div className="detail-messages">
            <div className="section-title">
              <MessageSquare size={16} />
              История переписки ({historyMessages.length})
            </div>
            <div className="messages-list">
              {loading && <div className="messages-loading">Загрузка...</div>}
              {!loading && historyMessages.length === 0 && (
                <div className="messages-empty">Нет новых ответов</div>
              )}
              {historyMessages.map((msg) => (
                <div key={msg.id} className={`message-bubble ${msg.direction}`}>
                  <div className="message-header">
                    <span className="message-direction">
                      {msg.direction === "inbound" ? (
                        <>
                          <Inbox size={12} /> Входящее
                        </>
                      ) : (
                        <>
                          <Send size={12} /> Исходящее
                        </>
                      )}
                    </span>
                    <span className="message-sender">{msg.sender}</span>
                    <span className="message-time">
                      {formatDateTime(msg.sent_at)}
                    </span>
                  </div>
                  <div className="message-body">{msg.body_text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {isFinished ? (
          <div className="detail-bottom-bar resolved-bar">
            <CheckCircle size={16} />
            Обращение {ticket.status === "resolved" ? "решено" : "закрыто"}
          </div>
        ) : (
          <div className={`detail-editor-panel ${editorOpen ? "open" : ""}`}>
            <button
              className="editor-toggle"
              onClick={() => setEditorOpen(!editorOpen)}
            >
              <div className="editor-toggle-left">
                <PenLine size={14} />
                <span>Ответ клиенту</span>
                {sent && <span className="sent-inline-badge">отправлен</span>}
              </div>
              {editorOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
            {editorOpen && (
              <div className="editor-content">
                {sent ? (
                  <div className="editor-sent-msg">
                    <CheckCircle size={16} />
                    Ответ отправлен на {ticket.sender_email}
                  </div>
                ) : (
                  <>
                    <div className="editor-actions-row">
                      {ticket.ai_draft && (
                        <button
                          className="btn btn-ai"
                          onClick={handleUseAiDraft}
                        >
                          <Bot size={13} /> Вставить AI-черновик
                        </button>
                      )}
                      {ticket.ai_draft && !replyText && (
                        <span className="ai-hint">
                          AI подготовил черновик ответа
                        </span>
                      )}
                    </div>
                    <textarea
                      className="editor-textarea"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={6}
                      placeholder="Введите текст ответа..."
                    />
                    <div className="editor-footer">
                      <span className="char-count">
                        {replyText.length} символов
                      </span>
                      <button
                        className="btn btn-primary"
                        onClick={handleSend}
                        disabled={sending || !replyText.trim()}
                      >
                        {sending ? (
                          <>
                            <Loader2 size={14} className="spin" /> Отправка...
                          </>
                        ) : (
                          <>
                            <Send size={14} /> Отправить
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
