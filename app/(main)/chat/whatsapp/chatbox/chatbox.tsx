import { emojis } from "@/shared/components/chat/emojis/emojis"
import { useToast } from "@/shared/context/toast/toastContext"
import { usePostRequest } from "@/shared/customHooks/usePostRequestResult"
import { useFetch } from "@/shared/hooks/useFetch"
import { usePush } from "@/shared/hooks/usePush"
import useRealtimeMessages from "@/shared/hooks/useRealtimeMessages"
import { confirmDialog } from "primereact/confirmdialog"
import { MESSAGE_OWNER, MESSAGE_TYPE, MessageModel } from "@/shared/models/conversation/messages.model"
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
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { sendPlainMessage, sendTemplateMessage } from "../service/chatServices"
import { useChatStore } from "../store/chat-store"
import { useMessageStore } from "../store/message-store"
import { Dialog } from 'primereact/dialog';

interface Agent {
  id: string;
  name: string;
  status: string;
}

interface Group {
  id: string;
  name: string;
}

export const ChatBox = (props: any) => {
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
  const { messages: messagesSocket } = useRealtimeMessages(`${process.env.NEXT_PUBLIC_SOCKET_URL}`);
  const { messages: storedMessages, setMessages } = useMessageStore();
  const { onClickAction } = usePush("/auth/login")

  // ESTADOS ---
  //
  const { actualNumberOfMaintanceSelected, activeConversation } = useChatStore()

  // Obtener las plantillas filtradas por compañía
  const companyId = dataToken?.user.company.companyId
  
  // Usamos useMemo para que la función de fetch sea estable entre renders
  const fetchTemplates = useMemo(() => {
    // Aseguramos que siempre devuelva una función válida para evitar errores de tipo
    return () => _template.getAllByCompany(companyId || 0);
  }, [companyId]);
  
  const { responseData: dataTemplates } = useFetch(fetchTemplates)

  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null)

  // Verificación de token - control más seguro para prevenir bucles
  const [shouldRedirect, setShouldRedirect] = useState(false)

  useEffect(() => {
    // Solo verificamos cuando el componente se monta
    if (!dataToken && !shouldRedirect) {
      showError("Token No Encontrado")
      setShouldRedirect(true)
    }
  }, [dataToken, shouldRedirect, showError])
  
  // Efecto separado para manejar la redirección
  useEffect(() => {
    if (shouldRedirect) {
      // Usar setTimeout para evitar redirecciones durante el renderizado
      const redirectTimer = setTimeout(() => {
        onClickAction()
      }, 100)
      return () => clearTimeout(redirectTimer)
    }
  }, [shouldRedirect, onClickAction])

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

  // Manejo de mensajes entrantes - versión directa con máxima compatibilidad
  useEffect(() => {
    console.log('Efecto de procesamiento de mensajes ejecutado');
    console.log('Total mensajes en el socket:', messagesSocket.length);
    
    if (messagesSocket.length > 0) {
      // Enfoque directo: procesar mensajes uno por uno
      messagesSocket.forEach(msg => {
        console.log('Procesando mensaje de socket:', msg);
        
        // 1. Transformar mensaje a formato MessageModel
        const transformedMsg: MessageModel = {
          content: msg.content || '',
          owner: msg.owner === 'CUSTOMER' ? MESSAGE_OWNER.CLIENT : MESSAGE_OWNER.AGENT,
          sentAt: msg.sentAt || Date.now(),
          type: MESSAGE_TYPE.TEXT,
          // Asegurarse que tenga el conversationId correcto
          conversationId: activeConversation?.conversationid || 0,
          from: msg.from || '',
          id: Date.now(), // ID temporal 
          idWhatsapp: msg.idWhatsapp || ''
        };
        
        // 2. Verificar si el mensaje ya existe para evitar duplicados
        const isDuplicate = storedMessages.some(existingMsg => 
          existingMsg.idWhatsapp === msg.idWhatsapp ||
          (existingMsg.content === msg.content && 
           existingMsg.from === msg.from && 
           Math.abs(existingMsg.sentAt - msg.sentAt) < 10000) // 10 segundos de tolerancia
        );
        
        if (!isDuplicate) {
          console.log('Añadiendo mensaje NO duplicado al store:', transformedMsg);
          // 3. Añadir el mensaje al store utilizando el array actual
          // y creando un nuevo array que incluya el mensaje transformado
          setMessages([...storedMessages, transformedMsg]);
        }
      });
    }
  }, [messagesSocket]); // Dependencies include messagesSocket to detect any changes

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
    console.log('Messages being rendered:', storedMessages); // Debug 5
    if (chatWindow.current) {
      chatWindow.current.scrollTo({ top: chatWindow.current.scrollHeight, behavior: "smooth" })
    }
  }, [storedMessages]);

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

  const [transferModalVisible, setTransferModalVisible] = useState(false);

  const handleTransfer = (type: 'agent' | 'group' | 'bot', id?: string) => {
    console.log('Transferencia de chat a:', type, id);
    setTransferModalVisible(false);
  };

  const TransferModal = ({ visible, onHide, onTransfer }: { 
    visible: boolean; 
    onHide: () => void; 
    onTransfer: (type: 'agent' | 'group' | 'bot', id?: string) => void;
  }) => {
    const [selectedOption, setSelectedOption] = useState<'agent' | 'group' | 'bot' | null>(null);
    
    // Datos de ejemplo - reemplazar con llamadas reales a la API
    const agents: Agent[] = [
      { id: '1', name: 'Agente 1', status: 'Disponible' },
      { id: '2', name: 'Agente 2', status: 'Ocupado' }
    ];
    
    const groups: Group[] = [
      { id: 'g1', name: 'Grupo Ventas' },
      { id: 'g2', name: 'Grupo Soporte' }
    ];

    return (
      <Dialog 
        header="Transferencia de chat" 
        visible={visible} 
        onHide={onHide}
        style={{ width: '50vw', maxWidth: '800px' }}
        breakpoints={{ '960px': '90vw', '641px': '95vw' }}
      >
        {!selectedOption ? (
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
              onClick={() => setSelectedOption('agent')}
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
              onClick={() => setSelectedOption('group')}
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
                onClick={() => setSelectedOption(null)}
              />
              <h3>{selectedOption === 'agent' ? 'Seleccione un agente' : 'Seleccione un grupo'}</h3>
            </div>
            
            {(selectedOption === 'agent' ? agents : groups).map(item => (
              <div 
                key={item.id} 
                className="p-3 border-round border-1 surface-border cursor-pointer hover:surface-hover"
                onClick={() => {
                  onTransfer(selectedOption, item.id);
                  onHide();
                }}
              >
                <div className="flex align-items-center gap-3">
                  <i className={selectedOption === 'agent' ? 'pi pi-user' : 'pi pi-users'}></i>
                  <div>
                    <div className="font-medium">{item.name}</div>
                    {selectedOption === 'agent' && 'status' in item && (
                      <div className="text-sm">Estado: {(item as Agent).status}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Dialog>
    );
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

    try {
      // Llama al servicio para enviar el template
      const ok = await sendTemplateMessage(recipientPhone, accessToken, idNumberFromSendMessage, selectedTemplate.name)
      if (ok) {
        showSuccess("Mensaje enviado")
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
    setDialogTransfer(true)
  }

  /**
   * Finaliza la conversación actual
   * @description Cierra la conversación activa y la elimina de la lista de conversaciones activas
   */
  const finishConversation = async () => {
    try {
      if (!activeConversation) {
        showError("No hay una conversación activa para finalizar")
        return
      }
      
      // Mostrar diálogo de confirmación antes de finalizar
      confirmDialog({
        message: '¿Estás seguro de que deseas finalizar esta conversación?',
        header: 'Confirmación',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Sí, finalizar',
        rejectLabel: 'No, cancelar',
        accept: async () => {
          try {
            // Aquí implementar la llamada al endpoint para finalizar conversación
            // Ejemplo: await postData('/conversation/finish', { conversationId: activeConversation.conversationid })
            
            // Por ahora, simulamos el proceso eliminando la conversación del store
            deleteConversation(activeConversation as any)
            
            // Resetear la conversación activa
            setActiveConversation(null as any)
            
            showSuccess("Conversación finalizada correctamente")
          } catch (error) {
            console.error('Error al finalizar la conversación:', error)
            showError("Error al finalizar la conversación")
          }
        },
      })
    } catch (error) {
      console.error('Error al intentar finalizar la conversación:', error)
      showError("Ocurrió un error al intentar finalizar la conversación")
    }
  }

  // Mensajes a mostrar - versión RADICAL para debug - MOSTRAR TODO
  const displayedMessages = useMemo(() => {
    console.log('Recalculando displayedMessages');
    console.log('Mensajes totales disponibles:', storedMessages.length);
    
    // FORZAR MOSTRAR TODOS LOS MENSAJES
    // Esto es para debug - muestra absolutamente todos los mensajes sin filtrar
    console.log('FORZANDO MOSTRAR TODOS LOS MENSAJES PARA DEBUG');
    if (storedMessages.length > 0) {
      return storedMessages;
    }
    
    return [];
  }, [storedMessages]);
  
  // Agrega este efecto para imprimir todos los mensajes
  useEffect(() => {
    console.log('TODOS LOS MENSAJES EN EL STORE:');
    storedMessages.forEach((msg, index) => {
      console.log(`Mensaje #${index + 1}:`, {
        content: msg.content,
        owner: msg.owner,
        from: msg.from,
        conversationId: msg.conversationId,
        sentAt: new Date(msg.sentAt).toLocaleString()
      });
    });
  }, [storedMessages]);

  // Debug
  useEffect(() => {
    console.log('[DEBUG] Current messages:', storedMessages);
    console.log('[DEBUG] Displayed messages:', displayedMessages);
  }, [storedMessages, displayedMessages]);

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
              onClick={() => setTransferModalVisible(true)}
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
            return (
              <div key={i}>
                {message.owner !== MESSAGE_OWNER.CLIENT
                  ? (
                    <div className="grid grid-nogutter mb-4">
                      <div className="col mt-3 text-right">
                        <span
                          className="inline-block text-right font-medium relative
                          surface-border bg-primary-100 text-primary-900 p-3 pb-6 white-space-normal border-round"
                          style={{
                            wordBreak: "break-word",
                            maxWidth: "80%"
                          }}
                        >
                          {message.content}
                          <div className="absolute right-0 bottom-0 text-600 text-xs p-2 flex align-items-center">
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
                          className="text-700 inline-block font-medium relative
                          border-1 surface-border white-space-normal border-round"
                          style={{
                            wordBreak: "break-word",
                            maxWidth: "80%",
                            padding: "1rem",
                            paddingBottom: "2rem"
                          }}
                        >
                          {message.content}
                          <div className="absolute right-0 bottom-0 text-600 text-xs p-2 flex align-items-center">
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
            <Button
              label="Plantilla"
              icon="pi pi-send"
              type="button"
              className="w-full sm:w-auto"
              onClick={(event) => templateOp.current?.toggle(event)}></Button>
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

      <TransferModal 
        visible={transferModalVisible} 
        onHide={() => setTransferModalVisible(false)} 
        onTransfer={handleTransfer} 
      />
    </React.Fragment>
  )
}
