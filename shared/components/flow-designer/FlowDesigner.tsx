'use client';

import React, { useCallback, useState, useRef } from 'react';
import { Button } from 'primereact/button';
import { Toolbar } from 'primereact/toolbar';
import ReactFlow, { 
  Controls, 
  Background, 
  MiniMap,
  ConnectionMode,
  Connection,
  addEdge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  IsValidConnection
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useFlowDesignerStore, FlowNode, FlowEdge } from '@/shared/stores/flow-designer-store';
import { nodeTypes } from './nodes';
import { ConditionEdge } from './edges/ConditionEdge';

interface FlowDesignerProps {
  flowId: number;
  className?: string;
}

// Definir edge types
const edgeTypes = {
  conditional: ConditionEdge,
};

export const FlowDesigner: React.FC<FlowDesignerProps> = ({ 
  flowId, 
  className 
}) => {
  // Feature flag para habilitar el nuevo diseñador ReactFlow
  const isNewDesignerEnabled = process.env.NEXT_PUBLIC_ENABLE_FLOW_DESIGNER === 'true';
  const { 
    nodes,
    edges,
    viewport,
    selectedNode, 
    setSelectedNode, 
    addNode,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setViewport
  } = useFlowDesignerStore();
  
  const [draggedNodeType, setDraggedNodeType] = useState<string | null>(null);
  
  // Tipos de nodos disponibles para la palette
  const nodeTypesData = [
    { type: 'message', label: 'Mensaje', icon: 'pi-comment', color: '#3B82F6' },
    { type: 'question', label: 'Pregunta', icon: 'pi-question-circle', color: '#10B981' },
    { type: 'condition', label: 'Condición', icon: 'pi-directions', color: '#F59E0B' },
    { type: 'action', label: 'Acción', icon: 'pi-cog', color: '#8B5CF6' },
    { type: 'wait', label: 'Espera', icon: 'pi-clock', color: '#6B7280' },
    { type: 'handoff', label: 'Transferir', icon: 'pi-user', color: '#EF4444' },
    { type: 'end', label: 'Final', icon: 'pi-stop-circle', color: '#374151' }
  ];
  
  // Función para validar conexiones
  const isValidConnection = useCallback((connection: Connection) => {
    // Prevenir auto-conexión
    if (connection.source === connection.target) return false;
    
    // Buscar nodos source y target
    const sourceNode = nodes.find(n => n.id === connection.source);
    const targetNode = nodes.find(n => n.id === connection.target);
    
    if (!sourceNode || !targetNode) return false;
    
    // Reglas específicas por tipo de nodo:
    
    // EndNode no puede tener conexiones salientes (solo target)
    if (sourceNode.type === 'end') return false;
    
    // Solo un nodo puede ser el start del flujo - prevenir múltiples entradas a nodos sin entrada previa
    // (Esta validación se hará más compleja con Zod)
    
    // WaitNode debe usar handles específicos (timeout, next)
    if (sourceNode.type === 'wait' && connection.sourceHandle) {
      const validHandles = ['timeout', 'next'];
      if (!validHandles.includes(connection.sourceHandle)) return false;
    }
    
    // QuestionNode debe usar handles específicos según tipo
    if (sourceNode.type === 'question' && connection.sourceHandle) {
      const validHandles = ['yes', 'no', 'valid', 'invalid', 'option-1', 'option-2', 'option-3'];
      if (!validHandles.includes(connection.sourceHandle)) return false;
    }
    
    // ConditionNode debe usar handles true/false
    if (sourceNode.type === 'condition' && connection.sourceHandle) {
      const validHandles = ['true', 'false'];
      if (!validHandles.includes(connection.sourceHandle)) return false;
    }
    
    // HandoffNode debe usar handles específicos (success, operator_busy, failure)
    if (sourceNode.type === 'handoff' && connection.sourceHandle) {
      const validHandles = ['success', 'operator_busy', 'failure'];
      if (!validHandles.includes(connection.sourceHandle)) return false;
    }
    
    return true;
  }, [nodes]);

  // Crear nuevo nodo desde drag and drop
  const handleCreateNode = useCallback((type: string, position: { x: number; y: number }) => {
    const newNode: FlowNode = {
      id: `${type}-${Date.now()}`,
      type: type as any,
      position,
      data: {
        label: `Nuevo ${type}`,
        messageText: type === 'message' ? 'Escribe tu mensaje aquí...' : undefined
      }
    };
    
    addNode(newNode);
    setSelectedNode(newNode);
  }, [addNode, setSelectedNode]);

  // Manejar selección de nodos
  const handleNodeClick = useCallback((_event: React.MouseEvent, node: any) => {
    setSelectedNode(node as FlowNode);
  }, [setSelectedNode]);

  // Manejar drop de nodos en el canvas
  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    
    if (!draggedNodeType) return;
    
    // Obtener posición relativa al ReactFlow viewport
    const reactFlowBounds = (event.target as Element).closest('.react-flow')?.getBoundingClientRect();
    if (!reactFlowBounds) return;
    
    const position = {
      x: event.clientX - reactFlowBounds.left - viewport.x,
      y: event.clientY - reactFlowBounds.top - viewport.y
    };
    
    handleCreateNode(draggedNodeType, position);
    setDraggedNodeType(null);
  }, [draggedNodeType, handleCreateNode, viewport]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);
  
  // Toolbar de herramientas
  const toolbarLeft = (
    <div className="flex gap-2">
      <span className="text-sm font-medium text-600">Arrastra los elementos al canvas:</span>
    </div>
  );
  
  const toolbarRight = (
    <div className="flex gap-1">
      {nodeTypesData.map((nodeType) => (
        <Button
          key={nodeType.type}
          label={nodeType.label}
          icon={nodeType.icon}
          className="p-button-outlined p-button-sm"
          style={{ 
            borderColor: nodeType.color,
            color: nodeType.color 
          }}
          draggable
          onDragStart={() => setDraggedNodeType(nodeType.type)}
          onDragEnd={() => setDraggedNodeType(null)}
          tooltip={`Arrastra para crear ${nodeType.label}`}
        />
      ))}
    </div>
  );
  
  // Renderizar diseñador basado en feature flag
  if (isNewDesignerEnabled) {
    return (
      <div className={`flow-designer h-full ${className}`}>
        {/* Toolbar de herramientas */}
        <Toolbar 
          left={toolbarLeft} 
          right={toolbarRight}
          className="mb-2"
        />
        
        {/* ReactFlow Canvas */}
        <div className="h-full" style={{ minHeight: '500px' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            isValidConnection={isValidConnection}
            connectionMode={ConnectionMode.Loose}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            defaultViewport={viewport}
            onMove={(_, viewport) => setViewport(viewport)}
          >
            {/* Controles de ReactFlow */}
            <Controls />
            
            {/* Fondo con patrón */}
            <Background 
              gap={12} 
              size={1} 
              color="#94a3b8"
            />
            
            {/* Minimapa */}
            <MiniMap
              nodeColor={(node) => {
                const nodeTypeData = nodeTypesData.find(nt => nt.type === node.type);
                return nodeTypeData?.color || '#6B7280';
              }}
              nodeStrokeWidth={3}
              pannable
              zoomable
            />
          </ReactFlow>
        </div>
      </div>
    );
  }

  // Fallback al diseñador legacy (canvas custom)
  return (
    <div className={`flow-designer h-full ${className}`}>
      <div className="text-center py-8 text-gray-500">
        <i className="pi pi-info-circle text-2xl mb-2"></i>
        <p>Diseñador ReactFlow no habilitado</p>
        <p className="text-sm">Configura NEXT_PUBLIC_ENABLE_FLOW_DESIGNER=true para usar el nuevo diseñador</p>
      </div>
    </div>
  );
};

export default FlowDesigner;
