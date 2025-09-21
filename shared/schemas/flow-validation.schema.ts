import { z } from 'zod';

// Schema para opciones de preguntas
const OptionSchema = z.object({
  value: z.string().min(1, 'El valor de la opción es requerido'),
  label: z.string().min(1, 'La etiqueta de la opción es requerida')
});

// Schema para posición de nodos
const PositionSchema = z.object({
  x: z.number().min(0, 'La posición X debe ser mayor a 0'),
  y: z.number().min(0, 'La posición Y debe ser mayor a 0')
});

// Schema base para datos de nodo
const NodeDataBaseSchema = z.object({
  label: z.string().min(1, 'La etiqueta del nodo es requerida'),
  messageText: z.string().optional(),
  templateId: z.number().positive().optional(),
  timeoutSeconds: z.number().positive().max(3600).optional() // Máximo 1 hora
});

// Schemas específicos por tipo de nodo
const MessageNodeDataSchema = NodeDataBaseSchema.extend({
  messageText: z.string().min(1, 'El texto del mensaje es requerido').max(1000, 'El mensaje no puede exceder 1000 caracteres')
}).refine(
  (data) => data.messageText || data.templateId,
  {
    message: 'Debe especificar texto del mensaje o ID de plantilla',
    path: ['messageText']
  }
);

const QuestionNodeDataSchema = NodeDataBaseSchema.extend({
  messageText: z.string().min(1, 'El texto de la pregunta es requerido'),
  questionType: z.enum(['text', 'number', 'option', 'yes_no', 'email', 'phone'], {
    errorMap: () => ({ message: 'Tipo de pregunta inválido' })
  }),
  options: z.array(OptionSchema).optional(),
  validationRegex: z.string().optional(),
  errorMessage: z.string().min(1, 'El mensaje de error es requerido')
}).refine(
  (data) => {
    if (data.questionType === 'option') {
      return data.options && data.options.length > 0;
    }
    return true;
  },
  {
    message: 'Las preguntas de opción múltiple requieren al menos una opción',
    path: ['options']
  }
);

const ConditionNodeDataSchema = NodeDataBaseSchema.extend({
  conditionType: z.enum(['equals', 'contains', 'regex', 'custom'], {
    errorMap: () => ({ message: 'Tipo de condición inválido' })
  }),
  conditionValue: z.string().min(1, 'El valor de la condición es requerido')
});

const ActionNodeDataSchema = NodeDataBaseSchema.extend({
  actionType: z.enum(['assign_agent', 'create_ticket', 'webhook', 'tag', 'save_variable'], {
    errorMap: () => ({ message: 'Tipo de acción inválido' })
  }),
  actionConfig: z.record(z.any()).optional()
});

const WaitNodeDataSchema = NodeDataBaseSchema.extend({
  timeoutSeconds: z.number().positive().max(3600, 'El timeout máximo es 3600 segundos (1 hora)')
});

const HandoffNodeDataSchema = NodeDataBaseSchema.extend({
  messageText: z.string().min(1, 'El mensaje de handoff es requerido'),
  handoffConfig: z.record(z.any()).optional()
});

const EndNodeDataSchema = NodeDataBaseSchema.extend({
  endType: z.enum(['completed', 'abandoned', 'timeout']).optional()
});

// Schema para nodos con discriminated union
export const FlowNodeSchema = z.discriminatedUnion('type', [
  z.object({
    id: z.string().min(1, 'ID de nodo requerido'),
    type: z.literal('message'),
    position: PositionSchema,
    data: MessageNodeDataSchema
  }),
  z.object({
    id: z.string().min(1, 'ID de nodo requerido'),
    type: z.literal('question'),
    position: PositionSchema,
    data: QuestionNodeDataSchema
  }),
  z.object({
    id: z.string().min(1, 'ID de nodo requerido'),
    type: z.literal('condition'),
    position: PositionSchema,
    data: ConditionNodeDataSchema
  }),
  z.object({
    id: z.string().min(1, 'ID de nodo requerido'),
    type: z.literal('action'),
    position: PositionSchema,
    data: ActionNodeDataSchema
  }),
  z.object({
    id: z.string().min(1, 'ID de nodo requerido'),
    type: z.literal('wait'),
    position: PositionSchema,
    data: WaitNodeDataSchema
  }),
  z.object({
    id: z.string().min(1, 'ID de nodo requerido'),
    type: z.literal('handoff'),
    position: PositionSchema,
    data: HandoffNodeDataSchema
  }),
  z.object({
    id: z.string().min(1, 'ID de nodo requerido'),
    type: z.literal('end'),
    position: PositionSchema,
    data: EndNodeDataSchema
  })
]);

// Schema para edges
export const FlowEdgeSchema = z.object({
  id: z.string().min(1, 'ID de conexión requerido'),
  source: z.string().min(1, 'Nodo origen requerido'),
  target: z.string().min(1, 'Nodo destino requerido'),
  type: z.enum(['default', 'conditional']).optional(),
  label: z.string().optional(),
  data: z.object({
    conditionType: z.string().optional(),
    conditionValue: z.string().optional(),
    priority: z.number().min(0).optional()
  }).optional()
});

// Schema para variables de flujo
const FlowVariableSchema = z.object({
  name: z.string().min(1, 'Nombre de variable requerido').regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Nombre de variable inválido'),
  type: z.enum(['string', 'number', 'boolean', 'date', 'array', 'object']),
  defaultValue: z.any().optional(),
  description: z.string().optional(),
  required: z.boolean().optional()
});

// Schema para metadata
const FlowMetadataSchema = z.object({
  lastModified: z.string().datetime(),
  modifiedBy: z.number().positive(),
  isDraft: z.boolean()
});

// Schema completo para el diseño del flujo
export const FlowDesignSchema = z.object({
  id: z.coerce.number().positive().optional(),
  flowId: z.coerce.number().positive('ID de flujo requerido'),
  version: z.coerce.number().positive('Versión debe ser mayor a 0'),
  nodes: z.array(FlowNodeSchema).min(1, 'El flujo debe tener al menos un nodo'),
  edges: z.array(FlowEdgeSchema),
  variables: z.array(FlowVariableSchema),
  metadata: FlowMetadataSchema
}).refine(
  (data) => {
    // Validar que todos los edges referencian nodos existentes
    const nodeIds = new Set(data.nodes.map(n => n.id));
    return data.edges.every(edge => 
      nodeIds.has(edge.source) && nodeIds.has(edge.target)
    );
  },
  {
    message: 'Todas las conexiones deben referenciar nodos existentes',
    path: ['edges']
  }
).refine(
  (data) => {
    // Validar que no hay ciclos infinitos (simplificado)
    const nodeIds = data.nodes.map(n => n.id);
    const edgeMap = new Map<string, string[]>();
    
    // Construir mapa de adyacencia
    data.edges.forEach(edge => {
      if (!edgeMap.has(edge.source)) {
        edgeMap.set(edge.source, []);
      }
      edgeMap.get(edge.source)!.push(edge.target);
    });
    
    // Verificar que hay al menos un nodo sin salidas (final)
    const hasOutgoing = new Set(data.edges.map(e => e.source));
    const finalNodes = data.nodes.filter(n => !hasOutgoing.has(n.id));
    
    return finalNodes.length > 0;
  },
  {
    message: 'El flujo debe tener al menos un nodo final (sin salidas)',
    path: ['nodes']
  }
).refine(
  (data) => {
    // Validar nombres únicos de variables
    const variableNames = data.variables.map(v => v.name);
    return new Set(variableNames).size === variableNames.length;
  },
  {
    message: 'Los nombres de variables deben ser únicos',
    path: ['variables']
  }
);

// Tipos TypeScript derivados de schemas
export type FlowNodeValidated = z.infer<typeof FlowNodeSchema>;
export type FlowEdgeValidated = z.infer<typeof FlowEdgeSchema>;
export type FlowDesignValidated = z.infer<typeof FlowDesignSchema>;

// Función helper para validar diseño completo
export const validateFlowDesign = (design: any) => {
  try {
    const validated = FlowDesignSchema.parse(design);
    return { success: true, data: validated, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.issues.map(issue => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code
      }));
      return { success: false, data: null, errors: formattedErrors };
    }
    return { success: false, data: null, errors: [{ path: 'unknown', message: 'Error de validación desconocido', code: 'unknown' }] };
  }
};

// Función helper para validar nodo individual
export const validateFlowNode = (node: any) => {
  try {
    const validated = FlowNodeSchema.parse(node);
    return { success: true, data: validated, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.issues.map(issue => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code
      }));
      return { success: false, data: null, errors: formattedErrors };
    }
    return { success: false, data: null, errors: [{ path: 'unknown', message: 'Error de validación desconocido', code: 'unknown' }] };
  }
};

// Función helper para validar edge individual
export const validateFlowEdge = (edge: any) => {
  try {
    const validated = FlowEdgeSchema.parse(edge);
    return { success: true, data: validated, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.issues.map(issue => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code
      }));
      return { success: false, data: null, errors: formattedErrors };
    }
    return { success: false, data: null, errors: [{ path: 'unknown', message: 'Error de validación desconocido', code: 'unknown' }] };
  }
};
