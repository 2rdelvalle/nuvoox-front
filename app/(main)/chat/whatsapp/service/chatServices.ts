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
  console.log("aqui")
  const apiUrl = `https://graph.facebook.com/v22.0/${senderId}/messages`
  const messageData = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: message }
  }
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(messageData)
    })
    if (!response.ok) {
      const errorData = await response.json()
      throw errorData
    }
    console.log(`Mensaje enviado a ${to}: ${message}`)
    return response.json()
  } catch (error) {
    console.error("Error al enviar el mensaje:", error)
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
