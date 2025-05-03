"use client"
import TableNumbers from "@/shared/components/company/tableNumbers/table-numbers"
import { useToast } from "@/shared/context/toast/toastContext"
import { usePush } from "@/shared/hooks/usePush"
import { CompanyForm } from "@/shared/models"
import { ADMIN_ROUTES } from "@/shared/routes/admin.routes"
import {
  CompanyService as _companies
} from "@/shared/services"
import EmptyPage from "@/shared/small-components/EmptyPage/emptyPage"
import FormStatus from "@/shared/small-components/FormStatus/formStatus"
import { useParams } from "next/navigation"
import { BlockUI } from "primereact/blockui"
import { Button } from "primereact/button"
import { Divider } from "primereact/divider"
import { InputText } from "primereact/inputtext"
import { Message } from "primereact/message"
import { useEffect, useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form"
import dynamic from "next/dynamic"
const ModalRegisterTableNumbers = dynamic(() =>
  import("@/shared/components/company/tableNumbers/modal-register-tableNumbers"), { ssr: false })

const CompanyFormPage = () => {
  const params = useParams()
  const { onClickAction } = usePush(ADMIN_ROUTES.COMPANY.LIST)
  const [modeEdit, setModeEdit] = useState<boolean>(false)
  const [blocked, setBlocked] = useState(false)
  const { showError, showSuccess } = useToast()

  const { control, register, handleSubmit, formState: { errors, isValid, isDirty }, getValues, setValue } = useForm<CompanyForm>({
    // resolver: zodResolver(SCHEMA_USER)
  })

  const onSubmit: SubmitHandler<CompanyForm> = (data) => {
    const companyToSubmit : CompanyForm = {
      companyId: data.companyId ?? undefined,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      country: data.country,
      city: data.city,
      quantityEmployees: data.quantityEmployees,
      maxNumberOfMaintance: +data.maxNumberOfMaintance,
      maxQuantityAgents: +data.maxQuantityAgents,
      numbersOfMaintance: data.numbersOfMaintance
    }

    if (modeEdit) {
      editCompany(companyToSubmit)
    } else {
      saveCompany(companyToSubmit)
    }
    onClickAction()
  }

  function updateFormToEdit (company: CompanyForm) {
    setModeEdit(true)
    setValue("companyId", company.companyId)
    console.log(company.companyId)
    setValue("name", company.name)
    setValue("email", company.email)
    setValue("phone", company.phone)
    setValue("address", company.address)
    setValue("country", company.country)
    setValue("city", company.city)
    setValue("quantityEmployees", company.quantityEmployees)
    setValue("maxNumberOfMaintance", company.maxNumberOfMaintance)
    setValue("maxQuantityAgents", company.maxQuantityAgents)
    setValue("numbersOfMaintance", company.numbersOfMaintance)
  }

  function saveCompany (data: CompanyForm) {
    _companies.create(data)
      .then(() => {
        showSuccess("Empresa creada correctamente")
        onClickAction()
      })
      .catch((error) => {
        console.error(error)
        onClickAction()
        showError("Error al crear el usuario")
      })
  }

  function editCompany (data: CompanyForm) {
    _companies.update(data)
      .then(() => {
        showSuccess("Empresa actualizada correctamente")
        onClickAction()
      })
      .catch((error) => {
        console.error(error)
        onClickAction()
        showError(error.response.data.message ?? "Error Al Actualizar")
      })
  }

  useEffect(() => {
    // SI hay param.id bloquea y tambien si el param.id es un numero
    if (params.id && !isNaN(Number(params.id))) {
      setBlocked(true)
      _companies.findById(params.id)
        .then(({ data }) => {
          setBlocked(false)
          if (data) {
            updateFormToEdit(data)
          }
          setBlocked(false)
        })
        .catch((error) => {
          setBlocked(false)
          showError("Error al cargar La empresa " + error)
          onClickAction()
        })
    }
  }, [])

  const onCancel: () => void = () => onClickAction()

  return (
    <BlockUI blocked={blocked} fullScreen={true} >
    <EmptyPage>
        <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid mb-4">
        <div className="col-10">
            <div className="flex justify-content-start align-items-baseline gap-2">
                <span className="text-900 text-xl block font-bold">{"Formulario de Empresas"}</span>
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
                {"Cree una nueva empresa que administrará el aplicativo " +
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
                {/* Direccion */}
                <div className="field mb-4 col-12 md:col-6 sm:col-12">
                    <label htmlFor={"address"} className="font-medium text-900">
                      {"Direccion"}
                    </label>
                    <InputText id={"address"}
                    {...register("address")}
                    placeholder={"Ingrese la Direccion"} type="text" />
                    {errors.address && <Message severity="error" text={errors?.address?.message?.toString()} />}
                </div>
                {/* Pais */}
                <div className="field mb-4 col-12 md:col-6 sm:col-12">
                    <label htmlFor={"country"} className="font-medium text-900">
                      {"Pais"}
                    </label>
                    <InputText id={"country"}
                    {...register("country")}
                    placeholder={"Ingrese El Pais"} type="text" />
                    {errors.country && <Message severity="error" text={errors?.country?.message?.toString()} />}
                </div>
                {/* ciudad */}
                <div className="field mb-4 col-12 md:col-6 sm:col-12">
                    <label htmlFor={"city"} className="font-medium text-900">
                      {"Ciudad"}
                    </label>
                    <InputText id={"city"}
                    {...register("city")}
                    placeholder={"Ingrese la Ciudad"} type="text" />
                    {errors.city && <Message severity="error" text={errors?.city?.message?.toString()} />}
                </div>
                {/* NUMEROS MAXIMOS DE WHATSAPP */}
                <div className="field mb-4 col-12 md:col-6 sm:col-12"> {/* Nombre */}
                    <label htmlFor={"maxnumbers"} className="font-medium text-900">
                      {"Cantidad de Numeros De Whatsapp"}
                    </label>
                    <InputText id={"maxnumbers"}
                    {...register("maxNumberOfMaintance", {
                      pattern: {
                        value: /^[0-9]*$/,
                        message: "Solo se permiten números"
                      }
                    })}
                    placeholder={"Ingrese la cantiad maxima de numeros"} type="text" />
                    {errors.maxNumberOfMaintance && <Message severity="error" text={errors?.maxNumberOfMaintance?.message?.toString()} />}
                </div>
                {/* CANTIDAD MAXIMAS DE AGENTES */}
                <div className="field mb-4 col-12 md:col-6 sm:col-12"> {/* Maximo de Agentes */}
                    <label htmlFor={"maxQuantityAgents"} className="font-medium text-900">
                      {"Cantidad de Agentes"}
                    </label>
                    <InputText id={"maxQuantityAgents"}
                    {...register("maxQuantityAgents", {
                      pattern: {
                        value: /^[0-9]*$/,
                        message: "Solo se permiten números"
                      }
                    })}
                    placeholder={"Ingrese la cantiad maxima de agentes"} type="text" />
                    {errors.maxQuantityAgents && <Message severity="error" text={errors?.maxQuantityAgents?.message?.toString()} />}
                </div>
                <div className="field mb-4 col-12 md:col-6 sm:col-12"> {/* Cantidad De Empleados */}
                    <label htmlFor={"quantityEmployees"} className="font-medium text-900">
                      {"Cantidad de Empleados"}
                    </label>
                    <InputText id={"quantityEmployees"}
                    {...register("quantityEmployees", {
                      pattern: {
                        value: /^[0-9]*$/,
                        message: "Solo se permiten números"
                      }

                    })}
                    placeholder={"Ingrese la cantiad de Empleados"} type="text" />
                    {errors.quantityEmployees && <Message severity="error" text={errors?.quantityEmployees?.message?.toString()} />}
                </div>
                <div className="field mb-4 col-12 md:col-6 sm:col-12"> {/* Correo */}
                    <label htmlFor={"email"} className="font-medium text-900">
                      {"Correo electrónico"}
                    </label>
                    <div className="p-inputgroup">
                        <span className="p-inputgroup-addon">@</span>
                          <InputText id={"email"} className="w-full"
                        {...register("email",
                          {
                            pattern: {
                              value: /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/,
                              message: "Correo electrónico inválido"
                            }
                          }
                        )} placeholder={"Ingrese su correo electrónico"} type="email" />
                      </div>
                        {errors.email &&
                            <Message severity="error" text={errors.email.message?.toString()}/>
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
                          },
                          maxLength: 10,
                          minLength: 10
                        })} placeholder={"Ingrese su número de teléfono móvil"} type="text" />
                        {errors.phone && <Message severity="error" text={errors.phone.message?.toString()} />}
                </div>
                <div className="field mb-4 col-12"> {/* Celular */}
                    <TableNumbers isLoading={false}
                        control={control} numbers={getValues("numbersOfMaintance")} getValues={getValues} setValue={setValue}/>
                    <ModalRegisterTableNumbers control={control} getValues={getValues}/>
                </div>
            </div>
        </div>
    </div>
    </div>
    </form>
    </EmptyPage>
    </BlockUI>
  )
}

export default CompanyFormPage
