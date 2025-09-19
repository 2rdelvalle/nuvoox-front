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

  // 🛡️ MEJORES PRÁCTICAS: Verificar modo de desarrollo
  const isDebugMode = process.env.NODE_ENV === 'development' || process.env.DEBUG_API === 'true'

  // 🛡️ PRODUCCIÓN SEGURA: Token mapeado inteligente según entorno
  const dataToken = useMemo(() => {
    const tokenData = getDataFromToken(getCookieToken() || "")
    
    if (tokenData?.user) {
      const userPayload = {
        userId: tokenData.user.userId,
        name: tokenData.user.name,
        mail: tokenData.user.mail,
        company: tokenData.user.company,
        role: tokenData.user.role,
        status: tokenData.user.status,
        can_send_campaigns: tokenData.user.can_send_campaigns
      }
      
      if (isDebugMode) {
        console.log('🧪 [UserPage] MODO DEBUG - Datos para retry:', userPayload)
        console.log('🔬 [UserPage] Campos disponibles:', {
          can_send_campaigns: {
            valor: tokenData.user.can_send_campaigns,
            tipo: typeof tokenData.user.can_send_campaigns
          },
          company_id: tokenData.user.company?.companyId,
          role_id: tokenData.user.role?.roleId
        })
      } else {
        console.log('🏭 [UserPage] MODO PRODUCCIÓN - Payload optimizado')
      }
      
      return userPayload
    }
    
    return null
  }, [])

  // 🛡️ PRODUCCIÓN SEGURA: Usa servicio inteligente que maneja debug automáticamente
  const { responseData: users, isLoading, fetchData, setResponseData } = useFetchWithConditionalParams(
    _users.getCaratulesFromUserCompanyWithRetry, // ← Servicio inteligente (debug en dev, optimizado en prod)
    !!dataToken, // Condición: solo cuando hay dataToken
    dataToken as any    // Parámetros: payload mapeado
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
