import { useMutation, useQuery } from "@tanstack/react-query";
import { createOrderWithItems, fetchOrdersForUser } from "./api";

export function useCreateOrder() {
  return useMutation({
    mutationFn: createOrderWithItems,
  });
}

export function useOrdersForUser(userId?: string) {
  return useQuery({
    queryKey: ["orders", "user", userId],
    queryFn: () => fetchOrdersForUser(userId!),
    enabled: !!userId,
  });
}
