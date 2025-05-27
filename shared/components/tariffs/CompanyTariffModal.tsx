'use client';
import { useEffect, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { useToast } from '@/shared/context/toast/toastContext';
import { TariffService } from '@/shared/services/tariff/tariff.service';

export interface TariffConfig {
  id?: number;
  companyId: number;
  additionalCost: number;
  templateType?: string;
  country?: string;
}

interface CompanyTariffModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: number;
  companyName: string;
  onSuccess?: (data: any) => void;
}

/**
 * Modal para configurar tarifas personalizadas por empresa
 */
const CompanyTariffModal = ({
  isOpen,
  onClose,
  companyId,
  companyName,
  onSuccess
}: CompanyTariffModalProps) => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [tariffs, setTariffs] = useState<TariffConfig[]>([]);
  const [selectedTariff, setSelectedTariff] = useState<TariffConfig | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<TariffConfig>({
    companyId,
    additionalCost: 0.01,
    templateType: 'all',
    country: 'all'
  });

  // Opciones para los tipos de plantilla
  const templateTypeOptions = [
    { label: 'Todas las plantillas', value: 'all' },
    { label: 'Marketing', value: 'marketing' },
    { label: 'Utilidad', value: 'utility' },
    { label: 'Autenticación', value: 'authentication' }
  ];

  // Opciones para los países
  const countryOptions = [
    { label: 'Todos los países', value: 'all' },
    { label: 'Colombia', value: 'CO' },
    { label: 'México', value: 'MX' },
    { label: 'Argentina', value: 'AR' },
    { label: 'Perú', value: 'PE' },
    { label: 'Chile', value: 'CL' },
    { label: 'Ecuador', value: 'EC' },
    { label: 'Brasil', value: 'BR' }
  ];

  // Cargar las tarifas existentes al abrir el modal
  useEffect(() => {
    if (isOpen && companyId) {
      loadTariffs();
    }
  }, [isOpen, companyId]);

  // Cargar tarifas desde el servicio
  const loadTariffs = async () => {
    try {
      setLoading(true);
      const data = await TariffService.getCompanyTariffs(companyId);
      setTariffs(data || []);
    } catch (error) {
      console.error('Error al cargar tarifas:', error);
      showError('No se pudieron cargar las tarifas configuradas');
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambios en el formulario
  const handleInputChange = (field: keyof TariffConfig, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Guardar nueva tarifa
  const handleSaveTariff = async () => {
    try {
      setLoading(true);
      
      // Validar datos
      if (formData.additionalCost < 0) {
        showError('El costo adicional no puede ser negativo');
        return;
      }

      const payload: TariffConfig = {
        ...formData,
        companyId
      };

      if (isEditing && selectedTariff?.id) {
        // Actualizar tarifa existente
        await TariffService.updateTariff(selectedTariff.id, payload);
        showSuccess('Tarifa actualizada correctamente');
      } else {
        // Crear nueva tarifa
        await TariffService.createTariff(payload);
        showSuccess('Tarifa creada correctamente');
      }

      // Resetear formulario
      setFormData({
        companyId,
        additionalCost: 0.01,
        templateType: 'all',
        country: 'all'
      });
      setIsEditing(false);
      setSelectedTariff(null);

      // Recargar tarifas
      await loadTariffs();

      // Notificar éxito
      if (onSuccess) {
        onSuccess({
          companyId,
          message: 'Tarifas actualizadas correctamente'
        });
      }
    } catch (error) {
      console.error('Error al guardar tarifa:', error);
      showError('No se pudo guardar la tarifa');
    } finally {
      setLoading(false);
    }
  };

  // Editar tarifa existente
  const handleEditTariff = (tariff: TariffConfig) => {
    setSelectedTariff(tariff);
    setFormData({
      ...tariff,
      templateType: tariff.templateType || 'all',
      country: tariff.country || 'all'
    });
    setIsEditing(true);
  };

  // Eliminar tarifa
  const handleDeleteTariff = async (tariffId: number) => {
    try {
      setLoading(true);
      await TariffService.deleteTariff(tariffId);
      showSuccess('Tarifa eliminada correctamente');
      
      // Recargar tarifas
      await loadTariffs();
    } catch (error) {
      console.error('Error al eliminar tarifa:', error);
      showError('No se pudo eliminar la tarifa');
    } finally {
      setLoading(false);
    }
  };

  // Cancelar edición
  const handleCancelEdit = () => {
    setIsEditing(false);
    setSelectedTariff(null);
    setFormData({
      companyId,
      additionalCost: 0.01,
      templateType: 'all',
      country: 'all'
    });
  };

  // Footer del modal con botones de acción
  const renderFooter = () => {
    return (
      <div>
        <Button 
          label="Cerrar" 
          icon="pi pi-times" 
          onClick={onClose} 
          className="p-button-text" 
        />
      </div>
    );
  };

  return (
    <Dialog
      header={`Configurar Tarifas - ${companyName}`}
      visible={isOpen}
      style={{ width: '80vw', maxWidth: '600px' }}
      modal
      onHide={onClose}
      footer={renderFooter()}
    >
      <div className="p-fluid">
        <div className="card mb-4">
          <h3 className="text-lg font-semibold mb-2">
            {isEditing ? 'Editar Tarifa' : 'Nueva Tarifa'}
          </h3>
          
          <div className="field mb-3">
            <label htmlFor="additionalCost" className="font-medium mb-2 block">
              Costo Adicional (USD)
            </label>
            <InputNumber
              id="additionalCost"
              value={formData.additionalCost}
              onValueChange={(e) => handleInputChange('additionalCost', e.value)}
              mode="decimal"
              minFractionDigits={4}
              maxFractionDigits={4}
              min={0}
              step={0.0001}
              showButtons
              prefix="$"
              suffix=" USD"
              disabled={loading}
            />
          </div>
          
          <div className="field mb-3">
            <label htmlFor="templateType" className="font-medium mb-2 block">
              Tipo de Plantilla
            </label>
            <Dropdown
              id="templateType"
              value={formData.templateType}
              options={templateTypeOptions}
              onChange={(e) => handleInputChange('templateType', e.value)}
              placeholder="Seleccionar tipo de plantilla"
              disabled={loading}
            />
            <small className="text-gray-500">
              Seleccione "Todas las plantillas" para aplicar a todos los tipos
            </small>
          </div>
          
          <div className="field mb-3">
            <label htmlFor="country" className="font-medium mb-2 block">
              País
            </label>
            <Dropdown
              id="country"
              value={formData.country}
              options={countryOptions}
              onChange={(e) => handleInputChange('country', e.value)}
              placeholder="Seleccionar país"
              disabled={loading}
            />
            <small className="text-gray-500">
              Seleccione "Todos los países" para aplicar a todos los destinos
            </small>
          </div>
          
          <div className="flex justify-content-end gap-2 mt-4">
            {isEditing && (
              <Button
                label="Cancelar"
                icon="pi pi-times"
                className="p-button-text"
                onClick={handleCancelEdit}
                disabled={loading}
              />
            )}
            <Button
              label={isEditing ? 'Actualizar' : 'Guardar'}
              icon={isEditing ? 'pi pi-save' : 'pi pi-plus'}
              onClick={handleSaveTariff}
              loading={loading}
            />
          </div>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Tarifas Configuradas</h3>
          
          {loading ? (
            <div className="text-center p-4">
              <i className="pi pi-spin pi-spinner text-2xl"></i>
              <p>Cargando tarifas...</p>
            </div>
          ) : tariffs.length === 0 ? (
            <div className="p-4 border rounded text-center bg-gray-50">
              No hay tarifas configuradas para esta empresa
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 border text-left">Costo Adicional</th>
                    <th className="p-2 border text-left">Tipo de Plantilla</th>
                    <th className="p-2 border text-left">País</th>
                    <th className="p-2 border text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {tariffs.map((tariff) => (
                    <tr key={tariff.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 border">
                        ${tariff.additionalCost.toFixed(4)} USD
                      </td>
                      <td className="p-2 border">
                        {tariff.templateType === 'all' 
                          ? 'Todas las plantillas' 
                          : tariff.templateType}
                      </td>
                      <td className="p-2 border">
                        {tariff.country === 'all' 
                          ? 'Todos los países' 
                          : tariff.country}
                      </td>
                      <td className="p-2 border text-center">
                        <div className="flex justify-center gap-2">
                          <Button
                            icon="pi pi-pencil"
                            className="p-button-text p-button-rounded p-button-sm"
                            onClick={() => handleEditTariff(tariff)}
                            disabled={loading}
                            tooltip="Editar"
                            tooltipOptions={{ position: 'top' }}
                          />
                          <Button
                            icon="pi pi-trash"
                            className="p-button-text p-button-rounded p-button-danger p-button-sm"
                            onClick={() => tariff.id && handleDeleteTariff(tariff.id)}
                            disabled={loading}
                            tooltip="Eliminar"
                            tooltipOptions={{ position: 'top' }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
};

export default CompanyTariffModal;
