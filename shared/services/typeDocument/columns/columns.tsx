import { ColumnsType } from "@/shared/small-components/TableFilter/types/tableFilterTypes"
export const COLUMNS_TYPEDOCUMENT = () => {
  const columns : ColumnsType[] = [
    {
      field: "typeDocumentId",
      header: "#",
      style: { width: "20%" },
      // render # count of the table
      body: (rowData: any) => <span>{rowData.typeDocumentId}</span>

    },
    {
      field: "name",
      header: "Nombre",
      style: { width: "80%" }
    }
  ]

  return { columns }
}
