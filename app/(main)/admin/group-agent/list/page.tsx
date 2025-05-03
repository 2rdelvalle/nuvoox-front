"use client"
import { useToast } from "@/shared/context/toast/toastContext"
import { useFetch } from "@/shared/hooks/useFetch"
import { usePush } from "@/shared/hooks/usePush"
import { ADMIN_ROUTES } from "@/shared/routes/admin.routes"
import { COLUMNS_GROUP_GA } from "@/shared/services/group-agent/columns/columns"
import { GroupAgentService as _gas } from "@/shared/services/index"
import CustomToolbar from "@/shared/small-components/CustomToolbar/customToolbar"
import EmptyPage from "@/shared/small-components/EmptyPage/emptyPage"
import InfoMessage from "@/shared/small-components/InfoMessage/infoMessage"
import TableFilter from "@/shared/small-components/TableFilter/tableFilter"
import { downloadExcel } from "@/shared/utilities/excel/exportExcel"

const GroupAgentList = () => {
  const { showError } = useToast()

  const { onClickAction } = usePush(ADMIN_ROUTES.GROUP_AGENT.CREATE)

  // Usa el nuevo hook
  const { responseData: users, isLoading, callback } = useFetch(_gas.caratule)

  const { columns } = COLUMNS_GROUP_GA({ update: callback })
  return (
    <EmptyPage>
        <CustomToolbar
        className="m-2 mb-4"
        startStatus
        startNew={onClickAction}
        endStatus
        downloadExcel={() => downloadExcel(users)}
        downloadPdf={() => showError("No implementado")}
        />
        <TableFilter
        size="small"
        dataKey="id"
        rowsPerPage={5}
        dataMenu={users}
        headerTableName={() => (
            <InfoMessage
            message={
                "A continuación se listan los grupos registrados en el sistema para esta empresa. Solo se mostrarán los últimos 50 grupos."
            }
            />
        )}
        columns={columns}
        emptyMessage={"No se encontraron Grupos de agentes"}
        loading={isLoading}
        headerCardName={"Listado de grupos de agentes"}
        />
  </EmptyPage>
  )
}

export default GroupAgentList
