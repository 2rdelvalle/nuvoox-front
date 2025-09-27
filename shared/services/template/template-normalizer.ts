import { TemplateModel, TemplateInteractiveType } from "@/shared/models/template/template.model"

export type RawTemplate = Partial<TemplateModel>

export interface NormalizedTemplate extends TemplateModel {
  name: string
  textTemplate: string
  categoryTemplateWhatsapp: string
  statusTemplateWhatsapp: string
  interactive_type: TemplateInteractiveType
  interactive_buttons: TemplateModel["interactive_buttons"] | null
  interactive_sections: TemplateModel["interactive_sections"] | null
}

const DEFAULT_NAME = "(Sin nombre)"
const DEFAULT_TEXT = ""
const DEFAULT_CATEGORY = "UNKNOWN"
const DEFAULT_STATUS = "PENDING"
const DEFAULT_INTERACTIVE_TYPE: TemplateInteractiveType = "none"

const ensureString = (value: unknown, fallback: string): string => {
  if (typeof value === "string") {
    return value
  }

  if (value === null || value === undefined) {
    return fallback
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value)
  }

  return fallback
}

export const normalizeTemplate = (template: RawTemplate): NormalizedTemplate => {
  const safeName = ensureString(template.name ?? template.nameTemplate, DEFAULT_NAME)
  const safeText = ensureString(template.textTemplate, DEFAULT_TEXT)
  const safeCategory = ensureString(template.categoryTemplateWhatsapp, DEFAULT_CATEGORY)
  const safeStatus = ensureString(template.statusTemplateWhatsapp, DEFAULT_STATUS)
  const interactiveType = (template.interactive_type ?? DEFAULT_INTERACTIVE_TYPE) as TemplateInteractiveType

  return {
    ...template,
    name: safeName,
    nameTemplate: ensureString(template.nameTemplate ?? safeName, safeName),
    textTemplate: safeText,
    categoryTemplateWhatsapp: safeCategory,
    statusTemplateWhatsapp: safeStatus,
    interactive_type: interactiveType,
    interactive_buttons: (template.interactive_buttons ?? null) as NormalizedTemplate["interactive_buttons"],
    interactive_sections: (template.interactive_sections ?? null) as NormalizedTemplate["interactive_sections"],
  }
}

export const normalizeTemplateCollection = (templates: RawTemplate[] | null | undefined): NormalizedTemplate[] => {
  if (!Array.isArray(templates)) {
    return []
  }

  return templates.map((template) => normalizeTemplate(template))
}
