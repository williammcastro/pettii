export type Post = {
  id: string;
  owner_user_id: string;
  pet_id: string;
  media_type: "image" | "video";
  storage_bucket: string;
  storage_path: string;
  visibility: "public" | "private";
  moderation_status?: "pending" | "approved" | "rejected";
  moderation_reason?: string | null;
  moderation_score?: number | null;
  caption?: string | null;
  created_at: string;
};

export type PostWithMedia = Post & {
  media_url?: string | null;
};

export type RankedFeedPost = PostWithMedia & {
  pet_name?: string | null;
  pet_avatar_url?: string | null;
  pet_avatar_signed_url?: string | null;
  likes_count: number;
  comments_count: number;
  is_following: boolean;
  is_liked: boolean;
};
