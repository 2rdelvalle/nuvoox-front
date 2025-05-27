'use client';
import { useState, useEffect } from 'react';
import { Spinner } from '@nextui-org/react';
import { BalanceService } from '@/shared/services';
import { TransactionType } from '@/shared/services/balance/dtos/balance-transaction.dto';
import { CompanyBalanceDto } from '@/shared/services/balance/dtos/company-balance.dto';

interface BalanceInfoProps {
  companyId: number;
  refreshTrigger?: number;
}

/**
 * Componente para mostrar información del saldo y última recarga
 * Se coloca junto a la hora en el panel de empresa
 */
const BalanceInfo = ({ companyId, refreshTrigger = 0 }: BalanceInfoProps) => {
  const [lastRecharge, setLastRecharge] = useState<number | null>(null);
  const [currentBalance, setCurrentBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Este efecto solo se ejecuta en el cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Solo ejecutar la petición cuando el componente está montado (en el cliente)
    if (!mounted) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        // Obtener balance actual
        const balanceData = await BalanceService.getBalance(companyId);
        setCurrentBalance(balanceData.balanceUSD);
        
        // Obtener última recarga
        const transactions = await BalanceService.getTransactionHistory({
          companyId,
          page: 1,
          limit: 10
        });
        
        // Filtrar por tipo RECHARGE y obtener la más reciente
        const recharges = transactions.filter(t => t.type === TransactionType.RECHARGE);
        if (recharges.length > 0) {
          setLastRecharge(recharges[0].amountUSD);
        }
      } catch (error) {
        console.error('Error al obtener datos de balance:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [companyId, refreshTrigger, mounted]);

  // Si aún no está montado en el cliente, mostrar un placeholder para evitar discrepancias
  if (!mounted) {
    return (
      <div className="flex items-center space-x-4 text-sm">
        <div className="bg-blue-50 px-3 py-1 rounded-lg">
          <span className="font-medium text-blue-700">Cargando información... </span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center space-x-4 text-sm">
        <div className="bg-blue-50 px-3 py-1 rounded-lg">
          <span className="font-medium text-blue-700">Cargando </span>
          <Spinner size="sm" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4 text-sm">
      <div className="bg-blue-50 px-3 py-1 rounded-lg">
        <span className="font-medium text-blue-700">Saldo recargado: </span>
        <span className="text-green-600 font-semibold">
          ${lastRecharge !== null ? lastRecharge.toFixed(2) : '0.00'} USD
        </span>
      </div>
      
      <div className="bg-blue-50 px-3 py-1 rounded-lg">
        <span className="font-medium text-blue-700">Saldo actual: </span>
        <span className="text-blue-800 font-semibold">
          ${currentBalance !== null ? currentBalance.toFixed(2) : '0.00'} USD
        </span>
      </div>
    </div>
  );
};

export default BalanceInfo;
