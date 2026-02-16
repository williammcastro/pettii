import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createOrderWithItems, fetchOrdersForUser } from "./api";

export function useCreateOrder() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: createOrderWithItems,
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["orders", "user", variables.user_id] });
      qc.invalidateQueries({ queryKey: ["products", "primary", variables.user_id] });
      qc.invalidateQueries({ queryKey: ["products", "by-id"] });
    },
  });
}

export function useOrdersForUser(userId?: string) {
  return useQuery({
    queryKey: ["orders", "user", userId],
    queryFn: () => fetchOrdersForUser(userId!),
    enabled: !!userId,
  });
}
