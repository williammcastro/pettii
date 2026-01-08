export type Pet = {
  id: string;
  primary_owner_id: string;
  name: string;
  species?: string | null;
  breed?: string | null;
  birthdate?: string | null;
  avatar_url?: string | null;
  avatar_signed_url?: string | null;
  status?: string | null;
  sex?: string | null;
  weight_kg?: number | null;
  last_vaccine_at?: string | null;
  last_deworming_at?: string | null;
  sterilized?: boolean | null;
  allergies?: string | null;
  chronic_conditions?: string | null;
  created_at: string;
};
