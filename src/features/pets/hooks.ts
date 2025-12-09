import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addPet, fetchPetsByUser } from "./api";

export function usePets(userId?: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["pets", userId],
    queryFn: () => fetchPetsByUser(userId!),
    enabled: !!userId && enabled,
  });
}

export function useAddPet() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: addPet,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["pets", data.primary_owner_id] });
    },
  });
}
