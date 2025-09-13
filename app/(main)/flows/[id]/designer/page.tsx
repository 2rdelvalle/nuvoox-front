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
import { flowService } from '@/shared/services/flow/flow.service';

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
    viewport,
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
      
      // Cargar flujo real desde la API
      const flowData = await flowService.getFlowById(id);
      const canvasData = await flowService.getFlowCanvas(id);
      
      // Crear diseño usando datos reales del backend
      const realDesign = {
        id: flowData.id,
        flowId: id,
        version: flowData.version || 1,
        nodes: canvasData.nodes || [
          {
            id: 'start-1',
            type: 'message' as const,
            position: { x: 100, y: 100 },
            data: {
              label: 'Mensaje de Bienvenida',
              messageText: flowData.description || '¡Hola! Bienvenido a nuestro servicio.'
            }
          }
        ],
        edges: canvasData.edges || [],
        variables: [],
        metadata: {
          lastModified: canvasData.lastModified || new Date().toISOString(),
          modifiedBy: 1,
          isDraft: true
        }
      };
      
      setCurrentDesign(realDesign);
      setFlowInfo({
        name: flowData.name,
        description: flowData.description || 'Flujo conversacional',
        companyId: flowData.companyId
      });
      
    } catch (error) {
      console.error('Error cargando diseño del flujo:', error);
      
      // Fallback a datos mock si la API falla
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
        name: `Flujo ${id}`,
        description: 'Flujo conversacional',
        companyId: 1
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSave = async () => {
    console.log('🔄 [SAVE] Iniciando proceso de guardado...');
    console.log('🔍 [SAVE] Estado inicial:', {
      hasCurrentDesign: !!currentDesign,
      isDirty,
      flowId,
      nodesCount: currentDesign?.nodes?.length || 0,
      edgesCount: currentDesign?.edges?.length || 0
    });
    
    if (!currentDesign || !isDirty || !flowId) {
      console.log('❌ [SAVE] Guardado cancelado - condiciones no cumplidas:', {
        hasCurrentDesign: !!currentDesign,
        isDirty,
        flowId
      });
      return;
    }
    
    try {
      setSaving(true);
      console.log('🔄 [SAVE] Estado de guardado activado');
      
      // Validar diseño con Zod
      console.log('🔍 [VALIDATION] Iniciando validación del diseño...');
      console.log('🔍 [VALIDATION] Diseño a validar:', {
        id: currentDesign.id,
        flowId: currentDesign.flowId,
        version: currentDesign.version,
        nodesCount: currentDesign.nodes?.length || 0,
        edgesCount: currentDesign.edges?.length || 0,
        hasMetadata: !!currentDesign.metadata,
        variablesCount: currentDesign.variables?.length || 0
      });
      
      const validation = validateFlowDesign(currentDesign);
      
      console.log('🔍 [VALIDATION] Resultado de validación:', {
        success: validation.success,
        errorsCount: validation.success ? 0 : validation.errors?.length || 0
      });
      
      if (!validation.success) {
        console.error('❌ [VALIDATION] Errores de validación detallados:', validation.errors);
        validation.errors?.forEach((error, index) => {
          console.error(`❌ [VALIDATION] Error ${index + 1}:`, {
            path: error.path,
            message: error.message,
            code: error.code,
            errorData: error
          });
        });
        
        // TODO: Mostrar errores en Toast
        console.log('❌ [SAVE] Guardado bloqueado por errores de validación');
        return;
      }
      
      console.log('✅ [VALIDATION] Validación exitosa, procediendo con guardado...');
      
      // Preparar datos del canvas para la API
      const canvasData = {
        nodes: currentDesign.nodes || [],
        edges: currentDesign.edges || [],
        viewport: viewport || { x: 0, y: 0, zoom: 1 },
        lastModified: new Date().toISOString()
      };
      
      console.log('📤 [API] Preparando petición a saveFlowCanvas:', {
        flowId,
        nodesCount: canvasData.nodes.length,
        edgesCount: canvasData.edges.length,
        viewport: canvasData.viewport,
        lastModified: canvasData.lastModified
      });
      
      // Guardar canvas en API real
      console.log('📤 [API] Enviando petición PUT /flows/:id/canvas...');
      const response = await flowService.saveFlowCanvas(flowId, canvasData);
      
      console.log('📥 [API] Respuesta recibida:', response);
      
      if (response.success) {
        setLastSaved(response.lastModified || new Date().toISOString());
        markClean();
        console.log('✅ [SAVE] Flujo guardado exitosamente');
      } else {
        console.error('❌ [API] Respuesta no exitosa:', response);
      }
      
    } catch (error) {
      console.error('❌ [SAVE] Error durante el guardado:', error);
      if (error instanceof Error) {
        console.error('❌ [SAVE] Stack trace:', error.stack);
        console.error('❌ [SAVE] Error message:', error.message);
      }
      // TODO: Mostrar error en Toast
    } finally {
      setSaving(false);
      console.log('🔄 [SAVE] Estado de guardado desactivado');
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
