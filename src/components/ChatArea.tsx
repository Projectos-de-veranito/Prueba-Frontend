import { useState } from "react";
import ChatService from "../services/chatService"; // Asegúrate de importar el servicio correctamente
import { Send } from "lucide-react";
import ChatBox from "./chat/ChatBox";

interface ChatAreaProps {
  contactId: string;
  contactName: string;
  contactAvatar: string;
  senderId: string;
}

export default function ChatArea({
  contactId,
  contactName,
  contactAvatar,
  senderId,
}: ChatAreaProps) {
  const [message, setMessage] = useState("");

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      // Usamos el servicio `sendMessage` para enviar el mensaje
      await ChatService.sendMessage(contactId, senderId, message);
      setMessage(""); // Limpiar el campo de texto
    } catch (error) {
      console.error("Error al enviar el mensaje:", error);
    }
  };

  return (
    <div className="flex-grow bg-[#212c2c] text-white p-4 flex flex-col">
      {/* Mostrar nombre y avatar del contacto */}
      <div className="flex items-center gap-2 mb-4">
        <img
          src={contactAvatar || "/default-avatar.png"}
          alt={contactName}
          className="w-8 h-8 rounded-full object-cover"
        />
        <h2 className="text-lg font-semibold">{contactName}</h2>
      </div>

      {/* Mostrar el componente ChatBox */}
      <ChatBox senderId={senderId} receiverId={contactId} />

      {/* Input para enviar mensajes */}
      <div className="flex items-center mt-2">
        <div className="flex-grow bg-[#1a2424] rounded-full px-4 py-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full p-2 bg-transparent text-white placeholder-gray-400 focus:outline-none"
            placeholder="Type a message"
          />
        </div>

        <button
          onClick={handleSendMessage}
          className="ml-2 p-3 rounded-full text-[#17c2a4] hover:text-[#14a089] transition bg-transparent hover:bg-[#1e3833] flex items-center justify-center"
        >
          <Send className="w-5 h-5 text-[#00af78]" />
        </button>
      </div>
    </div>
  );
}
