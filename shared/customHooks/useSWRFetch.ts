import useSWR, { SWRConfiguration } from "swr"
import { axiosInstance } from "../instances/axios-instance"

// Función fetcher usando axios
const fetcher = (url: string) => axiosInstance.get(url).then(res => res.data)

export const useSWRFetch = <T>(url: string, options?: SWRConfiguration) => {
  const { data, error, mutate } = useSWR<T>(url, fetcher, options)
  const isLoading = !error && !data

  // Nueva función para hacer la consulta manualmente
  const manualFetch = async (): Promise<T> => {
    const result = await fetcher(url)
    // Actualiza el caché sin revalidar
    mutate(result, false)
    return result
  }

  return {
    data,
    error,
    isLoading,
    manualFetch
  }
}
