import { emojis } from "@/shared/components/chat/emojis/emojis"
import { useToast } from "@/shared/context/toast/toastContext"
import { usePostRequest } from "@/shared/customHooks/usePostRequestResult"
import { useFetch } from "@/shared/hooks/useFetch"
import { usePush } from "@/shared/hooks/usePush"
import useRealtimeMessages from "@/shared/hooks/useRealtimeMessages"
import { MESSAGE_OWNER, MESSAGE_TYPE, MessageModel } from "@/shared/models/conversation/messages.model"
import {
  TemplateService as _template
} from "@/shared/services"
import { getCookieToken, getDataFromToken } from "@/shared/utilities/functions/sessionUtils"
import { Button } from "primereact/button"
import { Dropdown } from "primereact/dropdown"
import { InputText } from "primereact/inputtext"
import { Message } from "primereact/message"
import { OverlayPanel } from "primereact/overlaypanel"
import React, { useEffect, useRef, useState } from "react"
import { sendPlainMessage, sendTemplateMessage } from "../service/chatServices"
import { useChatStore } from "../store/chat-store"
import { useMessageStore } from "../store/message-store"
export const ChatBox = (props: any) => {
  const { showError, showSuccess } = useToast()
  const [textContent, setTextContent] = useState("")
  const op = useRef<OverlayPanel>(null)
  const templateOp = useRef<OverlayPanel>(null) // NUEVO: ref para overlay de plantillas
  const chatWindow = useRef<HTMLDivElement>(null)
  const token = getCookieToken()
  const dataToken = token ? getDataFromToken(token) : null
  // const defaultUserId = dataToken?.user.userId
  const { messages: messagesSocket, clearMessages } = useRealtimeMessages(`${process.env.NEXT_PUBLIC_SOCKET_URL}`)
  const { onClickAction } = usePush("/auth/login")

  // ESTADOS ---
  //
  const { actualNumberOfMaintanceSelected, activeConversation } = useChatStore()
  const { messages: messagesStorage, pushMessage, setMessages } = useMessageStore()

  const { responseData: dataTemplates } = useFetch(_template.getAll)

  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null)

  // Verifica si el token está presente
  if (!dataToken) {
    showError("Token No Encontrado")
    onClickAction()
  }

  useEffect(() => {
    if (messagesSocket.length > 0) {
      messagesSocket.forEach(msg => {
        const messageClient: MessageModel = {
          content: msg.text,
          owner: MESSAGE_OWNER.CLIENT,
          sentAt: new Date(+msg.timestamp * 1000).getTime(),
          type: MESSAGE_TYPE.TEXT,
          conversationId: activeConversation?.conversationid
        }
        // Evitar duplicados en messagesStorage
        if (!messagesStorage.some(m => m.sentAt === messageClient.sentAt && m.content === messageClient.content)) {
          pushMessage(messageClient)
        }
      })
      clearMessages()
    }
  }, [messagesSocket])

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

    try {
      // Llama al servicio para enviar el template
      const ok = await sendTemplateMessage(recipientPhone, accessToken, idNumberFromSendMessage, selectedTemplate.name)
      if (ok) {
        showSuccess("Mensaje enviado")
      }
    } catch (error: any) {
      // Maneja el error en caso de token expirado u otros
      if (error.code === 190) {
        showError("Token de acceso expirado")
        onClickAction()
      }
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

        try {
          const result = await sendPlainMessage(
            messageTemporal?.from ?? "",
            messageTemporal.content,
              `${actualNumberOfMaintanceSelected?.IdAccountWB ?? ""}`,
              `${actualNumberOfMaintanceSelected?.idNumberPhone ?? ""}`
          )
          if (result) {
            messageTemporal.idWhatsapp = result.messages[0].id
            pushMessage(messageTemporal)
            postMessage("/message", messageTemporal)
          }
        } catch (error) {
          showError("Error al enviar el mensaje : " + error)
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

  const { setDialogTransfer } = useChatStore()
  // Abre el diálogo para transferir el chat
  function transferChat () {
    setDialogTransfer(true)
  }

  // Efecto para mantener el scroll en la parte inferior al insertar nuevos nodos
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

  const { data: dataMessage, postData } = usePostRequest<{ conversationId : number }, MessageModel[] >()
  function fetchMesagesData (conversationId : number) {
    postData("/message/getMessages", {
      conversationId
    })
  }

  useEffect(() => {
    if (activeConversation?.destination_number) {
      fetchMesagesData(activeConversation?.conversationid)
    }
  }, [activeConversation?.destination_number])

  useEffect(() => {
    if (dataMessage) {
      setMessages(dataMessage)
    }
  }, [dataMessage])

  useEffect(() => {
    if (chatWindow.current) {
      chatWindow.current.scrollTo({ top: chatWindow.current.scrollHeight, behavior: "smooth" })
    }
  }, [messagesStorage])

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
              onClick={() => transferChat()}
              type="button"
              icon="pi pi-sign-out"
              rounded
              outlined
              severity="secondary"
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
          {messagesStorage && messagesStorage.map((message : MessageModel, i : number) => {
            return (
              <div key={i}>
                {message.owner !== MESSAGE_OWNER.CLIENT
                  ? (
                    <div className="grid grid-nogutter mb-4">
                      <div className="col mt-3 text-right">
                        <span
                          className="inline-block text-right font-medium
                          surface-border bg-primary-100 text-primary-900 p-3 white-space-normal border-round"
                          style={{
                            wordBreak: "break-word",
                            maxWidth: "80%"
                          }}
                        >
                          {message.content}
                        </span>
                        <p className="text-700 mt-3">
                          {parseDate(message.sentAt)}{" "}
                          <i className="pi pi-check ml-2 text-green-400"></i>
                        </p>
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
                          className="text-700 inline-block font-medium
                          border-1 surface-border white-space-normal border-round"
                          style={{
                            wordBreak: "break-word",
                            maxWidth: "80%",
                            padding: "1rem"
                          }}
                        >
                          {message.content}
                        </span>
                        <p className="text-700 mt-3">
                          {parseDate(message.sentAt)}{" "}
                          <i className="pi pi-check ml-2 text-green-400"></i>
                        </p>
                      </div>
                    </div>
                    )}
              </div>
            )
          })}
        </div>
        <div className="p-3 md:p-4 lg:p-6 flex flex-column sm:flex-row
        align-items-center mt-auto border-top-1 surface-border gap-3">
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
              className="w-full sm:w-auto justify-content-center text-xl"
              severity="secondary"
              onClick={(event) => op.current?.toggle(event)}
            >
              😀
            </Button>
            <Button
              label="Enviar"
              icon="pi pi-send"
              className="w-full sm:w-auto"
              type="button"
              onClick={() => handleSendMessage()}></Button>
            <Button
              label="Plantilla"
              icon="pi pi-send"
              type="button"
              className="w-full sm:w-auto"
              onClick={(event) => templateOp.current?.toggle(event)}></Button>
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
    </React.Fragment>
  )
}
