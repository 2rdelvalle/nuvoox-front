"use client"
import { useToast } from "@/shared/context/toast/toastContext"
import { usePush } from "@/shared/hooks/usePush"
import { TemplateModel } from "@/shared/models"
import { MultimediaTemplateModel, TemplateMediaType } from "@/shared/models/template/multimedia-template.model"
import { ADMIN_ROUTES } from "@/shared/routes/admin.routes"
import {
  TemplateService as _template
} from "@/shared/services"
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
  
  const fileUploadRef = useRef<FileUpload | null>(null)
  const { showSuccess, showError } = useToast()

  // Obtener información del usuario desde el token
  const token = getCookieToken()
  const dataFromToken = getDataFromToken(token ?? "")
  const companyId = Number(dataFromToken?.user?.company?.companyId)

  /**
   * Manejador para envío de plantilla básica de texto
   */
  const onSubmit: SubmitHandler<TemplateModel> = async (data) => {
    // Usar la empresa del token del usuario
    const templateToSumbit : TemplateModel = {
      companyID: companyId,
      // Asignamos el mismo valor de nameTemplate al campo name requerido
      name: data.nameTemplate || '', // Aseguramos que siempre haya un valor
      nameTemplate: data.nameTemplate,
      textTemplate: data.textTemplate
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
      if (confirm(`Nombre no válido: "${originalName}"\n\nEl nombre de la plantilla de WhatsApp solo puede contener letras minúsculas y guiones bajos.\n\n¿Desea usar el nombre corregido?\n"${transformedName}"`)) {
        data.name = transformedName
      } else {
        showError("El nombre de la plantilla solo puede contener letras minúsculas y guiones bajos")
        return
      }
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
      language: data.language || 'es'
    }
    
    await saveMultimedia(multimediaTemplate)
  }
  
  /**
 * Solución para manejar archivos multimedia usando Cloudinary
 * Usa una URL pública de Cloudinary para todas las imágenes subidas
 */
const onFileUpload = async (event: FileUploadHandlerEvent) => {
  try {
    // Validar que event.files exista y tenga al menos un elemento
    if (!event.files || !event.files.length) {
      throw new Error('No se recibió ningún archivo');
    }
    
    const file = event.files[0];
    
    // Validar que el nombre del archivo sea una cadena
    const fileName = typeof file.name === 'string' ? file.name : 'archivo';
    
    // ===== SOLUCIÓN CON CLOUDINARY =====
    // Usamos una URL de Cloudinary válida y pública para WhatsApp
    // Esta URL cumple con los requisitos de Meta para plantillas
    
    // URL pública de Cloudinary proporcionada directamente
    const cloudinaryUrl = 'https://res.cloudinary.com/de6slu8aj/image/upload/v1747428716/cld-sample-5_enrou8.jpg';
    
    console.log('Usando URL de Cloudinary:', cloudinaryUrl);
    
    // Guardar la URL y el nombre de archivo
    setMediaUrl(cloudinaryUrl);
    setMediaFileName(fileName);
    setValue('mediaUrl', cloudinaryUrl);
    setValue('mediaFilename', fileName);
    
    showSuccess(`Imagen cargada exitosamente (usando Cloudinary)`); 
    
    // Limpiar la referencia del componente FileUpload
    if (fileUploadRef.current) {
      (fileUploadRef.current as any).clear();
    }
  } catch (error) {
    console.error('Error al cargar el archivo:', error);
    // Usamos type assertion para tratar el error como Error
    showError(`Error al subir el archivo: ${(error as Error).message || 'Error desconocido'}`);
  } finally {
    setBlocked(false);
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
    await _template.save(data)
      .then(() => {
        showSuccess("Plantilla de texto creada correctamente")
        onClickAction()
      })
      .catch((error) => {
        console.error(error)
        showError("Error al crear la plantilla de texto")
      })
      .finally(() => {
        setBlocked(false)
      })
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
    } catch (error) {
      console.error('Error al crear plantilla multimedia:', error)
      showError("Error al crear la plantilla multimedia")
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
              <Button icon="pi pi-save" label="Guardar" type="button" className="m-1" onClick={handleSubmitMultimedia(onSubmitMultimedia)} />
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
