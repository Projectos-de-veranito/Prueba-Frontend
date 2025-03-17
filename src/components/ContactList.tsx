import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../utils/supabaseClient";
import { User } from "../types/User.entity";
import { Contact } from "../types/Contact.entity";
import { MessageCircle, UserPlus, Search, UserX } from "lucide-react";

interface ContactListProps {
    onSelectContact: (contact: { id: string; username: string; avatar_url: string; chatId?: string }) => void;
}

const ContactList = ({ onSelectContact }: ContactListProps) => {
    const { user } = useAuth();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [showSearch, setShowSearch] = useState(false);

    useEffect(() => {
        const fetchContacts = async () => {
            if (!user) return;

            const { data, error } = await supabase
                .from("contacts")
                .select(`
                    id, user_id, contact_id, status,
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

                return {
                    id: contact.id,
                    user_id: contact.user_id,
                    contact_id: contact.contact_id,
                    status: contact.status,
                    users: userData,
                };
            });

            setContacts(formattedContacts);
        };

        fetchContacts();
    }, [user]);

    const handleSearch = async () => {
        if (!search.trim()) return;

        const { data, error } = await supabase
            .from("users")
            .select("id, username, email, avatar_url")
            .ilike("username", `%${search}%`)
            .neq("id", user?.id);

        if (error) {
            console.error("Error buscando usuarios:", error);
            return;
        }

        setSearchResults(data || []);
    };

    const handleCreateChat = async (contactId: string, username: string, avatar_url: string) => {
        if (!user) return;

        try {
            const { data: existingChat, error: chatFetchError } = await supabase
                .from("chats")
                .select("id")
                .eq("is_group", false)
                .filter("id", "in", `(${(
                    await supabase
                        .from("chat_members")
                        .select("chat_id")
                        .eq("user_id", user.id)
                ).data?.map((chat) => chat.chat_id) || []})`)
                .filter("id", "in", `(${(
                    await supabase
                        .from("chat_members")
                        .select("chat_id")
                        .eq("user_id", contactId)
                ).data?.map((chat) => chat.chat_id) || []})`)
                .maybeSingle();

            if (chatFetchError) throw chatFetchError;

            if (existingChat) {
                onSelectContact({ id: contactId, username, avatar_url, chatId: existingChat.id });
                return;
            }

            const { data: existingContact, error: contactFetchError } = await supabase
                .from("contacts")
                .select("id")
                .eq("user_id", user.id)
                .eq("contact_id", contactId)
                .maybeSingle();

            if (contactFetchError) throw contactFetchError;

            if (!existingContact) {
                const { data: newContact, error: contactInsertError } = await supabase
                    .from("contacts")
                    .insert([{ user_id: user.id, contact_id: contactId, status: "accepted" }])
                    .select();

                if (contactInsertError) throw contactInsertError;

                setContacts((prevContacts) => [
                    ...prevContacts,
                    {
                        id: newContact[0].id,
                        user_id: newContact[0].user_id,
                        contact_id: newContact[0].contact_id,
                        status: newContact[0].status,
                        users: {
                            id: newContact[0].contact_id,
                            username,
                            avatar_url,
                            email: "",
                        },
                    },
                ]);
            }

            const { data: newChat, error: chatError } = await supabase
                .from("chats")
                .insert([{ is_group: false }])
                .select("id")
                .single();

            if (chatError) throw chatError;

            const { error: membersError } = await supabase.from("chat_members").insert([
                { chat_id: newChat.id, user_id: user.id },
                { chat_id: newChat.id, user_id: contactId },
            ]);

            if (membersError) throw membersError;

            onSelectContact({ id: contactId, username, avatar_url, chatId: newChat.id });
        } catch (error) {
            console.error("Error creando el chat y agregando contacto:", error);
        }
    };
    return (
        <div className="w-full md:w-72 lg:w-80 text-white p-3 sm:p-4 flex flex-col min-h-screen md:min-h-0 md:h-full bg-[#14201e]">
            <h2 className="text-lg font-semibold border-b border-gray-700 pb-2 mb-3">Contactos</h2>

            {showSearch && (
                <div className="my-2 sm:my-4">
                    <div className="flex">
                        <input
                            type="text"
                            placeholder="Buscar usuarios..."
                            className="w-full p-2 rounded-l bg-[#1c2927] text-white border border-gray-700 focus:outline-none text-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <button
                            onClick={handleSearch}
                            className="px-3 bg-[#16544c] hover:bg-[#1b685f] transition rounded-r"
                        >
                            <Search className="w-5 h-5" color="white" />
                        </button>
                    </div>

                    {searchResults.length > 0 && (
                        <div className="bg-[#1c2927] p-3 rounded mt-3">
                            <h3 className="text-sm text-gray-400 mb-2">Usuarios encontrados:</h3>
                            <ul className="space-y-2">
                                {searchResults.map((user) => (
                                    <li
                                        key={user.id}
                                        className="p-2 flex items-center justify-between hover:bg-[#122e29] transition rounded"
                                    >
                                        <div className="flex items-center gap-2">
                                            <img
                                                src={user.avatar_url || 'https://i.ibb.co/hRCDCFgs/perfil.png'}
                                                alt={user.username}
                                                className="w-8 h-8 rounded-full object-cover"
                                            />
                                            <span className="text-sm truncate max-w-[150px]">{user.username}</span>
                                        </div>
                                        <button
                                            onClick={() => handleCreateChat(user.id, user.username, user.avatar_url)}
                                            className="p-2 bg-[#16544c] hover:bg-[#1b685f] transition rounded-full"
                                        >
                                            <UserPlus className="w-5 h-5" color="white" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            <div className="flex-grow overflow-y-auto mt-2">
                <h3 className="text-sm text-gray-400 mb-2 px-1">Mis contactos</h3>
                <ul>
                    {contacts.length > 0 ? (
                        contacts.map((contact) => {
                            const user = contact.users;
                            if (!user) return null;

                            return (
                                <li
                                    key={contact.id}
                                    className="p-3 border-b border-gray-700 cursor-pointer hover:bg-[#122e29] transition flex items-center gap-3"
                                >
                                    <img
                                        src={user.avatar_url || "/default-avatar.png"}
                                        alt={user.username || "Avatar"}
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                    <span className="text-base truncate">{user.username}</span>
                                    <button
                                        className="ml-auto p-2 rounded-full bg-[#122e29] hover:bg-[#16544c] transition"
                                        aria-label="Enviar mensaje"
                                        onClick={() => onSelectContact(user)}
                                    >
                                        <MessageCircle className="w-5 h-5" color="white" />
                                    </button>
                                </li>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <UserX className="w-12 h-12 text-gray-500 mb-3" />
                            <p className="text-gray-400 text-sm">No hay contactos en FlowChat</p>
                            <p className="text-gray-500 text-xs mt-1">Busca y agrega usuarios para comenzar</p>
                        </div>
                    )}
                </ul>
            </div>
            <div className="sticky bottom-0 pb-4">
                <button
                    onClick={() => setShowSearch(!showSearch)}
                    className="p-3 bg-[#16544c] hover:bg-[#1b685f] text-white rounded transition flex items-center justify-center text-sm w-full"
                >
                    <UserPlus className="w-5 h-5 mr-2" color="white" />
                    {showSearch ? "Cerrar búsqueda" : "Agregar usuarios"}
                </button>
            </div>
        </div>
    );
};

export default ContactList;