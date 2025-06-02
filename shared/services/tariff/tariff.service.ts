import axios from 'axios';
import { TariffConfig } from '@/shared/components/tariffs/CompanyTariffModal';

// URL base de la API
// Configuramos para usar la API mock de Next.js en lugar del backend
const API_BASE_URL = '/api';

// Nota: Cuando el endpoint del backend esté disponible, usar esta línea en su lugar:
// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/nuvoox/api';

/**
 * Servicio para gestionar tarifas personalizadas por empresa
 * Permite añadir costos adicionales al envío de plantillas según diferentes criterios
 */
export class TariffService {
  /**
   * Obtiene las tarifas configuradas para una empresa específica
   * @param companyId - ID de la empresa
   * @returns Lista de tarifas configuradas
   */
  static async getCompanyTariffs(companyId: number): Promise<TariffConfig[]> {
    try {
      // Aseguramos que el companyId sea string
      const id = companyId.toString();
      
      // Log para debugging
      console.log(`[TariffService] Solicitando tarifas para compañía ${id}`);
      
      // Hacer la solicitud a la API
      const response = await axios.get(`${API_BASE_URL}/tariffs/company/${id}`);
      
      // Log para debugging
      console.log('[TariffService] Respuesta:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error al obtener tarifas de la empresa:', error);
      
      // Si no hay datos disponibles o hay un error, devolver array vacío
      return [];
    }
  }

  /**
   * Crea una nueva tarifa para una empresa
   * @param tariff - Datos de la tarifa a crear
   * @returns Tarifa creada
   */
  static async createTariff(tariff: TariffConfig): Promise<TariffConfig> {
    try {
      // Log para debugging
      console.log(`[TariffService] Creando tarifa para compañía ${tariff.companyId}`);
      
      // Hacer la solicitud a la API
      const response = await axios.post(`${API_BASE_URL}/tariffs`, tariff);
      
      // Log para debugging
      console.log('[TariffService] Respuesta:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error al crear tarifa:', error);
      throw error;
    }
  }

  /**
   * Actualiza una tarifa existente
   * @param tariffId - ID de la tarifa a actualizar
   * @param tariff - Nuevos datos de la tarifa
   * @returns Tarifa actualizada
   */
  static async updateTariff(tariffId: number, tariff: TariffConfig): Promise<TariffConfig> {
    try {
      // Log para debugging
      console.log(`[TariffService] Actualizando tarifa ${tariffId}`);
      
      // Hacer la solicitud a la API
      const response = await axios.put(`${API_BASE_URL}/tariffs/${tariffId}`, tariff);
      
      // Log para debugging
      console.log('[TariffService] Respuesta:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error al actualizar tarifa:', error);
      throw error;
    }
  }

  /**
   * Elimina una tarifa existente
   * @param tariffId - ID de la tarifa a eliminar
   * @returns True si se eliminó correctamente
   */
  static async deleteTariff(tariffId: number): Promise<boolean> {
    try {
      // Log para debugging
      console.log(`[TariffService] Eliminando tarifa ${tariffId}`);
      
      // Hacer la solicitud a la API
      await axios.delete(`${API_BASE_URL}/tariffs/${tariffId}`);
      
      // Log para debugging
      console.log('[TariffService] Tarifa eliminada correctamente');
      
      return true;
    } catch (error) {
      console.error('Error al eliminar tarifa:', error);
      throw error;
    }
  }

  /**
   * Calcula el costo adicional para un envío de plantilla según configuración de la empresa
   * @param companyId - ID de la empresa
   * @param templateType - Tipo de plantilla (marketing, utility, authentication)
   * @param country - País de destino (código ISO)
   * @returns Costo adicional a aplicar
   */
  static async calculateAdditionalCost(
    companyId: number, 
    templateType: string,
    country: string
  ): Promise<number> {
    try {
      // Log para debugging
      console.log(`[TariffService] Calculando costo adicional para compañía ${companyId}, tipo ${templateType}, país ${country}`);
      
      // Obtener tarifas de la empresa
      const tariffs = await this.getCompanyTariffs(companyId);
      
      if (!tariffs || tariffs.length === 0) {
        return 0; // No hay tarifas configuradas
      }
      
      // Buscar tarifa específica (primero la más específica)
      // 1. Coincidencia exacta de tipo y país
      const exactMatch = tariffs.find(t => 
        t.templateType === templateType && 
        t.country === country
      );
      
      if (exactMatch) {
        return exactMatch.additionalCost;
      }
      
      // 2. Coincidencia de tipo para todos los países
      const typeMatch = tariffs.find(t => 
        t.templateType === templateType && 
        t.country === 'all'
      );
      
      if (typeMatch) {
        return typeMatch.additionalCost;
      }
      
      // 3. Coincidencia de país para todos los tipos
      const countryMatch = tariffs.find(t => 
        t.templateType === 'all' && 
        t.country === country
      );
      
      if (countryMatch) {
        return countryMatch.additionalCost;
      }
      
      // 4. Tarifa genérica para todos los tipos y países
      const genericMatch = tariffs.find(t => 
        t.templateType === 'all' && 
        t.country === 'all'
      );
      
      if (genericMatch) {
        return genericMatch.additionalCost;
      }
      
      // No se encontró ninguna tarifa aplicable
      return 0;
    } catch (error) {
      console.error('Error al calcular costo adicional:', error);
      return 0; // En caso de error, no aplicar costo adicional
    }
  }
}
