"use client"
import React, { useEffect, useState } from "react"
import { Column } from "primereact/column"
import { DataTable, DataTableFilterMeta } from "primereact/datatable"
import { TableFilterProps } from "./types/tableFilterTypes"
import { FilterMatchMode } from "primereact/api"

function TableFilter (props : TableFilterProps) {
  const { className, dataMenu, emptyMessage, headerCardName, headerTableName, rowsPerPage = 10, columns, loading, dataKey, size } = props
  // eslint-disable-next-line no-unused-vars
  const [dataMenuState, setDataMenuState] = useState<typeof dataMenu>([])
  // eslint-disable-next-line no-unused-vars
  const [globalFilterValue, setGlobalFilterValue] = useState("")
  const [filters, setFilters] = useState<DataTableFilterMeta>({
    name: { value: null, matchMode: FilterMatchMode.STARTS_WITH }
  })

  useEffect(() => {
    setDataMenuState(dataMenu)
  }, [dataMenu])

  // eslint-disable-next-line no-unused-vars
  const onGlobalFilterChange1 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const _filtersTemp = { ...filters };
    (_filtersTemp.global as any).value = value

    setFilters(_filtersTemp)
    setGlobalFilterValue(value)
  }

  return (
        <div className={`${className} col-12`}>
            <div className="card">
                <h5>{headerCardName}</h5>
                <DataTable
                    value={dataMenu}
                    paginator
                    className="p-datatable-gridlines"
                    showGridlines
                    rows={rowsPerPage}
                    dataKey={dataKey}
                    filters={filters}
                    filterDisplay="menu"
                    size={size}
                    loading={loading}
                    responsiveLayout="scroll"
                    emptyMessage={emptyMessage}
                    header={headerTableName}
                >
                    {
                        columns
                          ? columns.map((column, index) => {
                            return <Column
                                key={column.key ? column.key : index}
                                field={column.field}
                                header={column.header}
                                filter={column.filter}
                                filterPlaceholder={column.filterPlaceholder}
                                style={column.style}
                                body={column.body}
                                 />
                          })
                          : null
                    }
                </DataTable>
            </div>
        </div>
  )
}

export default TableFilter
