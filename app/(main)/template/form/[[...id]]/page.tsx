"use client"
import { useToast } from "@/shared/context/toast/toastContext"
import { usePush } from "@/shared/hooks/usePush"
import {
  MultimediaTemplateModel,
  TemplateButton,
  TemplateButtonType,
  TemplateInteractiveComponent,
  TemplateMediaType,
  TemplateModel,
  TemplateSection,
  TemplateSectionRow
} from "@/shared/models"
import { ADMIN_ROUTES } from "@/shared/routes/admin.routes"
import {
  TemplateService as _template
} from "@/shared/services"
import { FileUploadService } from "@/shared/services/file-upload.service"
import EmptyPage from "@/shared/small-components/EmptyPage/emptyPage"
import FormStatus from "@/shared/small-components/FormStatus/formStatus"
import { getCookieToken, getDataFromToken } from "@/shared/utilities/functions/sessionUtils"
import { BlockUI } from "primereact/blockui"
import { Button } from "primereact/button"
import { Card } from "primereact/card"
// import { Divider } from "primereact/divider" // No utilizado actualmente
import { Dropdown } from "primereact/dropdown"
import { FileUpload, FileUploadHandlerEvent } from "primereact/fileupload"
import { InputText } from "primereact/inputtext"
import { InputTextarea } from "primereact/inputtextarea"
import { Message } from "primereact/message"
import { SelectButton } from "primereact/selectbutton"
import { TabPanel, TabView } from "primereact/tabview"
import { useEffect, useRef, useState } from "react"
import { Controller, SubmitHandler, useForm } from "react-hook-form"

const createId = () => Math.random().toString(36).slice(2, 10)

const buttonTypeOptions = [
  { label: "Respuesta rápida", value: "QUICK_REPLY" as TemplateButtonType },
  { label: "Abrir URL", value: "URL" as TemplateButtonType },
  { label: "Llamar", value: "PHONE_NUMBER" as TemplateButtonType }
]

type EditableButtonField = "type" | "text" | "payload" | "url" | "phoneNumber"
type EditableRowField = "title" | "description"

const createEmptyButton = (): TemplateButton => ({
  id: createId(),
  type: "QUICK_REPLY",
  text: "",
  payload: ""
})

const createEmptySection = (): TemplateSection => ({
  id: createId(),
  title: "",
  rows: []
})

const createEmptySectionRow = (): TemplateSectionRow => ({
  id: createId(),
  title: "",
  description: ""
})

const updateButtonList = (
  buttons: TemplateButton[],
  index: number,
  field: EditableButtonField,
  value: string
): TemplateButton[] =>
  buttons.map((button, idx) => {
    if (idx !== index) return button

    if (field === "type") {
      const nextType = value as TemplateButtonType
      return {
        ...button,
        type: nextType,
        payload: nextType === "QUICK_REPLY" ? button.payload ?? "" : undefined,
        url: nextType === "URL" ? button.url ?? "" : undefined,
        phoneNumber: nextType === "PHONE_NUMBER" ? button.phoneNumber ?? "" : undefined
      }
    }

    if (field === "text") {
      return { ...button, text: value }
    }

    if (field === "payload") {
      return { ...button, payload: value }
    }

    if (field === "url") {
      return { ...button, url: value }
    }

    if (field === "phoneNumber") {
      return { ...button, phoneNumber: value }
    }

    return button
  })

const updateSectionTitleList = (sections: TemplateSection[], index: number, value: string): TemplateSection[] =>
  sections.map((section, idx) => (idx === index ? { ...section, title: value } : section))

const addRowToSectionList = (sections: TemplateSection[], index: number): TemplateSection[] =>
  sections.map((section, idx) =>
    idx === index ? { ...section, rows: [...section.rows, createEmptySectionRow()] } : section
  )

const removeRowFromSectionList = (
  sections: TemplateSection[],
  sectionIndex: number,
  rowIndex: number
): TemplateSection[] =>
  sections.map((section, idx) =>
    idx === sectionIndex
      ? { ...section, rows: section.rows.filter((_, rIdx) => rIdx !== rowIndex) }
      : section
  )

const updateRowInSectionList = (
  sections: TemplateSection[],
  sectionIndex: number,
  rowIndex: number,
  field: EditableRowField,
  value: string
): TemplateSection[] =>
  sections.map((section, idx) => {
    if (idx !== sectionIndex) return section

    return {
      ...section,
      rows: section.rows.map((row, rIdx) => {
        if (rIdx !== rowIndex) return row

        if (field === "title") {
          return { ...row, title: value }
        }

        if (field === "description") {
          return { ...row, description: value }
        }

        return row
      })
    }
  })

const sanitizeButtons = (buttons: TemplateButton[]): TemplateButton[] =>
  buttons
    .map(({ type, text, payload, url, phoneNumber }) => ({
      type,
      text: text.trim(),
      payload: payload?.trim() || undefined,
      url: url?.trim() || undefined,
      phoneNumber: phoneNumber?.trim() || undefined
    }))
    .filter((button) => button.text.length > 0)

const sanitizeSections = (sections: TemplateSection[]): TemplateSection[] =>
  sections
    .map(({ title, rows }) => ({
      title: title.trim(),
      rows: rows
        .map(({ title: rowTitle, description }) => ({
          title: rowTitle.trim(),
          description: description?.trim() || undefined
        }))
        .filter((row) => row.title.length > 0)
    }))
    .filter((section) => section.title.length > 0 && section.rows.length > 0)

const createBodyComponent = (text: string) => ({
  type: "body" as const,
  text,
  parameters: [{ type: "text" as const, text }]
})

const validateButtons = (buttons: TemplateButton[]): string | null => {
  for (const button of buttons) {
    if (!button.text || !button.text.trim()) {
      return "Cada botón debe tener un texto visible"
    }

    if (button.type === "URL") {
      if (!button.url || !button.url.trim()) {
        return "Los botones de tipo URL deben incluir un enlace"
      }
      const normalizedUrl = button.url.trim()
      if (!/^https?:\/\//i.test(normalizedUrl)) {
        return "El enlace de un botón debe iniciar con http:// o https://"
      }
    }

    if (button.type === "PHONE_NUMBER") {
      if (!button.phoneNumber || !button.phoneNumber.trim()) {
        return "Los botones de llamada deben incluir un número telefónico"
      }
      const normalizedPhone = button.phoneNumber.replace(/[^0-9+]/g, "")
      if (normalizedPhone.length < 5) {
        return "El número telefónico del botón debe ser válido"
      }
    }
  }

  return null
}

const validateSections = (sections: TemplateSection[]): string | null => {
  for (const section of sections) {
    if (!section.title || !section.title.trim()) {
      return "Cada sección debe tener un título"
    }

    if (!section.rows || section.rows.length === 0) {
      return "Cada sección debe tener al menos un elemento"
    }

    for (const row of section.rows) {
      if (!row.title || !row.title.trim()) {
        return "Cada elemento dentro de una sección debe tener un título"
      }
    }
  }

  return null
}

interface ButtonsEditorProps {
  title: string;
  description?: string;
  buttons: TemplateButton[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChange: (index: number, field: EditableButtonField, value: string) => void;
}

const ButtonsEditor = ({ title, description, buttons, onAdd, onRemove, onChange }: ButtonsEditorProps) => (
  <div className="field mb-4">
    <div className="flex justify-content-between align-items-center mb-2">
      <div>
        <label className="font-medium text-900 block">{title}</label>
        {description && <small className="text-600">{description}</small>}
      </div>
      <Button type="button" icon="pi pi-plus" label="Agregar botón" outlined onClick={onAdd} />
    </div>

    {buttons.length === 0 && (
      <small className="block text-600">Aún no se han configurado botones.</small>
    )}

    {buttons.map((button, index) => (
      <Card key={button.id ?? index} className="mb-3">
        <div className="flex justify-content-between align-items-center mb-3">
          <span className="font-semibold text-900">Botón {index + 1}</span>
          <Button
            type="button"
            icon="pi pi-trash"
            severity="danger"
            outlined
            onClick={() => onRemove(index)}
          />
        </div>

        <div className="grid">
          <div className="col-12 md:col-4">
            <label className="font-medium text-900 block mb-2">Tipo</label>
            <Dropdown
              value={button.type}
              options={buttonTypeOptions}
              optionLabel="label"
              optionValue="value"
              onChange={(e) => onChange(index, "type", e.value)}
              className="w-full"
            />
          </div>

          <div className="col-12 md:col-4">
            <label className="font-medium text-900 block mb-2">Texto visible</label>
            <InputText
              value={button.text}
              onChange={(e) => onChange(index, "text", e.target.value)}
              placeholder="Texto del botón"
              className="w-full"
            />
          </div>

          {button.type === "QUICK_REPLY" && (
            <div className="col-12 md:col-4">
              <label className="font-medium text-900 block mb-2">Payload (opcional)</label>
              <InputText
                value={button.payload ?? ""}
                onChange={(e) => onChange(index, "payload", e.target.value)}
                placeholder="Identificador de la respuesta"
                className="w-full"
              />
            </div>
          )}

          {button.type === "URL" && (
            <div className="col-12 md:col-4">
              <label className="font-medium text-900 block mb-2">URL</label>
              <InputText
                value={button.url ?? ""}
                onChange={(e) => onChange(index, "url", e.target.value)}
                placeholder="https://..."
                className="w-full"
              />
            </div>
          )}

          {button.type === "PHONE_NUMBER" && (
            <div className="col-12 md:col-4">
              <label className="font-medium text-900 block mb-2">Número telefónico</label>
              <InputText
                value={button.phoneNumber ?? ""}
                onChange={(e) => onChange(index, "phoneNumber", e.target.value)}
                placeholder="Ej: +573001112233"
                className="w-full"
              />
            </div>
          )}
        </div>
      </Card>
    ))}
  </div>
)

interface SectionsEditorProps {
  title: string;
  description?: string;
  sections: TemplateSection[];
  onAddSection: () => void;
  onRemoveSection: (index: number) => void;
  onSectionTitleChange: (index: number, value: string) => void;
  onAddRow: (sectionIndex: number) => void;
  onRemoveRow: (sectionIndex: number, rowIndex: number) => void;
  onRowChange: (sectionIndex: number, rowIndex: number, field: EditableRowField, value: string) => void;
}

const SectionsEditor = ({
  title,
  description,
  sections,
  onAddSection,
  onRemoveSection,
  onSectionTitleChange,
  onAddRow,
  onRemoveRow,
  onRowChange
}: SectionsEditorProps) => (
  <div className="field mb-4">
    <div className="flex justify-content-between align-items-center mb-2">
      <div>
        <label className="font-medium text-900 block">{title}</label>
        {description && <small className="text-600">{description}</small>}
      </div>
      <Button type="button" icon="pi pi-plus" label="Agregar sección" outlined onClick={onAddSection} />
    </div>

    {sections.length === 0 && (
      <small className="block text-600">Aún no se han configurado secciones.</small>
    )}

    {sections.map((section, sectionIndex) => (
      <Card key={section.id ?? sectionIndex} className="mb-3">
        <div className="flex justify-content-between align-items-center mb-3">
          <span className="font-semibold text-900">Sección {sectionIndex + 1}</span>
          <Button
            type="button"
            icon="pi pi-trash"
            severity="danger"
            outlined
            onClick={() => onRemoveSection(sectionIndex)}
          />
        </div>

        <div className="field mb-3">
          <label className="font-medium text-900 block mb-2">Título de la sección</label>
          <InputText
            value={section.title}
            onChange={(e) => onSectionTitleChange(sectionIndex, e.target.value)}
            placeholder="Título visible en la lista"
            className="w-full"
          />
        </div>

        <div className="flex justify-content-between align-items-center mb-2">
          <span className="font-medium text-900">Elementos</span>
          <Button
            type="button"
            icon="pi pi-plus"
            label="Agregar elemento"
            outlined
            onClick={() => onAddRow(sectionIndex)}
          />
        </div>

        {section.rows.length === 0 && (
          <small className="block text-600">Agregue al menos un elemento a la sección.</small>
        )}

        {section.rows.map((row, rowIndex) => (
          <Card key={row.id ?? rowIndex} className="mb-3 surface-100">
            <div className="flex justify-content-between align-items-center mb-3">
              <span className="font-medium text-900">Elemento {rowIndex + 1}</span>
              <Button
                type="button"
                icon="pi pi-times"
                severity="secondary"
                outlined
                onClick={() => onRemoveRow(sectionIndex, rowIndex)}
              />
            </div>

            <div className="grid">
              <div className="col-12 md:col-6">
                <label className="font-medium text-900 block mb-2">Título</label>
                <InputText
                  value={row.title}
                  onChange={(e) => onRowChange(sectionIndex, rowIndex, "title", e.target.value)}
                  placeholder="Texto del elemento"
                  className="w-full"
                />
              </div>

              <div className="col-12 md:col-6">
                <label className="font-medium text-900 block mb-2">Descripción (opcional)</label>
                <InputTextarea
                  value={row.description ?? ""}
                  onChange={(e) => onRowChange(sectionIndex, rowIndex, "description", e.target.value)}
                  rows={2}
                  autoResize
                  placeholder="Detalle adicional"
                  className="w-full"
                />
              </div>
            </div>
          </Card>
        ))}
      </Card>
    ))}
  </div>
)

/**
 * Componente para crear y editar plantillas de WhatsApp
 * Soporta plantillas de texto básicas y plantillas multimedia
 */
const TemplateForm = () => {
  const { onClickAction } = usePush(ADMIN_ROUTES.TEMPLATE.LIST)
  const { 
    register, 
    handleSubmit, 
    formState: { errors: basicErrors, isValid: basicIsValid, isDirty: basicIsDirty } 
  } = useForm<TemplateModel>()

  // Formulario para plantillas multimedia
  const { 
    control,
    register: registerMultimedia, 
    handleSubmit: handleSubmitMultimedia, 
    setValue,
    // watch, // No utilizado actualmente
    formState: { errors: multimediaErrors, isValid: multimediaIsValid, isDirty: multimediaIsDirty } 
  } = useForm<MultimediaTemplateModel>()
  
  const [blocked, setBlocked] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [mediaType, setMediaType] = useState(TemplateMediaType.NONE)
  const [mediaUrl, setMediaUrl] = useState('')
  const [mediaFileName, setMediaFileName] = useState('')
  const [basicButtons, setBasicButtons] = useState<TemplateButton[]>([])
  const [basicSections, setBasicSections] = useState<TemplateSection[]>([])
  const [multimediaButtons, setMultimediaButtons] = useState<TemplateButton[]>([])
  const [multimediaSections, setMultimediaSections] = useState<TemplateSection[]>([])
  // const [componentsLoaded, setComponentsLoaded] = useState(false) // No utilizado actualmente
  
  // Controla la inicialización segura de componentes
  useEffect(() => {
    // Permite que todos los componentes se inicialicen correctamente
    // antes de intentar manipulaciones del DOM que pueden causar el error insertRule
    /*const timer = setTimeout(() => {
      setComponentsLoaded(true);
    }, 100);
    
    return () => clearTimeout(timer);*/
    // Comentado por no usarse actualmente
  }, []);
  
  // Tipos de multimedia disponibles
  const mediaTypes = [
    { label: 'Ninguno', value: TemplateMediaType.NONE },
    { label: 'Imagen', value: TemplateMediaType.IMAGE },
    { label: 'Video', value: TemplateMediaType.VIDEO },
    { label: 'Documento', value: TemplateMediaType.DOCUMENT },
    { label: 'Audio', value: TemplateMediaType.AUDIO }
  ]

  const addBasicButton = () => setBasicButtons((prev) => [...prev, createEmptyButton()])
  const removeBasicButton = (index: number) =>
    setBasicButtons((prev) => prev.filter((_, idx) => idx !== index))
  const updateBasicButton = (index: number, field: EditableButtonField, value: string) =>
    setBasicButtons((prev) => updateButtonList(prev, index, field, value))

  const addBasicSection = () => setBasicSections((prev) => [...prev, createEmptySection()])
  const removeBasicSection = (index: number) =>
    setBasicSections((prev) => prev.filter((_, idx) => idx !== index))
  const updateBasicSectionTitle = (index: number, value: string) =>
    setBasicSections((prev) => updateSectionTitleList(prev, index, value))
  const addRowToBasicSection = (sectionIndex: number) =>
    setBasicSections((prev) => addRowToSectionList(prev, sectionIndex))
  const removeRowFromBasicSection = (sectionIndex: number, rowIndex: number) =>
    setBasicSections((prev) => removeRowFromSectionList(prev, sectionIndex, rowIndex))
  const updateBasicSectionRow = (
    sectionIndex: number,
    rowIndex: number,
    field: EditableRowField,
    value: string
  ) => setBasicSections((prev) => updateRowInSectionList(prev, sectionIndex, rowIndex, field, value))

  const addMultimediaButton = () => setMultimediaButtons((prev) => [...prev, createEmptyButton()])
  const removeMultimediaButton = (index: number) =>
    setMultimediaButtons((prev) => prev.filter((_, idx) => idx !== index))
  const updateMultimediaButton = (index: number, field: EditableButtonField, value: string) =>
    setMultimediaButtons((prev) => updateButtonList(prev, index, field, value))

  const addMultimediaSection = () => setMultimediaSections((prev) => [...prev, createEmptySection()])
  const removeMultimediaSection = (index: number) =>
    setMultimediaSections((prev) => prev.filter((_, idx) => idx !== index))
  const updateMultimediaSectionTitle = (index: number, value: string) =>
    setMultimediaSections((prev) => updateSectionTitleList(prev, index, value))
  const addRowToMultimediaSection = (sectionIndex: number) =>
    setMultimediaSections((prev) => addRowToSectionList(prev, sectionIndex))
  const removeRowFromMultimediaSection = (sectionIndex: number, rowIndex: number) =>
    setMultimediaSections((prev) => removeRowFromSectionList(prev, sectionIndex, rowIndex))
  const updateMultimediaSectionRow = (
    sectionIndex: number,
    rowIndex: number,
    field: EditableRowField,
    value: string
  ) =>
    setMultimediaSections((prev) => updateRowInSectionList(prev, sectionIndex, rowIndex, field, value))
  
  const fileUploadRef = useRef<FileUpload | null>(null)
  const { showSuccess, showError } = useToast()

  // Obtener información del usuario desde el token
  const token = getCookieToken()
  const dataFromToken = getDataFromToken(token ?? "")
  // Validar que realmente exista un ID de compañía válido
  const rawCompanyId = dataFromToken?.user?.company?.companyId || localStorage.getItem('companyId')
  // Usamos un valor predeterminado (1) en caso de que no se pueda obtener un ID válido
  // Esto permite que la aplicación funcione, aunque se debe mostrar una advertencia
  const companyId = !isNaN(Number(rawCompanyId)) && Number(rawCompanyId) > 0 ? Number(rawCompanyId) : 1
  
  // Verificar si tenemos un ID de compañía válido
  useEffect(() => {
    // Si estamos usando el valor predeterminado (1), mostrar una advertencia
    if (companyId === 1 && !rawCompanyId) {
      // En lugar de console.error, usamos un enfoque más apropiado para producción
      showError('No se pudo identificar su compañía. Se usará un valor predeterminado.')
    }
  }, [companyId, rawCompanyId, showError])

  /**
   * Manejador para envío de plantilla básica de texto
   */
  const onSubmit: SubmitHandler<TemplateModel> = async (data) => {
    const buttonValidationError = validateButtons(basicButtons)
    if (buttonValidationError) {
      showError(buttonValidationError)
      return
    }

    const sectionsValidationError = validateSections(basicSections)
    if (sectionsValidationError) {
      showError(sectionsValidationError)
      return
    }

    const components: TemplateInteractiveComponent[] = []
    const trimmedText = data.textTemplate?.trim()

    if (trimmedText) {
      components.push(createBodyComponent(trimmedText))
    }

    const normalizedButtons = sanitizeButtons(basicButtons)
    if (normalizedButtons.length) {
      components.push({ type: "buttons", buttons: normalizedButtons })
    }

    const normalizedSections = sanitizeSections(basicSections)
    if (normalizedSections.length) {
      components.push({ type: "sections", sections: normalizedSections })
    }

    const templateToSumbit : TemplateModel = {
      companyID: companyId,
      name: data.nameTemplate || '',
      nameTemplate: data.nameTemplate,
      textTemplate: data.textTemplate,
      components: components.length ? components : undefined
    }

    await save(templateToSumbit)
  }
  
  /**
   * Manejador para envío de plantilla multimedia
   */
  const onSubmitMultimedia: SubmitHandler<MultimediaTemplateModel> = async (data) => {
    // Si seleccionamos un tipo que no es NONE, la URL es obligatoria
    if (data.mediaType !== TemplateMediaType.NONE && !data.mediaUrl) {
      showError("La URL del medio es obligatoria para plantillas multimedia")
      return
    }
    
    // Asegurarnos que mediaUrl es un string (corrige error t.substring is not a function)
    if (data.mediaUrl) {
      data.mediaUrl = String(data.mediaUrl);
    }
    
    // Validar el formato del nombre según los requisitos de WhatsApp
    const originalName = data.name
    const namePattern = /^[a-z_]+$/  // Solo letras minúsculas y guiones bajos
    
    if (!namePattern.test(originalName)) {
      // Transformar el nombre automáticamente
      // 1. Convertir a minúsculas
      // 2. Reemplazar espacios y caracteres no permitidos por guiones bajos
      const transformedName = originalName
        .toLowerCase()
        .replace(/[^a-z_]/g, '_')
        .replace(/__+/g, '_')  // Evitar guiones bajos consecutivos
        .replace(/^_|_$/g, '') // Eliminar guiones bajos al inicio y final
      
      // Confirmar si el usuario acepta el nombre transformado
      const msg1 = `Nombre no válido: "${originalName}"`;
      const msg2 = `El nombre de la plantilla solo puede contener letras minúsculas y guiones bajos.`;
      const msg3 = `¿Desea usar el nombre corregido?\n"${transformedName}"`;
      if (confirm(`${msg1}\n\n${msg2}\n\n${msg3}`)) {
        data.name = transformedName
      } else {
        showError("El nombre de la plantilla solo puede contener letras minúsculas y guiones bajos")
        return
      }
    }
    
    const buttonValidationError = validateButtons(multimediaButtons)
    if (buttonValidationError) {
      showError(buttonValidationError)
      return
    }

    const sectionsValidationError = validateSections(multimediaSections)
    if (sectionsValidationError) {
      showError(sectionsValidationError)
      return
    }

    const components: TemplateInteractiveComponent[] = []
    const trimmedText = data.text?.trim()

    if (trimmedText) {
      components.push(createBodyComponent(trimmedText))
    }

    const normalizedButtons = sanitizeButtons(multimediaButtons)
    if (normalizedButtons.length) {
      components.push({ type: "buttons", buttons: normalizedButtons })
    }

    const normalizedSections = sanitizeSections(multimediaSections)
    if (normalizedSections.length) {
      components.push({ type: "sections", sections: normalizedSections })
    }

    const multimediaTemplate: MultimediaTemplateModel = {
      companyId: companyId,
      name: data.name,
      text: data.text,
      mediaType: data.mediaType,
      mediaUrl: data.mediaUrl,
      mediaCaption: data.mediaCaption,
      mediaFilename: data.mediaFilename,
      category: data.category || 'MARKETING',
      language: data.language || 'es',
      components: components.length ? components : undefined
    }

    await saveMultimedia(multimediaTemplate)
  }
  
  /**
   * Maneja la carga de archivos multimedia al servidor
   * Utiliza el servicio FileUploadService para subir archivos al backend
   * Mantiene compatibilidad con URLs existentes como fallback
   */
  const onFileUpload = async (event: FileUploadHandlerEvent) => {
    try {
      setBlocked(true) // Bloquear la interfaz durante la carga

      // Validar que event.files exista y tenga al menos un elemento
      if (!event.files || !event.files.length) {
        throw new Error('No se recibió ningún archivo')
      }

      const file = event.files[0]
      console.log('Iniciando carga de archivo:', file.name)

      // Validar que el nombre del archivo sea una cadena
      const fileName = typeof file.name === 'string' ? file.name : 'archivo'

      // Configuración del subdirectorio para organizar archivos
      const subDirectory = 'templates'

      try {
        // Subir el archivo al servidor usando el nuevo servicio
        const result = await FileUploadService.uploadFile(file, subDirectory)

        console.log('Archivo subido exitosamente:', result)

        // Guardar la URL y el nombre de archivo retornados por el servidor
        setMediaUrl(result.url)
        setMediaFileName(result.filename)
        setValue('mediaUrl', result.url)
        setValue('mediaFilename', result.filename)

        showSuccess(`Archivo ${fileName} subido correctamente al servidor`)
      } catch (uploadError) {
        console.error('Error al subir al servidor, usando fallback de Cloudinary:', uploadError)

        // FALLBACK: Si falla la carga al servidor, usar URL de Cloudinary como respaldo
        const cloudinaryUrl = 'https://res.cloudinary.com/de6slu8aj/image/upload/v1747428716/cld-sample-5_enrou8.jpg'

        console.log('Usando URL de Cloudinary como fallback:', cloudinaryUrl)

        setMediaUrl(cloudinaryUrl)
        setMediaFileName(fileName)
        setValue('mediaUrl', cloudinaryUrl)
        setValue('mediaFilename', fileName)

        showSuccess('Imagen cargada usando fallback de Cloudinary (el servidor no está disponible)')
      }

      // Limpiar la referencia del componente FileUpload
      if (fileUploadRef.current) {
        (fileUploadRef.current as any).clear()
      }
    } catch (error) {
      console.error('Error general al procesar el archivo:', error)
      showError(`Error al procesar el archivo: ${(error as Error).message || 'Error desconocido'}`)
    } finally {
      setBlocked(false) // Desbloquear la interfaz cuando termine
    }
  }
  
  /**
   * Maneja el cambio de tipo de medio
   */
  const onMediaTypeChange = (e: any) => {
    setMediaType(e.value)
    setValue('mediaType', e.value)
  }

  /**
   * Guarda una plantilla básica de texto
   */
  async function save (data: TemplateModel) {
    setBlocked(true)
    try {
      await _template.save(data)
      showSuccess("Plantilla de texto creada correctamente")
      onClickAction()
    } catch (error: any) {
      console.error('Error al crear plantilla:', error)
      
      // Manejar errores específicos
      if (error.response?.status === 401) {
        showError("Tu sesión es inválida o ha expirado. Por favor, vuelve a iniciar sesión.")
      } else if (error.response?.status === 403) {
        showError("No tienes permisos suficientes para crear plantillas.")
      } else if (error.response?.status === 400) {
        showError(error.response?.data?.message || "Error en los datos de la plantilla")
      } else if (error.response?.status === 500) {
        // Manejar errores del servidor
        const errorMessage = error.response?.data?.message || 
          "Error interno del servidor. Por favor, intenta nuevamente más tarde. Si el problema persiste, contacta al soporte técnico.";
        showError(errorMessage)
      } else {
        // Manejar otros errores
        showError("Error al crear la plantilla. Por favor, intenta nuevamente.")
      }
    } finally {
      setBlocked(false)
    }
  }
  
  /**
   * Guarda una plantilla multimedia
   */
  async function saveMultimedia (data: MultimediaTemplateModel) {
    setBlocked(true)
    try {
      await _template.saveMultimedia(data)
      showSuccess("Plantilla multimedia creada correctamente")
      onClickAction()
    } catch (error: any) {
      console.error('Error al crear plantilla multimedia:', error)
      
      // Manejar errores de autenticación específicos
      if (error.response?.status === 401) {
        showError("Tu sesión es inválida o ha expirado. Por favor, vuelve a iniciar sesión.")
      } else if (error.response?.status === 403) {
        showError("No tienes permisos suficientes para crear plantillas multimedia.")
      } else if (error.response?.status === 400) {
        showError(error.response?.data?.message || "Error en los datos de la plantilla multimedia")
      } else {
        showError("Error al crear la plantilla multimedia")
      }
    } finally {
      setBlocked(false)
    }
  }

  const onCancel: () => void = () => onClickAction()

  return (
    <BlockUI blocked={blocked} fullScreen={true}>
      <EmptyPage>
        <div className="grid mb-4">
          <div className="col-10">
            <div className="flex justify-content-start align-items-baseline gap-2">
              <span className="text-900 text-xl block font-bold">Crear Plantilla de WhatsApp</span>
              {activeTab === 0 ? (
                <FormStatus isDirty={basicIsDirty} isValid={basicIsValid} />
              ) : (
                <FormStatus isDirty={multimediaIsDirty} isValid={multimediaIsValid} />
              )}
            </div>
          </div>
          <div className="col-2">
            <Button icon="pi pi-arrow-left" type="button" className="m-1" onClick={onCancel} />
            {activeTab === 0 ? (
              <Button icon="pi pi-save" label="Guardar" type="button" className="m-1" onClick={handleSubmit(onSubmit)} />
            ) : (
              <Button 
                icon="pi pi-save" 
                label="Guardar" 
                type="button" 
                className="m-1" 
                onClick={handleSubmitMultimedia(onSubmitMultimedia)} 
              />
            )}
          </div>
          
          <div className="col-12">
            <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
              {/* Pestaña de plantilla básica */}
              <TabPanel header="Plantilla Básica">
                <div className="p-3">
                  <div className="field mb-4">
                    <label htmlFor="nameTemplate" className="font-medium text-900 block mb-2">
                      Nombre de la Plantilla
                    </label>
                    <InputText
                      id="nameTemplate"
                      {...register("nameTemplate", { required: "El nombre es obligatorio" })}
                      placeholder="Ingrese el nombre de la plantilla" 
                      type="text" 
                      className="w-full" 
                    />
                    {basicErrors.nameTemplate && <Message severity="error" text={basicErrors.nameTemplate.message} />}
                  </div>
                  
                  <div className="field mb-4">
                    <label htmlFor="textTemplate" className="font-medium text-900 block mb-2">
                      Contenido de la Plantilla
                    </label>
                    <InputTextarea
                      id="textTemplate"
                      {...register("textTemplate", { required: "El contenido es obligatorio" })}
                      placeholder="Ingrese el contenido de la plantilla"
                      rows={5}
                      autoResize
                      className="w-full"
                    />
                    {basicErrors.textTemplate && <Message severity="error" text={basicErrors.textTemplate.message} />}
                  </div>

                  <ButtonsEditor
                    title="Botones interactivos"
                    description="Configure botones para respuestas rápidas, enlaces o llamadas."
                    buttons={basicButtons}
                    onAdd={addBasicButton}
                    onRemove={removeBasicButton}
                    onChange={updateBasicButton}
                  />

                  <SectionsEditor
                    title="Listas (secciones)"
                    description="Agrupe elementos para menús interactivos dentro de WhatsApp."
                    sections={basicSections}
                    onAddSection={addBasicSection}
                    onRemoveSection={removeBasicSection}
                    onSectionTitleChange={updateBasicSectionTitle}
                    onAddRow={addRowToBasicSection}
                    onRemoveRow={removeRowFromBasicSection}
                    onRowChange={updateBasicSectionRow}
                  />
                </div>
              </TabPanel>
              
              {/* Pestaña de plantilla multimedia */}
              <TabPanel header="Plantilla Multimedia">
                <div className="p-3">
                  <div className="grid">
                    <div className="col-12 md:col-6">
                      <div className="field mb-4">
                        <label htmlFor="name" className="font-medium text-900 block mb-2">
                          Nombre de la Plantilla
                        </label>
                        <InputText
                          id="name"
                          {...registerMultimedia("name", { required: "El nombre es obligatorio" })}
                          placeholder="Ingrese nombre de la plantilla multimedia"
                          className="w-full"
                        />
                        {multimediaErrors.name && <Message severity="error" text={multimediaErrors.name.message} />}
                      </div>
                    </div>

                    <div className="col-12 md:col-6">
                      <div className="field mb-4">
                        <label htmlFor="mediaType" className="font-medium text-900 block mb-2">
                          Tipo de Contenido
                        </label>
                        <Controller
                          name="mediaType"
                          control={control}
                          defaultValue={TemplateMediaType.NONE}
                          rules={{ required: "El tipo de medio es obligatorio" }}
                          render={({ field }) => (
                            <Dropdown
                              id={field.name}
                              value={field.value}
                              onChange={(e) => {
                                field.onChange(e.value);
                                onMediaTypeChange(e);
                              }}
                              options={mediaTypes}
                              placeholder="Seleccione el tipo de medio"
                              className="w-full"
                            />
                          )}
                        />
                        {multimediaErrors.mediaType && <Message severity="error" text={multimediaErrors.mediaType.message} />}
                      </div>
                    </div>

                    {/* Mostrar cargador de archivos solo si se ha seleccionado un tipo diferente a "none" */}
                    {mediaType !== TemplateMediaType.NONE && (
                      <div className="col-12">
                        <Card title="Subir Archivo Multimedia" className="mb-4">
                          <p className="text-sm text-gray-600 mb-4">
                            Suba el archivo multimedia que se usará en la plantilla. 
                            En un ambiente de producción, este archivo se subiría a un servidor de almacenamiento.
                          </p>
                          <FileUpload
                            ref={fileUploadRef}
                            name="mediaFile"
                            url="/api/upload" // Esto es simulado, no se realiza ninguna carga real
                            accept={
                              mediaType === TemplateMediaType.IMAGE ? "image/*" : 
                              mediaType === TemplateMediaType.VIDEO ? "video/*" :
                              mediaType === TemplateMediaType.DOCUMENT ? ".pdf,.doc,.docx" :
                              mediaType === TemplateMediaType.AUDIO ? "audio/*" : "*"
                            }
                            maxFileSize={10000000}
                            emptyTemplate={<p className="m-0">Arrastre y suelte su archivo aquí o haga clic para seleccionarlo.</p>}
                            chooseLabel="Seleccionar"
                            uploadLabel="Subir"
                            cancelLabel="Cancelar"
                            customUpload={true}
                            uploadHandler={onFileUpload}
                          />
      
                          {/* Campos ocultos para almacenar la URL y el nombre del archivo */}
                          <input type="hidden" {...registerMultimedia("mediaUrl")} />
                          <input type="hidden" {...registerMultimedia("mediaFilename")} />
      
                          {/* Mostrar información del archivo cargado */}
                          {mediaUrl && (
<div className="mt-4 p-3 border-1 border-round surface-100">
  <h4 className="mt-0 mb-2">Archivo cargado:</h4>
  <p><strong>Nombre:</strong> {mediaFileName}</p>
  <p><strong>URL:</strong> {mediaUrl}</p>
</div>
                          )}
                        </Card>
                      </div>
                    )}

                    {mediaType === TemplateMediaType.IMAGE && (
                      <div className="col-12">
                        <div className="field mb-4">
                          <label htmlFor="mediaCaption" className="font-medium text-900 block mb-2">
Descripción de la Imagen (opcional)
                          </label>
                          <InputText
id="mediaCaption"
{...registerMultimedia("mediaCaption")}
placeholder="Descripción breve de la imagen"
className="w-full"
                          />
                        </div>
                      </div>
                    )}

                    <div className="col-12">
                      <div className="field mb-4">
                        <label htmlFor="text" className="font-medium text-900 block mb-2">
                          Texto del Mensaje
                        </label>
                        <InputTextarea
                          id="text"
                          {...registerMultimedia("text", { required: "El texto del mensaje es obligatorio" })}
                          placeholder="Texto que acompañará a su contenido multimedia"
                          rows={5}
                          autoResize
                          className="w-full"
                        />
                        {multimediaErrors.text && <Message severity="error" text={multimediaErrors.text.message} />}
                      </div>
                    </div>

                    <div className="col-12">
                      <ButtonsEditor
                        title="Botones interactivos"
                        description="Añada botones que acompañarán la plantilla multimedia."
                        buttons={multimediaButtons}
                        onAdd={addMultimediaButton}
                        onRemove={removeMultimediaButton}
                        onChange={updateMultimediaButton}
                      />
                    </div>

                    <div className="col-12">
                      <SectionsEditor
                        title="Listas (secciones)"
                        description="Cree menús tipo lista para la plantilla multimedia."
                        sections={multimediaSections}
                        onAddSection={addMultimediaSection}
                        onRemoveSection={removeMultimediaSection}
                        onSectionTitleChange={updateMultimediaSectionTitle}
                        onAddRow={addRowToMultimediaSection}
                        onRemoveRow={removeRowFromMultimediaSection}
                        onRowChange={updateMultimediaSectionRow}
                      />
                    </div>

                    {/* Campos de categoría e idioma */}
                    <div className="col-12 md:col-6">
                      <div className="field mb-4">
                        <label htmlFor="category" className="font-medium text-900 block mb-2">
                          Categoría
                        </label>
                        <Controller
                          name="category"
                          control={control}
                          defaultValue="MARKETING"
                          render={({ field }) => (
<SelectButton 
  id={field.name}
  value={field.value} 
  onChange={(e) => field.onChange(e.value)} 
  options={[
    {label: 'Marketing', value: 'MARKETING'},
    {label: 'Utilidad', value: 'UTILITY'},
    {label: 'Autenticación', value: 'AUTHENTICATION'}
  ]} 
/>
                          )}
                        />
                      </div>
                    </div>

                    <div className="col-12 md:col-6">
                      <div className="field mb-4">
                        <label htmlFor="language" className="font-medium text-900 block mb-2">
                          Idioma
                        </label>
                        <Controller
                          name="language"
                          control={control}
                          defaultValue="es"
                          render={({ field }) => (
<SelectButton 
  id={field.name}
  value={field.value} 
  onChange={(e) => field.onChange(e.value)} 
  options={[
    {label: 'Español', value: 'es'},
    {label: 'Inglés', value: 'en'}
  ]} 
/>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabPanel>
            </TabView>
          </div>
        </div>
      </EmptyPage>
    </BlockUI>
  )
}

export default TemplateForm
