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

      console.log("Buscando chat con ID:", chatId); // Agregar log para verificar el chatId

      // Verificar si el chat existe en la tabla 'chats'
      const { data, error } = await supabase
        .from("chats")
        .select("*")
        .eq("id", chatId)
        .limit(1); // Asegurarse de obtener solo una fila

      if (error) {
        console.error("Error al obtener el chat:", error);
        throw new Error(error.message || "Error al obtener el chat");
      }

      if (!data || data.length === 0) {
        console.log(`No se encontró un chat con ID: ${chatId}`); // Agregar log para depuración
        throw new Error("El chat no existe.");
      }

      // Verificar si el usuario es miembro del chat
      const { data: membersData, error: membersError } = await supabase
        .from("chat_members")
        .select("user_id")
        .eq("chat_id", chatId)
        .eq("user_id", userId)
        .limit(1); // Asegurarse de obtener solo un miembro

      if (membersError) {
        console.error("Error al obtener los miembros del chat:", membersError);
        throw new Error(membersError.message || "Error al obtener los miembros del chat");
      }

      if (!membersData || membersData.length === 0) {
        console.log(`El usuario no es miembro del chat con ID: ${chatId}`);
        throw new Error("El chat no existe o el usuario no es miembro.");
      }

      // Si todo está bien, retornar el chat encontrado
      return data[0]; // Retorna el primer (y único) chat encontrado
    } catch (error: any) {
      console.error("Error al obtener el chat:", error);
      throw new Error(error.message || "Error al obtener el chat");
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

  // Enviar un mensaje en un chat
  async sendMessage(chatId: string, senderId: string, content: string, mediaUrl?: string) {
    try {
      if (!chatId || !senderId || !content.trim()) {
        throw new Error("Datos insuficientes para enviar el mensaje.");
      }

      const { data, error } = await supabase
        .from("messages")
        .insert([
          { sender_id: senderId, chat_id: chatId, content, media_url: mediaUrl }
        ]);

      if (error) {
        console.error("Error al enviar el mensaje:", error);
        throw new Error(error.message || "Error al enviar el mensaje");
      }

      if (!data) {
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
