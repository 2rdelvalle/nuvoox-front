import { typeDocument, typeDocumentCaratule } from "@/shared/models/typeDocument"
import axios, { HttpStatusCode } from "axios"

const typeDocumentEndpoint = `${process.env.NEXT_PUBLIC_URL_SIRA_BACK}/type-documents`
const TypeDocumentService = {
  getAll: async () => axios.get<typeDocument[]>(typeDocumentEndpoint),
  findByName: async (name: string) => axios.get<typeDocument>(`${typeDocumentEndpoint}/name/${name}`),
  caratule: async (name: string) => axios.get<typeDocumentCaratule>(`${typeDocumentEndpoint}/caratule`),
  save: async (typeDocument: typeDocument) => axios.post<typeDocument>(typeDocumentEndpoint, typeDocument),
  update: async (typeDocument: typeDocument) => axios.put<typeDocument>(typeDocumentEndpoint, typeDocument),
  getById: async (typeDocumentId: number) => axios.get<typeDocument>(`${typeDocumentEndpoint}/${typeDocumentId}`),
  deleteById: async (typeDocumentId: number) => axios.delete(`${typeDocumentEndpoint}/${typeDocumentId}`),
  changeStatus: async (typeDocumentId: number) => axios.patch<typeDocument>(`${typeDocumentEndpoint}/status/${typeDocumentId}`)
}
export default TypeDocumentService

export async function validateExistByNameTypeDocument (name : string) : Promise<typeDocument | undefined> {
  return TypeDocumentService.findByName(name).then((res) => {
    if (res.status === HttpStatusCode.Ok) {
      return res.data
    }
    return undefined
  })
}
