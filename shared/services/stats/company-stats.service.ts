import axios from 'axios';

// URL base de la API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/nuvoox/api';

/**
 * Interfaz para las estadísticas de la empresa
 */
export interface CompanyStats {
  messagesSent: number;
  messagesReceived: number;
  templates: {
    total: number;
    marketing: number;
    utility: number;
    authentication: number;
  };
  dailySentMessages: number[];
  dailyReceivedMessages: number[];
  daysLabels: string[];
}

/**
 * Obtiene las estadísticas de la empresa desde la base de datos
 * @param companyId - ID de la empresa
 * @param startDate - Fecha de inicio (formato YYYY-MM-DD)
 * @param endDate - Fecha de fin (formato YYYY-MM-DD)
 * @returns Estadísticas de la empresa
 */
export async function getCompanyStatsFromDatabase(
  companyId: number,
  startDate: string,
  endDate: string
): Promise<CompanyStats> {
  try {
    // Aseguramos que el companyId sea string
    const id = companyId.toString();
    
    // Construir la URL con los parámetros de consulta
    const url = `${API_BASE_URL}/companies/${id}/stats?startDate=${startDate}&endDate=${endDate}`;
    
    // Log para debugging
    console.log(`[CompanyStatsService] Solicitando estadísticas para compañía ${id} desde ${startDate} hasta ${endDate}`);
    console.log(`[DEBUG] URL: ${url}`);
    
    // Hacer la solicitud a la API
    const response = await axios.get(url);
    
    // Log para debugging
    console.log('[CompanyStatsService] Respuesta:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('Error al obtener estadísticas de la empresa:', error);
    
    // Si no hay datos disponibles o hay un error, devolver datos por defecto
    return {
      messagesSent: 0,
      messagesReceived: 0,
      templates: {
        total: 0,
        marketing: 0,
        utility: 0,
        authentication: 0
      },
      dailySentMessages: [0, 0, 0, 0, 0, 0, 0],
      dailyReceivedMessages: [0, 0, 0, 0, 0, 0, 0],
      daysLabels: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
    };
  }
}

/**
 * Servicio para obtener estadísticas de la empresa a través de la API de Next.js
 */
export class CompanyStatsService {
  /**
   * Obtiene las estadísticas de la empresa para el rango de fechas especificado
   * @param companyId - ID de la empresa
   * @param dateRange - Rango de fechas
   * @returns Estadísticas de la empresa
   */
  static async getCompanyStats(
    companyId: number,
    dateRange: { startDate: Date; endDate: Date }
  ): Promise<CompanyStats> {
    try {
      // Formatear fechas para la API
      const startDate = dateRange.startDate.toISOString().split('T')[0];
      const endDate = dateRange.endDate.toISOString().split('T')[0];
      
      // Hacer la solicitud a la API de Next.js
      const response = await fetch(
        `/api/company/${companyId}/stats?startDate=${startDate}&endDate=${endDate}`
      );
      
      if (!response.ok) {
        throw new Error('Error al obtener estadísticas de la empresa');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error al obtener estadísticas de la empresa:', error);
      
      // Si hay un error, devolver datos por defecto
      return {
        messagesSent: 0,
        messagesReceived: 0,
        templates: {
          total: 0,
          marketing: 0,
          utility: 0,
          authentication: 0
        },
        dailySentMessages: [0, 0, 0, 0, 0, 0, 0],
        dailyReceivedMessages: [0, 0, 0, 0, 0, 0, 0],
        daysLabels: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
      };
    }
  }
}
