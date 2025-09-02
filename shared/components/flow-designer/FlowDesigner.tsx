'use client';

import React, { useState, useCallback } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Toolbar } from 'primereact/toolbar';
import { useFlowDesignerStore, FlowNode, FlowEdge } from '@/shared/stores/flow-designer-store';

interface FlowDesignerProps {
  flowId: number;
  className?: string;
}

export const FlowDesigner: React.FC<FlowDesignerProps> = ({ 
  flowId, 
  className = '' 
}) => {
  const {
    currentDesign,
    selectedNode,
    addNode,
    setSelectedNode,
    markDirty
  } = useFlowDesignerStore();
  
  // Estados locales
  const [draggedNodeType, setDraggedNodeType] = useState<string | null>(null);
  
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
      
      {/* Canvas principal */}
      <div 
        className="flow-canvas h-full border-1 border-300 border-round overflow-hidden position-relative"
        style={{ 
          minHeight: '500px',
          background: 'linear-gradient(0deg, transparent 24%, rgba(255, 255, 255, .05) 25%, rgba(255, 255, 255, .05) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .05) 75%, rgba(255, 255, 255, .05) 76%, transparent 77%), linear-gradient(90deg, transparent 24%, rgba(255, 255, 255, .05) 25%, rgba(255, 255, 255, .05) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .05) 75%, rgba(255, 255, 255, .05) 76%, transparent 77%)',
          backgroundSize: '20px 20px'
        }}
        onDrop={handleCanvasDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {/* Renderizado simple de nodos (placeholder para React Flow) */}
        {currentDesign?.nodes.map((node) => (
          <div
            key={node.id}
            className={`absolute cursor-pointer border-round shadow-2 p-3 bg-white border-2 ${
              selectedNode?.id === node.id ? 'border-primary' : 'border-300'
            }`}
            style={{
              left: node.position.x,
              top: node.position.y,
              minWidth: '150px',
              maxWidth: '200px'
            }}
            onClick={() => setSelectedNode(node)}
          >
            <div className="flex align-items-center gap-2 mb-2">
              <i className={`pi ${
                node.type === 'message' ? 'pi-comment' :
                node.type === 'question' ? 'pi-question-circle' :
                node.type === 'condition' ? 'pi-directions' :
                node.type === 'action' ? 'pi-cog' : 'pi-clock'
              } text-${
                node.type === 'message' ? 'blue' :
                node.type === 'question' ? 'green' :
                node.type === 'condition' ? 'orange' :
                node.type === 'action' ? 'purple' : 'gray'
              }-500`}></i>
              <span className="font-medium text-sm">{node.data.label}</span>
            </div>
            
            {node.data.messageText && (
              <p className="text-xs text-600 m-0 line-height-3">
                {node.data.messageText.length > 50 
                  ? node.data.messageText.substring(0, 50) + '...'
                  : node.data.messageText
                }
              </p>
            )}
            
            <div className="text-right mt-2">
              <small className="text-400 uppercase">{node.type}</small>
            </div>
          </div>
        ))}
        
        {/* Mensaje cuando no hay nodos */}
        {(!currentDesign?.nodes || currentDesign.nodes.length === 0) && (
          <div className="flex justify-content-center align-items-center h-full">
            <div className="text-center">
              <i className="pi pi-sitemap text-6xl text-400 mb-3"></i>
              <h4 className="text-600 mb-2">Canvas Vacío</h4>
              <p className="text-500 mb-3">
                Arrastra elementos desde la barra de herramientas para comenzar a diseñar tu flujo
              </p>
              <small className="text-400">
                💡 Los nodos se conectarán automáticamente cuando instales React Flow
              </small>
            </div>
          </div>
        )}
        
        {/* Indicador de arrastre */}
        {draggedNodeType && (
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <div className="flex justify-content-center align-items-center h-full">
              <div className="p-3 bg-white border-round shadow-4 border-2 border-dashed border-primary">
                <i className="pi pi-plus text-primary mr-2"></i>
                <span className="text-primary font-medium">
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
