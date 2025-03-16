import { useState } from "react";
import Navbar from "../components/layout/Navbar";
import ChatList from "../components/ChatList";
import ContactList from "../components/ContactList";
import ChatArea from "../components/ChatArea";
import Config from "../components/Config";
import AccountSettings from "../components/AccountSettings";
import { useAuth } from "../hooks/useAuth";

const Dashboard = () => {
  const { user } = useAuth(); // Obtener el usuario autenticado
  const [activeView, setActiveView] = useState("chats");
  const [selectedContact, setSelectedContact] = useState<{
    id: string;
    username: string;
    avatar_url: string;
  } | null>(null);
  
  const [selectedChat, setSelectedChat] = useState<{ id: string; name: string } | null>(null); // Estado para el chat seleccionado

  // Manejar selección de contacto en ContactList
  const handleSelectContact = (contact: { id: string; username: string; avatar_url: string }) => {
    setSelectedContact(contact);
    setSelectedChat(null); // Limpiar el chat seleccionado si cambiamos de vista
  };
  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden">
      <div className="w-full md:w-16 h-16 md:h-screen fixed md:static bottom-0 left-0 right-0 md:bottom-auto z-10">
        <Navbar setActiveView={setActiveView} />
      </div>
      
      <div className="flex flex-col md:flex-row flex-grow w-full md:ml-16 pt-4 md:pt-0 pb-16 md:pb-0 overflow-hidden">
        <div className="w-full md:w-72 lg:w-80 md:flex-shrink-0">
          {activeView === "chats" && <ChatList onSelectContact={handleSelectContact} />}
          {activeView === "contacts" && <ContactList onSelectContact={handleSelectContact} />}
          {activeView === "config" && <Config setView={setActiveView} />}
          {activeView === "account" && <AccountSettings setView={setActiveView} />}
        </div>
  
        <div className="flex-grow h-full overflow-hidden">
          {user ? (
            (selectedChat || selectedContact) ? (
              <ChatArea
                senderId={user.id}
                contactId={selectedChat?.id || selectedContact?.id || ""}
                contactName={selectedContact?.username || selectedChat?.name || "Chat"}
                contactAvatar={selectedContact?.avatar_url || ""}
              />
            ) : (
              <ChatArea senderId={user.id} /> // Renderiza el mensaje de bienvenida
            )
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;