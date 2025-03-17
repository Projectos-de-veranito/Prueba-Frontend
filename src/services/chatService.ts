import { supabase } from "../utils/supabaseClient";

class ChatService {
  async getChatsByUser(userId: string) {
    try {
      const { data, error } = await supabase
        .from("chat_members")
        .select("chat_id")
        .eq("user_id", userId);

      if (error) {
        console.error("Error al obtener los chats:", error);
        throw new Error(error.message || "Error al obtener los chats");
      }

      if (!data || data.length === 0) {
        return []; 
      }

      const chatIds = data.map((member: any) => member.chat_id);
      const { data: chats, error: chatsError } = await supabase
        .from("chats")
        .select("*")
        .in("id", chatIds);

      if (chatsError) {
        console.error("Error al obtener los detalles de los chats:", chatsError);
        throw new Error(chatsError.message || "Error al obtener los chats");
      }

      return chats; 
    } catch (error: any) {
      console.error("Error al obtener los chats:", error);
      throw new Error(error.message || "Error al obtener los chats");
    }
  }

  async getChatById(chatId: string, userId: string) {
    try {
      if (!chatId || !userId) {
        throw new Error("El chatId o userId no es válido.");
      }

      console.log("Buscando chat con ID:", chatId);

      const { data: chat, error } = await supabase
        .from('chats')
        .select('*')
        .eq('id', chatId)
        .maybeSingle(); 
      if (error) {
        console.error("Error al obtener el chat:", error);
        throw new Error(error.message || "Error al obtener el chat");
      }

      if (!chat) {
        console.log(`No se encontró un chat con ID: ${chatId}`);
        throw new Error("El chat no existe.");
      }

      const { data: members, error: membersError } = await supabase
        .from("chat_members")
        .select("user_id")
        .eq("chat_id", chatId)
        .eq("user_id", userId)
        .single(); 

      if (membersError) {
        console.error("Error al obtener los miembros del chat:", membersError);
        throw new Error(membersError.message || "Error al obtener los miembros del chat");
      }

      if (!members) {
        console.log(`El usuario no es miembro del chat con ID: ${chatId}`);
        throw new Error("El chat no existe o el usuario no es miembro.");
      }

      return chat; 
    } catch (error: any) {
      console.error("Error al obtener el chat:", error);
      throw new Error(error.message || "Error al obtener el chat");
    }
  }

  async getChatByUsers(user1Id: string, user2Id: string) {
    try {
      if (!user1Id || !user2Id) {
        throw new Error("Los IDs de los usuarios no son válidos.");
      }

      console.log(`Buscando chat entre ${user1Id} y ${user2Id}`);

      const { data: chatMembers, error: chatMembersError } = await supabase
        .from("chat_members")
        .select("chat_id")
        .eq("user_id", user1Id);

      if (chatMembersError) {
        console.error("Error al obtener los miembros del chat:", chatMembersError);
        throw new Error(chatMembersError.message || "Error al obtener los miembros del chat");
      }

      if (!chatMembers || chatMembers.length === 0) {
        console.log("No hay chats en común.");
        return null;
      }

      const chatIds = chatMembers.map((member: any) => member.chat_id);

      const { data: commonChat, error: commonChatError } = await supabase
        .from("chat_members")
        .select("chat_id")
        .in("chat_id", chatIds)
        .eq("user_id", user2Id)
        .maybeSingle(); 

      if (commonChatError) {
        console.error("Error al buscar el chat común:", commonChatError);
        throw new Error(commonChatError.message || "Error al buscar el chat común");
      }

      if (!commonChat) {
        console.log("No existe un chat entre estos usuarios.");
        return null;
      }

      const { data: chat, error: chatError } = await supabase
        .from("chats")
        .select("*")
        .eq("id", commonChat.chat_id)
        .maybeSingle();

      if (chatError) {
        console.error("Error al obtener detalles del chat:", chatError);
        throw new Error(chatError.message || "Error al obtener detalles del chat");
      }

      return chat;
    } catch (error: any) {
      console.error("Error al buscar el chat entre usuarios:", error);
      throw new Error(error.message || "Error al buscar el chat entre usuarios");
    }
  }

  async getMessages(chatId: string, limit: number = 20, offset: number = 0) {
    try {
      if (!chatId) {
        throw new Error("El chatId no es válido.");
      }

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chatId)
        .range(offset, offset + limit - 1);

      if (error) {
        console.error("Error al obtener los mensajes:", error);
        throw new Error(error.message || "Error al obtener los mensajes");
      }

      return data;
    } catch (error: any) {
      console.error("Error al obtener los mensajes:", error);
      throw new Error(error.message || "Error al obtener los mensajes");
    }
  }
  async uploadFile(file: File, userId: string, chatId: string): Promise<string> {
    const bucketName = "uploads";
    const filePath = `${userId}-${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file);

    if (uploadError) throw new Error("Error al subir archivo: " + uploadError.message);

    const { error: insertError } = await supabase.from("uploads").insert({
      user_id: userId,
      chat_id: chatId,
      file_url: filePath,
      file_type: file.type
    });

    if (insertError) throw new Error("Error al guardar metadatos: " + insertError.message);

    return filePath;
  }

  async sendMessage(chatId: string, senderId: string, content?: string, mediaUrl?: string) {
    try {
      if (!chatId || !senderId) {
        throw new Error("El chatId y senderId son obligatorios.");
      }

      if (!content?.trim() && !mediaUrl) {
        throw new Error("El mensaje debe contener texto o un archivo adjunto.");
      }

      const { data, error } = await supabase
        .from("messages")
        .insert([
          {
            sender_id: senderId,
            chat_id: chatId,
            content: content?.trim() || null,
            media_url: mediaUrl || null,
            created_at: new Date().toISOString(),
            updated_at: null,
            read: false
          }
        ])
        .select(); 

      if (error) {
        console.error("Error al enviar el mensaje:", error);
        throw new Error(error.message || "Error al enviar el mensaje");
      }

      if (!data || data.length === 0) {
        throw new Error("No se pudo enviar el mensaje.");
      }

      return data[0]; 
    } catch (error: any) {
      console.error("Error al enviar el mensaje:", error);
      throw new Error(error.message || "Error al enviar el mensaje");
    }
  }

  async editMessage(chatId: string, messageId: string, newContent: string, userId: string) {
    try {
      if (!chatId || !messageId || !newContent.trim() || !userId) {
        throw new Error("El chatId, messageId, newContent y userId son obligatorios.");
      }

      const { data: message, error: messageError } = await supabase
        .from("messages")
        .select("sender_id, chat_id")
        .eq("id", messageId)
        .single();

      if (messageError) {
        console.error("Error al obtener el mensaje:", messageError);
        throw new Error(messageError.message || "Error al obtener el mensaje");
      }

      if (!message) {
        throw new Error("El mensaje no existe.");
      }

      if (message.sender_id !== userId) {
        const { data: members, error: membersError } = await supabase
          .from("chat_members")
          .select("role")
          .eq("chat_id", chatId)
          .eq("user_id", userId)
          .single();

        if (membersError) {
          console.error("Error al obtener los miembros del chat:", membersError);
          throw new Error(membersError.message || "Error al obtener los miembros del chat");
        }

        if (!members || members.role !== "admin") {
          throw new Error("No tienes permisos para editar este mensaje.");
        }
      }

      const { data, error } = await supabase
        .from("messages")
        .update({ content: newContent.trim(), updated_at: new Date().toISOString() })
        .eq("id", messageId)
        .eq("chat_id", chatId)
        .select()
        .single();

      if (error) {
        console.error("Error al editar el mensaje:", error);
        throw new Error(error.message || "Error al editar el mensaje");
      }

      return data;
    } catch (error: any) {
      console.error("Error al editar el mensaje:", error);
      throw new Error(error.message || "Error al editar el mensaje");
    }
  }

  async createChat(createChatDto: any) {
    try {
      const { data, error } = await supabase
        .from("chats")
        .insert([createChatDto]);

      if (error) {
        console.error("Error al crear el chat:", error);
        throw new Error(error.message || "Error al crear el chat");
      }

      if (!data) {
        throw new Error("No se pudo crear el chat.");
      }
      return data[0];
    } catch (error: any) {
      console.error("Error al crear el chat:", error);
      throw new Error(error.message || "Error al crear el chat");
    }
  }


  async addMember(chatId: string, userId: string) {
    try {
      const { data, error } = await supabase
        .from("chat_members")
        .insert([{ chat_id: chatId, user_id: userId }]);

      if (error) {
        console.error("Error al agregar miembro:", error);
        throw new Error(error.message || "Error al agregar miembro");
      }

      return data;
    } catch (error: any) {
      console.error("Error al agregar miembro:", error);
      throw new Error(error.message || "Error al agregar miembro");
    }
  }


  async removeMember(chatId: string, userId: string) {
    try {
      const { data, error } = await supabase
        .from("chat_members")
        .delete()
        .match({ chat_id: chatId, user_id: userId });

      if (error) {
        console.error("Error al eliminar miembro:", error);
        throw new Error(error.message || "Error al eliminar miembro");
      }

      return data; 
    } catch (error: any) {
      console.error("Error al eliminar miembro:", error);
      throw new Error(error.message || "Error al eliminar miembro");
    }
  }


  async getChatMembers(chatId: string) {
    try {
      const { data, error } = await supabase
        .from("chat_members")
        .select("user_id")
        .eq("chat_id", chatId);

      if (error) {
        console.error("Error al obtener los miembros:", error);
        throw new Error(error.message || "Error al obtener los miembros");
      }

      return data; 
    } catch (error: any) {
      console.error("Error al obtener los miembros:", error);
      throw new Error(error.message || "Error al obtener los miembros");
    }
  }
  async deleteMessage(chatId: string, messageId: string, userId: string) {
    try {
      if (!chatId || !messageId || !userId) {
        throw new Error("El chatId, messageId y userId son obligatorios.");
      }

      const { data: message, error: messageError } = await supabase
        .from("messages")
        .select("sender_id, chat_id, media_url") 
        .eq("id", messageId)
        .single();

      if (messageError) {
        console.error("Error al obtener el mensaje:", messageError);
        throw new Error(messageError.message || "Error al obtener el mensaje");
      }

      if (!message) {
        console.log(`No se encontró un mensaje con ID: ${messageId}`);
        throw new Error("El mensaje no existe.");
      }

      if (message.sender_id !== userId) {
        const { data: members, error: membersError } = await supabase
          .from("chat_members")
          .select("role")
          .eq("chat_id", chatId)
          .eq("user_id", userId)
          .single();

        if (membersError) {
          console.error("Error al obtener los miembros del chat:", membersError);
          throw new Error(membersError.message || "Error al obtener los miembros del chat");
        }

        if (!members || members.role !== "admin") {
          console.log("El usuario no tiene permisos para eliminar el mensaje.");
          throw new Error("No tienes permisos para eliminar este mensaje.");
        }
      }

      if (message.media_url) { 
        const fileUrl = message.media_url;
        const filePath = fileUrl.includes("/uploads/")
          ? fileUrl.split("/uploads/")[1]?.split("?")[0]
          : fileUrl;

        if (filePath) {
          const { error: fileError } = await supabase.storage
            .from("uploads") 
            .remove([filePath]);

          if (fileError) {
            console.error("Error al eliminar el archivo del bucket:", fileError);
            console.warn("Continuando con la eliminación del mensaje a pesar del error en el archivo");
          }
        }
      }

      const { data, error } = await supabase
        .from("messages")
        .delete()
        .match({ id: messageId, chat_id: chatId });

      if (error) {
        console.error("Error al eliminar el mensaje:", error);
        throw new Error(error.message || "Error al eliminar el mensaje");
      }

      return data; 
    } catch (error: any) {
      console.error("Error al eliminar el mensaje:", error);
      throw new Error(error.message || "Error al eliminar el mensaje");
    }
  }
  async createChatEvent(chatId: string, eventType: string, messageId: string | null, userId: string) {
    try {
      const { data, error } = await supabase
        .from('chat_events')
        .insert({
          chat_id: chatId,
          event_type: eventType,
          message_id: messageId,
          created_by: userId
        })
        .select();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error al crear evento de chat:', error);
      throw new Error(error.message || 'Error al crear evento de chat');
    }
  }
}

export default new ChatService();
