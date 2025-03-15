import { supabase } from "../utils/supabaseClient";

class ChatService {
  // Obtener todos los chats de un usuario
  async getChatsByUser(userId: string) {
    try {
      // Obtener los chats en los que el usuario es miembro
      const { data, error } = await supabase
        .from("chat_members")
        .select("chat_id")
        .eq("user_id", userId);

      if (error) {
        console.error("Error al obtener los chats:", error);
        throw new Error(error.message || "Error al obtener los chats");
      }

      if (!data || data.length === 0) {
        return []; // Si no hay chats asociados, devolver un array vacío
      }

      // Obtener los detalles de esos chats
      const chatIds = data.map((member: any) => member.chat_id);
      const { data: chats, error: chatsError } = await supabase
        .from("chats")
        .select("*")
        .in("id", chatIds);

      if (chatsError) {
        console.error("Error al obtener los detalles de los chats:", chatsError);
        throw new Error(chatsError.message || "Error al obtener los chats");
      }

      return chats; // Retorna los chats encontrados
    } catch (error: any) {
      console.error("Error al obtener los chats:", error);
      throw new Error(error.message || "Error al obtener los chats");
    }
  }

  // Obtener un chat por ID
  async getChatById(chatId: string, userId: string) {
    try {
      if (!chatId || !userId) {
        throw new Error("El chatId o userId no es válido.");
      }

      console.log("Buscando chat con ID:", chatId);

      // Buscar el chat directamente
      const { data: chat, error } = await supabase
        .from('chats')
        .select('*')
        .eq('id', chatId)
        .maybeSingle();  // Asegura que devuelve solo un objeto en lugar de un array

      if (error) {
        console.error("Error al obtener el chat:", error);
        throw new Error(error.message || "Error al obtener el chat");
      }

      if (!chat) {
        console.log(`No se encontró un chat con ID: ${chatId}`);
        throw new Error("El chat no existe.");
      }

      // Verificar si el usuario es miembro
      const { data: members, error: membersError } = await supabase
        .from("chat_members")
        .select("user_id")
        .eq("chat_id", chatId)
        .eq("user_id", userId)
        .single(); // Asegura que solo se obtiene un miembro

      if (membersError) {
        console.error("Error al obtener los miembros del chat:", membersError);
        throw new Error(membersError.message || "Error al obtener los miembros del chat");
      }

      if (!members) {
        console.log(`El usuario no es miembro del chat con ID: ${chatId}`);
        throw new Error("El chat no existe o el usuario no es miembro.");
      }

      return chat; // Devuelve directamente el chat encontrado
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
  
      // Buscar un chat donde ambos usuarios sean miembros
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
  
      // Extraer los chat_id de los que user1 es parte
      const chatIds = chatMembers.map((member: any) => member.chat_id);
  
      // Verificar si user2 también está en alguno de esos chats
      const { data: commonChat, error: commonChatError } = await supabase
        .from("chat_members")
        .select("chat_id")
        .in("chat_id", chatIds)
        .eq("user_id", user2Id)
        .maybeSingle(); // Solo queremos un chat en común
  
      if (commonChatError) {
        console.error("Error al buscar el chat común:", commonChatError);
        throw new Error(commonChatError.message || "Error al buscar el chat común");
      }
  
      if (!commonChat) {
        console.log("No existe un chat entre estos usuarios.");
        return null;
      }
  
      // Obtener los detalles del chat encontrado
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
  
  // Obtener los mensajes de un chat
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

      return data; // Retorna los mensajes
    } catch (error: any) {
      console.error("Error al obtener los mensajes:", error);
      throw new Error(error.message || "Error al obtener los mensajes");
    }
  }

  async uploadFile(file: File, userId: string): Promise<string> {
    const fileName = `${userId}-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("uploads").upload(fileName, file);
  
    if (error) {
      throw new Error("Error al subir el archivo: " + error.message);
    }
  
    const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(fileName);
    return urlData.publicUrl;
  }
  
  // Enviar un mensaje en un chat
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
          read: false
        }
      ])
      .select(); // Asegura que devuelve los datos insertados

    if (error) {
      console.error("Error al enviar el mensaje:", error);
      throw new Error(error.message || "Error al enviar el mensaje");
    }

    if (!data || data.length === 0) {
      throw new Error("No se pudo enviar el mensaje.");
    }

    return data[0]; // Retorna el mensaje enviado
  } catch (error: any) {
    console.error("Error al enviar el mensaje:", error);
    throw new Error(error.message || "Error al enviar el mensaje");
  }
}


  // Crear un nuevo chat
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
      return data[0]; // Retorna el chat creado
    } catch (error: any) {
      console.error("Error al crear el chat:", error);
      throw new Error(error.message || "Error al crear el chat");
    }
  }

  // Añadir un miembro a un chat
  async addMember(chatId: string, userId: string) {
    try {
      const { data, error } = await supabase
        .from("chat_members")
        .insert([{ chat_id: chatId, user_id: userId }]);

      if (error) {
        console.error("Error al agregar miembro:", error);
        throw new Error(error.message || "Error al agregar miembro");
      }

      return data; // Retorna los miembros actualizados
    } catch (error: any) {
      console.error("Error al agregar miembro:", error);
      throw new Error(error.message || "Error al agregar miembro");
    }
  }

  // Eliminar un miembro de un chat
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

      return data; // Retorna los miembros actualizados
    } catch (error: any) {
      console.error("Error al eliminar miembro:", error);
      throw new Error(error.message || "Error al eliminar miembro");
    }
  }

  // Obtener los miembros de un chat
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

      return data; // Retorna los miembros del chat
    } catch (error: any) {
      console.error("Error al obtener los miembros:", error);
      throw new Error(error.message || "Error al obtener los miembros");
    }
  }
}

export default new ChatService();
