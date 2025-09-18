"use client"
import { useState, useCallback } from "react"
import { useToast } from "../context/toast/toastContext"
import { getValidationErrors } from "../utilities/getValidationErrors/getValidationErrors"

export const useFetchWithParams = <T, >(
  method: (params: T) => Promise<any>
) => {
  const [responseData, setResponseData] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { showError } = useToast()

  const fetchData = useCallback(async (params: T) => {
    // DEBUG: Identificar qué archivo está haciendo la llamada
    const stack = new Error().stack?.split('\n')[2] || 'desconocido'
    const caller = stack.includes('page.tsx') ? stack.split('/').pop()?.split(':')[0] || 'unknown' : 'unknown'
    
    console.log(`🔄 [useFetchWithParams] Iniciando petición desde: ${caller}`)
    console.log(`📤 [useFetchWithParams] Parámetros:`, params)
    console.log(`🕐 [useFetchWithParams] Timestamp:`, new Date().toISOString())
    
    setIsLoading(true)
    try {
      const { data } = await method(params)
      console.log(`✅ [useFetchWithParams] Éxito desde: ${caller}`, data?.length || 0, 'elementos')
      setResponseData(data)
    } catch (error: any) {
      console.error(`❌ [useFetchWithParams] ERROR desde: ${caller}`)
      console.error("=== ERROR EN SOLICITUD ===")
      console.error("URL:", error?.config?.url)
      console.error("Método:", error?.config?.method)
      console.error("Status:", error?.response?.status)
      console.error("Mensaje:", error?.message)
      console.error("Respuesta:", error?.response?.data)
      console.error("=== FIN DE ERROR ===")
      showError(getValidationErrors(error?.response?.status || error.code))
    } finally {
      setIsLoading(false)
      console.log(`🏁 [useFetchWithParams] Finalizando petición desde: ${caller}`)
    }
  }, [method, showError])

  return { responseData, setResponseData, isLoading, fetchData }
}
