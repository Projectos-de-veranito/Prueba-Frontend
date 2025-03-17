import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { LogOut, CircleUserIcon } from "lucide-react";
import { supabase } from "../utils/supabaseClient";

const Config = ({ setView }: { setView: (view: string) => void }) => {
    const { user, signOut } = useAuth();
    const [username, setUsername] = useState<string>("");
    const [avatar, setAvatar] = useState<string>("");

    useEffect(() => {
        const fetchUserData = async () => {
            if (!user) return;

            const { data, error } = await supabase
                .from("users")
                .select("username, avatar_url")
                .eq("id", user.id)
                .single();

            if (error) {
                console.error("Error obteniendo datos del usuario:", error);
                return;
            }

            if (data) {
                setUsername(data.username);
                setAvatar(data.avatar_url);
            }
        };

        fetchUserData();
    }, [user]);

    return (
        <div className="w-full md:w-72 lg:w-80 p-4 sm:p-6 flex flex-col min-h-screen md:min-h-0 md:h-full bg-[#14201e]">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-6">Ajustes</h2>
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start mb-8">
            {avatar ? (
              <img 
                src={avatar || 'https://i.ibb.co/hRCDCFgs/perfil.png'}  
                alt="Avatar" 
                className="w-20 h-20 sm:w-16 sm:h-16 md:w-24 md:h-24 rounded-full border-2 border-green-950 mb-3 sm:mb-0 sm:mr-3 md:mr-5" 
              />
            ) : null}
            <p className="text-base sm:text-lg font-semibold text-white text-center sm:text-left truncate">{username}</p>
          </div>
          
          <div className="space-y-3 sm:space-y-4 w-full">
            <button
              onClick={() => setView("account")}
              className="bg-[#122e29] text-white px-4 py-3 rounded-md hover:bg-[#16544c] transition flex items-center w-full text-left text-sm sm:text-base"
            >
              <CircleUserIcon className="w-5 h-5 mr-3" />
              Ajustes de Cuenta
            </button>
          </div>
          <div className="mt-auto pt-6">
            <button
              onClick={signOut}
              className="w-full flex items-center justify-center text-red-500 hover:text-white transition py-3 border border-red-500 rounded-md 
                 hover:bg-red-600/40 hover:border-red-600/40 text-sm sm:text-base"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Cerrar sesión
            </button>
          </div>
        </div>
      );
};

export default Config;