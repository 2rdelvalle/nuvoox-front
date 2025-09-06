'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';

interface WebChatWidgetProps {
  companyId: number;
  userId: number;
  position?: 'bottom-right' | 'bottom-left';
  isOpen?: boolean;
  onClose?: () => void;
}

interface WebChatConfig {
  brand_primary: string;
  brand_text: string;
  logo_url?: string;
  welcome_text: string;
  is_active: boolean;
}

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
}

export const WebChatWidget: React.FC<WebChatWidgetProps> = ({
  companyId,
  userId,
  position = 'bottom-right',
  isOpen: controlledIsOpen,
  onClose
}) => {
  const [config, setConfig] = useState<WebChatConfig>({
    brand_primary: '#FF6600',
    brand_text: '#FFFFFF',
    logo_url: '',
    welcome_text: '¡Hola! ¿Cómo podemos ayudarte?',
    is_active: true
  });

  const [isMinimized, setIsMinimized] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Feature flag check
  const isWebChatEnabled = process.env.NEXT_PUBLIC_ENABLE_WEBCHAT === 'true';

  useEffect(() => {
    if (isWebChatEnabled) {
      loadConfig();
      // Add welcome message
      setMessages([{
        id: '1',
        content: config.welcome_text,
        isUser: false,
        timestamp: new Date().toISOString()
      }]);
    }
  }, [isWebChatEnabled]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConfig = async () => {
    try {
      const response = await fetch(`/api/webchat/config`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data) {
          setConfig(data);
          // Update welcome message
          setMessages(prev => prev.map(msg => 
            msg.id === '1' ? { ...msg, content: data.welcome_text } : msg
          ));
        }
      }
    } catch (error) {
      console.error('Error loading WebChat config:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: newMessage,
      isUser: true,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsLoading(true);

    try {
      // Here you would integrate with your chat API
      // For now, simulate a response
      setTimeout(() => {
        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: 'Gracias por tu mensaje. Un agente te responderá pronto.',
          isUser: false,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, botResponse]);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  const toggleWidget = () => {
    setIsMinimized(!isMinimized);
  };

  const closeWidget = () => {
    setIsMinimized(true);
    if (onClose) onClose();
  };

  if (!isWebChatEnabled || !config.is_active) {
    return null;
  }

  const positionClass = position === 'bottom-right' ? 'right-6' : 'left-6';

  return (
    <div 
      className={`fixed bottom-6 ${positionClass} z-50 ${
        isMinimized ? 'w-16 h-16' : 'w-80'
      } transform transition-all duration-300 ease-in-out`}
    >
      {isMinimized ? (
        /* Minimized floating button */
        <button
          onClick={toggleWidget}
          className="w-full h-full rounded-full flex items-center justify-center text-white font-semibold text-2xl hover:scale-105 transition-transform cursor-pointer shadow-lg"
          style={{ backgroundColor: config.brand_primary, color: config.brand_text }}
          title="Abrir chat de soporte"
        >
          💬
        </button>
      ) : (
        /* Expanded widget */
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Widget Header */}
          <div 
            className="p-4 text-white flex items-center gap-3"
            style={{ backgroundColor: config.brand_primary, color: config.brand_text }}
          >
            {config.logo_url && (
              <img src={config.logo_url} alt="Logo" className="w-8 h-8 rounded" />
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Chat de Soporte</h3>
              <p className="text-xs opacity-90">¡Estamos aquí para ayudarte!</p>
            </div>
            <button
              onClick={toggleWidget}
              className="text-white hover:bg-black hover:bg-opacity-20 rounded p-1 transition-colors"
              title="Minimizar chat"
            >
              <i className="pi pi-minus text-xs"></i>
            </button>
          </div>
          
          {/* Widget Body */}
          <div className="flex flex-col h-96">
            {/* Messages area */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!message.isUser && (
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex-shrink-0 flex items-center justify-center">
                        <i className="pi pi-user text-xs text-gray-600"></i>
                      </div>
                    )}
                    <div
                      className={`rounded-lg p-3 max-w-[240px] ${
                        message.isUser
                          ? 'text-white'
                          : 'bg-white text-gray-800'
                      }`}
                      style={message.isUser ? { backgroundColor: config.brand_primary } : {}}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                    {message.isUser && (
                      <div 
                        className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs"
                        style={{ backgroundColor: config.brand_primary }}
                      >
                        <i className="pi pi-user"></i>
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-2">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex-shrink-0 flex items-center justify-center">
                      <i className="pi pi-user text-xs text-gray-600"></i>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
            
            {/* Input area */}
            <div className="p-4 bg-white border-t border-gray-100">
              <div className="flex gap-2">
                <InputText
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribe tu mensaje..."
                  className="flex-1 text-sm"
                  disabled={isLoading}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || isLoading}
                  icon="pi pi-send"
                  size="small"
                  className="flex-shrink-0"
                  style={{ backgroundColor: config.brand_primary, borderColor: config.brand_primary }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
