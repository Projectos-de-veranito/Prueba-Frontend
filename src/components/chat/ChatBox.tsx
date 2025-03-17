import React, { useState, useEffect, useRef } from "react";
import ChatService from "../../services/chatService";
import { Send, Paperclip, X, ChevronDown, Pencil, Trash, File, Download, } from "lucide-react";
import LogoChat from "../../assets/logo_chat.webp";
import { supabase } from "../../utils/supabaseClient";

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content?: string;
  created_at: string;
  edited_at?: string;
  updated_at?: string;
  media_url?: string;
  file_size?: number;
  isTemp?: boolean;
  isEdited?: boolean;
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
  const [fileType, setFileType] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editedContent, setEditedContent] = useState<string>("");
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const previousMessagesRef = useRef<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement | null>(null);
  const initialLoadRef = useRef<boolean>(true);
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

  const handleEditMessage = (messageId: string) => {
    const messageToEdit = messages.find((msg) => msg.id === messageId);
    if (messageToEdit) {
      setEditingMessage(messageToEdit);
      setEditedContent(messageToEdit.content || "");
    }
  };

  const handleSaveEdit = async () => {
    if (!editingMessage || !editedContent.trim()) return;

    try {
      const updatedMessage = await ChatService.editMessage(
        chat?.id!,
        editingMessage.id,
        editedContent,
        senderId
      );

      // Actualizar el mensaje manteniendo el orden original
      setMessages(messages.map((msg) =>
        msg.id === editingMessage.id
          ? {
            ...msg,
            content: updatedMessage.content,
            updated_at: updatedMessage.updated_at,
            isEdited: true
          }
          : msg
      ));

      setEditingMessage(null);
      setSelectedMessage(null);
      setEditedContent("");
    } catch (error) {
      console.error("Error al actualizar el mensaje:", error);
      alert("No se pudo actualizar el mensaje.");
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!chat) {
      alert("No se encontró el chat.");
      return;
    }

    // Comprobar si es un mensaje temporal
    if (messageId.startsWith('temp-')) {
      setMessages(prevMessages => prevMessages.filter(msg => msg.id !== messageId));
      setSelectedMessage(null);
      return;
    }

    try {
      // Actualización optimista
      setMessages(prevMessages => prevMessages.filter(msg => msg.id !== messageId));
      setSelectedMessage(null);

      // 1. Primero crear un evento para notificar a otros usuarios
      await ChatService.createChatEvent(
        chat.id,
        'message_deleted',
        messageId,
        senderId
      );

      // 2. Luego eliminar el mensaje
      await ChatService.deleteMessage(chat.id, messageId, senderId);
    } catch (error: any) {
      // Revertir en caso de error
      fetchMessages(chat.id);
      alert("Error al eliminar el mensaje: " + (error.message || "Desconocido"));
      console.error(error);
    }
  };

  useEffect(() => {
    if (!chat?.id) return;

    console.log('Configurando suscripción para eventos de chat:', chat.id);

    const eventsChannel = supabase
      .channel(`events:${chat.id}:${Date.now()}`)
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_events',
          filter: `chat_id=eq.${chat.id}`
        },
        (payload) => {
          console.log('Evento de chat recibido:', payload);

          if (payload.new && payload.new.event_type === 'message_deleted') {
            const deletedMessageId = payload.new.message_id;
            console.log('Procesando evento de eliminación para mensaje:', deletedMessageId);

            // Actualizar el estado para eliminar el mensaje
            setMessages(prevMessages =>
              prevMessages.filter(msg => msg.id !== deletedMessageId)
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('Estado de suscripción a eventos:', status);
      });

    return () => {
      console.log('Limpiando suscripción a eventos para chat:', chat.id);
      supabase.removeChannel(eventsChannel);
    };
  }, [chat?.id]);

  const scrollToBottom = () => {
    if (messageContainerRef.current) {
      // En un contenedor flex-col-reverse, scrollTop = 0 significa estar en el final visual (mensajes más recientes)
      messageContainerRef.current.scrollTop = 0;
    }
  };

  // Modificado para manejar el scroll correctamente con contenedor invertido
  useEffect(() => {
    // Solo para mensajes nuevos (no para la carga inicial)
    if (messages.length > 0 && !initialLoadRef.current) {
      scrollToBottom();
    }

    // En la carga inicial
    if (initialLoadRef.current && messages.length > 0) {
      initialLoadRef.current = false;

      // Con flex-col-reverse, scrollTop = 0 ya muestra los mensajes más recientes
      if (messageContainerRef.current) {
        messageContainerRef.current.scrollTop = 0;
      }
    }
  }, [messages]);

  const fetchMessages = async (chatId: string) => {
    try {
      const response = await ChatService.getMessages(chatId);
      setMessages(response.map(msg => ({
        ...msg,
        isEdited: msg.updated_at !== null // Mantiene el estado de editado después de recargar
      })));
    } catch (error: any) {
      setError("Error al cargar los mensajes: " + (error.message || "Desconocido"));
    }
  };


  // Actualiza tu método de suscripción:
  useEffect(() => {
    if (!chat?.id) return;

    console.log('Configurando suscripción para chat:', chat.id);

    // 1. Crear un canal con un nombre único usando timestamp
    const channelName = `messages:${chat.id}:${Date.now()}`;

    const messagesChannel = supabase
      .channel(channelName)
      .on('postgres_changes',
        {
          event: '*', // Suscribirse a todos los eventos para mayor fiabilidad
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chat.id}`
        },
        (payload) => {
          console.log('Evento recibido:', payload.eventType, payload);

          if (payload.eventType === 'DELETE') {
            // Log detallado para depuración
            console.log('Procesando DELETE:', payload);
            console.log('ID del mensaje eliminado:', payload.old?.id);

            if (payload.old && payload.old.id) {
              setMessages(currentMessages => {
                // Usar una función para asegurarnos de que estamos trabajando con el estado más reciente
                console.log('Filtrando mensaje:', payload.old.id);
                console.log('Mensajes antes:', currentMessages.length);

                const filtered = currentMessages.filter(msg => {
                  const keep = msg.id !== payload.old.id;
                  if (!keep) console.log('Eliminando mensaje del estado local:', msg.id);
                  return keep;
                });

                console.log('Mensajes después:', filtered.length);
                return filtered;
              });
            }
          } else if (payload.eventType === 'INSERT' && payload.new) {
            setMessages(prevMessages => {
              const filteredMessages = prevMessages.filter(msg => !msg.isTemp);
              return [...filteredMessages, payload.new as Message];
            });
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            setMessages(prevMessages =>
              prevMessages.map(msg =>
                msg.id === payload.new.id
                  ? {
                    ...msg,
                    content: payload.new.content,
                    updated_at: payload.new.updated_at,
                    isEdited: payload.new.updated_at !== payload.new.created_at
                  }
                  : msg
              ),
            );
          }
        }
      )
      .subscribe();

    // Limpiar la suscripción
    return () => {
      console.log('Limpiando suscripción para chat:', chat.id);
      supabase.removeChannel(messagesChannel);
    };
  }, [chat?.id]);


  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    if (!selectedFile) return;

    setFile(selectedFile);
    setFileType(selectedFile.type);
    setFilePreview(URL.createObjectURL(selectedFile));
  };


  const getFileNameFromUrl = (url: string) => {
    if (!url) return "archivo"; // Nombre predeterminado si no hay URL
    const urlWithoutToken = url.split("?token=")[0]; // Elimina el token
    return urlWithoutToken.split("/").pop() || "archivo"; // Obtiene el nombre del archivo
  };

  const handleDownload = async (fileUrl: string) => {
    const fileName = getFileNameFromUrl(fileUrl); // Obtiene el nombre del archivo

    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = fileName; // Asigna el nombre del archivo
      document.body.appendChild(a);
      a.click();

      // Limpieza
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error al descargar el archivo:", error);
    }
  };


  const handleRemoveFile = () => {
    setFile(null);
    setFilePreview(null);
    setFileType(null)
  };
  const getImageUrl = async (url: string | null) => {
    if (!url) return null;

    try {
      // Extraer solo el path relativo desde la URL completa
      const filePath = url.includes("/object/sign/uploads/")
        ? url.split("/object/sign/uploads/")[1]?.split("?")[0] // Obtiene solo la parte relevante
        : url.includes("/uploads/")
          ? url.split("/uploads/")[1]?.split("?")[0]
          : url;

      if (!filePath) {
        console.error("❌ No se pudo extraer el path del archivo.");
        return null;
      }

      console.log("📂 Path procesado:", filePath);

      const { data, error } = await supabase.storage.from("uploads").createSignedUrl(filePath, 3600);

      if (error || !data?.signedUrl) {
        console.error("❌ Error obteniendo URL firmada:", error);
        return null;
      }

      console.log("✅ URL firmada obtenida:", data.signedUrl);
      return data.signedUrl;
    } catch (err) {
      console.error("❌ Error en getImageUrl:", err);
      return null;
    }
  };


  useEffect(() => {
    const loadSignedUrls = async () => {
      console.log("🔄 Cargando URLs firmadas...");

      const updatedMessages: Message[] = await Promise.all(
        messages.map(async (msg) => {
          if (!msg.media_url) return msg; // Si no tiene imagen, devolver el mensaje original

          const mediaUrl = msg.media_url;
          if (imageUrls[mediaUrl]) {
            console.log("⚡ Usando URL cacheada:", imageUrls[mediaUrl]);
            return { ...msg, media_url: imageUrls[mediaUrl] };
          }

          console.log("🌐 Generando nueva URL firmada para:", mediaUrl);
          const signedUrl = await getImageUrl(mediaUrl);
          if (signedUrl) {
            setImageUrls((prev) => ({ ...prev, [mediaUrl]: signedUrl })); // Cachear la URL firmada
            return { ...msg, media_url: signedUrl };
          }

          return msg;
        })
      );

      if (JSON.stringify(previousMessagesRef.current) !== JSON.stringify(updatedMessages)) {
        console.log("✅ Actualizando mensajes con URLs firmadas...");
        setMessages(updatedMessages);
        previousMessagesRef.current = updatedMessages;
      }
    };

    if (messages.length > 0) {
      loadSignedUrls();
    }
  }, [messages]);



  const handleSendMessage = async () => {
    if (!message.trim() && !file) return;

    // Create a temporary message object with a temporary ID
    const tempId = `temp-${Date.now()}`;
    const tempMessage: Message = {
      id: tempId,
      chat_id: chat?.id!,
      sender_id: senderId,
      content: message || undefined,
      created_at: new Date().toISOString(),
      updated_at: undefined,
      // Add a flag to indicate this is a temporary message
      isTemp: true
    };

    // Add the temporary message to the UI
    setMessages(prevMessages => [...prevMessages, tempMessage]);

    let media_url: string | null = null;

    if (file) {
      try {
        media_url = await ChatService.uploadFile(file, senderId, chat?.id!);
        console.log("Archivo subido correctamente:", media_url);
      } catch (error) {
        console.error("Error al subir el archivo:", error);
        alert("No se pudo subir el archivo.");
        return;
      }
    }

    console.log("Archivo subido con éxito:", media_url);

    try {
      // Just send the message but don't update the state directly
      await ChatService.sendMessage(
        chat?.id!,
        senderId,
        message || undefined,
        media_url || undefined,
      );

      // Reset the input fields
      setMessage("");
      setFile(null);
      setFilePreview(null);
      setFileType(null);

      // The message will be added to the UI by the Supabase subscription
    } catch (error) {
      console.error("Error al enviar el mensaje:", error);
      alert("No se pudo enviar el mensaje. Intenta de nuevo.");
    }
  };

  return (
    <div className="flex flex-col h-screen md:h-full bg-[#202c2d] text-white p-2 sm:p-4 rounded-lg shadow-lg w-full mx-auto relative">
      <img
        src={LogoChat}
        alt="FlowChat Logo"
        className="absolute opacity-10 pointer-events-none w-auto h-auto max-w-[50%] max-h-[50%] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[65%] object-contain"
      />
      {loading && <p className="text-gray-400">Cargando...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div
        ref={messageContainerRef}
        className="flex flex-col-reverse flex-grow overflow-y-auto p-1 sm:p-2 sm:pb-2 pb-2 w-full space-y-2 sm:space-y-3 max-h-[calc(100vh-150px)]"
        >

        {
          messages.length > 0 ? (
            [...messages].reverse().map((message, index) => {
              const formattedTime = new Date(message.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              });

              return (
                <div
                  key={index}
                  className={`group relative p-2 sm:p-3 rounded-lg max-w-[80%] sm:max-w-xs flex flex-col ${message.sender_id === senderId ? "bg-[#00af78] self-end" : "bg-[#1f2928] self-start"
                    }`}
                >
                  {/* Si el mensaje tiene un archivo (imagen, video o archivo) lo mostramos */}
                  {message.media_url ? (
                    (() => {
                      const urlWithoutToken = typeof message.media_url === 'string' ?
                        message.media_url.split("?token=")[0] : '';
                      const fileNameWithExt = urlWithoutToken.substring(urlWithoutToken.lastIndexOf("-") + 1);
                      const extension = fileNameWithExt.split(".").pop()?.toLowerCase() || "";
                      const fileSize = message.file_size ? `${(message.file_size / (1024 * 1024)).toFixed(1)} MB` : "";

                      if (["mp4", "mov", "webm"].includes(extension)) {
                        return (
                          <video controls className="max-w-full sm:max-w-xs max-h-32 sm:max-h-40 rounded-lg">
                            <source src={message.media_url} type={`video/${extension}`} />
                          </video>
                        );
                      } else if (["jpeg", "jpg", "png", "gif", "webp"].includes(extension)) {
                        return (
                          <img
                            src={message.media_url}
                            alt="Adjunto"
                            className="max-w-full sm:max-w-xs max-h-32 sm:max-h-40 rounded-lg"
                          />
                        );
                      } else {
                        return (
                          <div
                            className={`p-2 sm:p-3 rounded-lg flex items-center space-x-2 sm:space-x-3 w-full ${message.sender_id === senderId ? "bg-[#008b60]" : "bg-[#263130]"
                              }`}
                          >
                            <div
                              className={`p-1 sm:p-2 rounded-lg ${message.sender_id === senderId ? "bg-[#006848]" : "bg-[#1b2423]"}`
                              }
                            >
                              <File className="text-white w-4 h-4 sm:w-6 sm:h-6" />
                            </div>

                            <div className="flex flex-col flex-grow text-gray-200">
                              <span className="text-xs sm:text-sm font-semibold truncate max-w-[100px] sm:max-w-[140px]">
                                {fileNameWithExt}
                              </span>
                              <span className="text-xs text-gray-300">
                                {extension.toUpperCase()} {fileSize}
                              </span>
                            </div>
                            <a
                              onClick={(e) => {
                                e.preventDefault();
                                if (message.media_url) {
                                  handleDownload(message.media_url);
                                } else {
                                  console.error("No hay una URL de archivo disponible");
                                }
                              }}
                              className="text-white p-1 sm:p-2 rounded-lg hover:bg-[#14a08959] transition cursor-pointer"
                            >
                              <Download className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            </a>
                          </div>
                        );
                      }
                    })()
                  ) : (
                    <div className="flex flex-col w-full min-w-10">
                      <p className={`text-white text-sm sm:text-base break-words whitespace-normal overflow-wrap-anywhere ${message.content && message.content.length < 30 ? "leading-snug py-0" : "leading-normal py-0.5"}`}>
                        {message.content}
                      </p>
                      <div className="flex justify-end mt-1">
                        {message.isEdited == true && (
                          <span className="text-xs text-gray-400 ml-1 mr-1">Editado</span>
                        )}
                        <span className="text-xs text-gray-300">{formattedTime}</span>
                      </div>
                    </div>
                  )}


                  {/* Mostrar el botón ChevronDown solo para los mensajes enviados por el usuario actual */}
                  {message.sender_id === senderId && (
                    <button
                      onClick={() => setSelectedMessage(message)}
                      className="absolute -top-0.5 -right-1 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-80 hover:opacity-100 transition-opacity"
                    >
                      <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center flex-grow">
              <p className="text-gray-400 text-center text-sm sm:text-base">No hay mensajes en este chat.</p>
            </div>
          )
        }
        <div ref={messagesEndRef} />
      </div>

      {filePreview && (
        <div className="flex items-center bg-[#1a2424] sm:p-2 p-2 rounded-lg mb-2">
          {file?.type.startsWith("image/") ? (
            <img src={filePreview} alt="Vista previa" className="max-h-24 sm:max-h-32 max-w-24 sm:max-w-32 rounded-lg" />
          ) : file?.type.startsWith("video/") ? (
            <video controls className="max-h-24 sm:max-h-32 max-w-24 sm:max-w-32 rounded-lg">
              <source src={filePreview} type={fileType || undefined} />
            </video>
          ) : (
            <div className="flex flex-col min-w-[40px] sm:min-w-50 px-2 sm:px-5 py-2 items-center justify-center bg-[#263130] rounded-lg">
              <File className="m-1 sm:m-2 w-4 h-4 sm:w-6 sm:h-6" />
              <span className="text-white overflow-ellipsis overflow-hidden whitespace-nowrap max-w-[100px] sm:max-w-[200px] text-center text-xs sm:text-sm">
                {file?.name}
              </span>
              <span className="text-xs text-gray-400 m-1 sm:m-2">{file?.type.split('/')[1]?.toUpperCase()}</span>
            </div>
          )}
          <button onClick={handleRemoveFile} className="ml-2 p-2 rounded-full text-red-500">
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      )}

<div className=" bottom-0 left-0 right-0 bg-[#202c2d] pb-35 p-2 sm:p-1 flex items-center gap-2 sm:gap-3">
  {/* Botón para adjuntar archivos */}
  <label className="cursor-pointer p-2 rounded-full bg-[#1e3833] hover:bg-[#14a08959] transition">
    <Paperclip className="text-[#17c2a4] w-5 h-5 sm:w-6 sm:h-6" />
    <input type="file" onChange={handleFileChange} className="hidden" />
  </label>

  {/* Input de mensaje */}
  <input
    type="text"
    value={message}
    onChange={(e) => setMessage(e.target.value)}
    onKeyDown={handleKeyDown}
    className="flex-grow min-w-[150px] sm:min-w-[250px] bg-[#1a2424] rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-white placeholder-gray-400 focus:outline-none text-sm sm:text-base"
    placeholder="Escribe un mensaje..."
  />

  {/* Botón de enviar */}
  <button
    onClick={handleSendMessage}
    className="p-2 sm:p-3 rounded-full text-[#17c2a4] hover:bg-[#1e3833] transition"
    disabled={message.trim() === '' && !file}
  >
    <Send className={`w-5 h-5 sm:w-6 sm:h-6 text-[#00af78] ${(message.trim() === '' && !file) ? 'opacity-50' : ''}`} />
  </button>
</div>

      {/* Modal para opciones de mensaje */}
      {selectedMessage && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 transition-opacity duration-300 ease-out px-4">
          <div
            className="bg-[#263337] text-white p-4 sm:p-5 rounded-xl shadow-2xl w-full max-w-xs sm:w-80 transition-transform duration-300 ease-out transform scale-95 border border-[#32444a]"
            style={{ opacity: 1, transform: "scale(1)" }}
          >
            <h2 className="text-base sm:text-lg font-semibold mb-4 sm:mb-5 border-b border-[#32444a] pb-2 text-center">Opciones del Mensaje</h2>

            <button
              onClick={() => handleDeleteMessage(selectedMessage.id)}
              className="flex items-center justify-center text-red-400 w-full mb-2 sm:mb-3 p-2 sm:p-3 rounded-lg hover:bg-[#3a474c] transition-colors duration-200 border border-[#32444a]"
            >
              <Trash className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
              <span className="text-center text-sm sm:text-base">Borrar mensaje</span>
            </button>

            <button
              onClick={() => handleEditMessage(selectedMessage.id)}
              className="flex items-center justify-center text-[#17c2a4] w-full mb-2 sm:mb-3 p-2 sm:p-3 rounded-lg hover:bg-[#3a474c] transition-colors duration-200 border border-[#32444a]"
            >
              <Pencil className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
              <span className="text-center text-sm sm:text-base">Editar mensaje</span>
            </button>

            <button
              onClick={() => setSelectedMessage(null)}
              className="flex items-center justify-center text-gray-300 w-full p-2 sm:p-3 rounded-lg hover:bg-[#3a474c] transition-colors duration-200 border border-[#32444a]"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
              <span className="text-center text-sm sm:text-base">Cancelar</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal para editar mensaje */}
      {editingMessage && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 px-4">
          <div className="bg-[#263337] text-white p-4 sm:p-5 rounded-xl shadow-2xl w-full max-w-xs sm:w-80 border border-[#32444a]">
            <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 border-b border-[#32444a] pb-2 text-center">Editar Mensaje</h2>
            <input
              type="text"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full p-2 sm:p-3 rounded-lg bg-[#1a2424] text-white border border-[#32444a] focus:outline-none focus:border-[#17c2a4] text-sm sm:text-base"
              autoFocus
            />
            <div className="flex justify-center mt-3 sm:mt-4 space-x-2 sm:space-x-3">
              <button
                onClick={() => setEditingMessage(null)}
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-gray-300 hover:bg-[#3a474c] border border-[#32444a] transition-colors duration-200 text-center text-sm sm:text-base"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-[#00af78] text-white hover:bg-[#008b60] transition-colors duration-200 text-center text-sm sm:text-base"
                disabled={editedContent.trim() === ''}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBox;