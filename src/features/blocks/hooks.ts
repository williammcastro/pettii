import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { blockUser, fetchBlockStatus, unblockUser } from "./api";

export function useBlockStatus(
  blockerUserId?: string,
  blockedUserId?: string
) {
  return useQuery({
    queryKey: ["user-block", blockerUserId ?? null, blockedUserId ?? null],
    queryFn: () =>
      fetchBlockStatus({
        blocker_user_id: blockerUserId!,
        blocked_user_id: blockedUserId!,
      }),
    enabled: !!blockerUserId && !!blockedUserId,
  });
}

export function useBlockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: blockUser,
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: ["user-block", variables.blocker_user_id, variables.blocked_user_id],
      });
      qc.invalidateQueries({ queryKey: ["posts", "feed"] });
      qc.invalidateQueries({ queryKey: ["post-comments"] });
    },
  });
}

export function useUnblockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: unblockUser,
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: ["user-block", variables.blocker_user_id, variables.blocked_user_id],
      });
      qc.invalidateQueries({ queryKey: ["posts", "feed"] });
      qc.invalidateQueries({ queryKey: ["post-comments"] });
    },
  });
}
