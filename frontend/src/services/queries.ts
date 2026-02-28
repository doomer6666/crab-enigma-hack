import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type { TicketFilters, Ticket } from "../types";

// ... (Остальные хуки useTickets, useTicket, useStats, useTicketMessages остаются без изменений) ...

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

// НОВЫЙ ХУК: Универсальное обновление тикета
export const useUpdateTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Ticket> }) =>
      api.updateTicket(id, updates),
    onSuccess: (updatedTicket) => {
      // Обновляем данные в кэше конкретного тикета
      queryClient.setQueryData(["ticket", updatedTicket.id], updatedTicket);

      // Инвалидируем списки и статистику
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["messages", variables.ticketId],
      });

      // Optimistic update for status
      queryClient.setQueryData(
        ["ticket", variables.ticketId],
        (old: Ticket | undefined) =>
          old ? { ...old, status: "awaiting_reply" } : undefined,
      );

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
      queryClient.setQueryData(
        ["ticket", ticketId],
        (old: Ticket | undefined) =>
          old ? { ...old, status: "resolved" } : undefined,
      );
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
};
