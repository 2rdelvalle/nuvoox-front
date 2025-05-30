"use client"
import { useToast } from "@/shared/context/toast/toastContext"
import { useFetchWithParams } from "@/shared/hooks/useFetchWithParams"
import { usePush } from "@/shared/hooks/usePush"
import { GroupAgent, UserCaratule } from "@/shared/models"
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

const GroupAgentForm = () => {
  const { showError, showSuccess } = useToast()

  const { onClickAction } = usePush(ADMIN_ROUTES.GROUP_AGENT.LIST)

  const { responseData, fetchData } = useFetchWithParams(_users.getCaratulesFromUserCompany)

  const [usersSelected, setUsersSelected] = useState<UserCaratule[]>([])

  const { register, handleSubmit, formState: { errors, isValid, isDirty } } = useForm<GroupAgent>({
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
      await _GAS.create(dataToSave)
        .then((res) => {
          showSuccess("Grupo de Agentes creado correctamente")
          onClickAction()
        }).catch((err) => {
          console.log(err.response.data.error)
          showError("Error al crear el Grupo de Agentes, " + err.response.data.error)
        })
    } catch (error) {

    }
  }

  const onCancel: () => void = () => onClickAction()

  useEffect(() => {
    const fetchDataAsync = async () => {
      if (dataToken) {
        await fetchData(dataToken)
      }
    }
    fetchDataAsync()
  }, [])

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
              <span className="text-900 text-xl block font-bold">{"Formulario de grupos de agentes"}</span>
              <FormStatus isDirty={isDirty} isValid={isValid} />
            </div>
          </div>
          <div className="col-2">
            <Button icon="pi pi-arrow-left" type="button" className="m-1" onClick={onCancel} />
            <Button icon={"pi pi-save"} label="Guardar" type="submit" className="m-1" />
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
