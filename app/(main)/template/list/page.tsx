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
import { useEffect } from "react"
import { useChatStore } from "../../chat/whatsapp/store/chat-store"
import { useInitializeUserFromToken } from "@/shared/customHooks/useInitializeUserFromToken"

const TemplatesPage = () => {
  const { showError } = useToast()

  const { user } = useChatStore()

  useInitializeUserFromToken()
  const { onClickAction } = usePush(ADMIN_ROUTES.TEMPLATE.CREATE)
  const { fetchData, responseData: templates, isLoading } = useFetchWithParams(_template.getAllByCompany)
  const { columns } = COLUMNS_TEMPLATE()
  const { data } = useRealtimeTemplate(`${process.env.NEXT_PUBLIC_SOCKET_URL}`)

  useEffect(() => {
    if (user?.company?.companyId) {
      fetchData(user?.company?.companyId)
    }
  }, [data, user])

  useEffect(() => {
    if (user?.company?.companyId) {
      fetchData(user?.company?.companyId)
    }
  }, [user])

  return (
      <EmptyPage>
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
