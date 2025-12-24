import { supabase } from "@/lib/supabase";
import { Pet } from "@/types/pet";

export async function fetchPetsByUser(userId: string): Promise<Pet[]> {
  const { data, error } = await supabase
    .from("pets")
    .select("*")
    .eq("primary_owner_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return data ?? [];
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

  return data;
}
