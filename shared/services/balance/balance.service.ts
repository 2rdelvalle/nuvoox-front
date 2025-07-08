import { axiosInstance } from '../../instances/axios-instance';
import { AxiosResponse, AxiosError } from 'axios';
import { CompanyBalanceDto, RechargeBalanceDto } from './dtos/company-balance.dto';
import { BalanceTransactionDto, BalanceTransactionFilterDto } from './dtos/balance-transaction.dto';
import { TemplateCostService } from '../template/template-cost.service';

// Utilidad para imprimir logs solo en producción o si está habilitada la depuración
const DEBUG_BALANCE = true; // Forzar logs para diagnóstico inmediato
const isProduction = process.env.NODE_ENV === 'production';
const debugLog = (message: string, ...data: any[]) => {
  if (isProduction || DEBUG_BALANCE) {
    console.log(`[BalanceService-DEBUG] ${message}`, ...data);
  }
};

// Utilidad para loguear errores detallados
const debugError = (message: string, error: any) => {
  if (isProduction || DEBUG_BALANCE) {
    console.error(`[BalanceService-DEBUG-ERROR] ${message}`);
    if (error?.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else if (error?.request) {
      console.error('Request sent but no response received');
      console.error('Request:', error.request);
    } else {
      console.error('Error sin request:', error.message || error);
    }
    console.error('Config:', error?.config);
  }
};

// Extendemos la interfaz CompanyBalanceDto para incluir información adicional
export interface ExtendedCompanyBalanceDto extends CompanyBalanceDto {
  amountDeducted?: number;
  costDetails?: { baseCost: number; additionalCost: number };
  apiError?: {
    status: number | string;
    message: string;
  } | null;
  cacheOnly?: boolean; // Indica si el cambio solo afectó al caché local
  message?: string; // Mensaje informativo sobre el estado de la operación
}

/**
 * Servicio para gestionar el saldo de las empresas
 */
class BalanceService {
  private static instance: BalanceService;
  // Caché local para almacenar los saldos más recientes cuando el backend está desactualizado
  private balanceCache: Map<string | number, { balanceUSD: number, timestamp: number }> = new Map();
  
  private constructor() {}

  public static getInstance(): BalanceService {
    if (!BalanceService.instance) {
      BalanceService.instance = new BalanceService();
    }
    return BalanceService.instance;
  }

  /**
   * Recarga saldo a una empresa
   * @param rechargeDto Datos de la recarga
   * @returns Balance actualizado
   */
  public async rechargeBalance(rechargeDto: RechargeBalanceDto): Promise<CompanyBalanceDto> {
    const companyId = rechargeDto.companyId;
    try {
      // Primero, obtenemos el saldo actual para asegurar la acumulación correcta
      const currentBalance = await this.getBalance(rechargeDto.companyId);
      console.log('Saldo actual antes de recarga:', currentBalance);
      
      // Validación y normalización del saldo actual
      let currentBalanceUSD = 0;
      if (typeof currentBalance.balanceUSD === 'number') {
        currentBalanceUSD = currentBalance.balanceUSD;
      } else if (typeof currentBalance.balanceUSD === 'string') {
        currentBalanceUSD = parseFloat(currentBalance.balanceUSD);
      } else if ((currentBalance as any)['balance_usd'] !== undefined) {
        // Soporte para posible estructura alternativa del backend
        const balanceUsdValue = (currentBalance as any)['balance_usd'];
        currentBalanceUSD = typeof balanceUsdValue === 'number' ? 
                           balanceUsdValue : 
                           parseFloat(balanceUsdValue as string);
      }
      
      // Realizamos la recarga en el backend
      const response: AxiosResponse<CompanyBalanceDto> = await axiosInstance.post(
        `/balance/recharge`,
        rechargeDto
      );
      
      console.log('Respuesta inicial del backend tras recarga:', response.data);
      
      // Intentamos obtener el balance actualizado con reintentos
      const updatedBalance = await this.getUpdatedBalanceWithRetry(rechargeDto.companyId, currentBalanceUSD, rechargeDto.amountUSD);
      
      // Creamos un objeto de respuesta final
      const result: CompanyBalanceDto = {
        ...response.data,
        ...updatedBalance,
        lastUpdated: new Date()
      };
      
      // Actualizamos nuestro caché local con el saldo calculado
      const cacheKey = String(companyId);
      this.balanceCache.set(cacheKey, {
        balanceUSD: result.balanceUSD as number,
        timestamp: Date.now()
      });
      
      console.log('Saldo final acumulado con información del backend y guardado en caché:', result);
      return result;
    } catch (error) {
      console.error('Error al recargar saldo:', error);
      throw error;
    }
  }

  /**
   * Obtiene el saldo actual de una empresa
   * @param companyId ID de la empresa
   * @param bypassCache Si es true, ignora el caché local y siempre consulta al backend
   * @returns Balance actual
   */
  public async getBalance(companyId: number | string, bypassCache: boolean = false): Promise<CompanyBalanceDto> {
    try {
      // Verificamos si tenemos un valor en caché que no sea muy antiguo (menos de 5 minutos)
      const cacheKey = String(companyId);
      const cachedData = this.balanceCache.get(cacheKey);
      const now = Date.now();
      const cacheMaxAge = 5 * 60 * 1000; // 5 minutos en milisegundos
      
      // Si tenemos datos en caché recientes y no se solicita explicitamente ignorar el caché
      if (!bypassCache && cachedData && (now - cachedData.timestamp) < cacheMaxAge) {
        console.log(`Usando saldo en caché para companyId ${companyId}:`, cachedData);
        
        // Obtener los datos del backend para actualizar el caché en segundo plano
        this.refreshCacheInBackground(companyId);
        
        // Creamos un objeto de respuesta usando el valor en caché
        return {
          companyId: Number(companyId),
          balanceUSD: cachedData.balanceUSD,
          exchangeRate: 0, // Se actualizará con datos del backend si están disponibles
          lastUpdated: new Date(cachedData.timestamp)
        };
      }
      
      // Añadimos un timestamp como query parameter para evitar el caché del navegador
      const timestamp = Date.now();
      const response: AxiosResponse<CompanyBalanceDto> = await axiosInstance.get(
        `/balance/company/${companyId}?_t=${timestamp}`,
        {
          // Configuración para evitar el caché
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
      
      console.log(`Saldo obtenido fresco para companyId ${companyId}:`, response.data);
      
      // Si tenemos un valor en caché más reciente (por una recarga), usamos ese valor en lugar del backend
      if (cachedData) {
        // Verificar si el valor del backend es sospechosamente más bajo que el caché
        let backendBalance = 0;
        if (typeof response.data.balanceUSD === 'number') {
          backendBalance = response.data.balanceUSD;
        } else if (typeof response.data.balanceUSD === 'string') {
          backendBalance = parseFloat(response.data.balanceUSD);
        }
        
        // Si el backend devuelve un valor significativamente menor que nuestro caché reciente
        if (backendBalance < cachedData.balanceUSD * 0.95) { // 5% de tolerancia
          console.log(`ADVERTENCIA: El backend devuelve un saldo menor (${backendBalance}) que nuestro caché (${cachedData.balanceUSD}). Usando valor del caché.`);
          
          // Creamos un objeto que combine los datos del backend con nuestro balance en caché
          return {
            ...response.data,
            balanceUSD: cachedData.balanceUSD
          };
        }
      }
      
      // Actualizamos el caché con el valor del backend
      // Solo si no tenemos un valor en caché o si el backend devuelve un valor mayor
      let balanceValue = 0;
      if (typeof response.data.balanceUSD === 'number') {
        balanceValue = response.data.balanceUSD;
      } else if (typeof response.data.balanceUSD === 'string') {
        balanceValue = parseFloat(response.data.balanceUSD);
      }
      
      if (!cachedData || balanceValue > cachedData.balanceUSD) {
        this.balanceCache.set(cacheKey, {
          balanceUSD: balanceValue,
          timestamp: now
        });
      }
      
      return response.data;
    } catch (error) {
      console.error('Error al obtener saldo:', error);
      
      // Si hay un error pero tenemos datos en caché, los usamos como respaldo
      const cacheKey = String(companyId);
      const cachedData = this.balanceCache.get(cacheKey);
      
      if (cachedData) {
        console.log('Error al obtener saldo del backend. Usando datos en caché como respaldo.');
        return {
          companyId: Number(companyId),
          balanceUSD: cachedData.balanceUSD,
          exchangeRate: 0,
          lastUpdated: new Date(cachedData.timestamp)
        };
      }
      
      throw error;
    }
  }
  
  /**
   * Actualiza el caché en segundo plano sin bloquear la interfaz
   */
  private refreshCacheInBackground(companyId: number | string): void {
    // Ejecutamos una solicitud al backend sin esperar su respuesta
    setTimeout(async () => {
      try {
        await this.getBalance(companyId, true);
      } catch (error) {
        console.error('Error al actualizar caché en segundo plano:', error);
      }
    }, 100);
  }
  
  /**
   * Obtiene el saldo actualizado con un sistema de reintentos
   * @param companyId ID de la empresa
   * @param previousBalance Saldo anterior
   * @param rechargeAmount Monto recargado
   * @returns Balance actualizado
   */
  private async getUpdatedBalanceWithRetry(
    companyId: number | string, 
    previousBalance: number, 
    rechargeAmount: number
  ): Promise<CompanyBalanceDto> {
    // Calculamos el saldo esperado (para verificación)
    const expectedBalance = parseFloat((previousBalance + rechargeAmount).toFixed(2));
    console.log(`Buscando saldo actualizado. Saldo anterior: ${previousBalance}, Recarga: ${rechargeAmount}, Esperado: ${expectedBalance}`);
    
    // Máximo número de intentos y tiempo de espera entre intentos
    const maxRetries = 3;
    const retryDelayMs = 800;
    
    // Realizamos varios intentos para obtener el saldo actualizado
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Intento ${attempt}/${maxRetries} de obtener saldo actualizado...`);
        
        // Esperamos un poco para dar tiempo al backend a actualizar
        if (attempt > 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelayMs));
        }
        
        // Obtenemos el saldo actual del backend (forzando omitir el caché)
        const balanceResponse = await this.getBalance(companyId, true);
        
        // Normalizar el valor del balance
        let currentBalance = 0;
        if (typeof balanceResponse.balanceUSD === 'number') {
          currentBalance = balanceResponse.balanceUSD;
        } else if (typeof balanceResponse.balanceUSD === 'string') {
          currentBalance = parseFloat(balanceResponse.balanceUSD);
        }
        
        console.log(`Intento ${attempt}: Saldo obtenido = ${currentBalance}, Esperado = ${expectedBalance}`);
        
        // Verificamos si el saldo ya se actualizó en el backend
        // Toleramos una pequeña diferencia por posibles redondeos
        if (Math.abs(currentBalance - expectedBalance) < 0.01) {
          console.log(`¡Éxito! Saldo actualizado encontrado en el intento ${attempt}.`);
          return balanceResponse;
        }
        
        // Si estamos en el último intento y el saldo aún no coincide
        if (attempt === maxRetries) {
          console.log('No se pudo obtener el saldo actualizado después de varios intentos.');
          console.log('Usando el cálculo local como respaldo.');
          
          // Devolvemos un objeto con el saldo calculado localmente
          return {
            ...balanceResponse,
            balanceUSD: expectedBalance,
            lastUpdated: new Date()
          };
        }
      } catch (error) {
        console.error(`Error en intento ${attempt}:`, error);
        if (attempt === maxRetries) {
          throw error;
        }
      }
    }
    
    // Este código nunca debería ejecutarse debido a los returns anteriores,
    // pero TypeScript requiere un return aquí
    throw new Error('No se pudo obtener el saldo actualizado');
  }

  /**
   * Obtiene el historial de transacciones con filtros
   * @param filter Filtros para las transacciones
   * @returns Lista de transacciones
   */
  public async getTransactionHistory(filter: BalanceTransactionFilterDto): Promise<BalanceTransactionDto[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filter.companyId) {
        queryParams.append('companyId', filter.companyId.toString());
      }
      
      if (filter.type) {
        queryParams.append('type', filter.type);
      }
      
      if (filter.startDate) {
        queryParams.append('startDate', filter.startDate.toISOString());
      }
      
      if (filter.endDate) {
        queryParams.append('endDate', filter.endDate.toISOString());
      }
      
      if (filter.page) {
        queryParams.append('page', filter.page.toString());
      }
      
      if (filter.limit) {
        queryParams.append('limit', filter.limit.toString());
      }

      const response: AxiosResponse<BalanceTransactionDto[]> = await axiosInstance.get(
        `/balance/transactions?${queryParams.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error('Error al obtener historial de transacciones:', error);
      throw error;
    }
  }

  /**
   * Obtiene la tasa de cambio actual USD a COP
   * @returns Tasa de cambio
   */
  public async getExchangeRate(): Promise<number> {
    try {
      const response: AxiosResponse<{ rate: number }> = await axiosInstance.get(
        `/balance/exchange-rate`
      );
      return response.data.rate;
    } catch (error) {
      console.error('Error al obtener tasa de cambio:', error);
      throw error;
    }
  }

  /**
   * Actualiza el saldo local tras el envío de una plantilla - SOLO PARA CACHÉ LOCAL
   * 
   * IMPORTANTE: Esta función NO registra consumo en el backend.
   * El consumo real de saldo SÓLO debe ocurrir a través de TemplateService.sendTemplate(),
   * que activa el consumo de saldo mediante TemplateBalanceInterceptor en el backend.
   * 
   * Esta función SÓLO actualiza el caché local para mantener la UI actualizada
   * y debe llamarse después de un envío exitoso de plantilla.
   * 
   * @param companyId ID de la empresa
   * @param amountUSD Monto en USD a decrementar
   * @param templateType Tipo de plantilla (UTILITY, MARKETING, etc.)
   * @param templateDestination Destino de la plantilla (número o grupo)
   * @param country Código de país del destino (ej: CO, MX)
   * @returns Balance actualizado en caché local
   */
  public async decrementBalance(
    companyId: number | string,
    amountUSD: number,
    templateType: string = 'MARKETING',
    templateDestination: string = '',
    country: string = 'CO'
  ): Promise<ExtendedCompanyBalanceDto> {
    try {
      debugLog(`Iniciando actualización de caché local para saldo - NO se realizará consumo en backend`);
      const companyIdNum = Number(companyId);
      
      // Calcular el costo total si no se proporciona un monto específico
      let finalAmount = amountUSD;
      let costDetails = { baseCost: amountUSD, additionalCost: 0 };
      
      if (!amountUSD || amountUSD <= 0) {
        try {
          // Usar el servicio de costos para calcular el monto total
          finalAmount = await TemplateCostService.calculateTotalCost(
            companyIdNum,
            templateType.toLowerCase(),
            country.toUpperCase()
          );
          
          // Obtener los detalles del cálculo para el registro
          const baseCost = TemplateCostService.getBaseCost(
            templateType.toLowerCase(),
            country.toUpperCase()
          );
          costDetails = {
            baseCost,
            additionalCost: finalAmount - baseCost
          };
          
          debugLog(`Costo calculado con tarifa personalizada: ${finalAmount} USD`, costDetails);
        } catch (costError) {
          console.error('Error al calcular costo con tarifa personalizada:', costError);
          // Si falla el cálculo, usar valor por defecto según tipo de plantilla
          finalAmount = templateType.toUpperCase() === 'MARKETING' ? 0.0125 :
                       templateType.toUpperCase() === 'UTILITY' ? 0.0050 : 0.0035;
        }
      }
      
      // Obtenemos el saldo actual actualizado desde backend
      const currentBalance = await this.getBalance(companyId, true);
      debugLog(`Saldo actual antes de actualización: ${currentBalance.balanceUSD} USD`);
      
      // Validación y normalización del saldo actual
      let currentBalanceUSD: number;
      if (typeof currentBalance.balanceUSD === 'number') {
        currentBalanceUSD = currentBalance.balanceUSD;
      } else if (typeof currentBalance.balanceUSD === 'string') {
        currentBalanceUSD = parseFloat(currentBalance.balanceUSD);
      } else if ((currentBalance as any)['balance_usd'] !== undefined) {
        const balanceUsdValue = (currentBalance as any)['balance_usd'];
        currentBalanceUSD = typeof balanceUsdValue === 'number' ? 
                         balanceUsdValue : 
                         parseFloat(balanceUsdValue as string);
      } else {
        throw new Error('El saldo actual no tiene un formato válido');
      }
      
      if (isNaN(currentBalanceUSD)) {
        throw new Error('El saldo actual no se pudo convertir a un número válido');
      }
      
      // Validamos que haya saldo suficiente (aunque el consumo real ya se realizó en backend)
      if (currentBalanceUSD < finalAmount) {
        // Advertencia en lugar de error, ya que esto podría ocurrir si el balance real ya fue actualizado
        console.warn(`Advertencia: El saldo local (${currentBalanceUSD} USD) es menor que el monto a decrementar (${finalAmount} USD)`);
        // Seguimos adelante, ya que esta función solo actualiza el caché local
      }
      
      // Calculamos el nuevo saldo y actualizamos el caché local
      const newBalance = currentBalanceUSD - finalAmount;
      const cacheKey = String(companyId);
      this.balanceCache.set(cacheKey, {
        balanceUSD: newBalance,
        timestamp: Date.now()
      });
      
      debugLog(`Saldo actualizado en caché local: ${newBalance} USD (monto: ${finalAmount} USD)`);
      
      // Retornamos el balance actualizado con información adicional
      return {
        ...currentBalance,
        balanceUSD: newBalance,
        lastUpdated: new Date(),
        amountDeducted: finalAmount,
        costDetails: costDetails,
        cacheOnly: true,
        message: 'Saldo actualizado localmente después del envío de plantilla'
      };
    } catch (error: any) {
      console.error('Error al actualizar saldo local:', error);
      throw error;
    }
  }
}

// Exportamos la instancia del servicio para uso en otros módulos
const balanceServiceInstance = BalanceService.getInstance();
export default balanceServiceInstance;
