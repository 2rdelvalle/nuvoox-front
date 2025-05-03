import { typeWithKey } from "@/shared/models"

export const getValidationErrors = (errorCode: any) => {
  const codeMatcher : typeWithKey<string> = {
    ERR_NETWORK: "Error de Conexion",
    ERR_BAD_REQUEST: "Error de Uso/ Solicitud"
  }

  return codeMatcher[errorCode] || "Error desconocido"
}
