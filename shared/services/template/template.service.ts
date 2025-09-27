import { TemplateModel } from "@/shared/models/template/template.model"
import { MultimediaTemplateModel } from "@/shared/models/template/multimedia-template.model"
import axios from "axios"

// URL base para endpoints de plantillas
const templateEndpoint = `${process.env.NEXT_PUBLIC_URL_SIRA_BACK}/templates`

/**
 * Servicio para gestionar plantillas de mensajes
 */
const TemplateService = {
  /**
   * Obtiene todas las plantillas
   */
  getAll: async () => axios.get<TemplateModel[]>(templateEndpoint),
  
  /**
   * Obtiene las plantillas de una empresa específica
   * @param companyId ID de la empresa
   */
  getAllByCompany: (companyId: number) => axios.get<TemplateModel[]>(`${templateEndpoint}/company/${companyId}`),
  
  /**
   * Guarda una plantilla básica de texto
   * @param template Datos de la plantilla a crear
   */
  save: async (template: TemplateModel) => axios.post<TemplateModel>(templateEndpoint, template),
  
  /**
   * Crea una plantilla multimedia (con imagen, video, documento o audio)
   * @param multimediaTemplate Datos de la plantilla multimedia
   */
  saveMultimedia: async (multimediaTemplate: MultimediaTemplateModel) => {
    try {
      const response = await axios.post<MultimediaTemplateModel>(
        `${templateEndpoint}/multimedia`,
        multimediaTemplate
      );
      return response;
    } catch (error) {
      console.error('Error al crear plantilla multimedia:', error);
      throw error;
    }
  }
}

export default TemplateService
