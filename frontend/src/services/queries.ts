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

export const useSendReply = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, text }: { ticketId: number; text: string }) =>
      api.sendReply(ticketId, text),
    onSuccess: (_, variables) => {
      // 1. Инвалидируем сообщения, чтобы подгрузить новое отправленное
      queryClient.invalidateQueries({
        queryKey: ["messages", variables.ticketId],
      });

      // 2. ПРИНУДИТЕЛЬНО обновляем статус тикета в кэше UI, не дожидаясь рефетча
      // Это решает проблему "статус не меняется визуально"
      queryClient.setQueryData(
        ["ticket", variables.ticketId],
        (oldData: Ticket | undefined) => {
          if (!oldData) return undefined;
          return { ...oldData, status: "awaiting_reply" };
        },
      );

      // 3. Инвалидируем общие списки, чтобы там тоже обновилось (в фоне)
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
      // Здесь тоже принудительно ставим resolved
      queryClient.setQueryData(
        ["ticket", ticketId],
        (oldData: Ticket | undefined) => {
          if (!oldData) return undefined;
          return { ...oldData, status: "resolved" };
        },
      );

      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
};
