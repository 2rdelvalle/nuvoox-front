import { useChatStore } from "@/app/(main)/chat/whatsapp/store/chat-store"
import { useMessageStore } from "@/app/(main)/chat/whatsapp/store/message-store"
import { getLastMessage } from "@/app/(main)/chat/whatsapp/service/messageServices"
import { useToast } from "@/shared/context/toast/toastContext"
import { axiosInstance } from "@/shared/instances/axios-instance"
import { ConversationCaratule } from "@/shared/models/conversation/conversation.model"
import { MessageModel } from "@/shared/models/conversation/messages.model"
import { confirmDialog } from "primereact/confirmdialog"
import { classNames } from "primereact/utils"
import React, { useEffect, useState, useRef } from "react"
import { MESSAGE_OWNER } from "@/shared/models/conversation/messages.model"

interface props {
  conversation: ConversationCaratule
  isNotAssigned?: boolean
  refetchConversations?: () => Promise<void>
}

const ConversationCard: React.FC<props> = ({ conversation, isNotAssigned, refetchConversations }) => {
  const {
    setActiveConversation,
    setSidebarConversationVisible,
    setselectedSidebarConversationInfo,
    activeConversation,
    user,
    resetUnreadCount
  } = useChatStore()

  const { messages } = useMessageStore()
  
  // Estados simples sin referencias ni claves de localStorage
  const [lastMessageTime, setLastMessageTime] = useState<string>("") 
  const [unreadCount, setUnreadCount] = useState<number>(0)
  
  // Ya no mantenemos referencias a localStorage para evitar persistencia no deseada
  // Solo para los mensajes no leídos mantenemos la clave
  const unreadMessagesKey = `unread_${conversation.conversationid}`
  
  const { showError, showSuccess } = useToast()
  
  // Referencia simple para mantener el ID de conversación
  const conversationRef = useRef<number>(conversation.conversationid);
  
  // Efecto para actualizar el contador de mensajes no leídos directamente desde el store global
  useEffect(() => {
    // Función para obtener y actualizar el contador
    const updateUnreadCount = () => {
      try {
        // Si es la conversación activa, resetear contador
        if (activeConversation?.conversationid === conversation.conversationid) {
          resetUnreadCount(conversation.conversationid);
          setUnreadCount(0);
          return;
        }

        // Si no es la conversación activa, obtener contador del estado global
        const conversationData = useChatStore.getState().conversations.find(
          c => c.conversationid === conversation.conversationid
        );
        
        if (conversationData && typeof conversationData.unreadCount === 'number') {
          // Actualizar el contador local para mostrar el badge
          setUnreadCount(conversationData.unreadCount);
        }
      } catch (error) {
        console.error('Error al actualizar contador de mensajes no leídos:', error);
      }
    };
    
    // Verificar inmediatamente y luego cada 500ms
    updateUnreadCount();
    const intervalId = setInterval(updateUnreadCount, 500);
    
    // Limpiar intervalo al desmontar
    return () => clearInterval(intervalId);
  }, [conversation.conversationid, activeConversation, resetUnreadCount]);

  /**
   * Obtener y formatear la hora del último mensaje
   * Método simple y compatible con diferentes formatos de timestamp
   * @param timestamp - Timestamp en cualquier formato
   * @returns Hora formateada en formato HH:MM o cadena vacía si el timestamp es inválido
   */
  const parseDate = (timestamp: any): string => {
    // Si no hay timestamp, retornar cadena vacía
    if (!timestamp) return "";
    
    try {
      // Usamos un enfoque universal para manejar cualquier formato de timestamp
      let date: Date;
      
      // Caso 1: Es un objeto Date
      if (timestamp instanceof Date) {
        date = timestamp;
      }
      // Caso 2: Es un número (UNIX timestamp en segundos o milisegundos)
      else if (typeof timestamp === 'number' || (typeof timestamp === 'string' && !isNaN(Number(timestamp)))) {
        const numericTimestamp = typeof timestamp === 'number' ? timestamp : Number(timestamp);
        // Si el timestamp es menor que cierto umbral, asumimos que está en segundos
        if (numericTimestamp < 10000000000) {
          date = new Date(numericTimestamp * 1000);
        } else {
          date = new Date(numericTimestamp);
        }
      }
      // Caso 3: Es una cadena en formato ISO o similar
      else if (typeof timestamp === 'string') {
        date = new Date(timestamp);
      }
      // Caso 4: Cualquier otro caso, retornar cadena vacía
      else {
        return "";
      }
      
      // Si la fecha es inválida, retornar cadena vacía
      if (isNaN(date.getTime())) {
        return "";
      }
      
      // Formatear a HH:MM usando métodos nativos
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes}`;
    } catch (error) {
      console.error("Error al parsear fecha:", error);
      return "";
    }
  }
  
  /**
   * Formatea una marca de tiempo en formato HH:MM
   * Función simplificada sin persistencia
   * @param timestamp - Timestamp a formatear (puede ser number o string)
   * @returns Hora formateada (HH:MM)
   */
  const formatTime = (timestamp: number | string | undefined): string => {
    if (!timestamp) return "--:--";
    
    try {
      // Normalizar a milisegundos
      let timeMs: number;
      
      if (typeof timestamp === 'string') {
        const parsed = parseInt(timestamp, 10);
        if (isNaN(parsed)) {
          // Intentar como fecha ISO
          timeMs = new Date(timestamp).getTime();
        } else {
          // Es un número en string
          timeMs = parsed < 10000000000 ? parsed * 1000 : parsed;
        }
      } else if (typeof timestamp === 'number') {
        // Es directamente un número
        timeMs = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
      } else {
        return "--:--";
      }
      
      // Verificar que sea válido
      if (isNaN(timeMs)) return "--:--";
      
      // Crear objeto Date y formatear
      const date = new Date(timeMs);
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${hours}:${minutes}`;
    } catch (error) {
      console.error('Error al formatear hora:', error);
      return "--:--";
    }
  };
  
  // Efecto simplificado para mantener actualizado el tiempo del último mensaje
  useEffect(() => {
    // Función que actualiza la hora usando los mensajes del store global
    const updateLastMessageTime = () => {
      // Obtener todos los mensajes de la tienda global
      const msgs = useMessageStore.getState().messages;
      
      // Filtrar solo los mensajes de esta conversación
      const conversationMsgs = msgs.filter(m => 
        m.conversationId === conversation.conversationid
      );
      
      // Si no hay mensajes, salir
      if (conversationMsgs.length === 0) return;
      
      // Ordenar por timestamp de más reciente a más antiguo
      const sortedMsgs = [...conversationMsgs].sort((a, b) => {
        // Normalizar timestamps a números
        const timeA = typeof a.sentAt === 'number' ? a.sentAt : parseInt(String(a.sentAt), 10) || 0;
        const timeB = typeof b.sentAt === 'number' ? b.sentAt : parseInt(String(b.sentAt), 10) || 0;
        return timeB - timeA; // Orden descendente (más reciente primero)
      });
      
      // Tomar el primer mensaje (el más reciente)
      const mostRecentMsg = sortedMsgs[0];
      
      // Formatear la hora y actualizar el estado
      if (mostRecentMsg?.sentAt) {
        const formattedTime = formatTime(mostRecentMsg.sentAt);
        // Actualizar el estado directamente sin persistencia
        setLastMessageTime(formattedTime);
      }
    };
    
    // Ejecutar inmediatamente al montar/cambiar la conversación
    updateLastMessageTime();
    
    // Crear un intervalo para verificar cambios constantemente
    const checkInterval = setInterval(updateLastMessageTime, 1000);
    
    // Crear una suscripción al store de mensajes para actualizar cuando cambie
    const unsubscribe = useMessageStore.subscribe(state => {
      // Solo actualizar, ya que en la función de actualización
      // obtenemos los mensajes más recientes del store
      updateLastMessageTime();
    });
    
    // Limpiar recursos al desmontar
    return () => {
      clearInterval(checkInterval);
      unsubscribe();
    };
  }, [conversation.conversationid]); // Solo dependemos del ID de conversación
  
  const changeView = () => {
    if (isNotAssigned) {
      confirmDialog({
        message: "¿Desea aceptar esta conversación?",
        header: "Confirmación",
        icon: "pi pi-exclamation-triangle",
        accept: async () => {
          await axiosInstance.get(`conversation/acceptConversation/${conversation.conversationid}/${user.userId}`)
            .then(() => {
              showSuccess("Conversación aceptada")
              // Preservamos la hora del último mensaje al establecer la conversación activa
              setActiveConversation({
                ...conversation,
                // Podríamos agregar aquí cualquier metadata adicional si fuera necesario
              })
              refetchConversations && refetchConversations()
            })
            .catch((error) => {
              showError("Error al aceptar la conversación")
              console.error("Error al aceptar la conversación:", error)
            })
        },
        reject: () => {}
      })
    } else {
      // Preservamos la hora del último mensaje al establecer la conversación activa
      setActiveConversation(conversation)
    }
  }

  const openSidebar = (e: React.MouseEvent) => {
    e.stopPropagation() // evitar que se dispare el cambio de conversación
    setselectedSidebarConversationInfo(conversation)
    setSidebarConversationVisible(true)
  }

  return (
    <div
      className="flex flex-nowrap justify-content-between align-items-center border-1 surface-border border-round p-3 cursor-pointer
      select-none hover:surface-hover transition-colors transition-duration-150"
      onClick={changeView}
      tabIndex={0}
    >
      <div className="flex align-items-center">
        <div className="relative md:mr-3">
          <div className="relative">
            <img
              src="/demo/images/avatar/circle/avatar_blank.webp"
              alt="avatar"
              className="w-3rem h-3rem border-circle shadow-4 cursor-pointer"
              onClick={openSidebar}
            />
            <span
              className={classNames(
                "w-1rem h-1rem border-circle border-2 surface-border absolute",
                {
                  "bg-green-400": "active"
                }
              )}
              style={{ bottom: "2px", right: "2px" }}
            ></span>
            
            {/* Badge de notificación para mensajes no leídos */}
            {unreadCount > 0 && (
              <span 
                className="absolute flex align-items-center justify-content-center border-circle bg-purple-600 text-white font-bold"
                style={{
                  top: '-5px',
                  right: '-5px',
                  width: unreadCount > 99 ? '22px' : unreadCount > 9 ? '20px' : '18px',
                  height: unreadCount > 99 ? '22px' : unreadCount > 9 ? '20px' : '18px',
                  fontSize: unreadCount > 99 ? '10px' : '11px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  zIndex: 2
                }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}  
          </div>
        </div>
        <div className="flex-column hidden md:flex">
          <div className="flex justify-content-between align-items-center w-full">
            <span className="text-900 font-semibold block">
              +{conversation.indicative + " " + conversation.destination_number}
            </span>
            {/* Mostrar la hora del último mensaje (se actualiza automáticamente) */}
            <span className="text-500 text-sm ml-3" title="Hora del último mensaje">
              {lastMessageTime || "--:--"}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConversationCard;
