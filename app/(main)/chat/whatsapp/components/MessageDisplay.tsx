import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Avatar } from 'primereact/avatar';

// Tipo para los mensajes entrantes
interface IncomingMessage {
  content: string;
  owner: string;
  sentAt: number;
  from: string;
  idWhatsapp: string;
  numberDestination: string;
}

// Estilos para el contenedor de mensajes
const messageContainerStyle: React.CSSProperties = {
  padding: '10px',
  maxHeight: '400px',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};

// Estilo para cada mensaje
const messageStyle: React.CSSProperties = {
  padding: '10px',
  borderRadius: '8px',
  maxWidth: '80%',
  wordBreak: 'break-word',
  position: 'relative',
  paddingBottom: '25px', // Espacio para la hora
};

// Estilo para el remitente
const senderStyle: React.CSSProperties = {
  fontWeight: 'bold',
  marginBottom: '5px',
  fontSize: '14px',
};

// Estilo para el tiempo
const timeStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '5px',
  right: '10px',
  fontSize: '12px',
  color: '#888',
  fontStyle: 'italic',
};

// Formato de hora
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
};

export default function MessageDisplay() {
  // Estados para los mensajes y la información de depuración
  const [messages, setMessages] = useState<IncomingMessage[]>([]);
  const [debugInfo, setDebugInfo] = useState<string>('Inicializando componente...');
  
  // Inicializar con un mensaje de prueba
  useEffect(() => {
    // Mensaje de prueba para verificar renderizado
    const testMessage: IncomingMessage = {
      content: 'Mensaje de prueba para verificar funcionamiento del componente',
      owner: 'CUSTOMER',
      sentAt: Date.now(),
      from: '573126486075',
      idWhatsapp: 'test-id',
      numberDestination: 'test-destination'
    };
    
    setMessages([testMessage]);
    setDebugInfo('Componente inicializado con mensaje de prueba');
  }, []);
  
  // Efecto para conectarse directamente al socket global de la aplicación
  useEffect(() => {
    // Crear una nueva conexión directa al socket
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4001';
    // IMPORTANTE: No usamos namespace /local, conectamos a la raíz
    setDebugInfo(`Conectándose a socket en: ${socketUrl}`);
    
    const directSocket = io(socketUrl, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling']
    });
    
    // Registrar eventos de conexión
    directSocket.on('connect', () => {
      setDebugInfo(`Conectado directamente al socket. ID: ${directSocket.id}`);
      console.log(`[MessageDisplay] Conectado al socket: ${socketUrl}`);
    });
    
    directSocket.on('connect_error', (err) => {
      setDebugInfo(`Error de conexión: ${err.message}`);
      console.error('[MessageDisplay] Error de conexión:', err);
    });
    
    // Escuchar TODOS los eventos para mejor depuración
    directSocket.onAny((eventName: string, ...args: any[]) => {
      console.log(`[MessageDisplay] Evento socket recibido: ${eventName}`, args);
    });
    
    // Escuchar específicamente mensajes
    directSocket.on('message', (message: IncomingMessage) => {
      console.log('[MessageDisplay] Mensaje recibido directamente:', message);
      const time = new Date().toLocaleTimeString();
      setDebugInfo(`${time} - Mensaje nuevo de: ${message.from}`);
      
      // Añadir el mensaje directamente al estado
      setMessages((prevMessages: IncomingMessage[]) => {
        // Verificación de duplicados más robusta
        const isDuplicate = prevMessages.some((m: IncomingMessage) => 
          (m.idWhatsapp && m.idWhatsapp === message.idWhatsapp) || 
          (m.content === message.content && 
           m.from === message.from && 
           Math.abs((m.sentAt || 0) - (message.sentAt || 0)) < 10000) // 10 segundos de tolerancia
        );
        
        if (!isDuplicate) {
          console.log('[MessageDisplay] Añadiendo nuevo mensaje al componente');
          // Añadir al principio para mostrar mensajes más recientes primero
          return [message, ...prevMessages].slice(0, 20); // Aumentamos a 20 mensajes
        }
        return prevMessages;
      });
    });
    
    // Intentar escuchar otros eventos comunes
    const commonEvents = ['whatsapp-message', 'whatsapp_message', 'chat-message', 'new-message'];
    
    commonEvents.forEach(eventName => {
      directSocket.on(eventName, (data: any) => {
        console.log(`[MessageDisplay] Evento alternativo '${eventName}' recibido:`, data);
        setDebugInfo(`Evento '${eventName}' capturado`);
      });
    });
    
    // Intentar también conectarse al socket global si existe
    if (typeof window !== 'undefined' && (window as any).debugSocket) {
      const globalSocket = (window as any).debugSocket;
      setDebugInfo(`También conectado al socket global`);
      
      globalSocket.on('message', (message: IncomingMessage) => {
        console.log('[MessageDisplay] Mensaje recibido en socket global:', message);
        setDebugInfo(`Mensaje global recibido de: ${message.from}`);
        
        // Mismo procesamiento que arriba
        setMessages((prevMessages: IncomingMessage[]) => {
          const isDuplicate = prevMessages.some((m: IncomingMessage) => 
            m.idWhatsapp === message.idWhatsapp
          );
          
          if (!isDuplicate) {
            return [message, ...prevMessages].slice(0, 10);
          }
          return prevMessages;
        });
      });
    }
    
    // Limpieza al desmontar
    return () => {
      directSocket.disconnect();
      
      if (typeof window !== 'undefined' && (window as any).debugSocket) {
        (window as any).debugSocket.off('message');
      }
      
      console.log('[MessageDisplay] Socket desconectado');
    };
  }, []);
  
  return (
    <div className="card mb-0" style={{ margin: '20px 0', border: '1px solid #ddd', borderRadius: '8px' }}>
      <div className="card-header bg-primary text-white p-3 d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          <i className="pi pi-comments mr-2" style={{ fontSize: '1.2rem' }}></i>
          <h5 className="m-0">Mensajes de WhatsApp</h5>
        </div>
        
        {/* Badge para mostrar cantidad de mensajes */}
        <span className="badge bg-light text-dark">{messages.length} mensaje(s)</span>
      </div>

      {/* Panel de depuración - solo visible en desarrollo */}
      <div className="bg-light p-2 border-bottom" style={{ fontSize: '0.8rem', color: '#666' }}>
        <div><strong>Estado:</strong> {debugInfo}</div>
        <div><strong>Mensajes en cola:</strong> {messages.length}</div>
      </div>

      <div style={messageContainerStyle}>
        {messages.length === 0 ? (
          <div className="text-center p-4 text-secondary">
            <i className="pi pi-inbox mb-2" style={{ fontSize: '2rem', opacity: 0.3 }}></i>
            <p>No hay mensajes recientes.<br />Los mensajes nuevos aparecerán aquí.</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className="d-flex align-items-start mb-3">
              {msg.owner === 'CUSTOMER' && (
                <Avatar 
                  icon="pi pi-user"
                  className="mr-2"
                  size="large" 
                  shape="circle"
                  style={{ 
                    marginRight: '10px', 
                    flexShrink: 0,
                    backgroundColor: '#f0f4f8',
                    color: '#333' 
                  }}
                />
              )}
              
              <div 
                style={{
                  ...messageStyle,
                  backgroundColor: msg.owner === 'CUSTOMER' ? '#f0f4f8' : '#e1f5fe',
                  marginLeft: msg.owner === 'CUSTOMER' ? '0' : 'auto',
                  marginRight: msg.owner === 'CUSTOMER' ? 'auto' : '0',
                  border: '1px solid #ddd',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
              >
                <div style={senderStyle}>
                  {msg.owner === 'CUSTOMER' ? `Cliente: ${msg.from}` : `Agente`}
                </div>
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {msg.content}
                </div>
                <div style={timeStyle}>
                  {formatTime(msg.sentAt)}
                </div>
              </div>
              
              {msg.owner !== 'CUSTOMER' && (
                <Avatar 
                  icon="pi pi-user"
                  className="ml-2"
                  size="large" 
                  shape="circle"
                  style={{ 
                    marginLeft: '10px', 
                    flexShrink: 0,
                    backgroundColor: '#e1f5fe',
                    color: '#333' 
                  }}
                />
              )}
            </div>
          ))
        )}
      </div>
      
      {/* Footer con instrucciones */}
      <div className="card-footer bg-light p-2 text-center" style={{ fontSize: '0.8rem', color: '#666' }}>
        <i className="pi pi-info-circle mr-1"></i>
        Este componente muestra los mensajes en tiempo real independientemente del flujo principal
      </div>
    </div>
  );
}
