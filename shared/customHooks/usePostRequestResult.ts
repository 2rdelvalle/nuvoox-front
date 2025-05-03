import { useState } from "react"
import { axiosInstance } from "../instances/axios-instance"
import { useToast } from "../context/toast/toastContext"

interface UsePostRequestResult<TResponse> {
  data: TResponse | null;
  error: string | null;
  loading: boolean;
  postData: (endpoint: string, body: any) => Promise<any>;
  putData: (endpoint: string, body: any) => Promise<any>;
  deleteData: (endpoint: string) => Promise<any>;
}

export function usePostRequest<TRequest, TResponse> (): UsePostRequestResult<TResponse> {
  const [data, setData] = useState<TResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const { showError } = useToast()

  const postData = async (endpoint: string, body: TRequest) => {
    setLoading(true)
    setError(null)
    try {
      const response = await axiosInstance.post<TResponse>(endpoint, body)
      setData(response.data)
      return response.data
    } catch (err: any) {
      showError(err.response?.data?.message || "Error en la petición")
      setError(err.response?.data?.message || "Error en la petición")
    } finally {
      setLoading(false)
    }
  }

  const putData = async (endpoint: string, body: TRequest) => {
    setLoading(true)
    setError(null)
    try {
      const response = await axiosInstance.put<TResponse>(endpoint, body)
      setData(response.data)
    } catch (err: any) {
      showError(err.response?.data?.message || "Error en la petición")
      setError(err.response?.data?.message || "Error en la petición")
    } finally {
      setLoading(false)
    }
  }

  const deleteData = async (endpoint: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await axiosInstance.delete<TResponse>(endpoint)
      setData(response.data)
    } catch (err: any) {
      showError(err.response?.data?.message || "Error en la petición")
      setError(err.response?.data?.message || "Error en la petición")
    } finally {
      setLoading(false)
    }
  }

  return { data, error, loading, postData, putData, deleteData }
}
