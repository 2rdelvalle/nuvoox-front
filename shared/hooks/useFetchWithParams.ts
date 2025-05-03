"use client"
import { useState } from "react"
import { useToast } from "../context/toast/toastContext"
import { getValidationErrors } from "../utilities/getValidationErrors/getValidationErrors"

export const useFetchWithParams = <T, >(
  method: (params: T) => Promise<any>
) => {
  const [responseData, setResponseData] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { showError } = useToast()

  const fetchData = async (params: T) => {
    setIsLoading(true)
    try {
      const { data } = await method(params)
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
