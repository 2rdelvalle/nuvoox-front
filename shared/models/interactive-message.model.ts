// ==========================================
// 🎯 MODELOS PARA MENSAJES INTERACTIVOS DE WHATSAPP
// ==========================================

/**
 * Botón para Quick Reply
 */
export interface QuickReplyButton {
  id: string;
  title: string; // Máximo 20 caracteres
}

/**
 * Fila individual dentro de una sección de lista
 */
export interface ListRow {
  id: string;
  title: string; // Máximo 24 caracteres
  description?: string; // Máximo 72 caracteres (opcional)
}

/**
 * Sección de una lista interactiva
 */
export interface ListSection {
  title: string; // Título de la sección
  rows: ListRow[]; // Filas dentro de esta sección
}

/**
 * Parámetros para enviar Quick Reply
 */
export interface QuickReplyParams {
  recipientPhone: string;
  bodyText: string;
  buttons: QuickReplyButton[];
  accessToken: string;
  phoneNumberId: string;
}

/**
 * Parámetros para enviar Lista interactiva
 */
export interface ListMessageParams {
  recipientPhone: string;
  bodyText: string;
  buttonText: string; // Texto del botón para abrir la lista
  sections: ListSection[];
  accessToken: string;
  phoneNumberId: string;
}

/**
 * Tipos de mensajes interactivos soportados
 */
export type InteractiveMessageType = 'quick_reply' | 'list' | null;

/**
 * Estado de un mensaje interactivo
 */
export type InteractiveMessageStatus = 'composing' | 'sending' | 'sent' | 'delivered' | 'read' | 'error';

/**
 * Respuesta interactiva del usuario (desde webhook)
 */
export interface InteractiveResponse {
  type: 'button_reply' | 'list_reply';
  interactive_id: string;
  interactive_title: string;
  interactive_description?: string; // Solo para list_reply
}

/**
 * Configuración para el composer de mensajes interactivos
 */
export interface InteractiveComposerConfig {
  maxButtons: number; // 3 para Quick Reply
  maxSections: number; // 10 para Lista
  maxRowsPerSection: number; // Sin límite específico, pero 100 total
  maxTotalRows: number; // 100 total
  maxButtonTitleLength: number; // 20 caracteres
  maxRowTitleLength: number; // 24 caracteres
  maxRowDescriptionLength: number; // 72 caracteres
}

/**
 * Configuración por defecto para mensajes interactivos
 */
export const DEFAULT_INTERACTIVE_CONFIG: InteractiveComposerConfig = {
  maxButtons: 3,
  maxSections: 10,
  maxRowsPerSection: 100, // Técnicamente ilimitado por sección
  maxTotalRows: 100,
  maxButtonTitleLength: 20,
  maxRowTitleLength: 24,
  maxRowDescriptionLength: 72
};

/**
 * Resultado de validación de mensaje interactivo
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Estadísticas de uso de caracteres
 */
export interface CharacterUsageStats {
  bodyText: {
    used: number;
    limit: number;
    isValid: boolean;
  };
  buttons?: Array<{
    title: string;
    used: number;
    limit: number;
    isValid: boolean;
  }>;
  sections?: Array<{
    title: string;
    rows: Array<{
      title: string;
      titleUsed: number;
      titleLimit: number;
      titleValid: boolean;
      description?: string;
      descriptionUsed?: number;
      descriptionLimit?: number;
      descriptionValid?: boolean;
    }>;
  }>;
}

/**
 * Plantilla predefinida para mensaje interactivo
 */
export interface InteractiveTemplate {
  id: string;
  name: string;
  description: string;
  type: InteractiveMessageType;
  bodyText: string;
  buttons?: QuickReplyButton[];
  sections?: ListSection[];
  category: 'soporte' | 'ventas' | 'catalogo' | 'encuesta' | 'reserva' | 'personalizado';
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Métricas de rendimiento de mensajes interactivos
 */
export interface InteractiveMetrics {
  messageId: string;
  type: InteractiveMessageType;
  sentAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
  respondedAt?: Date;
  responseType?: 'button_reply' | 'list_reply';
  selectedOptionId?: string;
  selectedOptionTitle?: string;
  responseTimeSeconds?: number;
  engagementRate: number; // 0-1 (0% a 100%)
}

/**
 * Contexto del flow para mensajes interactivos
 */
export interface FlowContext {
  flowId: number;
  sessionId: number;
  currentNodeId: string;
  conversationId: number;
  userId: string;
  variables: Record<string, any>;
  isActive: boolean;
}

/**
 * Builder helper para crear mensajes interactivos
 */
export class InteractiveMessageBuilder {
  private config: InteractiveComposerConfig;

  constructor(config: InteractiveComposerConfig = DEFAULT_INTERACTIVE_CONFIG) {
    this.config = config;
  }

  /**
   * Crea un Quick Reply básico
   */
  createQuickReply(
    bodyText: string,
    buttons: QuickReplyButton[]
  ): QuickReplyParams | ValidationResult {
    const validation = this.validateQuickReply(bodyText, buttons);
    if (!validation.isValid) {
      return validation;
    }

    return {
      recipientPhone: '', // Se debe establecer al enviar
      bodyText,
      buttons,
      accessToken: '', // Se debe establecer al enviar
      phoneNumberId: '' // Se debe establecer al enviar
    };
  }

  /**
   * Crea una Lista interactiva básica
   */
  createList(
    bodyText: string,
    buttonText: string,
    sections: ListSection[]
  ): ListMessageParams | ValidationResult {
    const validation = this.validateList(bodyText, buttonText, sections);
    if (!validation.isValid) {
      return validation;
    }

    return {
      recipientPhone: '', // Se debe establecer al enviar
      bodyText,
      buttonText,
      sections,
      accessToken: '', // Se debe establecer al enviar
      phoneNumberId: '' // Se debe establecer al enviar
    };
  }

  /**
   * Valida un Quick Reply
   */
  validateQuickReply(bodyText: string, buttons: QuickReplyButton[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!bodyText || !bodyText.trim()) {
      errors.push("El texto del mensaje es requerido");
    }

    if (!buttons || buttons.length === 0) {
      errors.push("Se requiere al menos un botón");
    } else if (buttons.length > this.config.maxButtons) {
      errors.push(`Máximo ${this.config.maxButtons} botones permitidos`);
    }

    // Validar cada botón
    buttons.forEach((btn, index) => {
      if (!btn.id || !btn.id.trim()) {
        errors.push(`Botón ${index + 1}: ID requerido`);
      }
      if (!btn.title || !btn.title.trim()) {
        errors.push(`Botón ${index + 1}: título requerido`);
      } else if (btn.title.length > this.config.maxButtonTitleLength) {
        errors.push(`Botón ${index + 1}: título muy largo (máx ${this.config.maxButtonTitleLength} caracteres)`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Valida una Lista interactiva
   */
  validateList(bodyText: string, buttonText: string, sections: ListSection[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!bodyText || !bodyText.trim()) {
      errors.push("El texto del mensaje es requerido");
    }

    if (!buttonText || !buttonText.trim()) {
      errors.push("El texto del botón es requerido");
    }

    if (!sections || sections.length === 0) {
      errors.push("Se requiere al menos una sección");
    } else if (sections.length > this.config.maxSections) {
      errors.push(`Máximo ${this.config.maxSections} secciones permitidas`);
    }

    // Contar filas totales y validar cada sección
    let totalRows = 0;
    sections.forEach((section, sectionIndex) => {
      if (!section.title || !section.title.trim()) {
        errors.push(`Sección ${sectionIndex + 1}: título requerido`);
      }

      if (!section.rows || section.rows.length === 0) {
        errors.push(`Sección ${sectionIndex + 1}: al menos una fila requerida`);
      } else {
        totalRows += section.rows.length;
        
        section.rows.forEach((row, rowIndex) => {
          if (!row.id || !row.id.trim()) {
            errors.push(`Sección ${sectionIndex + 1}, Fila ${rowIndex + 1}: ID requerido`);
          }
          if (!row.title || !row.title.trim()) {
            errors.push(`Sección ${sectionIndex + 1}, Fila ${rowIndex + 1}: título requerido`);
          } else if (row.title.length > this.config.maxRowTitleLength) {
            errors.push(`Sección ${sectionIndex + 1}, Fila ${rowIndex + 1}: título muy largo (máx ${this.config.maxRowTitleLength} caracteres)`);
          }
          
          if (row.description && row.description.length > this.config.maxRowDescriptionLength) {
            errors.push(`Sección ${sectionIndex + 1}, Fila ${rowIndex + 1}: descripción muy larga (máx ${this.config.maxRowDescriptionLength} caracteres)`);
          }
        });
      }
    });

    if (totalRows > this.config.maxTotalRows) {
      errors.push(`Máximo ${this.config.maxTotalRows} filas totales permitidas (actual: ${totalRows})`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}
