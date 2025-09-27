export type TemplateButtonType = "QUICK_REPLY" | "URL" | "PHONE_NUMBER";

export interface TemplateButton {
  /**
   * Identificador opcional del botón (solo para uso en frontend)
   */
  id?: string;

  /**
   * Tipo de botón soportado por las plantillas de WhatsApp
   */
  type: TemplateButtonType;

  /**
   * Texto visible del botón
   */
  text: string;

  /**
   * Payload opcional (para respuestas rápidas)
   */
  payload?: string;

  /**
   * URL opcional (para botones de tipo URL)
   */
  url?: string;

  /**
   * Número telefónico opcional (para botones de llamada)
   */
  phoneNumber?: string;
}

export type TemplateComponentParameter =
  | { type: "text"; text: string }
  | { type: "payload"; payload: string };

export interface TemplateSectionRow {
  id?: string;
  title: string;
  description?: string;
}

export interface TemplateSection {
  id?: string;
  title: string;
  rows: TemplateSectionRow[];
}

export interface TemplateBodyComponent {
  type: "body";
  text?: string;
  parameters?: TemplateComponentParameter[];
}

export interface TemplateFooterComponent {
  type: "footer";
  text: string;
}

export interface TemplateButtonsComponent {
  type: "buttons";
  buttons: TemplateButton[];
}

export interface TemplateSectionsComponent {
  type: "sections";
  sections: TemplateSection[];
}

export type TemplateInteractiveComponent =
  | TemplateBodyComponent
  | TemplateFooterComponent
  | TemplateButtonsComponent
  | TemplateSectionsComponent;

export interface TemplateModel {
  id?: number;
  companyID?: number;
  name: string;            // Nombre de la plantilla
  nameTemplate?: string;   // Campo anterior - para compatibilidad
  textTemplate?: string;   // Campo anterior - para compatibilidad
  categoryTemplateWhatsapp?: string;  // Categoría de la plantilla (MARKETING, etc.)
  statusTemplateWhatsapp?: string;    // Estado de la plantilla (APPROVED, PENDING)
  /**
   * Componentes interactivos asociados a la plantilla
   */
  components?: TemplateInteractiveComponent[];
}
