import { useState, useEffect } from "react";
import Navbar from "../components/layout/Navbar";
import ChatList from "../components/ChatList";
import ContactList from "../components/ContactList";
import ChatArea from "../components/chat/ChatArea";
import Config from "../components/Config";
import AccountSettings from "../components/AccountSettings";
import { useAuth } from "../hooks/useAuth";
import Logo from "../assets/logo.webp";

const Dashboard = () => {
  const { user } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeView, setActiveView] = useState(isMobile ? "" : "chats");
  const [selectedContact, setSelectedContact] = useState<{
    id: string;
    username: string;
    avatar_url: string;
    chatId?: string;
  } | null>(null);
  
  const [selectedChat, setSelectedChat] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth < 768;
      setIsMobile(newIsMobile);
      
      // Si cambia el tamaño de la pantalla, ajustar la vista activa según corresponda
      if (newIsMobile && activeView === "chats" && !selectedContact && !selectedChat) {
        setActiveView("");
      } else if (!newIsMobile && activeView === "") {
        setActiveView("chats");
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeView, selectedContact, selectedChat]);

  const handleSelectContact = (contact: { id: string; username: string; avatar_url: string; chatId?: string }) => {
    setSelectedContact(contact);
    setSelectedChat(null);
    // Forzamos la activación de alguna vista si estamos en mobile y no hay vista activa
    if (isMobile && activeView === "") {
      setActiveView("chats");
    }
  };
  
  // Función para determinar si hay un chat o contacto seleccionado
  const hasSelection = () => {
    return selectedContact !== null || selectedChat !== null;
  };
  
  // Función para determinar si deberíamos mostrar el mensaje de bienvenida
  const showWelcomeMessage = () => {
    // Mostrar mensaje de bienvenida cuando no hay selección
    // O cuando estamos en mobile sin vista activa
    return (!hasSelection() && (activeView !== "" || !isMobile)) || (isMobile && activeView === "");
  };
  
  // Reiniciar selección al cambiar vista en mobile
  const handleViewChange = (view: string) => {
    // Si ya hay una vista seleccionada y le damos clic de nuevo, no hacemos nada en mobile
    if (isMobile && view === activeView && !hasSelection()) {
      return;
    }
    
    setActiveView(view);
    if (isMobile) {
      setSelectedContact(null);
      setSelectedChat(null);
    }
  };
  
  // Determinar la visibilidad del sidebar
  const getSidebarClass = () => {
    if (isMobile) {
      if (activeView === "") {
        return "hidden"; // Ocultar sidebar cuando no hay vista activa en mobile
      } else if (hasSelection()) {
        return "hidden"; // Ocultar sidebar cuando hay un chat seleccionado en mobile
      } else {
        return "block"; // Mostrar sidebar cuando hay una vista activa pero no hay chat en mobile
      }
    }
    return "block"; // Siempre visible en desktop
  };
  
  // Determinar la visibilidad del área de contenido principal
  const getMainContentClass = () => {
    if (isMobile) {
      if (hasSelection()) {
        return "block"; // Mostrar área de contenido cuando hay selección en mobile
      } else if (activeView === "") {
        return "block"; // Mostrar área de contenido cuando no hay vista activa en mobile (para bienvenida)
      } else {
        return "hidden"; // Ocultar cuando hay una vista activa pero no hay selección
      }
    }
    return "block"; // Siempre visible en desktop
  };
  
  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden bg-gray-900">
      {/* Navbar - mobile at bottom, sidebar on desktop */}
      <div className="w-full md:w-16 h-16 md:h-screen fixed md:fixed bottom-0 md:top-0 left-0 right-0 md:right-auto md:bottom-auto z-10">
        <Navbar setActiveView={handleViewChange} activeView={activeView} />
      </div>
      
      {/* Main container */}
      <div className="flex flex-col md:flex-row flex-grow w-full md:w-[calc(100%-4rem)] md:ml-16 pt-4 md:pt-0 pb-16 md:pb-0 overflow-hidden">
        {/* Sidebar - visible based on criteria */}
        <div className={`${getSidebarClass()} w-full md:w-72 lg:w-80 md:flex-shrink-0 border-r border-gray-700`}>
          {activeView === "chats" && <ChatList onSelectContact={handleSelectContact} />}
          {activeView === "contacts" && <ContactList onSelectContact={handleSelectContact} />}
          {activeView === "config" && <Config setView={handleViewChange} />}
          {activeView === "account" && <AccountSettings setView={handleViewChange} />}
        </div>
  
        {/* Main content area */}
        <div className={`flex-grow h-full overflow-hidden ${getMainContentClass()}`}>
          {/* Show welcome screen when appropriate */}
          {showWelcomeMessage() && (
            <div className="flex items-center justify-center h-full bg-gray-900 text-white">
              <div className="text-center">
                <div className="mb-6">
                  <img src={Logo} alt="FlowChat Logo" className="w-auto h-32 mx-auto" />
                </div>
                <p className="text-lg">Selecciona un chat para empezar<br />a conversar 🚀</p>
              </div>
            </div>
          )}
          
          {/* Show chat area when a chat is selected */}
          {user && hasSelection() && (
            <ChatArea
              senderId={user.id}
              contactId={selectedChat?.id || selectedContact?.id || ""}
              contactName={selectedContact?.username || selectedChat?.name || "Chat"}
              contactAvatar={selectedContact?.avatar_url || ""}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;