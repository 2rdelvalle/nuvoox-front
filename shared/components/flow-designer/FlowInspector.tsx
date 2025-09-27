'use client';

import React, { useState, useEffect } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Divider } from 'primereact/divider';
import { Checkbox } from 'primereact/checkbox';
import { InputNumber } from 'primereact/inputnumber';
import { useFlowDesignerStore, FlowNode, FlowEdge } from '@/shared/stores/flow-designer-store';

interface FlowInspectorProps {
  className?: string;
}

export const FlowInspector: React.FC<FlowInspectorProps> = ({ className = '' }) => {
  const {
    selectedNode,
    selectedEdge,
    updateNode,
    updateEdge,
    deleteNode,
    deleteEdge,
    setSelectedNode,
    setSelectedEdge,
    markDirty
  } = useFlowDesignerStore();
  
  // Estados locales para formularios
  const [nodeForm, setNodeForm] = useState<Partial<FlowNode['data']>>({});
  const [edgeForm, setEdgeForm] = useState<Partial<FlowEdge['data']>>({});
  
  // Opciones para dropdowns
  const questionTypes = [
    { label: 'Texto libre', value: 'text' },
    { label: 'Número', value: 'number' },
    { label: 'Opciones múltiples', value: 'option' },
    { label: 'Sí/No', value: 'yes_no' },
    { label: 'Email', value: 'email' },
    { label: 'Teléfono', value: 'phone' }
  ];
  
  const conditionTypes = [
    { label: 'Igual a', value: 'equals' },
    { label: 'Contiene', value: 'contains' },
    { label: 'Expresión regular', value: 'regex' },
    { label: 'Personalizada', value: 'custom' }
  ];
  
  const actionTypes = [
    { label: 'Asignar agente', value: 'assign_agent' },
    { label: 'Crear ticket', value: 'create_ticket' },
    { label: 'Llamar webhook', value: 'webhook' },
    { label: 'Agregar etiqueta', value: 'tag' },
    { label: 'Guardar variable', value: 'save_variable' }
  ];
  
  // Sincronizar formulario con nodo seleccionado
  useEffect(() => {
    if (selectedNode) {
      setNodeForm({ ...selectedNode.data });
    }
  }, [selectedNode]);
  
  // Sincronizar formulario con edge seleccionado
  useEffect(() => {
    if (selectedEdge) {
      setEdgeForm({ ...selectedEdge.data });
    }
  }, [selectedEdge]);
  
  // Aplicar cambios al nodo
  const applyNodeChanges = () => {
    if (!selectedNode) return;
    
    updateNode(selectedNode.id, {
      data: { ...selectedNode.data, ...nodeForm }
    });
    markDirty();
  };
  
  // Aplicar cambios al edge
  const applyEdgeChanges = () => {
    if (!selectedEdge) return;
    
    updateEdge(selectedEdge.id, {
      data: { ...selectedEdge.data, ...edgeForm }
    });
    markDirty();
  };
  
  // Eliminar nodo
  const handleDeleteNode = () => {
    if (!selectedNode) return;
    
    deleteNode(selectedNode.id);
    setSelectedNode(null);
    markDirty();
  };
  
  // Eliminar edge
  const handleDeleteEdge = () => {
    if (!selectedEdge) return;
    
    deleteEdge(selectedEdge.id);
    setSelectedEdge(null);
    markDirty();
  };
  
  return (
    <div className={`flow-inspector ${className}`}>
      {/* Inspector de Nodo */}
      {selectedNode && (
        <Card className="mb-3">
          <div className="flex justify-content-between align-items-center mb-3">
            <h5 className="m-0">Propiedades del Nodo</h5>
            <Button
              icon="pi pi-trash"
              className="p-button-text p-button-danger p-button-sm"
              tooltip="Eliminar nodo"
              onClick={handleDeleteNode}
            />
          </div>
          
          {/* Campos comunes */}
          <div className="field">
            <label className="block mb-1 font-medium">Etiqueta *</label>
            <InputText
              value={nodeForm.label || ''}
              onChange={(e) => setNodeForm(prev => ({ ...prev, label: e.target.value }))}
              className="w-full"
              placeholder="Nombre del paso"
            />
          </div>
          
          {/* Campos específicos por tipo */}
          {selectedNode.type === 'message' && (
            <>
              <div className="field">
                <label className="block mb-1 font-medium">Texto del Mensaje *</label>
                <InputTextarea
                  value={nodeForm.messageText || ''}
                  onChange={(e) => setNodeForm(prev => ({ ...prev, messageText: e.target.value }))}
                  className="w-full"
                  rows={4}
                  placeholder="Escribe el mensaje que se enviará..."
                />
              </div>
              
              <div className="field">
                <label className="block mb-1 font-medium">ID de Plantilla (opcional)</label>
                <InputNumber
                  value={nodeForm.templateId}
                  onChange={(e) => setNodeForm(prev => ({ ...prev, templateId: e.value || undefined }))}
                  className="w-full"
                  placeholder="ID de plantilla aprobada"
                />
              </div>
            </>
          )}
          
          {selectedNode.type === 'question' && (
            <>
              <div className="field">
                <label className="block mb-1 font-medium">Texto de la Pregunta *</label>
                <InputTextarea
                  value={nodeForm.messageText || ''}
                  onChange={(e) => setNodeForm(prev => ({ ...prev, messageText: e.target.value }))}
                  className="w-full"
                  rows={3}
                  placeholder="¿Cuál es tu pregunta?"
                />
              </div>
              
              <div className="field">
                <label className="block mb-1 font-medium">Tipo de Respuesta</label>
                <Dropdown
                  value={nodeForm.questionType}
                  onChange={(e) => setNodeForm(prev => ({ ...prev, questionType: e.value }))}
                  options={questionTypes}
                  className="w-full"
                  placeholder="Selecciona el tipo"
                />
              </div>
              
              {nodeForm.questionType === 'option' && (
                <div className="field">
                  <label className="block mb-1 font-medium">Opciones (JSON)</label>
                  <InputTextarea
                    value={JSON.stringify(nodeForm.options || [], null, 2)}
                    onChange={(e) => {
                      try {
                        const options = JSON.parse(e.target.value);
                        setNodeForm(prev => ({ ...prev, options }));
                      } catch {}
                    }}
                    className="w-full"
                    rows={4}
                    placeholder='[{"value": "1", "label": "Opción 1"}]'
                  />
                </div>
              )}
              
              <div className="field">
                <label className="block mb-1 font-medium">Mensaje de Error</label>
                <InputText
                  value={nodeForm.errorMessage || ''}
                  onChange={(e) => setNodeForm(prev => ({ ...prev, errorMessage: e.target.value }))}
                  className="w-full"
                  placeholder="Respuesta inválida. Intenta de nuevo."
                />
              </div>
            </>
          )}
          
          {selectedNode.type === 'condition' && (
            <>
              <div className="field">
                <label className="block mb-1 font-medium">Tipo de Condición</label>
                <Dropdown
                  value={nodeForm.conditionType}
                  onChange={(e) => setNodeForm(prev => ({ ...prev, conditionType: e.value }))}
                  options={conditionTypes}
                  className="w-full"
                  placeholder="Selecciona el tipo"
                />
              </div>
              
              <div className="field">
                <label className="block mb-1 font-medium">Valor de Comparación</label>
                <InputText
                  value={nodeForm.conditionValue || ''}
                  onChange={(e) => setNodeForm(prev => ({ ...prev, conditionValue: e.target.value }))}
                  className="w-full"
                  placeholder="Valor a comparar"
                />
              </div>
            </>
          )}
          
          {selectedNode.type === 'action' && (
            <>
              <div className="field">
                <label className="block mb-1 font-medium">Tipo de Acción</label>
                <Dropdown
                  value={nodeForm.actionType}
                  onChange={(e) => setNodeForm(prev => ({ ...prev, actionType: e.value }))}
                  options={actionTypes}
                  className="w-full"
                  placeholder="Selecciona la acción"
                />
              </div>
              
              <div className="field">
                <label className="block mb-1 font-medium">Configuración (JSON)</label>
                <InputTextarea
                  value={JSON.stringify(nodeForm.actionConfig || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      const config = JSON.parse(e.target.value);
                      setNodeForm(prev => ({ ...prev, actionConfig: config }));
                    } catch {}
                  }}
                  className="w-full"
                  rows={4}
                  placeholder='{"key": "value"}'
                />
              </div>
            </>
          )}
          
          {selectedNode.type === 'wait' && (
            <div className="field">
              <label className="block mb-1 font-medium">Timeout (segundos)</label>
              <InputNumber
                value={nodeForm.timeoutSeconds}
                onChange={(e) => setNodeForm(prev => ({ ...prev, timeoutSeconds: e.value || undefined }))}
                className="w-full"
                placeholder="30"
              />
            </div>
          )}
          
          <Button
            label="Aplicar Cambios"
            icon="pi pi-check"
            className="w-full mt-3"
            onClick={applyNodeChanges}
          />
        </Card>
      )}
      
      {/* Inspector de Edge */}
      {selectedEdge && (
        <Card className="mb-3">
          <div className="flex justify-content-between align-items-center mb-3">
            <h5 className="m-0">Propiedades de Conexión</h5>
            <Button
              icon="pi pi-trash"
              className="p-button-text p-button-danger p-button-sm"
              tooltip="Eliminar conexión"
              onClick={handleDeleteEdge}
            />
          </div>
          
          <div className="field">
            <label className="block mb-1 font-medium">Etiqueta</label>
            <InputText
              value={edgeForm?.conditionValue || ''}
              onChange={(e) => setEdgeForm(prev => ({ ...prev, conditionValue: e.target.value }))}
              className="w-full"
              placeholder="Condición para esta ruta"
            />
          </div>
          
          <div className="field">
            <label className="block mb-1 font-medium">Prioridad</label>
            <InputNumber
              value={edgeForm?.priority || 0}
              onChange={(e) => setEdgeForm(prev => ({ ...prev, priority: e.value || 0 }))}
              className="w-full"
            />
          </div>
          
          <Button
            label="Aplicar Cambios"
            icon="pi pi-check"
            className="w-full mt-3"
            onClick={applyEdgeChanges}
          />
        </Card>
      )}
      
      {/* Estado cuando no hay selección */}
      {!selectedNode && !selectedEdge && (
        <Card>
          <div className="text-center text-500">
            <i className="pi pi-info-circle text-4xl mb-3"></i>
            <h5 className="text-600">Sin Selección</h5>
            <p className="line-height-3">
              Haz clic en un nodo o conexión en el canvas para editar sus propiedades
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default FlowInspector;
