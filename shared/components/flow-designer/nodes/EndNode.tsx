'use client';

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

interface EndNodeData {
  label: string;
  endType?: 'completed' | 'abandoned' | 'timeout';
}

export const EndNode: React.FC<NodeProps<EndNodeData>> = ({ 
  data, 
  selected 
}) => {
  return (
    <>
      {/* Target handle only - no source handles for end nodes */}
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        style={{ background: '#dc2626' }}
      />
      
      <div 
        className={`
          min-w-[180px] max-w-[250px] p-3 rounded-lg shadow-sm border-2 bg-white
          ${selected ? 'border-red-500 shadow-lg' : 'border-red-200'}
        `}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
            <i className="pi pi-stop text-red-600 text-sm"></i>
          </div>
          <span className="font-medium text-sm text-gray-800">{data.label}</span>
        </div>
        
        {/* End type */}
        {data.endType && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded border">
            Tipo: {data.endType}
          </div>
        )}
      </div>
      
      {/* No source handles - this is an end node */}
    </>
  );
};

export default EndNode;
