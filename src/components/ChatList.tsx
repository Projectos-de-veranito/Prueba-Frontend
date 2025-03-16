import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../utils/supabaseClient";
import { User } from "../types/User.entity";
import { Contact } from "../types/Contact.entity";
import { UserPlus } from "lucide-react";

interface ChatListProps {
    onSelectContact: (contact: { id: string; username: string; avatar_url: string; chatId?: string }) => void;
}

const ChatList = ({ onSelectContact }: ChatListProps) => {
    const { user } = useAuth();
    const [contacts, setContacts] = useState<Contact[]>([]);

    useEffect(() => {
        const fetchContacts = async () => {
            if (!user) return;

            const { data, error } = await supabase
                .from("contacts")
                .select(`
          id, 
          user_id, 
          contact_id, 
          status,
          user:user_id(id, username, email, avatar_url),
          contact:contact_id(id, username, email, avatar_url)
        `)
                .or(`user_id.eq.${user.id},contact_id.eq.${user.id}`)
                .eq("status", "accepted");

            if (error) {
                console.error("Error obteniendo contactos:", error);
                return;
            }

            const formattedContacts: Contact[] = data.map((contact) => {
                const isUserOwner = contact.user_id === user.id;
                const userData: User | undefined = isUserOwner
                    ? (Array.isArray(contact.contact) ? contact.contact[0] : contact.contact)
                    : (Array.isArray(contact.user) ? contact.user[0] : contact.user);

                if (!userData) {
                    console.warn("Contacto sin información:", contact);
                }

                return {
                    id: contact.id,
                    user_id: contact.user_id,
                    contact_id: contact.contact_id,
                    status: contact.status,
                    users: userData
                };
            });

            setContacts(formattedContacts);
        };

        fetchContacts();
    }, [user]);

    // Función para seleccionar un contacto y abrir el chat existente
    const handleSelectContact = async (contact: User) => {
        if (!user) return;

        try {
            // Buscar si ya existe un chat entre los dos usuarios
            const { data: existingChats, error: existingChatsError } = await supabase
                .from("chat_members")
                .select("chat_id")
                .eq("user_id", user.id);

            if (existingChatsError) throw existingChatsError;

            const userChatIds = existingChats.map((chat) => chat.chat_id);

            const { data: contactChats, error: contactChatsError } = await supabase
                .from("chat_members")
                .select("chat_id")
                .eq("user_id", contact.id);

            if (contactChatsError) throw contactChatsError;

            const commonChat = userChatIds.find((chatId) =>
                contactChats.some((chat) => chat.chat_id === chatId)
            );

            if (commonChat) {
                // Si ya existe un chat, lo seleccionamos
                onSelectContact({
                    id: contact.id,
                    username: contact.username,
                    avatar_url: contact.avatar_url || "/default-avatar.png",
                    chatId: commonChat,
                });
            } else {
                console.warn("No hay chat existente con este contacto.");
            }
        } catch (error) {
            console.error("Error al seleccionar el chat:", error);
        }
    };

    return (
      <div className="w-full h-screen md:w-72 lg:w-80 text-white p-2 sm:p-4 flex flex-col" style={{ backgroundColor: "#14201e" }}>
        <h2 className="text-lg font-semibold border-b border-gray-700 pb-2 px-2 mb-2">Chats</h2>
        
        <div className="flex-grow overflow-y-auto">
          <ul>
            {contacts.length > 0 ? (
              contacts.map((contact) => {
                const user = contact.users;
                if (!user) {
                  console.warn("Contacto sin información:", contact);
                  return null;
                }
      
                return (
                  <li
                    key={contact.id}
                    onClick={() => handleSelectContact(user)}
                    className="p-3 border-b border-gray-700 cursor-pointer hover:bg-[#122e29] transition flex items-center gap-3"
                  >
                    <img
                      src={user.avatar_url || "/default-avatar.png"}
                      alt={user.username || "Avatar"}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <span className="text-base truncate">{user.username}</span>
                  </li>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <p className="text-gray-400 text-sm">No hay contactos de MessageApp</p>
                <p className="text-gray-500 text-xs mt-1">Agrega usuarios para comenzar</p>
              </div>
            )}
          </ul>
        </div>
        
        <button
          onClick={() => {/* función para agregar usuarios */}}
          className="mt-auto mb-2 p-3 bg-[#16544c] hover:bg-[#1b685f] text-white rounded transition flex items-center justify-center text-sm"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Agregar usuarios
        </button>
      </div>
    );
};

export default ChatList;
