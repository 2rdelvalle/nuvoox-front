import { useToast } from "@/shared/context/toast/toastContext"
import { useFetch } from "@/shared/hooks/useFetch"
import { CodeCountries, Conversation } from "@/shared/models/conversation/conversation.model"
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
import { useChatStore } from "../store/chat-store"
type propsNewNumber = {
    updateData : (param? : string) => void
}

const NewNumber = ({ updateData } : propsNewNumber) => {
  const {
    dialogNewNumber,
    setDialogNewNumber,
    user,
    actualNumberOfMaintanceSelected,
    conversations: listConversations
  } = useChatStore()

  // OBTENER CODIGO DE PAISES
  const { responseData: codeCountries } = useFetch(_conversation.getCodeCountries)

  const [selectedCodeCountrie, setSelectedCountry] = useState<CodeCountries>()
  const [numberPhone, setNumberPhone] = useState<string>("")
  const { showSuccess, showError } = useToast()

  async function registerNumber () {
    // Validar campos
    if (!selectedCodeCountrie || !numberPhone) {
      showError("Todos los campos son obligatorios")
    } else {
      // registrar numero
      if (listConversations.some((c) => c.destination_number === numberPhone && c.indicative === selectedCodeCountrie.phone_code)) {
        showError("El número ya se encuentra registrado en el listado de conversaciones")
        return
      }

      const conversation : Conversation = {
        destination_number: numberPhone,
        user,
        phone: `${selectedCodeCountrie.phone_code}${numberPhone}`,
        indicative: selectedCodeCountrie.phone_code,
        numberOfMaintance: {
          number: actualNumberOfMaintanceSelected?.number
        }
      }
      try {
        await _conversation.saveConversation(conversation)
          .then((res) => {
            if (res.status === 201) {
              showSuccess("Número registrado exitosamente. Inicie la conversación")
              updateData(actualNumberOfMaintanceSelected?.number)
              setDialogNewNumber()
            }
          })
      } catch (error : any) {
        if (error.status === 409) {
          showError("El número ya se encuentra registrado en el listado de conversaciones. " +
            "Puede ser por otro agente. Considere la transferencia")
        } else {
          showError("Ocurrió un error al crear la conversación. Por favor intente nuevamente")
        }
      }
    }
  }

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
        <div className="flex align-items-center">
            <i>
                    +{option.phone_code}
            </i>
            <Divider layout="vertical" />
            <div>{option.country_name}</div>
        </div>
    )
  }

  return (
    <Dialog header="Agregar Nueva Conversacion" visible={dialogNewNumber} onHide={() => setDialogNewNumber() }>
        <Message severity="info" text="Seleccione el código de país y el número para iniciar la conversación" />
        {/* Formulario para agregar nueva conversación */}
        <div className="card flex flex-wrap gap-3 p-fluid mt-4 align-items-center justify-content-center ">
            {/* Código de país */}
            <div>
                <label className="font-bold block mb-2">Código de país</label>
                <Dropdown
                    showClear
                    value={selectedCodeCountrie}
                    onChange={(e) => setSelectedCountry(e.value)}
                    options={codeCountries}
                    optionLabel="country_name"
                    placeholder="Seleccione un código de país"
                    filter
                    virtualScrollerOptions={{ itemSize: 60 }}
                    itemTemplate={countryOptionTemplate}
                    valueTemplate={selectedCountryTemplate}
                    className="w-full md:w-18rem"
                />
            </div>
            <div>
                <label className="font-bold block mb-2">Número de teléfono</label>
                <InputText
                    placeholder="Ingrese su número de teléfono"
                    type="tel"
                    pattern="[0-9]{10}"
                    className="w-full"
                    required
                    value={numberPhone}
                    onChange={(e) => setNumberPhone(e.target.value)} />
            </div>
        </div>
        <Button label="Registrar" onClick={() => registerNumber()} />
    </Dialog>
  )
}

export default NewNumber
