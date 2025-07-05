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

    const newSocket = io(socketUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    // Escucha mensajes entrantes
    newSocket.on("message", (message: Message) => {
      console.log('📥 [Realtime] Mensaje recibido:', message);
      
      // Verificar si es mensaje del cliente
      if (message.owner === 'CUSTOMER' || message.from) {
        console.log('✅ [Realtime] Mensaje del cliente detectado:', {
          from: message.from,
          text: message.text,
          idWhatsapp: message.idWhatsapp,
          timestamp: message.timestamp
        });
      }

      setMessages((prev) => [...prev, message]);
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.off('connect');
        newSocket.off('connect_error');
        newSocket.off('disconnect');
        newSocket.off('message');
        newSocket.disconnect();
      }
    };
  }, [socketUrl]);

  // Limpiar los mensajes
  const clearMessages = () => setMessages([]);

  return { messages, clearMessages, isConnected }
}

export default useRealtimeMessages
