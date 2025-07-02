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
      
      // Función auxiliar para procesar eventos de plantillas
      const processTemplateEvent = (rawData: any) => {
        // Determinar el tipo de evento basado en datos
        let eventType: TemplateEventData['eventType'] = 'update';
        
        // Log completo para depuración
        console.log('📝 Datos completos del evento recibido:', JSON.stringify(rawData));
        
        // Procesar eventos de actualización de estado de Meta - Mejorado para detectar todos los formatos
        if (
          rawData?.templateStatus === 'APPROVED' || 
          rawData?.event === 'APPROVED' || 
          rawData?.status === 'APPROVED' || 
          (rawData?.status && typeof rawData.status === 'string' && rawData.status.toUpperCase() === 'APPROVED') ||
          (rawData?.state && typeof rawData.state === 'string' && rawData.state.toUpperCase() === 'APPROVED')
        ) {
          console.log('✅ Detectado evento de APROBACIÓN de plantilla');
          eventType = 'approval';
        } else if (
          rawData?.templateStatus === 'REJECTED' || 
          rawData?.event === 'REJECTED' || 
          rawData?.status === 'REJECTED' ||
          (rawData?.status && typeof rawData.status === 'string' && rawData.status.toUpperCase() === 'REJECTED') ||
          (rawData?.state && typeof rawData.state === 'string' && rawData.state.toUpperCase() === 'REJECTED')
        ) {
          console.log('❌ Detectado evento de RECHAZO de plantilla');
          eventType = 'rejection';
        } else if (rawData?.action === 'create') {
          eventType = 'creation';
        } else if (rawData?.action === 'delete') {
          eventType = 'deletion';
        }
        
        // Construir objeto de evento enriquecido
        const enhancedData: TemplateEventData = {
          data: rawData || {}, // Usamos todo el objeto raw como data
          timestamp: Date.now(),
          eventType
        };
        
        console.log('📤 Emitiendo evento al componente:', enhancedData);
        setData(enhancedData);
      };
      
      // Escuchar eventos específicos de plantillas
      // 1. Evento original 'template'
      socketRef.current.on('template', (rawData: any) => {
        console.log('🔔 Socket.IO template event recibido:', rawData);
        processTemplateEvent(rawData);
      });
      
      // 2. Nuevo evento 'template_status_update' desde el webhook
      socketRef.current.on('template_status_update', (rawData: any) => {
        console.log('🔔 Socket.IO template_status_update event recibido:', rawData);
        
        // Transformar el formato del evento del webhook al formato esperado
        const transformedData = {
          templateStatus: rawData.event,              // 'APPROVED', 'REJECTED', etc.
          templateName: rawData.templateName,         // Nombre de la plantilla 
          templateLanguage: rawData.language || 'es',  // Idioma, por defecto 'es'
          templateId: rawData.templateId              // ID de la plantilla
        };
        
        // Procesar con la misma lógica que el evento template
        processTemplateEvent(transformedData);
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
