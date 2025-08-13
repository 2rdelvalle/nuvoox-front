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

    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const result: ApiResponse<UserCaratule> = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.message || 'Error al actualizar acceso a campañas');
      }

      return result.data;
    } catch (error) {
      console.error('Error en UsersCampaignsAccessService.updateCampaignAccess:', error);
      throw error;
    }
  }
}

// Instancia singleton del servicio
export const usersCampaignsAccessService = new UsersCampaignsAccessService();