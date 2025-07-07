/* eslint-disable max-len */
import { CodeCountries, Conversation } from "@/shared/models/conversation/conversation.model"
import { TransferChat } from "@/shared/models/conversation/transferChat"
import axios from "axios"

const conversationEndpoint = `${process.env.NEXT_PUBLIC_URL_SIRA_BACK}/conversation`

// Interceptor para logging de solicitudes
axios.interceptors.request.use(request => {
  console.log('=== INICIO DE SOLICITUD ===');
  console.log('URL:', request.url);
  console.log('Método:', request.method);
  console.log('Headers:', request.headers);
  console.log('Datos:', request.data);
  console.log('=== FIN DE SOLICITUD ===');
  return request;
});

// Interceptor para logging de respuestas
axios.interceptors.response.use(
  response => {
    console.log('=== RESPUESTA EXITOSA ===');
    console.log('URL:', response.config.url);
    console.log('Status:', response.status);
    console.log('Datos:', response.data);
    console.log('=== FIN DE RESPUESTA ===');
    return response;
  },
  error => {
    console.error('=== ERROR EN SOLICITUD ===');
    console.error('URL:', error.config?.url);
    console.error('Método:', error.config?.method);
    console.error('Status:', error.response?.status);
    console.error('Mensaje:', error.message);
    console.error('Respuesta:', error.response?.data);
    console.error('=== FIN DE ERROR ===');
    return Promise.reject(error);
  }
);

const ConversationService = {
  getCodeCountries: () => {
    console.log('Obteniendo códigos de países...');
    return axios.get<CodeCountries[]>(`${conversationEndpoint}/codeCountries`);
  },
  
  getConversationsFromUserAndNumber: (userId: number, numbeOfMaintance: string) => {
    console.log('Obteniendo conversaciones para usuario:', { userId, numbeOfMaintance });
    return axios.get<Conversation[]>(`${conversationEndpoint}/getConversations/${userId}/${numbeOfMaintance}`);
  },
  
  saveConversation: (conversation: Conversation) => {
    console.log('Guardando conversación:', conversation);
    return axios.post<Conversation>(conversationEndpoint, conversation);
  },
  
  transferChat: (transfer: TransferChat) => {
    console.log('=== INICIANDO TRANSFERENCIA DE CHAT ===');
    console.log('Endpoint:', `${conversationEndpoint}/transfer`);
    console.log('Datos de transferencia:', JSON.stringify(transfer, null, 2));
    
    return axios.post<TransferChat>(`${conversationEndpoint}/transfer`, transfer)
      .then(response => {
        console.log('Transferencia exitosa:', response.data);
        return response;
      })
      .catch(error => {
        console.error('Error en transferencia:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            headers: error.config?.headers,
            data: error.config?.data
          }
        });
        return Promise.reject(error);
      });
  }
};

export default ConversationService;
