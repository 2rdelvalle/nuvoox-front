"use client"
import { useState, useEffect } from "react"
import { useToast } from "../context/toast/toastContext"
import { getValidationErrors } from "../utilities/getValidationErrors/getValidationErrors"

export const useFetch = (method: Function) => {
  const [responseData, setResponseData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { showError } = useToast()

  const callback = () => {
    setIsLoading(true)
    const fetchData = async () => {
      try {
        await method()
          .then(async ({ data } : any) => {
            setResponseData(data)
          })
      } catch (badRequest : any) {
        console.log(badRequest)
        showError(getValidationErrors(badRequest.code))
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(callback, [])

  return { responseData, setResponseData, isLoading, callback }
}
