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
  const tokenData = getDataFromToken(getCookieToken() || "")
  const dataToken = tokenData?.user

  // Usa el nuevo hook
  const { responseData: users, isLoading, fetchData } = useFetchWithParams(_users.getCaratulesFromUserCompany)

  // Configura las columnas y el callback
  const { columns } = COLUMNS_USER({ 
    callback: () => {
      if (dataToken) {
        fetchData(dataToken)
      }
    }
  })

  // Llama a fetchData al cargar la página
  useEffect(() => {
    if (dataToken) {
      fetchData(dataToken)
    }
  }, [])

  // Filtrar usuarios activos (status !== "INACTIVE")
  const activeUsers = Array.isArray(users) 
    ? users.filter(user => user.status !== "INACTIVE") 
    : [];

  // Registrar en consola para depuración
  console.log(`[INFO] Total usuarios: ${users?.length || 0}, Usuarios activos: ${activeUsers.length}`);

  return (
    <EmptyPage>
      <CustomToolbar
        className="m-2 mb-4"
        startStatus
        startNew={onClickAction}
        endStatus
        downloadExcel={() => downloadExcel(activeUsers)}
        downloadPdf={() => showError("No implementado")}
      />
      <TableFilter
        size="small"
        dataKey="userId"
        rowsPerPage={5}
        dataMenu={activeUsers}
        headerTableName={() => (
          <InfoMessage
            message={
              "A continuación se listan los usuarios activos en el sistema. Los usuarios desactivados no aparecen en esta lista."
            }
          />
        )}
        columns={columns}
        emptyMessage={"No se encontraron usuarios activos"}
        loading={isLoading}
        headerCardName={"Listado de Usuarios Activos"}
      />
    </EmptyPage>
  )
}

export default UserPage
