import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface MessageNotificationProps {
  message: string;
  onClose: () => void;
  duration?: number; // en milisegundos
}

const MessageNotification: React.FC<MessageNotificationProps> = ({ 
  message, 
  onClose, 
  duration = 5000 
}) => {
  const [progress, setProgress] = useState(100);
  const updateInterval = 50; // actualizar cada 50ms para animación fluida
  
  useEffect(() => {
    // Configurar el temporizador principal para cerrar la notificación
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    
    // Configurar la animación de la barra de progreso
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev - (updateInterval / duration * 100);
        return newProgress > 0 ? newProgress : 0;
      });
    }, updateInterval);
    
    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [onClose, duration]);

  return (
    <div className="fixed top-4 right-4 max-w-xs w-80 bg-[#1f2928] rounded-lg shadow-lg z-50 overflow-hidden animate-slide-down">
      <div className="flex justify-between items-start p-3">
        <div className="flex-1 mr-2">
          <p className="text-white text-sm">{message}</p>
        </div>
        <button 
          onClick={onClose} 
          className="text-gray-300 hover:text-white p-1 rounded-full hover:bg-[#263130] transition-colors"
        >
          <X size={16} />
        </button>
      </div>
      
      {/* Barra de progreso */}
      <div className="h-1 w-full bg-[#0d1211]">
        <div 
          className="h-full bg-[#00af78] transition-all duration-50 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default MessageNotification;