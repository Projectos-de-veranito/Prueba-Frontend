import React, { useState, useEffect } from "react";
import ChatService from "../../services/chatService";
import { Send, Paperclip, X, ChevronDown  } from "lucide-react";

interface Message {
  sender_id: string;
  content?: string;
  created_at: string;
  media_url?: string;
}

interface Chat {
  id: string;
  name: string;
}

interface ChatBoxProps {
  senderId: string;
  receiverId: string;
}

const ChatBox: React.FC<ChatBoxProps> = ({ senderId, receiverId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chat, setChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!receiverId) {
      setError("ID de receptor no válido");
      return;
    }

    const fetchChat = async () => {
      setLoading(true);
      try {
        const response = await ChatService.getChatByUsers(senderId, receiverId);
        if (response && response.id) {
          setChat(response);
          fetchMessages(response.id);
        } else {
          setError("No se encontró un chat entre estos usuarios.");
        }
      } catch (error: any) {
        setError("Error al cargar el chat: " + (error.message || "Desconocido"));
      } finally {
        setLoading(false);
      }
    };

    fetchChat();
  }, [receiverId]);

  const fetchMessages = async (chatId: string) => {
    try {
      const response = await ChatService.getMessages(chatId);
      setMessages(response);
    } catch (error: any) {
      setError("Error al cargar los mensajes: " + (error.message || "Desconocido"));
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
    if (selectedFile) {
      const fileUrl = URL.createObjectURL(selectedFile);
      setFilePreview(fileUrl);
    } else {
      setFilePreview(null);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFilePreview(null);
  };

  const handleSendMessage = async () => {
    if (!message.trim() && !file) return;

    let mediaUrl: string | null = null;
    if (file) {
      try {
        mediaUrl = await ChatService.uploadFile(file, senderId);
      } catch (error) {
        console.error("Error al subir el archivo:", error);
        alert("No se pudo subir el archivo.");
        return;
      }
    }

    try {
      const newMessage = await ChatService.sendMessage(
        chat?.id!,
        senderId,
        message || undefined,
        mediaUrl || undefined
      );

      setMessages([...messages, newMessage]);
      setMessage("");
      setFile(null);
      setFilePreview(null);
    } catch (error) {
      console.error("Error al enviar el mensaje:", error);
      alert("No se pudo enviar el mensaje. Intenta de nuevo.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#202c2d] text-white p-4 rounded-lg shadow-lg w-full mx-auto">
      {loading && <p className="text-gray-400">Cargando...</p>}
      {error && <p className="text-red-500">{error}</p>}
  
      <div className="flex flex-col flex-grow overflow-y-auto space-y-3 p-2 w-full h-80">
        {messages.length > 0 ? (
          messages.map((message, index) => {
            const formattedTime = new Date(message.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            });
  
            return (
              <div
                key={index}
                className={`group relative p-3 rounded-lg max-w-xs flex items-end space-x-2 ${
                  message.sender_id === senderId ? "bg-green-600 self-end" : "bg-gray-700 self-start"
                }`}
              >
                {message.media_url ? (
                  <img src={message.media_url} alt="Adjunto" className="max-w-xs max-h-40 rounded-lg" />
                ) : (
                  <span className="flex-grow break-words">{message.content}</span>
                )}
                <span className="text-xs text-gray-300 min-w-[40px] text-right">{formattedTime}</span>
  
                {/* Botón de flecha (solo visible en hover) */}
                <button className="absolute -bottom-1 -right-1 p-1 rounded-full bg-black/50 text-white opacity-80 hover:opacity-100 group-hover:flex hidden">
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            );
          })
        ) : (
          <p className="text-gray-400 text-center items-center">No hay mensajes en este chat.</p>
        )}
      </div>
  
      {filePreview && (
        <div className="flex items-center bg-[#1a2424] p-2 rounded-lg mb-2">
          {file?.type.startsWith("image/") ? (
            <img src={filePreview} alt="Vista previa" className="max-w-32 max-h-32 rounded-lg" />
          ) : (
            <span className="text-white">{file?.name}</span>
          )}
          <button onClick={handleRemoveFile} className="ml-2 p-2 rounded-full text-red-500">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
  
      <div className="flex items-center mt-2">
        <label className="cursor-pointer p-2 rounded-full bg-[#1e3833] hover:bg-[#14a089] transition">
          <Paperclip className="text-[#17c2a4] w-5 h-5" />
          <input type="file" onChange={handleFileChange} className="hidden" />
        </label>
  
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-grow bg-[#1a2424] rounded-full px-4 py-2 text-white placeholder-gray-400 focus:outline-none"
          placeholder="Escribe un mensaje"
        />
  
        <button onClick={handleSendMessage} className="ml-2 p-3 rounded-full text-[#17c2a4] hover:bg-[#1e3833]">
          <Send className="w-5 h-5 text-[#00af78]" />
        </button>
      </div>
    </div>
  );

};

export default ChatBox;
