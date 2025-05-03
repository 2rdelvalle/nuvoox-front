"use client"
import { useToast } from "@/shared/context/toast/toastContext"
import { useFetch } from "@/shared/hooks/useFetch"
import { CompanyForm, NumbersOfMaintanceCaratule, STATUS_ENTITY } from "@/shared/models"
import { CodeCountries } from "@/shared/models/conversation/conversation.model"
import {
  ConversationService as _conversation
} from "@/shared/services"
import { Button } from "primereact/button"
import { Dialog } from "primereact/dialog"
import { Divider } from "primereact/divider"
import { Dropdown } from "primereact/dropdown"
import { InputText } from "primereact/inputtext"
import { Message } from "primereact/message"
import { useState } from "react"
import { Control, useFieldArray, UseFormGetValues } from "react-hook-form"
import { useTableNumbersStore } from "./state/table-numbers-store"

type Props = {
  control: Control<CompanyForm, any>;
  getValues: UseFormGetValues<CompanyForm>

};

const selectedCountryTemplate = (option: any, props : any) => {
  if (option) {
    return (
            <div className="flex align-items-center gap-3">
                <div>
                    {option.phone_code}
                </div>
                <Divider layout="vertical" />
                <div>{option.country_name}</div>
            </div>
    )
  }
  return <span>{props.placeholder}</span>
}

const countryOptionTemplate = (option: any) => {
  return (
        <div className="w-full flex" style={{ minHeight: "50px" }}>
                    +{option.phone_code}
            <Divider layout="vertical" />
            <div>{option.country_name}</div>
        </div>
  )
}

const ModalRegisterTableNumbers = ({ control, getValues }: Props) => {
  const { modalVisible, setModalVisible } = useTableNumbersStore()
  const [selectedCodeCountrie, setSelectedCountry] = useState<CodeCountries>()
  const { showInfo } = useToast()
  // OBTENER CODIGO DE PAISES
  const { responseData: codeCountries } = useFetch(_conversation.getCodeCountries)

  // Configuramos el field array para "numbersOfMaintance" dentro del formulario.
  const { append } = useFieldArray({
    control,
    name: "numbersOfMaintance"
  })

  // Estado local para el input del teléfono.
  const [telefono, setTelefono] = useState("")

  // Función para agregar un nuevo número.
  const handleAddNumber = () => {
    // verificar que todo este seleccionado
    if (!selectedCodeCountrie || !telefono) {
      showInfo("Todos los campos son Requeridos.")
    }

    if (!telefono) return // Evitar agregar si el campo está vacío

    // Creamos el objeto que se ajusta a NumbersOfMaintance.
    const newNumber: NumbersOfMaintanceCaratule = {
      numberOfMaintanceId: undefined,
      indicative: selectedCodeCountrie?.phone_code, // Puedes ajustar este valor según tu lógica
      // elimina todos los espacios
      number: telefono?.replace(/\s+/g, ""),
      IdAccountWB: undefined,
      idNumberPhone: undefined,
      status: STATUS_ENTITY.INACTIVE
    }

    const nmtceForm = getValues("numbersOfMaintance")
    const exist = nmtceForm.some((nmtce) => nmtce.number === newNumber.number)
    if (exist) {
      showInfo("El número ya se encuentra registrado.")
      return
    }

    append(newNumber)
    setSelectedCountry(undefined) // Limpiamos el código de país tras agregar el número
    setTelefono("") // Limpiamos el input tras agregar el número
    setModalVisible(false)
  }

  return (
    <Dialog
      header="Formulario registro números asociados"
      visible={modalVisible}
      onHide={() => setModalVisible(false)}
    >
    <Message severity="info" text="Seleccione el codigo de pais y el numero a iniciar la aprobacion" />
    {/* Formulario para agregar nueva conversacion */}
    <div className="card flex flex-wrap gap-3 p-fluid mt-4 align-items-center justify-content-center ">
        {/* Codigo de Pais */}
        <div>
            <label className="font-bold block mb-2">Codigo De Pais</label>
            <Dropdown
                showClear
                value={selectedCodeCountrie}
                onChange={(e) => setSelectedCountry(e.value)}
                options={codeCountries}
                optionLabel="country_name"
                placeholder="Seleccione Un Codigo De Pais"
                virtualScrollerOptions={{ itemSize: 60 }}
                filter
                itemTemplate={countryOptionTemplate}
                valueTemplate={selectedCountryTemplate}
                className="w-full md:w-18rem"
            />
        </div>
        <div>
            <label className="font-bold block mb-2">Numero De Telefono</label>
            <InputText
                placeholder="Ingrese su numero de telefono"
                type="tel"
                pattern="[0-9]{10}"
                className="w-full"
                required
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)} />
        </div>
    </div>
    <Button label="Registrar" onClick={handleAddNumber} />
    </Dialog>
  )
}

export default ModalRegisterTableNumbers
