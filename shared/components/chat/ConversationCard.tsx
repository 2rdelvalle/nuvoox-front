import { useChatStore } from "@/app/(main)/chat/whatsapp/store/chat-store"
import { useToast } from "@/shared/context/toast/toastContext"
import { axiosInstance } from "@/shared/instances/axios-instance"
import { ConversationCaratule } from "@/shared/models/conversation/conversation.model"
import { confirmDialog } from "primereact/confirmdialog"
import { classNames } from "primereact/utils"
import React from "react"

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

  const { showError, showSuccess } = useToast()

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
              setActiveConversation(conversation)
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
          <span className="text-900 font-semibold block">
            +{conversation.indicative + " " + conversation.destination_number}
          </span>
        </div>
      </div>
    </div>
  )
}

export default ConversationCard
