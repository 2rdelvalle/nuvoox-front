/* eslint-disable max-len */
import { CodeCountries, Conversation } from "@/shared/models/conversation/conversation.model"
import { TransferChat } from "@/shared/models/conversation/transferChat"
import axios from "axios"

const conversationEndpoint = `${process.env.NEXT_PUBLIC_URL_SIRA_BACK}/conversation`
const ConversationService = {
  getCodeCountries: () => axios.get<CodeCountries[]>(`${conversationEndpoint}/codeCountries`),
  getConversationsFromUserAndNumber: (userId : number, numbeOfMaintance : string) =>
    axios.get<Conversation[]>(`${conversationEndpoint}/getConversations/${userId}/${numbeOfMaintance}`),
  saveConversation: (conversation : Conversation) => axios.post<Conversation>(conversationEndpoint, conversation),
  transferChat: (transfer : TransferChat) => axios.post<TransferChat>(`${conversationEndpoint}/transfer`, transfer)
}
export default ConversationService
