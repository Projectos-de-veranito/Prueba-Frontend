import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../utils/supabaseClient";
import { User } from "../types/User.entity";
import { Contact } from "../types/Contact.entity";

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
        <div className="w-1/4 text-white p-4 flex flex-col h-full" style={{ backgroundColor: "#14201e" }}>
            <h2 className="text-lg font-semibold border-b border-gray-700 pb-2">Chats</h2>
            <ul className="flex-grow overflow-y-auto">
                {contacts.length > 0 ? (
                    contacts.map((contact) => {
                        const user = contact.users; // Aseguramos que user esté definido
                        if (!user) {
                            console.warn("Contacto sin información:", contact);
                            return null; // Si no hay información del usuario, no mostramos el contacto
                        }

                        return (
                            <li
                                key={contact.id}
                                onClick={() => handleSelectContact(user)}
                                className="p-2 border-b border-gray-700 cursor-pointer hover:bg-[#122e29] transition flex items-center gap-3"
                            >
                                <img
                                    src={user.avatar_url || "/default-avatar.png"}
                                    alt={user.username || "Avatar"}
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                                <span>{user.username}</span>
                               
                            </li>
                        );
                    })
                ) : (
                    <p className="text-gray-400 mt-4">No hay contactos de MessageApp</p>
                )}
            </ul>
        </div>
    );
};

export default ChatList;
