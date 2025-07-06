import { emojis } from "@/shared/components/chat/emojis/emojis"
import { useToast } from "@/shared/context/toast/toastContext"
import { usePostRequest } from "@/shared/customHooks/usePostRequestResult"
import { useFetch } from "@/shared/hooks/useFetch"
import { axiosInstance } from "@/shared/instances/axios-instance"
import { usePush } from "@/shared/hooks/usePush"
import useRealtimeMessages from "@/shared/hooks/useRealtimeMessages"
import { confirmDialog } from "primereact/confirmdialog"
import { MESSAGE_OWNER, MESSAGE_TYPE, MessageModel } from "@/shared/models/conversation/messages.model"
import { ConversationCaratule, Conversation } from "@/shared/models/conversation/conversation.model"
import { UserCaratule } from "@/shared/models/user"
import { NumbersOfMaintanceCaratule } from "@/shared/models/company"
import FileAttachment from "../components/FileAttachment"
import MediaMessage from "../components/MediaMessage"
import {
  TemplateService as _template
}
from "@/shared/services"
import { getCookieToken, getDataFromToken } from "@/shared/utilities/functions/sessionUtils"
import { Button } from "primereact/button"
import { Dropdown } from "primereact/dropdown"
import { InputText } from "primereact/inputtext"
import { Message } from "primereact/message"
import { OverlayPanel } from "primereact/overlaypanel"
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { sendPlainMessage, sendTemplateMessage, getAgents, getGroups } from "../service/chatServices"
import { useChatStore } from "../store/chat-store"
import { useMessageStore } from "../store/message-store"
import { Dialog } from 'primereact/dialog';
import BalanceService from "@/shared/services/balance/balance.service";

interface Agent {
  id: string;
  name: string;
  status: string;
  type: string;
}

interface Group {
  id: string;
  name: string;
}

export const ChatBox = () => {
  const { showError, showSuccess } = useToast()
  const [textContent, setTextContent] = useState("")
  const [searchText, setSearchText] = useState("") // Estado para almacenar el texto de búsqueda
  const op = useRef<OverlayPanel>(null)
  const templateOp = useRef<OverlayPanel>(null) // NUEVO: ref para overlay de plantillas
  const quickResponseOp = useRef<OverlayPanel>(null) // Ref para overlay de respuestas rápidas
  const searchOp = useRef<OverlayPanel>(null) // Ref para overlay de búsqueda
  const chatWindow = useRef<HTMLDivElement>(null)
  const token = getCookieToken()
  const dataToken = token ? getDataFromToken(token) : null
  // const defaultUserId = dataToken?.user.userId
  const { messages: messagesSocket, clearMessages, isConnected } = useRealtimeMessages(`${process.env.NEXT_PUBLIC_SOCKET_URL}`);
  const { messages: storedMessages, setMessages, pushMessage } = useMessageStore();
  const { onClickAction } = usePush("/auth/login")

  // ESTADOS ---
  //
  const { actualNumberOfMaintanceSelected, activeConversation } = useChatStore()

  // Obtener las plantillas filtradas por compañía
  const companyId = dataToken?.user.company.companyId

  // Usamos useCallback para que la función de fetch sea estable entre renders
  const fetchTemplates = useCallback(async () => {
    // Solo hacemos el fetch si hay un ID de compañía válido
    if (companyId) {
      try {
        const response = await _template.getAllByCompany(companyId);
        return response.data;
      } catch (error) {
        console.error('Error al cargar plantillas:', error);
        return [];
      }
    }
    return [];
  }, [companyId]);

  // Usamos useFetchCallback en lugar de useFetch para tener mejor control
  const [loading, setLoading] = useState(false);
  const [dataTemplates, setDataTemplates] = useState<any[]>([]);
  
  // Efecto para cargar plantillas solo una vez al montar el componente o cuando cambie companyId
  useEffect(() => {
    let mounted = true;
    
    const loadTemplates = async () => {
      if (!companyId) return;
      
      try {
        setLoading(true);
        const data = await fetchTemplates();
        if (mounted) {
          setDataTemplates(data || []);
        }
      } catch (error) {
        console.error('Error cargando plantillas:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    loadTemplates();
    
    return () => {
      mounted = false;
    };
  }, [companyId, fetchTemplates]);

  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null)

  // Verificación de token - control más seguro para prevenir bucles
  const [shouldRedirect, setShouldRedirect] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [tokenCheckComplete, setTokenCheckComplete] = useState(false)

  // Efecto para marcar el componente como montado (solo en el cliente)
  useEffect(() => {
    setMounted(true)
    
    // Dar tiempo para que se carguen las cookies correctamente
    const initTimer = setTimeout(() => {
      setTokenCheckComplete(true)
    }, 500) // Pequeño retraso para asegurar que las cookies se carguen
    
    return () => clearTimeout(initTimer)
  }, [])

  // Realizar verificación de token solo cuando esté listo para hacerlo
  useEffect(() => {
    // Solo verificamos cuando:
    // 1. El componente está montado en el cliente
    // 2. La verificación de token ha completado su tiempo de espera
    // 3. No hay token disponible
    // 4. No se ha programado una redirección aún
    if (mounted && tokenCheckComplete && !dataToken && !shouldRedirect) {
      console.log('Verificación de token fallida (cliente)')
      // En lugar de mostrar un error en pantalla, lo registramos y redirigimos silenciosamente
      console.warn("Se requiere iniciar sesión para acceder a esta funcionalidad")
      setShouldRedirect(true)
    }
  }, [dataToken, shouldRedirect, tokenCheckComplete, mounted])
  
  // Efecto separado para manejar la redirección
  useEffect(() => {
    if (mounted && shouldRedirect) {
      // Usar setTimeout para evitar redirecciones durante el renderizado
      const redirectTimer = setTimeout(() => {
        console.log('Redirigiendo a la página de login...')
        onClickAction()
      }, 300) // Un poco más de tiempo para una mejor experiencia
      return () => clearTimeout(redirectTimer)
    }
  }, [shouldRedirect, onClickAction, mounted])

  // Transformación de mensajes
  const transformMessage = (msg: any): MessageModel => {
    console.log('Transformando mensaje:', msg); // Debug para ver la estructura exacta
    
    // Intentar obtener un conversationId válido
    // 1. Si hay una conversación activa, usar ese conversationId
    // 2. Si hay una coincidencia de número de teléfono, usar ese conversationId
    // 3. Como último recurso, intentar crear un ID a partir del número de teléfono
    let messageConversationId = null;
    
    if (activeConversation?.conversationid) {
      // Si hay una conversación activa, verificamos si el número coincide
      const phoneWithoutPlus = activeConversation.phone?.replace(/\+/g, '');
      const msgFromWithoutPlus = msg.from?.replace(/\+/g, '');
      
      console.log('Verificando coincidencia de número:', {
        activePhone: phoneWithoutPlus,
        msgFrom: msgFromWithoutPlus
      });
      
      // Si el número del mensaje coincide con el de la conversación activa
      if (phoneWithoutPlus && msgFromWithoutPlus && phoneWithoutPlus.includes(msgFromWithoutPlus) || 
          msgFromWithoutPlus && phoneWithoutPlus && msgFromWithoutPlus.includes(phoneWithoutPlus)) {
        messageConversationId = activeConversation.conversationid;
        console.log('Asignado conversationId de conversación activa:', messageConversationId);
      }
    }
    
    // Si no se ha asignado un ID, usar el ID basado en número de teléfono
    if (!messageConversationId && msg.from) {
      try {
        // Intenta extraer un ID numérico del número de teléfono
        const numericId = parseInt(msg.from.replace(/[^0-9]/g, ''));
        if (!isNaN(numericId)) {
          messageConversationId = numericId;
          console.log('Asignado conversationId basado en número de teléfono:', messageConversationId);
        }
      } catch (error) {
        console.error('Error al convertir from a conversationId:', error);
      }
    }
    
    // Como último recurso, usar un timestamp
    if (!messageConversationId) {
      messageConversationId = activeConversation?.conversationid || Date.now();
      console.log('Asignado conversationId por defecto:', messageConversationId);
    }
    
    return {
      content: msg.content || msg.text || '', // Primero content, después text como fallback
      owner: msg.owner === 'CUSTOMER' ? MESSAGE_OWNER.CLIENT : MESSAGE_OWNER.AGENT,
      sentAt: msg.sentAt || (msg.timestamp ? parseInt(msg.timestamp) * 1000 : Date.now()),
      type: MESSAGE_TYPE.TEXT,
      conversationId: messageConversationId,
      from: msg.from,
      id: msg.idWhatsapp || Date.now(), // Usar idWhatsapp como id principal
      idWhatsapp: msg.idWhatsapp
    };
  };

  // Manejo de mensajes entrantes - versión optimizada
  useEffect(() => {
    // Verificar conexión y si hay mensajes para procesar
    if (!isConnected || !messagesSocket.length || !activeConversation?.conversationid) {
      return;
    }
    
    // Filtrar mensajes relevantes para la conversación actual
    const relevantMessages = messagesSocket.filter(msg => {
      // Verificar si el mensaje es para la conversación actual
      const isForCurrentConversation = 
        msg.conversationId === activeConversation.conversationid ||
        msg.from === activeConversation.phone?.replace(/\+/g, '') ||
        activeConversation.phone?.includes(msg.from || '');
      
      // Verificar si el mensaje ya existe
      const isDuplicate = msg.idWhatsapp 
        ? storedMessages.some(m => m.idWhatsapp === msg.idWhatsapp)
        : false;
      
      return isForCurrentConversation && !isDuplicate;
    });
    
    if (!relevantMessages.length) return;
    
    // Transformar y agregar mensajes al store
    const newMessages = relevantMessages.map(msg => {
      const transformedMsg: MessageModel = {
        content: msg.content || msg.text || '',
        owner: msg.owner === 'CUSTOMER' ? MESSAGE_OWNER.CLIENT : MESSAGE_OWNER.AGENT,
        sentAt: msg.sentAt || (msg.timestamp ? parseInt(msg.timestamp) * 1000 : Date.now()),
        type: MESSAGE_TYPE.TEXT,
        conversationId: activeConversation.conversationid,
        from: msg.from || '',
        id: msg.idWhatsapp ? Number(msg.idWhatsapp) : Date.now(),
        idWhatsapp: msg.idWhatsapp || ''
      };
      
      // Manejar mensajes del cliente (para contadores de no leídos)
      if (transformedMsg.owner === MESSAGE_OWNER.CLIENT) {
        // Actualizar contador de no leídos si es necesario
        if (typeof transformedMsg.conversationId === 'number') {
          incrementUnreadCount(transformedMsg.conversationId);
          
          // Actualizar localStorage
          try {
            const unreadCounts = JSON.parse(localStorage.getItem('unreadCounts') || '{}');
            unreadCounts[transformedMsg.conversationId] = 
              (unreadCounts[transformedMsg.conversationId] || 0) + 1;
            localStorage.setItem('unreadCounts', JSON.stringify(unreadCounts));
          } catch (error) {
            console.error('Error al actualizar contador en localStorage:', error);
          }
        }
      }
      
      return transformedMsg;
    });
    
    // Agregar mensajes al store
    if (newMessages.length > 0) {
      newMessages.forEach(pushMessage);
      
      // Auto-scroll al último mensaje
      setTimeout(() => {
        if (chatWindow.current) {
          chatWindow.current.scrollTop = chatWindow.current.scrollHeight;
        }
      }, 100);
    }
  }, [messagesSocket, storedMessages, activeConversation, pushMessage, chatWindow, clearMessages, isConnected]);

  useEffect(() => {
    if (chatWindow.current) {
      chatWindow.current.addEventListener("DOMNodeInserted", (event) => {
        const target = event.currentTarget as HTMLDivElement | null
        if (target) {
          target.scroll({ top: target.scrollHeight })
        }
      })
    }
  }, [activeConversation])

  useEffect(() => {
    // Removed console.log to prevent infinite loop
    if (chatWindow.current) {
      chatWindow.current.scrollTo({ top: chatWindow.current.scrollHeight, behavior: "smooth" })
    }
  }, [storedMessages]);
  
  /**
   * Añade un mensaje al estado local y lo muestra en la interfaz
   * @param message El mensaje a añadir
   */
  const addMessage = (message: MessageModel) => {
    if (message.idWhatsapp && storedMessages.some(m => m.idWhatsapp === message.idWhatsapp)) {
      // Evitar mensajes duplicados
      return;
    }
    
    setMessages([...storedMessages, message]);
    
    // Auto-scroll al último mensaje
    setTimeout(() => {
      if (chatWindow.current) {
        chatWindow.current.scrollTop = chatWindow.current.scrollHeight;
      }
    }, 100);
  }

  // GLOBAL CIRCUIT BREAKER PATTERN
// This is a last-resort mechanism to prevent infinite API calls
const MessageFetchingManager = (() => {
  // Private state - using store for fetchedConversationIds to make it more permanent
  let isFetching = false;
  let lastFetchedId: number | null = null;
  let callCount = 0;
  let lastCallTime = 0;
  
  // Circuit breaker - limits API calls per minute
  const MAX_CALLS_PER_MINUTE = 5;
  const callTimes: number[] = [];
  
  const isCircuitOpen = () => {
    // Clear old call times
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    while (callTimes.length > 0 && callTimes[0] < oneMinuteAgo) {
      callTimes.shift();
    }
    
    // Check if we've exceeded our rate limit
    return callTimes.length >= MAX_CALLS_PER_MINUTE;
  };
  
  // Get the chat store state safely
  const getChatStore = () => {
    try {
      return useChatStore.getState();
    } catch (e) {
      console.warn('Failed to access chat store, using fallback');
      return { 
        fetchedConversationIds: new Set<number>(),
        hasConversationBeenFetched: () => false,
        markConversationFetched: () => {},
        resetConversationFetchStatus: () => {}
      };
    }
  };
  
  return {
    // Public interface
    shouldFetchMessages: (conversationId: number): boolean => {
      // Guard clauses
      if (!conversationId) return false;
      if (isFetching) return false;
      if (lastFetchedId === conversationId) return false;
      
      // Check with the chat store if we've already fetched this conversation
      const chatStore = getChatStore();
      if (chatStore.hasConversationBeenFetched(conversationId)) {
        // Already fetched, but log less to reduce console noise
        if (Math.random() < 0.01) { // Only log 1% of the time
          console.log(`Already fetched conversation ${conversationId} (stored in chat store)`);
        }
        return false;
      }
      
      if (isCircuitOpen()) {
        // Log less frequently
        if (Math.random() < 0.1) { // Only log 10% of the time
          console.warn('🛑 CIRCUIT BREAKER: Too many message fetch requests. Limiting API calls.');
        }
        return false;
      }
      
      return true;
    },
    
    markFetchStarted: (conversationId: number) => {
      isFetching = true;
      lastFetchedId = conversationId;
      callCount++;
      lastCallTime = Date.now();
      callTimes.push(lastCallTime);
    },
    
    markFetchComplete: (conversationId: number, success: boolean) => {
      isFetching = false;
      if (success) {
        // Use the chat store to mark this conversation as fetched
        const chatStore = getChatStore();
        chatStore.markConversationFetched(conversationId);
      }
    },
    
    resetForConversation: (conversationId: number) => {
      // Use the chat store to reset the fetch status for this conversation
      const chatStore = getChatStore();
      chatStore.resetConversationFetchStatus(conversationId);
    },
    
    resetAll: () => {
      // Just reset local tracking - don't clear chat store as it's meant to be persistent
      isFetching = false;
      lastFetchedId = null;
      callCount = 0;
    },
    
    getStats: () => {
      const chatStore = getChatStore();
      return {
        fetchedCount: chatStore.fetchedConversationIds.size,
        totalCalls: callCount,
        lastCallTime,
        isCircuitOpen: isCircuitOpen(),
      };
    },
  };
})();

/**
 * Fetches message data for a specific conversation - OPTIMIZED VERSION
 * Uses both the global chat store and a circuit breaker to prevent infinite API calls
 * @param conversationId - The conversation ID to fetch messages for
 */
async function fetchMesagesData(conversationId: number) {
  if (!conversationId) return;
  
  // Check chat store first - if messages for this conversation have already been fetched, skip
  const chatStore = useChatStore.getState();
  if (chatStore.hasConversationBeenFetched(conversationId)) {
    console.log(`Skipping message fetch for conversation ${conversationId} - already fetched`);
    return; // Skip fetching
  }
  
  // Double-check with our circuit breaker manager
  if (!MessageFetchingManager.shouldFetchMessages(conversationId)) {
    console.log(`Circuit breaker prevented fetch for conversation ${conversationId}`);
    return; // Skip fetching
  }
  
  // Mark that we're starting to fetch in both places
  MessageFetchingManager.markFetchStarted(conversationId);
  
  try {
    // API call with proper error handling
    console.log(`Fetching messages for conversation ${conversationId}`);
    const response = await axiosInstance.post("/message/getMessages", { conversationId });
    
    // Only process if we have valid data
    if (response?.data && Array.isArray(response.data)) {
      // Set messages directly
      setMessages(response.data);
      
      // Mark fetch as successful in both systems
      MessageFetchingManager.markFetchComplete(conversationId, true);
      chatStore.markConversationFetched(conversationId);
      
      console.log(`Successfully fetched ${response.data.length} messages for conversation ${conversationId}`);
      return;
    }
    
    // If we get here, we didn't get valid data
    MessageFetchingManager.markFetchComplete(conversationId, false);
    console.warn(`Received invalid data for conversation ${conversationId}`);
  } catch (error: any) {
    // Check if this is a canceled request from our circuit breaker
    if (error?.name === 'CanceledError' && error?.message?.includes('duplicate message fetch request')) {
      // This is expected - silently ignore but log for debugging
      console.log('Request was canceled by circuit breaker - expected behavior');
    } else {
      // This is an unexpected error
      console.warn(`Error fetching messages for conversation ${conversationId}:`, 
        error?.name || 'Unknown error');
    }
    
    MessageFetchingManager.markFetchComplete(conversationId, false);
  }
}

// EFFECT TO HANDLE ACTIVE CONVERSATION CHANGE ---
// Enhanced with circuit breaker and fetch tracking
useEffect(() => {
  if (!activeConversation?.conversationid) return;
  
  // Check if messages have already been fetched for this conversation
  const chatStore = useChatStore.getState();
  const conversationId = activeConversation.conversationid;
  
  // Only fetch messages if they haven't been fetched already
  if (!chatStore.hasConversationBeenFetched(conversationId)) {
    console.log(`Fetching messages for newly selected conversation ${conversationId}`);
    fetchMesagesData(conversationId);
  } else {
    console.log(`Skipping fetch for conversation ${conversationId} - messages already loaded`);
  }
}, [activeConversation?.conversationid]);

// Clean up when component unmounts
useEffect(() => {
  return () => {
    // Reset the MessageFetchingManager
    MessageFetchingManager.resetAll();
  };
}, []);

  // Lista de respuestas rápidas predefinidas
  const quickResponses = [
    "Hola, ¿en qué puedo ayudarte?",
    "Gracias por contactarnos.",
    "¿Podrías proporcionarnos más detalles?",
    "Estaremos en contacto pronto.",
    "Lamentamos los inconvenientes ocasionados."
  ]

  // Función para seleccionar una respuesta rápida
  const onQuickResponseSelect = (response: string) => {
    setTextContent(response)
    quickResponseOp.current?.hide()
  }

  // Estado para controlar la visibilidad del modal de transferencia
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  // Estado para la selección dentro del modal
  const [transferOption, setTransferOption] = useState<'agent' | 'group' | 'bot' | null>(null);

  const [agents, setAgents] = useState<Agent[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingTransferOptions, setLoadingTransferOptions] = useState(false);

  useEffect(() => {
    if (companyId) {
      const fetchTransferOptions = async () => {
        setLoadingTransferOptions(true);
        try {
          const [agentsResponse, groupsResponse] = await Promise.all([
            getAgents(companyId.toString()),
            getGroups(companyId.toString())
          ]);
          
          if (!agentsResponse.length) {
            showError('No se encontraron agentes disponibles');
          }
          
          if (!groupsResponse.length) {
            showError('No se encontraron grupos disponibles');
          }
          
          setAgents(agentsResponse);
          setGroups(groupsResponse);
        } catch (error) {
          console.error('Error fetching transfer options:', error);
          showError('Error al cargar opciones de transferencia. Intente nuevamente.');
          setAgents([]);
          setGroups([]);
        } finally {
          setLoadingTransferOptions(false);
        }
      };
      
      fetchTransferOptions();
    }
  }, [companyId, showError]);

  // Función para manejar la transferencia
  const handleTransfer = (type: 'agent' | 'group' | 'bot', id?: string) => {
    console.log('Transferencia de chat a:', type, id);
    // Lógica para transferir el chat
    showSuccess(`Chat transferido a ${type} ${id}`);
    // Cerrar el diálogo
    setShowTransferDialog(false);
    // Reiniciar la selección
    setTransferOption(null);
  };

  const updateBalanceAfterSendingTemplates = async (numberOfTemplates: number, costPerTemplate: number) => {
    // Validamos que tengamos un ID de empresa válido antes de intentar decrementar el saldo
    if (!companyId) {
      console.error('No se pudo decrementar el saldo: ID de empresa no disponible');
      return;
    }
    
    const totalCost = numberOfTemplates * costPerTemplate;
    try {
      // Determinamos el tipo de plantilla basado en selectedTemplate
      const templateType = selectedTemplate?.categoryTemplateWhatsapp || 'MARKETING';
      const templateDestination = activeConversation?.phone || '';
      
      // Llamamos al servicio con todos los parámetros requeridos
      const updatedBalance = await BalanceService.decrementBalance(
        companyId, 
        totalCost,
        templateType,
        templateDestination
      );
      
      console.log(`Saldo actualizado después de enviar plantilla ${templateType}: ${updatedBalance.balanceUSD} USD`);
    } catch (error) {
      // Manejamos errores específicos como saldo insuficiente
      if (error instanceof Error && error.message.includes('Saldo insuficiente')) {
        showError('No hay saldo suficiente para enviar esta plantilla. Por favor recargue su saldo.');
      } else {
        console.error('Error al actualizar el saldo:', error);
      }
    }
  };

  // Envía un mensaje de plantilla usando la función del servicio
  const onSendTemplateMessage = async () => {
    if (!selectedTemplate) {
      showError("Seleccione una plantilla")
      return
    }

    console.log("selectedTemplate", selectedTemplate)
    // Verifica que el mensaje no esté vacío
    const accessToken = `${actualNumberOfMaintanceSelected?.IdAccountWB}`
    const recipientPhone = `+${activeConversation?.phone}`
    const idNumberFromSendMessage = `${actualNumberOfMaintanceSelected?.idNumberPhone}`
    const companyId = dataToken?.user.company.companyId

          // Validar que el ID y las iniciales de la empresa existan
          if (!companyId || !dataToken?.user?.company?.name) {
            showError("No se pudo obtener la información de la empresa. Por favor, intenta nuevamente.")
            return
          }
          
          try {
            // Llama al servicio para enviar el template
            const ok = await sendTemplateMessage(
              recipientPhone,
              accessToken,
              idNumberFromSendMessage,
              selectedTemplate.name,
              dataToken!.user.company.companyId!,
              dataToken!.user.company.name.substring(0, 2)
            )  
            if (ok) {
        showSuccess("Mensaje enviado")
        // Actualizar el saldo después de enviar la plantilla
        await updateBalanceAfterSendingTemplates(1, 0.0125);
      }
    } catch (error: any) {
      // Maneja el error en caso de token expirado u otros
      if ('code' in error && error.code === 190) {
        showError("Token de acceso expirado")
        onClickAction()
        return
      }
      
      // Manejo general de errores
      let errorMessage = "Error al enviar la plantilla";
      
      if (error && typeof error === 'object') {
        if ('message' in error && error.message) {
          errorMessage += ": " + error.message;
        } else if ('error' in error && error.error && 'message' in error.error) {
          errorMessage += ": " + error.error.message;
        } else if ('statusText' in error && error.statusText) {
          errorMessage += ": " + error.statusText;
        } else {
          // Si no hay un mensaje específico, mostrar el objeto como JSON
          try {
            errorMessage += ": " + JSON.stringify(error);
          } catch (e) {
            // Si no se puede convertir a JSON, mostrar el error original
            console.error("Error completo:", error);
          }
        }
      } else if (error) {
        // Si el error es una cadena u otro tipo primitivo
        errorMessage += ": " + error;
      }
      
      showError(errorMessage);
      console.error("Error detallado al enviar plantilla:", error);
    }
  }

  const { postData: postMessage } = usePostRequest()
  // Función que envía un mensaje de texto simple
  const handleSendMessage = async (textInput?: string) => {
    // Verifica que el mensaje no esté vacío
    if ((textContent.trim() === "") && !textInput) {
      showError("El mensaje no puede estar vacio")
    } else {
      if (dataToken) {
        if (!activeConversation?.conversationid) {
          showError("No se ha seleccionado una conversación")
          return
        }
        setTextContent("")
        const messageTemporal: MessageModel = {
          content: textInput ?? textContent,
          owner: MESSAGE_OWNER.AGENT,
          sentAt: new Date().getTime(),
          type: MESSAGE_TYPE.TEXT,
          conversationId: activeConversation?.conversationid,
          from: activeConversation.phone,
          id: 0,
          received: false
        }
        if (!messageTemporal?.from) return null

        // Validación de parámetros críticos antes de enviar
        if (!actualNumberOfMaintanceSelected) {
          showError("No hay un número de mantenimiento seleccionado. Por favor, seleccione un número.");
          return;
        }

        if (!actualNumberOfMaintanceSelected.IdAccountWB) {
          showError("El token de acceso para WhatsApp Business API no está configurado.");
          console.error("IdAccountWB vacío o no definido", actualNumberOfMaintanceSelected);
          return;
        }

        if (!actualNumberOfMaintanceSelected.idNumberPhone) {
          showError("El ID del teléfono remitente no está configurado.");
          console.error("idNumberPhone vacío o no definido", actualNumberOfMaintanceSelected);
          return;
        }

        // Log para depuración
        console.log("Datos del número de mantenimiento:", {
          IdAccountWB: actualNumberOfMaintanceSelected.IdAccountWB,
          idNumberPhone: actualNumberOfMaintanceSelected.idNumberPhone,
          destinatario: messageTemporal.from
        });

        try {
          const result = await sendPlainMessage(
            messageTemporal?.from ?? "",
            messageTemporal.content,
            actualNumberOfMaintanceSelected.IdAccountWB,
            actualNumberOfMaintanceSelected.idNumberPhone
          )
          messageTemporal.idWhatsapp = result.messages[0].id
          setMessages([...storedMessages, messageTemporal])
          postMessage("/message", messageTemporal)
        } catch (error: any) {
          let errorMessage = "Error al enviar el mensaje";
        
          if (error && typeof error === 'object') {
            // Si el error tiene una propiedad message o error.error.message
            if ('message' in error && error.message) {
              errorMessage += ": " + error.message;
            } else if ('error' in error && error.error && 'message' in error.error) {
              errorMessage += ": " + error.error.message;
            } else if ('statusText' in error && error.statusText) {
              errorMessage += ": " + error.statusText;
            } else {
              // Si no hay un mensaje específico, mostrar el objeto como JSON
              try {
                errorMessage += ": " + JSON.stringify(error);
              } catch (e) {
                // Si no se puede convertir a JSON, mostrar el error original
                console.error("Error completo:", error);
              }
            }
          } else if (error) {
            // Si el error es una cadena u otro tipo primitivo
            errorMessage += ": " + error;
          }
        
          showError(errorMessage);
          console.error("Error detallado al enviar mensaje:", error);
        }
      }
    }
  }

  // Maneja evento de tecla en el Input
  const handleInputTextKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSendMessage()
  }

  // Agrega un emoji al mensaje actual
  const onEmojiSelect = (emoji: string) => {
    setTextContent(prev => prev + emoji)
  }

  // Parsea el timestamp a un formato de hora legible
  const parseDate = (timestamp: number) => {
    const date = new Date(+timestamp)
    const hours = date.getHours() // Hora en la zona horaria local
    const minutes = date.getMinutes() // Minutos en la zona horaria local
    return `${hours}:${minutes.toString().padStart(2, "0")}`
  }

  const { setDialogTransfer, setActiveConversation, deleteConversation, incrementUnreadCount } = useChatStore()
  // Abre el diálogo para transferir el chat
  const transferChat = () => {
    // Usar el nuevo estado local
    setShowTransferDialog(true);
    console.log('Abriendo modal de transferencia de chat');
  }

  /**
   * Finaliza la conversación actual
   * @description Cierra la conversación activa y la elimina de la lista de conversaciones activas
   */
  const finishConversation = () => {
    // Verificar que hay una conversación activa con un ID válido
    if (!activeConversation?.conversationid) {
      showError('No hay una conversación activa para finalizar');
      return;
    }
    
    // Mostrar diálogo de confirmación
    confirmDialog({
      message: '¿Está seguro que desea finalizar esta conversación?',
      header: 'Finalizar conversación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, finalizar',
      rejectLabel: 'Cancelar',
      accept: async () => {
        try {
          // En lugar de crear un Conversation completo, usamos type assertion
          // ya que deleteConversation solo necesita el conversationid
          const conversationToDelete = {
            conversationid: activeConversation.conversationid
          } as Conversation;
          
          // 1. Eliminar la conversación del store
          deleteConversation(conversationToDelete);
          
          // 2. Limpiar la conversación activa
          setActiveConversation(null);
          
          // 3. Limpiar los mensajes
          setMessages([]);
          
          // 4. Mostrar mensaje de éxito
          showSuccess('Conversación finalizada correctamente');
          
        } catch (error) {
          console.error('Error al finalizar la conversación:', error);
          showError('No se pudo finalizar la conversación. Por favor, intente nuevamente.');
        }
      },
      reject: () => {
        // No hacer nada si el usuario cancela
      }
    });
  }

  // Mensajes a mostrar con filtro de búsqueda si es necesario
  const displayedMessages = useMemo(() => {
    if (!activeConversation?.conversationid) return [];
    
    // Filtrar mensajes de la conversación activa
    const activeConversationMessages = storedMessages.filter(
      msg => msg.conversationId === activeConversation.conversationid
    );
    
    // Ordenar por fecha
    const sortedMessages = [...activeConversationMessages].sort(
      (a, b) => (a.sentAt || 0) - (b.sentAt || 0)
    );
    
    // Aplicar filtro de búsqueda si existe
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      return sortedMessages.filter(msg => 
        msg.content?.toLowerCase().includes(searchLower)
      );
    }
    
    return sortedMessages;
  }, [storedMessages, searchText, activeConversation?.conversationid]);
  
  // Removed message logging effect to prevent infinite loop

  // Removed debug logging effect to prevent infinite loop

  return (
    <React.Fragment>
      <div className="flex flex-column h-full">
        <div className="flex align-items-center border-bottom-1 surface-border p-3 lg:p-6">
          <div className="relative flex align-items-center mr-3">
            <img
              src="/demo/images/avatar/circle/userwebp.webp"
              alt={"No Econtrada"}
              className="w-4rem h-4rem border-circle shadow-4"
            />
          </div>
          <div className="mr-2">
            <span className="text-900 font-semibold block">
              +{activeConversation?.indicative + " " + activeConversation?.destination_number}
            </span>
          </div>
          <div className="flex align-items-center ml-auto">
            <Button
              onClick={(event) => searchOp.current?.toggle(event)}
              type="button"
              icon="pi pi-search"
              rounded
              outlined
              severity="secondary"
              className="mr-2"
              tooltip="Buscar mensajes"
              tooltipOptions={{ position: 'top' }}
            ></Button>
            <Button
              onClick={() => setShowTransferDialog(true)}
              type="button"
              icon="pi pi-sign-out"
              rounded
              outlined
              severity="secondary"
              tooltip="Transferir chat"
              tooltipOptions={{ position: 'top' }}
            ></Button>
          </div>
          <div>
            <Message className="ml-3" text="Para iniciar una conversacion debe iniciar con una plantilla"/>
          </div>
        </div>
        <div
          ref={chatWindow}
          className="p-3 md:px-4 lg:px-6 lg:py-4 mt-2 overflow-y-auto"
          style={{ maxHeight: "53vh" }}
        >
          {/* Filtramos los mensajes si hay un término de búsqueda */}
          {displayedMessages
            .map((message : MessageModel, i : number) => {
              // Log de mensaje renderizado
              console.debug('[ChatBox] Renderizando mensaje:', {
                id: message.id,
                owner: message.owner,
                conversationId: message.conversationId,
                hasContent: !!message.content
              });
            return (
              <div key={i}>
                {message.owner !== MESSAGE_OWNER.CLIENT
                  ? (
                    <div className="grid grid-nogutter mb-4">
                      <div className="col mt-3 text-right">
                        <span
                          className="inline-block font-medium relative
                          white-space-normal border-round"
                          style={{
                            wordBreak: "break-word",
                            maxWidth: "80%",
                            minWidth: "120px",
                            padding: "12px",
                            paddingRight: "85px", // Aumentado a 85px para dar más espacio a la hora/check
                            boxSizing: "border-box",
                            textAlign: "left", // Alinear el texto a la izquierda dentro de la burbuja
                            backgroundColor: "#673AB7", // Morado oscuro para mensajes del agente
                            color: "#ffffff", // Texto blanco para mejor contraste
                            boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                            position: "relative",  // Asegurar que la posición es relativa para el posicionamiento interno
                            overflow: "visible"     // Permitir que los elementos hijos queden visibles fuera del contenedor
                          }}
                        >
                          {message.type !== MESSAGE_TYPE.TEXT ? (
                            <MediaMessage message={message} parseDate={parseDate} />
                          ) : (
                            message.content
                          )}
                          <div className="absolute right-0 top-50 text-white text-xs px-2 flex align-items-center"
                            style={{
                              transform: "translateY(-50%)",
                              height: "20px",
                              whiteSpace: "nowrap",
                              zIndex: 2,
                              right: "8px",          // Posicionamiento más preciso
                              backgroundColor: "rgba(103, 58, 183, 0.8)", // Fondo ligeramente transparente que coincide con el mensaje
                              borderRadius: "10px",  // Borde redondeado para separación visual
                              padding: "2px 6px"     // Espacio interno para mejorar legibilidad
                            }}>
                            {parseDate(message.sentAt)}{" "}
                            <i className="pi pi-check ml-1 text-green-400"></i>
                          </div>
                        </span>
                      </div>
                    </div>
                  )
                  : (
                    <div className="grid grid-nogutter mb-4">
                      <div className="mr-3 mt-1">
                        <img
                          src="/demo/images/avatar/circle/userwebp.webp"
                          alt={"Imagen no encontrada"}
                          className="w-3rem h-3rem border-circle shadow-4"
                        />
                      </div>
                      <div className="col mt-3">
                        <p className="text-900 font-semibold mb-3">
                          +{activeConversation?.indicative + " " + activeConversation?.destination_number}
                        </p>
                        <span
                          className="inline-block font-medium relative
                          white-space-normal border-round"
                          style={{
                            wordBreak: "break-word",
                            maxWidth: "80%",
                            minWidth: "120px",
                            padding: "12px",
                            paddingRight: "85px", // Aumentado a 85px para dar más espacio a la hora/check
                            boxSizing: "border-box",
                            backgroundColor: "#EDE7F6", // Morado claro para mensajes del cliente
                            color: "#5E35B1", // Texto morado oscuro para contraste
                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                            position: "relative",  // Asegurar que la posición es relativa para el posicionamiento interno
                            overflow: "visible"     // Permitir que los elementos hijos queden visibles fuera del contenedor
                          }}
                        >
                          {message.type !== MESSAGE_TYPE.TEXT ? (
                            <MediaMessage message={message} parseDate={parseDate} />
                          ) : (
                            message.content
                          )}
                          <div className="absolute right-0 top-50 text-600 text-xs px-2 flex align-items-center"
                            style={{
                              transform: "translateY(-50%)",
                              height: "20px",
                              whiteSpace: "nowrap",
                              zIndex: 2,
                              right: "8px",          // Posicionamiento más preciso
                              backgroundColor: "rgba(237, 231, 246, 0.9)", // Fondo ligeramente transparente que coincide con el mensaje
                              borderRadius: "10px",  // Borde redondeado para separación visual
                              padding: "2px 6px"     // Espacio interno para mejorar legibilidad
                            }}>
                            {parseDate(message.sentAt)}{" "}
                            <i className="pi pi-check ml-1 text-green-400"></i>
                          </div>
                        </span>
                      </div>
                    </div>
                    )}
              </div>
            )
          })}
        </div>
        <div className="p-3 md:p-4 lg:p-6 flex flex-column sm:flex-row
        align-items-center mt-auto border-top-1 surface-border gap-3">
          <Button
            className="justify-content-center text-xl"
            severity="secondary"
            onClick={(event) => op.current?.toggle(event)}
          >
            😀
          </Button>
          {/* Componente de adjuntar archivos */}
          <FileAttachment
            activeConversation={activeConversation}
            dataToken={dataToken}
            actualNumberOfMaintanceSelected={actualNumberOfMaintanceSelected}
            showError={showError}
            showSuccess={showSuccess}
            onLocalMessage={(msg) => {
              // Añadir el mensaje localmente para mostrar en UI inmediatamente
              addMessage(msg);
            }}
          />
          <Button
            className="justify-content-center"
            severity="secondary"
            icon="pi pi-bolt"
            onClick={(event) => quickResponseOp.current?.toggle(event)}
            tooltip="Respuestas rápidas"
            tooltipOptions={{ position: 'top' }}
          />
          <InputText
            id="message"
            type="text"
            placeholder="Escribe tu mensaje..."
            className="flex-1 w-full sm:w-auto border-round"
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            onKeyDown={handleInputTextKeyDown}
          />
          <div className="flex w-full sm:w-auto gap-3">
            <Button
              label="Enviar"
              icon="pi pi-send"
              className="w-full sm:w-auto"
              type="button"
              onClick={() => handleSendMessage()}></Button>
            {/* <Button
              label="Plantilla"
              icon="pi pi-send"
              type="button"
              className="w-full sm:w-auto"
              onClick={(event) => templateOp.current?.toggle(event)}></Button> */}
            
            <Button
              label="Finalizar"
              icon="pi pi-phone-slash"
              type="button"
              severity="danger"
              outlined
              className="w-full sm:w-auto"
              onClick={finishConversation}
              tooltip="Finalizar conversación"
              tooltipOptions={{ position: 'top' }}
              disabled={!activeConversation}></Button>
          </div>
        </div>
      </div>

      <OverlayPanel ref={op} className="w-full sm:w-30rem">
        {emojis.map((emoji, i) => {
          return (
            <Button
              key={i}
              onClick={() => {
                op.current?.hide()
                onEmojiSelect(emoji)
              }}
              type="button"
              label={emoji}
              text
              className="p-2 text-2xl"
            ></Button>
          )
        })}
      </OverlayPanel>
      <OverlayPanel ref={templateOp}
        className="w-full sm:w-30rem">
        <div className="flex flex-row">
            <Dropdown
                id={"dataTemplate"}
                value={selectedTemplate}
                optionLabel="name"
                filter
                filterBy="name"
                options={dataTemplates}
                placeholder={"Seleccione su Plantilla"}
                onChange={(e) => {
                  setSelectedTemplate(e.value)
                }}
            />
            <Button
            label="Enviar Plantilla"
            icon="pi pi-send"
            type="button"
            className="p-button p-mt-2 ml-2"
            onClick={onSendTemplateMessage}
            ></Button>
        </div>
      </OverlayPanel>
      <OverlayPanel ref={quickResponseOp} className="w-full sm:w-30rem">
        <div className="p-3">
          <h5 className="m-0 mb-3">Respuestas rápidas</h5>
          <div className="flex flex-column gap-2">
            {quickResponses.map((response, i) => (
              <Button
                key={i}
                onClick={() => onQuickResponseSelect(response)}
                label={response}
                text
                className="text-left p-2 hover:surface-200 border-round"
              />
            ))}
          </div>
        </div>
      </OverlayPanel>
      
      {/* Panel de búsqueda */}
      <OverlayPanel ref={searchOp} className="p-0 w-full sm:w-25rem">
        <div className="p-3">
          <h5 className="mt-0 mb-3">Buscar mensajes</h5>
          <div className="p-inputgroup">
            <InputText 
              placeholder="Escribe para buscar..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full"
            />
            <Button
              icon="pi pi-times"
              className="p-button-danger"
              onClick={() => setSearchText('')}
              disabled={!searchText}
              tooltip="Limpiar búsqueda"
              tooltipOptions={{ position: 'top' }}
            />
          </div>
          {searchText && (
            <small className="block text-600 mt-2">
              {storedMessages.filter(msg => 
                msg.content.toLowerCase().includes(searchText.toLowerCase())
              ).length} resultado(s) encontrado(s)
            </small>
          )}
        </div>
      </OverlayPanel>

      {/* Dialog de transferencia de chat - implementación directa */}
      <Dialog
        header="Transferencia de chat"
        visible={showTransferDialog}
        onHide={() => setShowTransferDialog(false)}
        style={{ width: '50vw', maxWidth: '800px' }}
        breakpoints={{ '960px': '90vw', '641px': '95vw' }}
      >
        {loadingTransferOptions ? (
          <div className="flex justify-content-center align-items-center" style={{ height: '200px' }}>
            <i className="pi pi-spinner pi-spin" style={{ fontSize: '2rem' }}></i>
          </div>
        ) : (
          !transferOption ? (
            <div className="flex flex-column gap-2" style={{ padding: '0 1.5rem' }}>
              <Button
                label="A un agente"
                icon="pi pi-user"
                className="p-button-outlined"
                style={{ 
                  padding: '0 1rem',
                  width: '80%',
                  margin: '0 auto'
                }}
                onClick={() => setTransferOption('agent')}
              />
              <Button
                label="A un grupo de agentes"
                icon="pi pi-users"
                className="p-button-outlined"
                style={{ 
                  padding: '0 1rem',
                  width: '80%',
                  margin: '0 auto'
                }}
                onClick={() => setTransferOption('group')}
              />
              <Button
                label="A un bot"
                icon="pi pi-robot"
                className="p-button-outlined"
                style={{ 
                  padding: '0 1rem',
                  width: '80%',
                  margin: '0 auto',
                  opacity: 0.6
                }}
                disabled
              />
            </div>
          ) : (
            <div className="flex flex-column gap-3">
              <div className="flex align-items-center gap-2">
                <Button
                  icon="pi pi-arrow-left"
                  className="p-button-text"
                  onClick={() => setTransferOption(null)}
                />
                <h3>{transferOption === 'agent' ? 'Seleccione un agente' : 'Seleccione un grupo'}</h3>
              </div>
              
              {(transferOption === 'agent' ? agents : groups).map(item => (
                <div
                  key={item.id}
                  className="p-3 border-round border-1 surface-border cursor-pointer hover:surface-hover"
                  onClick={() => {
                    handleTransfer(transferOption, item.id);
                  }}
                >
                  <div className="flex align-items-center gap-3">
                    <i className={transferOption === 'agent' ? 'pi pi-user' : 'pi pi-users'}></i>
                    <div>
                      <div className="font-medium">{item.name}</div>
                      {transferOption === 'agent' && 'status' in item && (
                        <div className="text-sm">Estado: {(item as Agent).status}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </Dialog>
    </React.Fragment>
  )
}
