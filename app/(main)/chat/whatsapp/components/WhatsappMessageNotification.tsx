'use client';

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

// Estilos para la mini ventana de chat
const chatWindowStyle = {
  position: 'fixed' as const,
  bottom: '20px',
  right: '20px',
  width: '320px',
  backgroundColor: '#fff',
  border: '1px solid #d4d4d4',
  borderRadius: '8px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
  zIndex: 9999,
  overflow: 'hidden',
  animation: 'slideIn 0.3s ease-out forwards',
};

const chatHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  backgroundColor: '#0f8bfd',
  color: 'white',
};

const chatBodyStyle = {
  padding: '12px',
  maxHeight: '250px',
  overflowY: 'auto' as const,
};

const messageStyle = {
  padding: '8px 12px',
  borderRadius: '14px',
  marginBottom: '8px',
  maxWidth: '80%',
  position: 'relative' as const,
  minWidth: '140px', // Ancho mínimo aumentado para garantizar espacio para el texto y la hora
  paddingRight: '75px', // Espacio a la derecha para la hora y los checks
  boxSizing: 'border-box' as const,
  whiteSpace: 'normal' as const, // Permitir saltos de línea normales en el texto
};

const messageContentStyle = {
  wordWrap: 'break-word' as const,
  width: '100%',
};

// Estilos separados para el contenedor y los elementos individuales
const messageMetaContainerStyle = {
  position: 'absolute' as const,
  bottom: '50%', // Centrado verticalmente
  right: '10px', // Posicionado a la derecha del contenido
  transform: 'translateY(50%)', // Ajuste para centrado perfecto
  display: 'flex', // Flexbox para alineación horizontal
  alignItems: 'center', // Centrado vertical de elementos
  justifyContent: 'flex-end', // Alineación a la derecha
  height: '16px', // Altura fija
  fontSize: '11px',
  color: 'rgba(0, 0, 0, 0.45)',
  whiteSpace: 'nowrap' as const, // Forzar que no haya saltos de línea
  zIndex: 2, // Asegurar que esté por encima del contenido
};

const timeStyle = {
  display: 'inline', // Forzar inline para mostrar elementos uno al lado del otro
  marginRight: '4px',
  whiteSpace: 'nowrap' as const,
};

const checkStyle = {
  display: 'inline',
  color: '#55AA55',
  whiteSpace: 'nowrap' as const,
};

const clientMessageStyle = {
  ...messageStyle,
  backgroundColor: '#e5f5ff',
  marginLeft: 'auto',
};

const phoneStyle = {
  fontWeight: 'bold' as const,
  fontSize: '14px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const closeButtonStyle = {
  background: 'none',
  border: 'none',
  color: 'white',
  fontSize: '16px',
  cursor: 'pointer',
};

// Componente principal
export function WhatsappMessageNotification() {
  const [notification, setNotification] = useState<Message | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Intentar conectarse a diferentes sockets para mayor robustez
    const socketUrls = [
      `${process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4001'}/local`,
      `${process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4001'}`,
      'http://localhost:4001/local',
      'http://localhost:4001'
    ];
    
    const sockets = socketUrls.map(url => {
      try {
        console.log(`Intentando conectar a socket: ${url}`);
        return io(url, { 
          reconnectionAttempts: 3,
          timeout: 5000
        });
      } catch (error) {
        console.error(`Error al conectar a ${url}:`, error);
        return null;
      }
    }).filter(Boolean); // Eliminar conexiones fallidas
    
    // Manejar mensajes entrantes en todos los sockets
    sockets.forEach((socket, index) => {
      if (!socket) return;
      
      // Almacenar las URLs que intentamos para referencia
      const socketUrl = socketUrls[index] || 'desconocido';
      
      socket.on('connect', () => {
        console.log(`Conectado a socket de notificación: ${socketUrl} (ID: ${socket.id})`);
      });
      
      socket.on('message', (message: Message) => {
        // Solo mostrar mensajes de clientes
        if (message.owner === 'CLIENT' || message.owner === 'CUSTOMER') {
          console.log('Notificación: Nuevo mensaje recibido', message);
          
          // Mostrar notificación
          setNotification(message);
          setVisible(true);
          
          // Ocultar la notificación después de 8 segundos
          setTimeout(() => {
            setVisible(false);
          }, 8000); // 8 segundos
        }
      });
    });
    
    // Limpiar al desmontar
    return () => {
      sockets.forEach(socket => socket && socket.disconnect());
    };
  }, []);
  
  // Formatear hora
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  };
  
  // Cerrar la notificación
  const handleClose = () => {
    setVisible(false);
  };
  
  // No mostrar si no hay notificación o no es visible
  if (!notification || !visible) {
    return null;
  }
  
  return (
    <div style={chatWindowStyle}>
      <div style={chatHeaderStyle}>
        <div style={phoneStyle}>
          <span>Mensaje de {notification.from}</span>
        </div>
        <button style={closeButtonStyle} onClick={handleClose}>✕</button>
      </div>
      <div style={chatBodyStyle}>
        <div style={clientMessageStyle}>
          <div style={{ position: 'relative', width: '100%' }}>
            <div style={messageContentStyle}>
              {notification.content}
            </div>
            <div style={messageMetaContainerStyle}>
              <span style={timeStyle}>{formatTime(notification.sentAt)}</span>
              <span style={checkStyle}>✔✔</span>
            </div>
          </div>
        </div>
      </div>
      <style jsx global>{`
        @keyframes slideIn {
          0% {
            transform: translateY(20px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export default WhatsappMessageNotification;
