import { NumbersOfMaintanceCaratule, UserCaratule } from "@/shared/models"
import { ConversationCaratule, Conversation } from "@/shared/models/conversation/conversation.model"
import { create } from "zustand"

type useChatStoreForm = {
    user: UserCaratule
    setUser: (user : UserCaratule) => void
    dialogNewNumber: boolean
    setDialogNewNumber: () => void
    activeConversation: ConversationCaratule | null
    // Enhanced to prevent duplicate API calls
    setActiveConversation: (cnv : ConversationCaratule | null) => void
    conversations: Conversation[]
    setConversations: (cnv : Conversation[]) => void
    conversationsNotAssigned: Conversation[]
    setConversationsNotAssigned: (cnv : Conversation[]) => void
    pushConversations: (cnv : Conversation[]) => void
    deleteConversation: (cnv: Conversation | ConversationCaratule) => void
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
    // New property to track which conversation IDs have already had their messages fetched
    fetchedConversationIds: Set<number>
    // Method to mark a conversation as having its messages fetched
    markConversationFetched: (conversationId: number) => void
    // Method to check if a conversation's messages have been fetched
    hasConversationBeenFetched: (conversationId: number) => boolean
    // Method to reset the fetch status for a specific conversation
    resetConversationFetchStatus: (conversationId: number) => void
}

export const useChatStore = create<useChatStoreForm>((set, get) => ({
  user: {} as UserCaratule,
  setUser: (user) => set({ user }),
  dialogNewNumber: false,
  setDialogNewNumber: () => set((state) => ({ dialogNewNumber: !state.dialogNewNumber })),
  conversations: [],
  conversationsNotAssigned: [],
  activeConversation: null,
  setActiveConversation: (cnv) => {
    const state = get();
    
    // Handle null case safely
    if (!cnv) {
      set({ activeConversation: null });
      return;
    }
    
    // Only update if it's a different conversation
    if (state.activeConversation?.conversationid !== cnv.conversationid) {
      // Reset unread count when selecting a conversation
      if (cnv.conversationid) {
        // Directly use the resetUnreadCount logic instead of calling the function
        // to avoid potential circular references
        set((state) => ({
          conversations: state.conversations.map((c) => (
            c.conversationid === cnv.conversationid 
              ? { ...c, unreadCount: 0 } 
              : c
          ))
        }));
      }
      
      // Set the active conversation
      set({ activeConversation: cnv });
    }
  },
  setConversations: (cnv : Conversation[]) => set((state) => ({ conversations: cnv })),
  setConversationsNotAssigned: (cnv : Conversation[]) => set((state) => ({ conversationsNotAssigned: cnv })),
  pushConversations: (cnv : Conversation[]) => set((state) => {
    console.log("➕ Agregando conversaciones:", cnv.map(c => c.conversationid));
    return { conversations: [...state.conversations, ...cnv] };
  }),
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
  resetUnreadCount: (conversationId: number) => {
    // Validate conversationId to avoid issues
    if (!conversationId) return;
    
    // Update the conversations state directly without causing circular references
    set((state) => ({
      conversations: state.conversations.map((c) => (
        c.conversationid === conversationId 
          ? { ...c, unreadCount: 0 } 
          : c
      ))
    }));
  },
  deleteConversation: (cnv: Conversation | ConversationCaratule) => set((state) => {
    const conversationId = cnv?.conversationid || (cnv as any)?.id;
    if (!conversationId) return state;
    console.log("🗑️ Eliminando conversación:", conversationId);
    return { 
      conversations: state.conversations.filter((c) => c.conversationid !== conversationId) 
    };
  }),
  actualNumberOfMaintanceSelected: null,
  setActualNumberOfMaintanceSelected: (number) => set((state) => ({ actualNumberOfMaintanceSelected: number })),
  dialogTransfer: false,
  setDialogTransfer: (sta) => set((state) => ({ dialogTransfer: sta })),
  resetAll: () => set({ conversations: [], actualNumberOfMaintanceSelected: null, activeConversation: null }),
  resetConversation: () => set({ conversations: [] }),
  sidebarConversationVisible: false,
  selectedSidebarConversationInfo: null,
  setSidebarConversationVisible: (visible) => set({ sidebarConversationVisible: visible }),
  setselectedSidebarConversationInfo: (conversation) => set({ selectedSidebarConversationInfo: conversation }),
  
  // New property to track which conversation IDs have already had their messages fetched
  fetchedConversationIds: new Set<number>(),
  
  // Mark a conversation as having its messages fetched
  markConversationFetched: (conversationId: number) => set((state) => {
    const updatedSet = new Set(state.fetchedConversationIds);
    updatedSet.add(conversationId);
    return { fetchedConversationIds: updatedSet };
  }),
  
  // Check if a conversation's messages have been fetched
  hasConversationBeenFetched: (conversationId: number) => {
    return get().fetchedConversationIds.has(conversationId);
  },
  
  // Reset the fetch status for a specific conversation
  resetConversationFetchStatus: (conversationId: number) => set((state) => {
    const updatedSet = new Set(state.fetchedConversationIds);
    updatedSet.delete(conversationId);
    return { fetchedConversationIds: updatedSet };
  })
}))
