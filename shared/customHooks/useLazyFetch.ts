import { useState } from "react"
import { axiosInstance } from "../instances/axios-instance"

type Data<T> = T | null;
type ErrorType = any;

// eslint-disable-next-line no-unused-vars
interface Params<T> {
    data : Data<T>,
    isLoading: boolean,
    error: ErrorType
}

export const useLazyFetch = <T>(url: string) => {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<any>(null)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const response = await axiosInstance.get(url)
      if (response.status !== 200) {
        throw new Error("Error en la petición")
      }
      setData(response.data)
    } catch (error) {
      setError(error)
    } finally {
      setIsLoading(false)
    }
  }

  return { data, isLoading, error, fetchData }
}
