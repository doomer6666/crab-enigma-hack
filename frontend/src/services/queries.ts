import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type { TicketFilters, Ticket } from "../types"; // Импортируем Ticket

// --- Queries ---

export const useTickets = (filters: TicketFilters) => {
  return useQuery({
    queryKey: ["tickets", filters],
    queryFn: () => api.getTickets(filters),
    placeholderData: (previousData) => previousData,
  });
};

// ИСПРАВЛЕНО: Строгая типизация initialData
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

export const useSendReply = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, text }: { ticketId: number; text: string }) =>
      api.sendReply(ticketId, text),
    onSuccess: (_, variables) => {
      // Инвалидируем кэш, чтобы данные обновились везде
      queryClient.invalidateQueries({
        queryKey: ["messages", variables.ticketId],
      });
      queryClient.invalidateQueries({
        queryKey: ["ticket", variables.ticketId],
      });
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
      queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
};
