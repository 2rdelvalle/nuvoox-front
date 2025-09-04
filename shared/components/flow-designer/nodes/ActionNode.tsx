'use client';

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

interface ActionNodeData {
  label: string;
  actionType?: 'assign_agent' | 'create_ticket' | 'webhook' | 'tag' | 'save_variable';
  actionConfig?: Record<string, any>;
}

export const ActionNode: React.FC<NodeProps<ActionNodeData>> = ({ 
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
        style={{ background: '#8b5cf6' }}
      />
      
      <div 
        className={`
          min-w-[180px] max-w-[250px] p-3 rounded-lg shadow-sm border-2 bg-white
          ${selected ? 'border-purple-500 shadow-lg' : 'border-purple-200'}
        `}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
            <i className="pi pi-cog text-purple-600 text-sm"></i>
          </div>
          <span className="font-medium text-sm text-gray-800">{data.label}</span>
        </div>
        
        {/* Action type */}
        {data.actionType && (
          <div className="text-xs text-purple-600 mb-1">
            Acción: {data.actionType}
          </div>
        )}
        
        {/* Config preview */}
        {data.actionConfig && Object.keys(data.actionConfig).length > 0 && (
          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border">
            Config: {Object.keys(data.actionConfig).length} parámetros
          </div>
        )}
      </div>

      {/* Source handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="next"
        style={{ background: '#8b5cf6' }}
      />
    </>
  );
};

export default ActionNode;
