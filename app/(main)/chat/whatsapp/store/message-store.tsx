import { MessageModel } from "@/shared/models/conversation/messages.model"
import { create } from "zustand"

type useMessageStoreForm = {
    messages: MessageModel[]
    setMessages: (cnv : MessageModel[]) => void
    // push message : recibe un message model lo agrega y ordena el arreglo de mensajes por fecha
    pushMessage: (cnv : MessageModel) => void
    resetAll: () => void,
    newMessage?: MessageModel | null
}

export const useMessageStore = create<useMessageStoreForm>((set) => ({
  messages: [],
  newMessage: null,
  setMessages: (cnv : MessageModel[]) => set((state) => ({ messages: cnv })),
  pushMessage: (cnv : MessageModel) => set((state) => {
    // Removed console.logs to prevent unnecessary renders
    return {
      messages: [...state.messages, cnv].sort((a, b) => 
        // Ordenar por sentAt que es el campo que contiene la marca de tiempo en milisegundos
        (a.sentAt || 0) - (b.sentAt || 0)
      )
    };
  }),
  resetAll: () => set({ messages: [] })
}))
