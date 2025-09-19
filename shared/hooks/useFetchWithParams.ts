"use client"
import { useState, useCallback, useEffect, useRef } from 'react'
import { useToast } from "../context/toast/toastContext"
import { getValidationErrors } from "../utilities/getValidationErrors/getValidationErrors"

// 🔍 DEBUG: Función para identificar quién llama al hook
const getCaller = (): string => {
  const stack = new Error().stack
  if (!stack) return 'unknown'
  
  const lines = stack.split('\n')
  // Buscar la primera línea que no sea del hook actual
  for (let i = 3; i < Math.min(lines.length, 10); i++) {
    const line = lines[i]
    if (line && !line.includes('useFetchWithParams') && !line.includes('fetchData')) {
      // Extraer el nombre del archivo/componente
      const match = line.match(/at\s+([^\s]+)\s+\(.*[\\/]([^\\/:]+):[0-9]+:[0-9]+\)/)
      if (match) {
        return `${match[2]}:${match[1]}`
      }
      const simpleMatch = line.match(/[\\/]([^\\/:]+):[0-9]+:[0-9]+/)
      if (simpleMatch) {
        return simpleMatch[1]
      }
    }
  }
  return 'unknown'
}

// 🔍 DEBUG: Mapa global para rastrear ejecuciones por caller
const executeCount = new Map<string, number>()

interface UseFetchOptions<T> {
  /** Parámetros iniciales para cargar automáticamente al montar */
  initialParams?: T;
  /** Si debe cargar automáticamente al montar (solo si initialParams está presente) */
  autoFetch?: boolean;
}

export const useFetchWithParams = <T, >(
  method: (params: T) => Promise<any>,
  options?: UseFetchOptions<T>
) => {
  const [responseData, setResponseData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<any>(null)
  
  // DEBUG: Referencias para rastreo completo
  const renderCountRef = useRef(0)
  const fetchCountRef = useRef(0)
  const lastMethodRef = useRef<string>('')
  const hookIdRef = useRef(`hook-${Math.random().toString(36).substring(7)}`)
  
  // DEBUG: Incrementar contador de renders
  renderCountRef.current += 1
  
  // DEBUG: Detectar si el method cambia entre renders
  const methodSignature = method.toString().substring(0, 100)
  const methodChanged = lastMethodRef.current !== methodSignature
  if (methodChanged) {
    console.log(`🔄 [${hookIdRef.current}] METHOD CAMBIÓ`, {
      render: renderCountRef.current,
      oldMethod: lastMethodRef.current.substring(0, 50),
      newMethod: methodSignature.substring(0, 50),
      options
    })
    lastMethodRef.current = methodSignature
  }
  
  console.log(`📊 [${hookIdRef.current}] RENDER #${renderCountRef.current}`, {
    isLoading,
    hasData: !!responseData,
    hasError: !!error,
    fetchCount: fetchCountRef.current,
    methodChanged,
    options
  })
  const { showError: showToastError } = useToast()
  const showError = (error: any) => {
    const message = getValidationErrors(error)
    showToastError(message)
  }

  // Función que ejecuta la petición HTTP
  const fetchData = useCallback(async (params: T) => {
    fetchCountRef.current += 1
    
    // 🔍 DEBUG: Información detallada de la llamada
    const caller = getCaller() || 'unknown'
    const stackTrace = new Error().stack?.split('\n').slice(2, 8).join('\n') || ''
    
    console.log(`🚀 [${hookIdRef.current}] FETCH INICIADO #${fetchCountRef.current}`, {
      caller,
      params,
      render: renderCountRef.current,
      timestamp: new Date().toISOString(),
      method: methodSignature.substring(0, 50)
    })
    
    console.log(`📍 [${hookIdRef.current}] STACK TRACE:`, stackTrace)
    
    // 🛡️ Verificar protección anti-loops
    const currentCount = executeCount.get(caller) || 0
    const maxAllowed = currentCount === 0 ? 2 : 3 // Primer caller: 2, siguientes: 3
    
    if (currentCount >= maxAllowed) {
      console.warn(`⚠️ [${hookIdRef.current}] PROTECCIÓN ANTI-LOOP activada para: ${caller}`, {
        currentCount,
        maxAllowed,
        caller,
        fetchCount: fetchCountRef.current,
        render: renderCountRef.current,
        allExecuteCounts: Object.fromEntries(executeCount)
      })
      return
    }
    
    executeCount.set(caller, currentCount + 1)
    
    console.log(`🔄 [${hookIdRef.current}] Ejecutando desde: ${caller}`, {
      params,
      executeCount: currentCount + 1,
      maxAllowed,
      fetchCount: fetchCountRef.current,
      render: renderCountRef.current,
      allExecuteCounts: Object.fromEntries(executeCount)
    })
    
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await method(params)
      setResponseData(result)
      console.log(`✅ [${hookIdRef.current}] ÉXITO desde: ${caller}`, {
        fetchCount: fetchCountRef.current,
        render: renderCountRef.current,
        dataLength: result?.length || 'N/A'
      })
    } catch (err) {
      setError(err)
      console.error(`❌ [${hookIdRef.current}] ERROR desde: ${caller}`, {
        error: err,
        fetchCount: fetchCountRef.current,
        render: renderCountRef.current,
        params
      })
      showError(err)
    } finally {
      setIsLoading(false)
      console.log(`🏁 [${hookIdRef.current}] FETCH TERMINADO #${fetchCountRef.current}`)
    }
  }, []) // SIN DEPENDENCIAS para evitar recreación

  // useEffect para auto-fetch inicial si se proporcionan initialParams y autoFetch
  useEffect(() => {
    console.log(`🎬 [${hookIdRef.current}] useEffect MONTADO`, {
      render: renderCountRef.current,
      fetchCount: fetchCountRef.current,
      hasOptions: !!options,
      autoFetch: options?.autoFetch,
      hasInitialParams: !!options?.initialParams,
      initialParams: options?.initialParams,
      timestamp: new Date().toISOString()
    })
    
    if (options?.autoFetch && options?.initialParams) {
      console.log(`🚀 [${hookIdRef.current}] Auto-ejecutando fetch inicial`, {
        initialParams: options.initialParams,
        render: renderCountRef.current
      })
      fetchData(options.initialParams)
    } else {
      console.log(`⏸️ [${hookIdRef.current}] NO auto-fetch`, {
        autoFetch: options?.autoFetch,
        hasInitialParams: !!options?.initialParams
      })
    }
    
    // DEBUG: Cleanup function para detectar desmontado
    return () => {
      console.log(`💀 [${hookIdRef.current}] HOOK DESMONTADO`, {
        finalRenderCount: renderCountRef.current,
        finalFetchCount: fetchCountRef.current
      })
    }
  }, []) // SIN dependencias - solo se ejecuta al montar

  // Función manual para refrescar con nuevos parámetros
  const refetch = useCallback((newParams: T) => {
    console.log(`🔄 [${hookIdRef.current}] Refetch manual solicitado`, { newParams })
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
