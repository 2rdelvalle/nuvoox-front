export interface TemplateModel {
  id?: number;
  companyID?: number;
  name: string;            // Nombre de la plantilla
  nameTemplate?: string;   // Campo anterior - para compatibilidad
  textTemplate?: string;   // Campo anterior - para compatibilidad
  categoryTemplateWhatsapp?: string;  // Categoría de la plantilla (MARKETING, etc.)
  statusTemplateWhatsapp?: string;    // Estado de la plantilla (APPROVED, PENDING)
}
