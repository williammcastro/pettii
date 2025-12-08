export type Pet = {
  id: string;
  primary_owner_id: string;
  name: string;
  species?: string | null;
  breed?: string | null;
  birthdate?: string | null;
  avatar_url?: string | null;
  created_at: string;
};
