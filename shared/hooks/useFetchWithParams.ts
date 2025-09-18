"use client"
import { useState, useCallback, useRef } from "react"
import { useToast } from "../context/toast/toastContext"
import { getValidationErrors } from "../utilities/getValidationErrors/getValidationErrors"

export const useFetchWithParams = <T, >(
  method: (params: T) => Promise<any>
) => {
  const [responseData, setResponseData] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { showError } = useToast()

  // Contador para detectar llamadas excesivas y prevenir loops
  const callCountRef = useRef(0)
  const lastCallTimeRef = useRef(0)

  const fetchData = useCallback(async (params: T) => {
    const now = Date.now()
    const timeSinceLastCall = now - lastCallTimeRef.current
    
    // Reiniciar contador si han pasado más de 5 segundos
    if (timeSinceLastCall > 5000) {
      callCountRef.current = 0
    }
    
    callCountRef.current++
    lastCallTimeRef.current = now
    
    // PROTECCIÓN CONTRA LOOPS: Bloquear si hay más de 3 llamadas en 5 segundos
    if (callCountRef.current > 3 && timeSinceLastCall < 5000) {
      console.error(`🚫 [useFetchWithParams] LOOP DETECTADO Y BLOQUEADO - ${callCountRef.current} llamadas en ${timeSinceLastCall}ms`)
      console.error('🔍 [useFetchWithParams] Stack trace:', new Error().stack)
      return
    }
    
    // DEBUG: Identificar qué archivo está haciendo la llamada
    const stack = new Error().stack?.split('\n') || []
    const caller = stack.find(line => line.includes('.tsx') || line.includes('.ts'))?.split('/').pop()?.split(':')[0] || 'unknown'
    
    console.log(`🔄 [useFetchWithParams] Petición #${callCountRef.current} desde: ${caller}`)
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
