"use client"
import CardInformation from "@/shared/small-components/card-information/card-information"
import MetricsCard from "@/shared/components/dashboard/MetricsCard"
import { useChatStore } from "./chat/whatsapp/store/chat-store"
import { useInitializeUserFromToken } from "@/shared/customHooks/useInitializeUserFromToken"
import { useSWRRequest } from "@/shared/customHooks/useSWRRequest"
import { BlockUI } from "primereact/blockui"
import { useEffect, useState } from "react"
import { AgentTemplateStats } from "@/shared/components/template"

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
  const [isCompanyRole, setIsCompanyRole] = useState(false)

  const { fetchData, data: dashboard, loading } = useSWRRequest<DashBoardResponse>()

  async function getDashBoard () {
    fetchData(`/dashBoard/getDashboard/${user?.company?.companyId}`)
  }

  useEffect(() => {
    getDashBoard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    /* Justificación: Omitimos getDashBoard intencionalmente como dependencia
     * para evitar un posible ciclo infinito de llamadas a la API.
     * Solo necesitamos actualizar cuando cambia el usuario.
     */
  }, [user?.company?.companyId])

  // Verificar si el usuario tiene rol de empresa
  useEffect(() => {
    if (user?.role?.name) {
      setIsCompanyRole(user.role.name.toLowerCase().includes('empresa'))
    }
  }, [user])

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
                  value={dashboard?.dashboard ? dashboard.dashboard.messagesSent + dashboard.dashboard.messagesReceived : 0}
                  data={[
                    dashboard?.dashboard.messagesSent || 0,
                    dashboard?.dashboard.messagesReceived || 0,
                    dashboard?.dashboard.conversations || 0
                  ]}
                  labels={["Enviados", "Recibidos", "Conversaciones"]}
                  metricType="pie"
                />
            </div>
            
            {/* Gráficas de plantillas - solo para rol empresa */}
            {isCompanyRole && user?.company?.companyId && (
              <>
                {/* Gráfica de plantillas por agente - Mismo ancho que Proporción de Mensajes */}
                <div className="col-12 md:col-12 xl:col-12 mt-3">
                  <div className="h-full">
                    <AgentTemplateStats companyId={user.company.companyId} />
                  </div>
                </div>
              </>
            )}
            
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

