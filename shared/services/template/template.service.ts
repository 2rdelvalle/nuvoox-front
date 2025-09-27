import { TemplateModel } from "@/shared/models/template/template.model"
import { MultimediaTemplateModel } from "@/shared/models/template/multimedia-template.model"
import { axiosInstance } from "@/shared/instances/axios-instance"
import {
  normalizeTemplate,
  normalizeTemplateCollection,
  NormalizedTemplate,
} from "./template-normalizer"
import type { AxiosResponse } from "axios"

// URL base para endpoints de plantillas
const templateEndpoint = `${process.env.NEXT_PUBLIC_URL_SIRA_BACK}/templates`

/**
 * Servicio para gestionar plantillas de mensajes
 */
const TemplateService = {
  /**
   * Obtiene todas las plantillas
   */
  getAll: async (): Promise<AxiosResponse<NormalizedTemplate[]>> => {
    const response = await axiosInstance.get<TemplateModel[]>(templateEndpoint)
    return {
      ...response,
      data: normalizeTemplateCollection(response.data),
    }
  },
  
  /**
   * Obtiene las plantillas de una empresa específica
   * @param companyId ID de la empresa
   */
  getAllByCompany: async (
    companyId: number,
  ): Promise<AxiosResponse<NormalizedTemplate[]>> => {
    const response = await axiosInstance.get<TemplateModel[]>(
      `${templateEndpoint}/company/${companyId}`,
    )

    return {
      ...response,
      data: normalizeTemplateCollection(response.data),
    }
  },
  
  /**
   * Guarda una plantilla básica de texto
   * @param template Datos de la plantilla a crear
   */
  save: async (template: TemplateModel): Promise<AxiosResponse<NormalizedTemplate>> => {
    const response = await axiosInstance.post<TemplateModel>(templateEndpoint, template)

    return {
      ...response,
      data: normalizeTemplate(response.data),
    }
  },
  
  /**
   * Crea una plantilla multimedia (con imagen, video, documento o audio)
   * @param multimediaTemplate Datos de la plantilla multimedia
   */
  saveMultimedia: async (
    multimediaTemplate: MultimediaTemplateModel,
  ): Promise<AxiosResponse<NormalizedTemplate>> => {
    try {
      const response = await axiosInstance.post<TemplateModel>(
        `${templateEndpoint}/multimedia`, 
        multimediaTemplate
      );
      return {
        ...response,
        data: normalizeTemplate(response.data),
      };
    } catch (error) {
      console.error('Error al crear plantilla multimedia:', error);
      throw error;
    }
  }
}

export default TemplateService
