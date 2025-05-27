import { Button } from "primereact/button"
import React from "react"

// Definición de la interfaz para los botones de acción
interface PropsActionButton {
  actionDelete?: () => void;
  actionEye?: () => void;
  actionPencil?: () => void;
  actionAsignate?: () => void;
  actionCharge?: () => void;
  actionRecharge?: () => void; // Nueva acción para recargar saldo
}

const ActionButton = (props : PropsActionButton) => {
  const {
    actionDelete,
    actionEye,
    actionPencil,
    actionAsignate,
    actionCharge,
    actionRecharge
  } = props

  return (
    <div className="flex flex-nowrap gap-2">
        {actionEye && <Button icon="pi pi-eye"
            type="button" onClick={actionEye} rounded text raised severity="info" aria-label="View" />}
        {actionPencil && <Button icon="pi pi-pencil"
            type="button" onClick={actionPencil} rounded text raised severity="warning" aria-label="Edit" />}
        {actionDelete && <Button icon="pi pi-trash"
            type="button" onClick={actionDelete} rounded text raised severity="danger" aria-label="Delete" />}
        {actionAsignate && <Button icon="pi pi-user"
            type="button" onClick={actionAsignate} rounded text raised severity="danger" aria-label="Asignate" />}
        {actionCharge && <Button icon="pi pi-upload"
            type="button" onClick={actionCharge} rounded text raised severity="danger" aria-label="Carga" />}
        {actionRecharge && <Button icon="pi pi-dollar"
            type="button" onClick={actionRecharge} rounded text raised severity="success" aria-label="Recargar Saldo" tooltip="Recargar Saldo" tooltipOptions={{ position: 'top' }} />}
    </div>

  )
}
export default ActionButton
