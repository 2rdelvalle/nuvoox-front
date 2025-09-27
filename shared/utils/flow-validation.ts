import { z } from 'zod';
import { FlowNode, FlowEdge } from '@/shared/stores/flow-designer-store';

// Schema para validar nodos individuales
const FlowNodeSchema = z.object({
  id: z.string(),
  type: z.enum(['message', 'question', 'condition', 'action', 'wait', 'handoff', 'end']),
  position: z.object({
    x: z.number(),
    y: z.number()
  }),
  data: z.object({
    label: z.string().min(1, 'El nodo debe tener una etiqueta'),
    messageText: z.string().optional(),
    questionType: z.enum(['text', 'number', 'email', 'phone', 'yes_no', 'option']).optional(),
    options: z.array(z.string()).optional(),
    conditionField: z.string().optional(),
    conditionOperator: z.enum(['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than']).optional(),
    conditionValue: z.string().optional(),
    actionType: z.enum(['set_variable', 'send_email', 'webhook', 'transfer']).optional(),
    actionConfig: z.record(z.any()).optional(),
    waitDuration: z.number().optional(),
    waitUnit: z.enum(['seconds', 'minutes', 'hours']).optional(),
    handoffConfig: z.record(z.any()).optional()
  })
});

// Schema para validar edges individuales
const FlowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
  type: z.string().optional(),
  data: z.object({
    condition: z.string().optional(),
    priority: z.number().optional()
  }).optional()
});

// Schema para validar el canvas completo
const FlowCanvasSchema = z.object({
  nodes: z.array(FlowNodeSchema),
  edges: z.array(FlowEdgeSchema)
});

// Tipos de error de validación
export interface ValidationError {
  type: 'error' | 'warning';
  nodeId?: string;
  edgeId?: string;
  message: string;
  code: string;
}

// Función principal de validación
export function validateFlowCanvas(nodes: FlowNode[], edges: FlowEdge[]): ValidationError[] {
  const errors: ValidationError[] = [];

  try {
    // Validación del schema básico
    FlowCanvasSchema.parse({ nodes, edges });
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        errors.push({
          type: 'error',
          message: err.message,
          code: 'SCHEMA_ERROR'
        });
      });
    }
  }

  // Validaciones específicas de flujo de chatbot
  
  // 1. Debe existir al menos un nodo
  if (nodes.length === 0) {
    errors.push({
      type: 'error',
      message: 'El flujo debe contener al menos un nodo',
      code: 'EMPTY_FLOW'
    });
    return errors;
  }

  // 2. Debe existir exactamente un nodo de inicio (sin edges entrantes)
  const startNodes = findStartNodes(nodes, edges);
  if (startNodes.length === 0) {
    errors.push({
      type: 'error',
      message: 'El flujo debe tener un nodo de inicio (sin conexiones entrantes)',
      code: 'NO_START_NODE'
    });
  } else if (startNodes.length > 1) {
    startNodes.slice(1).forEach(node => {
      errors.push({
        type: 'error',
        nodeId: node.id,
        message: 'Solo puede existir un nodo de inicio en el flujo',
        code: 'MULTIPLE_START_NODES'
      });
    });
  }

  // 3. Debe existir al menos un nodo end
  const endNodes = nodes.filter(node => node.type === 'end');
  if (endNodes.length === 0) {
    errors.push({
      type: 'warning',
      message: 'Se recomienda agregar al menos un nodo de finalización',
      code: 'NO_END_NODE'
    });
  }

  // 4. Todos los nodos deben estar conectados (no nodos huérfanos)
  const connectedNodes = findConnectedNodes(nodes, edges);
  nodes.forEach(node => {
    if (!connectedNodes.has(node.id) && startNodes.length > 0) {
      errors.push({
        type: 'warning',
        nodeId: node.id,
        message: 'Este nodo no está conectado al flujo principal',
        code: 'ORPHANED_NODE'
      });
    }
  });

  // 5. Detectar ciclos infinitos
  const cycles = detectCycles(nodes, edges);
  cycles.forEach(cycle => {
    errors.push({
      type: 'error',
      message: `Ciclo detectado: ${cycle.join(' → ')}`,
      code: 'INFINITE_CYCLE'
    });
  });

  // 6. Validar que edges usen handles válidos
  edges.forEach(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);

    if (!sourceNode || !targetNode) {
      errors.push({
        type: 'error',
        edgeId: edge.id,
        message: 'Edge conecta nodos inexistentes',
        code: 'INVALID_EDGE_CONNECTION'
      });
      return;
    }

    // Validar sourceHandle según tipo de nodo
    if (edge.sourceHandle && !isValidSourceHandle(sourceNode, edge.sourceHandle)) {
      errors.push({
        type: 'error',
        edgeId: edge.id,
        nodeId: sourceNode.id,
        message: `Handle "${edge.sourceHandle}" no válido para nodo tipo "${sourceNode.type}"`,
        code: 'INVALID_SOURCE_HANDLE'
      });
    }
  });

  // 7. Validar que nodos question tengan opciones si son de tipo option
  nodes.forEach(node => {
    if (node.type === 'question' && node.data.questionType === 'option') {
      if (!node.data.options || node.data.options.length === 0) {
        errors.push({
          type: 'error',
          nodeId: node.id,
          message: 'Las preguntas de tipo opción deben tener al menos una opción',
          code: 'MISSING_QUESTION_OPTIONS'
        });
      }
    }

    // Validar que nodos condition tengan condición configurada
    if (node.type === 'condition') {
      if (!node.data.conditionField || !node.data.conditionOperator) {
        errors.push({
          type: 'error',
          nodeId: node.id,
          message: 'Los nodos de condición deben tener campo y operador configurados',
          code: 'INCOMPLETE_CONDITION'
        });
      }
    }

    // Validar que nodos wait tengan duración
    if (node.type === 'wait') {
      if (!node.data.waitDuration || node.data.waitDuration <= 0) {
        errors.push({
          type: 'error',
          nodeId: node.id,
          message: 'Los nodos de espera deben tener una duración mayor a 0',
          code: 'INVALID_WAIT_DURATION'
        });
      }
    }
  });

  return errors;
}

// Funciones auxiliares

function findStartNodes(nodes: FlowNode[], edges: FlowEdge[]): FlowNode[] {
  const nodesWithIncomingEdges = new Set(edges.map(e => e.target));
  return nodes.filter(node => !nodesWithIncomingEdges.has(node.id));
}

function findConnectedNodes(nodes: FlowNode[], edges: FlowEdge[]): Set<string> {
  const connected = new Set<string>();
  const startNodes = findStartNodes(nodes, edges);
  
  if (startNodes.length === 0) return connected;

  // BFS desde nodos de inicio
  const queue = [...startNodes.map(n => n.id)];
  
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    if (connected.has(nodeId)) continue;
    
    connected.add(nodeId);
    
    // Agregar nodos destino de este nodo
    edges
      .filter(e => e.source === nodeId)
      .forEach(e => {
        if (!connected.has(e.target)) {
          queue.push(e.target);
        }
      });
  }

  return connected;
}

function detectCycles(nodes: FlowNode[], edges: FlowEdge[]): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(nodeId: string, path: string[]): boolean {
    if (recursionStack.has(nodeId)) {
      // Encontramos un ciclo
      const cycleStart = path.indexOf(nodeId);
      cycles.push(path.slice(cycleStart).concat(nodeId));
      return true;
    }

    if (visited.has(nodeId)) return false;

    visited.add(nodeId);
    recursionStack.add(nodeId);

    const outgoingEdges = edges.filter(e => e.source === nodeId);
    for (const edge of outgoingEdges) {
      if (dfs(edge.target, [...path, nodeId])) {
        recursionStack.delete(nodeId);
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      dfs(node.id, []);
    }
  });

  return cycles;
}

function isValidSourceHandle(node: FlowNode, handle: string): boolean {
  switch (node.type) {
    case 'message':
    case 'action':
      return handle === 'source' || !handle;
    
    case 'question':
      const validQuestionHandles = ['yes', 'no', 'valid', 'invalid', 'option-1', 'option-2', 'option-3'];
      return validQuestionHandles.includes(handle);
    
    case 'condition':
      return ['true', 'false'].includes(handle);
    
    case 'wait':
      return ['timeout', 'next'].includes(handle);
    
    case 'handoff':
      return ['success', 'operator_busy', 'failure'].includes(handle);
    
    case 'end':
      return false; // End nodes no pueden tener salidas
    
    default:
      return false;
  }
}

// Función para verificar si el flujo está listo para publicar
export function isFlowReadyToPublish(nodes: FlowNode[], edges: FlowEdge[]): boolean {
  const errors = validateFlowCanvas(nodes, edges);
  return errors.filter(e => e.type === 'error').length === 0;
}
