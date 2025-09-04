import { axiosInstance } from '../../instances/axios-instance';

export interface Flow {
  id: number;
  companyId: number;
  name: string;
  description?: string;
  triggerType: 'keyword' | 'template_response' | 'welcome' | 'default';
  triggerValue?: string;
  isActive: boolean;
  priority: number;
  nodes?: any[];
  edges?: any[];
  createdAt: string;
  updatedAt: string;
  createdBy?: number;
  version?: number;
  lastSavedAt?: string;
}

export interface CreateFlowDto {
  name: string;
  description?: string;
  triggerType: 'keyword' | 'template_response' | 'welcome' | 'default';
  triggerValue?: string;
  isActive?: boolean;
  priority?: number;
  nodes?: any[];
  edges?: any[];
}

export interface UpdateFlowDto {
  name?: string;
  description?: string;
  triggerType?: 'keyword' | 'template_response' | 'welcome' | 'default';
  triggerValue?: string; 
  isActive?: boolean;
  priority?: number;
  nodes?: any[];
  edges?: any[];
}

export interface FlowDesignDto {
  nodes: any[];
  edges: any[];
}

export interface FlowCanvasDto {
  nodes: any[];
  edges: any[];
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
  lastModified?: string;
}

export interface FlowPublishDto {
  nodes: any[];
  edges: any[];
  version?: string;
  publishNotes?: string;
}

export interface FlowVersion {
  id: number;
  flowId: number;
  version: string;
  isActive: boolean;
  canvas: FlowCanvasDto;
  publishedAt: string;
  publishedBy: number;
  publishNotes?: string;
}

export interface PaginatedFlowResponse {
  data: Flow[];
  total: number;
  page: number;
  limit: number;
}

class FlowService {
  /**
   * Obtener todos los flujos con paginación
   */
  async getFlows(page: number = 1, limit: number = 10, search?: string): Promise<PaginatedFlowResponse> {
    const response = await axiosInstance.get('/flows', {
      params: { page, limit, search }
    });
    return response.data;
  }

  /**
   * Obtener un flujo por ID
   */
  async getFlowById(id: number): Promise<Flow> {
    const response = await axiosInstance.get(`/flows/${id}`);
    return response.data;
  }

  /**
   * Crear un nuevo flujo
   */
  async createFlow(flowData: CreateFlowDto): Promise<Flow> {
    const response = await axiosInstance.post('/flows', flowData);
    return response.data;
  }

  /**
   * Actualizar un flujo
   */
  async updateFlow(id: number, flowData: UpdateFlowDto): Promise<Flow> {
    const response = await axiosInstance.put(`/flows/${id}`, flowData);
    return response.data;
  }

  /**
   * Eliminar un flujo
   */
  async deleteFlow(id: number): Promise<void> {
    await axiosInstance.delete(`/flows/${id}`);
  }

  /**
   * Activar/desactivar un flujo
   */
  async toggleFlow(id: number): Promise<Flow> {
    const response = await axiosInstance.put(`/flows/${id}/toggle`);
    return response.data;
  }

  /**
   * Obtener diseño visual de un flujo
   */
  async getFlowDesign(id: number): Promise<FlowDesignDto> {
    const response = await axiosInstance.get(`/flows/${id}/design`);
    return response.data;
  }

  /**
   * Guardar diseño visual de un flujo
   */
  async saveFlowDesign(id: number, design: FlowDesignDto): Promise<Flow> {
    const response = await axiosInstance.put(`/flows/${id}/design`, design);
    return response.data;
  }

  /**
   * Duplicar un flujo
   */
  async duplicateFlow(id: number, newName?: string): Promise<Flow> {
    const response = await axiosInstance.post(`/flows/${id}/duplicate`, {
      name: newName
    });
    return response.data;
  }

  /**
   * Obtener canvas del flujo (versión de trabajo)
   */
  async getFlowCanvas(id: number): Promise<FlowCanvasDto> {
    const response = await axiosInstance.get(`/flows/${id}/canvas`);
    return response.data;
  }

  /**
   * Guardar canvas del flujo (versión de trabajo) 
   */
  async saveFlowCanvas(id: number, canvas: FlowCanvasDto): Promise<{ success: boolean; lastModified: string }> {
    const response = await axiosInstance.put(`/flows/${id}/canvas`, canvas);
    return response.data;
  }

  /**
   * Publicar flujo con validación y materialización
   */
  async publishFlow(id: number, publishData: FlowPublishDto): Promise<FlowVersion> {
    const response = await axiosInstance.post(`/flows/${id}/publish`, publishData);
    return response.data;
  }

  /**
   * Obtener versiones del flujo
   */
  async getFlowVersions(id: number): Promise<FlowVersion[]> {
    const response = await axiosInstance.get(`/flows/${id}/versions`);
    return response.data;
  }

  /**
   * Obtener versión específica del flujo
   */
  async getFlowVersion(id: number, versionId: number): Promise<FlowVersion> {
    const response = await axiosInstance.get(`/flows/${id}/versions/${versionId}`);
    return response.data;
  }

  /**
   * Activar una versión específica
   */
  async activateFlowVersion(id: number, versionId: number): Promise<FlowVersion> {
    const response = await axiosInstance.post(`/flows/${id}/versions/${versionId}/activate`);
    return response.data;
  }
}

export const flowService = new FlowService();
