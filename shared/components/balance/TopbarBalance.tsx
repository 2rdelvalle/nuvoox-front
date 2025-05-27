'use client';
import { useState, useEffect } from 'react';
import { Tooltip } from 'primereact/tooltip';
import { Spinner } from '@nextui-org/react';
import { BalanceService } from '@/shared/services';
import { TransactionType } from '@/shared/services/balance/dtos/balance-transaction.dto';
import { getDataFromToken, getCookieToken } from '@/shared/utilities/functions/sessionUtils';
import { JWTAuth } from '@/shared/models';

// Definición de interfaces para evitar errores de tipo
interface CompanyInfo {
  id: number;
  [key: string]: any;
}

// Verificar si un usuario es de tipo EMPRESA
const isCompanyUser = (dataToken: JWTAuth | null): boolean => {
  if (!dataToken || !dataToken.user || !dataToken.user.role) {
    return false;
  }
  
  return dataToken.user.role.name === 'EMPRESA';
};

/**
 * Componente para mostrar información del saldo en la barra superior
 * Diseñado para mostrar saldo recargado y saldo actual
 */
const TopbarBalance = () => {
  const [lastRecharge, setLastRecharge] = useState<number | null>(null);
  const [currentBalance, setCurrentBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [companyId, setCompanyId] = useState<number | null>(null);

  // Efecto para marcar el componente como montado en el cliente y verificar el tipo de usuario
  useEffect(() => {
    setMounted(true);
    
    try {
      // Obtener la información del token
      const dataToken = getDataFromToken(getCookieToken() || '') as JWTAuth;
      
      // Verificar si el usuario está logueado y es de tipo EMPRESA
      if (isCompanyUser(dataToken)) {
        console.log('[TopbarBalance] Usuario de tipo EMPRESA detectado');
        
        // Verificar si existe información de la empresa y si tiene un ID
        if (dataToken.user.company) {
          // Usar aserción de tipo para indicar que company contiene id
          const company = dataToken.user.company as CompanyInfo;
          if (company.id) {
            console.log(`[TopbarBalance] ID de empresa detectado: ${company.id}`);
            setCompanyId(company.id);
          } else {
            console.error('[TopbarBalance] La empresa no tiene ID');
          }
        } else {
          console.error('[TopbarBalance] Usuario EMPRESA sin información de empresa');
        }
      } else {
        console.log('[TopbarBalance] Usuario no es de tipo EMPRESA, ocultando componente de saldo');
      }
    } catch (error) {
      console.error('[TopbarBalance] Error al obtener información del usuario:', error);
    }
  }, []);

  useEffect(() => {
    // Solo ejecutar la petición cuando el componente está montado y tenemos ID de empresa
    if (!mounted || !companyId) return;
    
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
          limit: 5
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

    // Configurar intervalo para actualizar los datos cada 5 minutos
    const intervalId = setInterval(fetchData, 300000);
    return () => clearInterval(intervalId);
  }, [companyId, mounted]);

  // Si no hay información de empresa o estamos en el servidor, no mostrar nada
  if (!mounted || !companyId) {
    return null;
  }

  // Mientras carga, mostrar un spinner discreto
  if (loading) {
    return (
      <div className="flex items-center mr-4">
        <Spinner size="sm" color="primary" />
      </div>
    );
  }

  // Si no hay datos de balance, no mostrar nada
  if (currentBalance === null && lastRecharge === null) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 mr-4">
      <Tooltip target=".balance-info" position="bottom" />
      
      {lastRecharge !== null && (
        <div 
          className="balance-info bg-green-50 px-3 py-1 rounded-lg flex items-center" 
          data-pr-tooltip="Último saldo recargado"
        >
          <i className="pi pi-arrow-up text-green-500 mr-1"></i>
          <span className="text-green-600 font-semibold text-sm">
            ${lastRecharge.toFixed(2)} USD
          </span>
        </div>
      )}
      
      {currentBalance !== null && (
        <div 
          className="balance-info bg-blue-50 px-3 py-1 rounded-lg flex items-center"
          data-pr-tooltip="Saldo actual disponible"
        >
          <i className="pi pi-wallet text-blue-500 mr-1"></i>
          <span className="text-blue-600 font-semibold text-sm">
            ${currentBalance.toFixed(2)} USD
          </span>
        </div>
      )}
    </div>
  );
};

export default TopbarBalance;
