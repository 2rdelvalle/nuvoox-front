"use client"
import { useFetchWithParams } from "@/shared/hooks/useFetchWithParams"
import { GroupAgentService as _gas, ConversationService as _conversation } from "@/shared/services/index"
import ActionButton from "@/shared/small-components/ActionButtons/actionbutton"
import { getCookieToken, getDataFromToken } from "@/shared/utilities/functions/sessionUtils"
import { Button } from "primereact/button"
import { Column } from "primereact/column"
import { DataTable, DataTableExpandedRows, DataTableValueArray } from "primereact/datatable"
import { Dialog } from "primereact/dialog"
import { Tag } from "primereact/tag"
import { useEffect, useState } from "react"
import { useChatStore } from "../store/chat-store"
import { TransferChat } from "@/shared/models/conversation/transferChat"
import { useToast } from "@/shared/context/toast/toastContext"

// Obtención de la data de grupos de agentes
const DialogTransfer = () => {
  const { showError, showSuccess } = useToast()
  const { dialogTransfer, setDialogTransfer, activeConversation, resetAll } = useChatStore()

  const { responseData: groups, isLoading, fetchData } = useFetchWithParams<any>(_gas.getGroupAgentsWithUsers)
  const [expandedRows, setExpandedRows] = useState<DataTableExpandedRows | DataTableValueArray | undefined>(undefined)

  // Obtén el dataToken
  const tokenData = getDataFromToken(getCookieToken() || "")
  const dataToken = tokenData?.user

  useEffect(() => {
    if (dataToken?.company?.companyId) {
      fetchData(dataToken.company.companyId)
    }
  }, [])

  // Expande todas las filas
  const expandAll = () => {
    const _expandedRows: DataTableExpandedRows = {}
    groups.forEach((group: any) => (_expandedRows[group.id] = true))
    setExpandedRows(_expandedRows)
  }

  // Coloca la severidad del Tag segun el status del integrante
  const getStatusSeverity = (member: any) => {
    switch (member.status) {
      case "A":
        return "success"
      case "I":
        return "danger"
      default:
        return null
    }
  }

  // Template para el estado de cada integrante
  const statusBodyTemplate = (rowData: any) => {
    const label = rowData.status === "A" ? "Activo" : rowData.status === "I" ? "Inactivo" : rowData.status
    return <Tag value={label} severity={getStatusSeverity(rowData)} />
  }

  // Contrae todas las filas
  const collapseAll = () => {
    setExpandedRows(undefined)
  }

  // Botones del header
  const headerButtons = (
    <div className="flex flex-wrap justify-content-end gap-2">
      <Button icon="pi pi-plus" type="button" label="Expandir Todo" onClick={expandAll} text />
      <Button icon="pi pi-minus" type="button" label="Contraer Todo" onClick={collapseAll} text />
    </div>
  )

  const transferChat = async (rowData: any) => {
    console.log('=== INICIANDO TRANSFERENCIA ===');
    console.log('Conversación activa:', activeConversation);
    
    if (!activeConversation) {
      console.error('No hay conversación activa');
      showError("No hay una conversación activa para transferir")
      return
    }

    if (!dataToken) {
      showError("No se pudo obtener la información del usuario")
      return
    }
    
    if (rowData.mail === dataToken.mail) {
      showError("No puedes transferir el chat a ti mismo")
      return
    }

    const transfer: TransferChat = {
      destinationNumber: activeConversation?.destination_number,
      userAgentDestinationId: rowData.id,
      userAgentOriginId: dataToken.userId
    }
    
    console.log('Datos de transferencia a enviar:', transfer);
    try {
      console.log("Transfer payload:", transfer);
      await _conversation.transferChat(transfer)
        .then((res) => {
          console.log("Transfer response:", res);
          if (res.status === 201) {
            showSuccess("Chat Transferido Exitosamente")
            setDialogTransfer(false)
            resetAll()
          }
        })
    } catch (error) {
      showError("Ocurrio un error al transferir el chat. Por Favor Intente Nuevamente")
    }
  }

  // Plantilla de expansión: muestra detalle de integrantes del grupo
  const rowExpansionTemplate = (group: any) => {
    return (
      <div className="p-3">
        <h5>Integrantes del Grupo {group.name}</h5>
        <DataTable value={group.userCompanyGroup} responsiveLayout="scroll">
          <Column field="name" header="Nombre" sortable></Column>
          <Column field="mail" header="Email" sortable></Column>
          <Column field="document" header="Documento" sortable></Column>
          <Column field="status" header="Estado" body={statusBodyTemplate} sortable></Column>
          <Column
            field="id"
            header="Acciones"
            body={(rowData: any) => {
              console.log('Renderizando botón de acción para agente:', rowData);
              return (
                <ActionButton 
                  actionAsignate={() => {
                    console.log('Se hizo clic en transferir al agente:', rowData);
                    transferChat(rowData).catch(error => {
                      console.error('Error en transferChat:', error);
                    });
                  }} 
                />
              );
            }}
          />
        </DataTable>
      </div>
    )
  }

  const allowExpansion = (rowData: any) => {
    return rowData.userCompanyGroup && rowData.userCompanyGroup.length > 0
  }

  // Log cuando el diálogo se muestra/oculta
  useEffect(() => {
    console.log('Estado del diálogo de transferencia:', dialogTransfer);
  }, [dialogTransfer]);

  return (
    <Dialog
      header="Transferir Chat"
      visible={dialogTransfer}
      onHide={() => {
        console.log('Cerrando diálogo de transferencia');
        setDialogTransfer(false);
      }}
      style={{ width: '50vw' }}
      breakpoints={{ '960px': '75vw', '641px': '90vw' }}
    >
      <div className="card">
        <DataTable
          value={groups}
          expandedRows={expandedRows}
          rowExpansionTemplate={rowExpansionTemplate}
          dataKey="id"
          header={headerButtons}
          tableStyle={{ minWidth: "60rem" }}
          loading={isLoading}
          onRowToggle={(e) => setExpandedRows(e.data)}
        >
          <Column expander={allowExpansion} style={{ width: "5rem" }} />
          <Column
            field="name"
            header="Nombre Grupo"
            sortable
          />
          <Column
            header="Cantidad De Integrantes de Grupo"
            sortable
            body={(rowData: any) => rowData.userCompanyGroup?.length || 0}
          />
        </DataTable>
      </div>
    </Dialog>
  )
}

export default DialogTransfer
