import { useToast } from "@/shared/context/toast/toastContext"
import { useFetch } from "@/shared/hooks/useFetch"
import { useSWRFetch } from "@/shared/customHooks/useSWRFetch"
import { CodeCountries, Conversation } from "@/shared/models/conversation/conversation.model"
import {
  ConversationService as _conversation,
  TemplateService as _template
} from "@/shared/services"
import { Button } from "primereact/button"
import { Dialog } from "primereact/dialog"
import { Divider } from "primereact/divider"
import { Dropdown } from "primereact/dropdown"
import { InputText } from "primereact/inputtext"
import { Message } from "primereact/message"
import { Card } from "primereact/card"
import { Chip } from "primereact/chip"
import { Steps } from "primereact/steps"
import React, { useState, useEffect } from "react"
import { useChatStore } from "../store/chat-store"
import { sendTemplateMessage } from "../service/chatServices"
import { TemplateModel } from "@/shared/models/template/template.model"
import { NumbersOfMaintanceCaratule } from "@/shared/models"
import { Controller, useForm } from "react-hook-form"
type propsNewNumber = {
    updateData : (param? : string) => void
}

interface StepComponentProps {
  onNext: () => Promise<boolean> | void;
  onPrevious: () => void;
  updateData: (key: string, value: any) => void;
  wizardData: WizardData;
}

interface WizardData {
  originNumber: NumbersOfMaintanceCaratule | null;
  selectedCodeCountrie: CodeCountries | null;
  numberPhone: string;
  selectedTemplate: TemplateModel | null;
}

/**
 * Componente Wizard para iniciar nuevas conversaciones con plantillas
 */
const NewNumber = ({ updateData } : propsNewNumber) => {
  const {
    dialogNewNumber,
    setDialogNewNumber,
    user,
    setActualNumberOfMaintanceSelected,
    actualNumberOfMaintanceSelected,
    conversations: listConversations
  } = useChatStore()

  const { showSuccess, showError } = useToast()

  // Estado para el paso actual del wizard
  const [activeStep, setActiveStep] = useState(0)
  
  // Datos del wizard centralizados
  const [wizardData, setWizardData] = useState<WizardData>({
    originNumber: actualNumberOfMaintanceSelected,
    selectedCodeCountrie: null,
    numberPhone: "",
    selectedTemplate: null
  })
  
  // Inicializar useForm para manejar el dropdown igual que en la interfaz principal
  const formMethods = useForm<{ actualNOM: NumbersOfMaintanceCaratule | null }>({
    defaultValues: { actualNOM: actualNumberOfMaintanceSelected }
  });
  
  // Actualizar el número de origen cuando cambie en el selector
  const selectedNumber = formMethods.watch("actualNOM");
  
  useEffect(() => {
    if (selectedNumber) {
      setWizardData(prev => ({
        ...prev,
        originNumber: selectedNumber
      }))
      
      // También actualizamos el store para mantener consistencia
      setActualNumberOfMaintanceSelected(selectedNumber)
    }
  }, [selectedNumber, setActualNumberOfMaintanceSelected])

  /**
   * Registra la conversación y envía la plantilla seleccionada
   */
  async function registerConversationAndSendTemplate() {
    const { originNumber, selectedCodeCountrie, numberPhone, selectedTemplate } = wizardData;
    
    // Validar campos obligatorios
    if (!originNumber || !selectedCodeCountrie || !numberPhone || !selectedTemplate) {
      showError("Todos los campos son obligatorios")
      return false;
    }
    
    // Verificar si ya existe la conversación
    if (listConversations.some((c) => 
      c.destination_number === numberPhone && 
      c.indicative === selectedCodeCountrie.phone_code)) {
      showError("El número ya se encuentra registrado en el listado de conversaciones")
      return false;
    }

    // Crear objeto de conversación
    const conversation: Conversation = {
      destination_number: numberPhone,
      user,
      phone: `${selectedCodeCountrie.phone_code}${numberPhone}`,
      indicative: selectedCodeCountrie.phone_code,
      numberOfMaintance: {
        number: originNumber.number
      }
    }
    
    try {
      // Paso 1: Registrar la conversación
      const response = await _conversation.saveConversation(conversation);
      
      if (response.status === 201) {
        const newConversation = response.data;
        
        // Paso 2: Enviar la plantilla
        const recipientPhone = `+${selectedCodeCountrie.phone_code}${numberPhone}`;
        const accessToken = `${originNumber.IdAccountWB}`;
        const senderId = `${originNumber.idNumberPhone}`;
        
        try {
          // Enviar plantilla usando el servicio existente
          await sendTemplateMessage(
            recipientPhone,
            accessToken,
            senderId,
            selectedTemplate.name
          );
          
          // Solo actualizamos los datos, no reseteamos automáticamente
          // ya que ahora mostramos opciones al usuario para continuar o cerrar
          updateData(originNumber.number);
          return true;
        } catch (templateError) {
          console.error("Error al enviar plantilla:", templateError);
          showError("Se creó la conversación pero hubo un error al enviar la plantilla");
          updateData(originNumber.number);
          return false;
        }
      }
      return false;
    } catch (error: any) {
      if (error.status === 409) {
        showError("El número ya se encuentra registrado. Puede ser por otro agente. Considere la transferencia")
      } else {
        showError("Ocurrió un error al crear la conversación. Por favor intente nuevamente")
      }
      return false;
    }
  }

  /**
   * Pasos del wizard
   */
  const steps = [
    { label: 'Datos de contacto' },
    { label: 'Seleccionar plantilla' },
    { label: 'Confirmar' }
  ];

  /**
   * Controla la navegación entre pasos del wizard
   */
  const handleNext = () => {
    setActiveStep(prevStep => Math.min(prevStep + 1, steps.length - 1));
  };

  const handlePrevious = () => {
    setActiveStep(prevStep => Math.max(prevStep - 1, 0));
  };

  /**
   * Actualiza los datos del formulario en el estado centralizado
   */
  const updateWizardData = (key: string, value: any) => {
    setWizardData(prevData => ({
      ...prevData,
      [key]: value
    }));
  };

  /**
   * Renderiza el componente correspondiente al paso actual
   */
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <ContactInfoStep
            onNext={handleNext}
            onPrevious={handlePrevious}
            updateData={updateWizardData}
            wizardData={wizardData}
          />
        );
      case 1:
        return (
          <TemplateSelectionStep
            onNext={handleNext}
            onPrevious={handlePrevious}
            updateData={updateWizardData}
            wizardData={wizardData}
          />
        );
      case 2:
        return (
          <ConfirmationStep
            onNext={registerConversationAndSendTemplate}
            onPrevious={handlePrevious}
            updateData={updateWizardData}
            wizardData={wizardData}
            onSuccess={() => {
              // Reset wizard data and return to first step
              setWizardData({
                originNumber: actualNumberOfMaintanceSelected,
                selectedCodeCountrie: null,
                numberPhone: "",
                selectedTemplate: null
              });
              setActiveStep(0);
            }}
            onClose={() => setDialogNewNumber()}
          />
        );
      default:
        return null;
    }
  };

  /**
   * Templates para los dropdowns de país
   */
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

  /**
   * Renderizado del componente principal
   */
  return (
    <Dialog 
      header="Nueva conversación" 
      visible={dialogNewNumber} 
      onHide={() => setDialogNewNumber()}
      style={{ width: '550px' }}
      modal
      closeOnEscape
      dismissableMask
    >
      <div className="wizard-container">
        {/* Indicador de pasos */}
        <Steps 
          model={steps} 
          activeIndex={activeStep} 
          onSelect={(e) => setActiveStep(e.index)}
          readOnly={false} 
          className="mb-5"
        />

        {/* Contenido dinámico según el paso actual */}
        <div className="step-content p-2">
          {renderStepContent()}
        </div>
      </div>
    </Dialog>
  )
}

/**
 * Paso 1: Selección de datos de contacto
 */
const ContactInfoStep: React.FC<StepComponentProps> = ({ onNext, updateData, wizardData }) => {
  // Obtenemos los datos necesarios del store
  const { user } = useChatStore();
  
  // Obtener códigos de países
  const { responseData: codeCountries } = useFetch(_conversation.getCodeCountries)
  
  // Obtener números de origen disponibles para el usuario
  const { data: numbersOfMaintance } = useSWRFetch<NumbersOfMaintanceCaratule[]>(
    user && user.userId ? `/users/numbers/${user.userId}` : ""
  )
  
  // Setup para el form controller del dropdown
  const { control, watch } = useForm<{ actualNOM: NumbersOfMaintanceCaratule | null }>({
    defaultValues: { actualNOM: wizardData.originNumber }
  })
  
  // Observar cambios en la selección
  const selectedOriginNumber = watch("actualNOM")
  
  // Actualizar el wizardData cuando cambie la selección
  useEffect(() => {
    if (selectedOriginNumber) {
      updateData("originNumber", selectedOriginNumber)
    }
  }, [selectedOriginNumber, updateData])
  
  // Estado local para validación
  const [isFormValid, setIsFormValid] = useState(false)
  
  // Validar formulario al cambiar los datos
  useEffect(() => {
    const { originNumber, selectedCodeCountrie, numberPhone } = wizardData;
    setIsFormValid(!!originNumber && !!selectedCodeCountrie && numberPhone.length > 8);
  }, [wizardData.originNumber, wizardData.selectedCodeCountrie, wizardData.numberPhone]);
  
  // Templates para el dropdown
  const selectedCountryTemplate = (option: any, props: any) => {
    if (option) {
      return (
        <div className="flex align-items-center gap-3">
          <div>+{option.phone_code}</div>
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
        <i>+{option.phone_code}</i>
        <Divider layout="vertical" />
        <div>{option.country_name}</div>
      </div>
    )
  }
  
  return (
    <div className="p-fluid">
      <Message severity="info" text="Ingrese los datos del contacto para iniciar una conversación" />
      
      <div className="mb-4 mt-4">
        <label className="font-bold block mb-2">Número de origen</label>
        <Controller
          control={control}
          name="actualNOM"
          render={({ field }) => (
            <Dropdown
              {...field}
              options={numbersOfMaintance}
              optionLabel="number"
              placeholder="Seleccione el número a trabajar"
              className="w-full"
              disabled={!numbersOfMaintance || numbersOfMaintance.length === 0}
            />
          )}
        />
        <small className="text-500">Seleccione el número desde el que se enviará el mensaje</small>
      </div>
      
      <div className="mb-4">
        <label className="font-bold block mb-2">Código de país</label>
        <Dropdown
          showClear
          value={wizardData.selectedCodeCountrie}
          onChange={(e) => updateData('selectedCodeCountrie', e.value)}
          options={codeCountries}
          optionLabel="country_name"
          placeholder="Seleccione un código de país"
          filter
          virtualScrollerOptions={{ itemSize: 60 }}
          itemTemplate={countryOptionTemplate}
          valueTemplate={selectedCountryTemplate}
          className="w-full"
        />
      </div>
      
      <div className="mb-4">
        <label className="font-bold block mb-2">Número de teléfono</label>
        <div className="p-inputgroup">
          <span className="p-inputgroup-addon">
            {wizardData.selectedCodeCountrie ? `+${wizardData.selectedCodeCountrie.phone_code}` : '+'}
          </span>
          <InputText
            placeholder="Ingrese el número de teléfono"
            type="tel"
            pattern="[0-9]{10}"
            className="w-full"
            required
            value={wizardData.numberPhone}
            onChange={(e) => updateData('numberPhone', e.target.value)}
          />
        </div>
        <small className="text-500">Número sin el código de país (ejemplo: 3001234567)</small>
      </div>
      
      <div className="flex justify-content-end mt-5">
        <Button 
          label="Siguiente" 
          icon="pi pi-arrow-right" 
          onClick={onNext} 
          disabled={!isFormValid}
          className="p-button-primary" 
        />
      </div>
    </div>
  )
}

/**
 * Paso 2: Selección de plantilla
 * Utiliza el mismo componente que el botón "Plantilla" del chatbox
 */
const TemplateSelectionStep: React.FC<StepComponentProps> = ({ onNext, onPrevious, updateData, wizardData }) => {
  // Obtener plantillas disponibles (igual que en chatbox)
  const { responseData: dataTemplates, isLoading } = useFetch(_template.getAll)
  
  // Estado temporal para el template seleccionado en el dropdown
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateModel | null>(wizardData.selectedTemplate)
  
  // Actualizar el wizardData cuando se seleccione una plantilla
  useEffect(() => {
    if (selectedTemplate) {
      updateData('selectedTemplate', selectedTemplate)
    }
  }, [selectedTemplate, updateData])
  
  // Actualizar selectedTemplate cuando cambie en wizardData
  useEffect(() => {
    setSelectedTemplate(wizardData.selectedTemplate)
  }, [wizardData.selectedTemplate])
  
  return (
    <div className="p-fluid">
      <Message severity="info" text="Seleccione una plantilla para iniciar la conversación" />
      
      <div className="template-selection mt-4 mb-4">
        {/* Replicamos exactamente el mismo componente del chatbox */}
        <div className="flex flex-column gap-3">
          <label className="font-bold">Plantilla de WhatsApp</label>
          
          <div className="flex flex-row align-items-center">
            <Dropdown
              id={"dataTemplate"}
              value={selectedTemplate}
              optionLabel="name"
              filter
              filterBy="name"
              options={dataTemplates}
              placeholder={"Seleccione su Plantilla"}
              onChange={(e) => {
                setSelectedTemplate(e.value)
              }}
              className="flex-1"
              disabled={isLoading}
            />
          </div>
          
          {selectedTemplate && (
            <div className="template-details p-3 surface-100 border-round">
              <h4 className="mt-0 mb-2">Detalles de la plantilla</h4>
              <div className="flex align-items-center mb-2">
                <span className="font-bold mr-2">Nombre:</span>
                <span>{selectedTemplate.name}</span>
              </div>
              
              {selectedTemplate.categoryTemplateWhatsapp && (
                <div className="flex align-items-center mb-2">
                  <span className="font-bold mr-2">Categoría:</span>
                  <span>{selectedTemplate.categoryTemplateWhatsapp}</span>
                </div>
              )}
              
              <div className="flex align-items-center">
                <span className="font-bold mr-2">Estado:</span>
                <span className={selectedTemplate.statusTemplateWhatsapp === 'APPROVED' ? 'text-green-500' : 'text-yellow-500'}>
                  {selectedTemplate.statusTemplateWhatsapp === 'APPROVED' ? 'Aprobada' : 'Pendiente'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-content-between mt-5">
        <Button 
          label="Atrás" 
          icon="pi pi-arrow-left" 
          onClick={onPrevious} 
          className="p-button-secondary" 
        />
        <Button 
          label="Siguiente" 
          icon="pi pi-arrow-right" 
          onClick={onNext} 
          disabled={!selectedTemplate}
          className="p-button-primary" 
        />
      </div>
    </div>
  )
}

/**
 * Paso 3: Confirmación
 */
const ConfirmationStep: React.FC<StepComponentProps & { onSuccess?: () => void, onClose?: () => void }> = ({ onNext, onPrevious, wizardData, onSuccess, onClose }) => {
  const [showSuccessOptions, setShowSuccessOptions] = useState(false);
  
  // Función para manejar el proceso de confirmación
  const handleConfirmation = async () => {
    const success = await onNext();
    if (success) {
      setShowSuccessOptions(true);
    }
  };
  return (
    <div className="p-fluid">
      <Message severity="info" text="Verifique la información antes de iniciar la conversación" />
      
      <div className="confirmation-summary mt-4">
        <Card>
          <h3 className="mt-0 mb-3">Resumen de la conversación</h3>
          
          <div className="field mb-3">
            <h4 className="mt-0 mb-2">Datos del contacto</h4>
            <div className="flex align-items-center mb-2">
              <i className="pi pi-phone mr-2"></i>
              <span className="font-bold">Número de origen:</span>
              <span className="ml-2">{wizardData.originNumber?.number || 'No seleccionado'}</span>
            </div>
            
            <div className="flex align-items-center mb-2">
              <i className="pi pi-user mr-2"></i>
              <span className="font-bold">Número de destino:</span>
              <span className="ml-2">
                +{wizardData.selectedCodeCountrie?.phone_code} {wizardData.numberPhone}
              </span>
            </div>
          </div>
          
          <div className="field mb-3">
            <h4 className="mt-0 mb-2">Plantilla seleccionada</h4>
            <div className="flex align-items-center mb-2">
              <i className="pi pi-file mr-2"></i>
              <span className="font-bold">Nombre:</span>
              <span className="ml-2">{wizardData.selectedTemplate?.name}</span>
            </div>
            
            <div className="flex align-items-center mb-2">
              <i className="pi pi-tag mr-2"></i>
              <span className="font-bold">Categoría:</span>
              <span className="ml-2">
                {wizardData.selectedTemplate?.categoryTemplateWhatsapp || 'Sin categoría'}
              </span>
            </div>
            
            <div className="flex align-items-center mb-2">
              <i className="pi pi-check-circle mr-2"></i>
              <span className="font-bold">Estado:</span>
              <span className="ml-2">
                {wizardData.selectedTemplate?.statusTemplateWhatsapp === 'APPROVED' ? 'Aprobada' : 'Pendiente'}
              </span>
            </div>
          </div>
        </Card>
      </div>
      
      {!showSuccessOptions ? (
        <div className="flex justify-content-between mt-5">
          <Button 
            label="Atrás" 
            icon="pi pi-arrow-left" 
            onClick={onPrevious} 
            className="p-button-secondary" 
          />
          <Button 
            label="Iniciar conversación" 
            icon="pi pi-send" 
            onClick={handleConfirmation} 
            className="p-button-success" 
          />
        </div>
      ) : (
        <div className="mt-5">
          <Message severity="success" text="Conversación iniciada exitosamente" className="mb-3" />
          <div className="flex justify-content-center gap-3">
            <Button 
              label="Agregar otro contacto" 
              icon="pi pi-user-plus" 
              onClick={onSuccess} 
              className="p-button-primary" 
            />
            <Button 
              label="Cerrar" 
              icon="pi pi-times" 
              onClick={onClose} 
              className="p-button-secondary" 
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default NewNumber
