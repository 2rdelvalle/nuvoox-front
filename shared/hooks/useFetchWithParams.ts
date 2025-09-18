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
    setIsLoading(true)
    try {
      const { data } = await method(params)
      setResponseData(data)
    } catch (error: any) {
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
    }
  }, [method, showError])

  return { responseData, setResponseData, isLoading, fetchData }
}
