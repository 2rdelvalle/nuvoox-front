import { Demo } from "@/types"
import { Calendar } from "primereact/calendar"
import { ColumnFilterElementTemplateOptions } from "primereact/column"

export const dateBodyTemplate = (rowData: Demo.Customer) => {
  return formatDate(rowData.date)
}

export const formatDate = (value: Date) => {
  return value.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  })
}

export const dateFilterTemplate = (
  options: ColumnFilterElementTemplateOptions
) => {
  return (
        <Calendar
            value={options.value}
            onChange={(e) => options.filterCallback(e.value, options.index)}
            dateFormat="mm/dd/yy"
            placeholder="mm/dd/yyyy"
            mask="99/99/9999"
        />
  )
}
