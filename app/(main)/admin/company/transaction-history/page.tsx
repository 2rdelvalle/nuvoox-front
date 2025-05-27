'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { useToast } from '@/shared/context/toast/toastContext';
import { BalanceService } from '@/shared/services';
import { BalanceTransactionDto, TransactionType } from '@/shared/services/balance/dtos/balance-transaction.dto';
import EmptyPage from '@/shared/small-components/EmptyPage/emptyPage';
import { useRouter } from 'next/navigation';
import { ADMIN_ROUTES } from '@/shared/routes/admin.routes';

/**
 * Versión mínima para diagnóstico
 */
const TransactionHistoryPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showError } = useToast();
  
  // Obtener companyId de los parámetros de la URL
  const companyId = searchParams.get('id');
  const companyName = searchParams.get('name') || 'Empresa';
  
  // Si no hay ID, redirigir a la lista
  useEffect(() => {
    if (!companyId) {
      showError('Se requiere ID de empresa');
      router.push(ADMIN_ROUTES.COMPANY.LIST);
    }
  }, [companyId, router, showError]);
  
  // Versión mínima para diagnosticar el error
  return (
    <EmptyPage>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Historial de Transacciones - {companyName}</h1>
        <Button 
          label="Volver" 
          icon="pi pi-arrow-left" 
          onClick={() => router.push(ADMIN_ROUTES.COMPANY.LIST)}
          className="mb-4"
        />
        
        <Card>
          <div className="p-4">
            <p>Estamos trabajando en esta funcionalidad.</p>
            <p>ID de Compañía: {companyId}</p>
          </div>
        </Card>
      </div>
    </EmptyPage>
  );
};

export default TransactionHistoryPage;
