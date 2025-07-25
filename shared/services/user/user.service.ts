import { UserCaratule, UserFormModel } from "@/shared/models"
import axios from "axios"

const userEndpoint = `${process.env.NEXT_PUBLIC_URL_SIRA_BACK}/users`
const userService = {
  getCaratules: () => axios.get<UserCaratule[]>(`${userEndpoint}/caratule`),
  getNumbersOfMaintanceFromUserId: (userId: string) => axios.get<UserCaratule[]>(`${userEndpoint}/numbers/${userId}`),
  getCaratulesFromUserCompany: (user: UserCaratule) => axios.post<UserCaratule[]>(`${userEndpoint}/caratule`, user),
  create: (user: UserFormModel) => axios.post<UserFormModel>(userEndpoint, user),
  update: (user: UserFormModel) => axios.put<UserFormModel>(userEndpoint, user),
  findById: (userId: string) => axios.get<UserFormModel>(`${userEndpoint}/findByID/${userId}`),
  deleteById: (userId: string) => axios.delete<UserFormModel>(`${userEndpoint}/${userId}`),
  
  /**
   * Get agents by company ID
   * @param companyId Company ID to filter agents
   * @returns Promise with list of agents
   */
  getAgentsByCompany: (companyId: number) => 
    axios.get(`${userEndpoint}/${companyId}/company`)
}
export default userService
