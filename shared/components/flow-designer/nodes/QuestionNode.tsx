'use client';

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

interface QuestionNodeData {
  label: string;
  questionType?: 'text' | 'number' | 'option' | 'yes_no' | 'email' | 'phone';
  options?: Array<{ value: string; label: string }>;
  validationRegex?: string;
  errorMessage?: string;
}

export const QuestionNode: React.FC<NodeProps<QuestionNodeData>> = ({ 
  data, 
  selected 
}) => {
  const getHandles = () => {
    if (data.questionType === 'yes_no') {
      return ['yes', 'no'];
    }
    if (data.questionType === 'option' && data.options) {
      return data.options.map(opt => opt.value);
    }
    return ['valid', 'invalid'];
  };

  return (
    <>
      {/* Target handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        style={{ background: '#10b981' }}
      />
      
      <div 
        className={`
          min-w-[180px] max-w-[250px] p-3 rounded-lg shadow-sm border-2 bg-white
          ${selected ? 'border-green-500 shadow-lg' : 'border-green-200'}
        `}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <i className="pi pi-question-circle text-green-600 text-sm"></i>
          </div>
          <span className="font-medium text-sm text-gray-800">{data.label}</span>
        </div>
        
        {/* Question Type */}
        {data.questionType && (
          <div className="text-xs text-green-600 mb-1">
            Tipo: {data.questionType}
          </div>
        )}
        
        {/* Options preview */}
        {data.options && (
          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border">
            Opciones: {data.options.map(opt => opt.label).join(', ')}
          </div>
        )}
      </div>

      {/* Multiple source handles based on question type */}
      {getHandles().map((handle, index) => (
        <Handle
          key={handle}
          type="source"
          position={Position.Bottom}
          id={handle}
          style={{ 
            background: '#10b981',
            left: `${30 + (index * 40)}%`
          }}
        />
      ))}
    </>
  );
};

export default QuestionNode;
