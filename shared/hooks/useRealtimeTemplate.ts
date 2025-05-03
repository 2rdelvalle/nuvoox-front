import { useEffect, useState } from "react"
import { io } from "socket.io-client"

interface dataResponse {
    data: {
        templateStatus: string;
        templateName: string;
        templateLanguage: string;
      }
}

const useRealtimeTemplate = (socketUrl: string) => {
  const [data, setData] = useState<dataResponse>() // Define el estado con tipo Message[]

  useEffect(() => {
    const socket = io(socketUrl)

    // Escucha mensajes entrantes
    socket.on("template", (dataResponse: any) => {
      console.log("Mensaje recibido:", dataResponse)
      setData(dataResponse) // Ahora TypeScript reconoce el tipo
    })

    return () => {
      socket.disconnect() // Desconecta el socket al desmontar el componente
    }
  }, [socketUrl])

  // Limpiar los mensajes
  const clearData = () => setData(undefined)

  return { data, clearData }
}

export default useRealtimeTemplate
