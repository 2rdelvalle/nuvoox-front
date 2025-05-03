"use client"
import { useFetch } from "@/shared/hooks/useFetch"
import {
  CompanyService as _company
} from "@/shared/services/index"
import EmptyPage from "@/shared/small-components/EmptyPage/emptyPage"
import { Button } from "primereact/button"
import { Column } from "primereact/column"
import { DataTable, DataTableExpandedRows, DataTableValueArray } from "primereact/datatable"
import { Tag } from "primereact/tag"
import { useState } from "react"
import { NumbersToAprobate } from "../(models)/table-aprobations-model"
const AprobationsPage = () => {
  const { responseData: companyNumbersAprobations, isLoading } = useFetch(_company.getAllCompanynumbersOfMaintanceAprobateds)
  const [expandedRows, setExpandedRows] = useState<DataTableExpandedRows | DataTableValueArray | undefined>(undefined)

  const expandAll = () => {
    const _expandedRows: DataTableExpandedRows = {}
    companyNumbersAprobations.forEach((p) => (_expandedRows[`${p.id}`] = true))
    setExpandedRows(_expandedRows)
  }

  const getStatusSeverity = (data: NumbersToAprobate) => {
    switch (data.status) {
      case "A":
        return "success"

      case "I":
        return "danger"

      default:
        return null
    }
  }

  const statusOrderBodyTemplate = (rowData: NumbersToAprobate) => {
    const status = rowData.status.toLowerCase() === "a" ? "Aprobado" : "Rechazado"
    return <Tag value={status} severity={getStatusSeverity(rowData)}></Tag>
  }

  const collapseAll = () => {
    setExpandedRows(undefined)
  }

  const headerButtons = (
    <>
        <div className="inline-flex gap-2 align-items-center">
            <div className="font-bold text-3xl">Listado De Aprobaciones</div>
            <i className="pi pi-check font-bold text-3xl" style={{ color: "slateblue" }}></i>
        </div>
        <div className="flex flex-wrap justify-content-end gap-2">
            <Button icon="pi pi-plus" type="button" label="Expandir Todo" onClick={expandAll} text />
            <Button icon="pi pi-minus" type="button" label="Contraer Todo"text onClick={collapseAll}/>
        </div>
    </>
  )

  const rowExpansionTemplate = (data : any) => {
    return (
      <div className="p-3">
        <h5>Aprobaciones De Numeros Para: {data.nameCompany}</h5>
        <DataTable value={data.numbersToAprobate}>
          <Column field="indicative" header="Indicativo" sortable></Column>
          <Column field="number" header="Numero Telefonico" sortable></Column>
          <Column field="status" header="Estado" body={statusOrderBodyTemplate} sortable></Column>
        </DataTable>
      </div>
    )
  }

  const allowExpansion = (rowData : any) => {
    return rowData.numbersToAprobate.length > 0
  }

  return (
    <EmptyPage>
        <div className="card">
            <DataTable
                    value={companyNumbersAprobations}
                    expandedRows={expandedRows}
                    rowExpansionTemplate={rowExpansionTemplate}
                    dataKey="idCompany" header={headerButtons} tableStyle={{ minWidth: "60rem" }}
                    loading={isLoading} onRowToggle={(e) => setExpandedRows(e.data)}
                >
                <Column expander={allowExpansion} style={{ width: "5rem" }} />
                <Column field="nameCompany" header="Nombre Empresa" sortable />
                <Column field="QuantityNumbersToAprobate" header="Cantidad De Numeros Por Aprobar" sortable />
            </DataTable>
        </div>
    </EmptyPage>
  )
}

export default AprobationsPage
