"use client"
import { useToast } from "@/shared/context/toast/toastContext"
import { useFetch } from "@/shared/hooks/useFetch"
import {
  RoleService as _role
} from "@/shared/services/index"
import { COLUMNS_ROLE } from "@/shared/services/role/columns/columns"
import CustomToolbar from "@/shared/small-components/CustomToolbar/customToolbar"
import EmptyPage from "@/shared/small-components/EmptyPage/emptyPage"
import InfoMessage from "@/shared/small-components/InfoMessage/infoMessage"
import TableFilter from "@/shared/small-components/TableFilter/tableFilter"
import { downloadExcel } from "@/shared/utilities/excel/exportExcel"

const RolePage = () => {
  const { showError } = useToast()

  const { responseData: users, isLoading, callback } = useFetch(_role.caratule)
  const { columns } = COLUMNS_ROLE({ callback })

  return (
      <EmptyPage>
        <CustomToolbar className="m-2 mb-4" startStatus endStatus
          downloadExcel={() => downloadExcel(users)}
          downloadPdf={() => showError("No implementado")}/>
        <TableFilter
        size="small"
          dataKey="roleId"
          rowsPerPage={5}
          dataMenu={users}
          headerTableName={
            () => (
              <InfoMessage
              message={"A continuación se listan los roles registrados en el sistema. Solo aparecerán los últimos 50 roles"}
              />
            )
          }
          columns={columns}
          emptyMessage={"No se encontraron roles"}
          loading={isLoading}
          headerCardName={"Listado de Roles"}
          />
      </EmptyPage>
  )
}

export default RolePage
