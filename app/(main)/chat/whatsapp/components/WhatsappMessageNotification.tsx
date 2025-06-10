'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useChatStore } from '../store/chat-store';

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
  // Estados para mensajes y visibilidad
  const [notification, setNotification] = useState<Message | null>(null);
  const [visible, setVisible] = useState(false);
  
  // Acceder al store para obtener funciones y datos de las conversaciones
  const { incrementUnreadCount, conversations, activeConversation } = useChatStore();
  
  // Estado para mantener una referencia al socket
  const [socketRef, setSocketRef] = useState<Socket | null>(null);

  useEffect(() => {
    // Depurar información de las conversaciones actuales
    console.log('Estado inicial de conversaciones:', conversations);
    
    // Determinar la URL base del socket según el entorno
    let socketBaseUrl = '';
    
    // Verificar si estamos en un entorno de producción (app.nuvoox.com)
    const isProd = typeof window !== 'undefined' && 
      (window.location.hostname === 'app.nuvoox.com' || 
       window.location.hostname === 'www.app.nuvoox.com');
    
    if (isProd) {
      // En producción, usar el dominio principal de la aplicación
      socketBaseUrl = 'https://app.nuvoox.com';
      console.log('✅ Entorno de producción detectado, usando:', socketBaseUrl);
    } else {
      // En desarrollo local, usar localhost
      socketBaseUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4001';
      console.log('🔧 Entorno de desarrollo detectado, usando:', socketBaseUrl);
    }
    
    // Asegurarse de que la URL base no termine con una barra
    if (socketBaseUrl.endsWith('/')) {
      socketBaseUrl = socketBaseUrl.slice(0, -1);
    }
    
    // Usar solo la conexión raíz que ya funciona correctamente
    const socketUrl = socketBaseUrl;
    
    console.log('Conectando al socket principal:', socketUrl);
    
    // Configuración mejorada para los sockets
    const socketOptions = {
      reconnectionAttempts: 5,
      timeout: 10000,
      reconnectionDelay: 1000,
      reconnection: true,
      transports: ['websocket', 'polling']
    };
    
    // Crear una única conexión de socket
    try {
      console.log(`Intentando conexión al socket: ${socketUrl}`);
      const newSocket = io(socketUrl, socketOptions);
      setSocketRef(newSocket);
      
      // Eventos de estado del socket
      newSocket.on('connect', () => {
        console.log(`✅ CONECTADO a socket de notificación: ${socketUrl} (ID: ${newSocket.id})`);
      });
      
      newSocket.on('connect_error', (error: Error) => {
        console.error(`❌ ERROR DE CONEXIÓN a socket ${socketUrl}:`, error);
      });
      
      newSocket.on('disconnect', (reason: string) => {
        console.log(`🔌 DESCONECTADO de socket ${socketUrl}:`, reason);
      });
      
      newSocket.on('reconnect', (attemptNumber: number) => {
        console.log(`🔄 RECONECTADO a socket ${socketUrl} (intento #${attemptNumber})`);
      });
      
      // Manejar eventos de mensajes
      newSocket.on('message', (message: Message) => {
        console.log(`📩 SOCKET ${socketUrl} recibió mensaje:`, message);
        
        // Solo procesar mensajes de clientes
        if (message.owner === 'CLIENT' || message.owner === 'CUSTOMER') {
          console.log('🔔 NOTIFICACIÓN: Nuevo mensaje de cliente recibido', message);
          
          // Obtener lista actualizada de conversaciones del store
          const currentConversations = useChatStore.getState().conversations;
          console.log('Conversaciones actuales:', currentConversations);
          
          // Buscar la conversación correspondiente al número de teléfono del remitente
          try {
            // Normalizar el número de teléfono para la comparación
            const fromNumber = message.from.replace(/\+/g, '').trim();
            console.log(`🔍 Buscando conversación para número: ${fromNumber}`);
            
            // Buscar conversación por número de teléfono
            const matchingConversation = currentConversations.find(c => {
              const conversationPhone = (c.phone || '').replace(/\+/g, '').trim();
              const destinationNumber = (c.destination_number || '').replace(/\+/g, '').trim();
              
              const isMatch = (
                conversationPhone.includes(fromNumber) || 
                fromNumber.includes(conversationPhone) ||
                destinationNumber.includes(fromNumber) ||
                fromNumber.includes(destinationNumber)
              );
              
              if (isMatch) {
                console.log(`✅ COINCIDENCIA ENCONTRADA: Conversación ID ${c.conversationid}`);
              }
              
              return isMatch;
            });
            
            // Obtener la conversación activa actual
            const currentActiveConversation = useChatStore.getState().activeConversation;
            console.log('Conversación activa actual:', currentActiveConversation);
            
            // Si encontramos la conversación, incrementar contador si no es la activa
            if (matchingConversation?.conversationid) {
              if (currentActiveConversation?.conversationid !== matchingConversation.conversationid) {
                console.log(`🔢 INCREMENTANDO contador para conversación ID: ${matchingConversation.conversationid}`);
                incrementUnreadCount(matchingConversation.conversationid);
                
                // Verificar que se incrementó correctamente
                setTimeout(() => {
                  const updatedConversations = useChatStore.getState().conversations;
                  const updatedConversation = updatedConversations.find(c => c.conversationid === matchingConversation.conversationid);
                  console.log(`Estado actualizado de la conversación:`, updatedConversation);
                }, 100);
              } else {
                console.log(`❗ NO se incrementa contador - Es la conversación activa`);
              }
            } else {
              console.log(`⚠️ No se encontró una conversación coincidente para el número ${fromNumber}`);
            }
          } catch (error) {
            console.error('❌ ERROR al procesar contador de mensajes no leídos:', error);
          }
          
          // Mostrar notificación
          setNotification(message);
          setVisible(true);
          
          // Ocultar la notificación después de 8 segundos
          setTimeout(() => {
            setVisible(false);
          }, 8000); // 8 segundos
        }
      });
    } catch (error: any) {
      console.error(`Error al conectar al socket ${socketUrl}:`, error?.message || error);
    }
    
    // Registrar eventos del sistema para depuración
    console.log('Componente WhatsappMessageNotification montado');
    window.addEventListener('online', () => console.log('🌐 Navegador ONLINE'));
    window.addEventListener('offline', () => console.log('❌ Navegador OFFLINE'));
    
    // Limpiar al desmontar
    return () => {
      console.log('Componente WhatsappMessageNotification desmontando, desconectando socket...');
      if (socketRef && socketRef.connected) {
        console.log(`Desconectando socket ID: ${socketRef.id}`);
        socketRef.disconnect();
      }
      
      window.removeEventListener('online', () => console.log('🌐 Navegador ONLINE'));
      window.removeEventListener('offline', () => console.log('❌ Navegador OFFLINE'));
      
      console.log('Limpieza completa');
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
