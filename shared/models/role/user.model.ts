import { GENERAL_VALIDATIONS } from "@/shared/constants/validations-text"
import { z } from "zod"
import { GeneralErrors } from "../generalErrors/generalError"
export interface Role extends GeneralErrors{
    roleId?: number;
    description: string;
    name: string;
  }

export interface RoleCaratule {
  roleId: number;
  name?: string;
}

export const RoleSchema = z.object({
  name: z.string()
    .min(GENERAL_VALIDATIONS.DEFAULT_MIN_LENGT_NAME,
      { message: `El nombre debe tener al menos ${GENERAL_VALIDATIONS.DEFAULT_MIN_LENGT_NAME} caracteres.` })
    .max(GENERAL_VALIDATIONS.DEFAULT_MAX_LENGTH_NAME,
      { message: `El nombre debe tener como máximo ${GENERAL_VALIDATIONS.DEFAULT_MAX_LENGTH_NAME} caracteres.` })
})

export const SCHEMA_USER = z.object({
  name: z.string().min(1, { message: "Requerido" })
})
