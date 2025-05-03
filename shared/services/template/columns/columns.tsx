import { ColumnsType } from "@/shared/small-components/TableFilter/types/tableFilterTypes"
import { Badge } from "primereact/badge"
export const COLUMNS_TEMPLATE = () => {
  const badgeStatus = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge severity="info" value="Pendiente" className="mr-2">Pendiente</Badge>
      case "APPROVED":
        return <Badge severity="success" value="Aprobado" className="mr-2">Aprobado</Badge>
      default:
        return <span className="badge badge-secondary">Desconocido</span>
    }
  }

  const badgeCategory = (category: string) => {
    switch (category) {
      case "MARKETING":
        return <Badge severity="info" value="Marketing" className="mr-2">Marketing</Badge>
      case "UTILITY":
        return <Badge severity="info" value="Utilidad" className="mr-2">Utilidad</Badge>
      default:
        return <span className="badge badge-secondary">Desconocido</span>
    }
  }

  const columns : ColumnsType[] = [
    {
      field: "templateId",
      header: "#",
      style: { width: "5%" },
      // render # count of the table
      body: ((_rowData: any, options: any) => <span>{options.rowIndex + 1}</span>) as (rowData: any) => any
    },
    {
      field: "name",
      header: "Nombre",
      style: { width: "55%" }
    },
    {
      field: "statusTemplateWhatsapp",
      header: "Estado",
      style: { width: "20%" },
      body: (rowData: any) => {
        return badgeStatus(rowData.statusTemplateWhatsapp)
      }
    },
    {
      field: "categoryTemplateWhatsapp",
      header: "Categoría",
      style: { width: "20%" },
      body: (rowData: any) => {
        return badgeCategory(rowData.categoryTemplateWhatsapp)
      }
    }
  ]

  return { columns }
}
