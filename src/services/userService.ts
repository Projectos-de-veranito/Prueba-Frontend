import { supabase } from "../utils/supabaseClient";

export const getUser = async (userId: string) => {
  const { data, error } = await supabase
    .from("users")
    .select("id, username, avatar_url")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error obteniendo usuario:", error);
    throw error;
  }

  return data;
};

export const updateUser = async (userId: string, updates: Partial<{ username: string; avatar_url: string }>) => {
  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error actualizando usuario:", error);
    throw error;
  }

  return data;
};
