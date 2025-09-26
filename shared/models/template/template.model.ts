export type TemplateInteractiveType = 'none' | 'quick_reply' | 'list' | 'cta'

export interface TemplateQuickReplyButton {
  type: 'reply'
  id: string
  title: string
}

export interface TemplateCtaButton {
  type: 'call' | 'url'
  title: string
  phoneNumber?: string
  url?: string
}

export interface TemplateListRow {
  id: string
  title: string
  description?: string
}

export interface TemplateListSection {
  title?: string
  rows: TemplateListRow[]
}

export interface TemplateListButton {
  buttonText: string
}

export interface TemplateModel {
  id?: number
  companyID?: number
  name: string            // Nombre de la plantilla
  nameTemplate?: string   // Campo anterior - para compatibilidad
  textTemplate?: string   // Campo anterior - para compatibilidad
  categoryTemplateWhatsapp?: string  // Categoría de la plantilla (MARKETING, etc.)
  statusTemplateWhatsapp?: string    // Estado de la plantilla (APPROVED, PENDING)
  interactive_type?: TemplateInteractiveType
  interactive_buttons?: (TemplateQuickReplyButton | TemplateCtaButton)[] | TemplateListButton | null
  interactive_sections?: TemplateListSection[] | null
}
