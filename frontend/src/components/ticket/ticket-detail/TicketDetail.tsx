import React, { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form"; // Criterion 4: Ready-made solutions
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
import type { Ticket } from "../../../types";
import { StatusBadge } from "../../badges/StatusBadge";
import {
  useTicket,
  useTicketMessages,
  useResolveTicket,
  useSendReply,
} from "../../../services/queries"; // Criterion 3: Architecture
import "./TicketDetail.css";

interface Props {
  ticket: Ticket;
  onClose: () => void;
  onTicketUpdated: () => void;
}

interface FormValues {
  replyText: string;
}

export const TicketDetail: React.FC<Props> = ({
  ticket: initialTicket,
  onClose,
}) => {
  // 1. Используем хук для получения "живых" данных тикета (чтобы статус обновлялся сам)
  const { data: ticketData } = useTicket(initialTicket.id, initialTicket);
  const ticket = ticketData || initialTicket;

  // 2. Загрузка сообщений через React Query
  const { data: messages = [], isLoading: loading } = useTicketMessages(
    ticket.id,
  );

  // 3. Мутации (Отправка и Решение)
  const replyMutation = useSendReply();
  const resolveMutation = useResolveTicket();

  const [editorOpen, setEditorOpen] = useState(true);
  const isFinished = ticket.status === "resolved";

  // 4. React Hook Form для управления формой ответа
  const { register, handleSubmit, setValue, control, reset } =
    useForm<FormValues>({
      defaultValues: { replyText: "" },
    });

  // Следим за значением поля для блокировки кнопки
  const replyText = useWatch({ control, name: "replyText" });

  // Эффект для блокировки скролла body
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Эффект для подстановки AI черновика
  useEffect(() => {
    if (ticket.ai_draft) {
      setValue("replyText", ticket.ai_draft);
    } else {
      setValue("replyText", "");
    }
  }, [ticket.id, ticket.ai_draft, setValue]);

  // Закрытие по ESC
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // --- Handlers ---

  const onSendSubmit = (data: FormValues) => {
    if (!data.replyText.trim()) return;

    replyMutation.mutate(
      { ticketId: ticket.id, text: data.replyText },
      {
        onSuccess: () => {
          reset(); // Очищаем форму
          // Сообщения и статус обновятся автоматически благодаря React Query
        },
        onError: () => alert("Ошибка отправки"),
      },
    );
  };

  const handleResolve = () => {
    resolveMutation.mutate(ticket.id, {
      // onSuccess можно добавить закрытие окна, если нужно: onClose()
    });
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
              </div>
              {editorOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
            {editorOpen && (
              <div className="editor-content">
                <form onSubmit={handleSubmit(onSendSubmit)}>
                  <textarea
                    className="editor-textarea"
                    rows={6}
                    placeholder="Введите текст ответа..."
                    {...register("replyText")}
                  />
                  <div className="editor-footer">
                    <button
                      type="button"
                      className="btn btn-resolve"
                      onClick={handleResolve}
                      disabled={resolveMutation.isPending}
                      style={{
                        background: "rgba(16, 185, 129, 0.1)",
                        color: "#10b981",
                        border: "1px solid rgba(16, 185, 129, 0.3)",
                        marginRight: "auto",
                      }}
                    >
                      {resolveMutation.isPending ? (
                        <Loader2 size={14} className="spin" />
                      ) : (
                        <CheckCircle size={14} />
                      )}
                      Вопрос решен
                    </button>

                    <span className="char-count" style={{ marginRight: 12 }}>
                      {replyText?.length || 0} символов
                    </span>

                    <button
                      className="btn btn-primary"
                      type="submit"
                      disabled={replyMutation.isPending || !replyText?.trim()}
                    >
                      {replyMutation.isPending ? (
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
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
