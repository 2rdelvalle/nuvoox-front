import { generateUuid } from "../functions/generate-uuid"
import { Excel } from "./excel"

export function downloadExcel <T> (data : T[], name?: string) {
  Excel.convertArrayToFile(data, name || `Export-${generateUuid()}-${Date.now()}`)
}
