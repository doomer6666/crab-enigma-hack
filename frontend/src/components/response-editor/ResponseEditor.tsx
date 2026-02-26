import React, { useState } from "react";
import { Bot, Send, Loader2, CheckCircle, PenLine } from "lucide-react";
import type { Ticket } from "../../types";
import { api } from "../../services/api";
import "./ResponseEditor.css";

interface Props {
  ticket: Ticket;
  onSent: () => void;
}

export const ResponseEditor: React.FC<Props> = ({ ticket, onSent }) => {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleUseAiDraft = () => {
    if (ticket.ai_draft) setText(ticket.ai_draft);
  };

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await api.sendReply(ticket.id, text);
      setSent(true);
      onSent();
    } catch {
      alert("Ошибка отправки. Попробуйте ещё раз.");
    }
    setSending(false);
  };

  if (sent) {
    return (
      <div className="editor-section">
        <div className="editor-sent">
          <CheckCircle size={18} />
          Ответ успешно отправлен на {ticket.sender_email}
        </div>
      </div>
    );
  }

  return (
    <div className="editor-section">
      <div className="editor-header">
        <h3 className="section-title">
          <PenLine size={16} />
          Ответ клиенту
        </h3>
        <div className="editor-actions-top">
          {ticket.ai_draft && (
            <button className="btn btn-ai" onClick={handleUseAiDraft}>
              <Bot size={14} />
              Вставить AI-черновик
            </button>
          )}
        </div>
      </div>

      {ticket.ai_draft && !text && (
        <div className="ai-draft-hint">
          AI подготовил черновик ответа. Нажмите кнопку выше, чтобы использовать
          его.
        </div>
      )}

      <textarea
        className="editor-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        placeholder="Введите текст ответа..."
      />

      <div className="editor-footer">
        <span className="char-count">{text.length} символов</span>
        <button
          className="btn btn-primary"
          onClick={handleSend}
          disabled={sending || !text.trim()}
        >
          {sending ? (
            <>
              <Loader2 size={14} className="spin" /> Отправка...
            </>
          ) : (
            <>
              <Send size={14} /> Отправить ответ
            </>
          )}
        </button>
      </div>
    </div>
  );
};
