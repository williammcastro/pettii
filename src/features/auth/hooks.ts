import { useMutation } from "@tanstack/react-query";
import { deleteMyAccount } from "./api";

export function useDeleteMyAccount() {
  return useMutation({
    mutationFn: deleteMyAccount,
  });
}
