"use client"
import { useState } from "react"
import { useToast } from "../context/toast/toastContext"
import { getValidationErrors } from "../utilities/getValidationErrors/getValidationErrors"

export const useFetchWithMultiParams = <T extends any[]>(
  method: (...args: T) => Promise<any> // Cambiado para aceptar múltiples argumentos
) => {
  const [responseData, setResponseData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { showError } = useToast()

  const fetchData = async (...args: T) => { // Ajustado para múltiples argumentos
    setIsLoading(true)
    try {
      const { data } = await method(...args)
      setResponseData(data)
    } catch (error: any) {
      console.error(error)
      showError(getValidationErrors(error.code))
    } finally {
      setIsLoading(false)
    }
  }

  return { responseData, setResponseData, isLoading, fetchData }
}
