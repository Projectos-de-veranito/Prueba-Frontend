import { createContext, useEffect, useState, useContext } from "react";
import { supabase } from "../utils/supabaseClient";

interface ChatContextType {
  messages: any[];
  sendMessage: (message: string, receiverId: string) => void;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    const messageSubscription = supabase
      .channel("public:messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        setMessages((prevMessages) => [...prevMessages, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messageSubscription);
    };
  }, []);

  const sendMessage = async (message: string, receiverId: string) => {
    await supabase
      .from("messages")
      .insert([{ content: message, receiver_id: receiverId }]);
  };

  return (
    <ChatContext.Provider value={{ messages, sendMessage }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat debe usarse dentro de un ChatProvider");
  }
  return context;
};
