"use client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useToast } from "@/shared/context/toast/toastContext"
import { useFetch } from "@/shared/hooks/useFetch"
import { usePush } from "@/shared/hooks/usePush"
import { ADMIN_ROUTES } from "@/shared/routes/admin.routes"
import { COLUMNS_COMPANY } from "@/shared/services/company/columns/columns"
import {
  CompanyService as _company
} from "@/shared/services"
import CustomToolbar from "@/shared/small-components/CustomToolbar/customToolbar"
import EmptyPage from "@/shared/small-components/EmptyPage/emptyPage"
import InfoMessage from "@/shared/small-components/InfoMessage/infoMessage"
import TableFilter from "@/shared/small-components/TableFilter/tableFilter"
import { downloadExcel } from "@/shared/utilities/excel/exportExcel"
import RechargeBalanceModal from "@/shared/components/balance/RechargeBalanceModal"
import CompanyTariffModal from "@/shared/components/tariffs/CompanyTariffModal"
import { Button } from "primereact/button"
// Usamos los iconos integrados de PrimeReact para mantener consistencia visual
const CompanyPage = () => {
  const router = useRouter()
  const { showError, showSuccess } = useToast()

  // Estados para el modal de recarga de saldo
  const [rechargeModalOpen, setRechargeModalOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<{ id: number, name: string } | null>(null)

  // Estados para el modal de tarifas
  const [tariffModalOpen, setTariffModalOpen] = useState(false)
  const [selectedCompanyForTariff, setSelectedCompanyForTariff] = useState<{ id: number, name: string } | null>(null)

  const { onClickAction } = usePush(ADMIN_ROUTES.COMPANY.CREATE)

  const { responseData: users, isLoading, callback } = useFetch(_company.caratule)
  
  // Registro de ayuda para depuración - eliminar en producción
  console.log('Datos recibidos de usuarios:', users);

  // Función para abrir el modal de recarga de saldo - Versión simplificada y robusta
  const handleOpenRechargeModal = (company: any) => {
    try {
      // Más logs para depuración
      console.log('Recarga solicitada para:', company);
      
      // Validar que tenemos datos válidos
      if (!company) {
        console.error('Error: Datos de compañía no válidos');
        showError('Datos de compañía no válidos');
        return;
      }
      
      // Asegurarnos de tener un ID válido usando distintas estrategias
      let companyId;
      let companyName = 'Empresa';
      
      if (typeof company === 'object') {
        // Intentar varias opciones para encontrar el ID
        if (company.companyId) {
          companyId = company.companyId;
          companyName = company.name || 'Empresa';
        } else if (company.id) {
          companyId = company.id;
          companyName = company.name || 'Empresa';
        } else if (company[0]) {
          companyId = company[0];
          companyName = company[1] || 'Empresa';
        }
      } else if (typeof company === 'number') {
        // Si nos pasan directamente el ID como número
        companyId = company;
      }
      
      console.log('ID final:', companyId, 'Nombre final:', companyName);
      
      // Validar que tenemos un ID
      if (!companyId) {
        console.error('Error: No se pudo obtener el ID de la compañía');
        showError('No se pudo obtener el ID de la compañía');
        return;
      }
      
      // Guardar los datos y abrir el modal
      setSelectedCompany({
        id: companyId,
        name: companyName
      });
      
      // Forzar un delay mínimo para asegurar que el estado se actualice
      setTimeout(() => {
        setRechargeModalOpen(true);
        console.log('Modal abierto, estado:', true);
      }, 50);
    } catch (error) {
      console.error('Error al abrir modal de recarga:', error);
      showError('Error al intentar abrir el modal de recarga');
    }
  };

  // Función para cerrar el modal de recarga de saldo
  const handleCloseRechargeModal = () => {
    setRechargeModalOpen(false);
    setSelectedCompany(null);
  };
  
  // Función para abrir el modal de tarifas
  const handleOpenTariffModal = (company: any) => {
    try {
      // Validar que tenemos datos válidos
      if (!company) {
        console.error('Error: Datos de compañía no válidos');
        showError('Datos de compañía no válidos');
        return;
      }
      
      // Asegurarnos de tener un ID válido usando distintas estrategias
      let companyId;
      let companyName = 'Empresa';
      
      if (typeof company === 'object') {
        // Intentar varias opciones para encontrar el ID
        if (company.companyId) {
          companyId = company.companyId;
          companyName = company.name || 'Empresa';
        } else if (company.id) {
          companyId = company.id;
          companyName = company.name || 'Empresa';
        } else if (company[0]) {
          companyId = company[0];
          companyName = company[1] || 'Empresa';
        }
      } else if (typeof company === 'number') {
        // Si nos pasan directamente el ID como número
        companyId = company;
      }
      
      // Validar que tenemos un ID
      if (!companyId) {
        console.error('Error: No se pudo obtener el ID de la compañía');
        showError('No se pudo obtener el ID de la compañía');
        return;
      }
      
      // Guardar los datos y abrir el modal
      setSelectedCompanyForTariff({
        id: companyId,
        name: companyName
      });
      
      setTimeout(() => {
        setTariffModalOpen(true);
      }, 50);
    } catch (error) {
      console.error('Error al abrir modal de tarifas:', error);
      showError('Error al intentar abrir el modal de tarifas');
    }
  };
  
  // Función para cerrar el modal de tarifas
  const handleCloseTariffModal = () => {
    setTariffModalOpen(false);
    setSelectedCompanyForTariff(null);
  };
  
  // Función que se ejecuta después de actualizar tarifas exitosamente
  const handleTariffSuccess = () => {
    // Cerrar el modal
    setTariffModalOpen(false);
    setSelectedCompanyForTariff(null);
    
    // Mostrar mensaje de éxito
    showSuccess('Tarifas actualizadas correctamente');
    
    // Recargar datos si es necesario
    callback();
  };

  // Función que se ejecuta después de una recarga exitosa
  const handleRechargeSuccess = (balanceData: any) => {
    console.log(`[${new Date().toISOString()}] Recarga exitosa, nuevo balance:`, balanceData);
    
    // Normalizar el balance para mostrar
    let balanceValue = '0.00';
    
    if (balanceData?.balanceUSD !== undefined && balanceData?.balanceUSD !== null) {
      // Si es un número, usar toFixed
      if (typeof balanceData.balanceUSD === 'number') {
        balanceValue = balanceData.balanceUSD.toFixed(2);
      } 
      // Si es string, verificar si se puede convertir a número
      else if (typeof balanceData.balanceUSD === 'string') {
        try {
          const numValue = parseFloat(balanceData.balanceUSD);
          if (!isNaN(numValue)) {
            balanceValue = numValue.toFixed(2);
          } else {
            balanceValue = balanceData.balanceUSD; // Mantener el string original
          }
        } catch (e) {
          balanceValue = balanceData.balanceUSD; // Mantener el string original
        }
      }
    }
    
    // Mostrar un mensaje de éxito con el saldo actualizado
    showSuccess(`Saldo recargado exitosamente. Nuevo saldo: $${balanceValue} USD`);
    
    // Enfoque de tres capas para garantizar la actualización:
    
    // 1. Actualización inmediata
    callback();
    
    // 2. Actualización con un pequeño retraso
    setTimeout(() => {
      callback(); // Recargar la lista de empresas
    }, 300);
    
    // 3. Actualización final para asegurar datos frescos
    setTimeout(() => {
      callback(); // Recargar la lista de empresas una última vez
    }, 1000);
  };

  // Usar extraActions para tener control directo sobre el botón
  const { columns } = COLUMNS_COMPANY({
    callback,
    // Usar extraActions para agregar los botones directamente sin pasar por ActionButton
    extraActions: (row: any) => [
      <Button 
        key="tariff-config"
        icon="pi pi-tag"
        onClick={() => {
          console.log('Botón de tarifas clickeado');
          handleOpenTariffModal(row);
        }}
        rounded 
        text 
        raised 
        severity="warning"
        tooltip="Tarifas"
        tooltipOptions={{ position: 'top' }}
        aria-label="Tarifas"
      />,
      <Button 
        key="recharge-direct"
        icon="pi pi-dollar"
        onClick={() => {
          console.log('Botón de recarga clickeado directamente');
          handleOpenRechargeModal(row);
        }}
        rounded 
        text 
        raised 
        severity="success"
        tooltip="Recargar Saldo"
        tooltipOptions={{ position: 'top' }}
        aria-label="Recargar Saldo"
      />,
      <Button 
        key="transactions-history"
        icon="pi pi-history"
        onClick={() => {
          const companyId = row.companyId || row.id || (typeof row === 'object' && row.hasOwnProperty('0') ? row[0] : null);
          const companyName = row.name || (typeof row === 'object' && row.hasOwnProperty('1') ? row[1] : 'Empresa');
          
          if (!companyId) {
            showError('No se pudo identificar el ID de la compañía');
            return;
          }
          
          router.push(`${ADMIN_ROUTES.COMPANY.TRANSACTION_HISTORY}?id=${companyId}&name=${encodeURIComponent(companyName)}`);
        }}
        rounded 
        text 
        raised 
        severity="info"
        tooltip="Ver Historial de Transacciones"
        tooltipOptions={{ position: 'top' }}
        aria-label="Ver Historial"
      />
    ]
  })

  return (
      <EmptyPage>
        <CustomToolbar className="m-2 mb-4" startStatus startNew={onClickAction} endStatus
          downloadExcel={() => downloadExcel(users)}
          downloadPdf={() => showError("No implementado")}/>
        <TableFilter
        size="small"
          dataKey="companyId"
          rowsPerPage={5}
          dataMenu={users}
          headerTableName={
            () => (
              <InfoMessage
              message={"A continuación se listan las empresas registradas en el sistema. Solo aparecerán los últimos 50 usuarios"}
              />
            )
          }
          columns={columns}
          emptyMessage={"No se encontraron empresa"}
          loading={isLoading}
          headerCardName={"Listado de empresas"}
          />
          
        {/* Modal de recarga de saldo */}
        {selectedCompany && (
          <RechargeBalanceModal
            isOpen={rechargeModalOpen}
            onClose={handleCloseRechargeModal}
            companyId={selectedCompany.id}
            companyName={selectedCompany.name}
            onSuccess={handleRechargeSuccess}
          />
        )}
        
        {/* Modal de configuración de tarifas */}
        {selectedCompanyForTariff && (
          <CompanyTariffModal
            isOpen={tariffModalOpen}
            onClose={handleCloseTariffModal}
            companyId={selectedCompanyForTariff.id}
            companyName={selectedCompanyForTariff.name}
            onSuccess={handleTariffSuccess}
          />
        )}
      </EmptyPage>
  )
}

export default CompanyPage
