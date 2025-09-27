'use client';
import { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Paginator } from 'primereact/paginator';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Tag } from 'primereact/tag';
import { BalanceService } from '@/shared/services';
import { BalanceTransactionDto, TransactionType } from '@/shared/services/balance/dtos/balance-transaction.dto';
import DateRangeFilter, { DateRange } from '../filters/DateRangeFilter';

interface TransactionHistoryProps {
  companyId: number;
  limit?: number;
  showPagination?: boolean;
  className?: string;
  showDateFilter?: boolean;
}

/**
 * Componente para mostrar el historial de transacciones de saldo
 * @param companyId - ID de la empresa
 * @param limit - Límite de transacciones por página
 * @param showPagination - Mostrar paginación
 * @param className - Clases CSS adicionales
 * @param showDateFilter - Mostrar filtro de fechas
 */
const TransactionHistory = ({ companyId, limit = 5, showPagination = true, className = '', showDateFilter = true }: TransactionHistoryProps) => {
  const [transactions, setTransactions] = useState<BalanceTransactionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Estado para el filtro de fechas
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    return {
      startDate: thirtyDaysAgo,
      endDate: now
    };
  });

  // Cargar las transacciones
  const fetchTransactions = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const data = await BalanceService.getTransactionHistory({
        companyId,
        page,
        limit,
        // Agregar filtros de fecha
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      
      setTransactions(data);
      // En un sistema real, la API debería devolver el total de páginas
      // Aquí asumimos que si recibimos menos elementos que el límite, estamos en la última página
      setTotalPages(data.length < limit ? page : page + 1);
    } catch (error) {
      console.error('Error al obtener historial de transacciones:', error);
      setError('No se pudo cargar el historial. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Cargar las transacciones al montar el componente o cuando cambien los parámetros
  useEffect(() => {
    if (companyId) {
      fetchTransactions();
    }
  }, [companyId, page, limit, dateRange]);
  
  // Manejar cambio en el rango de fechas
  const handleDateChange = (range: DateRange) => {
    setDateRange(range);
    // Resetear a la primera página cuando cambia el filtro de fechas
    setPage(1);
  };

  // Formatear transacciones para DataTable
  const formatTransactionForTable = (transaction: BalanceTransactionDto) => {
    return {
      ...transaction,
      formattedDate: formatDate(transaction.createdAt),
      typeChip: getTypeChip(transaction.type),
      formattedAmount: formatAmount(transaction.amountUSD, transaction.type),
      description: getDescription(transaction),
      previousBalance: `$${transaction.amountUSD?.toFixed(2) || '0.00'} USD`,
      newBalance: `$${transaction.amountUSD?.toFixed(2) || '0.00'} USD`
    };
  };

  const formattedTransactions = transactions.map(formatTransactionForTable);

  // Formatear fechas para mostrar
  const formatDate = (date: Date | string): string => {
    if (!date) return 'N/A';
    const dateObj = new Date(date);
    return dateObj.toLocaleString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Formatear montos para mostrar con color
  const formatAmount = (amount: number, type: TransactionType): JSX.Element => {
    const isPositive = type === TransactionType.RECHARGE;
    const color = isPositive ? 'success' : 'danger';
    const prefix = isPositive ? '+' : '';
    
    return (
      <span className={`font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {prefix}${Math.abs(amount).toFixed(2)} USD
      </span>
    );
  };

  // Obtener el chip de tipo de transacción
  const getTypeChip = (type: TransactionType): JSX.Element => {
    const config = {
      [TransactionType.RECHARGE]: { severity: 'success' as const, label: 'Recarga' },
      [TransactionType.CONSUMPTION]: { severity: 'danger' as const, label: 'Consumo' }
    };
    
    return (
      <Tag 
        severity={config[type].severity}
        value={config[type].label}
        rounded
      />
    );
  };

  // Obtener descripción detallada
  const getDescription = (transaction: BalanceTransactionDto): string => {
    if (transaction.type === TransactionType.CONSUMPTION && transaction.templateType) {
      return `${transaction.description || 'Consumo por plantilla'} - Tipo: ${transaction.templateType}${transaction.templateDestination ? `, País: ${transaction.templateDestination}` : ''}`;
    }
    return transaction.description || (transaction.type === TransactionType.RECHARGE ? 'Recarga de saldo' : 'Consumo por plantilla');
  };

  if (loading && transactions.length === 0) {
    return (
      <Card className={`w-full shadow-md ${className}`}>
        <div className="flex items-center justify-center p-6 h-40">
          <ProgressSpinner style={{width: '40px', height: '40px'}} strokeWidth="6" />
          <span className="ml-3 text-gray-600">Cargando historial...</span>
        </div>
      </Card>
    );
  }

  if (error && transactions.length === 0) {
    return (
      <Card className={`w-full shadow-md ${className}`}>
        <div className="p-6">
          <div className="text-center text-red-500 mb-2">{error}</div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`w-full shadow-md ${className}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 px-6 py-4">
        <h3 className="text-lg font-semibold">Historial de transacciones</h3>
        
        {showDateFilter && (
          <div className="w-full sm:w-auto">
            <DateRangeFilter
              onChange={handleDateChange}
              className="w-full"
            />
          </div>
        )}
      </div>
      <div className="px-6 py-0">
        <DataTable 
          value={formattedTransactions}
          loading={loading}
          emptyMessage="No hay transacciones disponibles"
          className="min-h-[200px]"
          stripedRows
        >
          <Column field="formattedDate" header="FECHA" />
          <Column field="typeChip" header="TIPO" body={(data) => data.typeChip} />
          <Column field="description" header="DESCRIPCIÓN" className="max-w-xs truncate" />
          <Column field="formattedAmount" header="MONTO" />
          <Column field="previousBalance" header="SALDO ANTERIOR" />
          <Column field="newBalance" header="SALDO ACTUAL" />
        </DataTable>
        
        {showPagination && totalPages > 1 && (
          <div className="flex justify-center py-4">
            <Paginator
              first={(page - 1) * (limit || 10)}
              rows={limit || 10}
              totalRecords={totalPages * (limit || 10)}
              onPageChange={(e) => setPage(e.page + 1)}
            />
          </div>
        )}
      </div>
    </Card>
  );
};

export default TransactionHistory;
