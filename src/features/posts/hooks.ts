import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPostWithMedia,
  fetchPublicFeedPosts,
  fetchFeedPostsForPet,
  fetchPostsByPet,
  followPet,
  unfollowPet,
  checkFollowStatus,
  deletePostWithMedia,
  checkPostLikeStatus,
  likePost,
  unlikePost,
  fetchPostLikeCount,
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

export function useDeletePetPost() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: deletePostWithMedia,
    onSuccess: (_data, variables) => {
      if (variables.pet_id) {
        qc.invalidateQueries({ queryKey: ["posts", "pet", variables.pet_id] });
      } else {
        qc.invalidateQueries({ queryKey: ["posts", "pet"] });
      }
      qc.invalidateQueries({ queryKey: ["posts", "feed"] });
      if (variables.id) {
        qc.invalidateQueries({ queryKey: ["post", variables.id] });
      }
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

export function usePostLikeStatus(postId?: string, userId?: string) {
  return useQuery({
    queryKey: ["post-like", postId, userId],
    queryFn: () => checkPostLikeStatus({ post_id: postId!, user_id: userId! }),
    enabled: !!postId && !!userId,
  });
}

export function useLikePost() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: likePost,
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: ["post-like", variables.post_id, variables.user_id],
      });
      qc.invalidateQueries({ queryKey: ["post-like-count", variables.post_id] });
    },
  });
}

export function useUnlikePost() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: unlikePost,
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: ["post-like", variables.post_id, variables.user_id],
      });
      qc.invalidateQueries({ queryKey: ["post-like-count", variables.post_id] });
    },
  });
}

export function usePostLikeCount(postId?: string) {
  return useQuery({
    queryKey: ["post-like-count", postId],
    queryFn: () => fetchPostLikeCount(postId!),
    enabled: !!postId,
  });
}
