import { TemplateModel } from "@/shared/models/template/template.model"
import axios from "axios"

const templateEndpoint = `${process.env.NEXT_PUBLIC_URL_SIRA_BACK}/templates`
const TypeDocumentService = {
  getAll: async () => axios.get<TemplateModel[]>(templateEndpoint),
  getAllByCompany: (companyId : number) => axios.get<TemplateModel[]>(`${templateEndpoint}/company/${companyId}`),
  save: async (template: TemplateModel) => axios.post<TemplateModel>(templateEndpoint, template)
}
export default TypeDocumentService
