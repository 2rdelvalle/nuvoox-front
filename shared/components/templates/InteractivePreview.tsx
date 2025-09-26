"use client"

import { Card } from "primereact/card"
import { Chip } from "primereact/chip"
import { Divider } from "primereact/divider"
import { Button } from "primereact/button"
import { useMemo } from "react"
import { useFormContext } from "react-hook-form"
import {
  TemplateFormValues,
  TemplateInteractiveFormValues,
  defaultInteractiveValues,
} from "@/shared/schemas/template/template-form.schema"
import { TemplateInteractiveType } from "@/shared/models/template/template.model"

const interactiveTypeLabels: Record<TemplateInteractiveType, string> = {
  none: "Sin interacción",
  quick_reply: "Quick replies",
  cta: "Call to action",
  list: "Lista",
}

const QuickReplyPreview = ({ buttons }: { buttons: TemplateInteractiveFormValues["quickReplies"] }) => {
  const safeButtons = Array.isArray(buttons) ? buttons : []
  if (!safeButtons.length) {
    return <span className="text-sm text-600">Agrega botones quick reply para previsualizarlos.</span>
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {safeButtons.map((button) => (
        <Chip key={button.id} label={button.title} className="py-2 px-3 bg-blue-50 border-round" />
      ))}
    </div>
  )
}

const CtaButtonsPreview = ({ buttons }: { buttons: TemplateInteractiveFormValues["ctaButtons"] }) => {
  const safeButtons = Array.isArray(buttons) ? buttons : []
  if (!safeButtons.length) {
    return <span className="text-sm text-600">Agrega botones CTA para ver la previsualización.</span>
  }

  return (
    <div className="flex flex-column gap-2">
      {safeButtons.map((button, index) => (
        <Button
          key={`${button.type}-${index}`}
          label={button.title || (button.type === "call" ? "Llamar" : "Visitar URL")}
          icon={button.type === "call" ? "pi pi-phone" : "pi pi-link"}
          className="w-full"
          severity="secondary"
          outlined
        />
      ))}
    </div>
  )
}

const ListPreview = ({
  button,
  sections,
}: {
  button?: TemplateInteractiveFormValues["listButton"]
  sections: TemplateInteractiveFormValues["listSections"]
}) => {
  const safeSections = Array.isArray(sections) ? sections : []
  if (!safeSections.length) {
    return <span className="text-sm text-600">Agrega secciones para previsualizar el mensaje de lista.</span>
  }

  return (
    <div className="flex flex-column gap-3">
      <Button
        type="button"
        label={button?.buttonText || "Seleccionar opción"}
        className="align-self-start"
        severity="secondary"
        outlined
      />
      <div className="flex flex-column gap-2">
        {safeSections.map((section, sectionIndex) => (
          <Card key={`section-${sectionIndex}`} className="border-200 border-1">
            {section.title && (
              <div className="font-medium text-800 mb-2">{section.title}</div>
            )}
            <div className="flex flex-column gap-2">
              {section.rows.map((row) => (
                <div key={row.id} className="flex flex-column gap-1">
                  <span className="font-medium text-900">{row.title}</span>
                  {row.description && <span className="text-sm text-600">{row.description}</span>}
                  <Divider className="my-2" />
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

const MessagePreview = ({ text }: { text?: string }) => {
  const safeText = typeof text === 'string' ? text : ''
  if (!safeText.trim()) {
    return <span className="text-sm text-600">Escribe el cuerpo del mensaje para visualizarlo aquí.</span>
  }

  return <p className="text-base text-900 whitespace-pre-line">{safeText}</p>
}

export default function InteractivePreview() {
  const { watch } = useFormContext<TemplateFormValues>()
  const templateText = watch("textTemplate")
  const safeTemplateText = typeof templateText === 'string' ? templateText : ''
  const interactive = watch("interactive") ?? defaultInteractiveValues

  // TEMP DEBUG LOGS - REMOVE AFTER FIXING
  console.log('DEBUG InteractivePreview: templateText raw:', templateText, typeof templateText)
  console.log('DEBUG InteractivePreview: interactive raw:', interactive, typeof interactive)
  console.log('DEBUG InteractivePreview: listSections:', interactive?.listSections, typeof interactive?.listSections)

  const sectionsWithRows = useMemo(
    () => (interactive.listSections ?? []).filter((section) => section.rows.length > 0),
    [interactive.listSections],
  )

  return (
    <Card className="mt-3" title="Previsualización">
      <div className="flex flex-column gap-3">
        <span className="text-sm text-600">Vista previa del mensaje que verán tus usuarios en WhatsApp.</span>

        <Card className="bg-gray-100 border-round-2xl p-4">
          <div className="flex flex-column gap-3">
            <MessagePreview text={safeTemplateText} />

            <Divider type="dashed" align="left">
              <span className="text-xs text-700 uppercase tracking-wider">
                {interactiveTypeLabels[interactive.type]}
              </span>
            </Divider>

            {interactive.type === "none" && (
              <span className="text-sm text-600">Esta plantilla no incluye elementos interactivos.</span>
            )}

            {interactive.type === "quick_reply" && (
              <QuickReplyPreview buttons={interactive.quickReplies ?? []} />
            )}

            {interactive.type === "cta" && (
              <CtaButtonsPreview buttons={interactive.ctaButtons ?? []} />
            )}

            {interactive.type === "list" && (
              <ListPreview button={interactive.listButton} sections={sectionsWithRows} />
            )}
          </div>
        </Card>
      </div>
    </Card>
  )
}
