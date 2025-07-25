'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { ListBox } from 'primereact/listbox';
import { FileUpload } from 'primereact/fileupload';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Divider } from 'primereact/divider';
import { Panel } from 'primereact/panel';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { CampaignService, CreateCampaignDto } from '@/shared/services/campaign/campaign.service';
import TemplateService from '@/shared/services/template/template.service';
import userService from '@/shared/services/user/user.service';
import { CampaignFormData, CampaignType, Agent, Template, Contact } from '@/shared/models/campaign';
import { getCookieToken, getDataFromToken } from '@/shared/utilities/functions/sessionUtils';

interface CampaignFormProps {
  initialData?: Partial<CampaignFormData>;
  isEdit?: boolean;
  campaignId?: number;
}

const CampaignForm: React.FC<CampaignFormProps> = ({ 
  initialData, 
  isEdit = false, 
  campaignId 
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<any>(null);

  // Estados del formulario
  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    type: CampaignType.WHATSAPP,
    description: '',
    agentGroupTag: '',
    templateId: null,
    selectedAgentIds: [],
    useAgentGroup: false,
    ...initialData
  });

  // Estados para datos dinámicos
  const [templates, setTemplates] = useState<Template[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<Agent[]>([]);
  const [agentGroups, setAgentGroups] = useState<string[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsPreview, setContactsPreview] = useState<Contact[]>([]);

  // Estados de validación
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  // Efecto para manejar la selección de grupo vs agentes individuales
  useEffect(() => {
    if (formData.useAgentGroup) {
      setFormData(prev => ({ ...prev, selectedAgentIds: [] }));
      setSelectedAgents([]);
    } else {
      setFormData(prev => ({ ...prev, agentGroupTag: '' }));
    }
  }, [formData.useAgentGroup]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Obtener datos del usuario actual
      const dataToken = getDataFromToken(getCookieToken() || '');
      if (!dataToken?.user?.company?.companyId) {
        throw new Error('No se pudo obtener la información de la empresa');
      }

      // Cargar plantillas aprobadas
      await loadTemplates(dataToken.user.company.companyId);
      
      // Cargar agentes de la empresa
      await loadAgents(dataToken.user.company.companyId);
      
      // Cargar grupos de agentes (simulado por ahora)
      setAgentGroups(['Grupo Ventas', 'Grupo Soporte', 'Grupo Marketing']);

    } catch (error) {
      console.error('Error loading initial data:', error);
      showError('Error al cargar los datos iniciales');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async (companyId: number) => {
    try {
      // Cargar plantillas aprobadas de la empresa usando TemplateService
      const response = await TemplateService.getAllByCompany(companyId);
      
      // Filtrar solo plantillas aprobadas y con ID válido
      const approvedTemplates = response.data.filter(
        template => 
          template.statusTemplateWhatsapp === 'APPROVED' && 
          template.id !== undefined && 
          template.id !== null
      );
      
      // Mapear al formato esperado por el componente
      const mappedTemplates: Template[] = approvedTemplates.map(template => ({
        id: template.id!,  // Usamos ! porque ya validamos que no es undefined
        name: template.name || 'Sin nombre',
        textTemplate: template.textTemplate || '',
        statusTemplateWhatsapp: template.statusTemplateWhatsapp || 'APPROVED'
      }));
      
      setTemplates(mappedTemplates);
      
      if (mappedTemplates.length === 0) {
        console.warn('No se encontraron plantillas aprobadas para la empresa');
      }
      
    } catch (error) {
      console.error('Error loading templates:', error);
      showError('Error al cargar las plantillas. Verifique su conexión.');
    }
  };

  const loadAgents = async (companyId: number) => {
    try {
      // Cargar agentes reales de la empresa usando UserService
      const response = await userService.getAgentsByCompany(companyId);
      
      // Mapear la respuesta del backend al formato esperado por el componente
      const mappedAgents: Agent[] = response.data.map((agent: any) => ({
        id: parseInt(agent.id), // El backend retorna id como string
        name: agent.name || 'Sin nombre',
        mail: agent.email || agent.mail || 'sin-email@empresa.com'
      }));
      
      setAgents(mappedAgents);
      setAvailableAgents(mappedAgents);
      
      if (mappedAgents.length === 0) {
        console.warn('No se encontraron agentes para la empresa');
        showError('No se encontraron agentes disponibles para esta empresa');
      }
      
    } catch (error: any) {
      console.error('Error loading agents:', error);
      showError('Error al cargar los agentes. Verifique su conexión.');
      
      // En caso de error, establecer lista vacía
      setAgents([]);
      setAvailableAgents([]);
    }
  };

  const handleInputChange = (field: keyof CampaignFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error del campo si existe
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAgentSelection = (selectedAgentIds: number[]) => {
    setFormData(prev => ({ ...prev, selectedAgentIds }));
    const selected = agents.filter(agent => selectedAgentIds.includes(agent.id));
    setSelectedAgents(selected);
  };

  const handleFileUpload = async (event: any) => {
    try {
      const file = event.files[0];
      if (!file) return;

      setLoading(true);
      
      // Por ahora simulamos el procesamiento del archivo
      // En la implementación real, esto subiría el archivo al servidor
      const mockContacts: Contact[] = [
        { nombre: 'Cliente 1', telefono: '+573001234567', email: 'cliente1@email.com' },
        { nombre: 'Cliente 2', telefono: '+573001234568', email: 'cliente2@email.com' },
        { nombre: 'Cliente 3', telefono: '+573001234569' }
      ];
      
      setContacts(mockContacts);
      setContactsPreview(mockContacts.slice(0, 5)); // Mostrar solo los primeros 5
      showSuccess(`Archivo procesado exitosamente. ${mockContacts.length} contactos encontrados.`);
      
    } catch (error) {
      console.error('Error processing file:', error);
      showError('Error al procesar el archivo CSV');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre de la campaña es obligatorio';
    }

    if (!formData.templateId) {
      newErrors.templateId = 'Debe seleccionar una plantilla';
    }

    if (!formData.useAgentGroup && formData.selectedAgentIds.length === 0) {
      newErrors.selectedAgentIds = 'Debe seleccionar al menos un agente o un grupo';
    }

    if (formData.useAgentGroup && !formData.agentGroupTag.trim()) {
      newErrors.agentGroupTag = 'Debe seleccionar un grupo de agentes';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showError('Por favor, corrija los errores en el formulario');
      return;
    }

    try {
      setLoading(true);

      const dataToken = getDataFromToken(getCookieToken() || '');
      if (!dataToken?.user?.company?.companyId) {
        throw new Error('No se pudo obtener la información de la empresa');
      }

      const campaignData: CreateCampaignDto = {
        name: formData.name,
        type: formData.type,
        description: formData.description || undefined,
        agentGroupTag: formData.useAgentGroup ? formData.agentGroupTag : undefined,
        templateId: formData.templateId!,
        selectedAgentIds: formData.useAgentGroup ? undefined : formData.selectedAgentIds,
        companyId: dataToken.user.company.companyId
      };

      if (isEdit && campaignId) {
        await CampaignService.update(campaignId, campaignData);
        showSuccess('Campaña actualizada exitosamente');
      } else {
        await CampaignService.create(campaignData);
        showSuccess('Campaña creada exitosamente');
      }

      // Redirigir a la lista de campañas
      setTimeout(() => {
        router.push('/campaigns/list');
      }, 2000);

    } catch (error: any) {
      console.error('Error saving campaign:', error);
      showError(error.response?.data?.message || 'Error al guardar la campaña');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const showSuccess = (message: string) => {
    toast?.show({ severity: 'success', summary: 'Éxito', detail: message });
  };

  const showError = (message: string) => {
    toast?.show({ severity: 'error', summary: 'Error', detail: message });
  };

  const typeOptions = [
    { label: 'WhatsApp', value: CampaignType.WHATSAPP }
  ];

  const templateOptions = templates.map(template => ({
    label: template.name,
    value: template.id
  }));

  const agentGroupOptions = agentGroups.map(group => ({
    label: group,
    value: group
  }));

  if (loading && !templates.length) {
    return (
      <div className="flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <div className="campaign-form">
      <Toast ref={setToast} />
      
      <Card title={isEdit ? 'Editar Campaña' : 'Nueva Campaña'} className="mb-4">
        <div className="grid">
          {/* Información Básica */}
          <div className="col-12">
            <Panel header="Información Básica" className="mb-4">
              <div className="grid">
                <div className="col-12 md:col-6">
                  <label htmlFor="name" className="block text-900 font-medium mb-2">
                    Nombre de la Campaña *
                  </label>
                  <InputText
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full ${errors.name ? 'p-invalid' : ''}`}
                    placeholder="Ingrese el nombre de la campaña"
                  />
                  {errors.name && <small className="p-error">{errors.name}</small>}
                </div>

                <div className="col-12 md:col-6">
                  <label htmlFor="type" className="block text-900 font-medium mb-2">
                    Tipo *
                  </label>
                  <Dropdown
                    id="type"
                    value={formData.type}
                    options={typeOptions}
                    onChange={(e) => handleInputChange('type', e.value)}
                    className="w-full"
                    placeholder="Seleccione el tipo"
                  />
                </div>

                <div className="col-12">
                  <label htmlFor="description" className="block text-900 font-medium mb-2">
                    Descripción
                  </label>
                  <InputTextarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className="w-full"
                    placeholder="Descripción de la campaña (opcional)"
                  />
                </div>
              </div>
            </Panel>
          </div>

          {/* Selección de Plantilla */}
          <div className="col-12">
            <Panel header="Plantilla" className="mb-4">
              <div className="grid">
                <div className="col-12 md:col-6">
                  <label htmlFor="template" className="block text-900 font-medium mb-2">
                    Seleccionar Plantilla *
                  </label>
                  <Dropdown
                    id="template"
                    value={formData.templateId}
                    options={templateOptions}
                    onChange={(e) => handleInputChange('templateId', e.value)}
                    className={`w-full ${errors.templateId ? 'p-invalid' : ''}`}
                    placeholder="Seleccione una plantilla"
                  />
                  {errors.templateId && <small className="p-error">{errors.templateId}</small>}
                </div>

                {formData.templateId && (
                  <div className="col-12">
                    <label className="block text-900 font-medium mb-2">Vista Previa de la Plantilla</label>
                    <div className="p-3 border-1 border-300 border-round bg-gray-50">
                      {(() => {
                        const selectedTemplate = templates.find(t => t.id === formData.templateId);
                        
                        if (!selectedTemplate) {
                          return (
                            <div className="text-500 font-italic">
                              <i className="pi pi-exclamation-triangle mr-2"></i>
                              Plantilla no encontrada
                            </div>
                          );
                        }

                        const hasText = selectedTemplate.textTemplate && selectedTemplate.textTemplate.trim();
                        const hasMedia = (selectedTemplate as any).mediaUrl; // Preparado para cuando se habilite
                        
                        return (
                          <div>
                            {/* Información de la plantilla */}
                            <div className="mb-3 pb-2 border-bottom-1 border-200">
                              <strong className="text-primary">{selectedTemplate.name}</strong>
                              <div className="text-500 text-sm mt-1">
                                <i className="pi pi-tag mr-1"></i>
                                Tipo: {hasMedia ? 'Multimedia' : 'Solo texto'}
                              </div>
                            </div>

                            {/* Vista previa de multimedia (preparado para futuro) */}
                            {hasMedia && (
                              <div className="mb-3">
                                <div className="text-600 font-medium mb-2">
                                  <i className="pi pi-image mr-1"></i>
                                  Contenido Multimedia:
                                </div>
                                <div className="p-2 border-1 border-200 border-round bg-white">
                                  <img 
                                    src={(selectedTemplate as any).mediaUrl} 
                                    alt="Vista previa multimedia"
                                    className="max-w-full h-auto border-round"
                                    style={{ maxHeight: '200px' }}
                                    onError={(e) => {
                                      const img = e.target as HTMLImageElement;
                                      const nextDiv = img.nextElementSibling as HTMLDivElement;
                                      img.style.display = 'none';
                                      if (nextDiv) nextDiv.style.display = 'block';
                                    }}
                                  />
                                  <div className="text-500 font-italic" style={{ display: 'none' }}>
                                    <i className="pi pi-exclamation-circle mr-1"></i>
                                    No se pudo cargar la imagen multimedia
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Vista previa del texto */}
                            {hasText ? (
                              <div>
                                <div className="text-600 font-medium mb-2">
                                  <i className="pi pi-comment mr-1"></i>
                                  Mensaje de texto:
                                </div>
                                <div className="p-2 border-1 border-200 border-round bg-white white-space-pre-wrap">
                                  {selectedTemplate.textTemplate}
                                </div>
                                <div className="mt-2 text-500 text-sm">
                                  <i className="pi pi-info-circle mr-1"></i>
                                  Los valores {'{'}1{'}'}, {'{'}2{'}'}, etc. serán reemplazados con datos reales.
                                </div>
                              </div>
                            ) : (
                              <div className="text-500 font-italic">
                                <i className="pi pi-info-circle mr-2"></i>
                                No hay contenido de texto para esta plantilla.
                              </div>
                            )}

                            {/* Nota sobre multimedia */}
                            {!hasMedia && (
                              <div className="mt-3 p-2 bg-blue-50 border-1 border-blue-200 border-round">
                                <div className="text-blue-700 text-sm">
                                  <i className="pi pi-info-circle mr-1"></i>
                                  <strong>Nota:</strong> Si esta plantilla incluye imágenes o archivos multimedia, 
                                  se mostrarán aquí cuando la funcionalidad esté habilitada en el sistema.
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()} 
                    </div>
                  </div>
                )}
              </div>
            </Panel>
          </div>

          {/* Selección de Agentes */}
          <div className="col-12">
            <Panel header="Agentes" className="mb-4">
              <div className="grid">
                <div className="col-12">
                  <div className="field-checkbox mb-3">
                    <Checkbox
                      inputId="useAgentGroup"
                      checked={formData.useAgentGroup}
                      onChange={(e) => handleInputChange('useAgentGroup', e.checked)}
                    />
                    <label htmlFor="useAgentGroup" className="ml-2">
                      Usar grupo de agentes
                    </label>
                  </div>
                </div>

                {formData.useAgentGroup ? (
                  <div className="col-12 md:col-6">
                    <label htmlFor="agentGroup" className="block text-900 font-medium mb-2">
                      Seleccionar Grupo *
                    </label>
                    <Dropdown
                      id="agentGroup"
                      value={formData.agentGroupTag}
                      options={agentGroupOptions}
                      onChange={(e) => handleInputChange('agentGroupTag', e.value)}
                      className={`w-full ${errors.agentGroupTag ? 'p-invalid' : ''}`}
                      placeholder="Seleccione un grupo"
                    />
                    {errors.agentGroupTag && <small className="p-error">{errors.agentGroupTag}</small>}
                  </div>
                ) : (
                  <div className="col-12">
                    <label className="block text-900 font-medium mb-2">
                      Seleccionar Agentes *
                    </label>
                    <div className="grid">
                      <div className="col-12 md:col-6">
                        <h6>Agentes Disponibles</h6>
                        <ListBox
                          value={formData.selectedAgentIds}
                          options={availableAgents.map(agent => ({
                            label: `${agent.name} (${agent.mail})`,
                            value: agent.id
                          }))}
                          onChange={(e) => handleAgentSelection(e.value)}
                          multiple
                          className="w-full"
                          style={{ height: '200px' }}
                        />
                      </div>
                      <div className="col-12 md:col-6">
                        <h6>Agentes Seleccionados ({selectedAgents.length})</h6>
                        <div className="border-1 border-300 border-round p-2" style={{ height: '200px', overflowY: 'auto' }}>
                          {selectedAgents.map(agent => (
                            <div key={agent.id} className="p-2 border-bottom-1 border-300">
                              <strong>{agent.name}</strong><br />
                              <small>{agent.mail}</small>
                            </div>
                          ))}
                          {selectedAgents.length === 0 && (
                            <div className="text-center text-500 mt-4">
                              No hay agentes seleccionados
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {errors.selectedAgentIds && <small className="p-error">{errors.selectedAgentIds}</small>}
                  </div>
                )}
              </div>
            </Panel>
          </div>

          {/* Importar Contactos */}
          <div className="col-12">
            <Panel header="Contactos" className="mb-4">
              <div className="grid">
                <div className="col-12">
                  <label className="block text-900 font-medium mb-2">
                    Importar Contactos (CSV)
                  </label>
                  <FileUpload
                    mode="basic"
                    name="contacts"
                    accept=".csv"
                    maxFileSize={5000000}
                    onSelect={handleFileUpload}
                    chooseLabel="Seleccionar Archivo CSV"
                    className="mb-3"
                  />
                  <small className="text-500">
                    El archivo CSV debe contener columnas: nombre, telefono, email (opcional)
                  </small>
                </div>

                {contactsPreview.length > 0 && (
                  <div className="col-12">
                    <Divider />
                    <h6>Vista Previa de Contactos ({contacts.length} total)</h6>
                    <DataTable value={contactsPreview} className="mt-2">
                      <Column field="nombre" header="Nombre" />
                      <Column field="telefono" header="Teléfono" />
                      <Column field="email" header="Email" />
                    </DataTable>
                  </div>
                )}
              </div>
            </Panel>
          </div>

          {/* Botones de Acción */}
          <div className="col-12">
            <div className="flex justify-content-end gap-2">
              <Button
                label="Cancelar"
                icon="pi pi-times"
                outlined
                onClick={handleCancel}
                disabled={loading}
              />
              <Button
                label={isEdit ? 'Actualizar' : 'Crear Campaña'}
                icon="pi pi-check"
                onClick={handleSubmit}
                loading={loading}
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CampaignForm;
