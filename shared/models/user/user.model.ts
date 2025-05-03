import { FIELD_VALIDATIONS, GENERAL_VALIDATIONS } from "@/shared/constants/validations-text"
import { z } from "zod"
import { CompanyCaratule, NumbersOfMaintanceCaratule } from "../company"
import { RoleCaratule } from "../role"
import { typeDocumentCaratule } from "../typeDocument"
import { GeneralErrors } from "../generalErrors"

export interface UserFormModel extends GeneralErrors{
        userId: number;
        name: string;
        mail: string;
        password?: string;
        phone: string;
        document: string;
        status: string;
        role: RoleCaratule;
        typeDocument: typeDocumentCaratule;
        company: CompanyCaratule;
        userNumbersToMaintance?: NumbersOfMaintanceCaratule[]
        canEditAll?: boolean;
        canEditCompany?: boolean;
}

export interface UserCaratule {
  userId: number;
  name: string;
  mail: string;
  company: CompanyCaratule
  role: RoleCaratule;
}

export interface UserChangePassword {
  userId: number;
  password: string;
}

export const UserSchema = z.object({
  mail: z.string().email({ message: FIELD_VALIDATIONS.EMAIL_REQUIRED }),
  // password: z.string().min(3, { message: FIELD_VALIDATIONS.PASSWORD_MIN_LENGTH }),
  document: z.string().min(8, { message: FIELD_VALIDATIONS.DOCUMENT_MIN_LENGTH }),
  name: z.string()
    .min(GENERAL_VALIDATIONS.DEFAULT_MIN_LENGT_NAME,
      { message: `El nombre debe tener al menos ${GENERAL_VALIDATIONS.DEFAULT_MIN_LENGT_NAME} caracteres.` })
    .max(GENERAL_VALIDATIONS.DEFAULT_MAX_LENGTH_NAME,
      { message: `El nombre debe tener como máximo ${GENERAL_VALIDATIONS.DEFAULT_MAX_LENGTH_NAME} caracteres.` })
})

export const SCHEMA_USER = z.object({
  name: z.string().min(1, { message: "Requerido" }),
  mail: z.string().email({ message: "Correo Electronico Invalido" }).min(1, { message: "Requerido" }),
  phone: z.string().min(10, { message: "Telefono Invalido" }).max(10, { message: "Telefono Invalido" })
    .regex(/^\d+$/, { message: "El documento debe contener solo números" }),
  document: z
    .string()
    .min(1, { message: "Requerido" })
    .regex(/^\d+$/, { message: "El documento debe contener solo números" }),
  typeDocumentId: z.string().min(1, { message: "Requerido" })
})
