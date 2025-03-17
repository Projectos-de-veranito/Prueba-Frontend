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
    if (isMobile && activeView === "") {
      setActiveView("chats");
    }
  };
  
  const hasSelection = () => {
    return selectedContact !== null || selectedChat !== null;
  };
  
  const showWelcomeMessage = () => {
    return (!hasSelection() && (activeView !== "" || !isMobile)) || (isMobile && activeView === "");
  };
  
  const handleViewChange = (view: string) => {
    if (isMobile && view === activeView && !hasSelection()) {
      return;
    }
    
    setActiveView(view);
    if (isMobile) {
      setSelectedContact(null);
      setSelectedChat(null);
    }
  };
  
  const getSidebarClass = () => {
    if (isMobile) {
      if (activeView === "") {
        return "hidden"; 
      } else if (hasSelection()) {
        return "hidden"; 
      } else {
        return "block";
      }
    }
    return "block"; 
  };
  
  const getMainContentClass = () => {
    if (isMobile) {
      if (hasSelection()) {
        return "block"; 
      } else if (activeView === "") {
        return "block";
      } else {
        return "hidden";
      }
    }
    return "block";
  };
  
  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden bg-gray-900">
      <div className="w-full md:w-16 h-16 md:h-screen fixed md:fixed bottom-0 md:top-0 left-0 right-0 md:right-auto md:bottom-auto z-10">
        <Navbar setActiveView={handleViewChange} activeView={activeView} />
      </div>
      
      <div className="flex flex-col md:flex-row flex-grow w-full md:w-[calc(100%-4rem)] md:ml-16 pt-4 md:pt-0 pb-16 md:pb-0 overflow-hidden">
        <div className={`${getSidebarClass()} w-full md:w-72 lg:w-80 md:flex-shrink-0 border-r border-gray-700`}>
          {activeView === "chats" && <ChatList onSelectContact={handleSelectContact} />}
          {activeView === "contacts" && <ContactList onSelectContact={handleSelectContact} />}
          {activeView === "config" && <Config setView={handleViewChange} />}
          {activeView === "account" && <AccountSettings setView={handleViewChange} />}
        </div>
  
        <div className={`flex-grow h-full overflow-hidden ${getMainContentClass()}`}>
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