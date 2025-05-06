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
  const { data: numbersOfMaintance } = useSWRFetch<NumbersOfMaintanceCaratule[]>(`/users/numbers/${userStore.userId}`)

  const { fetchData, data: conversationsFetch, loading } = useSWRRequest<Conversation[]>()
  const { fetchData: fetchDataConversationsNotAssigned, data: conversationsNotAssignedFetch } =
    useSWRRequest<Conversation[]>()

  async function getDataConversation (numberToFind? : string) {
    fetchData(`/conversation/getConversationsCaratule/${userStore.userId}/${numberToFind}`)
  }
  async function getDataConversationNotAssigned (numberToFind? : string) {
    fetchDataConversationsNotAssigned(`/conversation/getConversationsCaratuleNotAssigned/${numberToFind}`)
  }

  // Inicializar react-hook-form para el dropdown
  const { control, watch } = useForm<{ actualNOM: NumbersOfMaintanceCaratule | null }>({
    defaultValues: { actualNOM: null }
  })

  const selectedNumber = watch("actualNOM")

  // Efecto para disparar la consulta al cambiar el número seleccionado
  useEffect(() => {
    if (selectedNumber?.number) {
      // Limpia las conversaciones anteriores para evitar mezclar datos
      resetAll()
      resetAllMessages()
      setActualNumberOfMaintanceSelected(selectedNumber)
      fetchDataConversationAll(selectedNumber.number)
    }
  }, [selectedNumber?.number])

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

  useInitializeUserFromToken()

  // Efecto para obtener el nombre de usuario del localStorage
  useEffect(() => {
    // Intentar obtener el nombre de usuario del localStorage
    const getUserInfo = () => {
      try {
        // Priorizar el nombre del usuario desde el store (que viene del token JWT)
        if (userStore && userStore.name) {
          setUserName(userStore.name);
          return;
        }
        
        // Si no está en el store, intentar obtenerlo del localStorage
        const userDataString = localStorage.getItem('userData');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          setUserName(userData.name || 'Usuario');
          setUserAvatar(userData.avatar || '');
        } else {
          // Fallback a un valor por defecto
          setUserName('Usuario');
        }
      } catch (error) {
        console.error('Error al obtener datos del usuario:', error);
        setUserName('Usuario');
      }
    };

    getUserInfo();
  }, [userStore]);

  useEffect(() => {
    resetAll()
  }, [])

  return (
    <React.Fragment>
      <style jsx global>{`
        .hover-scale:hover {
          transform: scale(1.1);
          transition: transform 0.2s;
        }
        .agent-profile {
          padding: 12px 12px 8px 12px;
          margin-bottom: 8px;
          border-bottom: 1px solid var(--surface-border);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .agent-info {
          display: flex;
          flex-direction: column;
        }
        .agent-name {
          font-weight: 600;
          font-size: 1rem;
        }
        .agent-status {
          font-size: 0.8rem;
          color: var(--text-color-secondary);
        }
      `}</style>
      <BlockUI blocked={loading} fullScreen={true} />
      
      {/* Fila del Agente con Avatar */}
      <div className="agent-profile">
        <Avatar 
          image={userAvatar || undefined} 
          icon={!userAvatar ? "pi pi-user" : undefined} 
          size="large" 
          shape="circle"
          style={{ backgroundColor: !userAvatar ? 'var(--primary-color)' : undefined, color: !userAvatar ? '#ffffff' : undefined }}
        />
        <div className="agent-info">
          <span className="agent-name">{userName}</span>
          <span className="agent-status">En línea</span>
        </div>
      </div>
      
      <div className="flex flex-column align-items-center border-bottom-1 surface-border p-3 pt-2">
        <div className="flex gap-4 justify-content-center">
          {[
            { label: "Disponibles", icon: "pi pi-check", valueBadge: conversations.length },
            { label: "En Conversacion", icon: "pi pi-comments", valueBadge: conversations.length },
            { label: "Nuevo", icon: "pi pi-plus", isClickable: true }
          ].map(({ label, icon, isClickable, valueBadge }, i) => (
            <div
              key={i}
              className={"flex flex-column align-items-center cursor-pointer hover-scale"}
              onClick={isClickable ? () => setDialogNewNumber() : undefined}
            >
              <Avatar icon={icon} className="mb-1 p-overlay-badge">
                {
                    valueBadge !== undefined && (
                        <Badge value={valueBadge} />
                    )
                }
              </Avatar>
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
              { label: "Mensajes Huerfanos", icon: "pi pi-comments", type: "orphan", badge: conversationsNotAssigned.length }
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
  const { activeConversation } = useChatStore()

  return (
    <>
      <div
        className="flex flex-column md:flex-row gap-5"
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
