import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type { TicketFilters, Ticket } from "../types";

// --- Queries ---

export const useTickets = (filters: TicketFilters) => {
  return useQuery({
    queryKey: ["tickets", filters],
    queryFn: () => api.getTickets(filters),
    placeholderData: (previousData) => previousData,
  });
};

export const useTicket = (id: number, initialData?: Ticket) => {
  return useQuery({
    queryKey: ["ticket", id],
    queryFn: () => api.getTicket(id),
    initialData: initialData,
    enabled: !!id,
    // Важно: если данные пришли из таблицы, они могут быть устаревшими.
    // StaleTime 0 заставит React Query сразу сделать запрос за свежими данными
    staleTime: 0,
  });
};

export const useStats = () => {
  return useQuery({
    queryKey: ["stats"],
    queryFn: () => api.getStats(),
  });
};

export const useTicketMessages = (ticketId: number) => {
  return useQuery({
    queryKey: ["messages", ticketId],
    queryFn: () => api.getMessages(ticketId),
    enabled: !!ticketId,
  });
};

// --- Mutations ---

export const useUpdateTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Ticket> }) =>
      api.updateTicket(id, updates),
    onSuccess: (updatedTicket) => {
      // Обновляем конкретный тикет данными от сервера
      queryClient.setQueryData(["ticket", updatedTicket.id], updatedTicket);
      // Инвалидируем списки
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
};

export const useSendReply = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, text }: { ticketId: number; text: string }) =>
      api.sendReply(ticketId, text),
    // data - ответ от api.sendReply
    // variables - то, что мы передали в mutate ({ ticketId, text })
    onSuccess: (_data, variables) => {
      // 1. МГНОВЕННОЕ ОБНОВЛЕНИЕ СТАТУСА В UI
      queryClient.setQueryData(
        ["ticket", variables.ticketId],
        (old: Ticket | undefined) => {
          if (!old) return undefined;
          // Жестко ставим статус "Ожидает", не дожидаясь ответа сервера
          return {
            ...old,
            status: "awaiting_reply" as const,
            updated_at: new Date().toISOString(),
          };
        },
      );

      // 2. Обновляем сообщения (подтянется новое отправленное)
      queryClient.invalidateQueries({
        queryKey: ["messages", variables.ticketId],
      });

      // 3. Обновляем список тикетов и статистику в фоне
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
};

export const useResolveTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ticketId: number) => api.resolveTicket(ticketId),
    onSuccess: (_, ticketId) => {
      // МГНОВЕННОЕ ОБНОВЛЕНИЕ СТАТУСА В UI
      queryClient.setQueryData(
        ["ticket", ticketId],
        (old: Ticket | undefined) => {
          if (!old) return undefined;
          return {
            ...old,
            status: "resolved" as const,
            updated_at: new Date().toISOString(),
          };
        },
      );

      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
};
