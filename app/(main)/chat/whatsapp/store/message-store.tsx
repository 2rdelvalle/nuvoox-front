import { MessageModel } from "@/shared/models/conversation/messages.model"
import { create } from "zustand"

type useMessageStoreForm = {
    messages: MessageModel[]
    setMessages: (cnv : MessageModel[]) => void
    // push message : recibe un message model lo agrega y ordena el arreglo de mensajes por fecha
    pushMessage: (cnv : MessageModel) => void
    resetAll: () => void,
}

export const useMessageStore = create<useMessageStoreForm>((set) => ({
  messages: [],
  setMessages: (cnv : MessageModel[]) => set((state) => ({ messages: cnv })),
  pushMessage: (cnv : MessageModel) => set((state) => ({ messages: [...state.messages, cnv].sort((a, b) => a.sentAt - b.sentAt) })),
  resetAll: () => set({ messages: [] })
}))
