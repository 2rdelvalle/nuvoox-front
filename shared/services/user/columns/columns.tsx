import { useToast } from "@/shared/context/toast/toastContext"
import { UserCaratule } from "@/shared/models"
import { ADMIN_ROUTES } from "@/shared/routes/admin.routes"
import ActionButton from "@/shared/small-components/ActionButtons/actionbutton"
import { ColumnsType } from "@/shared/small-components/TableFilter/types/tableFilterTypes"
import { useRouter } from "next/navigation"
import { Badge } from "primereact/badge"
import { UserService as _user } from "@/shared/services/index"

type props = {
  callback : ()=> void
}

export const COLUMNS_USER = ({ callback }: props) => {
  const { push } = useRouter()

  const { showInfo, showError } = useToast()

  //   const { setUser } = useUserFormStore()

  async function goToUpdate (rowData: UserCaratule) {
    showInfo("Redireccionado a edicion : " + rowData.name)
    push(ADMIN_ROUTES.USER.CREATE + "/" + rowData.userId)
  }

  async function deleteWithId (rowData: any) {
    console.log(rowData)
    try {
      await _user
        .deleteById(rowData.userId)
        .then(({ data }) => {
          callback()
          showInfo("El usuario ha sido desactivado correctamente y ya no aparecerá en la lista")
        })
    } catch (error : any) {
      showError(error.response?.data?.message ?? "Error al desactivar el usuario")
    }
  }

  const columns : ColumnsType[] = [
    {
      field: "name",
      header: "Nombre",
      style: { width: "30%" },
      filter: true
    },
    {
      field: "mail",
      header: "Correo",
      style: { width: "27%" }
    },
    {
      field: "role",
      header: "Rol",
      style: { width: "13%" },
      body: (rowData: UserCaratule) => (
        <Badge value={rowData.role.name} />
      )
    },
    {
      field: "role",
      header: "Empresa",
      style: { width: "13%" },
      body: (rowData: UserCaratule) => (
        <Badge value={rowData.company.name} />
      )
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
