import { GeneralErrors } from "../generalErrors/generalError"
import { STATUS_ENTITY } from "../utils"
export interface typeDocument extends GeneralErrors{
    typeDocumentId?: number;
    name?: string;
    status?: STATUS_ENTITY;
}
export interface typeDocumentCaratule extends GeneralErrors{
    typeDocumentId?: number;
    name?: string;
}
