import { CompanyForm, NumbersOfMaintanceCaratule } from "@/shared/models"
import ActionButton from "@/shared/small-components/ActionButtons/actionbutton"
import { ColumnsType } from "@/shared/small-components/TableFilter/types/tableFilterTypes"
import { Control, useFieldArray, UseFormGetValues, UseFormSetValue } from "react-hook-form"

type props = {
    control: Control<CompanyForm, any>
    setValue: UseFormSetValue<CompanyForm>
    getValues: UseFormGetValues<CompanyForm>
}

export const COLUMNS_TABLE_NUMBERS = ({ control, setValue, getValues } : props) => {
  const { remove } = useFieldArray({
    control,
    name: "numbersOfMaintance"
  })

  async function deleteWithId (rowData: any) {
    // Obtener el arreglo actualizado de contactos desde RHF
    const currentData = getValues("numbersOfMaintance")
    const index = currentData.findIndex((field: any) => field.number === rowData.number)
    if (index >= 0) {
      remove(index)
      // Actualizar el estado interno de RHF para reflejar la eliminación
      const updatedNom = currentData.filter((_, i) => i !== index)
      setValue("numbersOfMaintance", updatedNom)
    }
  }

  const columns : ColumnsType[] = [
    {
      field: "number",
      header: "Numero Telefonico",
      style: { width: "30" }
    },
    {
      field: "",
      header: "Acciones",
      style: { width: "17%" },
      body: (rowData: any) => (
        <ActionButton

          actionDelete={() => deleteWithId(rowData)}
        />
      )
    }
  ]

  return { columns }
}
