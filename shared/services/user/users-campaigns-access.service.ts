/**
 * Servicio para gestión de acceso a campañas por usuario
 * Permite a empresas habilitar/deshabilitar el acceso de sus agentes
 */

import { UserCaratule } from '@/shared/models/user/user.model';

interface UpdateCampaignAccessDto {
  canSendCampaigns: boolean;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export class UsersCampaignsAccessService {
  private readonly baseUrl = process.env.NEXT_PUBLIC_URL_SIRA_BACK;
  
  /**
   * Actualizar el acceso a campañas para un usuario
   * @param userId ID del usuario a modificar
   * @param canSendCampaigns Nuevo valor de acceso
   * @param authToken Token JWT de autenticación
   * @returns Usuario actualizado
   */
  async updateCampaignAccess(
    userId: number,
    canSendCampaigns: boolean,
    authToken: string
  ): Promise<UserCaratule> {
    const url = `${this.baseUrl}/users/${userId}/campaigns-access`;
    
    const requestBody: UpdateCampaignAccessDto = {
      canSendCampaigns
    };

    console.log(`[FRONTEND-API] [${new Date().toISOString()}] Iniciando updateCampaignAccess`);
    console.log(`[FRONTEND-API] URL: ${url}`);
    console.log(`[FRONTEND-API] Request Body:`, requestBody);
    console.log(`[FRONTEND-API] Auth Token presente: ${authToken ? 'Sí' : 'No'} (${authToken ? authToken.substring(0, 20) + '...' : 'N/A'})`);

    try {
      console.log(`[FRONTEND-API] Enviando PATCH request...`);
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log(`[FRONTEND-API] Response status: ${response.status} ${response.statusText}`);
      console.log(`[FRONTEND-API] Response headers:`, Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        console.log(`[FRONTEND-API] Response NOT OK - leyendo error body...`);
        const errorData = await response.json();
        console.log(`[FRONTEND-API] Error data:`, errorData);
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      console.log(`[FRONTEND-API] Response OK - leyendo result body...`);
      const result: ApiResponse<UserCaratule> = await response.json();
      console.log(`[FRONTEND-API] Raw result:`, result);
      
      if (!result.success || !result.data) {
        console.log(`[FRONTEND-API] Result validation failed - success: ${result.success}, data: ${result.data ? 'present' : 'missing'}`);
        throw new Error(result.message || 'Error al actualizar acceso a campañas');
      }

      console.log(`[FRONTEND-API] Result validation OK - User: ${result.data.name}, can_send_campaigns: ${result.data.can_send_campaigns}`);
      return result.data;
    } catch (error) {
      console.error('Error en UsersCampaignsAccessService.updateCampaignAccess:', error);
      throw error;
    }
  }
}

// Instancia singleton del servicio
export const usersCampaignsAccessService = new UsersCampaignsAccessService();