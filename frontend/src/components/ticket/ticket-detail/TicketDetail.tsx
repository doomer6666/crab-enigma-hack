import React, { useEffect, useState } from "react";
import { X, Inbox, Send, MessageSquare, CheckCircle } from "lucide-react";
import "./TicketDetail.css";
import { api } from "../../../services/api";
import type { Ticket, Message } from "../../../types";
import { PriorityBadge } from "../../badges/PriorityBadge";
import { StatusBadge } from "../../badges/StatusBadge";
import { ResponseEditor } from "../../response-editor/ResponseEditor";

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

  const loading = loadedTicketId !== ticket.id;

  useEffect(() => {
    let cancelled = false;
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

  const refreshMessages = () => {
    api.getMessages(ticket.id).then(setMessages).catch(console.error);
  };

  const handleSent = () => {
    refreshMessages();
    onTicketUpdated();
  };

  const formatDateTime = (s?: string) => {
    if (!s) return "";
    return new Date(s).toLocaleString("ru-RU");
  };

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="detail-header">
          <div className="detail-title-row">
            <span className="detail-id">#{ticket.id}</span>
            <h2 className="detail-subject">{ticket.subject}</h2>
          </div>
          <button className="detail-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Meta */}
        <div className="detail-meta">
          <div className="meta-row">
            <div className="meta-item">
              <span className="meta-label">От</span>
              <span className="meta-value">
                {ticket.sender_name && <strong>{ticket.sender_name}</strong>}{" "}
                &lt;{ticket.sender_email}&gt;
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Дата</span>
              <span className="meta-value">
                {formatDateTime(ticket.received_at)}
              </span>
            </div>
          </div>
          <div className="meta-row">
            <div className="meta-item">
              <span className="meta-label">Категория</span>
              <span className="meta-value">
                {ticket.category?.name || "Не определена"}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Приоритет</span>
              <PriorityBadge priority={ticket.priority} />
            </div>
            <div className="meta-item">
              <span className="meta-label">Статус</span>
              <StatusBadge status={ticket.status} />
            </div>
            <div className="meta-item">
              <span className="meta-label">AI уверенность</span>
              <span className="meta-value confidence-bar">
                <span
                  className="confidence-fill"
                  style={{ width: `${(ticket.confidence || 0) * 100}%` }}
                />
                <span className="confidence-text">
                  {ticket.confidence
                    ? `${Math.round(ticket.confidence * 100)}%`
                    : "—"}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="detail-messages">
          <h3 className="section-title">
            <MessageSquare size={16} />
            Переписка
          </h3>
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

        {/* Response Editor */}
        {ticket.status !== "closed" && ticket.status !== "resolved" && (
          <ResponseEditor ticket={ticket} onSent={handleSent} />
        )}

        {(ticket.status === "closed" || ticket.status === "resolved") && (
          <div className="detail-resolved">
            <CheckCircle size={18} />
            Обращение {ticket.status === "resolved" ? "решено" : "закрыто"}
          </div>
        )}
      </div>
    </div>
  );
};
