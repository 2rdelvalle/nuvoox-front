"use client"
import { useSWRFetch } from "@/shared/customHooks/useSWRFetch"
import { useFetch } from "@/shared/hooks/useFetch"
import { NumbersOfMaintanceCaratule } from "@/shared/models"
import { TemplateService as _template } from "@/shared/services"
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

// Actualizar definición del tipo para las filas del XLSX
type CsvRow = {
  templateName: string;
  originPhone: string;
  destinationPhone: string;
  indicativePhone: string;
};

const MasiveChat: React.FC = () => {
  const [csvData, setCsvData] = useState<CsvRow[] | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [sendResults, setSendResults] = useState<{ row: CsvRow; success: boolean; error?: any }[]>([])
  const [showSendModal, setShowSendModal] = useState(false)

  const token = getCookieToken()
  const dataFromToken = getDataFromToken(token ?? "")

  // trae los numeros de la empresa que maneja el ajente
  const { data: numbersOfMaintance } =
    useSWRFetch<NumbersOfMaintanceCaratule[]>(`/companies/getNumbersOfMaintance/${dataFromToken?.user?.company?.companyId}`)

  const { responseData: dataTemplates } = useFetch(_template.getAll)

  const fileUploadRef = useRef<any>(null) // nueva referencia para FileUpload

  // Se fuerza re-renderizar cuando numbersOfMaintance o dataTemplates se actualizan
  useEffect(() => {
    if (csvData) {
      setCsvData([...csvData])
    }
  }, [numbersOfMaintance, dataTemplates])

  // Función auxiliar para validar cada registro
  const isRowValid = (row: CsvRow) => {
    const originValid = (numbersOfMaintance || []).some((item) => Number(item.number) === Number(row.originPhone))
    const templateValid = (dataTemplates || []).some((template: any) => template.name === row.templateName)
    return originValid && templateValid
  }

  // Función para renderizar el contenido de la columna de validación
  const validationBodyTemplate = (rowData: CsvRow) => {
    return <span>{isRowValid(rowData) ? "✔" : "✘"}</span>
  }

  // Manejar la carga del archivo XLSX
  const handleFileUpload = (event: { files: File[] }) => {
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
        const result: CsvRow[] = jsonData.slice(1).map((row: any[]) => {
          return {
            templateName: row[headers.indexOf("NOMBRE_PLANTILLA")],
            originPhone: row[headers.indexOf("TELEFONO_ORIGEN")],
            destinationPhone: row[headers.indexOf("TELEFONO_DESTINO")],
            indicativePhone: row[headers.indexOf("INDICATIVO_TELEFONO")]
          }
        })
        setCsvData(result)
        console.log("Parsed XLSX Data:", result)
        setShowModal(true)
      }
      reader.readAsArrayBuffer(file)
    }
  }

  // Agregar función para reiniciar el estado del archivo excel
  const handleReset = () => {
    setCsvData(null)
    setSendResults([])
    setShowModal(false)
    setShowSendModal(false)
    // Reiniciar el componente FileUpload
    fileUploadRef.current?.clear()
  }

  // Función para enviar plantillas aprobadas
  const handleSendTemplates = async () => {
    const results: { row: CsvRow; success: boolean; error?: any }[] = []
    if (csvData && numbersOfMaintance) {
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
          const newDestinationPhone = `+${row.indicativePhone}${row.destinationPhone}`
          try {
            await sendTemplateMessage(
              newDestinationPhone,
              maintRecord.IdAccountWB as any, // token de acceso desde numbersOfMaintance
              maintRecord.idNumberPhone as any, // senderId desde numbersOfMaintance
              row.templateName
            )
            results.push({ row, success: true })
          } catch (err) {
            results.push({ row, success: false, error: err })
          }
        }
      }
      setSendResults(results)
      setShowSendModal(true)
    }
  }

  return (
    <EmptyPage>
      <div className="flex flex-column align-items-center">
        {/* FileUpload de PrimeReact */}
        <FileUpload
          ref={fileUploadRef} // asignar referencia al componente
          mode="basic"
          name="xlsxFile"
          accept=".xlsx"
          maxFileSize={1000000}
          auto
          customUpload
          uploadHandler={handleFileUpload} // se usa uploadHandler en lugar de onUpload
          chooseLabel="Cargar XLSX"
        />
        {/* Botón para reiniciar el estado del archivo excel */}
        <Button className="mt-2" label="Reiniciar Excel" onClick={handleReset} />

        {/* Modal con tabla para mostrar datos cargados con Virtual Scroll */}
        <Dialog header="Detalle XLSX" visible={showModal} style={{ width: "50vw" }} onHide={() => setShowModal(false)}>
          {csvData && (
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
                    {res.row.templateName} a {res.row.destinationPhone} - Error: {JSON.stringify(res.error)}
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
