export type Post = {
  id: string;
  owner_user_id: string;
  pet_id: string;
  media_type: "image" | "video";
  storage_bucket: string;
  storage_path: string;
  visibility: "public" | "private";
  caption?: string | null;
  created_at: string;
};

export type PostWithMedia = Post & {
  media_url?: string | null;
};
