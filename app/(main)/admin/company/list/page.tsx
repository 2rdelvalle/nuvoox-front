"use client"
import { useToast } from "@/shared/context/toast/toastContext"
import { useFetch } from "@/shared/hooks/useFetch"
import { usePush } from "@/shared/hooks/usePush"
import { ADMIN_ROUTES } from "@/shared/routes/admin.routes"
import { COLUMNS_COMPANY } from "@/shared/services/company/columns/columns"
import {
  CompanyService as _company
} from "@/shared/services/index"
import CustomToolbar from "@/shared/small-components/CustomToolbar/customToolbar"
import EmptyPage from "@/shared/small-components/EmptyPage/emptyPage"
import InfoMessage from "@/shared/small-components/InfoMessage/infoMessage"
import TableFilter from "@/shared/small-components/TableFilter/tableFilter"
import { downloadExcel } from "@/shared/utilities/excel/exportExcel"
const CompanyPage = () => {
  const { showError } = useToast()

  const { onClickAction } = usePush(ADMIN_ROUTES.COMPANY.CREATE)

  const { responseData: users, isLoading, callback } = useFetch(_company.caratule)
  const { columns } = COLUMNS_COMPANY({ callback })

  return (
      <EmptyPage>
        <CustomToolbar className="m-2 mb-4" startStatus startNew={onClickAction} endStatus
          downloadExcel={() => downloadExcel(users)}
          downloadPdf={() => showError("No implementado")}/>
        <TableFilter
        size="small"
          dataKey="companyId"
          rowsPerPage={5}
          dataMenu={users}
          headerTableName={
            () => (
              <InfoMessage
              message={"A continuación se listan las empresas registradas en el sistema. Solo aparecerán los últimos 50 usuarios"}
              />
            )
          }
          columns={columns}
          emptyMessage={"No se encontraron empresa"}
          loading={isLoading}
          headerCardName={"Listado de empresas"}
          />
      </EmptyPage>
  )
}

export default CompanyPage
