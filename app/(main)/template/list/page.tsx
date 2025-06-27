"use client"
import { useToast } from "@/shared/context/toast/toastContext"
import { usePush } from "@/shared/customHooks/usePush"
import { useFetchWithParams } from "@/shared/hooks/useFetchWithParams"
import useRealtimeTemplate from "@/shared/hooks/useRealtimeTemplate"
import { ADMIN_ROUTES } from "@/shared/routes/admin.routes"
import {
  TemplateService as _template
} from "@/shared/services/index"
import { COLUMNS_TEMPLATE } from "@/shared/services/template"
import CustomToolbar from "@/shared/small-components/CustomToolbar/customToolbar"
import EmptyPage from "@/shared/small-components/EmptyPage/emptyPage"
import InfoMessage from "@/shared/small-components/InfoMessage/infoMessage"
import TableFilter from "@/shared/small-components/TableFilter/tableFilter"
import { downloadExcel } from "@/shared/utilities/excel/exportExcel"
import { useState, useEffect, useCallback, useRef } from "react" 
import { useChatStore } from "../../chat/whatsapp/store/chat-store"
import { useInitializeUserFromToken } from "@/shared/customHooks/useInitializeUserFromToken"

const TemplatesPage = () => {
  const { showError, showSuccess } = useToast()

  const { user } = useChatStore()
  // Variable no utilizada actualmente, se mantiene para futuras implementaciones
  // const [isCompanyRole, setIsCompanyRole] = useState(false)

  useInitializeUserFromToken()
  const { onClickAction } = usePush(ADMIN_ROUTES.TEMPLATE.CREATE)
  const { fetchData, responseData: templates, isLoading } = useFetchWithParams(_template.getAllByCompany)
  // Extraemos las funciones y componentes del servicio de columnas
  const { columns, PreviewTemplate, previewTemplate, previewVisible, hidePreview } = COLUMNS_TEMPLATE()
  const { data } = useRealtimeTemplate(`${process.env.NEXT_PUBLIC_SOCKET_URL}`)

  // Verificar si el usuario tiene rol de empresa - comentado por no usarse actualmente
  /*useEffect(() => {
    if (user?.role?.name) {
      setIsCompanyRole(user.role.name.toLowerCase().includes('empresa'))
    }
  }, [user])*/

  // Variable para controlar si ya se hizo una solicitud inicial
  const didInitialFetchRef = useRef(false);
  
  // Control de tiempo entre actualizaciones por eventos realtime
  const lastFetchTimeRef = useRef(Date.now());
  const THROTTLE_TIME = 5000; // 5 segundos entre actualizaciones para evitar sobrecarga
  
  // Usamos useCallback para memorizar la función fetchData y evitar re-renders innecesarios
  const fetchTemplates = useCallback(() => {
    // Solo hacer fetch si hay un ID de compañía válido
    if (!user?.company?.companyId) {
      return;
    }
    
    fetchData(user.company.companyId);
  }, [fetchData, user?.company?.companyId])

  // Estado para mostrar notificaciones de actualizaciones
  const [lastEventType, setLastEventType] = useState<string | null>(null);

  // Un solo efecto unificado para manejar la carga de datos
  useEffect(() => {
    // Para la carga inicial (solo una vez)
    if (!didInitialFetchRef.current && user?.company?.companyId) {
      fetchTemplates();
      didInitialFetchRef.current = true;
      return;
    }
  }, [fetchTemplates, user?.company?.companyId]);
  
  // Efecto separado para manejar eventos en tiempo real
  useEffect(() => {
    // Para actualizaciones por cambios en data de tiempo real
    if (!data || !didInitialFetchRef.current) return;
    
    const now = Date.now();
    const eventType = data.eventType;
    
    // Mostrar un mensaje informativo sobre el tipo de evento
    setLastEventType(eventType);
    
    // Log detallado del evento para depuración
    console.log(`🔄 Evento de plantilla detectado: ${eventType}`, data);
    console.log('Datos del evento completo:', JSON.stringify(data));
    
    // Siempre procesar inmediatamente cambios de aprobación/rechazo
    if (eventType === 'approval' || eventType === 'rejection') {
      console.log('⚡ Actualizando inmediatamente por cambio de estado importante');
      fetchTemplates();
      lastFetchTimeRef.current = now;
      
      // Mostrar mensaje de éxito
      if (eventType === 'approval') {
        showSuccess(`¡Plantilla ${data.data.templateName} ha sido aprobada por Meta!`);
      } else if (eventType === 'rejection') {
        showError(`La plantilla ${data.data.templateName} ha sido rechazada por Meta.`);
      }
    }
    // Para otros eventos usar el throttle
    else if (now - lastFetchTimeRef.current > THROTTLE_TIME) {
      console.log('🔄 Actualizando plantillas por evento realtime');
      fetchTemplates();
      lastFetchTimeRef.current = now;
    } else {
      console.log(`⏱️ Evento recibido pero throttled (${THROTTLE_TIME - (now - lastFetchTimeRef.current)}ms restantes)`);
    }
  }, [data, fetchTemplates, showSuccess, showError])

  return (
      <EmptyPage>
        {/* Mostrar estadísticas solo para usuarios con rol de empresa */}


        <CustomToolbar className="m-2 mb-4" startStatus endStatus
          downloadExcel={() => downloadExcel(templates)}
          startNew={onClickAction}
          downloadPdf={() => showError("No implementado")}/>
        <TableFilter
        size="normal"
          dataKey="id"
          rowsPerPage={5}
          dataMenu={templates}
          headerTableName={
            () => (
              <InfoMessage
              message={"A continuación se listan las plantillas registrados en el sistema." +
                "Solo aparecerán las últimas 50 plantillas."}
              />
            )
          }
          columns={columns}
          emptyMessage={"No se encontraron Plantillas"}
          loading={isLoading}
          headerCardName={"Listado de Plantillas"}
          />
          
        {/* Componente de previsualización de plantilla */}
        {previewTemplate && (
          <PreviewTemplate 
            template={previewTemplate} 
            visible={previewVisible} 
            onHide={hidePreview} 
          />
        )}
      </EmptyPage>
  )
}

export default TemplatesPage
