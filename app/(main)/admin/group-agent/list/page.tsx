"use client"
import { useToast } from "@/shared/context/toast/toastContext"
import { useFetch } from "@/shared/hooks/useFetch"
import { usePush } from "@/shared/hooks/usePush"
import { GroupAgent } from "@/shared/models"
import { ADMIN_ROUTES } from "@/shared/routes/admin.routes"
import { COLUMNS_GROUP_GA } from "@/shared/services/group-agent/columns/columns"
import { GroupAgentService as _gas } from "@/shared/services/index"
import { UserService as _us } from "@/shared/services/index"
import CustomToolbar from "@/shared/small-components/CustomToolbar/customToolbar"
import EmptyPage from "@/shared/small-components/EmptyPage/emptyPage"
import InfoMessage from "@/shared/small-components/InfoMessage/infoMessage"
import TableFilter from "@/shared/small-components/TableFilter/tableFilter"
import { ColumnsType } from "@/shared/small-components/TableFilter/types/tableFilterTypes"
import { downloadExcel } from "@/shared/utilities/excel/exportExcel"
import { Avatar } from "primereact/avatar"
import { AvatarGroup } from "primereact/avatargroup"
import { Chip } from "primereact/chip"
import { Tag } from "primereact/tag"
import { OverlayPanel } from "primereact/overlaypanel"
import { useRef, useState, useEffect } from "react"
import { getCookieToken, getDataFromToken } from "@/shared/utilities/functions/sessionUtils"

const GroupAgentList = () => {
  const { showError } = useToast()
  const op = useRef<OverlayPanel>(null)
  
  // Estado para almacenar la información de usuarios
  const [usersData, setUsersData] = useState<{[key: number]: any}>({})
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false)

  const { onClickAction } = usePush(ADMIN_ROUTES.GROUP_AGENT.CREATE)

  // Obtenemos el token para conseguir la compañía actual
  const tokenData = getDataFromToken(getCookieToken() || "")
  const companyId = tokenData?.user?.company?.companyId

  // Usamos getGroupAgentsWithUsers para obtener los grupos con sus usuarios
  const { responseData: groups, isLoading, callback } = useFetch(() => 
    companyId ? _gas.getGroupAgentsWithUsers(companyId) : Promise.resolve({ data: [] }))
    
  // Función para cargar información de usuarios
  const loadUsersInfo = async (groups: GroupAgent[]) => {
    if (!groups || groups.length === 0) return
    
    // Extraer todos los IDs de usuario únicos de todos los grupos
    const userIds: number[] = [];
    groups.forEach(group => {
      if (group.userCompanyGroup && group.userCompanyGroup.length > 0) {
        group.userCompanyGroup.forEach(user => {
          if (user.userId && !userIds.includes(user.userId)) {
            userIds.push(user.userId)
          }
        })
      }
    })
    
    if (userIds.length === 0) return
    
    setLoadingUsers(true)
    try {
      // Crear un objeto para almacenar los datos de usuario por ID
      const userData: {[key: number]: any} = {}
      
      // Cargar información de cada usuario
      for (const userId of userIds) {
        try {
          const response = await _us.findById(userId.toString())
          if (response && response.data) {
            userData[userId] = response.data
          }
        } catch (error) {
          console.error(`Error cargando usuario ${userId}:`, error)
        }
      }
      
      setUsersData(userData)
    } catch (error) {
      console.error('Error cargando datos de usuarios:', error)
    } finally {
      setLoadingUsers(false)
    }
  }
  
  // Cargar información de usuarios cuando cambian los grupos
  useEffect(() => {
    if (groups && groups.length > 0) {
      loadUsersInfo(groups)
    }
  }, [groups])

  // Definimos nuestras propias columnas para incluir los agentes
  const baseColumns = COLUMNS_GROUP_GA({ update: callback })
  
  // Añadimos una nueva columna para mostrar los agentes
  const columns: ColumnsType[] = [
    ...baseColumns.columns.filter(col => col.field !== ""), // Mantenemos todas las columnas excepto la de acciones
    {
      field: "userCompanyGroup",
      header: "Agentes",
      style: { width: "40%" },
      body: (rowData: GroupAgent) => {
        const users = rowData.userCompanyGroup || [];
        const maxDisplayed = 3;
        
        return (
          <div>
            {users.length > 0 ? (
              <div className="flex flex-column">
                <div className="flex align-items-center gap-2 mb-2">
                  <AvatarGroup className="mb-1">
                    {users.slice(0, maxDisplayed).map((user, idx) => {
                      // Obtener las iniciales del nombre del usuario si está disponible
                      const userData = usersData[user.userId];
                      const initials = userData?.name ? 
                        userData.name.split(' ')
                          .map((n: string) => n[0])
                          .join('')
                          .substring(0, 2)
                          .toUpperCase() : 
                        '?';
                        
                      return (
                        <Avatar key={idx} 
                          label={initials}
                          size="large" 
                          shape="circle"
                          style={{ 
                            backgroundColor: userData ? '#2196F3' : '#757575',
                            color: '#ffffff' 
                          }} 
                        />
                      );
                    })}
                    {users.length > maxDisplayed && (
                      <Avatar 
                        label={`+${users.length - maxDisplayed}`} 
                        size="large" 
                        shape="circle" 
                        style={{ backgroundColor: '#9c27b0', color: '#ffffff' }} 
                      />
                    )}
                  </AvatarGroup>
                  <Tag 
                    value={`${users.length} agente${users.length !== 1 ? 's' : ''}`} 
                    severity="info" 
                    onClick={(e) => {
                      // Preparar datos enriquecidos con información de usuario
                      const enrichedUsers = users.map(user => {
                        const userData = usersData[user.userId] || {};
                        return {
                          ...user,
                          ...userData
                        };
                      });
                      
                      op.current?.toggle(e);
                      // Guardamos los usuarios enriquecidos en el dataset del elemento
                      (e.currentTarget as any).dataset.users = JSON.stringify(enrichedUsers);
                    }} 
                    style={{cursor: 'pointer'}} 
                  />
                </div>
                
                {/* Lista de nombres de agentes directamente en la columna */}
                <div className="agent-names pl-2">
                  {users.slice(0, 2).map((user, idx) => {
                    const userData = usersData[user.userId] || {};
                    const displayName = userData.name || 
                                        userData.email ||
                                        `Agente ${user.userId || idx + 1}`;
                    
                    return (
                      <div key={idx} className="text-sm text-600 py-1">
                        {displayName}
                      </div>
                    );
                  })}
                  {users.length > 2 && (
                    <div className="text-sm text-500 font-italic">
                      ... y {users.length - 2} más
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Tag value="Sin agentes" severity="warning" />
            )}
          </div>
        );
      }
    },
    baseColumns.columns.find(col => col.field === "") || {} as ColumnsType // Añadimos la columna de acciones al final
  ]
  return (
    <EmptyPage>
        <CustomToolbar
          className="m-2 mb-4"
          startStatus
          startNew={onClickAction}
          endStatus
          downloadExcel={() => downloadExcel(groups)}
          downloadPdf={() => showError("No implementado")}
        />
        <TableFilter
          size="small"
          dataKey="id"
          rowsPerPage={5}
          dataMenu={groups}
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
        
        {/* Panel emergente para mostrar la lista completa de agentes */}
        <OverlayPanel ref={op} showCloseIcon style={{ width: '350px' }}>
          {op.current && (
            <div className="w-full">
              <h3 className="text-xl font-medium mb-3">Agentes en este grupo</h3>
              <ul className="m-0 p-0 list-none">
                {document.activeElement && (document.activeElement as any).dataset?.users && 
                  JSON.parse((document.activeElement as any).dataset.users).map((user: any, idx: number) => {
                    // Crear las iniciales del nombre para el avatar
                    const initials = user.name ? 
                      user.name.split(' ')
                        .map((n: string) => n[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase() : 
                      '?';
                      
                    return (
                      <li key={idx} className="flex align-items-center gap-3 mb-3 p-2 border-bottom-1 border-300">
                        {/* Avatar con iniciales */}
                        <Avatar 
                          label={initials}
                          shape="circle"
                          style={{ 
                            backgroundColor: '#2196F3',
                            color: '#ffffff' 
                          }} 
                        />
                        {/* Detalles del usuario */}
                        <div className="flex flex-column">
                          <span className="font-medium">{user.name || `Sin nombre`}</span>
                          {user.email && <span className="text-sm text-500">{user.email}</span>}
                          {user.userId && <span className="text-xs text-700">ID: {user.userId}</span>}
                        </div>
                      </li>
                    );
                  })
                }
                {(!document.activeElement || !(document.activeElement as any).dataset?.users || 
                  JSON.parse((document.activeElement as any).dataset?.users || '[]').length === 0) && 
                  <li className="text-center p-3 text-500">No hay información de agentes disponible</li>
                }
              </ul>
            </div>
          )}
        </OverlayPanel>
    </EmptyPage>
  )
}

export default GroupAgentList
