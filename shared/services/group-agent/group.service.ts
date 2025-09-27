/* eslint-disable max-len */
import { GroupAgent } from "@/shared/models"
import axios from "axios"

const groupAgentEndpoint = `${process.env.NEXT_PUBLIC_URL_SIRA_BACK}/group-company-user`
/**
 * Interface que define la estructura de un agente con datos completos
 */
export interface EnrichedAgent {
  id: number;
  userId: number;
  name: string;
  email?: string;
  phone?: string;
  document?: string;
  initials: string;
}

/**
 * Interface que define la estructura de un grupo con agentes enriquecidos
 */
export interface EnrichedGroupAgent extends GroupAgent {
  agents: EnrichedAgent[];
}

const GroupAgentService = {
  caratule: () => axios.get<any[]>(`${groupAgentEndpoint}/caratule`),
  create: (ga: GroupAgent) => axios.post<GroupAgent>(`${groupAgentEndpoint}/save`, ga),
  getGroupAgentsWithUsers: (companyId: number) => axios.get<GroupAgent[]>(`${groupAgentEndpoint}/getGroupAgentsWithUsers/${companyId}`),
  deleteGroupAgentWithID: (groupId: number) => axios.delete(`${groupAgentEndpoint}/${groupId}`),
  /**
   * Actualiza un grupo de agentes existente
   * @param groupId ID del grupo a actualizar
   * @param groupData Datos actualizados del grupo
   * @returns Promesa con la respuesta del servidor
   */
  update: (groupId: number, groupData: GroupAgent) => 
    axios.put<GroupAgent>(`${groupAgentEndpoint}/${groupId}`, groupData),
  
  /**
   * Obtiene grupos de agentes con datos completos de usuario
   * Este método consume el nuevo endpoint que proporciona información enriquecida
   * @param companyId ID de la compañía
   * @returns Grupos con datos completos de agentes
   */
  getGroupAgentsWithFullDetails: (companyId: number) => 
    axios.get<EnrichedGroupAgent[]>(`${groupAgentEndpoint}/full-agents-data/${companyId}`)
}
export default GroupAgentService
