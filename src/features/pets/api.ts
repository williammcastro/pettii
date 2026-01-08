import { supabase } from "@/lib/supabase";
import { Pet } from "@/types/pet";

async function signPetAvatarUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("http")) return path;

  const { data, error } = await supabase.storage
    .from("pet_media")
    .createSignedUrl(path, 60 * 60);

  if (error) {
    return null;
  }
  return data?.signedUrl ?? null;
}

async function attachSignedAvatarUrls(pets: Pet[]): Promise<Pet[]> {
  const signed = await Promise.all(
    pets.map(async (pet) => ({
      ...pet,
      avatar_signed_url: await signPetAvatarUrl(pet.avatar_url ?? null),
    }))
  );

  return signed;
}

export async function fetchPetsByUser(userId: string): Promise<Pet[]> {
  const { data, error } = await supabase
    .from("pets")
    .select("*")
    .eq("primary_owner_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return attachSignedAvatarUrls(data ?? []);
}

export async function addPet(input: {
  name: string;
  species?: string;
  breed?: string;
  birthdate?: string;
  avatar_url?: string;
  primary_owner_id: string;
}): Promise<Pet> {
  const { data, error } = await supabase
    .from("pets")
    .insert(input)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function fetchPetById(petId: string): Promise<Pet> {
  const { data, error } = await supabase
    .from("pets")
    .select("*")
    .eq("id", petId)
    .single();

  if (error) throw error;

  const [withSigned] = await attachSignedAvatarUrls([data]);
  return withSigned;
}

export async function updatePetProfile(input: {
  pet_id: string;
  status?: string | null;
  avatar_url?: string | null;
  name?: string | null;
  species?: string | null;
  breed?: string | null;
  birthdate?: string | null;
  sex?: string | null;
  weight_kg?: number | null;
  last_vaccine_at?: string | null;
  last_deworming_at?: string | null;
  sterilized?: boolean | null;
  allergies?: string | null;
  chronic_conditions?: string | null;
}): Promise<Pet> {
  const updates: Record<string, string | number | boolean | null> = {};
  if (input.status !== undefined) {
    updates.status = input.status ?? null;
  }
  if (input.avatar_url !== undefined) {
    updates.avatar_url = input.avatar_url ?? null;
  }
  if (input.name !== undefined) {
    updates.name = input.name ?? null;
  }
  if (input.species !== undefined) {
    updates.species = input.species ?? null;
  }
  if (input.breed !== undefined) {
    updates.breed = input.breed ?? null;
  }
  if (input.birthdate !== undefined) {
    updates.birthdate = input.birthdate ?? null;
  }
  if (input.sex !== undefined) {
    updates.sex = input.sex ?? null;
  }
  if (input.weight_kg !== undefined) {
    updates.weight_kg = input.weight_kg ?? null;
  }
  if (input.last_vaccine_at !== undefined) {
    updates.last_vaccine_at = input.last_vaccine_at ?? null;
  }
  if (input.last_deworming_at !== undefined) {
    updates.last_deworming_at = input.last_deworming_at ?? null;
  }
  if (input.sterilized !== undefined) {
    updates.sterilized = input.sterilized ?? null;
  }
  if (input.allergies !== undefined) {
    updates.allergies = input.allergies ?? null;
  }
  if (input.chronic_conditions !== undefined) {
    updates.chronic_conditions = input.chronic_conditions ?? null;
  }

  const { data, error } = await supabase
    .from("pets")
    .update(updates)
    .eq("id", input.pet_id)
    .select()
    .single();

  if (error) throw error;

  const [withSigned] = await attachSignedAvatarUrls([data]);
  return withSigned;
}

export async function fetchPetStats(petId: string): Promise<{
  posts: number;
  followers: number;
  following: number;
}> {
  const { count: postsCount, error: postsError } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("pet_id", petId);

  if (postsError) throw postsError;

  const { count: followingCount, error: followingError } = await supabase
    .from("pet_follows")
    .select("follower_pet_id", { count: "exact", head: true })
    .eq("follower_pet_id", petId);

  if (followingError) throw followingError;

  const { count: followersCount, error: followersError } = await supabase
    .from("pet_follows")
    .select("followed_pet_id", { count: "exact", head: true })
    .eq("followed_pet_id", petId);

  if (followersError) throw followersError;

  return {
    posts: postsCount ?? 0,
    followers: followersCount ?? 0,
    following: followingCount ?? 0,
  };
}
