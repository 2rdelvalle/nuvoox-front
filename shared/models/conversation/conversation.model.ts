import { NumbersOfMaintanceCaratule } from "../company"
import { UserCaratule } from "../user"

export interface CodeCountries {
  country_code: string;
  country_name: string;
  phone_code: number;
}
/**
 * Interfaz que representa una conversación de WhatsApp
 */
export interface Conversation {
    id?: number;
    indicative: number;
    destination_number: string;
    start?: Date;
    end?: Date;
    user: UserCaratule,
    numberOfMaintance : NumbersOfMaintanceCaratule
    image? : string
    conversationid? : number
    phone: string;
    /**
     * Número de mensajes no leídos en esta conversación
     * Utilizado para mostrar notificaciones y contadores en la UI
     */
    unreadCount?: number;
  }

export interface ConversationCaratule {
  conversationid: number;
  destination_number: string;
  indicative: number;
  start: string;
  end: string;
  phone: string;
  agentName?: string; // Nombre personalizado para el agente
}
