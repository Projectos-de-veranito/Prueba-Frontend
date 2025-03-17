import { supabase } from "../utils/supabaseClient";
import { User } from "../types/User.entity";

const authService = {
  async register(email: string, password: string, username: string, avatarUrl?: string) {
    email = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) throw new Error(`Error en Auth: ${error.message}`);

    const userId = data.user?.id;
    if (!userId) throw new Error("No se pudo obtener el ID del usuario.");

    try {
      const { error: userError } = await supabase.from("users").insert([
        {
          id: userId,
          email,
          username,
          avatar_url: avatarUrl,
        },
      ]);

      if (userError) {
        console.error("Error al guardar en users:", userError.message);
        throw new Error("Error al registrar usuario en la base de datos.");
      }

      return { message: "Registro exitoso. Confirma tu correo antes de iniciar sesión." };
    } catch (err: any) {
      console.error("Error inesperado en el registro:", err);
      throw new Error(err.message || "Error inesperado en el registro.");
    }
  },

  async login(email: string, password: string, setUser: (user: User | null) => void) {
    email = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        throw new Error("Debes confirmar tu correo antes de iniciar sesión.");
      }
      throw new Error(`Error al iniciar sesión: ${error.message}`);
    }

    const userId = data.user?.id;
    if (!userId) throw new Error("No se pudo obtener el ID del usuario.");

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, username, email, avatar_url")
      .eq("id", userId)
      .single();

    if (userError) {
      console.error("Error obteniendo usuario desde la DB:", userError);
      throw new Error("Error obteniendo usuario desde la base de datos.");
    }

    setUser(userData); 

    return data.user;
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(`Error al cerrar sesión: ${error.message}`);
  },

  async getUser() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw new Error(`Error al obtener usuario: ${error.message}`);

    return data.session?.user || null;
  },
};

export default authService;
