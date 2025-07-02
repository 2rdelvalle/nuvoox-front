import ActionButton from "@/shared/small-components/ActionButtons/actionbutton"
import { ColumnsType } from "@/shared/small-components/TableFilter/types/tableFilterTypes"
import { GroupAgentService as _gas } from "@/shared/services/index"
import { useToast } from "@/shared/context/toast/toastContext"

interface props {
    update: () => void
    actions?: {
      edit?: (rowData: any) => void
    }
}

export const COLUMNS_GROUP_GA = ({ update, actions } : props) => {
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
      body: (rowData: any) => {
        // Crear una función de edición segura
        const handleEdit = () => {
          if (actions && typeof actions.edit === 'function') {
            actions.edit(rowData);
          }
        };
        
        return (
          <ActionButton
            actionDelete={() => deleteF(rowData.companyGroupUserid)}
            actionPencil={actions?.edit ? handleEdit : undefined}
          />
        );
      }
    }
  ]

  return { columns }
}
