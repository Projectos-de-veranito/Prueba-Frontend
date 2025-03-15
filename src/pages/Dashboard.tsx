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
    <div className="flex h-screen">
      <Navbar setActiveView={setActiveView} />
      <div className="ml-16 flex-grow flex">
        {activeView === "chats" && <ChatList onSelectContact={handleSelectContact} />}
        {activeView === "contacts" && <ContactList onSelectContact={handleSelectContact} />}
        {activeView === "config" && <Config setView={setActiveView} />}
        {activeView === "account" && <AccountSettings setView={setActiveView} />}
  
        {/* Si hay un chat o contacto seleccionado, mostramos el chat. Si no, mostramos la pantalla de bienvenida */}
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
  );
  
};

export default Dashboard;