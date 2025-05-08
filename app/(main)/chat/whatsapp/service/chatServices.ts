import { WhatsAppResponseSendMessage } from "@/shared/models/conversation/messages.model"

/**
 * Envía un mensaje simple (texto) a través de la API de WhatsApp.
 * @param to Nombre o identificador del destinatario.
 * @param message Contenido del mensaje.
 * @param token Token de acceso para la API.
 * @param senderId Identificador del remitente.
 */
export async function sendPlainMessage (to: string, message: string, token: string, senderId: string):
    Promise<WhatsAppResponseSendMessage> {
  // Validación de parámetros
  if (!to || !to.trim()) {
    console.error("Error: Número de teléfono de destino vacío o inválido")
    throw new Error("El número de teléfono de destino es requerido")
  }
  
  if (!message || !message.trim()) {
    console.error("Error: Mensaje vacío")
    throw new Error("El contenido del mensaje es requerido")
  }
  
  if (!token || !token.trim()) {
    console.error("Error: Token de acceso vacío")
    throw new Error("El token de acceso es requerido")
  }
  
  if (!senderId || !senderId.trim()) {
    console.error("Error: ID del remitente vacío")
    throw new Error("El ID del remitente es requerido")
  }
  
  // Asegurar que el número de teléfono tenga el formato correcto
  // El número debe empezar con '+' y contener solo dígitos después
  const formattedTo = to.startsWith('+') ? to : `+${to}`
  
  // Log de depuración
  console.log("Enviando mensaje con los siguientes parámetros:")
  console.log("URL API:", `https://graph.facebook.com/v22.0/${senderId}/messages`)
  console.log("Destinatario:", formattedTo)
  console.log("Remitente ID:", senderId)
  console.log("Longitud del token:", token.length)
  
  const apiUrl = `https://graph.facebook.com/v22.0/${senderId}/messages`
  const messageData = {
    messaging_product: "whatsapp",
    to: formattedTo,
    type: "text",
    text: { body: message }
  }
  
  console.log("Datos del mensaje:", JSON.stringify(messageData, null, 2))
  
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(messageData)
    })
    
    // Log de la respuesta HTTP
    console.log("Código de estado HTTP:", response.status)
    // Log headers de forma compatible con todos los entornos
    const headerObj: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      headerObj[key] = value
    })
    console.log("Headers:", headerObj)
    
    const responseText = await response.text()
    console.log("Respuesta completa:", responseText)
    
    // Parsear la respuesta solo si hay contenido
    const responseData = responseText ? JSON.parse(responseText) : {}
    
    if (!response.ok) {
      console.error("Error del servidor:", responseData)
      throw responseData
    }
    
    console.log(`Mensaje enviado exitosamente a ${formattedTo}`)
    return responseData
  } catch (error) {
    console.error("Error detallado al enviar el mensaje:", error)
    throw error
  }
}

/**
 * Envía un mensaje de plantilla (template) a través de la API de WhatsApp.
 * @param recipientPhone Número de teléfono del destinatario (con signo +).
 * @param accessToken Token de acceso para la API.
 * @param senderId Identificador del teléfono remitente.
 * @returns true si se envió correctamente.
 */
export async function sendTemplateMessage (recipientPhone: string,
  accessToken: string, senderId: string, nameTemplate: string): Promise<boolean> {
  const apiUrl = `https://graph.facebook.com/v22.0/${senderId}/messages`
  const messageData = {
    messaging_product: "whatsapp",
    to: recipientPhone,
    type: "template",
    template: {
      name: nameTemplate,
      language: { code: "ES" }
    }
  }
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(messageData)
    })
    if (!response.ok) {
      const errorData = await response.json()
      throw errorData.error || errorData
    }
    return true
  } catch (error) {
    console.error("Error en el envío de plantilla:", error)
    throw error
  }
}
