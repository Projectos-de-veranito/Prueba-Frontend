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
    
        // Obtener la extensión del archivo
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
    
            // Actualizar la base de datos con la nueva imagen
            const { error: updateError } = await supabase
                .from("users")
                .update({ avatar_url: newAvatarUrl })
                .eq("id", user.id);
    
            if (updateError) {
                console.error("Error actualizando la imagen en la BD:", updateError);
                return;
            }
    
            // Actualizar el estado del usuario con la nueva imagen
            await updateUser({ avatar_url: newAvatarUrl });
    
        } catch (error) {
            console.error("Error subiendo la imagen:", error);
        }
    };
    

    return (
        <div className="w-1/4 h-full flex flex-col p-6" style={{ backgroundColor: "#1a2c28" }}>
            {/* Botón de regreso */}
            <button onClick={() => setView("config")} className="text-white flex items-center mb-4 font-bold">
                <ArrowLeft className="w-5 h-5 mr-2" /> Ajustes de Cuenta
            </button>

            {/* Contenedor con imagen y efecto hover */}
            <div className="relative flex flex-col items-center mt-15 mb-10">
                {/* Imagen de perfil */}
                <img
                    src={user?.avatar_url || "/default-avatar.png"}
                    alt="Avatar"
                    className="w-50 h-50 rounded-full border-2 border-green-950 object-cover cursor-pointer"
                    onClick={() => fileInputRef.current?.click()} // Activa el input al hacer clic en la imagen
                />

                {/* Overlay con efecto hover */}
                <div
                    className="absolute w-50 h-50 flex flex-col items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 hover:opacity-50 transition-opacity duration-300 cursor-pointer"
                    onClick={() => fileInputRef.current?.click()} // Activa el input al hacer clic en el overlay
                >
                    <Camera className="w-6 h-6 text-white mb-1" />
                    <p className="text-xs text-white text-center font-semibold">
                        CAMBIAR FOTO<br />DE PERFIL
                    </p>
                </div>

                {/* Input oculto para seleccionar imagen */}
                <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                />
            </div>

            {/* Nombre editable */}
            <div className="mt-6 w-full">
                <p className="text-sm text-green-500 mb-1">Tu Nombre</p>
                <div className="flex items-center">
                    {isEditing ? (
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="bg-transparent text-white px-1 py-1 border-b border-gray-500 focus:outline-none focus:border-green-500 transition w-full"
                        />
                    ) : (
                        <p className="text-lg font-semibold text-white flex-grow">{username}</p>
                    )}

                    {/* Botón de editar/guardar con hover circular */}
                    <button
                        onClick={() => {
                            if (isEditing) {
                                handleUpdate();
                            } else {
                                setIsEditing(true);
                            }
                        }}
                        className="ml-2 p-2 rounded-full transition duration-200 hover:bg-[#1b3833]"
                    >
                        {isEditing ? (
                            <Check className="w-5 h-5 text-green-500" />
                        ) : (
                            <Pencil className="w-5 h-5 text-white" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AccountSettings;
