import { useEffect, useState } from "react"
import { axiosInstance } from "../instances/axios-instance"

type Data<T> = T | null;
type ErrorType = any;

interface Params<T> {
    data : Data<T>,
    isLoading: boolean,
    error: ErrorType
}

export const useFetch = <T>(url: string): Params<T> => {
  const [data, setData] = useState<Data<T>>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<ErrorType>(null)
  useEffect(() => {
    const fethData = async () => {
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

    fethData()
  }, [url])

  return {
    data,
    isLoading,
    error
  }
}
