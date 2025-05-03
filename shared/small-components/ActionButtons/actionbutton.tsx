import { Button } from "primereact/button"
import { PropsActionButton } from "./types/propsActionButton"

const ActionButton = (props : PropsActionButton) => {
  const {
    actionDelete,
    actionEye,
    actionPencil,
    actionAsignate,
    actionCharge
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
    </div>

  )
}
export default ActionButton
