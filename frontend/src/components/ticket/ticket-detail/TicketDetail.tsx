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
  Loader2,
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
  const [resolving, setResolving] = useState(false);
  const [sent, setSent] = useState(false);

  const loading = loadedTicketId !== ticket.id;
  const isFinished = ticket.status === "resolved";

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Загрузка сообщений и авто-вставка черновика
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEditorOpen(true);
    setSent(false);

    // Автоматическая вставка AI черновика при открытии
    if (ticket.ai_draft) {
      setReplyText(ticket.ai_draft);
    } else {
      setReplyText("");
    }

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
  }, [ticket.id, ticket.ai_draft]);

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

  const handleSend = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await api.sendReply(ticket.id, replyText);
      setSent(true);
      setReplyText(""); // Очищаем после отправки
      refreshMessages();
      onTicketUpdated();
    } catch {
      alert("Ошибка отправки");
    }
    setSending(false);
  };

  const handleResolve = async () => {
    setResolving(true);
    try {
      await api.resolveTicket(ticket.id);
      onTicketUpdated();
      onClose(); // Закрываем окно после решения
    } catch {
      alert("Ошибка при закрытии тикета");
    }
    setResolving(false);
  };

  const formatDateTime = (s?: string | null) => {
    if (!s) return "";
    return new Date(s).toLocaleString("ru-RU");
  };

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
          </div>

          <div className="detail-messages">
            <div className="section-title">
              <MessageSquare size={16} />
              Переписка ({messages.length})
            </div>
            <div className="messages-list">
              {loading && <div className="messages-loading">Загрузка...</div>}
              {!loading && messages.length === 0 && (
                <div className="messages-empty">Нет сообщений</div>
              )}
              {messages.map((msg) => (
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
            Обращение решено
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
                <textarea
                  className="editor-textarea"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={6}
                  placeholder="Введите текст ответа..."
                />
                <div className="editor-footer">
                  <button
                    className="btn btn-resolve"
                    onClick={handleResolve}
                    disabled={resolving}
                    style={{
                      background: "rgba(16, 185, 129, 0.1)",
                      color: "#10b981",
                      border: "1px solid rgba(16, 185, 129, 0.3)",
                      marginRight: "auto",
                    }}
                  >
                    {resolving ? (
                      <Loader2 size={14} className="spin" />
                    ) : (
                      <CheckCircle size={14} />
                    )}
                    Вопрос решен
                  </button>

                  <span className="char-count" style={{ marginRight: 12 }}>
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
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
