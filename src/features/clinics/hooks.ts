import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchPrimaryClinicForUser, joinClinicByCode } from "./api";

export function usePrimaryClinic(userId?: string) {
  return useQuery({
    queryKey: ["clinics", "primary", userId],
    queryFn: () => fetchPrimaryClinicForUser(userId!),
    enabled: !!userId,
  });
}

export function useJoinClinicByCode(userId?: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: joinClinicByCode,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clinics", "primary", userId] });
      qc.invalidateQueries({ queryKey: ["products", "primary", userId] });
    },
  });
}
