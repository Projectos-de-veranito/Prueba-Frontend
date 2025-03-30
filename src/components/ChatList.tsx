import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../utils/supabaseClient";
import { User } from "../types/User.entity";
import { Contact } from "../types/Contact.entity";
import MessageNotification from "./layout/MessageNotification";

interface ChatListProps {
    onSelectContact: (contact: { id: string; username: string; avatar_url: string; chatId?: string }) => void;
}

const ChatList = ({ onSelectContact }: ChatListProps) => {
    const { user } = useAuth();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [contactsWithChats, setContactsWithChats] = useState<{
        [contactId: string]: { chatId: string; lastMessage?: { content: string; created_at: string } }
    }>({});
    const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

    useEffect(() => {
        const fetchContacts = async () => {
            if (!user) return;

            console.log("Obteniendo contactos para usuario:", user.id);

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

            console.log("Contactos obtenidos:", data);

            const formattedContacts: Contact[] = data.map((contact) => {
                const isUserOwner = contact.user_id === user.id;
                const contactUser: User | undefined = isUserOwner
                    ? (Array.isArray(contact.contact) ? contact.contact[0] : contact.contact)
                    : (Array.isArray(contact.user) ? contact.user[0] : contact.user);

                return {
                    id: contact.id,
                    user_id: contact.user_id,
                    contact_id: contact.contact_id,
                    status: contact.status,
                    users: contactUser
                };
            });

            console.log("Contactos formateados:", formattedContacts);
            setContacts(formattedContacts);

            await getMessagesDirectly(formattedContacts);
        };

        const getMessagesDirectly = async (contacts: Contact[]) => {
            if (!user || contacts.length === 0) return;

            try {
                const { data: userChatMemberships, error: chatMemberError } = await supabase
                    .from('chat_members')
                    .select('chat_id')
                    .eq('user_id', user.id);

                if (chatMemberError) throw chatMemberError;
                console.log("Chat memberships:", userChatMemberships);

                if (!userChatMemberships || userChatMemberships.length === 0) {
                    console.log("No se encontraron chats para el usuario");
                    return;
                }

                const chatIds = userChatMemberships.map(m => m.chat_id);

                const { data: chats, error: chatsError } = await supabase
                    .from('chats')
                    .select('id, is_group')
                    .in('id', chatIds);

                if (chatsError) throw chatsError;
                console.log("Chats obtenidos:", chats);

                const directChats = chats.filter(chat => !chat.is_group);
                console.log("Chats directos:", directChats);

                if (directChats.length === 0) {
                    console.log("No hay chats directos");
                    return;
                }

                const directChatIds = directChats.map(chat => chat.id);

                const contactChatsMap: {
                    [contactId: string]: { chatId: string; lastMessage?: { content: string; created_at: string } }
                } = {};

                for (const chatId of directChatIds) {
                    const { data: chatMembers, error: membersError } = await supabase
                        .from('chat_members')
                        .select('user_id')
                        .eq('chat_id', chatId)
                        .neq('user_id', user.id);

                    if (membersError) {
                        console.error(`Error al obtener miembros para chat ${chatId}:`, membersError);
                        continue;
                    }

                    if (!chatMembers || chatMembers.length === 0) continue;

                    const otherUserId = chatMembers[0].user_id;
                    console.log(`Chat ${chatId} con usuario ${otherUserId}`);

                    const relatedContact = contacts.find(contact =>
                        contact.users && contact.users.id === otherUserId
                    );

                    if (!relatedContact || !relatedContact.users) continue;

                    const { data: messages, error: messagesError } = await supabase
                        .from('messages')
                        .select('content, created_at')
                        .eq('chat_id', chatId)
                        .order('created_at', { ascending: false })
                        .limit(1);

                    if (messagesError) {
                        console.error(`Error al obtener mensajes para chat ${chatId}:`, messagesError);
                        continue;
                    }

                    console.log(`Último mensaje para chat ${chatId}:`, messages);

                    contactChatsMap[relatedContact.users.id] = {
                        chatId: chatId,
                        lastMessage: messages && messages.length > 0
                            ? { content: messages[0].content, created_at: messages[0].created_at }
                            : undefined
                    };
                }

                console.log("Mapa final de contactos con chats:", contactChatsMap);
                setContactsWithChats(contactChatsMap);

            } catch (error) {
                console.error("Error en getMessagesDirectly:", error);
            }
        };

        fetchContacts();

        const messagesSubscription = supabase
            .channel('public:messages')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                payload => {
                    console.log("Nuevo mensaje recibido:", payload);
                    const message = payload.new;
                    
                    if (message.sender_id === user?.id) {
                        console.log("Mensaje enviado por el usuario actual, no se muestra notificación");
                        return;
                    }

                    if (message.chat_id) {
                        supabase
                            .from("chat_members")
                            .select("user_id")
                            .eq("chat_id", message.chat_id)
                            .neq("user_id", user?.id || "")
                            .then(({ data: members, error }) => {
                                if (error) {
                                    console.error("Error al obtener miembros del chat:", error);
                                    return;
                                }

                                console.log("Miembros del chat para el nuevo mensaje:", members);

                                if (members && members.length > 0) {
                                    const otherUserId = members[0].user_id;

                                    setContactsWithChats(prev => {
                                        console.log("Actualizando estado con nuevo mensaje:", {
                                            otherUserId,
                                            content: message.content,
                                            created_at: message.created_at
                                        });

                                        return {
                                            ...prev,
                                            [otherUserId]: {
                                                chatId: message.chat_id,
                                                lastMessage: {
                                                    content: message.content,
                                                    created_at: message.created_at
                                                }
                                            }
                                        };
                                    });
                                    const contact = contacts.find(contact => contact.users?.id === otherUserId);
                                    const username = contact?.users?.username?.trim() || "Desconocido";
                                    const messageContent = message.content || "Te ha enviado un archivo";

                                    setNotificationMessage(`Nuevo mensaje de ${username}: ${messageContent}`);
                                }
                            });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(messagesSubscription);
        };
    }, [user]);

    const handleSelectContact = (contact: User) => {
        if (!user || !contact.id) return;

        const chatInfo = contactsWithChats[contact.id];
        if (chatInfo && chatInfo.chatId) {
            onSelectContact({
                id: contact.id,
                username: contact.username,
                avatar_url: contact.avatar_url || "/default-avatar.png",
                chatId: chatInfo.chatId,
            });
        } else {
            console.warn("No hay chat existente con este contacto.");
        }
    };

    const formatMessageTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="w-full h-screen md:w-72 lg:w-80 text-white p-2 sm:p-4 flex flex-col" style={{ backgroundColor: "#14201e" }}>
            <h2 className="text-lg font-semibold border-b border-gray-700 pb-2 px-2 mb-2">Chats</h2>
    
            <div className="flex-grow overflow-y-auto">
                <ul>
                    {contacts.length > 0 ? (
                        contacts.map((contact) => {
                            const contactUser = contact.users;
                            if (!contactUser) return null;
    
                            const chatInfo = contactsWithChats[contactUser.id];
                            const lastMessage = chatInfo?.lastMessage;
    
                            let previewMessage = "No hay mensajes aún";


                            if (lastMessage) {
                                const content = lastMessage.content || "";
                                const isUrl = (content: string) => {
                                    return /^https?:\/\//.test(content) || 
                                           content.includes('supabase.co/storage') ||
                                           content.includes('data:image') ||  // For base64 encoded images
                                           /\.(jpg|jpeg|png|gif|svg|pdf|doc|docx|xls|xlsx)$/i.test(content);
                                }
                                
                                if (content.trim() === "") {
                                    previewMessage = "📎 Archivo adjunto";
                                } else if (!isUrl(content)) {
                                    previewMessage = content.length > 15 ? `${content.substring(0, 15)}...` : content;
                                } else {
                                    previewMessage = "📎 Archivo adjunto";
                                }
                            }
                            
                            return (
                                <li
                                    key={contact.id}
                                    onClick={() => handleSelectContact(contactUser)}
                                    className="p-3 border-b border-gray-700 cursor-pointer hover:bg-[#122e29] transition flex items-center gap-3"
                                >
                                    <img
                                        src={contactUser.avatar_url || "/default-avatar.png"}
                                        alt={contactUser.username || "Avatar"}
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                    <div className="flex-1 flex justify-between items-center">
                                        <div className="flex-1">
                                            <span className="text-base truncate">{contactUser.username}</span>
                                            <p className="text-xs text-gray-400 truncate">{previewMessage}</p>
                                        </div>
                                        {lastMessage && (
                                            <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                                {formatMessageTime(lastMessage.created_at)}
                                            </span>
                                        )}
                                    </div>
                                </li>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <p className="text-gray-400 text-sm">No hay contactos de FlowChat</p>
                            <p className="text-gray-500 text-xs mt-1">Agrega usuarios para comenzar</p>
                        </div>
                    )}
                </ul>
            </div>
            {notificationMessage && (
                <MessageNotification
                    message={notificationMessage}
                    onClose={() => setNotificationMessage(null)}
                />
            )}
        </div>
    );
};

export default ChatList;
