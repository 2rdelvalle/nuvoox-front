"use client"
import { useState, useCallback, useRef, useEffect } from "react"
import { useToast } from "../context/toast/toastContext"
import { getValidationErrors } from "../utilities/getValidationErrors/getValidationErrors"

interface UseFetchOptions<T> {
  /** Parámetros iniciales para cargar automáticamente al montar */
  initialParams?: T;
  /** Si debe cargar automáticamente al montar (solo si initialParams está presente) */
  autoFetch?: boolean;
}

export const useFetchWithParams = <T, >(
  method: (params: T) => Promise<any>,
  options: UseFetchOptions<T> = {}
) => {
  const [responseData, setResponseData] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { showError } = useToast()
  const { initialParams, autoFetch = true } = options

  // Contador para detectar llamadas excesivas y prevenir loops
  const callCountRef = useRef(0)
  const lastCallTimeRef = useRef(0)
  const isInitialLoadRef = useRef(true)

  // Función de fetch estable que NO cambia con dependencias
  const fetchData = useCallback(async (params: T) => {
    const now = Date.now()
    const timeSinceLastCall = now - lastCallTimeRef.current
    
    // Reiniciar contador si han pasado más de 5 segundos
    if (timeSinceLastCall > 5000) {
      callCountRef.current = 0
    }
    
    callCountRef.current++
    lastCallTimeRef.current = now
    
    // PROTECCIÓN CONTRA LOOPS: Más permisivo en la primera carga
    const maxCalls = isInitialLoadRef.current ? 2 : 3
    if (callCountRef.current > maxCalls && timeSinceLastCall < 5000) {
      console.error(`🚫 [useFetchWithParams] LOOP DETECTADO Y BLOQUEADO - ${callCountRef.current} llamadas en ${timeSinceLastCall}ms`)
      console.error('🔍 [useFetchWithParams] Stack trace:', new Error().stack)
      return
    }
    
    // DEBUG: Identificar qué archivo está haciendo la llamada
    const stack = new Error().stack?.split('\n') || []
    const caller = stack.find(line => line.includes('.tsx') || line.includes('.ts'))?.split('/').pop()?.split(':')[0] || 'unknown'
    
    console.log(`🔄 [useFetchWithParams] Petición #${callCountRef.current} desde: ${caller} ${isInitialLoadRef.current ? '(inicial)' : ''}`)
    console.log(`📤 [useFetchWithParams] Parámetros:`, params)
    
    setIsLoading(true)
    try {
      const { data } = await method(params)
      console.log(`✅ [useFetchWithParams] Éxito desde: ${caller}`, data?.length || 0, 'elementos')
      setResponseData(data)
      isInitialLoadRef.current = false
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
  }, []) // ⭐ SIN DEPENDENCIAS - esto evita recreaciones constantes

  // Carga inicial automática si se proporcionan parámetros iniciales
  useEffect(() => {
    if (initialParams && autoFetch) {
      console.log('🔄 [useFetchWithParams] Carga inicial automática con parámetros:', initialParams)
      fetchData(initialParams)
    }
  }, []) // ⭐ SIN DEPENDENCIAS - solo se ejecuta una vez al montar

  // Función manual para refrescar con nuevos parámetros
  const refetch = useCallback((newParams: T) => {
    console.log('🔄 [useFetchWithParams] Refetch manual solicitado')
    fetchData(newParams)
  }, [fetchData])

  return { 
    responseData, 
    setResponseData, 
    isLoading, 
    fetchData,
    refetch
  }
}

// Hook auxiliar para casos donde necesitas carga condicional
export const useFetchWithConditionalParams = <T, >(
  method: (params: T) => Promise<any>,
  condition: boolean,
  params?: T
) => {
  // Usa el hook principal con carga automática condicional
  return useFetchWithParams(method, {
    initialParams: condition && params ? params : undefined,
    autoFetch: condition && !!params
  })
}
