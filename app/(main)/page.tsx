"use client"
import CardInformation from "@/shared/small-components/card-information/card-information"
import MetricsCard from "@/shared/components/dashboard/MetricsCard"
import { useChatStore } from "./chat/whatsapp/store/chat-store"
import { useInitializeUserFromToken } from "@/shared/customHooks/useInitializeUserFromToken"
import { useSWRRequest } from "@/shared/customHooks/useSWRRequest"
import { BlockUI } from "primereact/blockui"
import { useEffect } from "react"

interface Dashboard {
  messagesSent: number;
  messagesReceived: number;
  conversations: number;
  companiesCreated: number;
  companiesCreatedHistory: number[];
  companiesLabels: string[];
  agentsByCompany?: {
    companyNames: string[];
    agentCounts: number[];
  };
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
            <div className="col-12 md:col-12 xl:col-12">
                <MetricsCard
                  title="Proporción de Mensajes"
                  value={0}
                  data={[
                    dashboard?.dashboard.messagesSent || 0,
                    dashboard?.dashboard.messagesReceived || 0,
                    dashboard?.dashboard.conversations || 0
                  ]}
                  labels={["Enviados", "Recibidos", "Conversaciones"]}
                  metricType="pie"
                />
            </div>
            {/* Gráficas solo para superadmin */}
            {user?.role?.name === 'SUPERADMIN' && (
              <>
                <div className="col-12 md:col-6 xl:col-4">
                  <MetricsCard
                    title="Empresas Creadas"
                    value={dashboard?.dashboard.companiesCreated || 0}
                    data={dashboard?.dashboard.companiesCreatedHistory || []}
                    labels={dashboard?.dashboard.companiesLabels || []}
                    metricType="companies"
                  />
                </div>
                
                <div className="col-12 md:col-6 xl:col-8">
                  <MetricsCard
                    title="Agentes por Empresa"
                    value={dashboard?.dashboard.agentsByCompany?.agentCounts.reduce((sum, count) => sum + count, 0) || 0}
                    data={dashboard?.dashboard.agentsByCompany?.agentCounts || []}
                    labels={dashboard?.dashboard.agentsByCompany?.companyNames || []}
                    metricType="companies"
                  />
                </div>
              </>
            )}
        </div>
    </BlockUI>
  )
}

