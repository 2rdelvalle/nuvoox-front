import { UserCaratule, UserFormModel } from "@/shared/models"
import axios from "axios"

const userEndpoint = `${process.env.NEXT_PUBLIC_URL_SIRA_BACK}/users`
const userService = {
  getCaratules: () => axios.get<UserCaratule[]>(`${userEndpoint}/caratule`),
  getNumbersOfMaintanceFromUserId: (userId: string) => axios.get<UserCaratule[]>(`${userEndpoint}/numbers/${userId}`),
  getCaratulesFromUserCompany: (user: UserCaratule) => {
    console.log(`📋 [userService] getCaratulesFromUserCompany llamado con:`, user)
    console.log(`🌐 [userService] URL:`, `${userEndpoint}/caratule`)
    console.log(`🕐 [userService] Timestamp:`, new Date().toISOString())
    return axios.post<UserCaratule[]>(`${userEndpoint}/caratule`, user)
  },
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
    axios.get(`${userEndpoint}/${companyId}/company`),

  // 🔧 PRODUCCION SEGURA: Servicio inteligente con fallback automático
  getCaratulesFromUserCompanyWithRetry: async (user: UserCaratule) => {
    // 🚨 MODO DEBUG FORZADO TEMPORALMENTE para identificar payload correcto
    const isDebugMode = true // FORZAR DEBUG HASTA RESOLVER EL 400 ERROR
    
    console.log(`🔧 [userService] NODE_ENV: ${process.env.NODE_ENV}`)
    console.log(`🔧 [userService] DEBUG_API: ${process.env.DEBUG_API}`)
    console.log(`🔧 [userService] isDebugMode: ${isDebugMode}`)
    
    if (!isDebugMode) {
      // 🏭 MODO PRODUCCIÓN: Usar payload optimizado basado en testing
      const productionPayload = {
        userId: user.userId,
        name: user.name,
        mail: user.mail,
        company: user.company,
        role: user.role,
        status: user.status,
        can_send_campaigns: Boolean(user.can_send_campaigns)
      }
      console.log(`🏭 [userService] MODO PRODUCCIÓN - Payload optimizado`)
      return axios.post<UserCaratule[]>(`${userEndpoint}/caratule`, productionPayload)
    }

    // 🧪 MODO DESARROLLO: Sistema de retry para debugging
    console.log(`🔄 [userService] MODO DEBUG - Iniciando retry sistemático`)
    
    const payloads = [
      // Payload 1: Completo con boolean conversion
      {
        userId: user.userId,
        name: user.name,
        mail: user.mail,
        company: user.company,
        role: user.role,
        status: user.status,
        can_send_campaigns: Boolean(user.can_send_campaigns)
      },
      // Payload 2: Solo campos esenciales
      {
        userId: user.userId,
        name: user.name,
        mail: user.mail,
        company: user.company,
        role: user.role
      },
      // Payload 3: Con status pero sin can_send_campaigns
      {
        userId: user.userId,
        name: user.name,
        mail: user.mail,
        company: user.company,
        role: user.role,
        status: user.status
      },
      // Payload 4: Solo IDs de relaciones
      {
        userId: user.userId,
        name: user.name,
        mail: user.mail,
        companyId: user.company?.companyId,
        roleId: user.role?.roleId
      }
    ]

    for (let i = 0; i < payloads.length; i++) {
      const payload = payloads[i]
      console.log(`🧪 [userService] INTENTO ${i + 1}/${payloads.length}:`, payload)
      
      try {
        const response = await axios.post<UserCaratule[]>(`${userEndpoint}/caratule`, payload)
        console.log(`✅ [userService] ÉXITO en intento ${i + 1} con payload:`, payload)
        return response
      } catch (error: any) {
        console.log(`❌ [userService] FALLO en intento ${i + 1}:`, error?.response?.status, error?.response?.data)
        
        if (i === payloads.length - 1) {
          console.log(`🚫 [userService] TODOS LOS INTENTOS FALLARON`)
          throw error
        }
      }
    }
  }
}
export default userService
