import { useState } from "react";
import ChatService from "../../services/chatService";  // Importa el servicio ChatService

interface MessageProps {
  message: {
    content: string;
    senderId: string;
  };
  isMine: boolean;
}

const Message = ({ message, isMine }: MessageProps) => {
  return (
    <div className={`p-2 my-2 ${isMine ? "text-right" : "text-left"}`}>
      <span
        className={`p-2 rounded ${isMine ? "bg-blue-500 text-white" : "bg-gray-200 text-black"}`}
      >
        {message.content}
      </span>
    </div>
  );
};

interface SendMessageProps {
  chatId: string;
  senderId: string;
}

const SendMessage = ({ chatId, senderId }: SendMessageProps) => {
  const [content, setContent] = useState("");

  const handleSendMessage = async () => {
    if (!content.trim()) return; // Evita el envío si el contenido está vacío

    try {
      // Usamos ChatService para enviar el mensaje
      const response = await ChatService.sendMessage(senderId, chatId, content);
      console.log("Message sent:", response);
      setContent(""); // Limpiar el campo de texto después de enviar el mensaje
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Type a message..."
      />
      <button onClick={handleSendMessage}>Send</button>
    </div>
  );
};

export { Message, SendMessage };
