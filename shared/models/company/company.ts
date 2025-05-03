import { GeneralErrors } from "../generalErrors"
import { STATUS_ENTITY } from "../utils"

export interface NumbersOfMaintanceCaratule {
  numberOfMaintanceId?: number
  number?: string
  IdAccountWB?: string
  IdAccountWBPFC?: string
  idNumberPhone?: string
  status?: STATUS_ENTITY
  indicative?: number
}

export interface CompanyForm extends GeneralErrors{
      companyId?: number
      name: string;
      email: string;
      phone: string;
      status?: string;
      address : string;
      country : string;
      city :string;
      quantityEmployees: number
      maxNumberOfMaintance : number;
      maxQuantityAgents: number;
      numbersOfMaintance: NumbersOfMaintanceCaratule[];
  }

export interface CompanyCaratule{
    companyId?: number
    name?: string;
  }
