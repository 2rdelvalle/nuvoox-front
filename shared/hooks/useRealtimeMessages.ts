import { useEffect, useState } from "react"
import { io } from "socket.io-client"

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
    conversationId?: number; // Agregar conversationId como opcional
}

const useRealtimeMessages = (socketUrl: string) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [socket, setSocket] = useState<any>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!socketUrl) return;

    // Configuración mejorada para el socket
    const socketOptions = {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling']
    };

    const newSocket = io(socketUrl, socketOptions);

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

    // Evento de mensaje que usa el backend
    newSocket.on('message', (data: any) => {
      console.log('📥 [Realtime] Mensaje de WhatsApp recibido:', {
        id: data.id,
        from: data.from,
        text: data.text?.body,
        timestamp: data.timestamp,
        owner: data.from ? 'CUSTOMER' : 'AGENT'
      });

      // Transformar el mensaje del formato del webhook a nuestro formato
      const message: Message = {
        from: data.from,
        text: data.text?.body || '',
        content: data.text?.body || '',
        timestamp: data.timestamp,
        sentAt: parseInt(data.timestamp) * 1000,
        owner: data.from ? 'CUSTOMER' : 'AGENT',
        idWhatsapp: data.id,
        conversationId: Number(data.from) // Usar el número de teléfono como ID de conversación
      };

      // Solo agregar si es un mensaje del cliente
      if (message.owner === 'CUSTOMER') {
        console.log('✅ [Realtime] Mensaje del cliente transformado:', {
          id: message.idWhatsapp,
          from: message.from,
          text: message.text,
          timestamp: message.timestamp,
          sentAt: message.sentAt
        });
        setMessages((prev) => [...prev, message]);
      }
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.off('connect');
        newSocket.off('connect_error');
        newSocket.off('disconnect');
        newSocket.off('whatsapp:message');
        newSocket.disconnect();
      }
    };
  }, [socketUrl]);

  // Limpiar los mensajes
  const clearMessages = () => setMessages([]);

  return { messages, clearMessages, isConnected }
}

export default useRealtimeMessages
