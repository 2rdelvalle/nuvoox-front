"use client"
import { useToast } from "@/shared/context/toast/toastContext"
import { useFetchWithParams } from "@/shared/hooks/useFetchWithParams"
import { usePush } from "@/shared/hooks/usePush"
import { GroupAgent, UserCaratule } from "@/shared/models"
import { EnrichedGroupAgent, EnrichedAgent } from "@/shared/services/group-agent/group.service"
import { ADMIN_ROUTES } from "@/shared/routes/admin.routes"
import {
  UserService as _users,
  GroupAgentService as _GAS
} from "@/shared/services/index"
import EmptyPage from "@/shared/small-components/EmptyPage/emptyPage"
import FormStatus from "@/shared/small-components/FormStatus/formStatus"
import TableFilter from "@/shared/small-components/TableFilter/tableFilter"
import { ColumnsType } from "@/shared/small-components/TableFilter/types/tableFilterTypes"
import { getCookieToken, getDataFromToken } from "@/shared/utilities/functions/sessionUtils"
import { Avatar } from "primereact/avatar"
import { Button } from "primereact/button"
import { Checkbox } from "primereact/checkbox"
import { Divider } from "primereact/divider"
import { InputText } from "primereact/inputtext"
import { Message } from "primereact/message"
import { Panel } from "primereact/panel"
import { useEffect, useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import { useSearchParams } from "next/navigation"

// Flag para habilitar/deshabilitar logs detallados
const DEBUG_LOGS = true;

// Funciones de log controladas por constante para facilitar activación/desactivación
const logInfo = (message: string, ...data: any[]) => 
  DEBUG_LOGS && console.log(`[Info] ${message}`, ...(data.length ? data : []));
const logError = (message: string, ...data: any[]) => 
  DEBUG_LOGS && console.error(`[Error] ${message}`, ...(data.length ? data : []));
const logWarning = (message: string, ...data: any[]) => 
  DEBUG_LOGS && console.warn(`[Warning] ${message}`, ...(data.length ? data : []));
const logDebug = (message: string, ...data: any[]) => 
  DEBUG_LOGS && console.debug(`[Debug] ${message}`, ...(data.length ? data : []));

/**
 * Componente de formulario para crear o editar grupos de agentes
 * Soporta dos modos de operación:
 * 1. Creación: Cuando no se proporciona un ID en la URL
 * 2. Edición: Cuando se proporciona un ID en la URL, carga los datos del grupo existente
 */
const GroupAgentForm = ({ searchParams }: { searchParams: { id?: string } }) => {
  // Obtenemos los parámetros directamente con useSearchParams para asegurar que tenemos la última versión
  // Esta es la forma más segura de obtener parámetros en Next.js
  const queryParams = useSearchParams();
  const idFromQuery = queryParams.get('id');
  
  // Mostramos información detallada sobre los parámetros recibidos para debugging
  logInfo('Parámetros de la URL:', { id: idFromQuery, otherParams: Array.from(queryParams.entries()) });
  logInfo('Parámetros desde props:', searchParams);
  
  // Determinar si estamos en modo edición usando ambas fuentes de datos
  const isEditMode = !!(idFromQuery || searchParams?.id);
  
  // Convertir el id a número, con preferencia al de URL directa que es más confiable
  const groupId = idFromQuery ? parseInt(idFromQuery) : 
                searchParams?.id ? parseInt(searchParams.id) : undefined;
  
  // Registro detallado del estado de inicialización
  logInfo(`Modo de operación detectado: ${isEditMode ? 'EDICIÓN' : 'CREACIÓN'}, ID: ${groupId || 'nuevo'}`)
  const { showError, showSuccess } = useToast()

  const { onClickAction } = usePush(ADMIN_ROUTES.GROUP_AGENT.LIST)

  const { responseData, fetchData } = useFetchWithParams(_users.getCaratulesFromUserCompany)

  // Estado para los usuarios seleccionados
  const [usersSelected, setUsersSelected] = useState<UserCaratule[]>([])
  
  // Estado para controlar la carga de datos en modo edición
  const [isLoading, setIsLoading] = useState(isEditMode)
  const [groupData, setGroupData] = useState<EnrichedGroupAgent | null>(null)

  const { register, handleSubmit, setValue, formState: { errors, isValid, isDirty } } = useForm<GroupAgent>({
    mode: "onChange" // se pueden agregar más opciones según se requiera
  })

  // Obtén el dataToken
  const tokenData = getDataFromToken(getCookieToken() || "")
  const dataToken = tokenData?.user

  const onSubmit: SubmitHandler<GroupAgent> = async (data) => {
    if (!dataToken) return alert("No se pudo obtener el token")
    if (!dataToken.company.companyId) return alert("No se pudo obtener la compañía")
    
    const dataToSave : GroupAgent = {
      name: data.name,
      company: {
        companyId: dataToken.company.companyId
      },
      userCompanyGroup: usersSelected.map(user => ({ userId: user.userId }))
    }
    
    // Logs de depuración con formato estándar
    logInfo(`Modo de operación: ${isEditMode ? 'Edición' : 'Creación'}, GroupID: ${groupId || 'nuevo'}`);
    logInfo(`Nombre del grupo a guardar: "${data.name}"`);
    logInfo(`Total de agentes seleccionados: ${usersSelected.length}`);
    logInfo('Detalle completo de datos a enviar:', JSON.stringify(dataToSave, null, 2));
    
    try {
      // Determinar si estamos creando o actualizando
      if (isEditMode && groupId) {
        // Modo edición - llamar al método update
        logInfo(`[ENDPOINT-CALL] Llamando a endpoint de actualización con ID: ${groupId}`);
        
        try {
          // Capturamos y mostramos la respuesta completa para facilitar depuración
          const startTime = Date.now();
          const response = await _GAS.update(groupId, dataToSave);
          const elapsed = Date.now() - startTime;
          
          logInfo(`[ENDPOINT-RESPONSE] Actualización completada en ${elapsed}ms`, response);
          logDebug('Headers de respuesta:', response?.headers);
          logDebug('Status de respuesta:', response?.status);
          logDebug('Datos de respuesta:', response?.data);
          
          showSuccess("Grupo de Agentes actualizado correctamente");
          onClickAction();
        } catch (updateError: any) {
          logError(`[ENDPOINT-ERROR] Error al actualizar grupo: ${updateError?.message}`, {
            status: updateError?.response?.status,
            statusText: updateError?.response?.statusText,
            data: updateError?.response?.data,
            message: updateError?.response?.data?.message || updateError?.message
          });
          showError(`Error al actualizar el Grupo de Agentes: ${updateError?.response?.data?.message || updateError?.message || 'Contacte al administrador'}`);
        }
      } else {
        // Modo creación - llamar al método create
        logInfo('[ENDPOINT-CALL] Llamando a endpoint de creación');
        
        try {
          const startTime = Date.now();
          const response = await _GAS.create(dataToSave);
          const elapsed = Date.now() - startTime;
          
          logInfo(`[ENDPOINT-RESPONSE] Creación completada en ${elapsed}ms`, response);
          logDebug('Headers de respuesta:', response?.headers);
          logDebug('Status de respuesta:', response?.status);
          logDebug('Datos de respuesta:', response?.data);
          
          showSuccess("Grupo de Agentes creado correctamente");
          onClickAction();
        } catch (createError: any) {
          logError(`[ENDPOINT-ERROR] Error al crear grupo: ${createError?.message}`, {
            status: createError?.response?.status,
            statusText: createError?.response?.statusText,
            data: createError?.response?.data,
            message: createError?.response?.data?.message || createError?.message
          });
          showError(`Error al crear el Grupo de Agentes: ${createError?.response?.data?.message || createError?.message || 'Contacte al administrador'}`);
        }
      }
    } catch (error: any) {
      logError("[ERROR-GENERAL] Error inesperado guardando datos:", error);
      showError(`Error inesperado: ${error?.message || "Contacte al administrador"}`);
    }
  }

  const onCancel: () => void = () => onClickAction()

  // Efecto para cargar datos iniciales: usuarios disponibles y grupo a editar si aplica
  useEffect(() => {
    const fetchDataAsync = async () => {
      try {
        if (dataToken) {
          // Log para confirmar que estamos iniciando la carga de datos
          logInfo(`Iniciando carga de datos. Modo: ${isEditMode ? 'Edición' : 'Creación'}, GroupID: ${groupId || 'nuevo'}`);
          
          // Cargar listado de usuarios disponibles
          await fetchData(dataToken)
          
          // Si estamos en modo edición, cargar datos del grupo
          if (isEditMode && groupId && dataToken.company.companyId) {
            logInfo(`[CARGA-DATOS] Cargando datos para grupo con ID: ${groupId}`);
            setIsLoading(true)
            
            try {
              // Obtener datos del grupo a editar con el endpoint específico para datos enriquecidos
              const groupsResponse = await _GAS.getGroupAgentsWithFullDetails(dataToken.company.companyId)
              logInfo(`[DATOS-RECIBIDOS] Datos de grupos recibidos del endpoint full-agents-data:`, groupsResponse.data?.length || 0);
              logDebug('Respuesta completa del backend:', groupsResponse.data)
              
              // Convertir groupId a número si es necesario (algunos endpoints pueden manejar strings)
              const groupIdNumber = typeof groupId === 'number' ? groupId : Number(groupId)
              
              // Si el ID proporcionado existe en la lista de grupos, cargar sus datos
              const foundGroup = groupsResponse.data?.find(g => g.id === groupIdNumber)

              if (foundGroup) {
                logInfo(`[GRUPO-ENCONTRADO] Grupo encontrado con ID: ${groupIdNumber}`, foundGroup);
                setGroupData(foundGroup);
                
                // Cargar nombre del grupo si existe
                if (foundGroup.name) {
                  logInfo(`[NOMBRE-GRUPO] Nombre del grupo encontrado: ${foundGroup.name}`);
                  setValue('name', foundGroup.name);
                }
                
                // Procesar selección de usuarios si el grupo tiene agents
                if (foundGroup.agents && Array.isArray(foundGroup.agents)) {
                  logInfo(`[AGENTES-ENCONTRADOS] Se encontraron ${foundGroup.agents.length} agentes en el grupo`);
                  
                  // Mapear los agentes al formato UserCaratule completo para evitar errores de tipo
                  const processedUsers: UserCaratule[] = foundGroup.agents
                    .filter(agent => agent.userId)
                    .map(agent => {
                      return {
                        userId: agent.userId,
                        name: agent.name || '',
                        mail: agent.email || '', // Usar mail en lugar de email para cumplir con UserCaratule
                        company: {
                          companyId: dataToken?.company?.companyId || 0,
                          name: dataToken?.company?.name || ''
                        },
                        role: {
                          roleId: 0, // Valor predeterminado ya que no tenemos esta información
                          id: 0,
                          name: ''
                        },
                        // Propiedades adicionales que podrían ser útiles pero no son parte de UserCaratule
                        // se pueden agregar como comentarios
                        // initials: agent.initials || ''
                      };
                    });
                  
                  if (processedUsers.length > 0) {
                    logInfo(`[AGENTES-PROCESADOS] ${processedUsers.length} agentes válidos procesados`);
                    setValue('userCompanyGroup', processedUsers);
                    setUsersSelected(processedUsers);
                  } else {
                    logWarning('[AGENTES-VACIOS] No se encontraron agentes válidos en el grupo');
                  }
                } else {
                  logWarning('[ESTRUCTURA-DESCONOCIDA] No se encontró una estructura de agentes reconocible');
                }
              } else {
                logError(`[GRUPO-NO-ENCONTRADO] El grupo con ID ${groupId} no existe en el sistema`);
                showError(`El grupo con ID ${groupId} no se encontró en el sistema.`);
                onClickAction();
              }
            } catch (loadError: any) {
              logError('[ERROR-CARGA] Error al cargar datos del grupo:', loadError);
              showError(`Error al cargar datos del grupo: ${loadError?.message || 'Error desconocido'}`);
            } finally {
              setIsLoading(false);
            }
          }
        }
      } catch (error: any) {
        console.error("Error cargando datos:", error)
        showError(`Error al cargar datos: ${error?.message || 'Contacte al administrador'}`)
        setIsLoading(false)
      }
    }
    
    fetchDataAsync()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Solo se ejecuta una vez al montar el componente

  const handleRemoveUser = (index: number) => {
    setUsersSelected(usersSelected.filter((_, i) => i !== index))
  }

  const handleAddUser = (user: UserCaratule) => {
    if (!usersSelected.some(selectedUser => selectedUser.userId === user.userId)) {
      setUsersSelected([...usersSelected, user])
    }
  }

  const columns: ColumnsType[] = [
    {
      field: "select",
      header: "Selección",
      body: (rowData: UserCaratule) => (
        <Checkbox
          checked={usersSelected.some(user => user.userId === rowData.userId)}
          onChange={() => handleAddUser(rowData)}
        />
      ),
      style: { width: "3rem" }
    },
    {
      field: "name",
      header: "Nombre",
      style: { width: "30rem" },
      filter: true
    }
  ]

  return (
    <EmptyPage>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid mb-4">
          <div className="col-10">
            <div className="flex justify-content-start align-items-baseline gap-2">
              <span className="text-900 text-xl block font-bold">
                {isEditMode ? "Editar grupo de agentes" : "Crear grupo de agentes"}
              </span>
              {isEditMode && groupData && (
                <span className="text-700 text-lg">
                  <i className="pi pi-pencil mr-2"></i>
                  {groupData.name}
                </span>
              )}
              <FormStatus isDirty={isDirty} isValid={isValid} />
            </div>
          </div>
          <div className="col-2">
            <Button icon="pi pi-arrow-left" type="button" className="m-1" onClick={onCancel} />
            <Button 
              icon="pi pi-save" 
              label={isEditMode ? "Actualizar" : "Guardar"} 
              type="submit" 
              className="m-1" 
              disabled={isLoading} 
            />
          </div>
          <Divider />
          <div className="grid w-full m-0 p-0">
            <div className="col-12 lg:col-12">
              <div className="grid formgrid p-fluid">
                <div className="field mb-4 col-12 md:col-12 sm:col-12"> {/* Nombre */}
                  <label htmlFor={"name"} className="font-medium text-900">
                    {"Nombre"}
                  </label>
                  <InputText id={"name"}
                    {...register("name", {
                      required: "El nombre es obligatorio",
                      minLength: { value: 3, message: "El nombre debe tener al menos 3 caracteres" }
                    })}
                    placeholder={"Ingrese el nombre del grupo"} type="text" />
                  {errors.name && <Message severity="error" text={errors.name.message?.toString()} />}
                </div>
                <Divider />
                <div className="field col-12 md:col-12 sm:col-12"> {/* Seleccionados */}
                  <Panel header="Agentes seleccionados">
                    <div className="flex flex-wrap justify-content-start align-items-center gap-2">
                      {usersSelected.map((user, index) => (
                        <div key={index} className="relative flex flex-column align-items-center shadow-1 p-3 border-round">
                          <div className="relative shadow-md p-2 flex justify-content-center align-items-center">
                            <Avatar shape="circle" size="large" image={"/demo/images/avatar/circle/userwebp.webp"} />
                            <Button icon="pi pi-times"
                              className="p-button-rounded p-button-danger p-button-sm absolute"
                              style={{ width: "1.5rem", height: "1.5rem", padding: "0", top: "-0.5rem", right: "-0.5rem" }}
                              onClick={() => handleRemoveUser(index)} />
                          </div>
                          <small>{user.name}</small>
                        </div>
                      ))}
                    </div>
                  </Panel>
                </div>
              </div>
            </div>
          </div>
          {/* panel de tabla listado de usuarios */}
          <Divider />
          <div className="col-12">
            <TableFilter
              size="small"
              dataKey="userId"
              rowsPerPage={5}
              dataMenu={responseData}
              columns={columns}
              emptyMessage={"No se encontraron usuarios"}
              loading={false}
              headerCardName={"Listado de Usuarios"}
            />
          </div>
        </div>
      </form>
    </EmptyPage>
  )
}

export default GroupAgentForm
