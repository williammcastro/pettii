import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPostWithMedia,
  fetchPublicFeedPosts,
  fetchFeedPostsForPet,
  fetchPostsByPet,
  followPet,
  unfollowPet,
  checkFollowStatus,
} from "./api";

export function usePetPosts(petId?: string) {
  return useQuery({
    queryKey: ["posts", "pet", petId],
    queryFn: () => fetchPostsByPet(petId!),
    enabled: !!petId,
  });
}

export function useFeedPosts(followerPetId?: string) {
  return useQuery({
    queryKey: ["posts", "feed", followerPetId],
    queryFn: () => fetchFeedPostsForPet(followerPetId!),
    enabled: !!followerPetId,
  });
}

export function usePublicFeedPosts() {
  return useQuery({
    queryKey: ["posts", "feed", "public"],
    queryFn: fetchPublicFeedPosts,
  });
}

export function useCreatePetPost() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: createPostWithMedia,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["posts", "pet", data.pet_id] });
      qc.invalidateQueries({ queryKey: ["posts", "feed"] });
    },
  });
}

export function useFollowStatus(
  followerPetId?: string,
  followedPetId?: string
) {
  return useQuery({
    queryKey: ["pet-follows", followerPetId, followedPetId],
    queryFn: () =>
      checkFollowStatus({
        follower_pet_id: followerPetId!,
        followed_pet_id: followedPetId!,
      }),
    enabled: !!followerPetId && !!followedPetId,
  });
}

export function useFollowPet() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: followPet,
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: [
          "pet-follows",
          variables.follower_pet_id,
          variables.followed_pet_id,
        ],
      });
      qc.invalidateQueries({ queryKey: ["posts", "feed"] });
    },
  });
}

export function useUnfollowPet() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: unfollowPet,
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: [
          "pet-follows",
          variables.follower_pet_id,
          variables.followed_pet_id,
        ],
      });
      qc.invalidateQueries({ queryKey: ["posts", "feed"] });
    },
  });
}
