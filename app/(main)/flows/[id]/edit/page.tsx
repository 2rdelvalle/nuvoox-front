'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputSwitch } from 'primereact/inputswitch';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { flowService, Flow, UpdateFlowDto } from '@/shared/services';

const FlowEditPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const toast = useRef<Toast>(null);
  const flowId = typeof params.id === 'string' ? parseInt(params.id) : null;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<UpdateFlowDto>({
    name: '',
    description: '',
    triggerType: 'keyword',
    triggerValue: '',
    isActive: true,
    priority: 1
  });

  const triggerTypeOptions = [
    { label: 'Palabra Clave', value: 'keyword' },
    { label: 'Respuesta de Plantilla', value: 'template_response' },
    { label: 'Bienvenida', value: 'welcome' },
    { label: 'Por Defecto', value: 'default' }
  ];

  useEffect(() => {
    if (flowId) {
      loadFlow();
    }
  }, [flowId]);

  const loadFlow = async () => {
    try {
      setLoading(true);
      const flow = await flowService.getFlowById(flowId!);
      setFormData({
        name: flow.name,
        description: flow.description || '',
        triggerType: flow.triggerType,
        triggerValue: flow.triggerValue || '',
        isActive: flow.isActive,
        priority: flow.priority
      });
    } catch (error) {
      console.error('Error cargando flujo:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo cargar el flujo'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof UpdateFlowDto, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Validación',
        detail: 'El nombre del flujo es obligatorio'
      });
      return;
    }

    if (formData.triggerType === 'keyword' && !formData.triggerValue?.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Validación',
        detail: 'El valor del disparador es obligatorio para tipo "Palabra Clave"'
      });
      return;
    }

    try {
      setSaving(true);
      await flowService.updateFlow(flowId!, formData);
      
      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Flujo actualizado correctamente'
      });

      // Redirigir a la vista del flujo después de guardar
      setTimeout(() => {
        router.push(`/flows/${flowId}`);
      }, 1500);

    } catch (error) {
      console.error('Error guardando flujo:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo guardar el flujo'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/flows/${flowId}`);
  };

  const handleBack = () => {
    router.push('/flows/list');
  };

  if (loading) {
    return (
      <div className="flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <>
      <Toast ref={toast} />
      <div className="grid">
        <div className="col-12">
          <Card>
            <div className="flex justify-content-between align-items-center mb-4">
              <h2 className="m-0">Editar Flujo</h2>
              <div className="flex gap-2">
                <Button
                  label="Volver a Lista"
                  icon="pi pi-arrow-left"
                  className="p-button-text"
                  onClick={handleBack}
                />
                <Button
                  label="Cancelar"
                  icon="pi pi-times"
                  className="p-button-outlined"
                  onClick={handleCancel}
                  disabled={saving}
                />
                <Button
                  label={saving ? 'Guardando...' : 'Guardar'}
                  icon={saving ? 'pi pi-spin pi-spinner' : 'pi pi-save'}
                  onClick={handleSave}
                  disabled={saving}
                />
              </div>
            </div>

            <div className="formgrid grid">
              {/* Información Básica */}
              <div className="field col-12">
                <h3 className="text-900 mb-3">Información Básica</h3>
              </div>

              <div className="field col-12 md:col-6">
                <label htmlFor="name" className="block text-900 font-medium mb-2">
                  Nombre del Flujo *
                </label>
                <InputText
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full"
                  placeholder="Ej: Flujo de Bienvenida"
                />
              </div>

              <div className="field col-12 md:col-6">
                <label htmlFor="priority" className="block text-900 font-medium mb-2">
                  Prioridad
                </label>
                <InputNumber
                  id="priority"
                  value={formData.priority}
                  onValueChange={(e) => handleInputChange('priority', e.value || 1)}
                  className="w-full"
                  min={1}
                  max={10}
                />
              </div>

              <div className="field col-12">
                <label htmlFor="description" className="block text-900 font-medium mb-2">
                  Descripción
                </label>
                <InputTextarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full"
                  rows={3}
                  placeholder="Descripción del flujo de conversación..."
                />
              </div>

              {/* Configuración de Disparador */}
              <div className="field col-12">
                <h3 className="text-900 mb-3">Configuración de Disparador</h3>
              </div>

              <div className="field col-12 md:col-6">
                <label htmlFor="triggerType" className="block text-900 font-medium mb-2">
                  Tipo de Disparador
                </label>
                <Dropdown
                  id="triggerType"
                  value={formData.triggerType}
                  options={triggerTypeOptions}
                  onChange={(e) => handleInputChange('triggerType', e.value)}
                  className="w-full"
                />
              </div>

              <div className="field col-12 md:col-6">
                <label htmlFor="triggerValue" className="block text-900 font-medium mb-2">
                  Valor del Disparador
                  {formData.triggerType === 'keyword' && ' *'}
                </label>
                <InputText
                  id="triggerValue"
                  value={formData.triggerValue}
                  onChange={(e) => handleInputChange('triggerValue', e.target.value)}
                  className="w-full"
                  placeholder={
                    formData.triggerType === 'keyword' 
                      ? "Ej: hola,ayuda,soporte" 
                      : "Valor del disparador..."
                  }
                  disabled={formData.triggerType === 'welcome' || formData.triggerType === 'default'}
                />
                {formData.triggerType === 'keyword' && (
                  <small className="text-600">
                    Separa múltiples palabras clave con comas
                  </small>
                )}
              </div>

              {/* Estado */}
              <div className="field col-12">
                <h3 className="text-900 mb-3">Estado</h3>
              </div>

              <div className="field col-12 md:col-6">
                <div className="flex align-items-center">
                  <InputSwitch
                    id="isActive"
                    checked={formData.isActive ?? false}
                    onChange={(e) => handleInputChange('isActive', e.value)}
                  />
                  <label htmlFor="isActive" className="ml-2 text-900 font-medium">
                    Flujo Activo
                  </label>
                </div>
                <small className="text-600 block mt-1">
                  Los flujos inactivos no procesarán mensajes
                </small>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default FlowEditPage;
