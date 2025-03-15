import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../utils/supabaseClient";
import { User } from "../types/User.entity";
import { Contact } from "../types/Contact.entity";
import { MessageCircle, UserPlus, Search } from "lucide-react";

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
            // Verificar si ya existe un chat entre estos dos usuarios
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
    
            // Verificar si el contacto ya existe
            const { data: existingContact, error: contactFetchError } = await supabase
                .from("contacts")
                .select("id")
                .eq("user_id", user.id)
                .eq("contact_id", contactId)
                .maybeSingle();
    
            if (contactFetchError) throw contactFetchError;
    
            let newContactId = existingContact?.id || null;
    
            // Si el contacto no existe, agregar solo el registro del usuario actual
            if (!existingContact) {
                const { data: newContact, error: contactInsertError } = await supabase
                    .from("contacts")
                    .insert([{ user_id: user.id, contact_id: contactId, status: "accepted" }])
                    .select(); // Selecciona todos los campos
    
                if (contactInsertError) throw contactInsertError;
    
                newContactId = newContact[0]?.id;
    
                // Solo agregamos al estado la relación desde el usuario actual
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
    
            // Crear un nuevo chat si no existía
            const { data: newChat, error: chatError } = await supabase
                .from("chats")
                .insert([{ is_group: false }])
                .select("id")
                .single();
    
            if (chatError) throw chatError;
    
            // Agregar ambos usuarios a chat_members
            const { error: membersError } = await supabase.from("chat_members").insert([
                { chat_id: newChat.id, user_id: user.id },
                { chat_id: newChat.id, user_id: contactId },
            ]);
    
            if (membersError) throw membersError;
    
            // Seleccionar el nuevo chat
            onSelectContact({ id: contactId, username, avatar_url, chatId: newChat.id });
        } catch (error) {
            console.error("Error creando el chat y agregando contacto:", error);
        }
    };
    
    
    

    return (
        <div className="w-1/4 text-white p-4 flex flex-col h-full bg-[#14201e]">
            <h2 className="text-lg font-semibold border-b border-gray-700 pb-2">Contactos</h2>

            {showSearch && (
                <div className="mt-2 mb-4">
                    <div className="flex">
                        <input
                            type="text"
                            placeholder="Buscar usuarios..."
                            className="w-full p-2 rounded-l bg-[#1c2927] text-white border border-gray-700 focus:outline-none"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <button
                            onClick={handleSearch}
                            className="px-3 bg-[#16544c] hover:bg-[#1b685f] transition rounded-r"
                        >
                            <Search size={18} color="white" />
                        </button>
                    </div>

                    {searchResults.length > 0 && (
                        <div className="bg-[#1c2927] p-2 rounded mt-2">
                            <h3 className="text-sm text-gray-400">Usuarios encontrados:</h3>
                            <ul>
                                {searchResults.map((user) => (
                                    <li
                                        key={user.id}
                                        className="p-2 flex items-center justify-between hover:bg-[#122e29] transition rounded"
                                    >
                                        <div className="flex items-center gap-2">
                                            <img
                                                src={user.avatar_url || "/default-avatar.png"}
                                                alt={user.username}
                                                className="w-8 h-8 rounded-full object-cover"
                                            />
                                            <span>{user.username}</span>
                                        </div>
                                        <button
                                            onClick={() => handleCreateChat(user.id, user.username, user.avatar_url)}
                                            className="p-2 bg-[#16544c] hover:bg-[#1b685f] transition rounded-full"
                                        >
                                            <UserPlus size={18} color="white" />
                                        </button>

                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            <ul className="flex-grow overflow-y-auto">
                {contacts.length > 0 ? (
                    contacts.map((contact) => {
                        const user = contact.users;
                        if (!user) return null;

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
                                    onClick={() => onSelectContact(user)}
                                >
                                    <MessageCircle size={20} color="white" />
                                </button>
                            </li>
                        );
                    })
                ) : (
                    <p className="text-gray-400 mt-4">No hay contactos en MessageApp</p>
                )}
            </ul>

            <button
                onClick={() => setShowSearch(!showSearch)}
                className="mt-4 p-2 bg-[#16544c] hover:bg-[#1b685f] text-white rounded transition flex items-center justify-center"
            >
                <UserPlus size={20} className="mr-2" />
                {showSearch ? "Cerrar búsqueda" : "Agregar usuarios"}
            </button>
        </div>
    );
};

export default ContactList;