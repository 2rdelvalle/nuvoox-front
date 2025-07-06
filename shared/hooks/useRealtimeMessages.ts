import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

// Define el tipo de mensaje con todas las propiedades necesarias
interface Message {
  from: string;
  text: string;
  timestamp: string;
  // Propiedades adicionales que se usan en la aplicación
  idWhatsapp?: string;
  content?: string; 
  sentAt?: number;
  owner?: string;
  type?: string;
  numberDestination?: string;
  received?: boolean;
  conversationId?: string | number; // Actualizado para soportar string y number
}

const useRealtimeMessages = (socketUrl: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Función para limpiar mensajes
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  useEffect(() => {
    if (!socketUrl) {
      console.error('❌ [Realtime] No se proporcionó una URL de socket');
      return;
    }

    console.log(`🔌 [Realtime] Conectando a ${socketUrl}...`);

    // Configuración mejorada para el socket
    const socketOptions: any = {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling']
    };

    try {
      const newSocket = io(socketUrl, socketOptions);

      // Manejar eventos de conexión
      newSocket.on('connect', () => {
        console.log('✅ [Realtime] CONECTADO al socket:', socketUrl);
        setIsConnected(true);
      });

      newSocket.on('connect_error', (error) => {
        console.error('❌ [Realtime] ERROR DE CONEXIÓN:', error);
        setIsConnected(false);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('🔌 [Realtime] DESCONECTADO:', reason);
        setIsConnected(false);
      });

      // Función para manejar mensajes entrantes
      const handleIncomingMessage = (data: any) => {
        console.log('📥 [Realtime] Evento recibido:', data);
        
        // Verificar si es un mensaje de WhatsApp
        if (data.entry) {
          const message = data.entry[0]?.changes[0]?.value?.messages?.[0];
          if (!message) {
            console.log('❌ [Realtime] No se pudo extraer el mensaje del payload');
            return;
          }
          
          console.log('📩 [Realtime] Mensaje de WhatsApp recibido:', {
            id: message.id,
            from: message.from,
            text: message.text?.body,
            timestamp: message.timestamp,
            owner: 'CUSTOMER'
          });

          // Transformar el mensaje del formato del webhook a nuestro formato
          const transformedMessage: Message = {
            from: message.from,
            text: message.text?.body || '',
            content: message.text?.body || '',
            timestamp: message.timestamp,
            sentAt: parseInt(message.timestamp) * 1000,
            owner: 'CUSTOMER',
            idWhatsapp: message.id,
            conversationId: message.from,
            type: message.type || 'text'
          };

          console.log('✅ [Realtime] Mensaje transformado:', transformedMessage);
          setMessages(prev => [...prev, transformedMessage]);
        } else {
          // Si es un mensaje ya transformado del backend
          console.log('📩 [Realtime] Mensaje del backend recibido:', data);
          
          // Verificar si el mensaje tiene el formato esperado
          if (data.idWhatsapp && data.from) {
            const message: Message = {
              from: data.from,
              text: data.text || data.content || '',
              content: data.content || data.text || '',
              timestamp: data.timestamp || Date.now().toString(),
              sentAt: data.sentAt || (data.timestamp ? parseInt(data.timestamp) * 1000 : Date.now()),
              owner: data.owner || (data.from ? 'CUSTOMER' : 'AGENT'),
              idWhatsapp: data.idWhatsapp,
              conversationId: data.conversationId || data.from,
              type: data.type || 'text'
            };
            
            console.log('✅ [Realtime] Mensaje transformado (formato backend):', message);
            setMessages(prev => [...prev, message]);
          } else {
            console.log('⚠️ [Realtime] Formato de mensaje no reconocido:', data);
          }
        }
      };

      // Escuchar ambos eventos para asegurar compatibilidad
      newSocket.on('whatsapp:message', handleIncomingMessage);
      newSocket.on('message', handleIncomingMessage);

      // Guardar referencia al socket
      setSocket(newSocket);

      // Limpieza al desmontar
      return () => {
        console.log('🧹 [Realtime] Limpiando conexión del socket');
        if (newSocket) {
          newSocket.off('connect');
          newSocket.off('connect_error');
          newSocket.off('disconnect');
          newSocket.off('whatsapp:message');
          newSocket.off('message');
          newSocket.disconnect();
        }
      };
    } catch (error) {
      console.error('🚨 [Realtime] Error al inicializar el socket:', error);
    }
  }, [socketUrl]);

  return {
    messages,
    isConnected,
    clearMessages,
    socket
  };
};

export default useRealtimeMessages;
