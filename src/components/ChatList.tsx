import { useEffect, useState } from "react";
import ChatService from "../services/chatService"; // Asegúrate de importar el servicio completo

interface ChatListProps {
  userId: string;
}

const ChatList = ({ userId }: ChatListProps) => {
  const [chats, setChats] = useState<any[]>([]);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const data = await ChatService.getChatsByUser(userId); // Llama al método del servicio
        setChats(data);
      } catch (error: any) {
        alert(error.message);
      }
    };

    fetchChats();
  }, [userId]);

  return (
    <div className="w-1/4 text-white p-4 flex flex-col h-full" style={{ backgroundColor: "#14201e" }}>
      <h2 className="text-lg font-semibold border-b border-gray-700 pb-2">Chats</h2>
      <ul className="flex-grow overflow-y-auto">
        {chats.length > 0 ? (
          chats.map((chat) => (
            <li key={chat.id} className="p-2 border-b border-gray-700 cursor-pointer hover:bg-[#122e29]">
              {chat.name}
            </li>
          ))
        ) : (
          <li className="p-2">No hay chats disponibles</li>
        )}
      </ul>
    </div>
  );
};

export default ChatList;
