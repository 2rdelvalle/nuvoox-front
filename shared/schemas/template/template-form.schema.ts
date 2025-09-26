import { z } from 'zod'
import {
  TemplateCtaButton,
  TemplateInteractiveType,
  TemplateListButton,
  TemplateListRow,
  TemplateListSection,
  TemplateQuickReplyButton,
} from '@/shared/models/template/template.model'

const quickReplyButtonSchema: z.ZodType<TemplateQuickReplyButton> = z.object({
  type: z.literal('reply'),
  id: z
    .string()
    .min(1, 'El ID es obligatorio')
    .max(256, 'El ID no puede superar 256 caracteres'),
  title: z
    .string()
    .min(1, 'El texto es obligatorio')
    .max(20, 'El texto no puede superar 20 caracteres'),
})

const phoneRegex = /^\+?[0-9]{6,15}$/

const ctaButtonSchema: z.ZodType<TemplateCtaButton> = z
  .object({
    type: z.enum(['call', 'url']),
    title: z
      .string()
      .min(1, 'El título es obligatorio')
      .max(20, 'El título no puede superar 20 caracteres'),
    phoneNumber: z.string().optional(),
    url: z.string().url('La URL debe ser válida').optional(),
  })
  .superRefine((value, ctx) => {
    if (value.type === 'call') {
      if (!value.phoneNumber) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Ingrese un número telefónico',
          path: ['phoneNumber'],
        })
      } else if (!phoneRegex.test(value.phoneNumber)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'El número telefónico debe tener entre 6 y 15 dígitos',
          path: ['phoneNumber'],
        })
      }
    }

    if (value.type === 'url' && !value.url) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Ingrese una URL',
        path: ['url'],
      })
    }
  })

const listRowSchema: z.ZodType<TemplateListRow> = z.object({
  id: z
    .string()
    .min(1, 'El ID es obligatorio')
    .max(200, 'El ID no puede superar 200 caracteres'),
  title: z
    .string()
    .min(1, 'El título es obligatorio')
    .max(24, 'El título no puede superar 24 caracteres'),
  description: z
    .string()
    .max(72, 'La descripción no puede superar 72 caracteres')
    .optional(),
})

const listSectionSchema: z.ZodType<TemplateListSection> = z.object({
  title: z
    .string()
    .max(24, 'El título de la sección no puede superar 24 caracteres')
    .optional(),
  rows: z
    .array(listRowSchema)
    .min(1, 'Cada sección debe tener al menos una opción')
    .max(10, 'Cada sección puede tener máximo 10 opciones'),
})

const listButtonSchema: z.ZodType<TemplateListButton> = z.object({
  buttonText: z
    .string()
    .min(1, 'El texto del botón es obligatorio')
    .max(20, 'El texto del botón no puede superar 20 caracteres'),
})

const interactiveTypeSchema: z.ZodType<TemplateInteractiveType> = z.enum([
  'none',
  'quick_reply',
  'cta',
  'list',
])

export const templateInteractiveSchema = z.object({
  type: interactiveTypeSchema,
  quickReplies: z.array(quickReplyButtonSchema).default([]),
  ctaButtons: z.array(ctaButtonSchema).default([]),
  listButton: listButtonSchema.optional(),
  listSections: z.array(listSectionSchema).default([]),
})

export const templateFormSchema = z
  .object({
    nameTemplate: z
      .string({ required_error: 'El nombre es obligatorio' })
      .min(1, 'El nombre es obligatorio'),
    textTemplate: z
      .string()
      .default(''),
    interactive: templateInteractiveSchema,
  })
  .superRefine((data, ctx) => {
    const { type, quickReplies, ctaButtons, listButton, listSections } =
      data.interactive

    if (type === 'none') {
      if (quickReplies.length > 0 || ctaButtons.length > 0 || listSections.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La configuración interactiva debe estar vacía cuando el tipo es "none"',
          path: ['interactive'],
        })
      }
      return
    }

    if (type === 'quick_reply') {
      if (quickReplies.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Agregue al menos un botón',
          path: ['interactive', 'quickReplies'],
        })
      }
      if (quickReplies.length > 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Máximo 3 botones',
          path: ['interactive', 'quickReplies'],
        })
      }
      const ids = quickReplies.map((b) => b.id)
      const uniqueIds = new Set(ids)
      if (uniqueIds.size !== ids.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Los IDs de los botones deben ser únicos',
          path: ['interactive', 'quickReplies'],
        })
      }
      return
    }

    if (type === 'cta') {
      if (ctaButtons.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Agregue al menos un botón CTA',
          path: ['interactive', 'ctaButtons'],
        })
      }
      if (ctaButtons.length > 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Máximo 2 botones CTA (teléfono y/o URL)',
          path: ['interactive', 'ctaButtons'],
        })
      }
      const callButtons = ctaButtons.filter((b) => b.type === 'call')
      if (callButtons.length > 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Solo se permite un botón CTA de teléfono',
          path: ['interactive', 'ctaButtons'],
        })
      }
      const urlButtons = ctaButtons.filter((b) => b.type === 'url')
      if (urlButtons.length > 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Solo se permite un botón CTA con URL',
          path: ['interactive', 'ctaButtons'],
        })
      }
      return
    }

    if (type === 'list') {
      if (!listButton) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Configure el texto del botón de lista',
          path: ['interactive', 'listButton'],
        })
      }
      if (!listSections || listSections.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Agregue al menos una sección',
          path: ['interactive', 'listSections'],
        })
      }
      const totalRows = listSections.reduce((acc, section) => acc + section.rows.length, 0)
      if (totalRows > 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Máximo 10 opciones en total',
          path: ['interactive', 'listSections'],
        })
      }
      return
    }
  })

export type TemplateInteractiveFormValues = z.infer<typeof templateInteractiveSchema>
export type TemplateFormValues = z.infer<typeof templateFormSchema>

export const defaultInteractiveValues: TemplateInteractiveFormValues = {
  type: 'none',
  quickReplies: [],
  ctaButtons: [],
  listSections: [],
}
