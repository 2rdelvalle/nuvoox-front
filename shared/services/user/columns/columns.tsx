import { useToast } from "@/shared/context/toast/toastContext"
import { UserCaratule } from "@/shared/models"
import { ADMIN_ROUTES } from "@/shared/routes/admin.routes"
import ActionButton from "@/shared/small-components/ActionButtons/actionbutton"
import { ColumnsType } from "@/shared/small-components/TableFilter/types/tableFilterTypes"
import { useRouter } from "next/navigation"
import { Badge } from "primereact/badge"
import { InputSwitch } from "primereact/inputswitch"
import { UserService as _user } from "@/shared/services/index"

type props = {
  callback : ()=> void
  users?: any[]
  setUsers?: (users: any[]) => void
}

export const COLUMNS_USER = ({ callback, users, setUsers }: props) => {
  const { push } = useRouter()

  const { showInfo, showError } = useToast()

  //   const { setUser } = useUserFormStore()

  async function goToUpdate (rowData: UserCaratule) {
    showInfo("Redireccionado a edicion : " + rowData.name)
    push(ADMIN_ROUTES.USER.CREATE + "/" + rowData.userId)
  }

  async function deleteWithId (rowData: any) {
    console.log('Eliminando usuario:', rowData)
    try {
      // Si tenemos acceso a la lista de usuarios y la función para actualizarla
      if (users && setUsers) {
        // Actualizar la UI inmediatamente, sin esperar la respuesta del backend
        const updatedUsers = users.filter(user => user.userId !== rowData.userId);
        console.log(`Filtrando usuario ${rowData.userId}, usuarios restantes: ${updatedUsers.length}`);
        setUsers(updatedUsers);
      }

      // Realizar la petición de eliminación al backend
      await _user
        .deleteById(rowData.userId)
        .then(({ data }) => {
          // Recargar datos del backend por si acaso
          callback()
          showInfo("El usuario ha sido desactivado correctamente y ya no aparecerá en la lista")
        })
    } catch (error : any) {
      showError(error.response?.data?.message ?? "Error al desactivar el usuario")
      // Si ocurrió un error, recargar los datos para restaurar el estado correcto
      callback()
    }
  }

  async function toggleCampaignPermission(rowData: UserCaratule, newValue: boolean) {
    try {
      // Actualizar la UI inmediatamente para mejor UX
      if (users && setUsers) {
        const updatedUsers = users.map(user => 
          user.userId === rowData.userId 
            ? { ...user, can_send_campaigns: newValue }
            : user
        );
        setUsers(updatedUsers);
      }

      // Realizar la petición al backend
      await _user.updateCampaignPermission(rowData.userId, newValue);
      showInfo(`Privilegio de envío masivo ${newValue ? 'activado' : 'desactivado'} para ${rowData.name}`);
    } catch (error: any) {
      showError(error.response?.data?.message ?? "Error al actualizar el privilegio");
      // Si ocurrió un error, recargar los datos para restaurar el estado correcto
      callback();
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
      field: "can_send_campaigns",
      header: "Envío Masivo",
      style: { width: "12%" },
      body: (rowData: UserCaratule) => (
        <div className="flex align-items-center justify-content-center">
          <InputSwitch
            checked={rowData.can_send_campaigns || false}
            onChange={(e) => toggleCampaignPermission(rowData, e.value)}
            disabled={rowData.role.name !== 'AGENTE'} // Solo habilitar para agentes
            tooltip={rowData.role.name !== 'AGENTE' ? 'Solo disponible para agentes' : 'Permitir envío masivo'}
          />
        </div>
      )
    },
    {
      field: "",
      header: "Acciones",
      style: { width: "12%" },
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
