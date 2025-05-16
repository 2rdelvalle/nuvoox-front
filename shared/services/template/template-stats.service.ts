import axios from 'axios';

/**
 * Interfaz para estadísticas de plantillas por categoría
 */
export interface TemplateStats {
  marketing: number;
  utility: number;
  authentication: number;
}

// URL base de la API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/nuvoox/api';

/**
 * Servicio para obtener estadísticas de plantillas
 * Sigue el patrón de arquitectura Screaming
 */
export class TemplateStatsService {
  /**
   * Obtiene las estadísticas de plantillas por categoría para una empresa específica
   * @param companyId - ID de la empresa
   * @returns Objeto con estadísticas de plantillas por categoría
   */
  static async getTemplateStats(companyId: string | number): Promise<{
    marketing: number;
    utility: number;
    authentication: number;
  }> {
    try {
      // Aseguramos que el companyId sea string
      const id = companyId.toString();
      
      // Llamada a la API con la URL base configurada
      const response = await axios.get(`${API_BASE_URL}/templates/stats/${id}`);
      console.log(`[DEBUG] URL: ${API_BASE_URL}/templates/stats/${id}`);
      
      // Log para debugging
      console.log('[TemplateStatsService] Respuesta:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('[TemplateStatsService] Error:', error);
      // Devolvemos un objeto vacío en caso de error para no romper la UI
      return {
        marketing: 0,
        utility: 0,
        authentication: 0
      };
    }
  }
}
