"use client"
import { useToast } from "@/shared/context/toast/toastContext"
import { useFetchWithConditionalParams } from "@/shared/hooks/useFetchWithParams"
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
import { useMemo } from "react"

const UserPage = () => {
  const { showError } = useToast()
  const { onClickAction } = usePush(ADMIN_ROUTES.USER.CREATE)

  // Obtén el dataToken - usando useMemo para evitar recálculos innecesarios
  const dataToken = useMemo(() => {
    console.log('🔑 [UserPage] Recalculando dataToken')
    const tokenData = getDataFromToken(getCookieToken() || "")
    
    // 🔧 SOLUCION: Mapear solo los campos que acepta el API getCaratulesFromUserCompany
    if (tokenData?.user) {
      const userForApi: any = {
        userId: tokenData.user.userId,
        name: tokenData.user.name,
        mail: tokenData.user.mail,
        company: tokenData.user.company,
        role: tokenData.user.role,
        status: tokenData.user.status,
        can_send_campaigns: tokenData.user.can_send_campaigns
      }
      console.log('🔄 [UserPage] Datos mapeados para API:', userForApi)
      console.log('🔍 [UserPage] Campos originales eliminados:', {
        password: '***eliminado***',
        phone: (tokenData.user as any).phone || 'no presente',
        document: (tokenData.user as any).document || 'no presente'
      })
      return userForApi
    }
    
    return null
  }, [])

  // Usa el nuevo hook condicional que elimina el loop
  const { responseData: users, isLoading, fetchData, setResponseData } = useFetchWithConditionalParams(
    _users.getCaratulesFromUserCompany,
    !!dataToken, // Condición: solo cuando hay dataToken
    dataToken    // Parámetros: el dataToken
  )

  // 🔧 Función wrapper para setUsers que maneja el tipo correcto
  const setUsers = (newUsers: any[]) => {
    setResponseData(newUsers)
  }

  // Configura las columnas y el callback
  const { columns } = COLUMNS_USER({ 
    callback: () => {
      if (dataToken) {
        fetchData(dataToken)
      }
    },
    users: Array.isArray(users) ? users : [],
    setUsers: setUsers
  })

  // ✅ YA NO NECESITAMOS useEffect - el hook maneja la carga automáticamente
  // El hook condicional se encarga de cargar cuando dataToken esté disponible

  // Filtrar usuarios activos (status !== "I")
  const activeUsers = Array.isArray(users) 
    ? users.filter((user: any) => user.status !== "I") 
    : [];

  // Registrar en consola para depuración
  console.log(`[INFO] Total usuarios: ${Array.isArray(users) ? users.length : 0}, Usuarios activos: ${activeUsers.length}`);

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
