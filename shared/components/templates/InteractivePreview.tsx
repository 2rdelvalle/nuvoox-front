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
  if (!buttons.length) {
    return <span className="text-sm text-600">Agrega botones quick reply para previsualizarlos.</span>
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {buttons.map((button) => (
        <Chip key={button.id} label={button.title} className="py-2 px-3 bg-blue-50 border-round" />
      ))}
    </div>
  )
}

const CtaButtonsPreview = ({ buttons }: { buttons: TemplateInteractiveFormValues["ctaButtons"] }) => {
  if (!buttons.length) {
    return <span className="text-sm text-600">Agrega botones CTA para ver la previsualización.</span>
  }

  return (
    <div className="flex flex-column gap-2">
      {buttons.map((button, index) => (
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
  if (!sections.length) {
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
        {sections.map((section, sectionIndex) => (
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
  if (!text) {
    return <span className="text-sm text-600">Escribe el cuerpo del mensaje para visualizarlo aquí.</span>
  }

  return <p className="text-base text-900 whitespace-pre-line">{text}</p>
}

export default function InteractivePreview() {
  const { watch } = useFormContext<TemplateFormValues>()
  const templateText = watch("textTemplate") || ""
  const interactive = watch("interactive") ?? defaultInteractiveValues

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
            <MessagePreview text={templateText} />

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
