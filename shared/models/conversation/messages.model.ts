/* eslint-disable no-unused-vars */
export enum MESSAGE_TYPE {
    TEXT = "text",
    IMAGE = "image",
    VIDEO = "video",
    AUDIO = "audio",
    DOCUMENT = "document",
    LOCATION = "location",
}

export enum MESSAGE_OWNER {
    AGENT = "AGENT",
    CLIENT = "CLIENT",
  }

export interface MessageModel {
  from?: string;
  content: string;
  idWhatsapp?: string;
  conversationId?: number;
  id?: number;
  received?: boolean;
  sentAt: number;
  type: MESSAGE_TYPE;
  owner: MESSAGE_OWNER;
}

interface MessageWhatsapp {
  id: string;
}

interface ContactWhatsapp {
  input: string;
  wa_id: string;
}
export interface WhatsAppResponseSendMessage {
  messaging_product: string;
  contacts: MessageWhatsapp[];
  messages: MessageWhatsapp[];
}
