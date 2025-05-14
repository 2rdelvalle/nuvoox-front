import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

// Definir la interfaz Message directamente para evitar problemas de importación
interface Message {
  content: string;       // Contenido del mensaje
  owner: string;         // Propietario del mensaje (CUSTOMER, AGENT, etc)
  sentAt: number;        // Marca de tiempo en milisegundos
  from: string;          // Número de teléfono del remitente
  idWhatsapp: string;    // ID único de WhatsApp para el mensaje
  numberDestination: string; // Número de destino (puede estar vacío)
}

// Estilos para el componente de notificación de mensajes
const notificationStyle = {
  position: 'fixed' as const,
  bottom: '20px',
  right: '20px',
  maxWidth: '300px',
  backgroundColor: '#fff',
  border: '1px solid #d4d4d4',
  borderLeft: '4px solid #0f8bfd',
  borderRadius: '4px',
  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  padding: '12px 16px',
  zIndex: 9999,
  animation: 'slideIn 0.3s ease-out forwards',
};

const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '8px',
};

const phoneStyle = {
  fontWeight: 'bold' as const,
  fontSize: '14px',
  color: '#333',
};

const timeStyle = {
  fontSize: '12px',
  color: '#777',
};

const contentStyle = {
  fontSize: '14px',
  color: '#333',
  wordBreak: 'break-word' as const,
};

// Componente principal
export default function WhatsappMessageNotification() {
  const [notification, setNotification] = useState<Message | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Conectar al mismo socket que usa el hook useRealtimeMessages
    const socket = io(`${process.env.NEXT_PUBLIC_SOCKET_URL}/local`);
    
    // Manejar mensajes entrantes
    socket.on('message', (message: Message) => {
      console.log('Notificación: Nuevo mensaje recibido', message);
      
      // Mostrar notificación
      setNotification(message);
      setVisible(true);
      
      // Ocultar después de 5 segundos
      setTimeout(() => {
        setVisible(false);
      }, 5000);
    });
    
    // Limpiar al desmontar
    return () => {
      socket.disconnect();
    };
  }, []);
  
  // Formatear hora
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  };
  
  // No mostrar si no hay notificación o no es visible
  if (!notification || !visible) {
    return null;
  }
  
  return (
    <div style={notificationStyle}>
      <div style={headerStyle}>
        <span style={phoneStyle}>
          {notification.from}
        </span>
        <span style={timeStyle}>
          {formatTime(notification.sentAt)}
        </span>
      </div>
      <div style={contentStyle}>
        {notification.content}
      </div>
      <style jsx global>{`
        @keyframes slideIn {
          0% {
            transform: translateX(100%);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
