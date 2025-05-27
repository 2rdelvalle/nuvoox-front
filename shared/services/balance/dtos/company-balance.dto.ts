/**
 * Detalles del costo de una plantilla
 */
export interface CostDetailsDto {
  baseCost: number;
  additionalCost: number;
}

/**
 * DTO para representar el saldo de una empresa
 */
export interface CompanyBalanceDto {
  id?: number;
  companyId: number;
  balanceUSD: number;
  balanceCOP?: number;
  exchangeRate: number;
  lastUpdated: Date;
  // Propiedades adicionales para información sobre consumo y tarifas
  amountDeducted?: number; // Monto total deducido en la última transacción
  costDetails?: CostDetailsDto; // Detalles del cálculo de costo
}

/**
 * DTO para recargar saldo a una empresa
 */
export interface RechargeBalanceDto {
  companyId: number;
  amountUSD: number;
  description?: string;
}
