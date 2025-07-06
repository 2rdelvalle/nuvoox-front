import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket, ManagerOptions, SocketOptions } from "socket.io-client";

interface Message {
  from: string;
  text: string;
  timestamp: string;
  idWhatsapp?: string;
  content?: string;
  sentAt?: number;
  owner?: string;
  type?: string;
  numberDestination?: string;
  received?: boolean;
  conversationId?: string | number;
}

interface UseRealtimeMessagesReturn {
  messages: Message[];
  isConnected: boolean;
  clearMessages: () => void;
}

const useRealtimeMessages = (socketUrl: string): UseRealtimeMessagesReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const isConnectingRef = useRef(false);

  // Función para limpiar mensajes
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Función para manejar mensajes entrantes
  const handleIncomingMessage = useCallback((data: any) => {
    let newMessage: Message | null = null;

    // Verificar si es un mensaje de WhatsApp
    if (data.entry) {
      const message = data.entry[0]?.changes[0]?.value?.messages?.[0];
      if (!message) return;
      
      // Crear ID único para el mensaje
      const messageId = message.id || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      newMessage = {
        from: message.from,
        text: message.text?.body || '',
        content: message.text?.body || '',
        timestamp: message.timestamp,
        sentAt: parseInt(message.timestamp) * 1000,
        owner: 'CUSTOMER',
        idWhatsapp: messageId,
        conversationId: message.from,
        type: message.type || 'text'
      };
    } else if (data && typeof data === 'object' && data.idWhatsapp) {
      // Si es un mensaje ya transformado del backend
      newMessage = {
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
    }

    if (newMessage) {
      setMessages(prev => {
        // Verificar si el mensaje ya existe
        const exists = prev.some(msg => 
          (msg.idWhatsapp && msg.idWhatsapp === newMessage?.idWhatsapp) ||
          (msg.from === newMessage?.from && 
           msg.sentAt === newMessage?.sentAt && 
           msg.content === newMessage?.content)
        );
        return exists ? prev : [...prev, newMessage as Message];
      });
    }
  }, []);

  useEffect(() => {
    if (!socketUrl || isConnectingRef.current) return;
    
    isConnectingRef.current = true;
    
    const socketOptions: Partial<ManagerOptions & SocketOptions> = {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket']
    };

    try {
      const socket = io(socketUrl, socketOptions);
      socketRef.current = socket;

      // Manejar eventos de conexión
      const onConnect = () => {
        setIsConnected(true);
        isConnectingRef.current = false;
      };

      const onConnectError = (error: Error) => {
        console.error('Error de conexión con el socket:', error);
        setIsConnected(false);
        isConnectingRef.current = false;
      };

      const onDisconnect = () => {
        setIsConnected(false);
      };

      // Configurar manejadores de eventos
      socket.on('connect', onConnect);
      socket.on('connect_error', onConnectError);
      socket.on('disconnect', onDisconnect);

      // Loguear cuando llega un mensaje al cliente desde el socket
      socket.on('whatsapp:message', (msg) => {
        console.log(" [Frontend] Mensaje recibido desde el socket:", msg);
        handleIncomingMessage(msg);
      });

      socket.on('message', (msg) => {
        console.log(" [Frontend] Mensaje recibido desde el socket:", msg);
        handleIncomingMessage(msg);
      });

      // Limpieza al desmontar
      return () => {
        socket.off('connect', onConnect);
        socket.off('connect_error', onConnectError);
        socket.off('disconnect', onDisconnect);
        socket.off('whatsapp:message', handleIncomingMessage);
        socket.off('message', handleIncomingMessage);
        
        if (socket.connected) {
          socket.disconnect();
        }
        
        socketRef.current = null;
        isConnectingRef.current = false;
      };
    } catch (error) {
      console.error('Error al inicializar el socket:', error);
      setIsConnected(false);
      isConnectingRef.current = false;
    }
  }, [socketUrl, handleIncomingMessage]);

  return {
    messages,
    isConnected,
    clearMessages
  };
};

export default useRealtimeMessages;
