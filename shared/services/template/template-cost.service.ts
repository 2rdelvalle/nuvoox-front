import { TariffService } from '../tariff/tariff.service';

/**
 * Servicio para calcular costos de envío de plantillas
 * Incluye lógica para aplicar tarifas personalizadas por empresa
 */
export class TemplateCostService {
  // Costos base por tipo de plantilla y país
  private static readonly BASE_COSTS = {
    // Costos para Colombia
    CO: {
      marketing: 0.0125,
      utility: 0.0050,
      authentication: 0.0035,
      default: 0.0125 // Costo predeterminado si no se especifica tipo
    },
    // Costos para México
    MX: {
      marketing: 0.0130,
      utility: 0.0055,
      authentication: 0.0040,
      default: 0.0130
    },
    // Costos predeterminados para otros países
    default: {
      marketing: 0.0135,
      utility: 0.0060,
      authentication: 0.0045,
      default: 0.0135
    }
  };

  /**
   * Calcula el costo total de envío de una plantilla
   * @param companyId - ID de la empresa
   * @param templateType - Tipo de plantilla (marketing, utility, authentication)
   * @param country - País de destino (código ISO de 2 letras, ej: CO, MX)
   * @returns Costo total (costo base + tarifa personalizada)
   */
  static async calculateTotalCost(
    companyId: number,
    templateType: string,
    country: string
  ): Promise<number> {
    try {
      // Normalizar valores para evitar problemas
      const normalizedType = (templateType || 'marketing').toLowerCase();
      const normalizedCountry = (country || 'default').toUpperCase();
      
      // 1. Obtener costo base según tipo y país
      const baseCost = this.getBaseCost(normalizedType, normalizedCountry);
      
      // 2. Obtener tarifa personalizada de la empresa
      const additionalCost = await TariffService.calculateAdditionalCost(
        companyId,
        normalizedType,
        normalizedCountry
      );
      
      // 3. Calcular costo total
      const totalCost = baseCost + additionalCost;
      
      // Registrar para debugging
      console.log(`[TemplateCostService] Cálculo de costo para empresa ${companyId}:`, {
        templateType: normalizedType,
        country: normalizedCountry,
        baseCost,
        additionalCost,
        totalCost
      });
      
      return totalCost;
    } catch (error) {
      console.error('Error al calcular costo total:', error);
      // En caso de error, devolver solo el costo base
      return this.getBaseCost(
        (templateType || 'marketing').toLowerCase(),
        (country || 'default').toUpperCase()
      );
    }
  }

  /**
   * Obtiene el costo base para un tipo de plantilla y país
   * @param templateType - Tipo de plantilla normalizado
   * @param country - País normalizado
   * @returns Costo base
   */
  public static getBaseCost(templateType: string, country: string): number {
    // Verificar si tenemos costos para el país específico
    const countryCosts = this.BASE_COSTS[country as keyof typeof this.BASE_COSTS] || this.BASE_COSTS.default;
    
    // Obtener costo para el tipo de plantilla o usar el predeterminado
    return countryCosts[templateType as keyof typeof countryCosts] || countryCosts.default;
  }

  /**
   * Calcula el costo total para múltiples destinatarios
   * @param companyId - ID de la empresa
   * @param templateType - Tipo de plantilla
   * @param country - País de destino
   * @param recipientCount - Número de destinatarios
   * @returns Costo total para todos los destinatarios
   */
  static async calculateBulkCost(
    companyId: number,
    templateType: string,
    country: string,
    recipientCount: number
  ): Promise<number> {
    const unitCost = await this.calculateTotalCost(companyId, templateType, country);
    return unitCost * recipientCount;
  }
}
