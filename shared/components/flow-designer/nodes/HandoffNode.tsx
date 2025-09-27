'use client';

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

interface HandoffNodeData {
  label: string;
  handoffConfig?: Record<string, any>;
}

export const HandoffNode: React.FC<NodeProps<HandoffNodeData>> = ({ 
  data, 
  selected 
}) => {
  return (
    <>
      {/* Target handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        style={{ background: '#f97316' }}
      />
      
      <div 
        className={`
          min-w-[180px] max-w-[250px] p-3 rounded-lg shadow-sm border-2 bg-white
          ${selected ? 'border-orange-500 shadow-lg' : 'border-orange-200'}
        `}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
            <i className="pi pi-users text-orange-600 text-sm"></i>
          </div>
          <span className="font-medium text-sm text-gray-800">{data.label}</span>
        </div>
        
        {/* Handoff info */}
        <div className="text-xs text-orange-600 mb-1">
          Transferir a agente
        </div>
      </div>

      {/* Source handles for different handoff outcomes */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="success"
        style={{ 
          background: '#10b981',
          left: '20%'
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="operator_busy"
        style={{ 
          background: '#f59e0b',
          left: '50%'
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="failure"
        style={{ 
          background: '#ef4444',
          left: '80%'
        }}
      />
    </>
  );
};

export default HandoffNode;
