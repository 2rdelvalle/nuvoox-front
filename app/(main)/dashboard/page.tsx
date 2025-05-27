'use client';
import { useState, useEffect } from 'react';
import { Card, CardBody, Spinner } from '@nextui-org/react';
import dynamic from 'next/dynamic';
import EmptyPage from '@/shared/small-components/EmptyPage/emptyPage';
import { useUser } from '@/shared/hooks/useUser';

// Importación dinámica de componentes que pueden causar errores de hidratación
// El parámetro { ssr: false } asegura que estos componentes NUNCA se rendericen en el servidor
const BalanceDisplay = dynamic(() => import('@/shared/components/balance/BalanceDisplay'), { ssr: false });
const TransactionHistory = dynamic(() => import('@/shared/components/balance/TransactionHistory'), { ssr: false });
const BalanceInfo = dynamic(() => import('@/shared/components/balance/BalanceInfo'), { ssr: false });
const CompanyStats = dynamic(() => import('@/shared/components/dashboard/CompanyStats'), { ssr: false });
const AgentTemplateStats = dynamic(() => import('@/shared/components/template/AgentTemplateStats'), { ssr: false });

/**
 * Componente para mostrar la hora actual
 * Se carga de forma dinámica para evitar errores de hidratación
 */
const TimeDisplay = dynamic(() => import('@/shared/components/TimeDisplay'), { ssr: false });

/**
 * Página de dashboard para empresas
 * Muestra el saldo actual y el historial de transacciones
 */
const DashboardPage = () => {
  const { user, isLoading } = useUser();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  if (isLoading) {
    return (
      <EmptyPage>
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" label="Cargando información..." />
        </div>
      </EmptyPage>
    );
  }

  if (!user || !user.company) {
    return (
      <EmptyPage>
        <Card className="w-full">
          <CardBody>
            <p className="text-center text-gray-500">
              No se encontró información de la empresa. Por favor, contacte al administrador.
            </p>
          </CardBody>
        </Card>
      </EmptyPage>
    );
  }

  const companyId = user.company.id;

  return (
    <EmptyPage>
      {/* Barra superior con hora y balance info - Cargado solo en el cliente */}
      <div className="mb-4 bg-white rounded-lg shadow border border-gray-200 p-3">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-600 font-medium mb-2 md:mb-0">
            {/* Placeholder estático durante el SSR, reemplazado por el componente real en el cliente */}
            <TimeDisplay fallback={
              <span className="inline-block bg-gray-100 px-3 py-1 rounded-lg">
                <i className="pi pi-clock mr-2"></i>
                --:--
              </span>
            } />
          </div>
          
          {/* Componente que muestra saldo recargado y saldo actual - Solo cliente */}
          <div className="min-h-[40px] flex items-center">
            <BalanceInfo companyId={companyId} refreshTrigger={refreshTrigger} />
          </div>
        </div>
      </div>
      
      {/* Indicador de Saldo en la parte superior - versión mejorada */}
      <div className="mb-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg shadow border border-blue-200">
        <div className="grid grid-cols-1 md:grid-cols-2 p-4">
          <div className="flex flex-col justify-center mb-4 md:mb-0">
            <h2 className="text-lg font-semibold text-blue-800">Bienvenido(a) a su panel de control</h2>
            <p className="text-sm text-gray-600">Administre sus plantillas y servicios de WhatsApp</p>
          </div>
          <div className="flex items-center justify-end">
            <div className="bg-white p-4 rounded-lg shadow-sm w-full md:w-auto">
              <div className="flex flex-col">
                <p className="text-sm font-medium text-gray-500 mb-1">Saldo Disponible:</p>
                <BalanceDisplay 
                  companyId={companyId} 
                  refreshTrigger={refreshTrigger}
                  compact={true} // Modo compacto para la versión superior
                />
                <p className="text-xs text-gray-400 mt-1">Último estado del saldo disponible</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Histórico de transacciones - ocupa toda la fila */}
        <div className="md:col-span-12">
          <TransactionHistory 
            companyId={companyId} 
            limit={10} 
            showPagination={true}
            showDateFilter={true}
          />
        </div>
        
        {/* Gráficas de estadísticas - segunda fila */}
        <div className="md:col-span-12 mt-4">
          <CompanyStats companyId={companyId} />
        </div>
        
        {/* Estadísticas de plantillas por agente - tercera fila */}
        <div className="md:col-span-12 mt-4">
          <AgentTemplateStats companyId={companyId} showDateFilter={true} />
        </div>
      </div>
    </EmptyPage>
  );
};

export default DashboardPage;
