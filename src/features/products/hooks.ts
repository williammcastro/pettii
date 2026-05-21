import { useQuery } from "@tanstack/react-query";
import { fetchProductById, fetchProductsByClinicId } from "./api";

export function useProductsByClinicId(
  clinicId?: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ["products", "clinic", clinicId],
    queryFn: () => fetchProductsByClinicId(clinicId!),
    enabled: !!clinicId && enabled,
    staleTime: 60_000,
  });
}

export function useProductById(productId?: string) {
  return useQuery({
    queryKey: ["products", "by-id", productId],
    queryFn: () => fetchProductById(productId!),
    enabled: !!productId,
    staleTime: 60_000,
  });
}
