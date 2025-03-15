import { useState } from "react";
import Navbar from "../components/layout/Navbar";
import ChatList from "../components/ChatList";
import ContactList from "../components/ContactList";
import ChatArea from "../components/ChatArea";
import Config from "../components/Config";
import AccountSettings from "../components/AccountSettings";
import { useAuth } from "../hooks/useAuth";

const Dashboard = () => {
  const { user } = useAuth(); // Supongamos que `useAuth` proporciona el usuario autenticado
  const [activeView, setActiveView] = useState("chats");
  const [selectedContact, setSelectedContact] = useState<{
    id: string;
    username: string;
    avatar_url: string;
  } | null>(null);

  const handleSelectContact = (contact: { id: string; username: string; avatar_url: string }) => {
    setSelectedContact(contact); // Guardamos toda la información del contacto
  };

  return (
    <div className="flex h-screen">
      <Navbar setActiveView={setActiveView} />
      <div className="ml-16 flex-grow flex">
        {activeView === "chats" && user && <ChatList userId={user.id} />}
        {activeView === "contacts" && <ContactList onSelectContact={handleSelectContact} />}
        {activeView === "config" && <Config setView={setActiveView} />}
        {activeView === "account" && <AccountSettings setView={setActiveView} />}

        {/* Mostramos el ChatArea solo si hay un contacto seleccionado */}
        {selectedContact && user && (
          <ChatArea
            contactId={selectedContact.id}
            contactName={selectedContact.username}
            contactAvatar={selectedContact.avatar_url}
            senderId={user.id} // Pasar el senderId aquí
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
