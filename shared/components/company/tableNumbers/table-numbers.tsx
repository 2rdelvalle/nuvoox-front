"use client"
import { CompanyForm, NumbersOfMaintanceCaratule } from "@/shared/models"
import CustomToolbar from "@/shared/small-components/CustomToolbar/customToolbar"
import InfoMessage from "@/shared/small-components/InfoMessage/infoMessage"
import TableFilter from "@/shared/small-components/TableFilter/tableFilter"
import { COLUMNS_TABLE_NUMBERS } from "./columns"
import { useTableNumbersStore } from "./state/table-numbers-store"
import { Control, UseFormGetValues, UseFormSetValue } from "react-hook-form"

type props = {
    numbers : NumbersOfMaintanceCaratule[]
    isLoading : boolean
    control: Control<CompanyForm, any>;
    setValue : UseFormSetValue<CompanyForm>
    getValues: UseFormGetValues<CompanyForm>
}

const TableNumbers = ({ numbers, isLoading, control, setValue, getValues } : props) => {
  const { setModalVisible } = useTableNumbersStore()
  const { columns } = COLUMNS_TABLE_NUMBERS({ control, setValue, getValues })

  return (
    <>
    <CustomToolbar customLabelStartNew="Agregar Número" className="m-2 mb-4" startStatus startNew={() => setModalVisible(true)} endStatus
          />
    <TableFilter
        size="small"
          dataKey="number"
          rowsPerPage={5}
          dataMenu={numbers}
          headerTableName={
            () => (
              <InfoMessage
              message={"A continuación se listan los números asociados a WhatsApp que administrará esta empresa"}
              />
            )
          }
          columns={
            columns
          }
          emptyMessage={"No se encontraron números asociados"}
          loading={isLoading}
          headerCardName={"Listado de Números asociados"}
          />
    </>
  )
}

export default TableNumbers
