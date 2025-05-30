"use client"
import { useToast } from "@/shared/context/toast/toastContext"
import { useFetch } from "@/shared/hooks/useFetch"
import { useFetchWithParams } from "@/shared/hooks/useFetchWithParams"
import { usePush } from "@/shared/hooks/usePush"
import { NumbersOfMaintanceCaratule, STATUS_ENTITY, UserFormModel } from "@/shared/models"
import { ADMIN_ROUTES } from "@/shared/routes/admin.routes"
import {
  CompanyService as _company,
  RoleService as _role,
  TypeDocumentService as _typeDocument,
  UserService as _user
} from "@/shared/services"
import EmptyPage from "@/shared/small-components/EmptyPage/emptyPage"
import FormStatus from "@/shared/small-components/FormStatus/formStatus"
import InfoMessage from "@/shared/small-components/InfoMessage/infoMessage"
import { Button } from "primereact/button"
import { Checkbox } from "primereact/checkbox"
import { Divider } from "primereact/divider"
import { Dropdown } from "primereact/dropdown"
import { InputText } from "primereact/inputtext"
import { Message } from "primereact/message"
import { useEffect, useState } from "react"
import { Controller, SubmitHandler, useForm } from "react-hook-form"
import { BlockUI } from "primereact/blockui"
import { useParams } from "next/navigation"
import { getCookieToken, getDataFromToken } from "@/shared/utilities/functions/sessionUtils"

const UserForm = () => {
  const params = useParams()
  const { onClickAction } = usePush(ADMIN_ROUTES.USER.LIST)
  const { register, handleSubmit, control, formState: { errors, isValid, isDirty }, watch, setValue } = useForm<UserFormModel>({
    // resolver: zodResolver(S)
  })
  const [blocked, setBlocked] = useState(false)
  const [showPass, setshowPass] = useState(false)

  const { showSuccess, showError } = useToast()
  const [modeEdit, setModeEdit] = useState<boolean>(false)

  useEffect(() => {
    // SI hay param.id bloquea y tambien si el param.id es un numero
    if (params.id && !isNaN(Number(params.id))) {
      setBlocked(true)
      _user.findById(params.id)
        .then(({ data }) => {
          setBlocked(false)
          if (data) {
            updateFormToEdit(data)
          }
          setBlocked(false)
        })
        .catch((error) => {
          setBlocked(false)
          showError("Error al cargar el usuario" + error)
          onClickAction()
        })
    }
  }, [])

  function updateFormToEdit (data: UserFormModel) {
    setModeEdit(true)
    setValue("userId", data.userId)
    setValue("name", data.name)
    setValue("mail", data.mail)
    setValue("phone", data.phone)
    setValue("document", data.document)
    setValue("typeDocument.typeDocumentId", data.typeDocument.typeDocumentId)
    // eslint-disable-next-line no-unused-expressions
    setValue("company.companyId", data.company.companyId)
    setValue("role.roleId", data.role.roleId)
  }

  // obtener el rol del la coockie
  const token = getCookieToken()
  const dataFromToken = getDataFromToken(token ?? "")

  const onSubmit: SubmitHandler<UserFormModel> = (data) => {
    // Priorizar empresa seleccionada en el select sobre la empresa del token
    // Asegurarnos de que siempre haya un valor válido para company
    let companyToSubmit = data.company?.companyId ? { companyId: data.company.companyId } : dataFromToken?.user?.company
    
    // Si aún no tenemos un valor válido, crear un objeto vacío con un valor por defecto
    // Este es un caso de respaldo que idealmente no debería ocurrir
    if (!companyToSubmit?.companyId) {
      showError("No se pudo determinar la empresa. Verifica tu selección.")
      return
    }

    const userToSubmit : UserFormModel = {
      userId: data.userId ? data.userId : 0,
      name: data.name,
      mail: data.mail,
      phone: data.phone,
      document: data.document,
      typeDocument: {
        typeDocumentId: data.typeDocument.typeDocumentId
      },
      role: {
        roleId: data.role.roleId
      },
      company: companyToSubmit,
      password: data.password,
      status: STATUS_ENTITY.ACTIVE,
      userNumbersToMaintance: selected
    }

    if (modeEdit) {
      editUser(userToSubmit)
    } else {
      saveUser(userToSubmit)
    }
    onClickAction()
  }

  function saveUser (data: UserFormModel) {
    _user.create(data)
      .then(() => {
        showSuccess("Usuario creado correctamente")
        onClickAction()
      })
      .catch((error) => {
        console.error(error)
        onClickAction()
        showError("Error al crear el usuario")
      })
  }

  function editUser (data: UserFormModel) {
    _user.update(data)
      .then(() => {
        showSuccess("Usuario actualizado correctamente")
        onClickAction()
      })
      .catch((error) => {
        console.error(error)
        onClickAction()
        showError("Error al actualizar el usuario")
      })
  }

  const onCancel: () => void = () => onClickAction()

  // select fields
  const { responseData: typeDocuments } = useFetch(_typeDocument.caratule)
  const { responseData: role } = useFetch(_role.caratuleForCompanies)
  const { responseData: companies } = useFetch(_company.caratuleFormSelects)

  // Usa el nuevo hook
  const { responseData: numbersOfMaintance, fetchData } = useFetchWithParams(_company.getnumbersOfMaintance)

  const [haveNOMagents, sethaveNOMagents] = useState(false)

  useEffect(() => {
    if (watch("company.companyId") === undefined) return
    fetchData(Number(watch("company.companyId")))
    if (watch("role.roleId")?.toString() === "1") {
      sethaveNOMagents(true)
    } else {
      sethaveNOMagents(false)
    }
  }, [watch("company.companyId"), watch("role.roleId")])

  const [selected, setSelected] = useState<NumbersOfMaintanceCaratule[]>()

  return (
    <BlockUI blocked={blocked} fullScreen={true} >
    <EmptyPage>
        <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid mb-4">
        <div className="col-10">
            <div className="flex justify-content-start align-items-baseline gap-2">
                <span className="text-900 text-xl block font-bold">{"Formulario de Usuario"}</span>
                <FormStatus isDirty={isDirty} isValid={isValid} />
            </div>
        </div>
        <div className="col-2">
                <Button icon="pi pi-arrow-left" type="button" className="m-1" onClick={onCancel}/>
                <Button icon={`pi pi-${modeEdit ? "pencil" : "save"}`} label="Guardar" type="submit" className="m-1" />
        </div>
        <Divider/>
    <div className="grid">
        <div className="col-12 lg:col-2">
            <div className="text-900 font-medium text-xl mb-3">{"Perfil"}</div>
            <p className="m-0 p-0 text-600 line-height-3 mr-3 text-justify">
                {"Cree un nuevo usuario que administrará el aplicativo " +
                " según el rol que desee asignarle. Por defecto, el usuario tendrá acceso a todas las funcionalidades del aplicativo."
                }
            </p>
        </div>
        <div className="col-12 lg:col-10">
            <div className="grid formgrid p-fluid">
                <div className="field mb-4 col-12 md:col-6 sm:col-12"> {/* Nombre */}
                    <label htmlFor={"name"} className="font-medium text-900">
                      {"Nombre"}
                    </label>
                    <InputText id={"name"}
                    {...register("name")}
                    placeholder={"Ingrese su nombre"} type="text" />
                    {errors.name && <Message severity="error" text={errors?.name?.message?.toString()} />}
                </div>
                <div className="field mb-4 col-12 md:col-6 sm:col-12"> {/* Correo */}
                    <label htmlFor={"email"} className="font-medium text-900">
                      {"Correo electrónico"}
                    </label>
                    <div className="p-inputgroup">
                        <span className="p-inputgroup-addon">@</span>
                          <InputText id={"email"} className="w-full"
                        {...register("mail",
                          {
                            pattern: {
                              value: /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/,
                              message: "Correo electrónico inválido"
                            }
                          }
                        )} placeholder={"Ingrese su correo electrónico"} type="email" />
                      </div>
                        {errors.mail &&
                            <Message severity="error" text={errors.mail.message?.toString()}/>
                        }
                </div>
                <div className="field mb-4 col-12 md:col-6 sm:col-12"> {/* Celular */}
                    <label htmlFor={"phone"} className="font-medium text-900">
                      {"Celular"}
                    </label>
                    <InputText id={"phone"}
                        {...register("phone", {
                          pattern: {
                            value: /^[0-9]*$/,
                            message: "Solo se permiten números"
                          }
                        })} placeholder={"Ingrese su número de teléfono móvil"} type="text" />
                        {errors.phone && <Message severity="error" text={errors.phone.message?.toString()} />}
                </div>
            { !modeEdit && (
                <div className="field mb-4 col-12 md:col-6 sm:col-12">
                <label htmlFor={"phone"} className="font-medium text-900">
                      {"Contraseña"}
                    </label>
                <div className="p-inputgroup">
                    <span className="p-inputgroup-addon" onClick={() => setshowPass(!showPass)}>
                        <i className={`pi pi-${!showPass ? "lock" : "lock-open"}`}></i>
                    </span>
                    <div className="flex flex-column w-full">
                        <InputText id="password" type={showPass ? "text" : "password"} className="w-full"
                            {...register("password")} placeholder={"Ingrese su Contraseña"} />

                        {errors.password && <></>
                        }
                    </div>
                </div>
            </div>
            )
            }
            <div className="flex flex-column field mb-4 col-12 md:col-6 sm:col-12"> {/* Tipo Documento */}
                      <label htmlFor={"typedocument"} className="font-medium text-900">
                      {"Tipo de Documento"}
                      </label>
                      <Controller
                        name="typeDocument.typeDocumentId"
                        control={control}
                        render={({ field }) => (
                            <Dropdown
                                id={"typedocument"}
                                value={typeDocuments.find(doc => doc.typeDocumentId.toString() === field.value?.toString())}
                                optionLabel="name"
                                filter
                                filterBy="name"
                                options={typeDocuments}
                                placeholder={"Seleccione su tipo de documento"}
                                focusInputRef={field.ref}
                                onChange={(e) => field.onChange(e.value.typeDocumentId.toString())}
                            />
                        )}
                      />
                       {errors.typeDocument && <Message severity="error" text={errors.typeDocument.message?.toString()} />}
                </div>
                <div className="field mb-4 col-12 md:col-6 sm:col-12"> {/* Documento */}
                    <label htmlFor={"document"} className="font-medium text-900">
                      {"Documento de identidad"}
                    </label>
                    <InputText id={"document"}
                        {...register("document", {
                          pattern: {
                            value: /^[0-9]*$/,
                            message: "Solo se permiten números"
                          }
                        })} placeholder={"Ingrese su número de documento"} type="text" />
                        {errors.document && <Message severity="error" text={errors.document.message?.toString()} />}
                </div>
            {dataFromToken?.user?.role?.name === "SUPERADMIN" &&
            (<div className="flex flex-column field mb-4 col-12 md:col-6 sm:col-12"> {/* Tipo Documento */}
                      <label htmlFor={"company"} className="font-medium text-900">
                      {"Empresa"}
                      </label>
                      <Controller
                        name="company.companyId"
                        control={control}
                        render={({ field }) => (
                            <Dropdown
                                id={"role"}
                                value={companies.find(doc => doc.companyId.toString() === field.value?.toString())}
                                optionLabel="name"
                                filter
                                filterBy="name"
                                options={companies}
                                placeholder={"Seleccione su Empresa"}
                                focusInputRef={field.ref}
                                onChange={(e) => field.onChange(e.value.companyId.toString())}
                            />
                        )}
                      />
                       {errors.company && <Message severity="error" text={errors.company.message?.toString()} />}
                </div>
            )
            }
            <div className="flex flex-column field mb-4 col-12 md:col-6 sm:col-12"> {/* Tipo Documento */}
                      <label htmlFor={"role"} className="font-medium text-900">
                      {"Rol"}
                      </label>
                      <Controller
                        name="role.roleId"
                        control={control}
                        render={({ field }) => (
                            <Dropdown
                                id={"role"}
                                value={role.find(doc => doc.roleId.toString() === field.value?.toString())}
                                optionLabel="name"
                                filter
                                filterBy="name"
                                options={role}
                                placeholder={"Seleccione su tipo de documento"}
                                focusInputRef={field.ref}
                                onChange={(e) => field.onChange(e.value.roleId.toString())}
                            />
                        )}
                      />
                       {errors.role && <Message severity="error" text={errors.role.message?.toString()} />}
                </div>
            {haveNOMagents && (
                <>
            <Divider className="mb-5"/>
            <InfoMessage
                message={
                    "A continuación se listan los numeros que puedes asignar para que maneje este usuario"
                }
            />
            <div className="flex flex-column field mb-4 col-12 md:col-12 sm:col-12"> {/* Tipo Documento */}
                    <label htmlFor={"numbersAssing"} className="font-medium text-900">
                    </label>
                        <h4>Listado de numeros</h4>
                        <div className="card flex flex-wrap justify-content-center gap-3">
                           {
                            numbersOfMaintance.map((data : any) => {
                              return (
                                <div className="flex align-items-center" key={data.numberOfMaintanceId}>
                                    <Checkbox
                                        inputId={data.numberOfMaintanceId?.toString() }
                                        name={data.number} value={data.numberOfMaintanceId}
                                        onChange={(e) => {
                                          const selectedNumbers = selected || []
                                          if (e.checked) {
                                            setSelected([...selectedNumbers, data])
                                          } else {
                                            setSelected(selectedNumbers.filter(
                                              (item) => item.numberOfMaintanceId !== data.numberOfMaintanceId))
                                          }
                                        }}
                                        checked={selected?.includes(data) ?? false} />
                                    <p className="text-xl ml-2">{data.number}</p>
                                </div>
                              )
                            })
                           }
                        </div>
                </div>
            </>
            )}
            </div>
        </div>
    </div>
    </div>
    </form>
    </EmptyPage>
    </BlockUI>
  )
}

export default UserForm
