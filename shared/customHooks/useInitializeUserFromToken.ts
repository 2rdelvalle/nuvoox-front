import { useEffect } from "react"
import { getCookieToken, getDataFromToken } from "@/shared/utilities/functions/sessionUtils"
import { useToast } from "@/shared/context/toast/toastContext"
import { JWTAuth } from "@/shared/models"
import { usePush } from "@/shared/hooks/usePush"
import { useChatStore } from "@/app/(main)/chat/whatsapp/store/chat-store"

export const useInitializeUserFromToken = () => {
  const { showError } = useToast()
  const { onClickAction: goHome } = usePush("/")
  const { setUser: setUserStore } = useChatStore()

  useEffect(() => {
    const token = getCookieToken()
    if (!token) return

    try {
      const dataToken: JWTAuth = getDataFromToken(token)
      if (dataToken?.user) {
        setUserStore(dataToken.user)
      } else {
        showError("Usuario No Encontrado")
      }
    } catch (error) {
      showError("Error al obtener los datos del usuario")
      goHome()
    }
  }, [])
}
