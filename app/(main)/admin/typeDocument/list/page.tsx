"use client"
import { useToast } from "@/shared/context/toast/toastContext"
import { useFetch } from "@/shared/hooks/useFetch"
import {
  TypeDocumentService as _typeDocument
} from "@/shared/services/index"
import { COLUMNS_TYPEDOCUMENT } from "@/shared/services/typeDocument"
import CustomToolbar from "@/shared/small-components/CustomToolbar/customToolbar"
import EmptyPage from "@/shared/small-components/EmptyPage/emptyPage"
import InfoMessage from "@/shared/small-components/InfoMessage/infoMessage"
import TableFilter from "@/shared/small-components/TableFilter/tableFilter"
import { downloadExcel } from "@/shared/utilities/excel/exportExcel"

const TypeDocumentPage = () => {
  const { showError } = useToast()

  const { responseData: users, isLoading } = useFetch(_typeDocument.caratule)
  const { columns } = COLUMNS_TYPEDOCUMENT()

  return (
      <EmptyPage>
        <CustomToolbar className="m-2 mb-4" startStatus endStatus
          downloadExcel={() => downloadExcel(users)}
          downloadPdf={() => showError("No implementado")}/>
        <TableFilter
        size="normal"
          dataKey="typeDocumentId"
          rowsPerPage={5}
          dataMenu={users}
          headerTableName={
            () => (
              <InfoMessage
              message={"A continuación se listan los Tipos de Documento registrados en el sistema." +
                "Solo aparecerán los últimos 50 Tipos de Documento"}
              />
            )
          }
          columns={columns}
          emptyMessage={"No se encontraron Tipos de Documento"}
          loading={isLoading}
          headerCardName={"Listado de Tipos de Documento"}
          />
      </EmptyPage>
  )
}

export default TypeDocumentPage
