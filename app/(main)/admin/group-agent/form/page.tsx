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

/**
 * Componente de formulario para crear o editar grupos de agentes
 * Soporta dos modos de operación:
 * 1. Creación: Cuando no se proporciona un ID en la URL
 * 2. Edición: Cuando se proporciona un ID en la URL, carga los datos del grupo existente
 */
const GroupAgentForm = ({ searchParams }: { searchParams: { id?: string } }) => {
  // Determinar si estamos en modo edición
  const isEditMode = !!searchParams.id
  // Convertir el id a número solo si existe, con manejo seguro de tipos
  const groupId = typeof searchParams.id === 'string' ? parseInt(searchParams.id) : undefined
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
    
    try {
      // Determinar si estamos creando o actualizando
      if (isEditMode && groupId) {
        // Modo edición - llamar al método update
        await _GAS.update(groupId, dataToSave)
          .then(() => {
            showSuccess("Grupo de Agentes actualizado correctamente")
            onClickAction()
          }).catch((err) => {
            console.error("Error al actualizar el grupo:", err.response?.data?.error || err.message)
            showError("Error al actualizar el Grupo de Agentes: " + (err.response?.data?.error || err.message))
          })
      } else {
        // Modo creación - llamar al método create
        await _GAS.create(dataToSave)
          .then(() => {
            showSuccess("Grupo de Agentes creado correctamente")
            onClickAction()
          }).catch((err) => {
            console.error("Error al crear el grupo:", err.response?.data?.error || err.message)
            showError("Error al crear el Grupo de Agentes: " + (err.response?.data?.error || err.message))
          })
      }
    } catch (error: any) {
      console.error("Error inesperado:", error)
      showError("Error inesperado: " + (error?.message || "Contacte al administrador"))
    }
  }

  const onCancel: () => void = () => onClickAction()

  // Efecto para cargar datos iniciales: usuarios disponibles y grupo a editar si aplica
  useEffect(() => {
    const fetchDataAsync = async () => {
      try {
        if (dataToken) {
          // Cargar listado de usuarios disponibles
          await fetchData(dataToken)
          
          // Si estamos en modo edición, cargar datos del grupo
          if (isEditMode && groupId && dataToken.company.companyId) {
            setIsLoading(true)
            
            // Obtener datos del grupo a editar
            const groupsResponse = await _GAS.getGroupAgentsWithFullDetails(dataToken.company.companyId)
            // Buscar el grupo por ID
            const selectedGroup = groupsResponse.data.find((g: any) => g.id === groupId)
            
            if (selectedGroup) {
              setGroupData(selectedGroup)
              
              // Establecer el nombre en el formulario
              setValue('name', selectedGroup.name)
              
              // Si hay datos de usuarios enriquecidos, convertirlos a formato UserCaratule para usarlos en el formulario
              if (selectedGroup.agents && selectedGroup.agents.length > 0) {
                // Crear objetos de usuario seleccionados 
                // Usamos una estructura simplificada que sea compatible con lo que espera el componente
                const selectedUsers = selectedGroup.agents.map(agent => ({
                  userId: agent.userId,
                  name: agent.name || `Usuario ${agent.userId}`,
                  // Agregamos campos requeridos con valores predeterminados
                  mail: agent.email || '',
                  phone: agent.phone || '',
                  document: agent.document || '',
                  company: { companyId: dataToken.company.companyId },
                  role: { id: 0, name: '', roleId: 0 }
                })) as unknown as UserCaratule[] // Cast para satisfacer la interfaz
                
                setUsersSelected(selectedUsers)
              }
            } else {
              showError(`No se encontró el grupo con ID ${groupId}`)
              // Redirigir al listado si no existe el grupo
              onClickAction()
            }
            
            setIsLoading(false)
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
