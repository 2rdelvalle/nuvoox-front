"use client"
import { useToast } from "@/shared/context/toast/toastContext"
import { useFetchWithParams } from "@/shared/hooks/useFetchWithParams"
import { usePush } from "@/shared/hooks/usePush"
import { ADMIN_ROUTES } from "@/shared/routes/admin.routes"
import { UserService as _users } from "@/shared/services/index"
import { COLUMNS_USER } from "@/shared/services/user/columns/columns"
import CustomToolbar from "@/shared/small-components/CustomToolbar/customToolbar"
import EmptyPage from "@/shared/small-components/EmptyPage/emptyPage"
import InfoMessage from "@/shared/small-components/InfoMessage/infoMessage"
import TableFilter from "@/shared/small-components/TableFilter/tableFilter"
import { downloadExcel } from "@/shared/utilities/excel/exportExcel"
import { getCookieToken, getDataFromToken } from "@/shared/utilities/functions/sessionUtils"
import { useEffect } from "react"

const UserPage = () => {
  const { showError } = useToast()
  const { onClickAction } = usePush(ADMIN_ROUTES.USER.CREATE)

  // Obtén el dataToken
  const dataToken = getDataFromToken(getCookieToken() || "").user

  // Usa el nuevo hook
  const { responseData: users, isLoading, fetchData } = useFetchWithParams(_users.getCaratulesFromUserCompany)

  // Configura las columnas y el callback
  const { columns } = COLUMNS_USER({ callback: () => fetchData(dataToken) })

  // Llama a fetchData al cargar la página
  useEffect(() => {
    if (dataToken) {
      fetchData(dataToken)
    }
  }, [])

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
        dataKey="userId"
        rowsPerPage={5}
        dataMenu={users}
        headerTableName={() => (
          <InfoMessage
            message={
              "A continuación se listan los usuarios registrados en el sistema. Solo aparecerán los últimos 50 usuarios"
            }
          />
        )}
        columns={columns}
        emptyMessage={"No se encontraron usuarios"}
        loading={isLoading}
        headerCardName={"Listado de Usuarios"}
      />
    </EmptyPage>
  )
}

export default UserPage
