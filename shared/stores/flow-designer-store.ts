import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { 
  Node, 
  Edge, 
  Viewport, 
  NodeChange, 
  EdgeChange, 
  Connection, 
  applyNodeChanges, 
  applyEdgeChanges,
  addEdge
} from 'reactflow';
import { ValidationError } from '@/shared/utils/flow-validation';

// Tipos para el diseñador de flujos
// ReactFlow compatible node type
export type FlowNode = Node & {
  type: 'message' | 'question' | 'condition' | 'action' | 'wait' | 'handoff' | 'end';
  data: {
    label: string;
    messageText?: string;
    questionType?: 'text' | 'number' | 'option' | 'yes_no' | 'email' | 'phone';
    options?: Array<{ value: string; label: string }>;
    validationRegex?: string;
    errorMessage?: string;
    conditionType?: 'equals' | 'contains' | 'regex' | 'custom';
    conditionValue?: string;
    actionType?: 'assign_agent' | 'create_ticket' | 'webhook' | 'tag' | 'save_variable';
    actionConfig?: Record<string, any>;
    templateId?: number;
    timeoutSeconds?: number;
    endType?: 'completed' | 'abandoned' | 'timeout';
    handoffConfig?: Record<string, any>;
  };
}

// ReactFlow compatible edge type  
export type FlowEdge = Edge & {
  type?: 'default' | 'conditional';
  data?: {
    conditionType?: string;
    conditionValue?: string;
    priority?: number;
  };
}

export interface FlowDesign {
  id?: number;
  flowId: number;
  version: number;
  nodes: FlowNode[];
  edges: FlowEdge[];
  variables: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
    defaultValue?: any;
    description?: string;
    required?: boolean;
  }>;
  metadata: {
    lastModified: string;
    modifiedBy: number;
    isDraft: boolean;
  };
}

interface FlowDesignerStore {
  // Estado del diseño actual
  currentDesign: FlowDesign | null;
  flowId: number | null;
  
  // Estado del editor
  selectedNode: FlowNode | null;
  selectedEdge: FlowEdge | null;
  isInspectorOpen: boolean;
  
  // Estado de ReactFlow
  nodes: FlowNode[];
  edges: FlowEdge[];
  viewport: Viewport;
  
  // Estados adicionales
  isDirty: boolean;
  isSaving: boolean;
  isPublishing: boolean;
  lastSaved: Date | null;
  validationErrors: ValidationError[];
  publishErrors: ValidationError[];
  
  // Acciones para manejar el diseño
  setCurrentDesign: (design: FlowDesign | null) => void;
  setFlowId: (id: number | null) => void;
  
  // Acciones ReactFlow sync
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  setViewport: (viewport: Viewport) => void;
  
  // Acciones para nodos
  addNode: (node: FlowNode) => void;
  updateNode: (nodeId: string, updates: Partial<FlowNode>) => void;
  deleteNode: (nodeId: string) => void;
  setSelectedNode: (node: FlowNode | null) => void;
  
  // Acciones para edges
  addEdge: (edge: FlowEdge) => void;
  updateEdge: (edgeId: string, updates: Partial<FlowEdge>) => void;
  deleteEdge: (edgeId: string) => void;
  setSelectedEdge: (edge: FlowEdge | null) => void;
  
  // Acciones del inspector
  toggleInspector: () => void;
  setInspectorOpen: (open: boolean) => void;
  
  // Acciones de guardado
  markDirty: () => void;
  markClean: () => void;
  setSaving: (saving: boolean) => void;
  setLastSaved: (timestamp: Date | string) => void;
  saveCanvas: (flowId: number) => Promise<boolean>;
  publishFlow: (flowId: number, publishNotes?: string) => Promise<boolean>;
  
  // Acciones de validación
  validateFlow: () => void;
  setValidationErrors: (errors: ValidationError[]) => void;
  setPublishErrors: (errors: ValidationError[]) => void;
  clearValidationErrors: () => void;
  
  // Acciones de limpieza
  reset: () => void;
}

export const useFlowDesignerStore = create<FlowDesignerStore>((set, get) => ({
  // Estado inicial
  currentDesign: null,
  flowId: null,
  selectedNode: null,
  selectedEdge: null,
  isInspectorOpen: false,
  
  // Estado ReactFlow inicial
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  
  // Estado de guardado
  isDirty: false,
  isSaving: false,
  isPublishing: false,
  lastSaved: null,
  validationErrors: [],
  publishErrors: [],
  
  // Implementaciones de acciones
  setCurrentDesign: (design) => set((state) => ({ 
    currentDesign: design,
    nodes: design?.nodes || [],
    edges: design?.edges || []
  })),
  setFlowId: (id) => set({ flowId: id }),
  
  // ReactFlow sync methods
  onNodesChange: (changes) => set((state) => ({
    nodes: applyNodeChanges(changes, state.nodes) as FlowNode[],
    isDirty: true
  })),
  
  onEdgesChange: (changes) => set((state) => ({
    edges: applyEdgeChanges(changes, state.edges) as FlowEdge[],
    isDirty: true
  })),
  
  onConnect: (connection) => set((state) => ({
    edges: addEdge({
      ...connection,
      id: `edge-${connection.source}-${connection.target}-${Date.now()}`,
      type: 'conditional'
    } as FlowEdge, state.edges) as FlowEdge[],
    isDirty: true
  })),
  
  setViewport: (viewport) => set({ viewport }),
  
  // Gestión de nodos
  addNode: (node) => set((state) => ({
    nodes: [...state.nodes, node],
    currentDesign: state.currentDesign ? {
      ...state.currentDesign,
      nodes: [...state.nodes, node]
    } : null,
    isDirty: true
  })),
  
  updateNode: (nodeId, updates) => set((state) => ({
    nodes: state.nodes.map(node =>
      node.id === nodeId ? { ...node, ...updates } : node
    ),
    currentDesign: state.currentDesign ? {
      ...state.currentDesign,
      nodes: state.nodes.map(node =>
        node.id === nodeId ? { ...node, ...updates } : node
      )
    } : null,
    isDirty: true
  })),
  
  deleteNode: (nodeId) => set((state) => {
    const filteredEdges = state.edges.filter(
      edge => edge.source !== nodeId && edge.target !== nodeId
    );
    const filteredNodes = state.nodes.filter(node => node.id !== nodeId);
    
    return {
      nodes: filteredNodes,
      edges: filteredEdges,
      currentDesign: state.currentDesign ? {
        ...state.currentDesign,
        nodes: filteredNodes,
        edges: filteredEdges
      } : null,
      selectedNode: state.selectedNode?.id === nodeId ? null : state.selectedNode,
      isDirty: true
    };
  }),
  
  setSelectedNode: (node) => set({ 
    selectedNode: node,
    selectedEdge: null,
    isInspectorOpen: node !== null 
  }),
  
  // Gestión de edges
  addEdge: (edge) => set((state) => ({
    edges: [...state.edges, edge],
    currentDesign: state.currentDesign ? {
      ...state.currentDesign,
      edges: [...state.edges, edge]
    } : null,
    isDirty: true
  })),
  
  updateEdge: (edgeId, updates) => set((state) => ({
    edges: state.edges.map(edge =>
      edge.id === edgeId ? { ...edge, ...updates } : edge
    ),
    currentDesign: state.currentDesign ? {
      ...state.currentDesign,
      edges: state.edges.map(edge =>
        edge.id === edgeId ? { ...edge, ...updates } : edge
      )
    } : null,
    isDirty: true
  })),
  
  deleteEdge: (edgeId) => set((state) => {
    const filteredEdges = state.edges.filter(edge => edge.id !== edgeId);
    
    return {
      edges: filteredEdges,
      currentDesign: state.currentDesign ? {
        ...state.currentDesign,
        edges: filteredEdges
      } : null,
      selectedEdge: state.selectedEdge?.id === edgeId ? null : state.selectedEdge,
      isDirty: true
    };
  }),
  
  setSelectedEdge: (edge) => set({ 
    selectedEdge: edge,
    selectedNode: null,
    isInspectorOpen: edge !== null 
  }),
  
  // Inspector
  toggleInspector: () => set((state) => ({ isInspectorOpen: !state.isInspectorOpen })),
  setInspectorOpen: (open) => set({ isInspectorOpen: open }),
  
  // Guardado
  markDirty: () => set({ isDirty: true }),
  markClean: () => set({ isDirty: false }),
  setSaving: (saving: boolean) => set({ isSaving: saving }),
  setLastSaved: (timestamp: Date | string) => set({ 
    lastSaved: typeof timestamp === 'string' ? new Date(timestamp) : timestamp 
  }),
  
  // Persistencia
  saveCanvas: async (flowId: number): Promise<boolean> => {
    const state = get();
    try {
      set({ isSaving: true });
      const { flowService } = await import('@/shared/services/flow/flow.service');
      
      await flowService.saveFlowCanvas(flowId, {
        nodes: state.nodes,
        edges: state.edges,
        viewport: state.viewport,
        lastModified: new Date().toISOString()
      });
      
      set({ 
        isDirty: false, 
        lastSaved: new Date(),
        isSaving: false 
      });
      return true;
    } catch (error) {
      console.error('Error saving canvas:', error);
      set({ isSaving: false });
      return false;
    }
  },

  publishFlow: async (flowId: number, publishNotes?: string): Promise<boolean> => {
    const state = get();
    try {
      set({ isPublishing: true, publishErrors: [] });
      
      // Validar antes de publicar
      const { validateFlowCanvas, isFlowReadyToPublish } = await import('@/shared/utils/flow-validation');
      const validationErrors = validateFlowCanvas(state.nodes, state.edges);
      
      if (!isFlowReadyToPublish(state.nodes, state.edges)) {
        set({ 
          publishErrors: validationErrors.filter(e => e.type === 'error'),
          isPublishing: false 
        });
        return false;
      }
      
      const { flowService } = await import('@/shared/services/flow/flow.service');
      
      await flowService.publishFlow(flowId, {
        nodes: state.nodes,
        edges: state.edges,
        publishNotes
      });
      
      set({ isPublishing: false });
      return true;
    } catch (error) {
      console.error('Error publishing flow:', error);
      set({ isPublishing: false });
      return false;
    }
  },

  validateFlow: () => {
    const state = get();
    import('@/shared/utils/flow-validation').then(({ validateFlowCanvas }) => {
      const errors = validateFlowCanvas(state.nodes, state.edges);
      set({ validationErrors: errors });
    });
  },

  // Validación
  setValidationErrors: (errors: ValidationError[]) => set({ validationErrors: errors }),
  setPublishErrors: (errors: ValidationError[]) => set({ publishErrors: errors }),
  clearValidationErrors: () => set({ validationErrors: [] }),
  
  // Reset
  reset: () => set({
    currentDesign: null,
    flowId: null,
    selectedNode: null,
    selectedEdge: null,
    isInspectorOpen: false,
    isDirty: false,
    isSaving: false,
    lastSaved: null,
    validationErrors: []
  })
}));
