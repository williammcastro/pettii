import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createPostWithMedia,
  createPostReport,
  fetchPublicFeedPosts,
  fetchRankedFeedPosts,
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
  fetchPostComments,
  createPostComment,
  fetchPostCommentCount,
  fetchProfilesByIds,
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

export function useRankedFeedPosts(followerPetId?: string) {
  const limit = 30;

  return useInfiniteQuery({
    queryKey: ["posts", "feed", "ranked", followerPetId ?? null],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      fetchRankedFeedPosts({
        follower_pet_id: followerPetId ?? null,
        limit,
        offset: pageParam,
      }),
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.length === 0 ? undefined : lastPageParam + limit,
    staleTime: 60_000,
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
      qc.invalidateQueries({ queryKey: ["posts", "feed"] });
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
      qc.invalidateQueries({ queryKey: ["posts", "feed"] });
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

export function usePostComments(postId?: string) {
  return useQuery({
    queryKey: ["post-comments", postId],
    queryFn: () => fetchPostComments(postId!),
    enabled: !!postId,
  });
}

export function useCreatePostComment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: createPostComment,
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["post-comments", variables.post_id] });
      qc.invalidateQueries({
        queryKey: ["post-comment-count", variables.post_id],
      });
      qc.invalidateQueries({ queryKey: ["posts", "feed"] });
    },
  });
}

export function usePostCommentCount(postId?: string) {
  return useQuery({
    queryKey: ["post-comment-count", postId],
    queryFn: () => fetchPostCommentCount(postId!),
    enabled: !!postId,
  });
}

export function useCreatePostReport() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: createPostReport,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts", "feed"] });
    },
  });
}

export function useProfilesByIds(userIds: string[]) {
  const sortedIds = [...userIds].sort();
  return useQuery({
    queryKey: ["profiles", sortedIds],
    queryFn: () => fetchProfilesByIds(sortedIds),
    enabled: sortedIds.length > 0,
  });
}
