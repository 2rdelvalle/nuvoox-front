'use client';

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

interface WaitNodeData {
  label: string;
  timeoutSeconds?: number;
}

export const WaitNode: React.FC<NodeProps<WaitNodeData>> = ({ 
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
        style={{ background: '#6b7280' }}
      />
      
      <div 
        className={`
          min-w-[180px] max-w-[250px] p-3 rounded-lg shadow-sm border-2 bg-white
          ${selected ? 'border-gray-500 shadow-lg' : 'border-gray-200'}
        `}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <i className="pi pi-clock text-gray-600 text-sm"></i>
          </div>
          <span className="font-medium text-sm text-gray-800">{data.label}</span>
        </div>
        
        {/* Timeout info */}
        {data.timeoutSeconds && (
          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border">
            Timeout: {data.timeoutSeconds}s
          </div>
        )}
      </div>

      {/* Source handles for timeout and next */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="timeout"
        style={{ 
          background: '#ef4444',
          left: '25%'
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="next"
        style={{ 
          background: '#6b7280',
          left: '75%'
        }}
      />
    </>
  );
};

export default WaitNode;
