import React, { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Bot, Send, Loader2, CheckCircle, PenLine } from "lucide-react";
import type { Ticket } from "../../types";
import { useSendReply } from "../../services/queries";
import "./ResponseEditor.css";

interface Props {
  ticket: Ticket;
  onSent: () => void;
}

interface FormValues {
  replyText: string;
}

export const ResponseEditor: React.FC<Props> = ({ ticket, onSent }) => {
  const { mutate, isPending, isSuccess } = useSendReply();

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { isValid },
  } = useForm<FormValues>({
    defaultValues: { replyText: "" },
    mode: "onChange",
  });

  const replyText = useWatch({
    control,
    name: "replyText",
  });

  const handleUseAiDraft = () => {
    if (ticket.ai_draft) {
      setValue("replyText", ticket.ai_draft, { shouldValidate: true });
    }
  };

  useEffect(() => {
    setValue("replyText", "");
  }, [ticket.id, setValue]);

  const onSubmit = (data: FormValues) => {
    mutate(
      { ticketId: ticket.id, text: data.replyText },
      {
        onSuccess: () => {
          onSent();
        },
        onError: () => {
          alert("Ошибка отправки сообщения");
        },
      },
    );
  };

  if (isSuccess) {
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
            <button
              className="btn btn-ai"
              onClick={handleUseAiDraft}
              type="button"
            >
              <Bot size={14} />
              Вставить AI-черновик
            </button>
          )}
        </div>
      </div>

      {ticket.ai_draft && !replyText && (
        <div className="ai-draft-hint">
          AI подготовил черновик. Нажмите кнопку выше, чтобы использовать его.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <textarea
          className="editor-textarea"
          rows={8}
          placeholder="Введите текст ответа..."
          {...register("replyText", { required: true, minLength: 5 })}
        />

        <div className="editor-footer">
          <span className="char-count">{replyText?.length || 0} символов</span>
          <button
            className="btn btn-primary"
            type="submit"
            disabled={isPending || !isValid}
          >
            {isPending ? (
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
      </form>
    </div>
  );
};
