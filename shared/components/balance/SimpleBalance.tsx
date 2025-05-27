'use client';
import { useState, useEffect } from 'react';
import { BalanceService } from '@/shared/services';
import { getDataFromToken, getCookieToken } from '@/shared/utilities/functions/sessionUtils';
import { Tooltip } from 'primereact/tooltip';
import { JWTAuth } from '@/shared/models';

// Tipo para manejar cualquier propiedad
type GenericRecord = Record<string, any>;

/**
 * Componente ultra-simplificado para mostrar el saldo en la barra superior
 * Enfoque minimalista con máxima compatibilidad
 */
const SimpleBalance = () => {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEmpresa, setIsEmpresa] = useState(false);

  useEffect(() => {
    // Función asíncrona para cargar los datos
    const loadBalance = async () => {
      try {
        setLoading(true);
        
        // 1. Verificar si hay un token
        const token = getCookieToken();
        if (!token) {
          console.log('[SimpleBalance] No hay token disponible');
          setLoading(false);
          return;
        }

        // 2. Verificar si el usuario es de tipo EMPRESA
        const userData = getDataFromToken(token);
        if (!userData?.user?.role?.name) {
          console.log('[SimpleBalance] Datos de usuario incompletos');
          setLoading(false);
          return;
        }

        const isUserEmpresa = userData.user.role.name === 'EMPRESA';
        setIsEmpresa(isUserEmpresa);
        
        if (!isUserEmpresa) {
          console.log('[SimpleBalance] Usuario no es empresa, rol:', userData.user.role.name);
          setLoading(false);
          return;
        }

        // 3. Intentar obtener el ID de empresa para cargar el saldo
        try {
          // Obtener ID para usuario EMPRESA usando el primer método disponible
          // Método 1: Compañía directa desde user
          let companyId = null;
          if (userData.user.company) {
            // Usar un cast genérico para permitir acceso a cualquier propiedad
            const company = userData.user.company as GenericRecord;
            
            if (typeof company === 'object') {
              // Intentar leer id directamente usando notación de corchetes para evitar errores de tipo
              if (company['id'] !== undefined) {
                companyId = Number(company['id']);
                console.log(`[SimpleBalance] Usando company.id: ${companyId}`);
              } 
              // Intentar alternativas comunes
              else if (company['ID'] !== undefined) {
                companyId = Number(company['ID']);
                console.log(`[SimpleBalance] Usando company.ID: ${companyId}`);
              }
              else if (company['companyId'] !== undefined) {
                companyId = Number(company['companyId']);
                console.log(`[SimpleBalance] Usando company.companyId: ${companyId}`);
              }
              // O simplemente usar la primera propiedad numérica
              else {
                const keys = Object.keys(company);
                console.log('[SimpleBalance] Propiedades disponibles:', keys);
                
                for (const key of keys) {
                  const val = company[key];
                  if ((typeof val === 'number' || typeof val === 'string') && !isNaN(Number(val))) {
                    companyId = Number(val);
                    console.log(`[SimpleBalance] Usando ${key}: ${companyId}`);
                    break;
                  }
                }
              }
            } 
            // Si company es un número directamente
            else if (typeof company === 'number' || (typeof company === 'string' && !isNaN(Number(company)))) {
              companyId = Number(company);
              console.log(`[SimpleBalance] Company es un valor directo: ${companyId}`);
            }
          }
          
          // Método 2: Buscar en otras propiedades de usuario
          const userAsGeneric = userData.user as GenericRecord;
          if (!companyId && userAsGeneric.companyId !== undefined) {
            companyId = Number(userAsGeneric.companyId);
            console.log(`[SimpleBalance] Usando user.companyId: ${companyId}`);
          }
          
          // Método 3: Último recurso - buscar en el objeto de usuario cualquier propiedad con 'company' e 'id'
          if (!companyId) {
            for (const key in userAsGeneric) {
              if (key.toLowerCase().includes('company') && key.toLowerCase().includes('id')) {
                const val = userAsGeneric[key];
                if (val !== undefined) {
                  companyId = Number(val);
                  console.log(`[SimpleBalance] Usando user.${key}: ${companyId}`);
                  break;
                }
              }
            }
          }
          
          // Si aún no tenemos ID, mostrar un valor por defecto
          if (!companyId) {
            console.log('[SimpleBalance] No se pudo determinar el ID de empresa');
            setBalance(0);
            setLoading(false);
            return;
          }
          
          // Cargar el saldo con el ID encontrado
          try {
            console.log('=== INICIO DEPURACIÓN DE BALANCE ===');
            console.log('CompanyId a usar:', companyId);
            console.log('Tipo de CompanyId:', typeof companyId);
            
            // Forzar refresco desde el backend
            const balanceData = await BalanceService.getBalance(companyId, true);
            
            // Imprimir objeto completo de respuesta
            console.log('Respuesta completa del balance:', balanceData);
            console.log('Tipo de balanceData:', typeof balanceData);
            console.log('Propiedades disponibles:', Object.keys(balanceData));
            
            if (balanceData) {
              console.log('balanceUSD value:', balanceData.balanceUSD);
              console.log('balanceUSD type:', typeof balanceData.balanceUSD);
              
              // Intentar diferentes formatos de saldo
              let saldoFinal = 0;
              
              if (typeof balanceData.balanceUSD === 'number') {
                saldoFinal = balanceData.balanceUSD;
                console.log('Usando balanceUSD como número:', saldoFinal);
              } else if (typeof balanceData.balanceUSD === 'string') {
                saldoFinal = parseFloat(balanceData.balanceUSD);
                console.log('Convertido balanceUSD de string a número:', saldoFinal);
              } else if ((balanceData as any)['balance_usd'] !== undefined) {
                saldoFinal = Number((balanceData as any)['balance_usd']);
                console.log('Usando balance_usd alternativo:', saldoFinal);
              }
              
              if (!isNaN(saldoFinal)) {
                setBalance(saldoFinal);
                console.log('Saldo final establecido:', saldoFinal);
              } else {
                console.log('No se pudo obtener un saldo válido, usando 0');
                setBalance(0);
              }
            } else {
              console.log('balanceData es null o undefined');
              setBalance(0);
            }
            
            console.log('=== FIN DEPURACIÓN DE BALANCE ===');
          } catch (balanceError) {
            console.error('=== ERROR EN CARGA DE BALANCE ===');
            console.error('Error completo:', balanceError);
            console.error('Stack trace:', (balanceError as Error).stack);
            setBalance(0);
          }
        } catch (error) {
          console.error('[SimpleBalance] Error al procesar datos de empresa:', error);
          // En caso de error, mostrar 0 como valor por defecto
          setBalance(0);
        }

        setLoading(false);
      } catch (error) {
        console.error('[SimpleBalance] Error general:', error);
        setLoading(false);
      }
    };

    // Cargar el saldo al montar el componente
    loadBalance();

    // Actualizar cada 5 minutos
    const interval = setInterval(loadBalance, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Si no es una empresa o está cargando, no mostrar nada
  if (!isEmpresa || loading) {
    return null;
  }

  // Si hay un saldo, mostrarlo
  if (balance !== null) {
    return (
      <>
        <Tooltip target=".balance-display" position="bottom" />
        <div 
          className="bg-blue-50 px-3 py-1 rounded-lg flex items-center shadow-sm balance-display" 
          data-pr-tooltip="Saldo actual disponible"
        >
          <i className="pi pi-wallet text-blue-500 mr-1"></i>
          <span className="text-blue-600 font-semibold text-sm">
            ${balance.toFixed(2)} USD
          </span>
        </div>
      </>
    );
  }

  // Si no hay saldo (pero es empresa), mostrar un indicador
  return null;
};

export default SimpleBalance;
