'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Avatar } from 'primereact/avatar';
import { Badge } from 'primereact/badge';
import { Tooltip } from 'primereact/tooltip';
import { ScrollPanel } from 'primereact/scrollpanel';
import { io, Socket } from 'socket.io-client';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Message {
  id: string;
  text: string;
  from: 'user' | 'bot';
  timestamp: string;
  status?: 'sending' | 'sent' | 'error';
}

interface FlowChatboxProps {
  companyId: number;
  userId: number;
  phoneNumber?: string;
  isOpen?: boolean;
  onClose?: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'center';
}

export const FlowChatbox: React.FC<FlowChatboxProps> = ({
  companyId,
  userId,
  phoneNumber,
  isOpen = false,
  onClose,
  position = 'bottom-right'
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMinimized, setIsMinimized] = useState(!isOpen);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Feature flag check
  const isFlowEngineEnabled = process.env.NEXT_PUBLIC_ENABLE_FLOW_ENGINE === 'true';

  useEffect(() => {
    if (!isFlowEngineEnabled) return;

    // Inicializar conexión WebSocket
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://app.nuvoox.com';
    socketRef.current = io(socketUrl, {
      transports: ['websocket'],
      query: {
        companyId: companyId.toString(),
        userId: userId.toString(),
        type: 'flow_chatbox'
      }
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('[FlowChatbox] Connected to WebSocket');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('[FlowChatbox] Disconnected from WebSocket');
      setIsConnected(false);
    });

    socket.on('flow_message', (data: any) => {
      const newMessage: Message = {
        id: `msg_${Date.now()}_${Math.random()}`,
        text: data.text,
        from: data.from === 'bot' ? 'bot' : 'user',
        timestamp: data.timestamp || Date.now().toString(),
        status: 'sent'
      };
      
      setMessages(prev => [...prev, newMessage]);
      
      // Incrementar contador si está minimizado
      if (isMinimized) {
        setUnreadCount(prev => prev + 1);
      }
      
      // Auto-scroll
      setTimeout(() => scrollToBottom(), 100);
    });

    socket.on('typing', (data: { isTyping: boolean }) => {
      setIsTyping(data.isTyping);
    });

    return () => {
      socket.disconnect();
    };
  }, [companyId, userId, isFlowEngineEnabled, isMinimized]);

  useEffect(() => {
    if (!isMinimized) {
      setUnreadCount(0);
      inputRef.current?.focus();
    }
  }, [isMinimized]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !socketRef.current) return;

    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      text: inputMessage,
      from: 'user',
      timestamp: Date.now().toString(),
      status: 'sending'
    };

    setMessages(prev => [...prev, newMessage]);
    
    // Enviar mensaje al servidor
    socketRef.current.emit('user_message', {
      text: inputMessage,
      phoneNumber: phoneNumber || null,
      timestamp: newMessage.timestamp
    });

    setInputMessage('');
    setTimeout(() => scrollToBottom(), 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setIsMinimized(true);
    }
  };

  if (!isFlowEngineEnabled) {
    return null;
  }

  const positionClasses = {
    'bottom-right': 'fixed bottom-4 right-4',
    'bottom-left': 'fixed bottom-4 left-4',
    'center': 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
  };

  return (
    <>
      {/* Botón flotante cuando está minimizado */}
      {isMinimized && (
        <div className={`${positionClasses[position]} z-50`}>
          <Button
            className="p-button-rounded p-button-primary shadow-lg hover:shadow-xl transition-shadow"
            icon="pi pi-comments"
            onClick={toggleMinimize}
            badge={unreadCount > 0 ? unreadCount.toString() : undefined}
            badgeClassName="p-badge-danger"
            style={{ width: '60px', height: '60px' }}
            tooltip="Abrir chat"
            tooltipOptions={{ position: 'left' }}
          />
        </div>
      )}

      {/* Ventana de chat */}
      {!isMinimized && (
        <div className={`${positionClasses[position]} z-50 transition-all duration-300`}>
          <Card 
            className="shadow-2xl"
            style={{ 
              width: '380px', 
              height: '600px',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b">
              <div className="flex items-center gap-2">
                <Avatar 
                  icon="pi pi-android" 
                  className="p-avatar-circle"
                  style={{ backgroundColor: '#4caf50', color: '#ffffff' }}
                />
                <div>
                  <h3 className="m-0 font-semibold">Asistente Virtual</h3>
                  <div className="flex items-center gap-1 text-sm">
                    <Badge 
                      severity={isConnected ? 'success' : 'danger'} 
                      className="w-2 h-2 rounded-full"
                    />
                    <span className="text-gray-500">
                      {isConnected ? 'En línea' : 'Desconectado'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  icon="pi pi-minus"
                  className="p-button-text p-button-rounded p-button-sm"
                  onClick={toggleMinimize}
                  tooltip="Minimizar"
                  tooltipOptions={{ position: 'top' }}
                />
                {onClose && (
                  <Button
                    icon="pi pi-times"
                    className="p-button-text p-button-rounded p-button-sm"
                    onClick={handleClose}
                    tooltip="Cerrar"
                    tooltipOptions={{ position: 'top' }}
                  />
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-3 bg-gray-50"
              style={{ maxHeight: '450px' }}
            >
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-10">
                  <i className="pi pi-comments text-4xl mb-3 text-gray-300"></i>
                  <p>¡Hola! ¿En qué puedo ayudarte hoy?</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-3 py-2 ${
                          msg.from === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-white border border-gray-200'
                        }`}
                      >
                        <p className="m-0 whitespace-pre-wrap">{msg.text}</p>
                        <div className={`text-xs mt-1 ${
                          msg.from === 'user' ? 'text-blue-100' : 'text-gray-400'
                        }`}>
                          {formatDistanceToNow(new Date(parseInt(msg.timestamp)), { 
                            addSuffix: true,
                            locale: es 
                          })}
                          {msg.status === 'sending' && (
                            <i className="pi pi-clock ml-1"></i>
                          )}
                          {msg.status === 'error' && (
                            <i className="pi pi-exclamation-circle ml-1 text-red-500"></i>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
                        <div className="flex gap-1">
                          <span className="typing-dot"></span>
                          <span className="typing-dot animation-delay-200"></span>
                          <span className="typing-dot animation-delay-400"></span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-3 border-t bg-white">
              <div className="flex gap-2">
                <InputText
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribe un mensaje..."
                  className="flex-1"
                  disabled={!isConnected}
                />
                <Button
                  icon="pi pi-send"
                  onClick={handleSendMessage}
                  disabled={!isConnected || !inputMessage.trim()}
                  className="p-button-primary"
                  tooltip="Enviar"
                  tooltipOptions={{ position: 'top' }}
                />
              </div>
              {!isConnected && (
                <div className="text-xs text-orange-500 mt-2 flex items-center gap-1">
                  <i className="pi pi-exclamation-triangle"></i>
                  Reconectando...
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Estilos para la animación de typing */}
      <style jsx>{`
        .typing-dot {
          width: 8px;
          height: 8px;
          background-color: #6b7280;
          border-radius: 50%;
          animation: typing 1.4s infinite;
        }
        
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        
        .animation-delay-400 {
          animation-delay: 0.4s;
        }
        
        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.7;
          }
          30% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};
