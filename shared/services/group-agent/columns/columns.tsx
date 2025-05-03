import ActionButton from "@/shared/small-components/ActionButtons/actionbutton"
import { ColumnsType } from "@/shared/small-components/TableFilter/types/tableFilterTypes"
import { GroupAgentService as _gas } from "@/shared/services/index"
import { useToast } from "@/shared/context/toast/toastContext"

interface props {
    update: () => void
}

export const COLUMNS_GROUP_GA = ({ update } : props) => {
  const { showError, showSuccess } = useToast()

  async function deleteF (rowData : number) {
    try {
      await _gas.deleteGroupAgentWithID(rowData)
        .then(() => {
          showSuccess("Grupo eliminado correctamente")
          update()
        }
        )
    } catch (error) {
      showError("Error al eliminar el grupo")
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
      field: "",
      header: "Acciones",
      style: { width: "17%" },
      body: (rowData: any) => (
        <ActionButton
            actionDelete={() => deleteF(rowData.id)}
        />
      )
    }
  ]

  return { columns }
}
