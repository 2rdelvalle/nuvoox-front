'use client';

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { FlowNode } from '@/shared/stores/flow-designer-store';

interface MessageNodeData {
  label: string;
  messageText?: string;
  templateId?: number;
}

export const MessageNode: React.FC<NodeProps<MessageNodeData>> = ({ 
  data, 
  selected 
}) => {
  return (
    <>
      {/* Target handle (entrada) */}
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        style={{ background: '#3b82f6' }}
      />
      
      <div 
        className={`
          min-w-[180px] max-w-[250px] p-3 rounded-lg shadow-sm border-2 bg-white
          ${selected ? 'border-blue-500 shadow-lg' : 'border-blue-200'}
        `}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <i className="pi pi-comment text-blue-600 text-sm"></i>
          </div>
          <span className="font-medium text-sm text-gray-800">{data.label}</span>
        </div>
        
        {/* Content */}
        {data.messageText && (
          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border">
            {data.messageText.length > 60 
              ? data.messageText.substring(0, 60) + '...'
              : data.messageText
            }
          </div>
        )}
        
        {data.templateId && (
          <div className="text-xs text-purple-600 mt-1">
            Template ID: {data.templateId}
          </div>
        )}
      </div>

      {/* Source handle (salida) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="next"
        style={{ background: '#3b82f6' }}
      />
    </>
  );
};

export default MessageNode;
