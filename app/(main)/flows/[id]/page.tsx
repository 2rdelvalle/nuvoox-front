'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Chip } from 'primereact/chip';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { flowService, Flow } from '@/shared/services';

interface FlowStep {
  id: string;
  type: string;
  data: any;
}

const FlowDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const toast = useRef<Toast>(null);
  const flowId = typeof params.id === 'string' ? parseInt(params.id) : null;
  
  const [flow, setFlow] = useState<Flow | null>(null);
  const [loading, setLoading] = useState(true);
  const [steps, setSteps] = useState<FlowStep[]>([]);

  useEffect(() => {
    if (flowId) {
      loadFlowDetails();
    }
  }, [flowId]);

  const loadFlowDetails = async () => {
    try {
      setLoading(true);
      const flowData = await flowService.getFlowById(flowId!);
      setFlow(flowData);
      
      // Procesar nodos como pasos del flujo
      if (flowData.nodes && Array.isArray(flowData.nodes)) {
        const flowSteps = flowData.nodes.map(node => ({
          id: node.id || 'unknown',
          type: node.type || 'unknown',
          data: node.data || {}
        }));
        setSteps(flowSteps);
      }
    } catch (error) {
      console.error('Error cargando detalles del flujo:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo cargar el flujo'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/flows/${flowId}/edit`);
  };

  const handleDesigner = () => {
    const isFlowDesignerEnabled = process.env.NEXT_PUBLIC_ENABLE_FLOW_DESIGNER === 'true';
    if (isFlowDesignerEnabled) {
      router.push(`/flows/${flowId}/designer`);
    } else {
      toast.current?.show({
        severity: 'warn',
        summary: 'Funcionalidad No Disponible',
        detail: 'El diseñador visual está deshabilitado'
      });
    }
  };

  const handleBack = () => {
    router.push('/flows/list');
  };

  const getTriggerTypeLabel = (triggerType: string) => {
    const labels = {
      keyword: 'Palabra Clave',
      template_response: 'Respuesta de Plantilla',
      welcome: 'Bienvenida',
      default: 'Por Defecto'
    };
    return labels[triggerType as keyof typeof labels] || triggerType;
  };

  const getStatusSeverity = (isActive: boolean) => {
    return isActive ? 'success' : 'warning';
  };

  const stepTypeBodyTemplate = (rowData: FlowStep) => {
    const typeLabels = {
      start: 'Inicio',
      message: 'Mensaje',
      condition: 'Condición',
      action: 'Acción',
      end: 'Fin'
    };
    
    return (
      <Chip 
        label={typeLabels[rowData.type as keyof typeof typeLabels] || rowData.type}
        className="p-mr-2"
      />
    );
  };

  const stepContentBodyTemplate = (rowData: FlowStep) => {
    const content = rowData.data?.label || rowData.data?.message || rowData.data?.content || 'Sin contenido';
    return (
      <span className="text-900" style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {content}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <ProgressSpinner />
      </div>
    );
  }

  if (!flow) {
    return (
      <div className="grid">
        <div className="col-12">
          <Card>
            <div className="text-center">
              <i className="pi pi-exclamation-triangle text-6xl text-orange-500 mb-3"></i>
              <h3>Flujo no encontrado</h3>
              <p className="text-600 mb-4">El flujo solicitado no existe o no tienes permisos para verlo.</p>
              <Button 
                label="Volver a la Lista" 
                icon="pi pi-arrow-left"
                onClick={handleBack}
              />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toast ref={toast} />
      <div className="grid">
        {/* Header */}
        <div className="col-12">
          <Card>
            <div className="flex justify-content-between align-items-start">
              <div className="flex-1">
                <div className="flex align-items-center gap-3 mb-3">
                  <h2 className="m-0">{flow.name}</h2>
                  <Tag
                    value={flow.isActive ? 'Activo' : 'Inactivo'}
                    severity={getStatusSeverity(flow.isActive)}
                  />
                </div>
                
                {flow.description && (
                  <p className="text-600 mb-3">{flow.description}</p>
                )}
                
                <div className="grid">
                  <div className="col-12 md:col-6">
                    <div className="field">
                      <label className="text-sm font-semibold text-900">Tipo de Disparador:</label>
                      <div className="mt-1">
                        <Chip label={getTriggerTypeLabel(flow.triggerType)} />
                      </div>
                    </div>
                  </div>
                  
                  {flow.triggerValue && (
                    <div className="col-12 md:col-6">
                      <div className="field">
                        <label className="text-sm font-semibold text-900">Valor del Disparador:</label>
                        <div className="mt-1">
                          <span className="text-900">{flow.triggerValue}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="col-12 md:col-6">
                    <div className="field">
                      <label className="text-sm font-semibold text-900">Prioridad:</label>
                      <div className="mt-1">
                        <span className="text-900">{flow.priority}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-12 md:col-6">
                    <div className="field">
                      <label className="text-sm font-semibold text-900">Versión:</label>
                      <div className="mt-1">
                        <span className="text-900">{flow.version || 1}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 text-sm text-600">
                  <span>Creado: {new Date(flow.createdAt).toLocaleString()}</span>
                  <span>•</span>
                  <span>Actualizado: {new Date(flow.updatedAt).toLocaleString()}</span>
                  {flow.lastSavedAt && (
                    <>
                      <span>•</span>
                      <span>Último guardado: {new Date(flow.lastSavedAt).toLocaleString()}</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  label="Volver"
                  icon="pi pi-arrow-left"
                  className="p-button-text"
                  onClick={handleBack}
                />
                <Button
                  label="Editar"
                  icon="pi pi-pencil"
                  className="p-button-outlined"
                  onClick={handleEdit}
                />
                <Button
                  label="Diseñador"
                  icon="pi pi-sitemap"
                  onClick={handleDesigner}
                  disabled={process.env.NEXT_PUBLIC_ENABLE_FLOW_DESIGNER !== 'true'}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Pasos del Flujo */}
        <div className="col-12">
          <Card>
            <div className="flex justify-content-between align-items-center mb-4">
              <h3 className="m-0">Pasos del Flujo</h3>
              <span className="text-600">
                {steps.length} paso{steps.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            {steps.length > 0 ? (
              <DataTable
                value={steps}
                className="p-datatable-gridlines"
                emptyMessage="No hay pasos configurados en este flujo"
              >
                <Column field="id" header="ID" style={{ width: '100px' }} />
                <Column field="type" header="Tipo" body={stepTypeBodyTemplate} style={{ width: '150px' }} />
                <Column header="Contenido" body={stepContentBodyTemplate} />
              </DataTable>
            ) : (
              <div className="text-center py-4">
                <i className="pi pi-info-circle text-3xl text-blue-500 mb-3"></i>
                <p className="text-600">Este flujo no tiene pasos configurados aún.</p>
                <Button
                  label="Configurar en Diseñador"
                  icon="pi pi-sitemap"
                  className="p-button-outlined"
                  onClick={handleDesigner}
                  disabled={process.env.NEXT_PUBLIC_ENABLE_FLOW_DESIGNER !== 'true'}
                />
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
};

export default FlowDetailPage;
