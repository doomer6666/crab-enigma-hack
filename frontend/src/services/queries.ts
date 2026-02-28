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
      queryClient.setQueryData(["ticket", updatedTicket.id], updatedTicket);
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
};

export const useSendReply = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ticketId,
      text,
    }: {
      ticketId: number;
      text: string;
    }) => {
      // Сначала отправляем сообщение
      await api.sendReply(ticketId, text);
      // Возвращаем ID для контекста
      return ticketId;
    },
    onSuccess: (ticketId) => {
      // 1. Обновляем сообщения
      queryClient.invalidateQueries({ queryKey: ["messages", ticketId] });

      // 2. ПРИНУДИТЕЛЬНО обновляем статус тикета в кэше на "Ожидает ответа"
      // Это мгновенно перерисует бейдж в TicketDetail
      queryClient.setQueryData(
        ["ticket", ticketId],
        (oldData: Ticket | undefined) => {
          if (!oldData) return undefined;
          return { ...oldData, status: "awaiting_reply" as const };
        },
      );

      // 3. Обновляем списки
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
      // Принудительно ставим "Решено"
      queryClient.setQueryData(
        ["ticket", ticketId],
        (oldData: Ticket | undefined) => {
          if (!oldData) return undefined;
          return { ...oldData, status: "resolved" as const };
        },
      );

      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
};
