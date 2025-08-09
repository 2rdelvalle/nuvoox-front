'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Tag } from 'primereact/tag';
import { Toolbar } from 'primereact/toolbar';
import { InputText } from 'primereact/inputtext';
import { ProgressSpinner } from 'primereact/progressspinner';
import { ProgressBar } from 'primereact/progressbar';
import { Badge } from 'primereact/badge';
import { CampaignService, CampaignResponseDto } from '@/shared/services/campaign/campaign.service';
import { CampaignStatus, CampaignProgress } from '@/shared/models/campaign';

const CampaignList: React.FC = () => {
  const router = useRouter();
  const toast = useRef<Toast>(null);
  
  const [campaigns, setCampaignsInternal] = useState<CampaignResponseDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedCampaigns, setSelectedCampaigns] = useState<CampaignResponseDto[]>([]);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<CampaignResponseDto | null>(null);
  const [campaignProgress, setCampaignProgress] = useState<Map<number, CampaignProgress>>(new Map());
  
  // 🔧 DEBUG: Wrapper para trackear cambios en el estado campaigns
  const setCampaigns = (newCampaigns: CampaignResponseDto[]) => {
    const debugId = `state_change_${Date.now()}`;
    const stack = new Error().stack;
    console.log(`[STATE-DEBUG][${debugId}] 🔄 Actualizando estado campaigns:`);
    console.log(`[STATE-DEBUG][${debugId}] 📊 Anterior: ${campaigns.length} campañas`);
    console.log(`[STATE-DEBUG][${debugId}] 📊 Nuevo: ${newCampaigns?.length || 0} campañas`);
    console.log(`[STATE-DEBUG][${debugId}] 📍 Llamado desde:`, stack?.split('\n')[2]?.trim());
    
    if (newCampaigns?.length === 0 && campaigns.length > 0) {
      console.error(`[STATE-DEBUG][${debugId}] 🚨 ALERTA: Se está vaciando el estado campaigns!`);
      console.error(`[STATE-DEBUG][${debugId}] 📋 Stack trace completo:`, stack);
    }
    
    setCampaignsInternal(newCampaigns);
  };
  
  // 🔧 REVERTED: Back to regular function to prevent auto-start bug (keeping stale closure fix in useEffect)
  const updateCampaignProgress = async (specificCampaignId?: number) => {
    try {
      const progressMap = new Map<number, CampaignProgress>(campaignProgress);
      const debugId = `frontend_progress_${Date.now()}`;
      
      console.log(`[FRONTEND-DEBUG][${debugId}] 🔍 Actualizando progreso de campaña...`);
      console.log(`[FRONTEND-DEBUG][${debugId}] 📊 Specific ID:`, specificCampaignId || 'TODAS');
      console.log(`[FRONTEND-DEBUG][${debugId}] 📋 Total campañas:`, campaigns.length);
      
      // Si se especifica un ID, actualizar solo esa campaña
      if (specificCampaignId) {
        try {
          console.log(`[FRONTEND-DEBUG][${debugId}] 📤 Consultando progreso para campaña: ${specificCampaignId}`);
          const progress = await CampaignService.getCampaignProgress(specificCampaignId);
          console.log(`[FRONTEND-DEBUG][${debugId}] 📊 Progreso recibido:`, progress);
          progressMap.set(specificCampaignId, progress);
        } catch (error) {
          console.error(`[FRONTEND-DEBUG][${debugId}] ❌ Error loading progress for campaign ${specificCampaignId}:`, error);
        }
      } else {
        // Si no se especifica ID, actualizar todas las campañas
        console.log(`[FRONTEND-DEBUG][${debugId}] 📤 Consultando progreso para TODAS las campañas (${campaigns.length})`);
        for (const campaign of campaigns) {
          if (campaign.id) {
            try {
              console.log(`[FRONTEND-DEBUG][${debugId}] 📤 Consultando progreso para campaña: ${campaign.id} (${campaign.name})`);
              const progress = await CampaignService.getCampaignProgress(campaign.id);
              console.log(`[FRONTEND-DEBUG][${debugId}] 📊 Progreso recibido para ${campaign.id}:`, progress);
              progressMap.set(campaign.id, progress);
            } catch (error) {
              console.error(`[FRONTEND-DEBUG][${debugId}] ❌ Error loading progress for campaign ${campaign.id}:`, error);
            }
          }
        }
      }
      
      console.log(`[FRONTEND-DEBUG][${debugId}] 💾 Actualizando estado del progreso...`);
      console.log(`[FRONTEND-DEBUG][${debugId}] 📋 Mapa de progreso final:`, Array.from(progressMap.entries()));
      setCampaignProgress(progressMap);
    } catch (error) {
      console.error('Error updating campaign progress:', error);
    }
  };

  const progressUpdateInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const debugId = `useeffect_init_${Date.now()}`;
    console.log(`[USEEFFECT-DEBUG][${debugId}] 🚀 Iniciando useEffect del componente`);
    console.log(`[USEEFFECT-DEBUG][${debugId}] 📋 Estado campaigns actual:`, campaigns.length);
    
    loadCampaigns();
  }, []); // Solo al mount

  // 🔧 OPTIMIZED: Solo configurar polling una vez y usar ref para campaigns actuales
  useEffect(() => {
    const debugId = `polling_setup_${Date.now()}`;
    console.log(`[POLLING-DEBUG][${debugId}] 🔄 Configurando polling inicial`);
    
    // Solo configurar polling una vez al mount o cuando campaigns cambia de empty a populated
    const hasInitialCampaigns = campaigns.length > 0;
    
    if (hasInitialCampaigns && !progressUpdateInterval.current) {
      console.log(`[POLLING-DEBUG][${debugId}] ⏰ Iniciando polling interval (cada 10s)`);
      progressUpdateInterval.current = setInterval(() => {
        const intervalDebugId = `polling_interval_${Date.now()}`;
        console.log(`[POLLING-DEBUG][${intervalDebugId}] ⏰ Ejecutando polling automático (cada 10s)`);
        updateCampaignProgress(); // updateCampaignProgress ya tiene access a campaigns actualizados
      }, 10000);
    }
    
    return () => {
      // Solo limpiar en unmount del componente
      console.log(`[POLLING-DEBUG][${debugId}] 🧹 Limpieza final del polling`);
    };
  }, [campaigns.length > 0]); // 🔧 Solo trigger cuando hay/no hay campañas (boolean)

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const debugId = `load_campaigns_${Date.now()}`;
      console.log(`[FRONTEND-DEBUG][${debugId}] 🔄 Iniciando carga de campañas...`);
      
      const data = await CampaignService.getAll();
      console.log(`[FRONTEND-DEBUG][${debugId}] 📊 Respuesta del backend:`, data);
      console.log(`[FRONTEND-DEBUG][${debugId}] 📋 Total campañas recibidas:`, data?.length || 0);
      
      setCampaigns(data);
      console.log(`[FRONTEND-DEBUG][${debugId}] 💾 Campañas guardadas en estado local`);
      
      // Load initial progress for each campaign
      await updateCampaignProgress();
    } catch (error: any) {
      console.error(`[FRONTEND-DEBUG] ❌ Error loading campaigns:`, error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar las campañas',
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    router.push('/campaigns/create');
  };

  const handleEdit = (campaign: CampaignResponseDto) => {
    router.push(`/campaigns/${campaign.id}`);
  };

  const handleSendCampaign = (campaign: CampaignResponseDto) => {
    const debugId = `auto_trigger_debug_${Date.now()}`;
    const stack = new Error().stack;
    console.log(`[AUTO-TRIGGER-DEBUG][${debugId}] 🚨 handleSendCampaign LLAMADO:`, {
      campaignId: campaign.id,
      campaignName: campaign.name,
      timestamp: new Date().toISOString(),
      stackTrace: stack?.split('\n').slice(1, 6) // Primeras 5 líneas del stack
    });
    
    // 🚨 CRÍTICO: Verificar si es llamada automática o por usuario
    if (!stack?.includes('onClick') && !stack?.includes('Button')) {
      console.error(`[AUTO-TRIGGER-DEBUG][${debugId}] 🔥 LLAMADA AUTOMÁTICA DETECTADA!`);
      console.error(`[AUTO-TRIGGER-DEBUG][${debugId}] 📋 Stack completo:`, stack);
      
      // TODO: Temporal - bloquear auto-trigger hasta encontrar root cause
      console.warn(`[AUTO-TRIGGER-DEBUG][${debugId}] ⛔ BLOQUEANDO auto-trigger temporal`);
      return;
    }
    
    console.log(`[AUTO-TRIGGER-DEBUG][${debugId}] ✅ Llamada legítima por usuario (onClick detectado)`);
    
    confirmDialog({
      message: `¿Está seguro de que desea enviar la campaña "${campaign.name}"? Esta acción iniciará el envío de mensajes a todos los contactos.`,
      header: 'Confirmar Envío de Campaña',
      icon: 'pi pi-send',
      acceptClassName: 'p-button-success',
      style: { maxWidth: '480px', width: '90%' },
      accept: async () => {
        try {
          setLoading(true);
          // Enviar campaña
          const response = await CampaignService.sendCampaign(campaign.id!);
          
          toast.current?.show({
            severity: 'success',
            summary: 'Éxito',
            detail: response.message,
            life: 3000,
          });

          // 🔧 FIX: Esperar 5 segundos antes de consultar progreso para capturar estado final
          console.log('[CAMPAIGN-TIMING-FIX] ⏱️ Esperando 5 segundos antes de consultar progreso...');
          setTimeout(async () => {
            console.log('[CAMPAIGN-TIMING-FIX] 📊 Consultando progreso después del delay...');
            await updateCampaignProgress(campaign.id);
          }, 5000);
          
        } catch (error: any) {
          console.error('Error sending campaign:', error);
          toast.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'Error al enviar la campaña',
            life: 5000,
          });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleDelete = (campaign: CampaignResponseDto) => {
    confirmDialog({
      message: `¿Está seguro de que desea eliminar la campaña "${campaign.name}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          await CampaignService.delete(campaign.id);
          showSuccess('Campaña eliminada exitosamente');
          loadCampaigns();
        } catch (error: any) {
          console.error('Error deleting campaign:', error);
          showError('Error al eliminar la campaña');
        }
      }
    });
  };

  const showSuccess = (message: string) => {
    toast.current?.show({ severity: 'success', summary: 'Éxito', detail: message });
  };

  const showError = (message: string) => {
    toast.current?.show({ severity: 'error', summary: 'Error', detail: message });
  };

  const getStatusSeverity = (status: string) => {
    switch (status) {
      case CampaignStatus.ACTIVE:
        return 'success';
      case CampaignStatus.DRAFT:
        return 'info';
      case CampaignStatus.PAUSED:
        return 'warning';
      case CampaignStatus.COMPLETED:
        return 'success';
      case CampaignStatus.CANCELLED:
        return 'danger';
      default:
        return 'info';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case CampaignStatus.ACTIVE:
        return 'Activa';
      case CampaignStatus.DRAFT:
        return 'Borrador';
      case CampaignStatus.PAUSED:
        return 'Pausada';
      case CampaignStatus.COMPLETED:
        return 'Completada';
      case CampaignStatus.CANCELLED:
        return 'Cancelada';
      default:
        return status;
    }
  };

  // Plantillas de columnas
  const statusBodyTemplate = (rowData: CampaignResponseDto) => {
    return (
      <Tag 
        value={getStatusLabel(rowData.status)} 
        severity={getStatusSeverity(rowData.status)}
      />
    );
  };

  const templateBodyTemplate = (rowData: CampaignResponseDto) => {
    return (
      <div>
        <div className="font-medium">{rowData.template.name}</div>
        <div className="text-sm text-500 mt-1">
          {rowData.template.textTemplate.substring(0, 50)}...
        </div>
      </div>
    );
  };

  const agentsBodyTemplate = (rowData: CampaignResponseDto) => {
    const count = rowData.selectedAgents.length;
    return (
      <div>
        <span className="font-medium">{count} agente{count !== 1 ? 's' : ''}</span>
        {count > 0 && (
          <div className="text-sm text-500 mt-1">
            {rowData.selectedAgents.slice(0, 2).map(agent => agent.name).join(', ')}
            {count > 2 && ` y ${count - 2} más`}
          </div>
        )}
      </div>
    );
  };

  const dateBodyTemplate = (rowData: CampaignResponseDto) => {
    return new Date(rowData.createdAt).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const progressBodyTemplate = (rowData: CampaignResponseDto) => {
    const progress = campaignProgress.get(rowData.id!);
    
    // Para campañas recién creadas sin progreso inicial
    if (!progress) {
      return (
        <div className="flex flex-column gap-1">
          <ProgressBar 
            value={0} 
            style={{ height: '8px' }}
            className="w-full"
          />
          <small className="text-center text-gray-500">
            Sin iniciar
          </small>
        </div>
      );
    }

    return (
      <div className="flex flex-column gap-1">
        <ProgressBar 
          value={progress.progressPercentage} 
          style={{ height: '8px' }}
          className="w-full"
        />
        <small className="text-center">
          {progress.sentMessages}/{progress.totalContacts} ({progress.progressPercentage}%)
        </small>
      </div>
    );
  };

  const campaignStatusBodyTemplate = (rowData: CampaignResponseDto) => {
    const progress = campaignProgress.get(rowData.id!);
    
    // Para campañas recién creadas sin progreso inicial
    if (!progress) {
      return <Badge value="Pendiente" severity="info" />;
    }

    const getSeverity = (status: string) => {
      switch (status) {
        case 'completado':
          return 'success';
        case 'procesando':
          return 'warning';
        case 'fallida':
          return 'danger';
        case 'pendiente':
          return 'info';
        default:
          return 'info';
      }
    };

    const getStatusText = (status: string) => {
      switch (status) {
        case 'completado':
          return 'Completado';
        case 'procesando':
          return 'Procesando';
        case 'fallida':
          return 'Fallida';
        case 'pendiente':
          return 'Pendiente';
        default:
          return 'Desconocido';
      }
    };

    return (
      <Badge 
        value={getStatusText(progress.status)} 
        severity={getSeverity(progress.status)}
      />
    );
  };

  const actionBodyTemplate = (rowData: CampaignResponseDto) => {
    const progress = campaignProgress.get(rowData.id!);
    
    // Para campañas sin progreso inicial (recién creadas) o con progreso válido
    const canSend = !progress || // Campaña recién creada sin progreso
      (progress && 
       progress.status !== 'completado' &&
       progress.status !== 'fallida');
    
    const isSending = progress && progress.status === 'procesando';

    return (
      <div className="flex gap-2">
        {canSend && (
          <Button
            icon={isSending ? "pi pi-spin pi-spinner" : "pi pi-play"}
            className={`p-button-rounded p-button-text ${
              isSending ? 'p-button-warning' : 'p-button-success'
            }`}
            onClick={() => handleSendCampaign(rowData)}
            disabled={isSending}
            tooltip={isSending ? "Enviando..." : "Enviar Campaña"}
            tooltipOptions={{ position: 'top' }}
          />
        )}
        <Button
          icon="pi pi-eye"
          className="p-button-rounded p-button-text p-button-info"
          onClick={() => handleEdit(rowData)}
          tooltip="Ver/Editar"
          tooltipOptions={{ position: 'top' }}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-text p-button-danger"
          onClick={() => handleDelete(rowData)}
          tooltip="Eliminar"
          tooltipOptions={{ position: 'top' }}
        />
      </div>
    );
  };

  // Toolbar
  const leftToolbarTemplate = () => {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          label="Nueva Campaña"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={handleCreate}
        />
      </div>
    );
  };

  const rightToolbarTemplate = () => {
    return (
      <div className="flex align-items-center gap-2">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            type="search"
            placeholder="Buscar campañas..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <div className="campaign-list">
      <Toast ref={toast} />
      <ConfirmDialog />
      
      <div className="card">
        <Toolbar 
          className="mb-4" 
          left={leftToolbarTemplate} 
          right={rightToolbarTemplate}
        />

        <DataTable
          value={campaigns}
          selection={selectedCampaigns}
          onSelectionChange={(e) => setSelectedCampaigns(e.value as CampaignResponseDto[])}
          selectionMode="multiple"
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          className="datatable-responsive"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} campañas"
          globalFilter={globalFilter}
          emptyMessage="No se encontraron campañas."
          responsiveLayout="scroll"
        >
          <Column 
            selectionMode="multiple" 
            headerStyle={{ width: '3rem' }}
          />
          
          <Column
            field="name"
            header="Nombre"
            sortable
            style={{ minWidth: '200px' }}
          />
          
          <Column
            field="type"
            header="Tipo"
            sortable
            style={{ minWidth: '100px' }}
            body={(rowData) => (
              <Tag value={rowData.type.toUpperCase()} severity="info" />
            )}
          />
          
          <Column
            field="status"
            header="Estado"
            body={statusBodyTemplate}
            sortable
            style={{ minWidth: '120px' }}
          />
          
          <Column
            field="template"
            header="Plantilla"
            body={templateBodyTemplate}
            style={{ minWidth: '250px' }}
          />
          
          <Column
            field="selectedAgents"
            header="Agentes"
            body={agentsBodyTemplate}
            style={{ minWidth: '150px' }}
          />
          
          <Column
            field="createdAt"
            header="Fecha Creación"
            body={dateBodyTemplate}
            sortable
            style={{ minWidth: '150px' }}
          />
          
          <Column
            header="Progreso"
            body={progressBodyTemplate}
            style={{ minWidth: '180px' }}
          />
          
          <Column
            header="Estado"
            body={campaignStatusBodyTemplate}
            style={{ minWidth: '120px' }}
          />
          
          <Column
            body={actionBodyTemplate}
            header="Acciones"
            style={{ minWidth: '120px' }}
          />
        </DataTable>
      </div>
    </div>
  );
};

export default CampaignList;
