import ActionButton from "@/shared/small-components/ActionButtons/actionbutton"
import { ColumnsType } from "@/shared/small-components/TableFilter/types/tableFilterTypes"
import {
  CompanyService as _company
} from "@/shared/services/index"
import { useToast } from "@/shared/context/toast/toastContext"
import { useRouter } from "next/navigation"
import { ADMIN_ROUTES } from "@/shared/routes/admin.routes"
type props = {
  callback : ()=> void
}

export const COLUMNS_COMPANY = ({ callback }: props) => {
  const { push } = useRouter()

  const { showInfo } = useToast()

  async function goToUpdate (rowData: any) {
    showInfo("Redireccionado a edicion : " + rowData.name)
    push(ADMIN_ROUTES.COMPANY.CREATE + "/" + rowData.companyId)
  }

  async function deleteWithId (rowData: any) {
    console.log(rowData)
    try {
      await _company
        .deleteById(rowData.companyId)
        .then(({ data }) => {
          alert("Eliminado")
          callback()
        })
    } catch (error : any) {
      alert("Error al eliminar")
      console.log(error)
    }
  }

  const columns : ColumnsType[] = [
    {
      field: "name",
      header: "Nombre",
      style: { width: "30" },
      filter: true
    },
    {
      field: "status",
      header: "Estado",
      style: { width: "27%" }
    },
    {
      field: "",
      header: "Acciones",
      style: { width: "17%" },
      body: (rowData: any) => (
        <ActionButton
          actionPencil={() => goToUpdate(rowData)}
          actionDelete={() => deleteWithId(rowData)}
        />
      )
    }
  ]

  return { columns }
}
