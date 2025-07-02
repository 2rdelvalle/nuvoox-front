"use client"
import { useToast } from "@/shared/context/toast/toastContext"
import { useFetch } from "@/shared/hooks/useFetch"
import { usePush } from "@/shared/hooks/usePush"
import { GroupAgent } from "@/shared/models"
import { ADMIN_ROUTES } from "@/shared/routes/admin.routes"
import { COLUMNS_GROUP_GA } from "@/shared/services/group-agent/columns/columns"
import { GroupAgentService as _gas } from "@/shared/services/index"
import CustomToolbar from "@/shared/small-components/CustomToolbar/customToolbar"
import EmptyPage from "@/shared/small-components/EmptyPage/emptyPage"
import InfoMessage from "@/shared/small-components/InfoMessage/infoMessage"
import TableFilter from "@/shared/small-components/TableFilter/tableFilter"
import { ColumnsType } from "@/shared/small-components/TableFilter/types/tableFilterTypes"
import { downloadExcel } from "@/shared/utilities/excel/exportExcel"
import { Avatar } from "primereact/avatar"
import { AvatarGroup } from "primereact/avatargroup"
import { Tag } from "primereact/tag"
import { OverlayPanel } from "primereact/overlaypanel"
import { useRef } from "react"
import { getCookieToken, getDataFromToken } from "@/shared/utilities/functions/sessionUtils"

/**
 * Componente para listar grupos de agentes
 * Versión optimizada para producción
 */
const GroupAgentList = () => {
  // Referencias para componentes UI
  const tableFilterRef: any = useRef()
  const op = useRef<OverlayPanel>(null)

  const { showError } = useToast()
  
  const { onClickAction } = usePush(ADMIN_ROUTES.GROUP_AGENT.CREATE)

  // Obtenemos el token para conseguir la compañía actual
  const tokenData = getDataFromToken(getCookieToken() || "")
  const companyId = tokenData?.user?.company?.companyId

  // Usamos getGroupAgentsWithUsers para obtener los grupos con sus usuarios
  const { responseData: groups, isLoading, callback } = useFetch(() => 
    companyId ? _gas.getGroupAgentsWithUsers(companyId) : Promise.resolve({ data: [] }))

  // Registramos datos para diagnóstico
  if (groups && groups.length > 0) {
    console.log(`[Info] Se cargaron ${groups.length} grupos de agentes`);
    
    // Verificamos si hay datos de usuarios en los grupos
    let totalUsers = 0;
    groups.forEach(group => {
      const usersCount = (group.userCompanyGroup || []).length;
      totalUsers += usersCount;
      console.log(`[Info] Grupo '${group.name}' tiene ${usersCount} usuario(s)`);
    });
    console.log(`[Info] Total de relaciones usuario-grupo: ${totalUsers}`);
  }

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
                  {/* Grupo de avatares */}
                  <AvatarGroup className="mb-1">
                    {users.slice(0, maxDisplayed).map((user, idx) => (
                      <Avatar key={idx} 
                        label={`${user.userId}`}
                        size="large" 
                        shape="circle"
                        style={{ backgroundColor: '#2196F3', color: '#ffffff' }}
                      />
                    ))}
                    {users.length > maxDisplayed && (
                      <Avatar 
                        label={`+${users.length - maxDisplayed}`} 
                        size="large" 
                        shape="circle" 
                        style={{ backgroundColor: '#9c27b0', color: '#ffffff' }} 
                      />
                    )}
                  </AvatarGroup>
                  
                  {/* Etiqueta con contador y botón para mostrar detalles */}
                  <Tag 
                    value={`${users.length} agente${users.length !== 1 ? 's' : ''}`} 
                    severity="info" 
                    onClick={(e) => {
                      op.current?.toggle(e);
                      // Almacenamos datos básicos en el elemento para el panel emergente
                      (e.currentTarget as any).dataset.users = JSON.stringify(users);
                      (e.currentTarget as any).dataset.groupName = JSON.stringify(rowData.name || 'Grupo');
                    }} 
                    style={{cursor: 'pointer'}} 
                  />
                </div>
                
                {/* Lista de IDs de agentes */}
                <div className="agent-names pl-2">
                  <div className="text-base text-primary font-medium mb-1">Agentes asignados:</div>
                  {users.slice(0, 2).map((user, idx) => (
                    <div key={idx} className="text-sm text-600 py-1 flex align-items-center gap-2">
                      <i className="pi pi-user text-primary" />
                      <span>ID: {user.userId}</span>
                    </div>
                  ))}
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
              <h3 className="text-xl font-medium mb-3">
                Agentes en este grupo
                {document.activeElement && (document.activeElement as any).dataset?.groupName && (
                  <div className="text-base text-600 mt-1">
                    Grupo: {JSON.parse((document.activeElement as any).dataset.groupName || '"Desconocido"')}
                  </div>
                )}
              </h3>
              <ul className="m-0 p-0 list-none">
                {document.activeElement && (document.activeElement as any).dataset?.users ? (
                  JSON.parse((document.activeElement as any).dataset.users).map((user: any, idx: number) => (
                    <li key={idx} className="flex align-items-center gap-3 mb-3 p-2 border-bottom-1 border-300">
                      {/* Avatar con ID del usuario */}
                      <Avatar 
                        label={`${user.userId}`}
                        shape="circle"
                        style={{ backgroundColor: '#2196F3', color: '#ffffff' }}
                      />
                      {/* Detalles del usuario */}
                      <div className="flex flex-column">
                        <span className="font-medium">ID de Agente: {user.userId}</span>
                        <span className="text-xs text-700">Fecha asignación: {new Date().toLocaleDateString()}</span>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="text-center p-3 text-500">No hay datos de agentes disponibles</li>
                )}
              </ul>
            </div>
          )}
        </OverlayPanel>
    </EmptyPage>
  )
}

export default GroupAgentList
