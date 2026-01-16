import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addPet,
  createPetReminder,
  deletePetReminder,
  fetchPetById,
  fetchPetReminders,
  fetchPetsByUser,
  fetchPetStats,
  updatePetReminder,
  updatePetProfile,
} from "./api";

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

export function usePetById(petId?: string) {
  return useQuery({
    queryKey: ["pets", "by-id", petId],
    queryFn: () => fetchPetById(petId!),
    enabled: !!petId,
  });
}

export function usePetStats(petId?: string) {
  return useQuery({
    queryKey: ["pets", "stats", petId],
    queryFn: () => fetchPetStats(petId!),
    enabled: !!petId,
  });
}

export function usePetReminders(petId?: string) {
  return useQuery({
    queryKey: ["pets", "reminders", petId],
    queryFn: () => fetchPetReminders(petId!),
    enabled: !!petId,
  });
}

export function useCreatePetReminder() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: createPetReminder,
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["pets", "reminders", variables.pet_id] });
    },
  });
}

export function useUpdatePetReminder() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: updatePetReminder,
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["pets", "reminders"] });
      qc.invalidateQueries({ queryKey: ["pets", "reminders", variables.id] });
    },
  });
}

export function useDeletePetReminder() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: deletePetReminder,
    onSuccess: (_data, reminderId) => {
      qc.invalidateQueries({ queryKey: ["pets", "reminders"] });
      qc.invalidateQueries({ queryKey: ["pets", "reminders", reminderId] });
    },
  });
}

export function useUpdatePetProfile(userId?: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: updatePetProfile,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["pets", userId] });
      qc.invalidateQueries({ queryKey: ["pets", "by-id", data.id] });
      qc.invalidateQueries({ queryKey: ["pets", "stats", data.id] });
    },
  });
}
