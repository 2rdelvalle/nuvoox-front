"use client"
import ConversationCard from "@/shared/components/chat/ConversationCard"
import { useInitializeUserFromToken } from "@/shared/customHooks/useInitializeUserFromToken"
import { useSWRFetch } from "@/shared/customHooks/useSWRFetch"
import { useSWRRequest } from "@/shared/customHooks/useSWRRequest"
import { NumbersOfMaintanceCaratule } from "@/shared/models"
import { Conversation, ConversationCaratule } from "@/shared/models/conversation/conversation.model"
import type { Page } from "@/types"
import dynamic from "next/dynamic"
import { Avatar } from "primereact/avatar"
import { Badge } from "primereact/badge"
import { Tooltip } from "primereact/tooltip"
import { BlockUI } from "primereact/blockui"
import { Dropdown } from "primereact/dropdown"
import { InputText } from "primereact/inputtext"
import React, { useEffect, useState, useMemo } from "react"
import { Controller, useForm } from "react-hook-form"
import { ChatBox } from "./chatbox/chatbox"
import SidebarConversation from "./sidebarConversation/sidebar-conversation"
import { useChatStore } from "./store/chat-store"
import { useMessageStore } from "./store/message-store"
import { ConfirmDialog } from "primereact/confirmdialog"
import { axiosInstance } from "@/shared/instances/axios-instance"
import { MessageModel } from "@/shared/models/conversation/messages.model"

const NewNumber = dynamic(() => import("./modal/new-number"), { ssr: false })
const DialogTransfer = dynamic(() => import("./dialogTransfer/dialog-transfer"), { ssr: false })

// Interfaz para las props del componente ChatSidebar
interface ChatSidebarProps {
  typeMenu: string;
  setTypeMenu: (type: string) => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ typeMenu, setTypeMenu }) => {
  const {
    user: userStore,
    setDialogNewNumber,
    conversations,
    setActualNumberOfMaintanceSelected,
    setConversations,
    conversationsNotAssigned,
    setConversationsNotAssigned,
    resetAll
  } = useChatStore()

  // STORES
  const { resetAll: resetAllMessages } = useMessageStore()

  // HOOKS
  const [userName, setUserName] = useState<string>("") 
  
  // Cálculo de mensajes no leídos para la insignia
  const unreadMessagesCount = useMemo(() => {
    // Sumar todos los mensajes no leídos de todas las conversaciones
    return conversations.reduce((total, conversation) => {
      return total + (conversation.unreadCount || 0);
    }, 0);
  }, [conversations])
  const [userAvatar, setUserAvatar] = useState<string>("")

  // trae los numeros de la empresa que maneja el ajente
  const { data: numbersOfMaintance } = useSWRFetch<NumbersOfMaintanceCaratule[]>(
    userStore && userStore.userId ? `/users/numbers/${userStore.userId}` : ""
  )

  const { fetchData, data: conversationsFetch, loading } = useSWRRequest<Conversation[]>()
  const { fetchData: fetchDataConversationsNotAssigned, data: conversationsNotAssignedFetch } =
    useSWRRequest<Conversation[]>()

  async function getDataConversation (numberToFind? : string) {
    if (!userStore || !userStore.userId) {
      console.warn('No se puede obtener datos de conversación: userId no disponible')
      return
    }
    fetchData(`/conversation/getConversationsCaratule/${userStore.userId}/${numberToFind}`)
  }
  async function getDataConversationNotAssigned (numberToFind? : string) {
    if (!numberToFind) {
      console.warn('No se puede obtener datos de conversación no asignada: número no disponible')
      return
    }
    fetchDataConversationsNotAssigned(`/conversation/getConversationsCaratuleNotAssigned/${numberToFind}`)
  }

  // Inicializar react-hook-form para el dropdown
  const { control, watch } = useForm<{ actualNOM: NumbersOfMaintanceCaratule | null }>({
    defaultValues: { actualNOM: null }
  })

  const selectedNumber = watch("actualNOM")

  // Verificar si el número seleccionado tiene configuradas las credenciales de WhatsApp Business
  const isWhatsAppConfigured = useMemo(() => {
    if (!selectedNumber) return false;
    return !!selectedNumber.IdAccountWB && !!selectedNumber.idNumberPhone;
  }, [selectedNumber])

  // Efecto para disparar la consulta al cambiar el número seleccionado
  useEffect(() => {
    if (selectedNumber?.number && userStore && userStore.userId) {
      // Limpia las conversaciones anteriores para evitar datos mezclados
      resetAll()
      resetAllMessages()
      setActualNumberOfMaintanceSelected(selectedNumber)
      fetchDataConversationAll(selectedNumber.number)
      
      // Verificar si el número seleccionado tiene configuración de WhatsApp
      if (!selectedNumber.IdAccountWB || !selectedNumber.idNumberPhone) {
        console.warn('¡Configuración de WhatsApp incompleta!', {
          número: selectedNumber.number,
          IdAccountWB: selectedNumber.IdAccountWB,
          idNumberPhone: selectedNumber.idNumberPhone
        });
      }
    }
  }, [selectedNumber?.number, userStore?.userId])

  const fetchDataConversationAll = async (param : string) => {
    if (param) {
      await getDataConversation(param)
      await getDataConversationNotAssigned(param)
    }
  }

  // Efecto para actualizar el estado cuando llegan los datos
  useEffect(() => {
    if (conversationsFetch && conversationsFetch.length > 0) {
      setConversations(conversationsFetch)
    }
    if (conversationsNotAssignedFetch && conversationsNotAssignedFetch.length > 0) {
      setConversationsNotAssigned(conversationsNotAssignedFetch)
    }
    setConversationsNotAssigned(conversationsNotAssignedFetch || [])
  }, [conversationsFetch, conversationsNotAssignedFetch]
  )

  // Inicializar usuario desde token (setea el userId en el store)
  useInitializeUserFromToken()

  // Efecto para obtener el nombre de usuario del localStorage
  // Efecto para cargar datos iniciales cuando el userId está disponible
  useEffect(() => {
    if (userStore && userStore.userId) {
      console.log('userId disponible, cargando datos iniciales:', userStore.userId)
      // Aquí podríamos cargar datos iniciales si es necesario
    }
  }, [userStore?.userId])

  useEffect(() => {
    // Intentar obtener el nombre de usuario del localStorage
    const getUserInfo = () => {
      try {
        // Priorizar el nombre del usuario desde el store (que viene del token JWT)
        if (userStore && userStore.name) {
          setUserName(userStore.name);
          // No hay avatar en UserCaratule, usaremos el ícono genérico
          setUserAvatar("");
          return;
        }
        
        // Si no está en el store, intentar obtenerlo del localStorage
        const userDataString = localStorage.getItem('userData');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          setUserName(userData.name || 'Usuario');
          // Solo establecemos el avatar si está disponible
          setUserAvatar(userData.avatar || "");
        } else {
          // Fallback a un valor por defecto
          setUserName('Usuario');
          setUserAvatar("");
        }
      } catch (error) {
        console.error('Error al obtener datos del usuario:', error);
        setUserName('Usuario');
        setUserAvatar("");
      }
    };

    getUserInfo();
  }, [userStore]);

  // Efecto para cargar automáticamente las tarjetas de contacto al iniciar la página
  useEffect(() => {
    // Resetear primero el estado para evitar datos mezclados
    resetAll()
    
    // Establecer modo "all" para mostrar todos los contactos
    setTypeMenu("all")
    
    // Cargar automáticamente el primer número disponible y sus conversaciones
    if (numbersOfMaintance && numbersOfMaintance.length > 0 && userStore?.userId) {
      const firstNumber = numbersOfMaintance[0];
      
      // Establecer directamente el número seleccionado en el store
      
      // Establecer el número seleccionado y cargar sus conversaciones
      setActualNumberOfMaintanceSelected(firstNumber);
      
      // Cargar todas las conversaciones de este número
      if (firstNumber.number) {
        fetchDataConversationAll(firstNumber.number);
      }
    }
  }, [numbersOfMaintance, userStore?.userId])

  return (
    <React.Fragment>
      <style jsx global>{`
        /* Estilos específicos para la vista de WhatsApp */
        body.whatsapp-view .layout-container {
          --sidebar-width: 280px;
          --additional-padding: 20px;
          --total-offset: calc(var(--sidebar-width) + var(--additional-padding));
        }
        
        /* Sidebar siempre visible y fijo a la izquierda */
        body.whatsapp-view .layout-container .layout-sidebar {
          position: fixed !important;
          left: 0 !important;
          top: 0 !important;
          height: 100% !important;
          width: var(--sidebar-width) !important;
          z-index: 999 !important;
        }
        
        /* Contenido principal siempre a la derecha del sidebar con padding adicional */
        body.whatsapp-view .layout-content-wrapper {
          margin-left: var(--total-offset) !important;
          width: calc(100% - var(--total-offset)) !important;
          position: relative !important;
          z-index: 1000 !important;
        }
        
        /* Aseguramos que los elementos del header y filtros estén correctamente posicionados */
        body.whatsapp-view .agent-profile,
        body.whatsapp-view .filter-buttons,
        body.whatsapp-view .header-container,
        body.whatsapp-view .filter-container,
        body.whatsapp-view .agent-info-container,
        body.whatsapp-view .conversation-container {
          position: relative !important;
          z-index: 1001 !important;
          padding-left: 20px !important;
          box-sizing: border-box !important;
        }
        
        /* Mejoramos la sección del nombre del agente - en una sola fila */
        body.whatsapp-view .agent-profile {
          padding: 15px 20px !important;
          margin-top: 15px !important;
          margin-bottom: 35px !important;
          margin-left: 25px !important;
          margin-right: 25px !important;
          background-color: var(--surface-card) !important;
          border-radius: 8px !important;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05) !important;
        }
        
        body.whatsapp-view .agent-profile .avatar {
          margin-right: 15px !important;
          border: 2px solid var(--primary-color) !important;
          flex-shrink: 0 !important;
          width: 3.5rem !important;
          height: 3.5rem !important;
        }
        
        body.whatsapp-view .agent-profile .avatar {
          width: 3.8rem !important;
          height: 3.8rem !important;
          border: 2px solid var(--primary-color) !important;
        }
        
        body.whatsapp-view .agent-status .status-indicator {
          display: inline-block !important;
          width: 8px !important;
          height: 8px !important;
          border-radius: 50% !important;
          background-color: #4CAF50 !important;
        }
        
        body.whatsapp-view .agent-name {
          font-size: 0.9rem !important;
          font-weight: 600 !important;
          color: var(--text-color) !important;
          margin-bottom: 0 !important;
          white-space: nowrap !important;
        }
        
        body.whatsapp-view .agent-status {
          font-size: 0.8rem !important;
          color: var(--text-color-secondary) !important;
          display: flex !important;
          align-items: center !important;
          white-space: nowrap !important;
        }
        
        body.whatsapp-view .agent-status .status-indicator {
          width: 6px !important;
          height: 6px !important;
          border-radius: 50% !important;
          background-color: #4CAF50 !important;
          margin-right: 4px !important;
          display: inline-block !important;
        }
        
        /* Ajustamos el contenido principal */
        body.whatsapp-view .layout-content {
          width: 100% !important;
          margin-left: 0 !important;
          padding-left: 0 !important;
        }
        
        /* Eliminamos las transiciones para evitar problemas de alineación */
        body.whatsapp-view .layout-container .layout-sidebar,
        body.whatsapp-view .layout-content-wrapper {
          transition: none !important;
        }
        
        /* Aseguramos que el sidebar no se oculte */
        body.whatsapp-view .layout-container .layout-sidebar {
          transform: none !important;
          opacity: 1 !important;
        }
        
        /* Ajustamos los márgenes de los elementos internos */
        body.whatsapp-view .card {
          margin-left: 0 !important;
          width: 100% !important;
        }
        
        /* Eliminamos el efecto hover del menú */
        body.whatsapp-view .layout-menu-container .layout-menuitem-root-text:hover,
        body.whatsapp-view .layout-menu-container a:hover,
        body.whatsapp-view .layout-menu-container li:hover,
        body.whatsapp-view .layout-menu-container .layout-menuitem-root-text:focus,
        body.whatsapp-view .layout-menu-container a:focus {
          background-color: transparent !important;
          color: inherit !important;
          transform: none !important;
          transition: none !important;
        }
        
        /* Eliminamos cualquier animación o transición en el menú */
        body.whatsapp-view .layout-menu-container * {
          transition: none !important;
          animation: none !important;
        }
      `}</style>
      
      <BlockUI blocked={loading} fullScreen={true} />
      
      {/* Fila del Agente con Avatar - En una sola fila */}
      <div className="agent-profile flex align-items-center mt-3 mx-4 pl-5" style={{ marginLeft: "2.5rem" }}>
        <div className="mr-3">
          {userAvatar ? (
          <Avatar
            image={userAvatar}
            shape="circle"
            className="avatar"
            size="large"
          />
        ) : (
          <Avatar
            icon="pi pi-user"
            shape="circle"
            className="avatar"
            size="large"
          />
        )}
        </div>
        <div className="flex flex-column">
          <span className="agent-name font-bold text-base mb-1">{userName}</span>
          <span className="agent-status flex align-items-center">
            <span className="status-indicator mr-1"></span>
            <span>En línea</span>
          </span>
          
          {/* Muestra todos los números asignados al agente */}
          {numbersOfMaintance && numbersOfMaintance.length > 0 && (
            <div className="agent-numbers mt-2">
              <span className="text-xs text-500 block mb-1">Números asignados:</span>
              <ul className="p-0 m-0 list-none">
                {numbersOfMaintance.map((num, index) => (
                  <li key={index} className="text-xs flex align-items-center mb-1">
                    <i className="pi pi-phone mr-1 text-xs" />
                    <span>{num.number}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      </div>
      
      {/* Línea divisoria que abarca todo el ancho del layout */}
      <div className="border-top-1 surface-border my-3" style={{ width: "100vw", marginLeft: "-1rem", marginRight: "-1rem" }}></div>
      
      <div className="flex flex-column align-items-center border-bottom-1 surface-border p-3 pt-2 mt-2 mb-3" style={{ paddingLeft: "2.5rem" }}>
        <div className="flex gap-4 justify-content-center">
          {[
            { label: "Disponibles", icon: "pi pi-check", valueBadge: conversations.length },
            { label: "En Conversacion", icon: "pi pi-comments", valueBadge: conversations.length },
            { label: "Mensajes Pendientes", icon: "pi pi-clock", valueBadge: conversationsNotAssigned.length, tooltip: "Mensajes sin asignar" },
            { label: "Nuevo", icon: "pi pi-user-plus", isClickable: true, tooltip: "Iniciar conversación" }
          ].map(({ label, icon, isClickable, valueBadge, tooltip }, i) => (
            <div
              key={i}
              className={"flex flex-column align-items-center cursor-pointer hover-scale"}
              onClick={isClickable ? () => {
                // Mostrar las tarjetas de contacto inmediatamente sin necesidad de agregar un contacto
                setTypeMenu("all"); // Asegurar que estamos en vista "Todos"
                // También abrimos el diálogo por si necesitan agregar un nuevo contacto
                setDialogNewNumber();
              } : undefined}
              title={tooltip} // HTML tooltip básico
            >
              <div className="avatar-wrapper" data-pr-tooltip={tooltip} data-pr-position="top">
                <Avatar 
                  icon={icon} 
                  className="mb-1 p-overlay-badge"
                >
                  {
                      valueBadge !== undefined && (
                          <Badge value={valueBadge} />
                      )
                  }
                </Avatar>
                <Tooltip target=".avatar-wrapper" />
              </div>
              <label className="text-center text-sm">{label}</label>
            </div>
          ))}
        </div>
        {/*<div className="flex gap-2 mt-4">
          <Controller
            control={control}
            name="actualNOM"
            render={({ field }) => (
              <Dropdown
                {...field}
                options={numbersOfMaintance}
                optionLabel="number"
                placeholder="Seleccione el numero a Trabajar"
                className="w-full md:w-14rem"
              />
            )}
          />
        </div>
        
        {/* Barra de búsqueda reubicada */}
        <div className="mt-4 w-full px-2">
          <span className="p-input-icon-left w-full">
            <i className="pi pi-search"></i>
            <InputText
              id="search"
              type="text"
              placeholder="Buscar"
              className="w-full"
            />
          </span>
        </div>
      </div>

      <div className="w-full flex row-gap-4 flex-column surface-border p-4 pt-0 mt-1">
        {/* Tabs estilo WhatsApp */}
        <div className="container-status-chats mb-2 mt-0">
          <div className="flex justify-content-center gap-3 py-2">
            {[
              { label: "TODOS", type: "all" },
              { label: "NO LEÍDOS", type: "unread", badge: conversations.reduce((count, conv) => count + (conv.unreadCount || 0), 0) }
            ].map(({ label, type, badge }, i) => {
              const isActive = typeMenu === type;
              return (
                <div
                  key={i}
                  className={`px-4 py-2 cursor-pointer transition-colors transition-duration-300 flex align-items-center border-round ${isActive ? 'font-bold text-white bg-primary' : 'text-700 hover:text-900 hover:surface-200'}`}
                  onClick={() => setTypeMenu(type)}
                  style={{
                    minWidth: '120px',
                    boxShadow: isActive ? '0 2px 5px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  <div className="flex align-items-center justify-content-center gap-2 w-full">
                    <span className="text-sm font-medium position-relative">
                      {label}
                      {type === "unread" && (
                        <Badge 
                          value={badge || 0} 
                          className="p-overlay-badge ml-2" 
                          severity={isActive ? "success" : "info"} 
                        />
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {typeMenu === "all" && (conversations.length > 0 || conversationsNotAssigned.length > 0)
          ? (
            <div className="flex flex-row gap-4 md:flex-column overflow-auto">
              {conversations.map((conversation: Conversation) => (
                <ConversationCard key={conversation.conversationid}
                  conversation={conversation as any}
                />
              ))}
              {conversationsNotAssigned.map((conversation: Conversation) => (
                <div key={conversation.conversationid} style={{ border: "1px solid red", borderRadius: "10px" }}>
                    <small className="m-2">No Asignada</small>
                  <ConversationCard conversation={conversation as any} isNotAssigned={true}
                    refetchConversations={() => fetchDataConversationAll(selectedNumber?.number as any)} />
                </div>
              ))}
            </div>
            )
          : typeMenu === "all" && (
            <span>No hay Conversaciones Encontradas</span>
          )
        }
        {typeMenu === "orphan" && conversationsNotAssigned.length > 0
          ? (
            <div className="flex flex-row gap-4 md:flex-column overflow-auto">
              {conversationsNotAssigned.map((conversation : Conversation) => {
                return <ConversationCard key={conversation.conversationid}
                  conversation={conversation as any}
                />
              })}
            </div>
            )
          : typeMenu === "orphan" && (
            <span>No hay Conversaciones No asignadas Encontradas</span>
          )
        }
        {typeMenu === "unread" && (
          <>
            {conversations.length > 0
              ? (
                <div className="flex flex-row gap-4 md:flex-column overflow-auto">
                  {conversations.map((conversation : Conversation) => {
                    return <ConversationCard key={conversation.conversationid}
                      conversation={conversation as any}
                    />
                  })}
                </div>
                )
              : (
                <span>No hay Conversaciones Encontradas</span>
                )
            }
            {conversationsNotAssigned.length > 0
              ? (
                <div className="flex flex-row gap-4 md:flex-column overflow-auto">
                  {conversationsNotAssigned.map((conversation : Conversation) => {
                    return <ConversationCard key={conversation.conversationid}
                      conversation={conversation as any}
                    />
                  })}
                </div>
                )
              : (
                <span>No hay Conversaciones No asignadas Encontradas</span>
                )
            }
          </>
        )}
      </div>
      <NewNumber updateData={getDataConversation}/>
    </React.Fragment>
  )
}

const Chat: Page = () => {
  // Acceder al store para obtener las conversaciones y mensajes
  const { conversations, activeConversation: currentConversation } = useChatStore();
  const { setMessages } = useMessageStore();
  
  // Estado para el tipo de menú (all, unread)
  const [typeMenu, setTypeMenu] = useState<string>("all");
  
  // Cálculo de mensajes no leídos
  const unreadMessagesCount = useMemo(() => {
    return conversations.reduce((total, conversation) => {
      return total + (conversation.unreadCount || 0);
    }, 0);
  }, [conversations]);
  
  /**
   * Función para cargar los mensajes de todas las conversaciones al inicio
   * Esto permite mostrar correctamente la hora del último mensaje en todas las tarjetas
   * Versión optimizada que maneja cancelaciones silenciosamente
   */
  const precargarMensajes = async () => {
    try {
      if (!conversations || conversations.length === 0) return;
      
      // Map to track which conversations we've already tried to fetch messages for
      const fetchedConversations = new Set<number>();
      
      // Para cada conversación, obtener sus mensajes
      const allMessages: MessageModel[] = [];
      
      // Crear un array de promesas para cargar mensajes en paralelo
      const promesas = conversations.map(async (conversacion) => {
        if (!conversacion.conversationid) return;
        
        // Skip if we've already attempted to fetch this conversation's messages
        if (fetchedConversations.has(conversacion.conversationid)) return;
        
        // Mark this conversation as fetched to avoid duplicates
        fetchedConversations.add(conversacion.conversationid);
        
        try {
          const response = await axiosInstance.post("/message/getMessages", {
            conversationId: conversacion.conversationid
          });
          
          if (response.data && Array.isArray(response.data)) {
            // Agregar los mensajes al array global
            allMessages.push(...response.data);
          }
        } catch (error: any) {
          // Check if this is a canceled request (from our circuit breaker)
          if (error.name === 'CanceledError' && error.message === 'Blocked duplicate message fetch request') {
            // This is expected behavior - silently ignore
          } else {
            // This is an unexpected error - log it but don't flood the console
            console.warn(`Error al cargar mensajes para conversación ${conversacion.conversationid}:`, 
              error.name || 'Error desconocido');
          }
        }
      });
      
      // Esperar a que todas las promesas se resuelvan
      await Promise.all(promesas);
      
      // Actualizar el store con todos los mensajes
      if (allMessages.length > 0) {
        // Actualizar silenciosamente
        setMessages(allMessages);
      }
    } catch (error) {
      // Downgrade from error to warn to reduce console noise
      console.warn("Error al precargar mensajes (no afecta funcionalidad principal)");
    }
  };
  
  // Ref to track if we've already preloaded messages to avoid duplicate calls
  const hasPreloadedRef = React.useRef(false);
  
  // Efecto para cargar los mensajes solo una vez cuando las conversaciones estén disponibles
  React.useEffect(() => {
    // Only run once when conversations become available
    if (conversations && conversations.length > 0 && !hasPreloadedRef.current) {
      console.log("Preloading messages for all conversations (one-time operation)");
      hasPreloadedRef.current = true; // Mark as run
      precargarMensajes();
    }
  }, [conversations]);

  const { activeConversation } = useChatStore()

  return (
    <>
      <div
        className="flex flex-column md:flex-row gap-0"
        style={{ minHeight: "81vh" }}
      >
        <div id="whatsapp-chat-sidebar" className="md:w-25rem card p-0" style={{ marginLeft: '10px !important' }}>
          <ChatSidebar typeMenu={typeMenu} setTypeMenu={setTypeMenu} />
        </div>
        <div className="flex-1 card p-0" style={{ width: '100%', maxWidth: '100%', marginRight: '0' }}>
           {currentConversation ? (
              <ChatBox/>
           ) : typeMenu === "unread" && conversations.filter(conv => (conv.unreadCount || 0) > 0).length > 0 ? (
              <div className="flex flex-row gap-4 md:flex-column overflow-auto">
                {conversations
                  .filter(conversation => (conversation.unreadCount || 0) > 0)
                  .filter(conversation => conversation.conversationid !== undefined)
                  .map((conversation: Conversation) => (
                    <ConversationCard 
                      key={conversation.conversationid}
                      conversation={conversation as unknown as ConversationCaratule}
                      isNotAssigned={false}
                    />
                  ))}
              </div>
           ) : (
              <div className="flex-1 flex justify-content-center align-items-center p-5">
                <span className="text-color-secondary fs-6">
                  {typeMenu === "unread" ? "No hay mensajes sin leer" : "No hay conversaciones disponibles"}
                </span> 
              </div>
           )}
        </div>
        <SidebarConversation/>
        <DialogTransfer/>
      </div>
      <ConfirmDialog /> {/* Se agrega el ConfirmDialog para que se muestren los mensajes */}
    </>
  )
}

export default Chat
