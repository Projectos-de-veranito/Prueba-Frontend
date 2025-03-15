import React, { useState, useEffect } from "react";
import ChatService from "../../services/chatService";

interface Message {
  sender_id: string;
  content: string;
  media_url?: string;
}

interface Chat {
  id: string;
  name: string;
  members: string[];
}

interface ChatBoxProps {
  senderId: string;
  receiverId: string;
}

const ChatBox: React.FC<ChatBoxProps> = ({ senderId, receiverId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [chat, setChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    // Verificar si el receiverId está presente y es válido
    if (!receiverId) {
      setError("ID de receptor no válido");
      return;
    }

    const fetchChat = async () => {
      setLoading(true);
      try {
        const response = await ChatService.getChatById(receiverId, senderId);
        if (response?.chat) {
          setChat(response.chat);
          fetchMessages(response.chat.id); // Cargar mensajes después de obtener el chat
        } else {
          setError("No se encontró el chat");
        }
      } catch (error: any) {
        setError("Error al cargar el chat: " + (error.response?.data?.message || error.message));
      } finally {
        setLoading(false);
      }
    };

    fetchChat();
  }, [receiverId]);

  // Obtener los mensajes del chat
  const fetchMessages = async (chatId: string) => {
    try {
      const response: Message[] = await ChatService.getMessages(chatId);
      if (response.length > 0) {
        setMessages(response);
      } else {
        setError("No se encontraron mensajes en este chat.");
      }
    } catch (error: any) {
      setError("Error al cargar los mensajes: " + (error.response?.data?.message || error.message));
    }
  };

  // Enviar un mensaje
  const handleSendMessage = async () => {
    if (newMessage.trim() === "") return; // No enviar si el mensaje está vacío

    try {
      if (!chat?.id) {
        throw new Error("No se pudo obtener el ID del chat.");
      }
      const response: { message: Message } = await ChatService.sendMessage(chat.id, senderId, newMessage);
      setMessages([...messages, response.message]); // Agregar el mensaje enviado al estado
      setNewMessage(""); // Limpiar el campo de texto
    } catch (error: any) {
      setError("Error al enviar el mensaje: " + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="chat-box">
      {loading && <p>Cargando...</p>}
      {error && <p className="error">{error}</p>}

      <div className="chat-header">
        <h2>{chat?.name || "Chat"}</h2>
      </div>

      <div className="messages-container">
        {messages.length > 0 ? (
          messages.map((message, index) => (
            <div key={index} className="message">
              <span>{message.sender_id}: </span>
              <span>{message.content}</span>
            </div>
          ))
        ) : (
          <p>No hay mensajes en este chat.</p>
        )}
      </div>

      <div className="message-input">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Escribe un mensaje..."
        />
        <button onClick={handleSendMessage}>Enviar</button>
      </div>
    </div>
  );
};

export default ChatBox;
