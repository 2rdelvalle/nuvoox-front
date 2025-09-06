'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card } from 'primereact/card';
import { axiosInstance } from '../../../../shared/instances/axios-instance';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { InputSwitch } from 'primereact/inputswitch';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Panel } from 'primereact/panel';
import { Divider } from 'primereact/divider';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { Badge } from 'primereact/badge';

interface WebChatConfig {
  id?: number;
  company_id: number;
  brand_primary: string;
  brand_text: string;
  logo_url?: string;
  position: 'right' | 'left';
  welcome_text: string;
  allowed_origins: string[];
  is_active: boolean;
}

interface HandoffRequest {
  id: number;
  conversationId: number;
  sessionId: string;
  status: 'requested' | 'accepted' | 'completed' | 'expired';
  customerName?: string;
  customerEmail?: string;
  reason: string;
  conversationSummary: string;
  requestedAt: string;
  acceptedAt?: string;
  completedAt?: string;
  expiresAt: string;
  agentId?: number;
  agentName?: string;
  isExpired: boolean;
}

interface AgentInfo {
  id: number;
  name: string;
  email: string;
  isOnline: boolean;
  currentChats: number;
  maxConcurrentChats: number;
}

export default function WebChatAdminPage() {
  const toast = useRef<Toast>(null);
  const [config, setConfig] = useState<WebChatConfig>({
    company_id: 1, // TODO: Get from auth context
    brand_primary: '#FF6600',
    brand_text: '#FFFFFF',
    logo_url: '',
    position: 'right',
    welcome_text: '¡Hola! ¿Cómo podemos ayudarte?',
    allowed_origins: [],
    is_active: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newOrigin, setNewOrigin] = useState('');
  
  // Handoff management state
  const [activeTab, setActiveTab] = useState(0);
  const [pendingHandoffs, setPendingHandoffs] = useState<HandoffRequest[]>([]);
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [isLoadingHandoffs, setIsLoadingHandoffs] = useState(false);
  const [selectedHandoff, setSelectedHandoff] = useState<HandoffRequest | null>(null);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentInfo | null>(null);
  const [isWidgetMinimized, setIsWidgetMinimized] = useState(true);

  // Feature flag check
  const isWebChatEnabled = process.env.NEXT_PUBLIC_ENABLE_WEBCHAT_ADMIN === 'true';
  
  // DEBUG: Log environment variables
  console.log('🔍 DEBUG WebChat Env:', {
    NEXT_PUBLIC_ENABLE_WEBCHAT_ADMIN: process.env.NEXT_PUBLIC_ENABLE_WEBCHAT_ADMIN,
    NEXT_PUBLIC_ENABLE_WEBCHAT: process.env.NEXT_PUBLIC_ENABLE_WEBCHAT,
    isWebChatEnabled
  });

  useEffect(() => {
    if (isWebChatEnabled) {
      loadConfig();
      loadPendingHandoffs();
      loadAgents();
    }
  }, [isWebChatEnabled]);

  useEffect(() => {
    if (isWebChatEnabled && activeTab === 1) {
      // Auto-refresh handoffs every 30 seconds when on handoff tab
      const interval = setInterval(() => {
        loadPendingHandoffs();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [activeTab, isWebChatEnabled]);

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(`/webchat/config/${config.company_id || 1}`);

      if (response.status === 200) {
        const data = response.data;
        if (data) {
          setConfig({
            ...data,
            allowed_origins: data.allowed_origins || [],
          });
        }
      } else if (response.status !== 404) {
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar la configuración de WebChat',
          life: 3000
        });
      }
    } catch (error) {
      console.error('Error loading WebChat config:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error de conexión al cargar configuración',
        life: 3000
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async () => {
    setIsSaving(true);
    try {
      const response = await axiosInstance.put(`/webchat/config/${config.company_id || 1}`, config);

      if (response.status === 200) {
        toast.current?.show({
          severity: 'success',
          summary: 'Configuración guardada',
          detail: 'La configuración de WebChat se ha actualizado correctamente',
          life: 3000
        });
        await loadConfig(); // Reload to get updated data
      } else {
        throw new Error('Error saving configuration');
      }
    } catch (error) {
      console.error('Error saving WebChat config:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo guardar la configuración',
        life: 3000
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addOrigin = () => {
    if (newOrigin.trim() && !config.allowed_origins.includes(newOrigin.trim())) {
      setConfig(prev => ({
        ...prev,
        allowed_origins: [...prev.allowed_origins, newOrigin.trim()],
      }));
      setNewOrigin('');
    }
  };

  const removeOrigin = (origin: string) => {
    setConfig(prev => ({
      ...prev,
      allowed_origins: prev.allowed_origins.filter(o => o !== origin),
    }));
  };

  const loadPendingHandoffs = async () => {
    setIsLoadingHandoffs(true);
    try {
      const response = await axiosInstance.get(`/webchat/handoff/pending/${config.company_id}`);

      if (response.status === 200) {
        const result = response.data;
        setPendingHandoffs(result.data?.handoffs || []);
      } else {
        throw new Error('Error loading handoffs');
      }
    } catch (error) {
      console.error('Error loading pending handoffs:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar las solicitudes de handoff',
        life: 3000
      });
    } finally {
      setIsLoadingHandoffs(false);
    }
  };

  const loadAgents = async () => {
    try {
      const response = await axiosInstance.get(`/webchat/agents/availability/${config.company_id}`);

      if (response.status === 200) {
        const result = response.data;
        setAgents(result.data?.agents || []);
      } else {
        throw new Error('Error loading agents');
      }
    } catch (error) {
      console.error('Error loading agents:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar los agentes disponibles',
        life: 3000
      });
    }
  };

  const acceptHandoff = async (handoffId: number, agentId: number, agentName: string) => {
    try {
      const response = await axiosInstance.post(`/webchat/handoff/accept/${handoffId}`, { agentId, agentName });

      if (response.status === 200) {
        toast.current?.show({
          severity: 'success',
          summary: 'Handoff Aceptado',
          detail: `La conversación ha sido asignada a ${agentName}`,
          life: 3000
        });
        await loadPendingHandoffs(); // Refresh list
        setShowAcceptDialog(false);
        setSelectedHandoff(null);
        setSelectedAgent(null);
      } else {
        const error = response.data;
        throw new Error(error.message || 'Error accepting handoff');
      }
    } catch (error) {
      console.error('Error accepting handoff:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error instanceof Error ? error.message : 'No se pudo aceptar el handoff',
        life: 3000
      });
    }
  };

  const completeHandoff = async (handoffId: number, returnToBot: boolean = false) => {
    try {
      const response = await axiosInstance.post(`/webchat/handoff/complete/${handoffId}`, { returnToBot });

      if (response.status === 200) {
        toast.current?.show({
          severity: 'success',
          summary: 'Handoff Completado',
          detail: returnToBot ? 'Conversación devuelta al bot' : 'Conversación finalizada',
          life: 3000
        });
        await loadPendingHandoffs(); // Refresh list
      } else {
        const error = response.data;
        throw new Error(error.message || 'Error completing handoff');
      }
    } catch (error) {
      console.error('Error completing handoff:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error instanceof Error ? error.message : 'No se pudo completar el handoff',
        life: 3000
      });
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusSeverity = (status: string) => {
    switch (status) {
      case 'requested': return 'warning';
      case 'accepted': return 'success';
      case 'completed': return 'info';
      case 'expired': return 'danger';
      default: return 'info';
    }
  };

  if (!isWebChatEnabled) {
    return (
      <div className="container mx-auto p-6">
        <Card 
          title="WebChat no habilitado"
          className="p-4"
        >
          <p className="text-gray-600">
            La funcionalidad de WebChat no está habilitada en este entorno.
            Contacte al administrador del sistema para habilitarla.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Toast ref={toast} />
      
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            💬 WebChat Admin
          </h1>
          <p className="text-gray-600 mt-2">
            Gestiona la configuración y handoffs del sistema de chat en vivo
          </p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {activeTab === 0 && (
            <Button
              onClick={saveConfig}
              disabled={isSaving}
              loading={isSaving}
              icon="pi pi-save"
              label="Guardar Configuración"
            />
          )}
          {activeTab === 1 && (
            <Button
              onClick={loadPendingHandoffs}
              disabled={isLoadingHandoffs}
              loading={isLoadingHandoffs}
              icon="pi pi-refresh"
              label="Actualizar"
            />
          )}
        </div>
      </div>

      <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
        <TabPanel header="⚙️ Configuración" leftIcon="pi pi-cog">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Configuration Form */}
            <div className="xl:col-span-4 space-y-6">
              {/* General Settings */}
              <Card 
                title="⚙️ Configuración General"
                className="p-4"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Estado del WebChat
                      </label>
                      <p className="text-sm text-gray-600">
                        Habilita o deshabilita el widget de chat
                      </p>
                    </div>
                    <InputSwitch
                      checked={config.is_active}
                      onChange={(e) => setConfig(prev => ({ ...prev, is_active: e.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Mensaje de Bienvenida
                    </label>
                    <InputTextarea
                      value={config.welcome_text}
                      onChange={(e) => setConfig(prev => ({ ...prev, welcome_text: e.target.value }))}
                      rows={3}
                      className="w-full"
                      placeholder="Mensaje que verán los usuarios al abrir el chat"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Posición del Widget
                    </label>
                    <Dropdown
                      value={config.position}
                      onChange={(e) => setConfig(prev => ({ ...prev, position: e.value }))}
                      options={[
                        { label: 'Derecha', value: 'right' },
                        { label: 'Izquierda', value: 'left' },
                      ]}
                      className="w-full"
                    />
                  </div>
                </div>
              </Card>

              {/* Visual Settings */}
              <Card 
                title="🎨 Configuración Visual"
                className="p-4"
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Color Principal
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={config.brand_primary}
                        onChange={(e) => setConfig(prev => ({ ...prev, brand_primary: e.target.value }))}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <InputText
                        value={config.brand_primary}
                        onChange={(e) => setConfig(prev => ({ ...prev, brand_primary: e.target.value }))}
                        className="flex-1"
                        placeholder="#FF6600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Color del Texto
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={config.brand_text}
                        onChange={(e) => setConfig(prev => ({ ...prev, brand_text: e.target.value }))}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <InputText
                        value={config.brand_text}
                        onChange={(e) => setConfig(prev => ({ ...prev, brand_text: e.target.value }))}
                        className="flex-1"
                        placeholder="#FFFFFF"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      URL del Logo (opcional)
                    </label>
                    <InputText
                      value={config.logo_url || ''}
                      onChange={(e) => setConfig(prev => ({ ...prev, logo_url: e.target.value }))}
                      className="w-full"
                      placeholder="https://ejemplo.com/logo.png"
                    />
                  </div>
                </div>
              </Card>

              {/* Security Settings */}
              <Card 
                title="🔒 Configuración de Seguridad"
                className="p-4"
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Dominios Permitidos
                    </label>
                    <p className="text-sm text-gray-600 mb-3">
                      Solo estos dominios podrán usar el widget de chat
                    </p>
                    
                    <div className="flex gap-2 mb-3">
                      <InputText
                        value={newOrigin}
                        onChange={(e) => setNewOrigin(e.target.value)}
                        className="flex-1"
                        placeholder="https://ejemplo.com"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addOrigin();
                          }
                        }}
                      />
                      <Button
                        onClick={addOrigin}
                        icon="pi pi-plus"
                        label="Agregar"
                        size="small"
                      />
                    </div>

                    <div className="space-y-2">
                      {config.allowed_origins.map((origin, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">{origin}</span>
                          <Button
                            onClick={() => removeOrigin(origin)}
                            icon="pi pi-times"
                            size="small"
                            text
                            severity="danger"
                          />
                        </div>
                      ))}
                      {config.allowed_origins.length === 0 && (
                        <p className="text-sm text-gray-500 italic">
                          No hay dominios configurados (todos los dominios están permitidos)
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Preview */}
            <div className="xl:col-span-8 space-y-6">
              <Card 
                title="👁️ Vista Previa"
                className="p-4"
              >
                <div className="bg-gradient-to-b from-blue-50 to-gray-100 rounded-lg min-h-[600px] relative overflow-hidden">
                  {/* Browser mockup */}
                  <div className="bg-white mx-4 mt-4 rounded-t-lg shadow-lg">
                    {/* Browser header */}
                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-t-lg border-b">
                      <div className="flex gap-1">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      </div>
                      <div className="flex-1 mx-4">
                        <div className="bg-white px-3 py-1 rounded text-xs text-gray-600">
                          https://miempresa.com
                        </div>
                      </div>
                    </div>
                    
                    {/* Scrollable content area */}
                    <div className="h-[500px] overflow-y-auto bg-white">
                      <div className="p-6">
                        <div className="text-center mb-8">
                          <div className="inline-block px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-medium mb-4">
                            Vista previa del sitio web
                          </div>
                          <h1 className="text-3xl font-bold text-gray-800 mb-2">Mi Empresa</h1>
                          <p className="text-gray-600 text-lg">Bienvenido a nuestro sitio web empresarial</p>
                        </div>
                        
                        {/* Navigation menu */}
                        <nav className="flex justify-center gap-6 mb-12">
                          <a href="#" className="text-blue-600 hover:text-blue-800 font-medium">Inicio</a>
                          <a href="#" className="text-gray-600 hover:text-gray-800">Servicios</a>
                          <a href="#" className="text-gray-600 hover:text-gray-800">Nosotros</a>
                          <a href="#" className="text-gray-600 hover:text-gray-800">Contacto</a>
                        </nav>
                        
                        {/* Hero section */}
                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-8 rounded-lg mb-8">
                          <h2 className="text-2xl font-bold mb-4">Soluciones Empresariales</h2>
                          <p className="mb-4">Impulsamos tu negocio con tecnología de vanguardia</p>
                          <button className="bg-white text-blue-600 px-6 py-2 rounded font-medium">
                            Conocer más
                          </button>
                        </div>
                        
                        {/* Services grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                          <div className="bg-gray-50 p-6 rounded-lg">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                              <i className="pi pi-cog text-blue-600"></i>
                            </div>
                            <h3 className="font-semibold text-gray-800 mb-2">Consulting</h3>
                            <p className="text-sm text-gray-600">Asesoramiento estratégico para optimizar procesos</p>
                          </div>
                          <div className="bg-gray-50 p-6 rounded-lg">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                              <i className="pi pi-chart-line text-green-600"></i>
                            </div>
                            <h3 className="font-semibold text-gray-800 mb-2">Analytics</h3>
                            <p className="text-sm text-gray-600">Análisis de datos para tomar mejores decisiones</p>
                          </div>
                          <div className="bg-gray-50 p-6 rounded-lg">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                              <i className="pi pi-shield text-purple-600"></i>
                            </div>
                            <h3 className="font-semibold text-gray-800 mb-2">Seguridad</h3>
                            <p className="text-sm text-gray-600">Protección integral de tus sistemas</p>
                          </div>
                        </div>
                        
                        {/* More content to enable scrolling */}
                        <div className="space-y-8">
                          <div className="bg-white p-6 border rounded-lg">
                            <h3 className="text-xl font-semibold mb-4">¿Por qué elegirnos?</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="flex items-start gap-3">
                                <i className="pi pi-check-circle text-green-500 mt-1"></i>
                                <div>
                                  <h4 className="font-medium">Experiencia</h4>
                                  <p className="text-sm text-gray-600">Más de 10 años en el mercado</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3">
                                <i className="pi pi-check-circle text-green-500 mt-1"></i>
                                <div>
                                  <h4 className="font-medium">Soporte 24/7</h4>
                                  <p className="text-sm text-gray-600">Atención cuando la necesites</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 p-6 rounded-lg">
                            <h3 className="text-xl font-semibold mb-4">Casos de Éxito</h3>
                            <p className="text-gray-600 mb-4">Conoce cómo hemos ayudado a empresas como la tuya:</p>
                            <div className="space-y-4">
                              <div className="bg-white p-4 rounded border-l-4 border-blue-500">
                                <p className="font-medium">Empresa A</p>
                                <p className="text-sm text-gray-600">Incremento del 40% en eficiencia operativa</p>
                              </div>
                              <div className="bg-white p-4 rounded border-l-4 border-green-500">
                                <p className="font-medium">Empresa B</p>
                                <p className="text-sm text-gray-600">Reducción del 60% en costos de TI</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-center py-8">
                            <h3 className="text-2xl font-semibold mb-4">¿Listo para comenzar?</h3>
                            <p className="text-gray-600 mb-6">Contacta con nuestro equipo de expertos</p>
                            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium">
                              Solicitar Consulta
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Widget Preview - Fixed position */}
                  {config.is_active && (
                  <div 
                    className={`fixed bottom-6 right-10 
                               ${isWidgetMinimized ? 'w-16 h-16' : 'w-80'} bg-white rounded-lg shadow-xl 
                               transform transition-all duration-300 ease-in-out z-50`}
                  >
                    {isWidgetMinimized ? (
                      /* Minimized floating button */
                      <button
                        className="w-full h-full rounded-lg flex items-center justify-center text-white font-semibold text-2xl hover:scale-105 transition-transform cursor-pointer"
                        style={{ backgroundColor: config.brand_primary, color: config.brand_text }}
                        onClick={() => setIsWidgetMinimized(false)}
                      >
                        💬
                      </button>
                    ) : (
                      /* Expanded widget */
                      <div className="overflow-hidden rounded-lg">
                        {/* Widget Header */}
                        <div 
                          className="p-4 text-white flex items-center gap-3"
                          style={{ backgroundColor: config.brand_primary, color: config.brand_text }}
                        >
                          {config.logo_url && (
                            <img src={config.logo_url} alt="Logo" className="w-8 h-8 rounded" />
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm">Chat en Vivo</h3>
                            <p className="text-xs opacity-90">¡Estamos aquí para ayudarte!</p>
                          </div>
                          <button
                            onClick={() => setIsWidgetMinimized(true)}
                            className="text-white hover:bg-black hover:bg-opacity-20 rounded p-1 transition-colors"
                          >
                            <i className="pi pi-minus text-xs"></i>
                          </button>
                        </div>
                        
                        {/* Widget Body */}
                        <div className="p-4 bg-white max-h-80 flex flex-col">
                          <div className="flex-1 space-y-3 overflow-y-auto mb-3">
                            <div className="flex gap-2">
                              <div className="w-8 h-8 bg-gray-300 rounded-full flex-shrink-0 flex items-center justify-center">
                                <i className="pi pi-user text-xs text-gray-600"></i>
                              </div>
                              <div className="bg-gray-100 rounded-lg p-3 max-w-[240px]">
                                <p className="text-sm">{config.welcome_text}</p>
                              </div>
                            </div>
                            
                            <div className="flex gap-2 justify-end">
                              <div className="bg-blue-500 text-white rounded-lg p-3 max-w-[240px]">
                                <p className="text-sm">¡Hola! Necesito ayuda con...</p>
                              </div>
                              <div 
                                className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs"
                                style={{ backgroundColor: config.brand_primary }}
                              >
                                <i className="pi pi-user"></i>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 pt-2 border-t border-gray-100">
                            <InputText
                              placeholder="Escribe tu mensaje..."
                              className="flex-1 text-sm"
                              disabled
                            />
                            <Button
                              icon="pi pi-send"
                              size="small"
                              disabled
                              className="flex-shrink-0"
                              style={{ backgroundColor: config.brand_primary, borderColor: config.brand_primary }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  )}
                  
                  {/* Status indicator */}
                  <div className="absolute bottom-4 left-6">
                    <div className="bg-white bg-opacity-95 backdrop-blur-sm px-3 py-2 rounded-full shadow-sm border">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${config.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <span className="text-xs text-gray-700 font-medium">
                          Widget {config.is_active ? 'activo' : 'inactivo'}
                          {config.is_active && (
                            <>
                              {' • '}
                              {isWidgetMinimized ? 'Minimizado' : 'Expandido'}
                              {' • Posición fija'}
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Click instruction */}
                  {config.is_active && isWidgetMinimized && (
                    <div className="fixed bottom-20 right-10 bg-gray-800 text-white px-3 py-2 rounded-lg text-xs max-w-[200px] animate-bounce opacity-75 z-40">
                      <div className="relative">
                        <div className="flex items-center gap-2">
                          <i className="pi pi-hand-pointer"></i>
                          Haz clic para expandir el chat
                        </div>
                        <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800"></div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 space-y-3">
                  <div className="p-3 bg-blue-50 rounded">
                    <p className="text-sm text-blue-700">
                      <strong>Código de integración:</strong> Copia este código en tu sitio web
                    </p>
                    <code className="block mt-2 p-2 bg-white rounded text-xs font-mono">
                      {`<script src="${window.location.origin}/api/v1/webchat.js" data-company-id="${config.company_id}"></script>`}
                    </code>
                  </div>
                  
                  <div className="p-3 bg-green-50 rounded">
                    <div className="flex items-start gap-2">
                      <i className="pi pi-info-circle text-green-600 mt-0.5"></i>
                      <div>
                        <p className="text-sm text-green-700 font-medium mb-1">Características del Widget:</p>
                        <ul className="text-xs text-green-600 space-y-1">
                          <li>• Posición fija en esquina inferior derecha</li>
                          <li>• Minimizado por defecto (solo botón flotante)</li>
                          <li>• Permanece visible durante scroll</li>
                          <li>• Click para expandir/minimizar</li>
                          <li>• Responsive y optimizado para móviles</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </TabPanel>
        
        <TabPanel header="🤝 Handoffs" leftIcon="pi pi-users" rightIcon={pendingHandoffs.length > 0 ? <Badge value={pendingHandoffs.length} severity="warning" /> : undefined}>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Gestión de Handoffs</h2>
                <p className="text-gray-600">Administra las transferencias de chat de bot a agente humano</p>
              </div>
              <div className="flex items-center gap-4">
                <Tag value={`${agents.filter(a => a.isOnline).length} agentes online`} severity="success" />
                <Tag value={`${pendingHandoffs.filter(h => h.status === 'requested').length} pendientes`} severity="warning" />
              </div>
            </div>

            {isLoadingHandoffs ? (
              <div className="flex items-center justify-center py-8">
                <ProgressSpinner style={{width: '50px', height: '50px'}} />
              </div>
            ) : (
              <DataTable 
                value={pendingHandoffs} 
                emptyMessage="No hay solicitudes de handoff pendientes"
                scrollable
                scrollHeight="600px"
              >
                <Column 
                  field="id" 
                  header="ID" 
                  style={{ minWidth: '80px' }}
                />
                <Column 
                  field="customerName" 
                  header="Cliente" 
                  body={(rowData: HandoffRequest) => rowData.customerName || 'No especificado'}
                  style={{ minWidth: '150px' }}
                />
                <Column 
                  field="reason" 
                  header="Razón" 
                  style={{ minWidth: '200px' }}
                />
                <Column 
                  field="status" 
                  header="Estado" 
                  body={(rowData: HandoffRequest) => (
                    <Tag 
                      value={rowData.status} 
                      severity={getStatusSeverity(rowData.status)}
                    />
                  )}
                  style={{ minWidth: '100px' }}
                />
                <Column 
                  field="requestedAt" 
                  header="Solicitado" 
                  body={(rowData: HandoffRequest) => formatDateTime(rowData.requestedAt)}
                  style={{ minWidth: '150px' }}
                />
                <Column 
                  field="agentName" 
                  header="Agente" 
                  body={(rowData: HandoffRequest) => rowData.agentName || '-'}
                  style={{ minWidth: '120px' }}
                />
                <Column 
                  header="Acciones" 
                  body={(rowData: HandoffRequest) => (
                    <div className="flex gap-2">
                      {rowData.status === 'requested' && (
                        <Button
                          icon="pi pi-user-plus"
                          label="Aceptar"
                          size="small"
                          severity="success"
                          onClick={() => {
                            setSelectedHandoff(rowData);
                            setShowAcceptDialog(true);
                          }}
                        />
                      )}
                      {rowData.status === 'accepted' && (
                        <>
                          <Button
                            icon="pi pi-check"
                            label="Completar"
                            size="small"
                            severity="info"
                            onClick={() => completeHandoff(rowData.id, false)}
                          />
                          <Button
                            icon="pi pi-replay"
                            label="Devolver al Bot"
                            size="small"
                            severity="warning"
                            outlined
                            onClick={() => completeHandoff(rowData.id, true)}
                          />
                        </>
                      )}
                    </div>
                  )}
                  style={{ minWidth: '200px' }}
                />
              </DataTable>
            )}

            {/* Agent Status Panel */}
            <Card title="📊 Estado de Agentes" className="mt-6">
              <DataTable 
                value={agents} 
                emptyMessage="No hay agentes configurados"
              >
                <Column field="name" header="Nombre" />
                <Column field="email" header="Email" />
                <Column 
                  field="isOnline" 
                  header="Estado" 
                  body={(rowData: AgentInfo) => (
                    <Tag 
                      value={rowData.isOnline ? 'Online' : 'Offline'} 
                      severity={rowData.isOnline ? 'success' : 'danger'}
                    />
                  )}
                />
                <Column 
                  field="currentChats" 
                  header="Chats Activos" 
                  body={(rowData: AgentInfo) => `${rowData.currentChats}/${rowData.maxConcurrentChats}`}
                />
              </DataTable>
            </Card>
          </div>
        </TabPanel>
      </TabView>

      {/* Accept Handoff Dialog */}
      <Dialog
        header="Aceptar Handoff"
        visible={showAcceptDialog}
        style={{ width: '450px' }}
        onHide={() => {
          setShowAcceptDialog(false);
          setSelectedHandoff(null);
          setSelectedAgent(null);
        }}
      >
        {selectedHandoff && (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Detalles de la Solicitud</h4>
              <div className="bg-gray-50 p-3 rounded">
                <p><strong>Cliente:</strong> {selectedHandoff.customerName || 'No especificado'}</p>
                <p><strong>Razón:</strong> {selectedHandoff.reason}</p>
                <p><strong>Solicitado:</strong> {formatDateTime(selectedHandoff.requestedAt)}</p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Seleccionar Agente:
              </label>
              <Dropdown
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.value)}
                options={agents.filter(a => a.isOnline && a.currentChats < a.maxConcurrentChats)}
                optionLabel="name"
                placeholder="Selecciona un agente disponible"
                className="w-full"
                itemTemplate={(agent: AgentInfo) => (
                  <div className="flex items-center justify-between">
                    <span>{agent.name}</span>
                    <div className="flex items-center gap-2">
                      <Tag value={`${agent.currentChats}/${agent.maxConcurrentChats}`} severity="info" />
                      <Tag value={agent.isOnline ? 'Online' : 'Offline'} severity={agent.isOnline ? 'success' : 'danger'} />
                    </div>
                  </div>
                )}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                label="Cancelar"
                icon="pi pi-times"
                outlined
                onClick={() => {
                  setShowAcceptDialog(false);
                  setSelectedHandoff(null);
                  setSelectedAgent(null);
                }}
              />
              <Button
                label="Aceptar Handoff"
                icon="pi pi-check"
                disabled={!selectedAgent}
                onClick={() => {
                  if (selectedHandoff && selectedAgent) {
                    acceptHandoff(selectedHandoff.id, selectedAgent.id, selectedAgent.name);
                  }
                }}
              />
            </div>
          </div>
        )}
      </Dialog>

      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <ProgressSpinner style={{width: '30px', height: '30px'}} />
              <span>Cargando configuración...</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
