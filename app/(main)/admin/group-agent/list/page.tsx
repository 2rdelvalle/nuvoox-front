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
import { Chip } from "primereact/chip"
import { Tag } from "primereact/tag"
import { OverlayPanel } from "primereact/overlaypanel"
import { useRef } from "react"
import { getCookieToken, getDataFromToken } from "@/shared/utilities/functions/sessionUtils"

const GroupAgentList = () => {
  const { showError } = useToast()
  const op = useRef<OverlayPanel>(null)

  const { onClickAction } = usePush(ADMIN_ROUTES.GROUP_AGENT.CREATE)

  // Obtenemos el token para conseguir la compañía actual
  const tokenData = getDataFromToken(getCookieToken() || "")
  const companyId = tokenData?.user?.company?.companyId

  // Usamos getGroupAgentsWithUsers para obtener los grupos con sus usuarios
  const { responseData: groups, isLoading, callback } = useFetch(() => 
    companyId ? _gas.getGroupAgentsWithUsers(companyId) : Promise.resolve({ data: [] }))

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
              <div className="flex align-items-center gap-2">
                <AvatarGroup className="mb-3">
                  {users.slice(0, maxDisplayed).map((user, idx) => (
                    <Avatar key={idx} 
                      image="/demo/images/avatar/circle/userwebp.webp" 
                      size="large" 
                      shape="circle" />
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
                <Tag 
                  value={`${users.length} agente${users.length !== 1 ? 's' : ''}`} 
                  severity="info" 
                  onClick={(e) => {
                    op.current?.toggle(e);
                    // Guardamos los usuarios actuales en el dataset del elemento
                    (e.currentTarget as any).dataset.users = JSON.stringify(users);
                  }} 
                  style={{cursor: 'pointer'}} 
                />
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
        <OverlayPanel ref={op} showCloseIcon>
          {op.current && (
            <div className="w-20rem">
              <h3>Agentes en este grupo</h3>
              <ul className="m-0 p-0 list-none">
                {document.activeElement && (document.activeElement as any).dataset?.users && 
                  JSON.parse((document.activeElement as any).dataset.users).map((user: any, idx: number) => (
                    <li key={idx} className="flex align-items-center gap-2 mb-2 p-2 border-bottom-1 border-300">
                      <Avatar image="/demo/images/avatar/circle/userwebp.webp" shape="circle" />
                      <span>{user.name || `Agente #${idx + 1}`}</span>
                    </li>
                  ))
                }
                {!document.activeElement || !(document.activeElement as any).dataset?.users && 
                  <li>No hay información de agentes disponible</li>
                }
              </ul>
            </div>
          )}
        </OverlayPanel>
    </EmptyPage>
  )
}

export default GroupAgentList
