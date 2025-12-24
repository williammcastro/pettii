import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPostWithMedia,
  fetchFeedPostsForPet,
  fetchPostsByPet,
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
