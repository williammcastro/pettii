import { supabase } from "@/lib/supabase";
import { Post, PostWithMedia } from "@/types/post";
import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system/legacy";

function getFileExtension(uri: string, mimeType?: string | null) {
  if (mimeType) {
    const parts = mimeType.split("/");
    if (parts.length === 2) return parts[1];
  }

  const uriParts = uri.split(".");
  return uriParts.length > 1 ? uriParts[uriParts.length - 1] : "bin";
}

async function attachSignedUrls(posts: Post[]): Promise<PostWithMedia[]> {
  if (posts.length === 0) return [];

  const bucket = posts[0].storage_bucket ?? "pet_media";
  const paths = posts.map((post) => post.storage_path);

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrls(paths, 60 * 60);

  if (error) {
    return posts.map((post) => ({ ...post, media_url: null }));
  }

  const urlByPath = new Map<string, string>();
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) {
      urlByPath.set(item.path, item.signedUrl);
    }
  }

  return posts.map((post) => ({
    ...post,
    media_url: urlByPath.get(post.storage_path) ?? null,
  }));
}

export async function fetchPostsByPet(petId: string): Promise<PostWithMedia[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("pet_id", petId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return attachSignedUrls(data ?? []);
}

export async function fetchFeedPostsForPet(
  followerPetId: string
): Promise<PostWithMedia[]> {
  const { data: follows, error: followsError } = await supabase
    .from("pet_follows")
    .select("followed_pet_id")
    .eq("follower_pet_id", followerPetId);

  if (followsError) throw followsError;

  const followedIds = (follows ?? [])
    .map((row) => row.followed_pet_id)
    .filter((id): id is string => !!id);
  if (followedIds.length === 0) return [];

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .in("pet_id", followedIds)
    .eq("moderation_status", "approved")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return attachSignedUrls(data ?? []);
}

export async function fetchPublicFeedPosts(): Promise<PostWithMedia[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("visibility", "public")
    .eq("moderation_status", "approved")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return attachSignedUrls(data ?? []);
}

export async function fetchRankedFeedPosts(input?: {
  follower_pet_id?: string | null;
  limit?: number;
  offset?: number;
}): Promise<PostWithMedia[]> {
  const { data, error } = await supabase.rpc("fetch_ranked_feed", {
    p_follower_pet_id: input?.follower_pet_id ?? null,
    p_limit: input?.limit ?? 30,
    p_offset: input?.offset ?? 0,
  });

  if (error) throw error;

  return attachSignedUrls((data ?? []) as Post[]);
}

export async function createPostWithMedia(input: {
  owner_user_id: string;
  pet_id: string;
  media_type: "image" | "video";
  local_uri: string;
  mime_type?: string | null;
  caption?: string;
}): Promise<Post> {
  const bucket = "pet_media";
  const extension = getFileExtension(input.local_uri, input.mime_type);
  const fileName = `${Date.now()}_${Math.random()
    .toString(36)
    .slice(2)}.${extension}`;
  const storagePath = `${input.pet_id}/${fileName}`;

  const base64 = await FileSystem.readAsStringAsync(input.local_uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const fileBody = decode(base64);

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(storagePath, fileBody, {
      contentType: input.mime_type ?? "application/octet-stream",
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("posts")
    .insert({
      owner_user_id: input.owner_user_id,
      pet_id: input.pet_id,
      media_type: input.media_type,
      storage_bucket: bucket,
      storage_path: storagePath,
      visibility: "public",
      moderation_status: "pending",
      caption: input.caption ?? null,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function deletePostWithMedia(input: {
  id: string;
  storage_bucket?: string | null;
  storage_path?: string | null;
  pet_id?: string | null;
}) {
  if (input.storage_bucket && input.storage_path) {
    const { error: storageError } = await supabase.storage
      .from(input.storage_bucket)
      .remove([input.storage_path]);

    if (storageError) {
      const message = storageError.message?.toLowerCase() ?? "";
      const isMissingObject =
        message.includes("not found") || message.includes("does not exist");
      if (!isMissingObject) {
        throw storageError;
      }
    }
  }

  const { error } = await supabase.rpc("delete_post_with_media", {
    post_id_input: input.id,
  });

  if (error) throw error;
}

export async function followPet(input: {
  follower_pet_id: string;
  followed_pet_id: string;
}) {
  const { error } = await supabase.from("pet_follows").insert(input);
  if (error) throw error;
}

export async function unfollowPet(input: {
  follower_pet_id: string;
  followed_pet_id: string;
}) {
  const { error } = await supabase
    .from("pet_follows")
    .delete()
    .eq("follower_pet_id", input.follower_pet_id)
    .eq("followed_pet_id", input.followed_pet_id);
  if (error) throw error;
}

export async function checkFollowStatus(input: {
  follower_pet_id: string;
  followed_pet_id: string;
}): Promise<boolean> {
  const { data, error } = await supabase
    .from("pet_follows")
    .select("follower_pet_id")
    .eq("follower_pet_id", input.follower_pet_id)
    .eq("followed_pet_id", input.followed_pet_id)
    .maybeSingle();

  if (error) throw error;

  return !!data;
}

export async function checkPostLikeStatus(input: {
  post_id: string;
  user_id: string;
}): Promise<boolean> {
  const { data, error } = await supabase
    .from("post_likes")
    .select("post_id")
    .eq("post_id", input.post_id)
    .eq("user_id", input.user_id)
    .maybeSingle();

  if (error) throw error;

  return !!data;
}

export async function likePost(input: { post_id: string; user_id: string }) {
  const { error } = await supabase.from("post_likes").insert(input);
  if (error) throw error;
}

export async function unlikePost(input: { post_id: string; user_id: string }) {
  const { error } = await supabase
    .from("post_likes")
    .delete()
    .eq("post_id", input.post_id)
    .eq("user_id", input.user_id);
  if (error) throw error;
}

export async function fetchPostLikeCount(postId: string): Promise<number> {
  const { count, error } = await supabase
    .from("post_likes")
    .select("post_id", { count: "exact", head: true })
    .eq("post_id", postId);

  if (error) throw error;

  return count ?? 0;
}

export async function fetchPostComments(postId: string) {
  const { data, error } = await supabase
    .from("post_comments")
    .select("id, post_id, user_id, body, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return data ?? [];
}

export async function createPostComment(input: {
  post_id: string;
  user_id: string;
  body: string;
}) {
  const { error } = await supabase.from("post_comments").insert(input);
  if (error) throw error;
}

export type PostReportReason =
  | "spam"
  | "violence_abuse"
  | "misinformation"
  | "other";

export async function createPostReport(input: {
  post_id: string;
  reporter_user_id: string;
  reason: PostReportReason;
  details?: string | null;
}) {
  const { error } = await supabase.from("post_reports").insert({
    post_id: input.post_id,
    reporter_user_id: input.reporter_user_id,
    reason: input.reason,
    details: input.details ?? null,
  });
  if (error) throw error;
}

export async function fetchPostCommentCount(postId: string): Promise<number> {
  const { count, error } = await supabase
    .from("post_comments")
    .select("id", { count: "exact", head: true })
    .eq("post_id", postId);

  if (error) throw error;

  return count ?? 0;
}

export async function fetchProfilesByIds(userIds: string[]) {
  if (userIds.length === 0) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", userIds);

  if (error) throw error;

  return data ?? [];
}
