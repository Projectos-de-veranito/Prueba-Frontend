import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../utils/supabaseClient";
import { User } from "../types/User.entity";
import { Contact } from "../types/Contact.entity";
import { MessageCircle } from "lucide-react";

interface ContactListProps {
    onSelectContact: (contact: { id: string; username: string; avatar_url: string }) => void;
}

const ContactList = ({ onSelectContact }: ContactListProps) => {
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

    // Función para crear el chat y añadir los miembros
    const handleMessageClick = async (contact: User) => {
        if (!user) return;

        // Verificar si ya existe un chat entre el usuario actual y el contacto
        const { data: userChats, error: userChatsError } = await supabase
            .from("chat_members")
            .select("chat_id")
            .eq("user_id", user.id);

        if (userChatsError) {
            console.error("Error al obtener chats del usuario:", userChatsError);
            return;
        }

        const userChatIds = userChats.map((item) => item.chat_id);

        const { data: contactChats, error: contactChatsError } = await supabase
            .from("chat_members")
            .select("chat_id")
            .eq("user_id", contact.id);

        if (contactChatsError) {
            console.error("Error al obtener chats del contacto:", contactChatsError);
            return;
        }

        // Buscar el chat común entre el usuario y el contacto
        const commonChat = userChatIds.find((chatId) => contactChats.some((item) => item.chat_id === chatId));

        if (commonChat) {
            // Si ya existe un chat, solo seleccionamos el contacto
            onSelectContact({
                id: contact.id,
                username: contact.username,
                avatar_url: contact.avatar_url || "/default-avatar.png",
            });
            return; // No crear un nuevo chat
        }

        // Si no existe el chat, crear uno nuevo
        const { data: chatData, error: chatError } = await supabase
            .from("chats")
            .insert([{ name: `Chat entre ${user.username} y ${contact.username}`, created_at: new Date() }])
            .select("id")
            .single(); // Asegura que se obtenga solo un chat creado

        if (chatError) {
            console.error("Error al crear el chat:", chatError);
            return;
        }

        if (!chatData) {
            console.error("No se pudo crear el chat");
            return;
        }

        const chatId = chatData.id;

        // Agregar los miembros (el usuario actual y el contacto) en la tabla 'chat_members'
        const { error: membersError } = await supabase
            .from("chat_members")
            .insert([
                { chat_id: chatId, user_id: user.id },
                { chat_id: chatId, user_id: contact.id }
            ]);

        if (membersError) {
            console.error("Error al agregar miembros al chat:", membersError);
            return;
        }

        // Si todo fue exitoso, se pasa el chat al componente padre o se puede manejar de otra manera
        onSelectContact({
            id: contact.id,
            username: contact.username,
            avatar_url: contact.avatar_url || "/default-avatar.png"
        });

        console.log("Chat creado y miembros agregados:", chatData);
    };

    return (
        <div className="w-1/4 text-white p-4 flex flex-col h-full" style={{ backgroundColor: "#14201e" }}>
            <h2 className="text-lg font-semibold border-b border-gray-700 pb-2">Contactos</h2>
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
                                className="p-2 border-b border-gray-700 cursor-pointer hover:bg-[#122e29] transition flex items-center gap-3"
                            >
                                <img
                                    src={user.avatar_url || "/default-avatar.png"}
                                    alt={user.username || "Avatar"}
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                                <span>{user.username}</span>
                                <button
                                    className="ml-auto p-2 rounded-full bg-[#122e29] hover:bg-[#16544c] transition"
                                    aria-label="Enviar mensaje"
                                    onClick={() => handleMessageClick(user)}
                                >
                                    <MessageCircle size={20} color="white" />
                                </button>
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

export default ContactList;
