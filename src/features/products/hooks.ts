import { useQuery } from "@tanstack/react-query";
import { fetchProductById, fetchProductsForPrimaryClinic } from "./api";

export function useProductsForPrimaryClinic(
  userId?: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ["products", "primary", userId],
    queryFn: () => fetchProductsForPrimaryClinic(userId!),
    enabled: !!userId && enabled,
  });
}

export function useProductById(productId?: string) {
  return useQuery({
    queryKey: ["products", "by-id", productId],
    queryFn: () => fetchProductById(productId!),
    enabled: !!productId,
  });
}
