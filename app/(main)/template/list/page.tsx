"use client"
import { useToast } from "@/shared/context/toast/toastContext"
import { usePush } from "@/shared/customHooks/usePush"
import { useFetchWithParams } from "@/shared/hooks/useFetchWithParams"
import useRealtimeTemplate from "@/shared/hooks/useRealtimeTemplate"
import { ADMIN_ROUTES } from "@/shared/routes/admin.routes"
import {
  TemplateService as _template
} from "@/shared/services/index"
import { COLUMNS_TEMPLATE } from "@/shared/services/template"
import CustomToolbar from "@/shared/small-components/CustomToolbar/customToolbar"
import EmptyPage from "@/shared/small-components/EmptyPage/emptyPage"
import InfoMessage from "@/shared/small-components/InfoMessage/infoMessage"
import TableFilter from "@/shared/small-components/TableFilter/tableFilter"
import { downloadExcel } from "@/shared/utilities/excel/exportExcel"
import { useEffect, useCallback } from "react" // useState se eliminó porque no se usa actualmente
import { useChatStore } from "../../chat/whatsapp/store/chat-store"
import { useInitializeUserFromToken } from "@/shared/customHooks/useInitializeUserFromToken"

const TemplatesPage = () => {
  const { showError } = useToast()

  const { user } = useChatStore()
  // Variable no utilizada actualmente, se mantiene para futuras implementaciones
  // const [isCompanyRole, setIsCompanyRole] = useState(false)

  useInitializeUserFromToken()
  const { onClickAction } = usePush(ADMIN_ROUTES.TEMPLATE.CREATE)
  const { fetchData, responseData: templates, isLoading } = useFetchWithParams(_template.getAllByCompany)
  const { columns } = COLUMNS_TEMPLATE()
  const { data } = useRealtimeTemplate(`${process.env.NEXT_PUBLIC_SOCKET_URL}`)

  // Verificar si el usuario tiene rol de empresa - comentado por no usarse actualmente
  /*useEffect(() => {
    if (user?.role?.name) {
      setIsCompanyRole(user.role.name.toLowerCase().includes('empresa'))
    }
  }, [user])*/

  // Usamos useCallback para memorizar la función fetchData y evitar re-renders innecesarios
  const fetchTemplates = useCallback(() => {
    if (user?.company?.companyId) {
      fetchData(user?.company?.companyId)
    }
  }, [fetchData, user?.company?.companyId])

  // Efecto para cargar los datos cuando cambia el data de tiempo real o el usuario
  useEffect(() => {
    fetchTemplates()
  }, [data, fetchTemplates])

  // Efecto para cargar los datos iniciales cuando se monta el componente
  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  return (
      <EmptyPage>
        {/* Mostrar estadísticas solo para usuarios con rol de empresa */}


        <CustomToolbar className="m-2 mb-4" startStatus endStatus
          downloadExcel={() => downloadExcel(templates)}
          startNew={onClickAction}
          downloadPdf={() => showError("No implementado")}/>
        <TableFilter
        size="normal"
          dataKey="id"
          rowsPerPage={5}
          dataMenu={templates}
          headerTableName={
            () => (
              <InfoMessage
              message={"A continuación se listan las plantillas registrados en el sistema." +
                "Solo aparecerán las últimas 50 plantillas."}
              />
            )
          }
          columns={columns}
          emptyMessage={"No se encontraron Plantillas"}
          loading={isLoading}
          headerCardName={"Listado de Plantillas"}
          />
      </EmptyPage>
  )
}

export default TemplatesPage
