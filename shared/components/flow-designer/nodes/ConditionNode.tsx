'use client';

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

interface ConditionNodeData {
  label: string;
  conditionType?: 'equals' | 'contains' | 'regex' | 'custom';
  conditionValue?: string;
}

export const ConditionNode: React.FC<NodeProps<ConditionNodeData>> = ({ 
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
        style={{ background: '#f59e0b' }}
      />
      
      <div 
        className={`
          min-w-[180px] max-w-[250px] p-3 rounded-lg shadow-sm border-2 bg-white
          ${selected ? 'border-amber-500 shadow-lg' : 'border-amber-200'}
        `}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
            <i className="pi pi-directions text-amber-600 text-sm"></i>
          </div>
          <span className="font-medium text-sm text-gray-800">{data.label}</span>
        </div>
        
        {/* Condition details */}
        {data.conditionType && (
          <div className="text-xs text-amber-600 mb-1">
            Tipo: {data.conditionType}
          </div>
        )}
        
        {data.conditionValue && (
          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border">
            Valor: {data.conditionValue}
          </div>
        )}
      </div>

      {/* Source handles for true/false paths */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        style={{ 
          background: '#10b981',
          left: '25%'
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        style={{ 
          background: '#ef4444',
          left: '75%'
        }}
      />
    </>
  );
};

export default ConditionNode;
