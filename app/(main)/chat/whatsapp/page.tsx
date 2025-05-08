"use client"
import ConversationCard from "@/shared/components/chat/ConversationCard"
import { useInitializeUserFromToken } from "@/shared/customHooks/useInitializeUserFromToken"
import { useSWRFetch } from "@/shared/customHooks/useSWRFetch"
import { useSWRRequest } from "@/shared/customHooks/useSWRRequest"
import { NumbersOfMaintanceCaratule } from "@/shared/models"
import { Conversation } from "@/shared/models/conversation/conversation.model"
import type { Page } from "@/types"
import dynamic from "next/dynamic"
import { Avatar } from "primereact/avatar"
import { Badge } from "primereact/badge"
import { Tooltip } from "primereact/tooltip"
import { BlockUI } from "primereact/blockui"
import { Dropdown } from "primereact/dropdown"
import { InputText } from "primereact/inputtext"
import React, { useEffect, useState } from "react"
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

const ChatSidebar = () => {
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
  const [typeMenu, setTypeMenu] = useState<string>("all")
  const [userName, setUserName] = useState<string>("")
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

  // Efecto para disparar la consulta al cambiar el número seleccionado
  useEffect(() => {
    if (selectedNumber?.number && userStore && userStore.userId) {
      // Limpia las conversaciones anteriores para evitar mezclar datos
      resetAll()
      resetAllMessages()
      setActualNumberOfMaintanceSelected(selectedNumber)
      fetchDataConversationAll(selectedNumber.number)
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

  useEffect(() => {
    resetAll()
  }, [])

  useEffect(() => {
    // Seleccionamos los elementos del DOM que necesitamos modificar
    const layout = document.querySelector('.layout') as HTMLElement;
    const sidebar = document.querySelector('.sidebar') as HTMLElement;
    const layoutContainer = document.querySelector('.layout-container') as HTMLElement;
    const contentWrapper = document.querySelector('.layout-content-wrapper') as HTMLElement;
    const layoutContent = document.querySelector('.layout-content') as HTMLElement;
    
    // Definimos el ancho del sidebar y el padding adicional
    const sidebarWidth = 280; // en píxeles
    const additionalPadding = 20; // padding adicional para separar más el contenido
    const totalOffset = sidebarWidth + additionalPadding;
    
    if (layout && sidebar && layoutContainer && contentWrapper && layoutContent) {
      // Configuramos el estilo del layout y sidebar
      layout.style.paddingLeft = '0';
      
      // Configuramos el sidebar
      sidebar.style.position = 'fixed';
      sidebar.style.borderRight = 'none';
      sidebar.style.boxShadow = 'none';
      sidebar.style.width = `${sidebarWidth}px`;
      sidebar.style.zIndex = '999';
      
      // Ajustamos el contenedor principal para que no sea cubierto por el sidebar
      // Añadimos padding adicional para moverlo más a la derecha
      contentWrapper.style.marginLeft = `${totalOffset}px`;
      contentWrapper.style.width = `calc(100% - ${totalOffset}px)`;
      contentWrapper.style.position = 'relative';
      contentWrapper.style.zIndex = '1000';
      
      // Ajustamos el contenido principal
      layoutContent.style.width = '100%';
      layoutContent.style.marginLeft = '0';
      
      // Contraemos el sidebar por defecto (modo "reveal")
      layoutContainer.classList.remove('layout-sidebar-anchored');
      
      // Forzamos el modo "static" para el sidebar en lugar de "reveal"
      // Esto asegura que el sidebar esté siempre visible
      if (!layoutContainer.classList.contains('layout-static')) {
        layoutContainer.classList.remove('layout-reveal');
        layoutContainer.classList.remove('layout-overlay');
        layoutContainer.classList.remove('layout-slim');
        layoutContainer.classList.remove('layout-slim-plus');
        layoutContainer.classList.remove('layout-horizontal');
        layoutContainer.classList.remove('layout-drawer');
        layoutContainer.classList.add('layout-static');
      }
      
      // Eliminamos el efecto hover del menú
      const menuItems = document.querySelectorAll('.layout-menu-container .layout-menuitem-root-text, .layout-menu-container a');
      menuItems.forEach((item: Element) => {
        if (item instanceof HTMLElement) {
          item.style.transition = 'none';
          
          // Eliminamos los eventos hover
          item.onmouseenter = null;
          item.onmouseleave = null;
        }
      });
      
      // Añadimos una clase específica para esta vista
      document.body.classList.add('whatsapp-view');
      
      // Guardamos el estado original para restaurarlo después
      const originalMode = layoutContainer.getAttribute('data-original-mode') || 'reveal';
      if (!layoutContainer.getAttribute('data-original-mode')) {
        layoutContainer.setAttribute('data-original-mode', originalMode);
      }
      
      // Aplicamos estilos adicionales a elementos específicos que podrían estar siendo tapados
      const agentInfoSection = document.querySelector('.agent-profile') as HTMLElement;
      const filterButtons = document.querySelector('.filter-buttons') as HTMLElement;
      
      if (agentInfoSection) {
        agentInfoSection.style.paddingLeft = '20px';
        agentInfoSection.style.boxSizing = 'border-box';
      }
      
      if (filterButtons) {
        filterButtons.style.paddingLeft = '20px';
        filterButtons.style.boxSizing = 'border-box';
      }
    }
    
    return () => {
      if (layout && sidebar) {
        const layoutContainer = document.querySelector('.layout-container') as HTMLElement;
        const contentWrapper = document.querySelector('.layout-content-wrapper') as HTMLElement;
        const layoutContent = document.querySelector('.layout-content') as HTMLElement;
        
        // Restauramos los estilos al desmontar el componente
        layout.style.paddingLeft = '';
        sidebar.style.position = '';
        sidebar.style.borderRight = '';
        sidebar.style.boxShadow = '';
        sidebar.style.width = '';
        sidebar.style.zIndex = '';
        
        if (contentWrapper) {
          contentWrapper.style.marginLeft = '';
          contentWrapper.style.width = '';
          contentWrapper.style.position = '';
          contentWrapper.style.zIndex = '';
        }
        
        if (layoutContent) {
          layoutContent.style.width = '';
          layoutContent.style.marginLeft = '';
        }
        
        // Restauramos los estilos de elementos específicos
        const agentInfoSection = document.querySelector('.agent-profile') as HTMLElement;
        const filterButtons = document.querySelector('.filter-buttons') as HTMLElement;
        
        if (agentInfoSection) {
          agentInfoSection.style.paddingLeft = '';
          agentInfoSection.style.boxSizing = '';
        }
        
        if (filterButtons) {
          filterButtons.style.paddingLeft = '';
          filterButtons.style.boxSizing = '';
        }
        
        // Restauramos los eventos hover del menú
        const menuItems = document.querySelectorAll('.layout-menu-container .layout-menuitem-root-text, .layout-menu-container a');
        menuItems.forEach((item: Element) => {
          if (item instanceof HTMLElement) {
            item.style.transition = '';
          }
        });
        
        // Eliminamos la clase específica
        document.body.classList.remove('whatsapp-view');
        
        // Restauramos el modo original del sidebar si existe
        if (layoutContainer) {
          const originalMode = layoutContainer.getAttribute('data-original-mode');
          if (originalMode) {
            // Eliminamos todas las clases de modo
            layoutContainer.classList.remove('layout-static');
            layoutContainer.classList.remove('layout-reveal');
            layoutContainer.classList.remove('layout-overlay');
            layoutContainer.classList.remove('layout-slim');
            layoutContainer.classList.remove('layout-slim-plus');
            layoutContainer.classList.remove('layout-horizontal');
            layoutContainer.classList.remove('layout-drawer');
            
            // Añadimos la clase original
            layoutContainer.classList.add(`layout-${originalMode}`);
            
            // Limpiamos el atributo de datos
            layoutContainer.removeAttribute('data-original-mode');
          }
        }
      }
    };
  }, []);

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
      <div className="agent-profile flex align-items-center mt-3 mx-4">
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
            <div className="agent-numbers mt-1">
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
      
      <div className="flex flex-column align-items-center border-bottom-1 surface-border p-3 pt-2 mt-5 mb-3">
        <div className="flex gap-4 justify-content-center">
          {[
            { label: "Disponibles", icon: "pi pi-check", valueBadge: conversations.length },
            { label: "En Conversacion", icon: "pi pi-comments", valueBadge: conversations.length },
            { label: "Nuevo", icon: "pi pi-user-plus", isClickable: true, tooltip: "Iniciar conversación" }
          ].map(({ label, icon, isClickable, valueBadge, tooltip }, i) => (
            <div
              key={i}
              className={"flex flex-column align-items-center cursor-pointer hover-scale"}
              onClick={isClickable ? () => setDialogNewNumber() : undefined}
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
        <div className="flex gap-2 mt-4">
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
      </div>
      <div className="w-full flex row-gap-4 flex-column surface-border p-4">
        <div className="container-status-chats">
          <div className="flex gap-4 justify-content-center border-round shadow-1 p-2">
            {[
              { label: "Todos", icon: "pi pi-check", type: "all", badge: conversations.length + conversationsNotAssigned.length },
              { label: "No leidos", icon: "pi pi-comments", type: "unread", badge: 0 },
              { label: "Mensajes Pendientes", icon: "pi pi-comments", type: "orphan", badge: conversationsNotAssigned.length }
            ].map(({ label, icon, type, badge }, i) => (
              <div
                key={i}
                className="flex flex-column align-items-center cursor-pointer hover-scale"
                onClick={() => setTypeMenu(type)}
              >
                <Avatar icon={icon} className="mb-1 p-overlay-badge">
                  {/* Mostrar Badge en el botón */}
                  <Badge value={badge}/>
                </Avatar>
                <label className="text-center text-sm">{label}</label>
              </div>
            ))}
          </div>
        </div>
        <span className="p-input-icon-left w-full">
          <i className="pi pi-search"></i>
          <InputText
            id="search"
            type="text"
            placeholder="Buscar"
            className="w-full"
          />
        </span>
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
  const { conversations } = useChatStore();
  const { setMessages } = useMessageStore();
  
  /**
   * Función para cargar los mensajes de todas las conversaciones al inicio
   * Esto permite mostrar correctamente la hora del último mensaje en todas las tarjetas
   */
  const precargarMensajes = async () => {
    try {
      if (!conversations || conversations.length === 0) return;
      
      // Para cada conversación, obtener sus mensajes
      const allMessages: MessageModel[] = [];
      
      // Crear un array de promesas para cargar mensajes en paralelo
      const promesas = conversations.map(async (conversacion) => {
        if (!conversacion.conversationid) return;
        
        try {
          const response = await axiosInstance.post("/message/getMessages", {
            conversationId: conversacion.conversationid
          });
          
          if (response.data && Array.isArray(response.data)) {
            // Agregar los mensajes al array global
            allMessages.push(...response.data);
          }
        } catch (error) {
          console.error(`Error al cargar mensajes para conversación ${conversacion.conversationid}:`, error);
        }
      });
      
      // Esperar a que todas las promesas se resuelvan
      await Promise.all(promesas);
      
      // Actualizar el store con todos los mensajes
      if (allMessages.length > 0) {
        console.log(`Cargados ${allMessages.length} mensajes para ${conversations.length} conversaciones`);
        setMessages(allMessages);
      }
    } catch (error) {
      console.error("Error al precargar mensajes:", error);
    }
  };
  
  // Efecto para cargar los mensajes cuando las conversaciones estén disponibles
  React.useEffect(() => {
    if (conversations && conversations.length > 0) {
      console.log("Precargando mensajes para todas las conversaciones...");
      precargarMensajes();
    }
  }, [conversations]);

  const { activeConversation } = useChatStore()

  // Efecto para aplicar estilos específicos para esta vista
  useEffect(() => {
    // Función para ajustar los estilos del layout
    const adjustLayout = () => {
      // Obtener elementos del DOM
      const layoutContent = document.querySelector('.layout-content') as HTMLElement | null;
      const layoutContentWrapper = document.querySelector('.layout-content-wrapper') as HTMLElement | null;
      const cardElements = document.querySelectorAll('.card') as NodeListOf<HTMLElement>;
      
      // Aplicar nuevos estilos
      if (layoutContent) {
        layoutContent.style.padding = '0';
      }
      
      if (layoutContentWrapper) {
        layoutContentWrapper.style.marginLeft = '0';
      }
      
      // Ajustar estilos de las tarjetas
      cardElements.forEach(card => {
        card.style.borderRadius = '0';
        card.style.boxShadow = 'none';
        card.style.margin = '0';
      });
    };
    
    // Ejecutar ajuste después de que el DOM esté listo
    const timeoutId = setTimeout(adjustLayout, 100);
    
    // Limpiar timeout si el componente se desmonta antes
    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <>
      <div
        className="flex flex-column md:flex-row gap-0"
        style={{ minHeight: "81vh" }}
      >
        <div className="md:w-25rem card p-0">
          <ChatSidebar/>
        </div>
        <div className="flex-1 card p-0">
           {
            activeConversation
              ? (
                <ChatBox/>
                )
              : (
              <div className="flex justify-content-center align-items-center h-full">
                <span>No hay un Usuario Seleccionado</span>
              </div>
                )
           }
        </div>
        <SidebarConversation/>
        <DialogTransfer/>
      </div>
      <ConfirmDialog /> {/* Se agrega el ConfirmDialog para que se muestren los mensajes */}
    </>
  )
}

export default Chat
