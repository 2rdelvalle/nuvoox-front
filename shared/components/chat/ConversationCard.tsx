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
    user
  } = useChatStore()

  const { messages } = useMessageStore()
  
  // Referencia al valor verdadero de la hora que no debe cambiar
  const initialTimeRef = useRef<string>("");
  
  // Estado visible para la UI, pero que no cambia una vez establecido
  const [lastMessageTime, setLastMessageTime] = useState<string>("") 
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [lastMessageTimestamp, setLastMessageTimestamp] = useState<number | null>(null)
  
  // Clave única para localStorage basada en el ID de conversación
  const localStorageKey = `lastMsgTime_${conversation.conversationid}`

  const { showError, showSuccess } = useToast()

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
   * Guardar la hora del último mensaje en localStorage
   * @param time - Hora formateada a guardar
   */
  const saveTimeToLocalStorage = (time: string) => {
    try {
      if (typeof window !== 'undefined' && time) {
        localStorage.setItem(localStorageKey, time);
      }
    } catch (error) {
      console.error("Error al guardar en localStorage:", error);
    }
  }
  
  /**
   * Recuperar la hora del último mensaje desde localStorage
   * @returns Hora guardada o cadena vacía si no existe
   */
  const getTimeFromLocalStorage = (): string => {
    try {
      if (typeof window !== 'undefined') {
        const savedTime = localStorage.getItem(localStorageKey);
        return savedTime || "";
      }
    } catch (error) {
      console.error("Error al leer de localStorage:", error);
    }
    return "";
  }

  /**
   * Carga el último mensaje directamente desde el backend
   * Versión que usa localStorage para persistencia entre renders
   */
  const fetchLastMessageForConversation = async () => {
    // Verificar si ya tenemos la hora en localStorage
    const savedTime = getTimeFromLocalStorage();
    if (savedTime) {
      // Si ya tenemos la hora guardada, no necesitamos hacer nada más
      initialTimeRef.current = savedTime;
      setLastMessageTime(savedTime);
      return;
    }
    
    // Validar que tenemos un ID de conversación
    if (!conversation?.conversationid) return;
    
    // Evitar múltiples llamadas simultáneas
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      // Solicitar los mensajes usando el endpoint existente
      const response = await axiosInstance.post("/message/getMessages", {
        conversationId: conversation.conversationid
      });
      
      // Análisis detallado de la estructura para encontrar el timestamp correcto
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        // Inspeccionar los mensajes para determinar qué campos tienen la información temporal
        const firstMessage = response.data[0];
        console.log("Ejemplo de mensaje:", firstMessage);
        
        // Recopilamos todos los campos que podrían contener la fecha/hora
        const possibleDateFields = ['sentAt', 'created_at', 'createdAt', 'date', 'timestamp', 'sent_at', 'time'];
        
        // Obtenemos todos los mensajes válidos (que tengan algún campo de fecha/hora)
        const validMessages = [];
        
        for (const msg of response.data) {
          // Revisar todos los campos posibles de fecha
          for (const field of possibleDateFields) {
            if (msg[field]) {
              // Este mensaje tiene un campo de fecha, lo consideramos válido
              validMessages.push(msg);
              break;
            }
          }
        }
        
        if (validMessages.length > 0) {
          // Procesamos todos los mensajes para normalizar sus timestamps
          const messagesWithTime = validMessages.map(msg => {
            // Revisar cada campo posible de fecha y usar el primero que encontremos
            let timestamp = null;
            
            for (const field of possibleDateFields) {
              if (msg[field]) {
                const dateValue = msg[field];
                
                // Procesar diferentes formatos de timestamp
                if (typeof dateValue === 'number') {
                  // Si es un valor numérico muy pequeño, está en segundos
                  timestamp = dateValue < 10000000000 ? dateValue * 1000 : dateValue;
                  break;
                } else if (typeof dateValue === 'string') {
                  if (!isNaN(Number(dateValue))) {
                    // String que representa un número
                    const numericTime = Number(dateValue);
                    timestamp = numericTime < 10000000000 ? numericTime * 1000 : numericTime;
                  } else {
                    // Intentar como fecha ISO
                    try {
                      timestamp = new Date(dateValue).getTime();
                    } catch (e) {
                      // Si falla, continuamos con el siguiente campo
                      continue;
                    }
                  }
                  break;
                }
              }
            }
            
            return {
              ...msg,
              normalizedTimestamp: timestamp || 0
            };
          });
          
          // Ordenar por tiempo normalizado (más reciente primero)
          const sortedMessages = messagesWithTime
            .filter(msg => msg.normalizedTimestamp > 0) // Solo mensajes con timestamp válido
            .sort((a, b) => b.normalizedTimestamp - a.normalizedTimestamp);
          
          if (sortedMessages.length > 0) {
            const latestMessage = sortedMessages[0];
            console.log("Mensaje más reciente encontrado:", latestMessage);
            
            // Obtener el primer campo de fecha válido
            let dateFieldUsed = null;
            for (const field of possibleDateFields) {
              if (latestMessage[field]) {
                dateFieldUsed = field;
                break;
              }
            }
            
            if (dateFieldUsed) {
              const dateValue = latestMessage[dateFieldUsed];
              console.log(`Usando campo ${dateFieldUsed} con valor ${dateValue}`);
              
              const timeString = parseDate(dateValue);
              
              if (timeString) {
                console.log(`Hora formateada final: ${timeString}`);
                
                // Guardar en localStorage para evitar cambios futuros
                saveTimeToLocalStorage(timeString);
                
                // Guardar en la referencia y en el estado
                initialTimeRef.current = timeString;
                setLastMessageTime(timeString);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error al obtener el último mensaje:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Efecto principal que se ejecuta una sola vez al montar el componente
  useEffect(() => {
    // Intentar cargar desde localStorage primero
    const savedTime = getTimeFromLocalStorage();
    
    if (savedTime) {
      // Si existe un tiempo guardado, usarlo directamente
      initialTimeRef.current = savedTime;
      setLastMessageTime(savedTime);
    } else if (conversation?.conversationid) {
      // Si no hay tiempo guardado, cargarlo del backend
      const timerId = setTimeout(() => {
        fetchLastMessageForConversation();
      }, 200);
      
      return () => clearTimeout(timerId);
    }
  }, [conversation?.conversationid]); // Solo ejecutar cuando cambia la conversación
  
  // Efecto para actualizar la hora del último mensaje cuando cambian los mensajes
  useEffect(() => {
    // Función segura para obtener la hora del último mensaje en tiempo real
    const getLastMessageTime = () => {
      try {
        // Filtrar mensajes por conversación actual
        const conversationMessages = messages.filter(
          (msg) => msg.conversationId === conversation.conversationid
        );
        
        if (conversationMessages.length > 0) {
          // Ordenar mensajes por tiempo y obtener el más reciente
          const lastMessage = [...conversationMessages].sort((a, b) => {
            const timeA = typeof a.sentAt === 'number' ? a.sentAt : 0;
            const timeB = typeof b.sentAt === 'number' ? b.sentAt : 0;
            return timeB - timeA;
          })[0];
          
          // Si el mensaje tiene un timestamp válido, actualizar estado
          if (lastMessage && lastMessage.sentAt) {
            const timestamp = typeof lastMessage.sentAt === 'number' ? lastMessage.sentAt : Number(lastMessage.sentAt);
            if (!isNaN(timestamp) && timestamp !== lastMessageTimestamp) {
              setLastMessageTimestamp(timestamp);
              return parseDate(timestamp);
            }
          }
        }
      } catch (error) {
        console.error("Error al obtener último mensaje:", error);
      }
      
      return "";
    };
    
    // Solo actualizar si hay mensajes nuevos y se obtiene una hora válida
    const newLastMessageTime = getLastMessageTime();
    if (newLastMessageTime) {
      setLastMessageTime(newLastMessageTime);
      saveTimeToLocalStorage(newLastMessageTime);
    }
  }, [messages, conversation.conversationid, lastMessageTimestamp]);
  
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
