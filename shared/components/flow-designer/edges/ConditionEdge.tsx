'use client';

import React, { useState } from 'react';
import { EdgeProps, getBezierPath } from 'reactflow';
import { useFlowDesignerStore } from '@/shared/stores/flow-designer-store';

interface ConditionEdgeData {
  conditionType?: string;
  conditionValue?: string;
  priority?: number;
}

export const ConditionEdge: React.FC<EdgeProps<ConditionEdgeData>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const { updateEdge } = useFlowDesignerStore();
  
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const handleChipClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsEditing(true);
  };

  const handleSave = (newData: Partial<ConditionEdgeData>) => {
    updateEdge(id, { data: { ...data, ...newData } });
    setIsEditing(false);
  };

  return (
    <>
      {/* Edge path */}
      <path
        id={id}
        style={{
          stroke: selected ? '#3b82f6' : '#64748b',
          strokeWidth: selected ? 3 : 2,
          fill: 'none'
        }}
        className="react-flow__edge-path"
        d={edgePath}
      />
      
      {/* Condition chip/label */}
      <g transform={`translate(${labelX}, ${labelY})`}>
        <foreignObject
          width="120"
          height="30"
          x="-60"
          y="-15"
          className="overflow-visible"
        >
          {isEditing ? (
            <ConditionEditor
              data={data}
              onSave={handleSave}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <div
              className={`
                px-3 py-1 rounded-full text-xs font-medium cursor-pointer
                border-2 bg-white shadow-sm hover:shadow-md transition-shadow
                ${selected ? 'border-blue-500 text-blue-700' : 'border-gray-300 text-gray-600'}
              `}
              onClick={handleChipClick}
            >
              {data?.conditionValue || data?.conditionType || 'Sin condición'}
              {data?.priority && (
                <span className="ml-1 text-xs opacity-60">
                  P{data.priority}
                </span>
              )}
            </div>
          )}
        </foreignObject>
      </g>
    </>
  );
};

interface ConditionEditorProps {
  data?: ConditionEdgeData;
  onSave: (data: ConditionEdgeData) => void;
  onCancel: () => void;
}

const ConditionEditor: React.FC<ConditionEditorProps> = ({
  data,
  onSave,
  onCancel
}) => {
  const [conditionType, setConditionType] = useState(data?.conditionType || '');
  const [conditionValue, setConditionValue] = useState(data?.conditionValue || '');
  const [priority, setPriority] = useState(data?.priority || 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      conditionType,
      conditionValue,
      priority
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="bg-white border-2 border-blue-500 rounded-lg p-3 shadow-lg min-w-[200px]">
      <form onSubmit={handleSubmit} className="space-y-2">
        <div>
          <label className="text-xs font-medium text-gray-700">Tipo:</label>
          <select
            value={conditionType}
            onChange={(e) => setConditionType(e.target.value)}
            className="w-full text-xs border rounded px-2 py-1"
            autoFocus
          >
            <option value="">Seleccionar</option>
            <option value="equals">Igual a</option>
            <option value="contains">Contiene</option>
            <option value="regex">Expresión regular</option>
            <option value="custom">Personalizado</option>
          </select>
        </div>
        
        <div>
          <label className="text-xs font-medium text-gray-700">Valor:</label>
          <input
            type="text"
            value={conditionValue}
            onChange={(e) => setConditionValue(e.target.value)}
            className="w-full text-xs border rounded px-2 py-1"
            placeholder="Valor de la condición"
            onKeyDown={handleKeyDown}
          />
        </div>
        
        <div>
          <label className="text-xs font-medium text-gray-700">Prioridad:</label>
          <input
            type="number"
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
            className="w-full text-xs border rounded px-2 py-1"
            min="1"
            max="100"
          />
        </div>
        
        <div className="flex gap-1 pt-1">
          <button
            type="submit"
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Guardar
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConditionEdge;
