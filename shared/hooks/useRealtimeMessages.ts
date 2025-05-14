import { useEffect, useState } from "react"
import { io } from "socket.io-client"

// Define el tipo de mensaje con todas las propiedades necesarias
interface Message {
    from: string;
    text: string;
    timestamp: string;
    // Propiedades adicionales que se usan en la aplicación
    idWhatsapp?: string;
    content?: string; 
    sentAt?: number;
    owner?: string;
    type?: string;
    numberDestination?: string;
    received?: boolean;
}

const useRealtimeMessages = (socketUrl: string) => {
  const [messages, setMessages] = useState<Message[]>([]) // Define el estado con tipo Message[]

  useEffect(() => {
    const socket = io(socketUrl)

    // Escucha mensajes entrantes
    socket.on("message", (message: Message) => {
      setMessages((prev) => [...prev, message]) // Ahora TypeScript reconoce el tipo
    })

    return () => {
      socket.disconnect() // Desconecta el socket al desmontar el componente
    }
  }, [socketUrl])

  // Limpiar los mensajes
  const clearMessages = () => setMessages([])

  return { messages, clearMessages }
}

export default useRealtimeMessages
