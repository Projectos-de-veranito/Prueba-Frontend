import ChatBox from "./ChatBox";

interface ChatAreaProps {
  contactId?: string;
  contactName?: string;
  contactAvatar?: string;
  senderId: string;
}

export default function ChatArea({
  contactId,
  contactName,
  contactAvatar,
  senderId,

}: ChatAreaProps) {
  

  return (
    <div className="flex flex-col h-full bg-[#202c2d]">
      <div className="p-2 sm:p-4 bg-[#14211f] border-b border-gray-700 flex items-center">
        <img
          src={contactAvatar || "https://i.ibb.co/hRCDCFgs/perfil.png"}
          alt={contactName}
          className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full object-cover mr-3"
        />
        <h2 className="text-base sm:text-lg md:text-xl font-semibold truncate text-white">{contactName}</h2>
      </div>
      
      <div className="flex-1 overflow-hidden flex flex-col">
        <ChatBox senderId={senderId} receiverId={contactId || ''} />
      </div>
    </div>
  );
}
