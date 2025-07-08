"use client"
import { useSWRFetch } from "@/shared/customHooks/useSWRFetch"
import { useFetch } from "@/shared/hooks/useFetch"
import { NumbersOfMaintanceCaratule } from "@/shared/models"
import { TemplateService as _template } from "@/shared/services"
import BalanceService from "@/shared/services/balance/balance.service"
import { useToast } from "@/shared/context/toast/toastContext"
import EmptyPage from "@/shared/small-components/EmptyPage/emptyPage"
import { getCookieToken, getDataFromToken } from "@/shared/utilities/functions/sessionUtils"
import { Column } from "primereact/column"
import { DataTable } from "primereact/datatable"
import { Dialog } from "primereact/dialog"
import { FileUpload } from "primereact/fileupload"
import { VirtualScroller } from "primereact/virtualscroller"
import React, { useEffect, useState, useRef } from "react"
import * as XLSX from "xlsx"
import { sendTemplateMessage } from "../chat/whatsapp/service/chatServices"
import { Button } from "primereact/button"
import { TabView, TabPanel } from 'primereact/tabview'
import { TemplateMediaType } from "@/shared/models/template/multimedia-template.model"

// Actualizar definición del tipo para las filas del XLSXS
type CsvRow = {
  templateName: string;
  originPhone: string;
  destinationPhone: string;
  indicativePhone: string;
  isMultimedia?: boolean;
};

// Definición del tipo para las plantillas multimedia
type MultimediaCsvRow = {
  templateName: string;
  originPhone: string;
  destinationPhone: string;
  indicativePhone: string;
  mediaType: TemplateMediaType; // Tipo de multimedia (imagen, video, documento, etc.)
  mediaUrl?: string; // URL del archivo multimedia
  mediaCaption?: string; // Texto descriptivo para el archivo multimedia
};

const MasiveChat: React.FC = () => {
  // Hook para mostrar mensajes de éxito y error
  const { showSuccess, showError } = useToast()
  
  // Estados para gestión de plantillas normales
  const [csvData, setCsvData] = useState<CsvRow[] | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [sendResults, setSendResults] = useState<{ row: CsvRow | MultimediaCsvRow; success: boolean; error?: any }[]>([])
  const [showSendModal, setShowSendModal] = useState(false)
  
  // Estados para gestión de plantillas multimedia
  const [multimediaCsvData, setMultimediaCsvData] = useState<MultimediaCsvRow[] | null>(null)
  const [showMultimediaModal, setShowMultimediaModal] = useState(false)
  const [activeTabIndex, setActiveTabIndex] = useState(0) // 0: Plantillas normales, 1: Multimedia

  const token = getCookieToken()
  const dataFromToken = getDataFromToken(token ?? "")
  // ID de la empresa obtenido del token para actualizar el saldo
  const companyId = dataFromToken?.user?.company?.companyId

  // trae los numeros de la empresa que maneja el ajente - solo si existe un ID de compañía válido
  const { data: numbersOfMaintance } = useSWRFetch<NumbersOfMaintanceCaratule[]>(
    companyId ? `/companies/getNumbersOfMaintance/${companyId}` : ''
  )
  
  console.log('Números de mantenimiento:', numbersOfMaintance?.map(n => ({
    number: n.number,
    idNumberPhone: n.idNumberPhone
  })))

  const { responseData: dataTemplates } = useFetch(_template.getAll)
  console.log('Plantillas disponibles:', dataTemplates?.map(t => ({
    name: t.name,
    categoryTemplateWhatsapp: t.categoryTemplateWhatsapp
  })))

  const fileUploadRef = useRef<any>(null) // Referencia para FileUpload de plantillas normales
  const multimediaFileUploadRef = useRef<any>(null) // Referencia para FileUpload de plantillas multimedia

  // Se fuerza re-renderizar cuando numbersOfMaintance o dataTemplates se actualizan
  useEffect(() => {
    if (csvData) {
      setCsvData([...csvData])
    }
  }, [numbersOfMaintance, dataTemplates])

  // Función auxiliar para validar cada registro
  const isRowValid = (row: CsvRow) => {
    console.log('Validando fila:', {
      templateName: row.templateName,
      originPhone: row.originPhone
    })
    
    console.log('Plantillas disponibles:', dataTemplates?.map(t => t.name))
    console.log('Plantilla buscada:', row.templateName)
    
    // Verificar si el número de origen existe
    const originMatch = numbersOfMaintance?.find((item: { number?: string | number }) => 
      item.number?.toString() === row.originPhone.toString()
    )
    console.log('Número de origen encontrado:', originMatch)
    
    // Verificar si la plantilla existe (comparación flexible)
    const templateMatch = dataTemplates?.find(template => {
      // Convertir ambos nombres a minúsculas y eliminar espacios
      const templateName = template.name?.toLowerCase().replace(/\s+/g, '')
      const searchName = row.templateName.toLowerCase().replace(/\s+/g, '')
      return templateName === searchName
    })
    console.log('Plantilla encontrada:', templateMatch)
    
    const originValid = originMatch !== undefined
    const templateValid = templateMatch !== undefined
    return originValid && templateValid
  }

  // Función para renderizar el contenido de la columna de validación
  const validationBodyTemplate = (rowData: CsvRow | MultimediaCsvRow) => {
    return <span>{isRowValid(rowData) ? "✔" : "✘"}</span>
  }
  
  // Función para validar una plantilla multimedia
  const isMultimediaRowValid = (row: MultimediaCsvRow) => {
    // Validar que el teléfono de origen exista en la empresa
    const originValid = (numbersOfMaintance || []).some((item) => Number(item.number) === Number(row.originPhone))
    
    // Validar que la plantilla exista (para multimedia es menos restrictivo porque puede ser una plantilla genérica)
    const templateValid = true // Se asume válido para multimedia
    
    // Validar que el tipo de multimedia sea válido
    const mediaTypeValid = Object.values(TemplateMediaType).includes(row.mediaType)
    
    return originValid && templateValid && mediaTypeValid
  }

  // Manejar la carga del archivo XLSX
  const handleFileUpload = React.useCallback((event: { files: File[] }) => {
    const file = event.files[0]
    if (file) {
      console.log('Iniciando carga de archivo Excel...')
      const reader = new FileReader()
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[]
        const headers = jsonData[0] as string[]
        console.log('Headers encontrados:', headers)
        
        // Verificar que todas las columnas requeridas existan
        const requiredColumns = ['NOMBRE_PLANTILLA', 'TELEFONO_ORIGEN', 'TELEFONO_DESTINO', 'INDICATIVO_TELEFONO']
        const missingColumns = requiredColumns.filter(col => headers.indexOf(col) === -1)
        if (missingColumns.length > 0) {
          console.error('Columnas faltantes:', missingColumns)
          return
        }

        const result: CsvRow[] = jsonData.slice(1).map((row: any[], index) => {
          const templateName = row[headers.indexOf("NOMBRE_PLANTILLA")]
          const originPhone = row[headers.indexOf("TELEFONO_ORIGEN")]
          const destinationPhone = row[headers.indexOf("TELEFONO_DESTINO")]
          const indicativePhone = row[headers.indexOf("INDICATIVO_TELEFONO")]
          
          console.log(`Procesando fila ${index + 1}:`, {
            templateName,
            originPhone,
            destinationPhone,
            indicativePhone
          })

          return {
            templateName,
            originPhone,
            destinationPhone,
            indicativePhone
          }
        })
        
        console.log('Datos procesados:', result)
        setCsvData(result)
        setShowModal(true)
      }
      reader.readAsArrayBuffer(file)
    }
  }, [])

  // Función para cargar y procesar archivos Excel para plantillas multimedia
  const handleMultimediaFileUpload = React.useCallback((event: { files: File[] }) => {
    const file = event.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[]
        const headers = jsonData[0] as string[]
        
        // Mapear columnas a propiedades del modelo MultimediaCsvRow
        const result: MultimediaCsvRow[] = jsonData.slice(1).map((row: any[]) => {
          return {
            templateName: row[headers.indexOf("NOMBRE_PLANTILLA")],
            originPhone: row[headers.indexOf("TELEFONO_ORIGEN")],
            destinationPhone: row[headers.indexOf("TELEFONO_DESTINO")],
            indicativePhone: row[headers.indexOf("INDICATIVO_TELEFONO")],
            mediaType: row[headers.indexOf("TIPO_MULTIMEDIA")] || TemplateMediaType.IMAGE,
            mediaUrl: row[headers.indexOf("URL_MULTIMEDIA")],
            mediaCaption: row[headers.indexOf("DESCRIPCION_MULTIMEDIA")]
          }
        })
        
        setMultimediaCsvData(result)
        setShowMultimediaModal(true)
      }
      reader.readAsArrayBuffer(file)
    }
  }, [])

  // Agregar función para reiniciar el estado del archivo excel
  const handleReset = React.useCallback(() => {
    setCsvData(null)
    setMultimediaCsvData(null)
    setSendResults([])
    setShowModal(false)
    setShowMultimediaModal(false)
    setShowSendModal(false)
    // Reiniciar los componentes FileUpload
    fileUploadRef.current?.clear()
    multimediaFileUploadRef.current?.clear()
  }, [])

  /**
   * Actualiza el saldo después de enviar plantillas
   * @param successfulSends - Arreglo de envíos exitosos
   * @param templateCosts - Objeto con costos acumulados por tipo de plantilla
   */
  const updateBalanceAfterSendingTemplates = React.useCallback(async (
    successfulSends: (CsvRow | MultimediaCsvRow)[],
    templateCosts: { utility: number; marketing: number }
  ) => {
    // Validar que tengamos un ID de empresa válido
    if (!companyId) {
      console.error('No se pudo decrementar el saldo: ID de empresa no disponible');
      return;
    }
    
    // Calcular el costo total
    const totalCost = templateCosts.utility + templateCosts.marketing;
    
    if (totalCost <= 0) {
      return;
    }
    
    try {
      // Crear descripción para la transacción
      // Creamos descripción en partes para evitar líneas largas
      const part1 = `Envío masivo: ${successfulSends.length} plantillas`;
      const part2 = `(${templateCosts.utility.toFixed(4)} UTILITY, ${templateCosts.marketing.toFixed(4)} MARKETING)`;
      const description = `${part1} ${part2}`;
      
      // Llamar al servicio para decrementar el saldo
      const updatedBalance = await BalanceService.decrementBalance(
        companyId,
        totalCost,
        'MASIVO', // Tipo especial para envíos masivos
        description
      );
      
      showSuccess(`Saldo actualizado correctamente: ${updatedBalance.balanceUSD.toFixed(2)} USD`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Saldo insuficiente')) {
        showError('No hay saldo suficiente para completar el envío masivo. Por favor recargue su saldo.');
      } else {
        console.error('Error al actualizar el saldo:', error);
        showError('Error al actualizar el saldo. Los mensajes se enviaron pero el saldo podría no estar actualizado.');
      // El mensaje anterior se ha acortado para evitar líneas demasiado largas
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, showSuccess, showError]);

  // Función para enviar plantillas aprobadas
  const handleSendTemplates = React.useCallback(async () => {
    const results: { row: CsvRow | MultimediaCsvRow; success: boolean; error?: any }[] = []
    const successfulSends: CsvRow[] = [];
    const templateCosts = { utility: 0, marketing: 0 };
    
    if (csvData && numbersOfMaintance && dataTemplates) {
      for (const row of csvData) {
        if (isRowValid(row)) {
          // Buscar el registro de numbersOfMaintance correspondiente al teléfono de origen
          const maintRecord = numbersOfMaintance.find(
            (item) => Number(item.number) === Number(row.originPhone)
          )
          if (!maintRecord) {
            results.push({
              row,
              success: false,
              error: "Registro de mantenimiento no encontrado"
            })
            continue
          }
          // Construir destinationPhone concatenando "+" con indicativo y teléfono destino
          const newDestinationPhone = `+${row.indicativePhone}${row.destinationPhone}`;

          try {
            // Validar que el ID y las iniciales de la empresa existan
            if (!companyId || !dataFromToken?.user?.company?.name) {
              throw new Error("No se pudo obtener la información de la empresa");
            }

            // Obtener las dos primeras letras del nombre de la empresa
            const companyInitials = dataFromToken.user.company.name.substring(0, 2);
            
            // Actualizar costos según categoría de la plantilla
            const template = dataTemplates.find((t: any) => t.name === row.templateName);
            if (template) {
              if (template.categoryTemplateWhatsapp === "UTILITY") {
                templateCosts.utility += 0.0002;
              } else if (template.categoryTemplateWhatsapp === "MARKETING") {
                templateCosts.marketing += 0.0125;
              }
            }

            // Enviar la plantilla
            await sendTemplateMessage(
              newDestinationPhone,
              maintRecord.IdAccountWB as any, // token de acceso desde numbersOfMaintance
              maintRecord.idNumberPhone as any, // senderId desde numbersOfMaintance
              row.templateName,
              companyId,
              companyInitials
            );

            results.push({ row, success: true });
            successfulSends.push(row);
          } catch (err) {
            results.push({ row, success: false, error: err });
          }
        }
      }
      
      // Actualizar el saldo solo si hubo envíos exitosos
      if (successfulSends.length > 0) {
        await updateBalanceAfterSendingTemplates(successfulSends, templateCosts);
      }
      
      setSendResults(results);
      setShowSendModal(true);
    }
  }, [csvData, numbersOfMaintance, dataTemplates, updateBalanceAfterSendingTemplates, setSendResults, setShowSendModal]);

  // Función para enviar plantillas multimedia aprobadas
  const handleSendMultimediaTemplates = React.useCallback(async () => {
    const results: { row: CsvRow | MultimediaCsvRow; success: boolean; error?: any }[] = []
    const successfulSends: MultimediaCsvRow[] = [];
    const templateCosts = { utility: 0, marketing: 0 };
    
    if (multimediaCsvData && numbersOfMaintance && dataTemplates) {
      for (const row of multimediaCsvData) {
        if (isMultimediaRowValid(row)) {
          // Buscar el registro de numbersOfMaintance correspondiente al teléfono de origen
          const maintRecord = numbersOfMaintance.find(
            (item) => Number(item.number) === Number(row.originPhone)
          )
          if (!maintRecord) {
            results.push({
              row,
              success: false,
              error: "Registro de mantenimiento no encontrado"
            })
            continue
          }
          
          // Construir destinationPhone concatenando "+" con indicativo y teléfono destino
          const newDestinationPhone = `+${row.indicativePhone}${row.destinationPhone}`
          
          try {
            // Primero, obtenemos la plantilla completa
            const template = dataTemplates?.find((t: any) => t.name === row.templateName)
            if (!template) {
              results.push({
                row,
                success: false,
                error: "Plantilla no encontrada"
              })
              continue
            }
            
            // Determinar si es una plantilla multimedia
            let isMultimedia = false
            if (row.mediaType && row.mediaType !== TemplateMediaType.NONE) {
              isMultimedia = true
            }
            
            if (isMultimedia) {
              // Manejo específico para plantillas multimedia
              // Aquí se implementaría la lógica para enviar plantillas multimedia
              // (Simulamos éxito por ahora)
              console.log("Envío de plantilla multimedia", {
                destinationPhone: newDestinationPhone,
                accessToken: maintRecord.IdAccountWB,
                senderId: maintRecord.idNumberPhone,
                templateName: row.templateName,
                mediaType: row.mediaType,
                mediaUrl: row.mediaUrl,
                mediaCaption: row.mediaCaption
              })
              
              // Simular envío exitoso
              results.push({ row, success: true })
              successfulSends.push(row)
              
              // Actualizar costos según categoría - las plantillas multimedia suelen ser más caras
              // Añadimos un 20% extra al costo base según la categoría
              if (template.categoryTemplateWhatsapp === "UTILITY") {
                templateCosts.utility += 0.0002 * 1.2 // 20% extra por ser multimedia
              } else if (template.categoryTemplateWhatsapp === "MARKETING") {
                templateCosts.marketing += 0.0125 * 1.2 // 20% extra por ser multimedia
              }
            } else {
              // Si no es multimedia, enviar como plantilla normal
              // Validar que el ID y nombre de la empresa existan
              if (!companyId || !dataFromToken?.user?.company?.name) {
                throw new Error("No se pudo obtener la información de la empresa")
              }
              
              await sendTemplateMessage(
                newDestinationPhone,
                maintRecord.IdAccountWB as any, // token de acceso desde numbersOfMaintance
                maintRecord.idNumberPhone as any, // senderId desde numbersOfMaintance
                row.templateName,
                companyId,
                dataFromToken.user.company.name.substring(0, 2)
              )
              results.push({ row, success: true })
              successfulSends.push(row)
              
              // Actualizar costos según categoría (precio estándar)
              if (template.categoryTemplateWhatsapp === "UTILITY") {
                templateCosts.utility += 0.0002
              } else if (template.categoryTemplateWhatsapp === "MARKETING") {
                templateCosts.marketing += 0.0125
              }
            }
          } catch (err) {
            results.push({ row, success: false, error: err })
          }
        } else {
          results.push({ 
            row, 
            success: false, 
            error: "Datos de plantilla multimedia inválidos" 
          })
        }
      }
      
      // Actualizar el saldo solo si hubo envíos exitosos
      if (successfulSends.length > 0) {
        await updateBalanceAfterSendingTemplates(successfulSends, templateCosts);
      }
      
      setSendResults(results)
      setShowSendModal(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [multimediaCsvData, numbersOfMaintance, dataTemplates, updateBalanceAfterSendingTemplates])

  return (
    <EmptyPage>
      <div className="flex flex-column align-items-center">
        {/* TabView para separar las opciones de envío normal y multimedia */}
        <TabView activeIndex={activeTabIndex} onTabChange={(e) => setActiveTabIndex(e.index)}
          className="w-full md:w-9 mb-5">
          <TabPanel header="Plantillas Normales">
            <div className="flex flex-column align-items-center p-3">
              <h3 className="mb-3">Envío Masivo de Plantillas</h3>
              <div className="card p-3 border-1 border-gray-300 border-round mb-3">
                <p className="text-gray-700">Cargue un archivo Excel con las siguientes columnas:</p>
                <ul className="list-none p-0 m-0">
                  <li className="mb-2"><i className="pi pi-check-circle text-green-500 mr-2"></i>NOMBRE_PLANTILLA</li>
                  <li className="mb-2"><i className="pi pi-check-circle text-green-500 mr-2"></i>TELEFONO_ORIGEN</li>
                  <li className="mb-2"><i className="pi pi-check-circle text-green-500 mr-2"></i>TELEFONO_DESTINO</li>
                  <li className="mb-2"><i className="pi pi-check-circle text-green-500 mr-2"></i>INDICATIVO_TELEFONO</li>
                </ul>
              </div>
              <FileUpload
                ref={fileUploadRef}
                mode="basic"
                name="xlsxFile"
                accept=".xlsx"
                maxFileSize={1000000}
                auto
                customUpload
                uploadHandler={handleFileUpload}
                chooseLabel="Cargar XLSX"
                className="mb-3"
              />
              <Button className="mb-3" label="Reiniciar" onClick={handleReset} icon="pi pi-refresh" />
            </div>
          </TabPanel>
          
          <TabPanel header="Plantillas Multimedia">
            <div className="flex flex-column align-items-center p-3">
              <h3 className="mb-3">Envío Masivo de Plantillas Multimedia</h3>
              <div className="card p-3 border-1 border-gray-300 border-round mb-3">
                <p className="text-gray-700">Cargue un archivo Excel con las siguientes columnas:</p>
                <ul className="list-none p-0 m-0">
                  <li className="mb-2"><i className="pi pi-check-circle text-green-500 mr-2"></i>NOMBRE_PLANTILLA</li>
                  <li className="mb-2"><i className="pi pi-check-circle text-green-500 mr-2"></i>TELEFONO_ORIGEN</li>
                  <li className="mb-2"><i className="pi pi-check-circle text-green-500 mr-2"></i>TELEFONO_DESTINO</li>
                  <li className="mb-2"><i className="pi pi-check-circle text-green-500 mr-2"></i>INDICATIVO_TELEFONO</li>
                  <li className="mb-2">
                    <i className="pi pi-check-circle text-green-500 mr-2"></i>
                    TIPO_MULTIMEDIA (image, video, document, audio)
                  </li>
                  <li className="mb-2">
                    <i className="pi pi-check-circle text-green-500 mr-2"></i>
                    URL_MULTIMEDIA
                  </li>
                  <li className="mb-2">
                    <i className="pi pi-check-circle text-green-500 mr-2"></i>
                    DESCRIPCION_MULTIMEDIA (opcional)
                  </li>
                </ul>
              </div>
              <FileUpload
                ref={multimediaFileUploadRef}
                mode="basic"
                name="xlsxFileMultimedia"
                accept=".xlsx"
                maxFileSize={1000000}
                auto
                customUpload
                uploadHandler={handleMultimediaFileUpload}
                chooseLabel="Cargar XLSX"
                className="mb-3"
              />
              <Button className="mb-3" label="Reiniciar" onClick={handleReset} icon="pi pi-refresh" />
            </div>
          </TabPanel>
        </TabView>

        {/* Modal con tabla para mostrar datos cargados de plantillas normales */}
        <Dialog 
          header="Detalle XLSX - Plantillas Normales" 
          visible={showModal} 
          style={{ width: "70vw" }} 
          onHide={() => setShowModal(false)}>
          {csvData && (
            <>
              <DataTable
                value={csvData}
                virtualScrollerOptions={{ itemSize: 46 }}
                scrollable
                scrollHeight="400px"
              >
                <Column field="templateName" header="Nombre Plantilla" />
                <Column field="originPhone" header="Teléfono Origen" />
                <Column field="destinationPhone" header="Teléfono Destino" />
                <Column field="indicativePhone" header="Indicativo Teléfono" />
                <Column header="Validación" body={validationBodyTemplate} />
              </DataTable>
              
              <div className="flex justify-content-end mt-3">
                <Button 
                  label="Enviar"
                  onClick={handleSendTemplates} 
                  className="p-button-success"
                  disabled={!csvData.some(row => isRowValid(row))}
                />
              </div>
            </>
          )}
        </Dialog>
        
        {/* Modal con tabla para mostrar datos cargados de plantillas multimedia */}
        <Dialog 
          header="Detalle XLSX - Plantillas Multimedia" 
          visible={showMultimediaModal} 
          style={{ width: "80vw" }} 
          onHide={() => setShowMultimediaModal(false)}>
          {multimediaCsvData && (
            <>
              <DataTable
                value={multimediaCsvData}
                virtualScrollerOptions={{ itemSize: 46 }}
                scrollable
                scrollHeight="400px"
              >
                <Column field="templateName" header="Nombre Plantilla" />
                <Column field="originPhone" header="Teléfono Origen" />
                <Column field="destinationPhone" header="Teléfono Destino" />
                <Column field="indicativePhone" header="Indicativo Teléfono" />
                <Column field="mediaType" header="Tipo Multimedia" />
                <Column field="mediaUrl" header="URL Multimedia" />
                <Column field="mediaCaption" header="Descripción" />
                <Column 
  header="Validación" 
  body={(rowData) => (
    <span>
      {isMultimediaRowValid(rowData) ? "✔" : "✘"}
    </span>
  )} 
/>
              </DataTable>
              
              <div className="flex justify-content-end mt-3">
                <Button 
                  label="Enviar Plantillas Multimedia" 
                  onClick={handleSendMultimediaTemplates} 
                  className="p-button-success"
                  disabled={!multimediaCsvData.some(row => isMultimediaRowValid(row))}
                />
              </div>
            </>
          )}
        </Dialog>

        {/* Renderizado virtual fuera del modal */}
        {csvData && (
          <div style={{ marginTop: "1rem" }}>
            <h3>Datos cargados:</h3>
            <VirtualScroller
              items={csvData}
              itemSize={50}
              style={{ height: "200px", width: "500px" }}
              itemTemplate={(row: CsvRow, options) => (
                <ul>
                    <li key={options.index}>
                    Nombre Plantilla: {row.templateName},
                    Teléfono Origen: {row.originPhone},
                    Teléfono Destino: {row.destinationPhone},
                    Indicativo Teléfono: {row.indicativePhone},
                    Validación: {isRowValid(row) ? "✔" : "✘"}
                    </li>
                </ul>
              )}
            />
          </div>
        )}
        {/* Botón para enviar plantillas */}
        {csvData && (
          <div style={{ marginTop: "1rem" }}>
            <Button label="Enviar Plantillas" onClick={handleSendTemplates} />
          </div>
        )}
        {/* Modal para resultados de envío */}
        <Dialog header="Resultados de Envío de Plantillas" visible={showSendModal}
        style={{ width: "50vw" }} onHide={() => setShowSendModal(false)}>
          {sendResults.length > 0
            ? (
            <div>
              <h4>Enviados exitosamente:</h4>
              <ul>
                {sendResults.filter(r => r.success).map((res, idx) => (
                  <li key={idx}>
                    {res.row.templateName} a {res.row.destinationPhone}
                  </li>
                ))}
              </ul>
              <h4>Fallos:</h4>
              <ul>
                {sendResults.filter(r => !r.success).map((res, idx) => (
                  <li key={idx}>
                    {res.row.templateName} a {res.row.destinationPhone} - 
                    Error: {
                      typeof res.error === 'object' 
                        ? JSON.stringify(res.error).substring(0, 100) + 
                          (JSON.stringify(res.error).length > 100 ? '...' : '')
                        : String(res.error)
                    }
                  </li>
                ))}
              </ul>
            </div>
              )
            : (
            <p>No se procesaron solicitudes.</p>
              )}
        </Dialog>
        {/* Resumen de Costos */}
        {csvData && dataTemplates && (
          (() => {
            const summary = csvData.reduce((acc, row) => {
              const template = dataTemplates.find((t: any) => t.name === row.templateName)
              if (template) {
                if (template.categoryTemplateWhatsapp === "UTILITY") {
                  acc.utility += 0.0002
                } else if (template.categoryTemplateWhatsapp === "MARKETING") {
                  acc.marketing += 0.0125
                }
              }
              return acc
            }, { utility: 0, marketing: 0 })
            return (
              <div style={{ marginTop: "1rem" }}>
                <h3>Resumen de Costos</h3>
                <p>Plantillas Utility: {summary.utility.toFixed(4)}</p>
                <p>Plantillas Marketing: {summary.marketing.toFixed(4)}</p>
                <p>Total: {(summary.utility + summary.marketing).toFixed(4)}</p>
              </div>
            )
          })()
        )}
      </div>
    </EmptyPage>
  )
}

export default MasiveChat
