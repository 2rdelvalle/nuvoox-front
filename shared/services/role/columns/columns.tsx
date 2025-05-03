import ActionButton from "@/shared/small-components/ActionButtons/actionbutton"
import { ColumnsType } from "@/shared/small-components/TableFilter/types/tableFilterTypes"

type props = {
  callback : ()=> void
}

export const COLUMNS_ROLE = ({ callback }: props) => {
  //   const { push } = useRouter()

  //   const { showInfo, showError } = useToast()

  //   const { setUser } = useUserFormStore()

  async function goToUpdate (rowData: any) {
    // try {
    //   await _user
    //     .getById(rowData.id)
    //     .then(({ data }) => {
    //       console.log(data)
    //       setUser(data)
    //     })
    // } catch (error : any) {
    //   showError(error.response?.data?.message ? error?.response?.data?.message : t.common.changeStatus.error)
    // }
  }

  async function deleteWithId (rowData: any) {
    // try {
    //   await _user
    //     .deleteById(rowData.id)
    //     .then(({ data }) => {
    //       callback()
    //       showInfo(t.common.generalActions.success.named + data.name + " " + t.common.generalActions.success.deleted)
    //     })
    // } catch (error : any) {
    //   showError(error.response?.data?.message ? error?.response?.data?.message : t.common.generalActions.errors.deleted)
    // }
  }

  const columns : ColumnsType[] = [
    {
      field: "name",
      header: "Nombre",
      style: { width: "30%" }
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
