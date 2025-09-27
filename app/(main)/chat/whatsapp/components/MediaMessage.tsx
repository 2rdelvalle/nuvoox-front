import React from 'react';
import { MESSAGE_TYPE, MessageModel } from '@/shared/models/conversation/messages.model';

interface MediaMessageProps {
  message: MessageModel;
  parseDate: (timestamp: number) => string;
}

/**
 * Componente para mostrar mensajes de tipo multimedia en el chat
 * Maneja diferentes tipos de mensajes: imágenes, videos y documentos
 */
const MediaMessage: React.FC<MediaMessageProps> = ({ message, parseDate }) => {
  // Extraer el nombre del archivo y la descripción del contenido
  const getFileInfo = (content: string) => {
    // Si el formato es "nombre_archivo - descripción"
    const parts = content.split(' - ');
    
    if (parts.length > 1) {
      return {
        fileName: parts[0],
        description: parts.slice(1).join(' - ')
      };
    }
    
    return {
      fileName: content.split('/').pop()?.split('?')[0] || content,
      description: ''
    };
  };

  // Función para renderizar el contenido del mensaje según su tipo
  const renderMediaContent = () => {
    const { type } = message;
    const { fileName, description } = getFileInfo(message.content);
    
    switch (type) {
      case MESSAGE_TYPE.IMAGE:
        return (
          <div className="relative">
            <img 
              src={message.content} 
              alt={description || "Imagen recibida"} 
              className="max-w-full rounded-md"
              style={{ maxHeight: '250px' }}
            />
            {description && (
              <div className="p-2 text-sm bg-surface-100 mt-1 rounded-md">
                {description}
              </div>
            )}
            <span className="text-xs text-600 block mt-1">
              {fileName}
            </span>
          </div>
        );
        
      case MESSAGE_TYPE.VIDEO:
        return (
          <div className="relative">
            <video 
              src={message.content} 
              controls 
              className="max-w-full rounded-md"
              style={{ maxHeight: '250px', maxWidth: '100%' }}
            />
            {description && (
              <div className="p-2 text-sm bg-surface-100 mt-1 rounded-md">
                {description}
              </div>
            )}
            <span className="text-xs text-600 block mt-1">
              {fileName}
            </span>
          </div>
        );
        
      case MESSAGE_TYPE.DOCUMENT:
      case MESSAGE_TYPE.AUDIO:
        return (
          <div className="flex flex-column align-items-center p-3 border-1 surface-border rounded-md">
            <i className={`pi ${type === MESSAGE_TYPE.DOCUMENT ? 'pi-file-pdf' : 'pi-volume-up'} text-xl mb-2`}></i>
            <span className="text-sm font-medium">{fileName}</span>
            {description && (
              <div className="p-2 text-sm bg-surface-100 my-1 rounded-md w-full text-center">
                {description}
              </div>
            )}
            <a 
              href={message.content} 
              download 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-button p-button-sm p-button-outlined mt-2 text-xs"
            >
              Descargar
            </a>
          </div>
        );
        
      default:
        return <span>{message.content}</span>;
    }
  };

  return (
    <div className="media-message">
      {renderMediaContent()}
      <div className="text-right text-xs text-500 mt-1">
        {parseDate(message.sentAt)}
      </div>
    </div>
  );
};

export default MediaMessage;
