'use client';
import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Pagination, Spinner, Chip } from '@nextui-org/react';
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
  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
    // Resetear a la primera página cuando cambia el filtro de fechas
    setPage(1);
  };

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
      [TransactionType.RECHARGE]: { color: 'success' as const, label: 'Recarga' },
      [TransactionType.CONSUMPTION]: { color: 'danger' as const, label: 'Consumo' }
    };
    
    return (
      <Chip 
        size="sm" 
        variant="flat" 
        color={config[type].color}
      >
        {config[type].label}
      </Chip>
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
        <CardBody className="flex items-center justify-center p-6 h-40">
          <Spinner label="Cargando historial..." color="primary" />
        </CardBody>
      </Card>
    );
  }

  if (error && transactions.length === 0) {
    return (
      <Card className={`w-full shadow-md ${className}`}>
        <CardBody className="p-6">
          <div className="text-center text-red-500 mb-2">{error}</div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className={`w-full shadow-md ${className}`}>
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 px-6 py-4">
        <h3 className="text-lg font-semibold">Historial de transacciones</h3>
        
        {/* Filtro de fechas */}
        {showDateFilter && (
          <DateRangeFilter 
            onChange={handleDateRangeChange} 
            className="ml-auto" 
            showApplyButton={false}
          />
        )}
      </CardHeader>
      
      <CardBody className="px-3 py-0">
        <Table 
          aria-label="Historial de transacciones de saldo"
          removeWrapper
          isStriped
          isCompact
        >
          <TableHeader>
            <TableColumn>FECHA</TableColumn>
            <TableColumn>TIPO</TableColumn>
            <TableColumn>DESCRIPCIÓN</TableColumn>
            <TableColumn>MONTO</TableColumn>
            <TableColumn>SALDO</TableColumn>
          </TableHeader>
          <TableBody 
            emptyContent="No hay transacciones disponibles"
            isLoading={loading}
            loadingContent={<Spinner color="primary" />}
          >
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                <TableCell>{getTypeChip(transaction.type)}</TableCell>
                <TableCell>
                  <div className="max-w-xs truncate" title={getDescription(transaction)}>
                    {getDescription(transaction)}
                  </div>
                </TableCell>
                <TableCell>{formatAmount(transaction.amountUSD, transaction.type)}</TableCell>
                <TableCell className="font-medium">${transaction.balanceAfterUSD.toFixed(2)} USD</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {showPagination && (
          <div className="flex justify-center my-4">
            <Pagination
              page={page}
              total={totalPages}
              onChange={setPage}
              isDisabled={loading}
              showControls
              size="sm"
            />
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default TransactionHistory;
