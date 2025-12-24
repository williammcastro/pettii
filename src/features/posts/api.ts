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
    .order("created_at", { ascending: false });

  if (error) throw error;

  return attachSignedUrls(data ?? []);
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
      caption: input.caption ?? null,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}
