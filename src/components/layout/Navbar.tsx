import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { MessageCircle, User, Cog } from "lucide-react";

const Navbar = ({ setActiveView, activeView }: { setActiveView: (view: string) => void, activeView: string }) => {
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
    <nav 
      className="w-full h-16 md:h-screen md:w-16 flex flex-row md:flex-col md:justify-start justify-around items-center px-4 md:px-0 md:py-4 fixed bottom-0 md:left-0 md:top-0 z-10" 
      style={{ backgroundColor: "#0b2623" }}
    >
      {/* Avatar del usuario - Solo visible en pantallas medianas o más grandes (sidebar vertical) */}
      {avatar && (
        <div className="hidden md:block md:mt-4 md:mb-8">
          <img
            key={avatar}
            src={avatar}
            alt="Avatar"
            className="w-10 h-10 rounded-full border-2 border-green-950 cursor-pointer"
          />
        </div>
      )}
      
      {/* Íconos de navegación - En vertical estarán bajo el avatar */}
      <div className="flex flex-row md:flex-col space-x-8 md:space-x-0 md:space-y-8 items-center md:mt-0">
        <button 
          onClick={() => setActiveView("chats")} 
          className="p-2 md:p-0 focus:outline-none"
        >
          <MessageCircle className={`${activeView === "chats" ? "text-white" : "text-gray-400"} hover:text-white w-6 h-6`} />
        </button>
        <button 
          onClick={() => setActiveView("contacts")} 
          className="p-2 md:p-0 focus:outline-none"
        >
          <User className={`${activeView === "contacts" ? "text-white" : "text-gray-400"} hover:text-white w-6 h-6`} />
        </button>
      </div>
  
      {/* Avatar del usuario - Solo visible en pantallas pequeñas (navbar horizontal) */}
      {avatar && (
        <div className="md:hidden block">
          <img
            key={avatar}
            src={avatar}
            alt="Avatar"
            className="w-8 h-8 rounded-full border-2 border-green-950 cursor-pointer"
          />
        </div>
      )}
  
      {/* Ícono de Configuración - En vertical estará al final del sidebar */}
      <div className="flex items-center justify-center p-2 md:p-0 md:mt-auto">
        <button 
          onClick={() => setActiveView("config")}
          className="focus:outline-none"
        >
          <Cog className={`${activeView === "config" ? "text-white" : "text-gray-400"} hover:text-white w-6 h-6`} />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;