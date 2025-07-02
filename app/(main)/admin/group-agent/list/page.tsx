"use client"
import { useToast } from "@/shared/context/toast/toastContext"
import { useFetch } from "@/shared/hooks/useFetch"
import { usePush } from "@/shared/hooks/usePush"
import { GroupAgent } from "@/shared/models"
import { ADMIN_ROUTES } from "@/shared/routes/admin.routes"
import { COLUMNS_GROUP_GA } from "@/shared/services/group-agent/columns/columns"
import { GroupAgentService as _gas } from "@/shared/services/index"
import { EnrichedGroupAgent, EnrichedAgent } from "@/shared/services/group-agent/group.service"
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

  // Usamos el nuevo endpoint para obtener datos completos de agentes
  const { responseData: groups, isLoading, callback } = useFetch(() => 
    companyId ? _gas.getGroupAgentsWithFullDetails(companyId) : Promise.resolve({ data: [] }))

  // Registramos datos para diagnóstico
  if (groups && groups.length > 0) {
    console.log(`[Info] Se cargaron ${groups.length} grupos de agentes`);
    
    // Verificamos si hay datos de usuarios enriquecidos en los grupos
    let totalUsers = 0;
    groups.forEach(group => {
      const agents = (group as EnrichedGroupAgent).agents || [];
      totalUsers += agents.length;
      console.log(`[Info] Grupo '${group.name}' tiene ${agents.length} agente(s)`);
      
      // Log detallado de los primeros 3 agentes como muestra
      if (agents.length > 0) {
        console.log(`[Debug] Muestra de datos de agentes para '${group.name}':`, 
          agents.slice(0, 3).map(a => ({ id: a.id, name: a.name, initials: a.initials })));
      }
    });
    console.log(`[Info] Total de agentes: ${totalUsers}`);
  }

  // Definimos nuestras propias columnas para incluir los agentes
  const baseColumns = COLUMNS_GROUP_GA({ update: callback })
  
  // Añadimos una nueva columna para mostrar los agentes con datos completos
  const columns: ColumnsType[] = [
    ...baseColumns.columns.filter(col => col.field !== ""), // Mantenemos todas las columnas excepto la de acciones
    {
      field: "agents", // Nuevo campo con datos enriquecidos
      header: "Agentes",
      style: { width: "40%" },
      body: (rowData: GroupAgent) => {
        // Usamos la nueva estructura enriched con agentes completos
        const enriched = rowData as EnrichedGroupAgent;
        const agents = enriched.agents || [];
        const maxDisplayed = 3;
        
        return (
          <div>
            {agents.length > 0 ? (
              <div className="flex flex-column">
                <div className="flex align-items-center gap-2 mb-2">
                  {/* Grupo de avatares con iniciales */}
                  <AvatarGroup className="mb-1">
                    {agents.slice(0, maxDisplayed).map((agent, idx) => (
                      <Avatar key={idx} 
                        label={agent.initials}
                        size="large" 
                        shape="circle"
                        style={{ backgroundColor: '#2196F3', color: '#ffffff' }}
                      />
                    ))}
                    {agents.length > maxDisplayed && (
                      <Avatar 
                        label={`+${agents.length - maxDisplayed}`} 
                        size="large" 
                        shape="circle" 
                        style={{ backgroundColor: '#9c27b0', color: '#ffffff' }} 
                      />
                    )}
                  </AvatarGroup>
                  
                  {/* Etiqueta con contador de agentes */}
                  <Tag 
                    value={`${agents.length} agente${agents.length !== 1 ? 's' : ''}`} 
                    severity="info" 
                    className="ml-2"
                    onClick={(e) => {
                      // Al hacer clic, mostramos el panel de detalle
                      if (op.current) {
                        // Configuramos el elemento activo con la información
                        if (document.activeElement) {
                          (document.activeElement as any).dataset = {
                            users: JSON.stringify(agents),
                            groupName: JSON.stringify(rowData.name)
                          };
                        }
                        op.current.toggle(e);
                      }
                    }} 
                    style={{cursor: 'pointer'}} 
                  />
                </div>
                
                {/* Lista de nombres de agentes */}
                <div className="agent-names pl-2">
                  <div className="text-base text-primary font-medium mb-1">Agentes asignados:</div>
                  {agents.slice(0, 2).map((agent, idx) => (
                    <div key={idx} className="text-sm text-600 py-1 flex align-items-center gap-2">
                      <i className="pi pi-user text-primary" />
                      <span>{agent.name || `Usuario ${agent.id}`}</span>
                    </div>
                  ))}
                  {agents.length > 2 && (
                    <div className="text-sm text-500 font-italic">
                      ... y {agents.length - 2} más
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
        
        {/* Panel emergente para mostrar la lista completa de agentes con datos enriquecidos */}
        <OverlayPanel ref={op} showCloseIcon style={{ width: '400px' }}>
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
                  JSON.parse((document.activeElement as any).dataset.users).map((agent: EnrichedAgent, idx: number) => (
                    <li key={idx} className="flex align-items-center gap-3 mb-3 p-2 border-bottom-1 border-300">
                      {/* Avatar con iniciales del usuario */}
                      <Avatar 
                        label={agent.initials}
                        shape="circle"
                        style={{ backgroundColor: '#2196F3', color: '#ffffff' }}
                        size="large"
                      />
                      {/* Detalles completos del usuario */}
                      <div className="flex flex-column">
                        <span className="font-medium">{agent.name}</span>
                        {agent.email && (
                          <span className="text-sm text-600">
                            <i className="pi pi-envelope mr-1 text-xs"></i>
                            {agent.email}
                          </span>
                        )}
                        {agent.phone && (
                          <span className="text-sm text-600">
                            <i className="pi pi-phone mr-1 text-xs"></i>
                            {agent.phone}
                          </span>
                        )}
                        <span className="text-xs text-700 mt-1">
                          <i className="pi pi-id-card mr-1"></i>
                          ID: {agent.userId}
                        </span>
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
