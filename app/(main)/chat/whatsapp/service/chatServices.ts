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
    // Validation failed: Empty or invalid recipient phone number
    throw new Error("El número de teléfono de destino es requerido")
  }
  
  if (!message || !message.trim()) {
    // Validation failed: Empty message
    throw new Error("El contenido del mensaje es requerido")
  }
  
  if (!token || !token.trim()) {
    throw new Error("El token de acceso es requerido")
  }
  
  if (!senderId || !senderId.trim()) {
    throw new Error("El ID del remitente es requerido")
  }
  
  // Asegurar que el número de teléfono tenga el formato correcto
  // El número debe empezar con '+' y contener solo dígitos después
  const formattedTo = to.startsWith('+') ? to : `+${to}`
  
  
  const apiUrl = `https://graph.facebook.com/v22.0/${senderId}/messages`
  const messageData = {
    messaging_product: "whatsapp",
    to: formattedTo,
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
    
    const responseText = await response.text()
    
    // Parsear la respuesta solo si hay contenido
    const responseData = responseText ? JSON.parse(responseText) : {}
    
    if (!response.ok) {
      // Server error occurred
      throw responseData
    }
    

    return responseData
  } catch (error) {
    // Error occurred while sending message
    throw error
  }
}

/**
 * Envía un mensaje de plantilla (template) a través de la API de WhatsApp.
 * Primero notifica al backend para consumir saldo y luego envía la plantilla directamente a WhatsApp.
 * 
 * @param recipientPhone Número de teléfono del destinatario (con signo +).
 * @param accessToken Token de acceso para la API.
 * @param senderId Identificador del teléfono remitente.
 * @param nameTemplate Nombre de la plantilla sin prefijo.
 * @param companyId ID de la empresa.
 * @param companyInitials Dos primeras letras del nombre de la empresa.
 * @param templateId ID opcional de la plantilla en la base de datos.
 * @returns true si se envió correctamente.
 */
export async function sendTemplateMessage (
  recipientPhone: string,
  accessToken: string, 
  senderId: string, 
  nameTemplate: string, 
  companyId: number,
  companyInitials: string,
  destination: string = "CO" // País destino por defecto
): Promise<boolean> {
  try {
    // Paso 1: Notificar al backend para validación de saldo y registro del envío
    console.log(`Notificando al backend sobre envío de plantilla: ${nameTemplate} para empresa ID: ${companyId}`);
    
    const backendResponse = await axiosInstance.post('/templates/send-template', {
      companyId,
      templateName: nameTemplate,
      recipientPhone,
      senderId,
      accessToken,
      companyInitials,
      destination
    });
    
    if (!backendResponse.data?.success) {
      console.error('Error en la validación del backend:', backendResponse.data);
      throw new Error(backendResponse.data?.message || 'Error validando el envío de plantilla');
    }
    
    // Determinar si es una plantilla multimedia basándose en la respuesta del backend
    const templateData = backendResponse.data?.templateData || {};
    const isMultimedia = templateData.categoryTemplateWhatsapp === 'image' || 
                         templateData.categoryTemplateWhatsapp === 'video' || 
                         templateData.categoryTemplateWhatsapp === 'document' || 
                         templateData.categoryTemplateWhatsapp === 'audio' || 
                         templateData.categoryTemplateWhatsapp === 'multimedia';
    
    console.log(`[DEBUG] Tipo de plantilla detectado: ${templateData.categoryTemplateWhatsapp || 'desconocido'}`);
    console.log(`[DEBUG] Es plantilla multimedia: ${isMultimedia ? 'SÍ' : 'NO'}`);
    
    // Paso 2: Preparar el nombre de la plantilla según su tipo
    let finalTemplateName;
    
    // Primero verificar si el backend nos proporcionó el nombre con prefijo
    const whatsappTemplateName = backendResponse.data?.whatsappTemplateName;
    
    if (whatsappTemplateName) {
      // Si el backend proporciona el nombre con prefijo, usarlo directamente
      finalTemplateName = whatsappTemplateName;
      console.log(`[DEBUG] Usando nombre con prefijo proporcionado por el backend: ${finalTemplateName}`);
    } else {
      // Comportamiento anterior para mantener compatibilidad
      if (isMultimedia) {
        finalTemplateName = nameTemplate.toLowerCase();
        console.log(`[DEBUG] Usando nombre de plantilla multimedia SIN prefijo: ${finalTemplateName}`);
      } else {
        finalTemplateName = nameTemplate.toLowerCase();
        console.log(`[DEBUG] Usando nombre de plantilla de texto SIN prefijo: ${finalTemplateName}`);
      }
      // Advertencia para facilitar la depuración
      console.warn('[WARN] Backend no proporcionó whatsappTemplateName, usando nombre sin prefijo que podría causar errores');
    }
    
    // Paso 3: Enviar la plantilla a la API de WhatsApp
    const apiUrl = `https://graph.facebook.com/v22.0/${senderId}/messages`
    
    // Usar la información multimedia que ya obtuvimos previamente
    let mediaUrl = templateData.mediaUrl;
    const mediaType = templateData.categoryTemplateWhatsapp;
    
    console.log(`[DEBUG] Información de plantilla: mediaUrl=${mediaUrl}, mediaType=${mediaType}`);
    
    // Crear la estructura de datos base para el mensaje
    const messageData: any = {
      messaging_product: "whatsapp",
      to: recipientPhone,
      type: "template",
      template: {
        name: finalTemplateName,
        language: { code: "es" }
      }
    };
    
    // Validaciones detalladas para información multimedia
    console.log("[DEBUG] mediaUrl recibido:", mediaUrl);
    console.log("[DEBUG] tipo de plantilla:", mediaType);
    
    // Validar que mediaUrl existe y no está vacío
    const isMediaUrlValid = !!mediaUrl && typeof mediaUrl === 'string' && mediaUrl.trim() !== '';
    console.log(`[DEBUG] ¿mediaUrl es válido? ${isMediaUrlValid ? 'SÍ' : 'NO'}`);
    
    // Validar que mediaUrl comienza con https://
    const isHttpsUrl = isMediaUrlValid && mediaUrl.startsWith('https://');
    console.log(`[DEBUG] ¿mediaUrl es HTTPS? ${isHttpsUrl ? 'SÍ' : 'NO'}`);
    
    // Validar que el tipo coincide con lo que se espera enviar
    const isCorrectMediaType = mediaType === 'image' || mediaType === 'video' || 
                              mediaType === 'document' || mediaType === 'audio';
    console.log(`[DEBUG] ¿Tipo de media correcto? ${isCorrectMediaType ? 'SÍ' : 'NO'}`);
    
    // Detalle completo de la información multimedia
    console.log('[DEBUG] Resumen de validación multimedia:', {
      finalTemplateName,
      mediaUrl,
      mediaType,
      isMultimedia,
      isMediaUrlValid,
      isHttpsUrl,
      isCorrectMediaType
    });
    
    // Si es plantilla multimedia, agregar los componentes necesarios
    if (isMultimedia && isMediaUrlValid && isHttpsUrl) {
      console.log(`[DEBUG] Agregando componentes multimedia para plantilla: ${finalTemplateName}`);
      
      // Para plantillas de imagen, se requiere el componente header
      messageData.template.components = [
        {
          type: "header",
          parameters: [
            {
              type: "image",
              image: {
                link: mediaUrl
              }
            }
          ]
        }
      ];
      
      console.log(`[DEBUG] Componentes agregados: ${JSON.stringify(messageData.template.components)}`);
    } else if (isMultimedia) {
      // Si se identifica como multimedia pero falta información, alertar
      console.error(`[ERROR] Plantilla marcada como multimedia pero falta información válida:`, {
        mediaUrl,
        mediaType,
        isMediaUrlValid,
        isHttpsUrl
      });
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(messageData)
    })
    
    const responseText = await response.text();
    const responseData = responseText ? JSON.parse(responseText) : {};
    
    if (!response.ok) {
      console.error(`Error al enviar plantilla a WhatsApp: ${JSON.stringify(responseData)}`);
      throw responseData.error || responseData;
    }
    
    // Logs detallados de la respuesta de WhatsApp
    console.log(`Plantilla ${nameTemplate} enviada exitosamente a ${recipientPhone}`);
    console.log(`Respuesta de WhatsApp: ${JSON.stringify({
      messageId: responseData.messages?.[0]?.id || 'N/A',
      status: responseData.messages?.[0]?.status || 'N/A',
      timestamp: new Date().toISOString()
    })}`);
    return true;
  } catch (error) {
    console.error('Error al enviar plantilla:', error);
    throw error;
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
    const response = await axiosInstance.get(`${API_ENDPOINTS.AGENTS}?companyId=${companyId}`);
    // Si la API ya filtra por tipo, podemos omitir esto
    // return response.data.filter((user: any) => user.type === 'AGENT');
    return response.data;
  } catch (error) {
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
    const response = await axiosInstance.get(`${API_ENDPOINTS.GROUPS}?companyId=${companyId}`);
    return response.data;
  } catch (error) {
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
    // Validation failed: Empty or invalid recipient phone number
    throw new Error("El número de teléfono de destino es requerido");
  }
  
  if (!file) {
    // Validation failed: Empty or invalid file
    throw new Error("El archivo a enviar es requerido");
  }
  
  if (!accessToken || !accessToken.trim()) {
    // Validation failed: Empty access token
    throw new Error("El token de acceso es requerido");
  }
  
  if (!senderId || !senderId.trim()) {
    // Validation failed: Empty sender ID
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
  
      throw responseData;
    }
    
    return responseData;
  } catch (error) {

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
