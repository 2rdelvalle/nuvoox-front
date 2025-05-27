import { WhatsAppResponseSendMessage } from "@/shared/models/conversation/messages.model"
import { axiosInstance } from "@/shared/instances/axios-instance"

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

// Configuración de endpoints correcta
const API_ENDPOINTS = {
  AGENTS: '/users/type/agent', // Endpoint para obtener agentes
  GROUPS: '/groups'          // Endpoint para obtener grupos
};

/**
 * Obtiene la lista de agentes disponibles para transferencia
 * @param companyId ID de la compañía
 * @returns Lista de agentes (solo usuarios de tipo agente)
 */
export async function getAgents(companyId: string): Promise<Agent[]> {
  try {
    console.log(`Fetching agents from: ${process.env.NEXT_PUBLIC_URL_SIRA_BACK}${API_ENDPOINTS.AGENTS}`);
    const response = await axiosInstance.get(`${API_ENDPOINTS.AGENTS}?companyId=${companyId}`);
    // Si la API ya filtra por tipo, podemos omitir esto
    // return response.data.filter((user: any) => user.type === 'AGENT');
    return response.data;
  } catch (error) {
    console.error('Error fetching agents:', {
      url: `${process.env.NEXT_PUBLIC_URL_SIRA_BACK}${API_ENDPOINTS.AGENTS}`,
      error
    });
    // En caso de error, devolver un array vacío para evitar errores en la UI
    return [];
  }
}

/**
 * Obtiene la lista de grupos disponibles para transferencia
 * @param companyId ID de la compañía
 * @returns Lista de grupos
 */
export async function getGroups(companyId: string): Promise<Group[]> {
  try {
    console.log(`Fetching groups from: ${process.env.NEXT_PUBLIC_URL_SIRA_BACK}${API_ENDPOINTS.GROUPS}`);
    const response = await axiosInstance.get(`${API_ENDPOINTS.GROUPS}?companyId=${companyId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching groups:', {
      url: `${process.env.NEXT_PUBLIC_URL_SIRA_BACK}${API_ENDPOINTS.GROUPS}`,
      error
    });
    // En caso de error, devolver un array vacío para evitar errores en la UI
    return [];
  }
}

/**
 * Envía un mensaje con contenido multimedia (imagen, video, documento) a través de la API de WhatsApp.
 * @param recipientPhone Número de teléfono del destinatario (con signo +)
 * @param file Archivo a enviar (debe ser una imagen, video o documento)
 * @param accessToken Token de acceso para la API
 * @param senderId Identificador del teléfono remitente
 * @param description Descripción opcional del archivo (caption)
 * @returns Objeto con la respuesta de la API (similar a sendPlainMessage)
 */
export async function sendMediaMessage(
  recipientPhone: string,
  file: File,
  accessToken: string,
  senderId: string,
  description?: string
): Promise<WhatsAppResponseSendMessage> {
  // Validaciones
  if (!recipientPhone || !recipientPhone.trim()) {
    console.error("Error: Número de teléfono destino vacío o inválido");
    throw new Error("El número de teléfono de destino es requerido");
  }
  
  if (!file) {
    console.error("Error: Archivo vacío o inválido");
    throw new Error("El archivo a enviar es requerido");
  }
  
  if (!accessToken || !accessToken.trim()) {
    console.error("Error: Token de acceso vacío");
    throw new Error("El token de acceso es requerido");
  }
  
  if (!senderId || !senderId.trim()) {
    console.error("Error: ID del remitente vacío");
    throw new Error("El ID del remitente es requerido");
  }
  
  // Asegurar que el número de teléfono tenga el formato correcto
  const formattedTo = recipientPhone.startsWith('+') ? recipientPhone : `+${recipientPhone}`;
  
  // Determinar el tipo de media
  let mediaType = 'document';
  if (file.type.startsWith('image/')) {
    mediaType = 'image';
  } else if (file.type.startsWith('video/')) {
    mediaType = 'video';
  }
  
  // Convertir archivo a Base64
  const base64Data = await fileToBase64(file);
  const mediaId = await uploadMedia(base64Data, file.type, accessToken, senderId);
  
  const apiUrl = `https://graph.facebook.com/v22.0/${senderId}/messages`;
  const messageData = {
    messaging_product: "whatsapp",
    to: formattedTo,
    type: mediaType,
    [mediaType]: {
      id: mediaId,
      // Usar la descripción si se proporciona, de lo contrario usar el nombre del archivo
      caption: description || file.name
    }
  };
  
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(messageData)
    });
    
    const responseText = await response.text();
    const responseData = responseText ? JSON.parse(responseText) : {};
    
    if (!response.ok) {
      console.error("Error del servidor al enviar media:", responseData);
      throw responseData;
    }
    
    console.log(`Archivo enviado exitosamente a ${formattedTo}`);
    return responseData;
  } catch (error) {
    console.error("Error detallado al enviar archivo:", error);
    throw error;
  }
}

/**
 * Carga un archivo multimedia al servidor de WhatsApp para obtener un media_id
 * @param base64Data Datos del archivo en formato Base64
 * @param mimeType Tipo MIME del archivo
 * @param accessToken Token de acceso para la API
 * @param senderId ID del remitente
 * @returns ID del media cargado
 */
async function uploadMedia(
  base64Data: string,
  mimeType: string,
  accessToken: string,
  senderId: string
): Promise<string> {
  const apiUrl = `https://graph.facebook.com/v22.0/${senderId}/media`;
  
  // Eliminar el prefijo de datos base64 si existe
  const base64Clean = base64Data.replace(/^data:[^;]+;base64,/, '');
  
  const formData = new FormData();
  formData.append('messaging_product', 'whatsapp');
  formData.append('file', base64ToBlob(base64Clean, mimeType));
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw errorData.error || errorData;
    }
    
    const responseData = await response.json();
    return responseData.id; // Devuelve el media_id
  } catch (error) {
    console.error('Error al cargar media:', error);
    throw error;
  }
}

/**
 * Convierte un archivo a una cadena Base64
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

/**
 * Convierte una cadena Base64 a un objeto Blob
 */
function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteArrays = [];
  
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  
  return new Blob(byteArrays, { type: mimeType });
}
