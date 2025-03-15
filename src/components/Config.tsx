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
        <div className="w-1/4 p-6 flex flex-col h-full" style={{ backgroundColor: "#14201e" }}>
            <h2 className="text-xl font-bold text-white mb-15">Ajustes</h2>

            {/* Contenedor con avatar e información */}
            <div className="flex items-center mb-10">
                {avatar ? (
                    <img src={avatar} alt="Avatar" className="w-27 h-27 rounded-full border-2 border-green-950 mr-5" />
                ) : null}
                <p className="text-lg font-semibold text-white">{username}</p>
            </div>

            {/* Botón para ir a "Ajustes de Cuenta" con icono de usuario */}
            <button
                onClick={() => setView("account")}
                className="bg-[#122e29] text-white px-4 py-3 rounded-md hover:bg-[#16544c] transition flex items-center w-full text-left"
            >
                <CircleUserIcon className="w-5 h-5 mr-3" /> {/* Ícono de usuario */}
                Ajustes de Cuenta
            </button>

            {/* Botón de cerrar sesión */}
            <div className="mt-auto">
                <button
                    onClick={signOut}
                    className="w-full flex items-center justify-center text-red-500 hover:text-white transition py-2 border border-red-500 rounded-md 
                   hover:bg-red-600/40 hover:border-red-600/40"
                >
                    <LogOut className="w-5 h-5 mr-2" />
                    Cerrar sesión
                </button>
            </div>
        </div>
    );
};

export default Config;