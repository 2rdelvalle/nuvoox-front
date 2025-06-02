import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

interface TemplateEventData {
  data: {
    templateStatus: string;
    templateName: string;
    templateLanguage: string;
    templateId?: string | number;
    companyId?: string | number;
  };
  timestamp: number;
  eventType: 'approval' | 'rejection' | 'creation' | 'update' | 'deletion';
}

/**
 * Hook para escuchar actualizaciones en tiempo real de plantillas
 * Mejora la detección de cambios y proporciona información detallada
 * sobre el tipo de evento ocurrido
 */
const useRealtimeTemplate = (socketUrl: string) => {
  const [data, setData] = useState<TemplateEventData | null>(null);
  const socketRef = useRef<any>(null);
  const connectionAttempts = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  
  useEffect(() => {
    // Solo intentamos conectar si tenemos una URL válida
    if (!socketUrl) {
      // Socket URL not provided, connection won't be established
      return;
    }
    
    try {
      // Inicializar socket con opciones de reconexión
      socketRef.current = io(socketUrl, {
        reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
        reconnectionDelay: 1000,
        timeout: 10000
      });
      
      // Eventos de conexión
      socketRef.current.on('connect', () => {
        // Successfully connected to template events server
        connectionAttempts.current = 0;
      });
      
      socketRef.current.on('connect_error', (err: any) => {
        // Connection error should be handled with proper error tracking in production
        connectionAttempts.current++;
      });
      
      // Escuchar eventos específicos de plantillas
      socketRef.current.on('template', (rawData: any) => {
        // Template event received
        
        // Determinar el tipo de evento basado en datos
        let eventType: TemplateEventData['eventType'] = 'update';
        
        if (rawData?.data?.templateStatus === 'APPROVED') {
          eventType = 'approval';
        } else if (rawData?.data?.templateStatus === 'REJECTED') {
          eventType = 'rejection';
        } else if (rawData?.action === 'create') {
          eventType = 'creation';
        } else if (rawData?.action === 'delete') {
          eventType = 'deletion';
        }
        
        // Construir objeto de evento enriquecido
        const enhancedData: TemplateEventData = {
          data: rawData.data || {},
          timestamp: Date.now(),
          eventType
        };
        
        setData(enhancedData);
      });
      
      // Función de limpieza
      return () => {
        if (socketRef.current) {
          // Disconnecting from template socket
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      };
    } catch (error) {
      // Error initializing template socket - should be handled with proper error tracking in production
      return () => {};
    }
  }, [socketUrl]);
  
  // Limpiar los datos del evento
  const clearData = () => setData(null);
  
  // Comprobar si hay una conexión activa
  const isConnected = () => socketRef.current?.connected || false;
  
  return { data, clearData, isConnected };
};

export default useRealtimeTemplate;
