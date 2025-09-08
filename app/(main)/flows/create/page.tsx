'use client';

import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { flowService } from '@/shared/services/flow/flow.service';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';

interface FlowFormData {
  name: string;
  description: string;
  type: string;
  trigger: string;
}

const CreateFlowPage: React.FC = () => {
  const router = useRouter();
  const toast = useRef<Toast>(null);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<FlowFormData>({
    defaultValues: {
      name: '',
      description: '',
      type: '',
      trigger: ''
    }
  });

  const flowTypes = [
    { label: 'Automático', value: 'automatic' },
    { label: 'Manual', value: 'manual' },
    { label: 'Programado', value: 'scheduled' }
  ];

  const triggerOptions = [
    { label: 'Nuevo contacto', value: 'new_contact' },
    { label: 'Mensaje recibido', value: 'message_received' },
    { label: 'Palabra clave', value: 'keyword' },
    { label: 'Horario específico', value: 'scheduled_time' }
  ];

  const onSubmit = async (data: FlowFormData) => {
    setLoading(true);
    try {
      // Mapear tipos del frontend al backend
      const triggerTypeMapping = {
        'new_contact': 'welcome',
        'message_received': 'default', 
        'keyword': 'keyword',
        'scheduled_time': 'template_response'
      };

      // Crear flujo real usando la API
      const newFlow = await flowService.createFlow({
        name: data.name,
        description: data.description,
        triggerType: (triggerTypeMapping[data.trigger as keyof typeof triggerTypeMapping] || 'default') as 'keyword' | 'template_response' | 'welcome' | 'default',
        triggerValue: data.trigger === 'keyword' ? 'hola,ayuda,soporte' : undefined,
        isActive: true,
        priority: 1
      });

      toast.current?.show({
        severity: 'success',
        summary: 'Éxito',
        detail: `Flujo "${newFlow.name}" creado correctamente`
      });
      
      // Opcional: Redirigir directamente al diseñador visual
      const isFlowDesignerEnabled = process.env.NEXT_PUBLIC_ENABLE_FLOW_DESIGNER === 'true';
      if (isFlowDesignerEnabled) {
        router.push(`/flows/${newFlow.id}/designer`);
      } else {
        router.push('/flows/list');
      }
    } catch (error) {
      console.error('Error creating flow:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al crear el flujo. Intenta de nuevo.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toast ref={toast} />
      <div className="grid">
        <div className="col-12">
          <Card>
          <div className="flex justify-content-between align-items-center mb-4">
            <h2 className="m-0">Crear Nuevo Flujo</h2>
            <Button
              label="Volver"
              icon="pi pi-arrow-left"
              className="p-button-secondary"
              onClick={() => router.push('/flows/list')}
            />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
            <div className="grid">
              <div className="col-12 md:col-6">
                <div className="field">
                  <label htmlFor="name" className="block">
                    Nombre del Flujo *
                  </label>
                  <Controller
                    name="name"
                    control={control}
                    rules={{ required: 'El nombre es requerido' }}
                    render={({ field }) => (
                      <InputText
                        id="name"
                        {...field}
                        className={errors.name ? 'p-invalid' : ''}
                        placeholder="Ingrese el nombre del flujo"
                      />
                    )}
                  />
                  {errors.name && (
                    <small className="p-error">{errors.name.message}</small>
                  )}
                </div>
              </div>

              <div className="col-12 md:col-6">
                <div className="field">
                  <label htmlFor="type" className="block">
                    Tipo de Flujo *
                  </label>
                  <Controller
                    name="type"
                    control={control}
                    rules={{ required: 'El tipo es requerido' }}
                    render={({ field }) => (
                      <Dropdown
                        id="type"
                        {...field}
                        options={flowTypes}
                        placeholder="Seleccione el tipo"
                        className={errors.type ? 'p-invalid' : ''}
                      />
                    )}
                  />
                  {errors.type && (
                    <small className="p-error">{errors.type.message}</small>
                  )}
                </div>
              </div>

              <div className="col-12">
                <div className="field">
                  <label htmlFor="description" className="block">
                    Descripción
                  </label>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <InputTextarea
                        id="description"
                        {...field}
                        rows={3}
                        placeholder="Describa el propósito del flujo"
                      />
                    )}
                  />
                </div>
              </div>

              <div className="col-12 md:col-6">
                <div className="field">
                  <label htmlFor="trigger" className="block">
                    Disparador *
                  </label>
                  <Controller
                    name="trigger"
                    control={control}
                    rules={{ required: 'El disparador es requerido' }}
                    render={({ field }) => (
                      <Dropdown
                        id="trigger"
                        {...field}
                        options={triggerOptions}
                        placeholder="Seleccione el disparador"
                        className={errors.trigger ? 'p-invalid' : ''}
                      />
                    )}
                  />
                  {errors.trigger && (
                    <small className="p-error">{errors.trigger.message}</small>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-content-end gap-2 mt-4">
              <Button
                type="button"
                label="Cancelar"
                className="p-button-secondary"
                onClick={() => router.push('/flows/list')}
                disabled={loading}
              />
              <Button
                type="submit"
                label="Crear Flujo"
                icon="pi pi-save"
                loading={loading}
              />
            </div>
          </form>
        </Card>
      </div>
    </div>
    </>
  );
};

export default CreateFlowPage;
