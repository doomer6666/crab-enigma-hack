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
} from "lucide-react";
import type { Ticket, Message } from "../../../types";
import { api } from "../../../services/api";
import { StatusBadge } from "../../badges/StatusBadge";
import { PriorityBadge } from "../../badges/PriorityBadge";
import "./TicketDetail.css";
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

  const formatDateTime = (s?: string | null) => {
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

        {/* Контактные данные */}
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

        {/* Оборудование */}
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

        {/* AI-классификация */}
        <div className="detail-meta">
          <div className="meta-section-title">Классификация AI</div>
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
              <span className="meta-label">Окрас</span>
              <StatusBadge status={ticket.status} />
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
          {ticket.description && (
            <div className="meta-description">
              <span className="meta-label">Суть вопроса</span>
              <p className="description-full">{ticket.description}</p>
            </div>
          )}
        </div>

        {/* Дата */}
        <div className="detail-meta compact">
          <div className="meta-row">
            <div className="meta-item">
              <span className="meta-label">Дата поступления</span>
              <span className="meta-value">
                {formatDateTime(ticket.received_at)}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Статус</span>
              <StatusBadge status={ticket.status} />
            </div>
          </div>
        </div>

        {/* Переписка */}
        <div className="detail-messages">
          <h3 className="section-title">
            <MessageSquare size={16} /> Переписка
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

        {/* Редактор */}
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
