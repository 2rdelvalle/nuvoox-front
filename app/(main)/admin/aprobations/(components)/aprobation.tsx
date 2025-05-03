import { useToast } from "@/shared/context/toast/toastContext"
import { NumbersOfMaintanceCaratule, STATUS_ENTITY } from "@/shared/models"
import {
  CompanyService as _company
} from "@/shared/services/index"
import { Button } from "primereact/button"
import { Dialog } from "primereact/dialog"
import { InputText } from "primereact/inputtext"
import { Message } from "primereact/message"
import { SubmitHandler, useForm } from "react-hook-form"
type props = {
    modalVisible: boolean
    setModalVisible: (visible: boolean) => void
    actualNomAprobate: any | undefined
    update: () => void
}

const AprobationDialog = ({ modalVisible, setModalVisible, actualNomAprobate, update } : props) => {
  const { showError, showSuccess } = useToast()

  const { register, handleSubmit, reset } = useForm<NumbersOfMaintanceCaratule>({
    // resolver: zodResolver(SCHEMA_USER)
  })

  const onSubmit: SubmitHandler<NumbersOfMaintanceCaratule> = (data) => {
    setModalVisible(false)
    if (!actualNomAprobate) {
      setModalVisible(false)
      showError("No hay números asociados para aprobar. Seleccione Nuevamente")
    }
    if (actualNomAprobate) {
      const nom : NumbersOfMaintanceCaratule = {
        numberOfMaintanceId: actualNomAprobate.id,
        IdAccountWB: data.IdAccountWB,
        IdAccountWBPFC: data.IdAccountWBPFC,
        idNumberPhone: data.idNumberPhone,
        status: STATUS_ENTITY.ACTIVE,
        indicative: actualNomAprobate.indicative,
        number: actualNomAprobate.number
      }
      _company.aprobateNumberOfMaintanceCompany(nom)
        .then(() => {
          showSuccess("Número Aprobado Correctamente")
          update()
          reset()
        }).catch((errr) => {
          showError("Error al aprobar el número" + errr)
        })
    } else {
      showError("Error al aprobar el número")
    }
  }

  return (
      <Dialog
      header="Formulario registro números asociados"
      visible={modalVisible}
      onHide={() => setModalVisible(false)}
    >
    <form onSubmit={handleSubmit(onSubmit)}>
    <Message severity="info" text="Llene los datos que obtuvo en Facebook Developers" />
    {/* Formulario para agregar nueva conversación */}
    <div className="card p-fluid mt-4 flex justify-content-center">
        <div className="grid w-full">
            <div className="col-12">
                <label className="font-bold block mb-2">Identificador Número Facebook</label>
                <InputText
                    placeholder="Ingrese su identificador de teléfono"
                    type="text"
                    className="w-full"
                    required
                    {...register("idNumberPhone")}
                />
            </div>
            <div className="col-12">
                <label className="font-bold block mb-2">Identificador Número WhatsApp Business</label>
                <InputText
                    placeholder="Ingrese su identificador de WhatsApp Business"
                    type="text"
                    className="w-full"
                    required
                    {...register("IdAccountWBPFC")}
                />
            </div>
            <div className="col-12">
                <label className="font-bold block mb-2">Token</label>
                <InputText
                    placeholder="Ingrese su token permanente"
                    type="text"
                    className="w-full"
                    required
                    {...register("IdAccountWB")}
                />
            </div>
        </div>
    </div>
    <Button label="Aprobar" type="submit" />
    </form>
    </Dialog>
  )
}

export default AprobationDialog
