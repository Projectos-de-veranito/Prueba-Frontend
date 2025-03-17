import { useState, useEffect, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../utils/supabaseClient";
import { ArrowLeft, Pencil, Check, Camera } from "lucide-react";

const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_KEY;

const AccountSettings = ({ setView }: { setView: (view: string) => void }) => {
    const { user, updateUser } = useAuth();
    const [username, setUsername] = useState<string>("");
    const [isEditing, setIsEditing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
            }
        };

        fetchUserData();
    }, [user]);

    const handleUpdate = async () => {
        if (!user) return;

        const { error } = await supabase
            .from("users")
            .update({ username })
            .eq("id", user.id);

        if (error) {
            console.error("Error actualizando el nombre:", error);
            return;
        }

        await updateUser({ username });
        setIsEditing(false);
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;
    
        const allowedFormats = ["image/png", "image/jpeg", "image/jpg"];
        
        if (!allowedFormats.includes(file.type)) {
            alert("Formato de archivo no permitido. Solo se aceptan PNG, JPG y JPEG.");
            return;
        }
    
        const formData = new FormData();
        formData.append("image", file);
    
        try {
            const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                method: "POST",
                body: formData,
            });
    
            const result = await response.json();
    
            if (!result.success) {
                console.error("Error subiendo la imagen a ImgBB:", result);
                return;
            }
    
            const newAvatarUrl = result.data.url;
    
            const { error: updateError } = await supabase
                .from("users")
                .update({ avatar_url: newAvatarUrl })
                .eq("id", user.id);
    
            if (updateError) {
                console.error("Error actualizando la imagen en la BD:", updateError);
                return;
            }
    
            await updateUser({ avatar_url: newAvatarUrl });
    
        } catch (error) {
            console.error("Error subiendo la imagen:", error);
        }
    };
    

    return (
        <div className="w-full h-full min-h-screen flex flex-col p-4 sm:p-6 bg-[#1a2c28] overflow-y-auto">
          <button onClick={() => setView("config")} className="text-white flex items-center mb-4 font-bold text-sm sm:text-base">
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> Ajustes de Cuenta
          </button>
      
          <div className="relative flex flex-col items-center mt-4 sm:mt-10 mb-6 sm:mb-10">
            {/* Imagen de perfil */}
            <img
              src={user?.avatar_url || "https://i.ibb.co/hRCDCFgs/perfil.png"}
              alt="Avatar"
              className="w-28 h-28 sm:w-40 sm:h-40 rounded-full border-2 border-green-950 object-cover cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            />
      
            <div
              className="absolute w-28 h-28 sm:w-40 sm:h-40 flex flex-col items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 hover:opacity-50 transition-opacity duration-300 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-white mb-1" />
              <p className="text-xs text-white text-center font-semibold px-2">
                CAMBIAR FOTO<br />DE PERFIL
              </p>
            </div>
      
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageUpload}
            />
          </div>
      
          <div className="mt-4 sm:mt-6 w-full">
            <p className="text-xs sm:text-sm text-green-500 mb-1">Tu Nombre</p>
            <div className="flex items-center">
              {isEditing ? (
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-transparent text-white px-1 py-1 border-b border-gray-500 focus:outline-none focus:border-green-500 transition w-full text-sm sm:text-lg"
                  autoFocus
                />
              ) : (
                <p className="text-base sm:text-lg font-semibold text-white flex-grow truncate">{username}</p>
              )}
      
              <button
                onClick={() => {
                  if (isEditing) {
                    handleUpdate();
                  } else {
                    setIsEditing(true);
                  }
                }}
                className="ml-2 p-1.5 sm:p-2 rounded-full transition duration-200 hover:bg-[#1b3833] flex-shrink-0"
              >
                {isEditing ? (
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                ) : (
                  <Pencil className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>
      );
};

export default AccountSettings;
