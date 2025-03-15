import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { MessageCircle, User, Cog } from "lucide-react";

const Navbar = ({ setActiveView }: { setActiveView: (view: string) => void }) => {
  const { user } = useAuth();
  const [avatar, setAvatar] = useState<string | null>(null);

  // Cuando el usuario cambia, actualizamos el estado del avatar
  useEffect(() => {
    if (user?.avatar_url) {
      console.log("Actualizando avatar en Navbar:", user.avatar_url);
      setAvatar(user.avatar_url);
    }
  }, [user]); // Se ejecuta cada vez que `user` cambia

  return (
    <nav className="h-screen w-16 flex flex-col items-center py-4 fixed left-0 top-0" style={{ backgroundColor: "#0b2623" }}>
      {/* Íconos de navegación */}
      <div className="flex flex-col space-y-6 flex-grow">
        <button onClick={() => setActiveView("chats")}>
          <MessageCircle className="text-gray-400 hover:text-white w-6 h-6" />
        </button>
        <button onClick={() => setActiveView("contacts")}>
          <User className="text-gray-400 hover:text-white w-6 h-6" />
        </button>
      </div>

      {/* Ícono de Configuración */}
      <div className="flex items-center justify-center w-full py-4">
        <button onClick={() => setActiveView("config")}>
          <Cog className="text-gray-400 hover:text-white w-6 h-6" />
        </button>
      </div>

      {/* Avatar del usuario */}
      {avatar && (
        <div className="mb-4">
          <img
            key={avatar} // Forzar re-render cuando el avatar cambie
            src={avatar}
            alt="Avatar"
            className="w-10 h-10 rounded-full border-2 border-green-950 cursor-pointer"
          />
        </div>
      )}
    </nav>
  );
};

export default Navbar;
