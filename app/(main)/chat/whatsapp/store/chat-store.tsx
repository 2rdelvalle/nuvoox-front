import { NumbersOfMaintanceCaratule, UserCaratule } from "@/shared/models"
import { ConversationCaratule, Conversation } from "@/shared/models/conversation/conversation.model"
import { create } from "zustand"

type useChatStoreForm = {
    user: UserCaratule
    setUser: (user : UserCaratule) => void
    dialogNewNumber: boolean
    setDialogNewNumber: () => void
    activeConversation: ConversationCaratule | null
    setActiveConversation: (cnv : ConversationCaratule) => void
    conversations: Conversation[]
    setConversations: (cnv : Conversation[]) => void
    conversationsNotAssigned: Conversation[]
    setConversationsNotAssigned: (cnv : Conversation[]) => void
    pushConversations: (cnv : Conversation[]) => void
    deleteConversation: (cnv : Conversation) => void
    updateConversation: (cnv : Conversation) => void
    incrementUnreadCount: (conversationId: number) => void
    resetUnreadCount: (conversationId: number) => void
    actualNumberOfMaintanceSelected: NumbersOfMaintanceCaratule | null
    setActualNumberOfMaintanceSelected: (number : NumbersOfMaintanceCaratule) => void
    dialogTransfer : boolean,
    setDialogTransfer : (state : boolean) => void
    resetAll: () => void,
    resetConversation: () => void
    sidebarConversationVisible: boolean
    selectedSidebarConversationInfo: ConversationCaratule | null
    setSidebarConversationVisible: (visible: boolean) => void
    setselectedSidebarConversationInfo: (conversation: ConversationCaratule) => void
}

export const useChatStore = create<useChatStoreForm>((set) => ({
  user: {} as UserCaratule,
  setUser: (user) => set({ user }),
  dialogNewNumber: false,
  setDialogNewNumber: () => set((state) => ({ dialogNewNumber: !state.dialogNewNumber })),
  conversations: [],
  conversationsNotAssigned: [],
  activeConversation: null,
  setActiveConversation: (cnv) => set({ activeConversation: cnv }),
  setConversations: (cnv : Conversation[]) => set((state) => ({ conversations: cnv })),
  setConversationsNotAssigned: (cnv : Conversation[]) => set((state) => ({ conversationsNotAssigned: cnv })),
  pushConversations: (cnv : Conversation[]) => set((state) => ({ conversations: [...state.conversations, ...cnv] })),
  updateConversation: (cnv) => set((state) => ({
    conversations: state.conversations.map((c) => (c.id === cnv.id ? { ...c, ...cnv } : c))
  })),
  incrementUnreadCount: (conversationId: number) => set((state) => ({
    conversations: state.conversations.map((c) => (
      c.conversationid === conversationId 
        ? { ...c, unreadCount: (c.unreadCount || 0) + 1 } 
        : c
    ))
  })),
  resetUnreadCount: (conversationId: number) => set((state) => ({
    conversations: state.conversations.map((c) => (
      c.conversationid === conversationId 
        ? { ...c, unreadCount: 0 } 
        : c
    ))
  })),
  deleteConversation: (cnv) => set((state) => ({ conversations: state.conversations.filter((c) => c.id !== cnv.id) })),
  actualNumberOfMaintanceSelected: null,
  setActualNumberOfMaintanceSelected: (number) => set((state) => ({ actualNumberOfMaintanceSelected: number })),
  dialogTransfer: false,
  setDialogTransfer: (sta) => set((state) => ({ dialogTransfer: sta })),
  resetAll: () => set({ conversations: [], actualNumberOfMaintanceSelected: null, activeConversation: null }),
  resetConversation: () => set({ conversations: [] }),
  sidebarConversationVisible: false,
  selectedSidebarConversationInfo: null,
  setSidebarConversationVisible: (visible) => set({ sidebarConversationVisible: visible }),
  setselectedSidebarConversationInfo: (conversation) => set({ selectedSidebarConversationInfo: conversation })
}))
