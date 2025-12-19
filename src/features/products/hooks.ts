import { useQuery } from "@tanstack/react-query";
import { fetchProductsForPrimaryClinic } from "./api";

export function useProductsForPrimaryClinic(userId?: string) {
  return useQuery({
    queryKey: ["products", "primary", userId],
    queryFn: () => fetchProductsForPrimaryClinic(userId!),
    enabled: !!userId,
  });
}
