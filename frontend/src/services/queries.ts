import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type { TicketFilters } from "../types";

export const useTickets = (filters: TicketFilters) => {
  return useQuery({
    queryKey: ["tickets", filters],
    queryFn: () => api.getTickets(filters),
    placeholderData: (previousData) => previousData,
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

export const useSendReply = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, text }: { ticketId: number; text: string }) =>
      api.sendReply(ticketId, text),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["messages", variables.ticketId],
      });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
};
