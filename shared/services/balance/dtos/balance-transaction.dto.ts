/**
 * Tipo de transacción de balance
 */
export enum TransactionType {
  RECHARGE = 'recharge',  // Recarga de saldo por el administrador
  CONSUMPTION = 'consumption' // Consumo por envío de plantillas
}

/**
 * DTO para representar las transacciones de saldo
 */
export interface BalanceTransactionDto {
  id: number;
  companyId: number;
  companyName?: string;
  type: TransactionType;
  amountUSD: number;
  amountCOP?: number;
  exchangeRate: number;
  balanceAfterUSD: number;
  balanceAfterCOP?: number;
  description?: string;
  templateType?: string;
  templateDestination?: string;
  createdAt: Date;
}

/**
 * DTO para filtrar transacciones de saldo
 */
export interface BalanceTransactionFilterDto {
  companyId?: number;
  type?: TransactionType;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}
