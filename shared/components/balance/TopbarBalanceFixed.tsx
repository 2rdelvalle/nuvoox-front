'use client';
import { useState, useEffect } from 'react';
import { BalanceService } from '@/shared/services';
import { TransactionType } from '@/shared/services/balance/dtos/balance-transaction.dto';
import { getDataFromToken, getCookieToken } from '@/shared/utilities/functions/sessionUtils';
import { JWTAuth } from '@/shared/models';

// Definición de tipos para evitar errores de TypeScript
interface CompanyInfo {
  id?: number;
  ID?: number;
  companyId?: number;
  [key: string]: any;
}

type CompanyData = Record<string, any>;

/**
 * Componente simplificado para mostrar el saldo en la barra superior
 * Diseñado específicamente para empresas
 */
const TopbarBalanceFixed = () => {
  const [lastRecharge, setLastRecharge] = useState<number | null>(null);
  const [currentBalance, setCurrentBalance] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [companyId, setCompanyId] = useState<number | null>(null);

  // Efecto para inicializar el componente y verificar si es una empresa
  useEffect(() => {
    const init = async () => {
      try {
        // Obtener el token y verificar el rol
        const token = getCookieToken();
        if (!token) {
          console.log('[TopbarBalanceFixed] No se encontró token');
          return;
        }

        const userData = getDataFromToken(token);
        console.log('[TopbarBalanceFixed] Datos de usuario:', userData ? 'Encontrados' : 'No encontrados');
        
        // Verificar si tenemos datos de usuario y rol
        if (!userData || !userData.user || !userData.user.role) {
          console.log('[TopbarBalanceFixed] Datos de usuario incompletos');
          return;
        }

        console.log('[TopbarBalanceFixed] Rol de usuario:', userData.user.role.name);
        
        // Solo continuar si es un usuario de tipo EMPRESA
        if (userData.user.role.name === 'EMPRESA') {
          // Extraer el ID de la empresa
          // Tratar company como un objeto genérico para mayor flexibilidad
          const company = userData.user.company as CompanyData;
          console.log('[TopbarBalanceFixed] Datos de empresa:', company);
          
          // Intentar encontrar el ID en diferentes formatos posibles
          let companyId: number | null = null;
          
          if (company && typeof company === 'object') {
            // Verificar todas las posibles propiedades que podrían contener el ID
            if (company.id && (typeof company.id === 'number' || typeof company.id === 'string')) {
              companyId = Number(company.id);
              console.log(`[TopbarBalanceFixed] Usando company.id: ${companyId}`);
            } else if (company.ID && (typeof company.ID === 'number' || typeof company.ID === 'string')) {
              companyId = Number(company.ID);
              console.log(`[TopbarBalanceFixed] Usando company.ID: ${companyId}`);
            } else if (company.companyId && (typeof company.companyId === 'number' || typeof company.companyId === 'string')) {
              companyId = Number(company.companyId);
              console.log(`[TopbarBalanceFixed] Usando company.companyId: ${companyId}`);
            } else {
              // Mostrar contenido para depuración
              console.log('[TopbarBalanceFixed] Propiedades de empresa:', Object.keys(company));
              
              // Usar la primera propiedad numérica que encontremos como posible ID
              for (const key in company) {
                if (Object.prototype.hasOwnProperty.call(company, key)) {
                  const value = company[key];
                  if (typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)))) {
                    companyId = Number(value);
                    console.log(`[TopbarBalanceFixed] Usando propiedad '${key}' como ID: ${companyId}`);
                    break;
                  }
                }
              }
            }
          }
          
          // Si no se encontró un ID válido, mostrar un mensaje sencillo de saldo
          if (!companyId) {
            console.log('[TopbarBalanceFixed] No se pudo determinar el ID de empresa, mostrando saldo genérico');
            setIsVisible(true); // Mostrar un saldo genérico
            setCurrentBalance(0); // Valor predeterminado
            return;
          }

          setCompanyId(companyId);
          setIsVisible(true);
          console.log(`[TopbarBalanceFixed] Mostrando saldo para empresa ID: ${companyId}`);

          // Cargar datos de balance
          try {
            const balanceData = await BalanceService.getBalance(companyId);
            setCurrentBalance(balanceData.balanceUSD);
            console.log(`[TopbarBalanceFixed] Saldo actual: ${balanceData.balanceUSD} USD`);
          } catch (balanceError) {
            console.error('[TopbarBalanceFixed] Error al cargar saldo:', balanceError);
            setCurrentBalance(0); // Valor predeterminado en caso de error
          }

          // Cargar últimas transacciones
          try {
            const transactions = await BalanceService.getTransactionHistory({
              companyId: companyId,
              page: 1,
              limit: 5
            });

            // Buscar la última recarga
            const recharge = transactions.find(t => t.type === TransactionType.RECHARGE);
            if (recharge) {
              setLastRecharge(recharge.amountUSD);
              console.log(`[TopbarBalanceFixed] Última recarga: ${recharge.amountUSD} USD`);
            }
          } catch (transactionError) {
            console.error('[TopbarBalanceFixed] Error al cargar transacciones:', transactionError);
          }
        }
      } catch (error) {
        console.error("Error cargando datos de balance:", error);
      }
    };

    init();
  }, []);

  // Si no es visible, no mostrar nada
  if (!isVisible) return null;

  return (
    <div className="flex items-center gap-2">
      {lastRecharge !== null && (
        <div className="bg-green-50 px-3 py-1 rounded-lg flex items-center">
          <i className="pi pi-arrow-up text-green-500 mr-1"></i>
          <span className="text-green-600 font-semibold text-sm">
            ${lastRecharge.toFixed(2)} USD
          </span>
        </div>
      )}
      
      {currentBalance !== null && (
        <div className="bg-blue-50 px-3 py-1 rounded-lg flex items-center">
          <i className="pi pi-wallet text-blue-500 mr-1"></i>
          <span className="text-blue-600 font-semibold text-sm">
            ${currentBalance.toFixed(2)} USD
          </span>
        </div>
      )}
    </div>
  );
};

export default TopbarBalanceFixed;
