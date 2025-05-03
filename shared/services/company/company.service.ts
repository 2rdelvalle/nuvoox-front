/* eslint-disable max-len */
import { TableAprobations } from "@/app/(main)/admin/aprobations/(models)/table-aprobations-model"
import { CompanyCaratule, CompanyForm, NumbersOfMaintanceCaratule } from "@/shared/models"
import axios from "axios"

const companyEndpoint = `${process.env.NEXT_PUBLIC_URL_SIRA_BACK}/companies`
const companyService = {
  caratule: () => axios.get<CompanyCaratule[]>(`${companyEndpoint}/caratule`),
  caratuleFormSelects: () => axios.get<CompanyCaratule[]>(`${companyEndpoint}/caratuleFormSelects`),
  getnumbersOfMaintance: (companyId : number) => axios.get<NumbersOfMaintanceCaratule[]>(`${companyEndpoint}/getNumbersOfMaintance/${companyId}`),
  getAllCompanynumbersOfMaintanceForAprobation: () => axios.get<TableAprobations[]>(`${companyEndpoint}/getCompanyNumbersToAprobate`),
  getAllCompanynumbersOfMaintanceAprobateds: () => axios.get<TableAprobations[]>(`${companyEndpoint}/getCompanyNumbersAprobates`),
  create: (company: CompanyForm) => axios.post<CompanyForm>(companyEndpoint, company),
  findById: (companyId: string) => axios.get<CompanyForm>(`${companyEndpoint}/findByID/${companyId}`),
  update: (company: CompanyForm) => axios.put<CompanyForm>(companyEndpoint, company),
  aprobateNumberOfMaintanceCompany: (nom: NumbersOfMaintanceCaratule) => axios.post<CompanyForm>(`${companyEndpoint}/aprobateNumberOfMaintanceCompany`, nom),
  deleteById: (id: string) => axios.delete<CompanyForm>(`${companyEndpoint}/${id}`)
}
export default companyService
