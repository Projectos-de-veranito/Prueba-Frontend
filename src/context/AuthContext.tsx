import { createContext, useState, useEffect } from "react";
import { supabase } from "../utils/supabaseClient";
import { User } from "../types/User.entity";

interface AuthContextType {
  user: User | null;
  updateUser: (updates: Partial<User>) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error obteniendo sesión:", error);
        return;
      }

      if (!data?.session) {
        console.log("No hay sesión activa");
        return;
      }

      const userId = data.session.user.id;

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, username, email, avatar_url")
        .eq("id", userId)
        .single();

      if (userError) {
        console.error("Error obteniendo usuario desde la DB:", userError);
        return;
      }

      setUser(userData);
    };

    fetchUser();
  }, []);

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;

    setUser((prevUser) => ({ ...prevUser!, ...updates }));

    await supabase.auth.updateUser({
      data: updates,
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, updateUser, signOut, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
