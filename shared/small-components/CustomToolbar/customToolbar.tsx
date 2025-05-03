"use client"
import { Button } from "primereact/button"
import { FileUpload } from "primereact/fileupload"
import { Toolbar } from "primereact/toolbar"
import React from "react"
import { PropsCustomToolbar } from "./types/propsCustomToolbar"

function CustomToolbar (props: PropsCustomToolbar) {
  const {
    start, startStatus, startNew, starUpload,
    customLabelStartNew,
    end, endStatus, center, className, multiComponet,
    downloadExcel, downloadPdf, downloadWord

  } = props

  const startContent = (
        <React.Fragment>
            {
                startNew && <Button label={customLabelStartNew ?? "Nuevo"}
                onClick={startNew} icon="pi pi-plus" className="mr-2" type="button" />
            }
            { starUpload &&
              <FileUpload mode="basic" name="excel" accept=".xlsx, .xls"
              maxFileSize={1000000} auto chooseLabel="Cargar"
              customUpload uploadHandler={(e) => starUpload(e)} />
            }
            {
              multiComponet
            }
        </React.Fragment>
  )

  const endContent = (
        <React.Fragment>
            { downloadExcel && <Button icon="pi pi-file-excel" severity="success" tooltip={"Exportar a Excel"}
             rounded onClick={downloadExcel} tooltipOptions={{ position: "top" }} className="mr-2"/>}
            { downloadPdf && <Button icon="pi pi-file-pdf" severity="warning" rounded onClick={downloadPdf}
              tooltip={"Exportar todas las filas"} tooltipOptions={{ position: "top" }} className="mr-2"
            />}
            { downloadWord && <Button icon="pi pi-file-word" onClick={downloadWord} className="p-button-info mr-2 b-round" />}
        </React.Fragment>
  )

  return (
    <Toolbar
      className={className}
      start={startStatus ? start || startContent : null}
      center={center || null}
      end={endStatus ? end || endContent : null}
    />
  )
}

export default CustomToolbar
