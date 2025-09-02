'use client';

import React, { useCallback, useState, useRef } from 'react';
import { Button } from 'primereact/button';
import { Toolbar } from 'primereact/toolbar';
import { useFlowDesignerStore, FlowNode } from '@/shared/stores/flow-designer-store';

interface FlowDesignerProps {
  flowId: number;
  className?: string;
}

export const FlowDesigner: React.FC<FlowDesignerProps> = ({ 
  flowId, 
  className 
}) => {
  const { 
    currentDesign, 
    selectedNode, 
    setSelectedNode, 
    addNode, 
    markDirty 
  } = useFlowDesignerStore();
  
  const [draggedNodeType, setDraggedNodeType] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Tipos de nodos disponibles
  const nodeTypes = [
    { type: 'message', label: 'Mensaje', icon: 'pi-comment', color: '#3B82F6' },
    { type: 'question', label: 'Pregunta', icon: 'pi-question-circle', color: '#10B981' },
    { type: 'condition', label: 'Condición', icon: 'pi-directions', color: '#F59E0B' },
    { type: 'action', label: 'Acción', icon: 'pi-cog', color: '#8B5CF6' },
    { type: 'wait', label: 'Espera', icon: 'pi-clock', color: '#6B7280' }
  ];
  
  // Crear nuevo nodo
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
    markDirty();
  }, [addNode, setSelectedNode, markDirty]);
  
  // Manejar clics en nodos
  const handleNodeClick = useCallback((node: FlowNode) => {
    setSelectedNode(node);
  }, [setSelectedNode]);
  
  // Manejar drop en canvas
  const handleCanvasDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    
    if (!draggedNodeType) return;
    
    const canvasRect = event.currentTarget.getBoundingClientRect();
    const position = {
      x: event.clientX - canvasRect.left,
      y: event.clientY - canvasRect.top
    };
    
    handleCreateNode(draggedNodeType, position);
    setDraggedNodeType(null);
  }, [draggedNodeType, handleCreateNode]);
  
  const handleCanvasDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);
  
  // Toolbar de herramientas
  const toolbarLeft = (
    <div className="flex gap-2">
      <span className="text-sm font-medium text-600">Arrastra los elementos al canvas:</span>
    </div>
  );
  
  const toolbarRight = (
    <div className="flex gap-1">
      {nodeTypes.map((nodeType) => (
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
  
  return (
    <div className={`flow-designer h-full ${className}`}>
      {/* Toolbar de herramientas */}
      <Toolbar 
        left={toolbarLeft} 
        right={toolbarRight}
        className="mb-2"
      />
      
      {/* Canvas Placeholder */}
      <div 
        ref={canvasRef}
        className="flow-canvas h-full border border-gray-300 rounded overflow-hidden relative bg-gray-50" 
        style={{ minHeight: '500px' }}
        onDrop={handleCanvasDrop}
        onDragOver={handleCanvasDragOver}
      >
        {/* Nodos renderizados */}
        {currentDesign?.nodes.map((node) => (
          <div
            key={node.id}
            className="absolute bg-white border rounded shadow-sm p-3 cursor-pointer hover:shadow-md transition-shadow"
            style={{
              left: node.position.x,
              top: node.position.y,
              minWidth: '150px',
              border: selectedNode?.id === node.id ? '2px solid #3b82f6' : '1px solid #d1d5db',
              background: selectedNode?.id === node.id ? '#e7f3ff' : '#ffffff'
            }}
            onClick={() => handleNodeClick(node)}
          >
            <div className="flex items-center gap-2 mb-1">
              <i className={`pi ${
                node.type === 'message' ? 'pi-comment' :
                node.type === 'question' ? 'pi-question-circle' :
                node.type === 'condition' ? 'pi-directions' :
                node.type === 'action' ? 'pi-cog' : 'pi-clock'
              }`}></i>
              <span className="font-medium text-sm">{node.data.label}</span>
            </div>
            {node.data.messageText && (
              <p className="text-xs text-gray-600 m-0">
                {node.data.messageText.length > 40 
                  ? node.data.messageText.substring(0, 40) + '...'
                  : node.data.messageText
                }
              </p>
            )}
          </div>
        ))}
        
        {/* Mensaje cuando no hay nodos */}
        {(!currentDesign?.nodes || currentDesign.nodes.length === 0) && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <i className="pi pi-diagram text-4xl mb-4"></i>
            <p className="text-lg font-medium mb-2">Canvas Vacío</p>
            <p className="text-sm">Arrastra elementos desde la barra superior para comenzar</p>
          </div>
        )}
        
        {/* Overlay para arrastre */}
        {draggedNodeType && (
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-50">
            <div className="flex justify-center items-center h-full">
              <div className="p-3 bg-white rounded shadow-lg border-2 border-dashed border-blue-500">
                <i className="pi pi-plus text-blue-500 mr-2"></i>
                <span className="text-blue-500 font-medium">
                  Suelta para crear {draggedNodeType}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlowDesigner;
