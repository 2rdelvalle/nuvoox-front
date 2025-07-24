import { axiosInstance } from '@/shared/instances/axios-instance';
import { Campaign, Contact, CampaignProgress } from '../../models/campaign';

export interface CreateCampaignDto {
  name: string;
  type?: 'whatsapp';
  description?: string;
  agentGroupTag?: string;
  templateId: number;
  selectedAgentIds?: number[];
  companyId: number;
}

export interface UpdateCampaignDto {
  name?: string;
  description?: string;
  agentGroupTag?: string;
  templateId?: number;
  selectedAgentIds?: number[];
}

export interface CampaignResponseDto {
  id: number;
  name: string;
  type: string;
  description: string;
  agentGroupTag: string;
  contactsCsvPath: string;
  status: string;
  template: {
    id: number;
    name: string;
    textTemplate: string;
  };
  selectedAgents: Array<{
    id: number;
    name: string;
    mail: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ContactPreview {
  nombre: string;
  telefono: string;
  email?: string;
}

export class CampaignService {
  private static readonly BASE_URL = '/campaigns';

  /**
   * Crear una nueva campaña
   */
  static async create(campaignData: CreateCampaignDto): Promise<CampaignResponseDto> {
    const response = await axiosInstance.post(this.BASE_URL, campaignData);
    return response.data;
  }

  /**
   * Obtener todas las campañas de la empresa
   */
  static async getAll(): Promise<CampaignResponseDto[]> {
    const response = await axiosInstance.get(this.BASE_URL);
    return response.data;
  }

  /**
   * Obtener todas las campañas de una empresa específica
   */
  static async getAllByCompany(companyId: number): Promise<CampaignResponseDto[]> {
    const response = await axiosInstance.get(`${this.BASE_URL}/company/${companyId}`);
    return response.data;
  }

  /**
   * Obtener una campaña por ID
   */
  static async getById(id: number): Promise<CampaignResponseDto> {
    const response = await axiosInstance.get(`${this.BASE_URL}/${id}`);
    return response.data;
  }

  /**
   * Actualizar una campaña
   */
  static async update(id: number, campaignData: UpdateCampaignDto): Promise<CampaignResponseDto> {
    const response = await axiosInstance.patch(`${this.BASE_URL}/${id}`, campaignData);
    return response.data;
  }

  /**
   * Eliminar una campaña
   */
  static async delete(id: number): Promise<{ message: string }> {
    const response = await axiosInstance.delete(`${this.BASE_URL}/${id}`);
    return response.data;
  }

  /**
   * Procesar archivo CSV de contactos
   */
  static async uploadContacts(filePath: string): Promise<{
    message: string;
    filePath: string;
    contactsCount: number;
  }> {
    const response = await axiosInstance.post(`${this.BASE_URL}/upload-contacts`, {
      filePath
    });
    return response.data;
  }

  /**
   * Preview contacts from CSV file
   */
  static async previewContacts(file: File): Promise<Contact[]> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axiosInstance.post(`${this.BASE_URL}/preview-contacts`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  /**
   * Get campaign progress and status
   */
  static async getCampaignProgress(campaignId: number): Promise<CampaignProgress> {
    const response = await axiosInstance.get(`/campaigns/${campaignId}/progress`);
    return response.data;
  }
}
