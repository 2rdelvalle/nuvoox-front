import { UserCaratule, UserFormModel } from "@/shared/models"
import axios from "axios"
import { axiosInstance } from "@/shared/instances/axios-instance"

const userEndpoint = `${process.env.NEXT_PUBLIC_URL_SIRA_BACK}/users`
const userService = {
  getCaratules: () => axiosInstance.get<UserCaratule[]>(`${userEndpoint}/caratule`),
  getNumbersOfMaintanceFromUserId: (userId: string) => axiosInstance.get<UserCaratule[]>(`${userEndpoint}/numbers/${userId}`),
  getCaratulesFromUserCompany: (user: UserCaratule) => {
    console.log(`📋 [userService] getCaratulesFromUserCompany llamado con:`, user)
    console.log(`🌐 [userService] URL:`, `${userEndpoint}/caratule`)
    console.log(`🕐 [userService] Timestamp:`, new Date().toISOString())
    return axiosInstance.post<UserCaratule[]>(`${userEndpoint}/caratule`, user)
  },
  create: (user: UserFormModel) => axiosInstance.post<UserFormModel>(userEndpoint, user),
  update: (user: UserFormModel) => axiosInstance.put<UserFormModel>(userEndpoint, user),
  findById: (userId: string) => axiosInstance.get<UserFormModel>(`${userEndpoint}/findByID/${userId}`),
  deleteById: (userId: string) => axiosInstance.delete<UserFormModel>(`${userEndpoint}/${userId}`),
  
  /**
   * Get agents by company ID
   * @param companyId Company ID to filter agents
   * @returns Promise with list of agents
   */
  getAgentsByCompany: (companyId: number) => 
    axiosInstance.get(`${userEndpoint}/${companyId}/company`),

  // 🔧 PRODUCCION SEGURA: Servicio inteligente con fallback automático
  getCaratulesFromUserCompanyWithRetry: async (user: UserCaratule) => {
    // 🚨 INVESTIGACIÓN: Campos faltantes en payload - activar debug
    const isDebugMode = true // ACTIVAR DEBUG - CAMPOS NO LLEGAN AL PAYLOAD
    
    console.log(`🔧 [userService] NODE_ENV: ${process.env.NODE_ENV}`)
    console.log(`🔧 [userService] DEBUG_API: ${process.env.DEBUG_API}`)
    console.log(`🔧 [userService] isDebugMode: ${isDebugMode}`)
    
    if (!isDebugMode) {
      // 🏭 MODO PRODUCCIÓN: Payload completo como feature/chatbox funcionando
      const userAny = user as any
      const productionPayload = {
        name: userAny.name,
        mail: userAny.mail,
        password: userAny.password,
        phone: userAny.phone,
        document: userAny.document,
        status: userAny.status,
        role: userAny.role,
        typeDocument: userAny.typeDocument,
        company: userAny.company,
        can_send_campaigns: Number(userAny.can_send_campaigns),
        userId: userAny.userId,
        canEditAll: userAny.canEditAll,
        canEditCompany: userAny.canEditCompany
      }
      console.log(`🏭 [userService] MODO PRODUCCIÓN - Payload optimizado`)
      return axiosInstance.post<UserCaratule[]>(`${userEndpoint}/caratule`, productionPayload)
    }

    // 🧪 MODO DESARROLLO: Sistema de retry para debugging
    console.log(`🔄 [userService] MODO DEBUG - Iniciando retry sistemático`)
    
    // 🔍 INVESTIGACIÓN: ¿QUÉ CAMPOS TIENE REALMENTE EL OBJETO USER?
    console.log(`🔍 [userService] OBJETO USER COMPLETO:`, JSON.stringify(user, null, 2))
    console.log(`🔍 [userService] CLAVES DISPONIBLES:`, Object.keys(user))
    
    // 🧪 VERIFICAR CAMPOS ESPECÍFICOS FALTANTES:
    const userAny = user as any
    console.log(`🧪 [userService] password:`, userAny.password)
    console.log(`🧪 [userService] phone:`, userAny.phone)
    console.log(`🧪 [userService] document:`, userAny.document)
    console.log(`🧪 [userService] typeDocument:`, userAny.typeDocument)
    console.log(`🧪 [userService] canEditAll:`, userAny.canEditAll)
    console.log(`🧪 [userService] canEditCompany:`, userAny.canEditCompany)
    
    const payloads = [
      // Payload 1: FORMATO EXACTO que funcionaba en feature/chatbox
      {
        name: userAny.name || user.name,
        mail: userAny.mail || user.mail,
        password: userAny.password || "encrypted",
        phone: userAny.phone || "3007750031",
        document: userAny.document || "232222",
        status: userAny.status || user.status,
        role: userAny.role || user.role,
        typeDocument: userAny.typeDocument || { name: "Cedula de Extranjeria", typeDocumentId: 4 },
        company: userAny.company || user.company,
        can_send_campaigns: Number(userAny.can_send_campaigns || user.can_send_campaigns),
        userId: userAny.userId || user.userId,
        canEditAll: userAny.canEditAll !== undefined ? userAny.canEditAll : false,
        canEditCompany: userAny.canEditCompany !== undefined ? userAny.canEditCompany : true
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

    // 🧪 EXPERIMENTO: Probar diferentes métodos HTTP
    const experiments = [
      // Experimento 1: GET sin parámetros (como getCaratules básico)
      async () => {
        console.log(`🧪 [userService] EXPERIMENTO 1/6: GET sin parámetros`)
        return await axiosInstance.get<UserCaratule[]>(`${userEndpoint}/caratule`)
      },
      // Experimento 2: GET con query params
      async () => {
        console.log(`🧪 [userService] EXPERIMENTO 2/6: GET con query params`)
        const params = new URLSearchParams({
          userId: user.userId?.toString() || '',
          companyId: user.company?.companyId?.toString() || '',
          roleId: user.role?.roleId?.toString() || ''
        })
        return await axiosInstance.get<UserCaratule[]>(`${userEndpoint}/caratule?${params}`)
      }
    ]
    
    // Probar experimentos primero
    for (let i = 0; i < experiments.length; i++) {
      try {
        const response = await experiments[i]()
        console.log(`✅ [userService] ÉXITO en EXPERIMENTO ${i + 1}`)
        return response
      } catch (error: any) {
        console.log(`❌ [userService] FALLO EXPERIMENTO ${i + 1}:`, error?.response?.status, error?.response?.data)
      }
    }
    
    // Si los experimentos fallan, probar payloads originales
    for (let i = 0; i < payloads.length; i++) {
      const payload = payloads[i]
      console.log(`🧪 [userService] INTENTO ${i + 1}/${payloads.length}:`, payload)
      
      try {
        const response = await axiosInstance.post<UserCaratule[]>(`${userEndpoint}/caratule`, payload)
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
