'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Sidebar } from 'primereact/sidebar';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useFlowDesignerStore } from '@/shared/stores/flow-designer-store';
import FlowDesigner from '@/shared/components/flow-designer/FlowDesigner';
import FlowInspector from '@/shared/components/flow-designer/FlowInspector';
import { validateFlowDesign } from '@/shared/schemas/flow-validation.schema';

interface FlowDesignerPageProps {}

const FlowDesignerPage: React.FC<FlowDesignerPageProps> = () => {
  const params = useParams();
  const router = useRouter();
  const flowId = typeof params.id === 'string' ? parseInt(params.id) : null;
  
  // Feature flag check
  const isFlowDesignerEnabled = process.env.NEXT_PUBLIC_ENABLE_FLOW_DESIGNER === 'true';
  
  // Zustand store
  const {
    currentDesign,
    selectedNode,
    selectedEdge,
    isInspectorOpen,
    isDirty,
    isSaving,
    lastSaved,
    validationErrors,
    setFlowId,
    setCurrentDesign,
    setSelectedNode,
    setInspectorOpen,
    markDirty,
    setSaving,
    setLastSaved,
    markClean,
    reset
  } = useFlowDesignerStore();
  
  // Estados locales
  const [isLoading, setIsLoading] = useState(true);
  const [flowInfo, setFlowInfo] = useState<{
    name: string;
    description: string;
    companyId: number;
  } | null>(null);
  
  // Feature flag guard - redirigir si no está habilitado
  useEffect(() => {
    if (!isFlowDesignerEnabled) {
      router.push('/flows/list');
      return;
    }
  }, [isFlowDesignerEnabled, router]);
  
  // Inicializar store con flowId
  useEffect(() => {
    if (flowId) {
      setFlowId(flowId);
      loadFlowDesign(flowId);
    }
    
    return () => {
      // Cleanup al desmontar
      reset();
    };
  }, [flowId, setFlowId, reset]);
  
  const loadFlowDesign = async (id: number) => {
    try {
      setIsLoading(true);
      
      // TODO: Cargar diseño desde API
      // Por ahora mock data para desarrollo
      const mockDesign = {
        id: 1,
        flowId: id,
        version: 1,
        nodes: [
          {
            id: 'start-1',
            type: 'message' as const,
            position: { x: 100, y: 100 },
            data: {
              label: 'Mensaje de Bienvenida',
              messageText: '¡Hola! Bienvenido a nuestro servicio.'
            }
          }
        ],
        edges: [],
        variables: [],
        metadata: {
          lastModified: new Date().toISOString(),
          modifiedBy: 1,
          isDraft: true
        }
      };
      
      setCurrentDesign(mockDesign);
      setFlowInfo({
        name: `Flujo de Prueba ${id}`,
        description: 'Flujo de ejemplo para el diseñador',
        companyId: 1
      });
      
    } catch (error) {
      console.error('Error cargando diseño del flujo:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSave = async () => {
    if (!currentDesign || !isDirty) return;
    
    try {
      setSaving(true);
      
      // Validar diseño con Zod
      const validation = validateFlowDesign(currentDesign);
      
      if (!validation.success) {
        console.error('Errores de validación:', validation.errors);
        // TODO: Mostrar errores en Toast
        return;
      }
      
      // TODO: Guardar en API
      // const response = await flowService.saveDesign(validation.data);
      
      // Mock save
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setLastSaved(new Date().toISOString());
      markClean();
      
    } catch (error) {
      console.error('Error guardando flujo:', error);
    } finally {
      setSaving(false);
    }
  };
  
  const handleBack = () => {
    if (isDirty) {
      // TODO: Mostrar confirmación de cambios sin guardar
    }
    router.push('/flows/list');
  };
  
  // No renderizar si feature flag está deshabilitado
  if (!isFlowDesignerEnabled) {
    return null;
  }
  
  if (isLoading) {
    return (
      <div className="flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <ProgressSpinner />
      </div>
    );
  }
  
  return (
    <div className="grid" style={{ height: 'calc(100vh - 200px)' }}>
      <Toast />
      
      {/* Header */}
      <div className="col-12">
        <Card>
          <div className="flex justify-content-between align-items-center">
            <div>
              <h2 className="m-0">{flowInfo?.name || 'Diseñador de Flujos'}</h2>
              <p className="text-600 mt-1 mb-0">{flowInfo?.description || 'Editor visual de conversaciones'}</p>
              {lastSaved && (
                <small className="text-500">
                  Último guardado: {new Date(lastSaved).toLocaleString()}
                </small>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                label="Volver"
                icon="pi pi-arrow-left"
                className="p-button-text"
                onClick={handleBack}
              />
              <Button
                label="Inspector"
                icon="pi pi-cog"
                className={isInspectorOpen ? 'p-button-info' : 'p-button-outlined'}
                onClick={() => setInspectorOpen(!isInspectorOpen)}
              />
              <Button
                label={isSaving ? 'Guardando...' : 'Guardar'}
                icon={isSaving ? 'pi pi-spin pi-spinner' : 'pi pi-save'}
                disabled={!isDirty || isSaving}
                onClick={handleSave}
              />
            </div>
          </div>
        </Card>
      </div>
      
      {/* Canvas Principal */}
      <div className={isInspectorOpen ? 'col-8' : 'col-12'}>
        <FlowDesigner 
          flowId={flowId!}
          className="h-full"
        />
      </div>
      
      {/* Inspector Lateral */}
      <Sidebar
        visible={isInspectorOpen}
        position="right"
        onHide={() => setInspectorOpen(false)}
        style={{ width: '400px' }}
        className="p-sidebar-lg"
      >
        <FlowInspector />
      </Sidebar>
    </div>
  );
};

export default FlowDesignerPage;
