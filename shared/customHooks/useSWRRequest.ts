"use client"
import useSWR from "swr"
import { axiosInstance } from "../instances/axios-instance"
import { useState } from "react"
// ...existing code...

export function useSWRRequest<TResponse> () {
  // Inicialmente no se tiene endpoint para no instanciar la petición
  const [endpoint, setEndpoint] = useState<string | null>(null)
  const url = endpoint ? `${axiosInstance.defaults.baseURL || ""}${endpoint}` : null

  // fetcher usando axiosInstance
  const fetcher = (url: string) =>
    axiosInstance.get<TResponse>(url).then(res => res.data)

  // revalidateOnMount deshabilitado para no ejecutar la consulta al montar
  const { data, error, mutate } = useSWR<TResponse>(url, fetcher)

  // Función para iniciar la consulta manualmente
  const fetchData = (newEndpoint: string) => {
    setEndpoint(newEndpoint)
    mutate() // Dispara la validación una vez que se actualiza el endpoint
  }

  return {
    data,
    error,
    loading: endpoint !== null && !data && !error,
    fetchData,
    mutate
  }
}

// Ejemplo de uso por consola:
// const { fetchData, data, error, loading } = useSWRRequest<MyResponseType>()
// console.log("Antes de la consulta:", data)
// fetchData("/mi/endpoint?param=value")
// // Luego se puede monitorear data, error o loading en el componente o con console.log
