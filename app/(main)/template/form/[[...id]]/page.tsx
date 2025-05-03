"use client"
import { useToast } from "@/shared/context/toast/toastContext"
import { usePush } from "@/shared/hooks/usePush"
import { TemplateModel } from "@/shared/models"
import { ADMIN_ROUTES } from "@/shared/routes/admin.routes"
import {
  TemplateService as _template
} from "@/shared/services"
import EmptyPage from "@/shared/small-components/EmptyPage/emptyPage"
import FormStatus from "@/shared/small-components/FormStatus/formStatus"
import { getCookieToken, getDataFromToken } from "@/shared/utilities/functions/sessionUtils"
import { BlockUI } from "primereact/blockui"
import { Button } from "primereact/button"
import { Divider } from "primereact/divider"
import { InputText } from "primereact/inputtext"
import { InputTextarea } from "primereact/inputtextarea"
import { Message } from "primereact/message"
import { useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form"

const TemplateForm = () => {
  const { onClickAction } = usePush(ADMIN_ROUTES.TEMPLATE.LIST)
  const { register, handleSubmit, formState: { errors, isValid, isDirty } } = useForm<TemplateModel>({
    // resolver: zodResolver(S)
  })
  const [blocked, setBlocked] = useState(false)

  const { showSuccess, showError } = useToast()

  // obtener el rol del la coockie
  const token = getCookieToken()
  const dataFromToken = getDataFromToken(token ?? "")

  const onSubmit: SubmitHandler<TemplateModel> = async (data) => {
    // Priorizar empresa seleccionada en el select sobre la empresa del token
    const companyToSubmit = dataFromToken?.user?.company

    const templateToSumbit : TemplateModel = {
      companyID: Number(companyToSubmit?.companyId) ?? undefined,
      nameTemplate: data.nameTemplate,
      textTemplate: data.textTemplate
    }

    await save(templateToSumbit)
    onClickAction()
  }

  async function save (data: TemplateModel) {
    setBlocked(true)
    await _template.save(data)
      .then(() => {
        showSuccess("plantilla creado correctamente")
        onClickAction()
      })
      .catch((error) => {
        console.error(error)
        onClickAction()
        showError("Error al crear la plantilla")
      })
      .finally(() => {
        setBlocked(false)
      })
  }

  const onCancel: () => void = () => onClickAction()

  return (
    <BlockUI blocked={blocked} fullScreen={true} >
    <EmptyPage>
        <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid mb-4">
        <div className="col-10">
            <div className="flex justify-content-start align-items-baseline gap-2">
                <span className="text-900 text-xl block font-bold">{"Formulario de Plantilla"}</span>
                <FormStatus isDirty={isDirty} isValid={isValid} />
            </div>
        </div>
        <div className="col-2">
                <Button icon="pi pi-arrow-left" type="button" className="m-1" onClick={onCancel}/>
                <Button icon={"pi pi-save"} label="Guardar" type="submit" className="m-1" />
        </div>
        <Divider/>
        <div className="col-12">
            <div className="field mb-4"> {/* Nombre de Plantilla */}
                <label htmlFor={"nameTemplate"} className="font-medium text-900 block mb-2">
                  {"Nombre de la Plantilla"}
                </label>
                <InputText id={"nameTemplate"}
                  {...register("nameTemplate")}
                  placeholder={"Ingrese el nombre de la plantilla"} type="text" className="w-full" />
                {errors.nameTemplate && <Message severity="error" text={errors?.nameTemplate?.message?.toString()} />}
            </div>
        </div>
        <div className="col-12">
            <div className="field mb-4"> {/* Contenido de Plantilla */}
                <label htmlFor={"textTemplate"} className="font-medium text-900 block mb-2">
                  {"Contenido de la Plantilla"}
                </label>
                <InputTextarea id={"textTemplate"}
                  {...register("textTemplate")}
                  placeholder={"Ingrese el contenido de la plantilla"} rows={5} autoResize className="w-full" />
                {errors.textTemplate && <Message severity="error" text={errors?.textTemplate?.message?.toString()} />}
            </div>
        </div>
        </div>
        </form>
    </EmptyPage>
    </BlockUI>
  )
}

export default TemplateForm
