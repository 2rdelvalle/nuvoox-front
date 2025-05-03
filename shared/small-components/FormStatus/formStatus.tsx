import { Message } from "primereact/message"

type FormStateProps = {
    isValid: boolean
    isDirty: boolean
}

function FormStatus (data : FormStateProps) {
  const { isValid, isDirty } = data
  return (
    <>
    {!isDirty
      ? <Message severity="info" />
      : !isValid ? <Message severity="error" /> : <Message severity="success" />
    }
    </>
  )
}

export default FormStatus
