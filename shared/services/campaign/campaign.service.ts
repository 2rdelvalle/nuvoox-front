import { axiosInstance } from '../../instances/axios-instance';
import { getCookieToken } from '../../utilities/functions/sessionUtils';
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
    try {
      console.log('[DEBUG FRONTEND] Enviando datos campaña:', campaignData);
      // Verificar si el token se agregará por el interceptor
      const tokenFromCookie = getCookieToken();
      console.log('[DEBUG FRONTEND] Token desde cookie (será agregado por interceptor):', tokenFromCookie ? 'SÍ' : 'NO');
      if (tokenFromCookie) {
        console.log('[DEBUG FRONTEND] Token (primeros 50 chars):', tokenFromCookie.substring(0, 50) + '...');
      }
      console.log('[DEBUG FRONTEND] URL completa:', this.BASE_URL);
      
      const response = await axiosInstance.post(this.BASE_URL, campaignData);
      console.log('[DEBUG FRONTEND] Campaña creada exitosamente:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[ERROR FRONTEND] Fallo al guardar campaña:', error);
      if (error.response) {
        console.error('[ERROR FRONTEND] Código de estado:', error.response.status);
        console.error('[ERROR FRONTEND] Respuesta del servidor:', error.response.data);
        console.error('[ERROR FRONTEND] Headers de respuesta:', error.response.headers);
      }
      throw error;
    }
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

  /**
   * Send campaign manually using the new independent delivery service
   */
  static async sendCampaign(campaignId: number): Promise<{ message: string; campaignId: number }> {
    const requestId = `frontend_send_${Date.now()}`;
    console.log(`[CAMPAIGN-SERVICE-FRONTEND][${requestId}] 🚀 Iniciando envío de campaña ID: ${campaignId}`);
    
    try {
      // Debug: Verificar configuración de axios
      console.log(`[CAMPAIGN-SERVICE-FRONTEND][${requestId}] 🔍 Configuración axios:`, {
        baseURL: axiosInstance.defaults.baseURL,
        headers: axiosInstance.defaults.headers,
        timeout: axiosInstance.defaults.timeout
      });
      
      // TODO: Cambiar al nuevo endpoint independiente una vez que esté completamente funcional
      // const response = await axiosInstance.post(`/campaign-delivery/send/${campaignId}`);
      
      const endpoint = `/campaigns/${campaignId}/send`;
      console.log(`[CAMPAIGN-SERVICE-FRONTEND][${requestId}] 📤 Enviando POST a: ${endpoint}`);
      
      // Por ahora, usar el endpoint existente para evitar romper producción
      const response = await axiosInstance.post(endpoint);
      
      console.log(`[CAMPAIGN-SERVICE-FRONTEND][${requestId}] ✅ Respuesta exitosa:`, {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
      
      return response.data;
      
    } catch (error: any) {
      console.error(`[CAMPAIGN-SERVICE-FRONTEND][${requestId}] ❌ Error enviando campaña:`, {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      
      throw error; // Re-lanzar para que el componente lo maneje
    }
  }
}
