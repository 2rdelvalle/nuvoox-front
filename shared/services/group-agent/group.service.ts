/* eslint-disable max-len */
import { GroupAgent } from "@/shared/models"
import axios from "axios"

const groupAgentEndpoint = `${process.env.NEXT_PUBLIC_URL_SIRA_BACK}/group-company-user`
const GroupAgentService = {
  caratule: () => axios.get<any[]>(`${groupAgentEndpoint}/caratule`),
  create: (ga: GroupAgent) => axios.post<GroupAgent>(`${groupAgentEndpoint}/save`, ga),
  getGroupAgentsWithUsers: (companyId: number) => axios.get<GroupAgent[]>(`${groupAgentEndpoint}/getGroupAgentsWithUsers/${companyId}`),
  deleteGroupAgentWithID: (groupId: number) => axios.delete(`${groupAgentEndpoint}/${groupId}`)
}
export default GroupAgentService
