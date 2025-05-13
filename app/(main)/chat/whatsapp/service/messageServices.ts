import { axiosInstance } from "@/shared/instances/axios-instance";
import { MessageModel } from "@/shared/models/conversation/messages.model";

/**
 * Obtiene todos los mensajes para una conversación específica y devuelve el último
 * @param conversationId ID de la conversación
 * @returns Promesa con el último mensaje de la conversación o null si no hay mensajes
 */
export const getLastMessage = async (conversationId: number): Promise<MessageModel | null> => {
  if (!conversationId) return null;
  
  try {
    // Sabemos que este endpoint existe en producción
    const response = await axiosInstance.post("/message/getMessages", {
      conversationId
    });
    
    // Si hay mensajes, devolver el último (más reciente por timestamp)
    if (response.data && Array.isArray(response.data) && response.data.length > 0) {
      // Ordenar por fecha de envío (más reciente primero)
      const sortedMessages = [...response.data].sort((a, b) => {
        const timeA = typeof a.sentAt === 'number' ? a.sentAt : 0;
        const timeB = typeof b.sentAt === 'number' ? b.sentAt : 0;
        return timeB - timeA;
      });
      
      return sortedMessages[0];
    }
    
    return null;
  } catch (error) {
    console.error("Error al obtener el último mensaje:", error);
    return null;
  }
};

/**
 * Obtiene los últimos mensajes para un conjunto de conversaciones
 * @param conversationIds Array de IDs de conversaciones
 * @returns Promesa con un objeto que mapea IDs de conversación a su último mensaje
 */
export const getLastMessagesForConversations = async (
  conversationIds: number[]
): Promise<Record<number, MessageModel>> => {
  if (!conversationIds || conversationIds.length === 0) return {};
  
  try {
    // Obtener los últimos mensajes uno por uno usando endpoints existentes
    const result: Record<number, MessageModel> = {};
    
    // Procesamos las conversaciones en paralelo para mayor eficiencia
    const promises = conversationIds.map(async (id) => {
      try {
        const lastMessage = await getLastMessage(id);
        if (lastMessage) {
          result[id] = lastMessage;
        }
      } catch (innerError) {
        console.error(`Error al obtener el último mensaje para la conversación ${id}:`, innerError);
        // No interrumpimos el proceso por un solo error
      }
    });
    
    await Promise.all(promises);
    return result;
  } catch (error) {
    console.error("Error al obtener los últimos mensajes:", error);
    return {};
  }
};
