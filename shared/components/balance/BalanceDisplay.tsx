'use client';
import { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { BalanceService } from '@/shared/services';
import { CompanyBalanceDto } from '@/shared/services/balance/dtos/company-balance.dto';
import { IoReload } from 'react-icons/io5';
import ClientOnly from '@/shared/components/ClientOnly';

interface BalanceDisplayProps {
  companyId: number;
  refreshTrigger?: number; // Optional trigger to refresh the balance
  compact?: boolean; // Modo compacto para mostrar en el header
}

/**
 * Componente para mostrar el saldo actual de una empresa en USD y COP
 */
const BalanceDisplay = ({ companyId, refreshTrigger = 0, compact = false }: BalanceDisplayProps) => {
  const [balance, setBalance] = useState<CompanyBalanceDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Manejar la recarga manual del saldo
  const handleRefresh = async () => {
    if (refreshing || !mounted) return;
    
    setRefreshing(true);
    try {
      const data = await BalanceService.getBalance(companyId, true); // Bypass cache
      setBalance(data);
      setError(null);
    } catch (error) {
      console.error('Error al recargar saldo:', error);
      setError('No se pudo recargar el saldo. Intente nuevamente.');
    } finally {
      setRefreshing(false);
    }
  };

  // Estado para controlar si el componente está montado en el cliente
  const [mounted, setMounted] = useState(false);
  
  // Efecto para marcar que estamos en el cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  // Cargar el saldo solo cuando estamos en el cliente y cuando cambie el companyId o refreshTrigger
  useEffect(() => {
    if (mounted && companyId) {
      setLoading(true);
      fetchBalance();
    }
  }, [companyId, refreshTrigger, mounted]);

  // Función para cargar el saldo
  const fetchBalance = async () => {
    try {
      setError(null);
      const data = await BalanceService.getBalance(companyId);
      setBalance(data);
    } catch (error) {
      console.error('Error al obtener saldo:', error);
      setError('No se pudo cargar el saldo. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Formatear fechas para mostrar - Versión segura para SSR
  const formatDate = (date: Date | string): string => {
    if (!date || !mounted) return 'N/A';
    
    try {
      const dateObj = new Date(date);
      return dateObj.toLocaleString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return 'N/A';
    }
  };

  // Determinar el color del saldo basado en el monto
  const getBalanceColor = (amount: number): string => {
    if (amount <= 0) return 'text-red-600';
    if (amount < 5) return 'text-orange-500';
    return 'text-green-600';
  };

  // Renderizar un placeholder durante el SSR para evitar errores de hidratación
  if (!mounted) {
    return (
      <div className={compact ? "" : "w-full"}>
        <div className="flex justify-center py-4">
          <div className="h-8 w-32 bg-gray-200 animate-pulse rounded"></div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={compact ? "" : "w-full"}>
        <div className="flex justify-center py-4">
          <ProgressSpinner style={{width: '30px', height: '30px'}} strokeWidth="8" />
          <span className="ml-2 text-sm text-gray-600">Cargando saldo...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={compact ? "" : "w-full"}>
        <Card className="border border-red-300">
          <div className="p-4">
            <div className="text-red-600 text-center">
              <p>{error}</p>
              <Button
                size="small"
                severity="info"
                className="mt-2"
                onClick={handleRefresh}
                loading={refreshing}
              >
                Reintentar
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={compact ? "" : "w-full"}>
      <div className={`flex ${compact ? "flex-row" : "flex-col"} items-${compact ? "center" : "start"} gap-2`}>
        <div className="flex flex-row items-center gap-2">
          <div className="flex-grow">
            <div className="text-xl font-bold text-blue-700">
              ${balance?.balanceUSD.toFixed(2) || '0.00'} USD
            </div>
            {!compact && (
              <div className="text-md text-gray-600">
                ${balance?.balanceCOP?.toFixed(2) || '0.00'} COP
              </div>
            )}
          </div>
          {!compact && (
            <Button
              icon="pi pi-refresh"
              size="small"
              text
              loading={refreshing}
              onClick={handleRefresh}
              tooltip="Actualizar saldo"
              className="text-gray-500"
            />
          )}
        </div>
        
        {!compact && (
          <div className="flex justify-between mt-3 text-sm text-gray-500">
            <div>Tasa: $ {balance?.exchangeRate.toFixed(2) || 'N/A'}</div>
            <div>Actualizado: {formatDate(balance?.lastUpdated || new Date())}</div>
          </div>
        )}
        
        {/* Alerta de saldo bajo */}
        {(balance?.balanceUSD || 0) <= 0 && (
          <div className="mt-3 p-2 bg-red-100 text-red-700 rounded-lg text-sm">
            <strong>¡Atención!</strong> Su saldo se ha agotado. No podrá enviar plantillas de WhatsApp hasta recargar.
          </div>
        )}
        {(balance?.balanceUSD || 0) > 0 && (balance?.balanceUSD || 0) < 5 && (
          <div className="mt-3 p-2 bg-orange-100 text-orange-700 rounded-lg text-sm">
            <strong>¡Atención!</strong> Su saldo es bajo. Considere recargar pronto para asegurar el envío de mensajes.
          </div>
        )}
      </div>
    </div>
  );
};

export default BalanceDisplay;
