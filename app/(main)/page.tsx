"use client"
import CardInformation from "@/shared/small-components/card-information/card-information"
import { useChatStore } from "./chat/whatsapp/store/chat-store"
import { useInitializeUserFromToken } from "@/shared/customHooks/useInitializeUserFromToken"
import { useSWRRequest } from "@/shared/customHooks/useSWRRequest"
import { BlockUI } from "primereact/blockui"
import { useEffect } from "react"

interface Dashboard {
  messagesSent: number;
  messagesReceived: number;
  conversations: number;
}
interface DashBoardResponse {
  dashboard: Dashboard;
}

export default function Home () {
  useInitializeUserFromToken()

  const { user } = useChatStore()

  const { fetchData, data: dashboard, loading } = useSWRRequest<DashBoardResponse>()

  async function getDashBoard () {
    fetchData(`/dashBoard/getDashboard/${user?.company?.companyId}`)
  }

  useEffect(() => {
    getDashBoard()
  }, [user?.company?.companyId])

  return (
    <BlockUI fullScreen={true} blocked={loading}>
        <div className="grid">
            <div className="col-12 md:col-6 xl:col-4">
                <CardInformation title="Mensajes Enviados" data={dashboard?.dashboard.messagesSent.toString() || "0"} />
            </div>
            <div className="col-12 md:col-6 xl:col-4">
                <CardInformation title="Mensajes Recibidos" data={dashboard?.dashboard.messagesReceived.toString() || "0"} />
            </div>
            <div className="col-12 md:col-6 xl:col-4">
                <CardInformation title="Conversaciones" data={dashboard?.dashboard.conversations.toString() || "0"} />
            </div>
        </div>
    </BlockUI>
  )
}
