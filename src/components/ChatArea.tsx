import ChatBox from "./chat/ChatBox";

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
  if (!contactId) {
    return (
      <div className="flex-grow bg-[#232f35] text-white flex items-center justify-center">
        <p className="text-gray-400 text-3xl text-center">
          Selecciona un chat para empezar <br /> a conversar 🚀
        </p>
      </div>
    );
  }

  return (
    <div className="flex-grow bg-[#141f1d] text-white p-4 flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <img
          src={contactAvatar || "/default-avatar.png"}
          alt={contactName}
          className="w-8 h-8 rounded-full object-cover"
        />
        <h2 className="text-lg font-semibold">{contactName}</h2>
      </div>

      <ChatBox senderId={senderId} receiverId={contactId} />
    </div>
  );
}
