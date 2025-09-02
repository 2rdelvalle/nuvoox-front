import { create } from 'zustand';

// Tipos para el diseñador de flujos
export interface FlowNode {
  id: string;
  type: 'message' | 'question' | 'condition' | 'action' | 'wait';
  position: { x: number; y: number };
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
  };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  type?: 'default' | 'conditional';
  label?: string;
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
  
  // Estado de guardado
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: string | null;
  
  // Estados de validación
  validationErrors: Array<{
    nodeId?: string;
    edgeId?: string;
    message: string;
    type: 'error' | 'warning';
  }>;
  
  // Acciones para manejar el diseño
  setCurrentDesign: (design: FlowDesign | null) => void;
  setFlowId: (id: number | null) => void;
  
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
  setLastSaved: (timestamp: string) => void;
  
  // Acciones de validación
  setValidationErrors: (errors: Array<{
    nodeId?: string;
    edgeId?: string;
    message: string;
    type: 'error' | 'warning';
  }>) => void;
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
  isDirty: false,
  isSaving: false,
  lastSaved: null,
  validationErrors: [],
  
  // Implementaciones de acciones
  setCurrentDesign: (design) => set({ currentDesign: design }),
  setFlowId: (id) => set({ flowId: id }),
  
  // Gestión de nodos
  addNode: (node) => set((state) => {
    if (!state.currentDesign) return state;
    
    return {
      currentDesign: {
        ...state.currentDesign,
        nodes: [...state.currentDesign.nodes, node]
      },
      isDirty: true
    };
  }),
  
  updateNode: (nodeId, updates) => set((state) => {
    if (!state.currentDesign) return state;
    
    return {
      currentDesign: {
        ...state.currentDesign,
        nodes: state.currentDesign.nodes.map(node =>
          node.id === nodeId ? { ...node, ...updates } : node
        )
      },
      isDirty: true
    };
  }),
  
  deleteNode: (nodeId) => set((state) => {
    if (!state.currentDesign) return state;
    
    // También eliminar edges conectados al nodo
    const filteredEdges = state.currentDesign.edges.filter(
      edge => edge.source !== nodeId && edge.target !== nodeId
    );
    
    return {
      currentDesign: {
        ...state.currentDesign,
        nodes: state.currentDesign.nodes.filter(node => node.id !== nodeId),
        edges: filteredEdges
      },
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
  addEdge: (edge) => set((state) => {
    if (!state.currentDesign) return state;
    
    return {
      currentDesign: {
        ...state.currentDesign,
        edges: [...state.currentDesign.edges, edge]
      },
      isDirty: true
    };
  }),
  
  updateEdge: (edgeId, updates) => set((state) => {
    if (!state.currentDesign) return state;
    
    return {
      currentDesign: {
        ...state.currentDesign,
        edges: state.currentDesign.edges.map(edge =>
          edge.id === edgeId ? { ...edge, ...updates } : edge
        )
      },
      isDirty: true
    };
  }),
  
  deleteEdge: (edgeId) => set((state) => {
    if (!state.currentDesign) return state;
    
    return {
      currentDesign: {
        ...state.currentDesign,
        edges: state.currentDesign.edges.filter(edge => edge.id !== edgeId)
      },
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
  setSaving: (saving) => set({ isSaving: saving }),
  setLastSaved: (timestamp) => set({ lastSaved: timestamp }),
  
  // Validación
  setValidationErrors: (errors) => set({ validationErrors: errors }),
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
